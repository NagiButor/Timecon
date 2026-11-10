use js_sys::{Array, Reflect};
use serde::Deserialize;
use wasm_bindgen::{JsCast, JsValue, closure::Closure};
use wasm_bindgen_futures::{JsFuture, future_to_promise};
use web_sys::{Cache, ExtendableEvent, FetchEvent, Response, ServiceWorkerGlobalScope};

#[derive(Deserialize)]
struct Manifest {
    version: String,
    assets: Vec<String>,
}
fn scope() -> ServiceWorkerGlobalScope {
    js_sys::global().unchecked_into()
}
async fn manifest() -> Result<Manifest, JsValue> {
    // Embedded by xtask: a waiting worker must also be able to activate offline.
    let text = Reflect::get(&js_sys::global(), &JsValue::from_str("TIMECON_ASSETS"))?
        .as_string()
        .unwrap_or_default();
    serde_json::from_str(&text).map_err(|e| JsValue::from_str(&e.to_string()))
}
pub fn start() -> Result<(), JsValue> {
    let install = Closure::<dyn FnMut(ExtendableEvent)>::new(|event: ExtendableEvent| {
        let p = future_to_promise(async {
            let manifest = manifest().await?;
            let cache = JsFuture::from(
                scope()
                    .caches()?
                    .open(&format!("timecon-{}", manifest.version)),
            )
            .await?
            .dyn_into::<Cache>()?;
            let files = Array::new();
            for file in manifest.assets {
                files.push(&JsValue::from_str(&file));
            }
            JsFuture::from(cache.add_all_with_str_sequence(&files)).await?;
            JsFuture::from(scope().skip_waiting()?).await?;
            Ok(JsValue::UNDEFINED)
        });
        let _ = event.wait_until(&p);
    });
    scope().add_event_listener_with_callback("install", install.as_ref().unchecked_ref())?;
    install.forget();
    let activate = Closure::<dyn FnMut(ExtendableEvent)>::new(|event: ExtendableEvent| {
        let p = future_to_promise(async {
            let manifest = manifest().await?;
            let current = format!("timecon-{}", manifest.version);
            let caches = scope().caches()?;
            let keys = Array::from(&JsFuture::from(caches.keys()).await?);
            for key in keys {
                if let Some(key) = key.as_string()
                    && key.starts_with("timecon-")
                    && key != current
                {
                    JsFuture::from(caches.delete(&key)).await?;
                }
            }
            JsFuture::from(scope().clients().claim()).await?;
            Ok(JsValue::UNDEFINED)
        });
        let _ = event.wait_until(&p);
    });
    scope().add_event_listener_with_callback("activate", activate.as_ref().unchecked_ref())?;
    activate.forget();
    let fetch = Closure::<dyn FnMut(FetchEvent)>::new(|event: FetchEvent| {
        let request = event.request();
        if request.method() != "GET" {
            return;
        }
        let Ok(url) = web_sys::Url::new(&request.url()) else {
            return;
        };
        let origin = Reflect::get(&scope(), &JsValue::from_str("location"))
            .ok()
            .and_then(|l| Reflect::get(&l, &JsValue::from_str("origin")).ok())
            .and_then(|v| v.as_string())
            .unwrap_or_default();
        if url.origin() != origin {
            return;
        }
        let p = future_to_promise(async move {
            // Cache-first immutable application bundle: never combine a new wasm binary with old glue.
            let cached = JsFuture::from(scope().caches()?.match_with_request(&request)).await?;
            if !cached.is_undefined() {
                return Ok(cached);
            }
            let response = JsFuture::from(scope().fetch_with_request(&request)).await?;
            let r = response.clone().dyn_into::<Response>()?;
            if !r.ok() {
                return Ok(response);
            }
            Ok(response)
        });
        let _ = event.respond_with(&p);
    });
    scope().add_event_listener_with_callback("fetch", fetch.as_ref().unchecked_ref())?;
    fetch.forget();
    Ok(())
}
