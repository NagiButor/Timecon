use crate::{browser as b, model::State, view::SyncView};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::cell::RefCell;
use wasm_bindgen::{JsCast, JsValue, closure::Closure};
use wasm_bindgen_futures::{JsFuture, spawn_local};
use web_sys::{MessageEvent, RequestInit, Response, WebSocket};

const URL: &str = match option_env!("TIMECON_SUPABASE_URL") {
    Some(v) => v,
    None => "https://gpzujtfvlxzwiiwyvllj.supabase.co",
};
const KEY: &str = match option_env!("TIMECON_SUPABASE_KEY") {
    Some(v) => v,
    None => "sb_publishable_N4HVLgEUY0jeckEd-USlQw_Nht_s13Y",
};
const SESSION: &str = "timecon.auth";
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default)]
struct User {
    id: String,
    email: String,
}
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default)]
struct Session {
    access_token: String,
    refresh_token: String,
    expires_at: i64,
    expires_in: i64,
    user: User,
}
#[derive(Default)]
struct Cloud {
    session: Option<Session>,
    view: SyncView,
    dirty: bool,
    syncing: bool,
    pending: bool,
    timer: Option<gloo_timers::callback::Timeout>,
    socket: Option<WebSocket>,
    socket_token: String,
    heartbeat: Option<gloo_timers::callback::Interval>,
    reference: u64,
}
thread_local! {static CLOUD:RefCell<Cloud>=RefCell::new(Cloud::default());}
pub fn view() -> SyncView {
    CLOUD.with(|c| c.borrow().view.clone())
}
pub fn set_dirty(value: bool) {
    CLOUD.with(|c| c.borrow_mut().dirty = value);
    let _ = b::storage_set("timecon.dirty", if value { "1" } else { "0" });
}
fn error(value: JsValue) -> String {
    value.as_string().unwrap_or_else(|| format!("{value:?}"))
}
fn msg(text: String) {
    CLOUD.with(|c| c.borrow_mut().view.message = text);
    b::render(true);
}
fn busy(value: bool) {
    CLOUD.with(|c| c.borrow_mut().view.busy = value);
    b::render(true);
}
fn token() -> Option<String> {
    CLOUD.with(|c| c.borrow().session.as_ref().map(|s| s.access_token.clone()))
}
pub fn schedule() {
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        if c.session.is_some() {
            c.timer = Some(gloo_timers::callback::Timeout::new(800, sync));
        }
    });
}
async fn request(
    method: &str,
    path: &str,
    body: Option<Value>,
    bearer: Option<&str>,
) -> Result<Value, String> {
    let opts = RequestInit::new();
    opts.set_method(method);
    let headers = web_sys::Headers::new().map_err(error)?;
    headers.set("apikey", KEY).map_err(error)?;
    headers
        .set("Content-Type", "application/json")
        .map_err(error)?;
    if let Some(t) = bearer {
        headers
            .set("Authorization", &format!("Bearer {t}"))
            .map_err(error)?;
    }
    if path.starts_with("/rest/") {
        headers
            .set("Prefer", "resolution=merge-duplicates,return=minimal")
            .map_err(error)?;
    }
    opts.set_headers(&headers);
    if let Some(body) = body {
        opts.set_body(&JsValue::from_str(&body.to_string()));
    }
    let response =
        JsFuture::from(b::window().fetch_with_str_and_init(&format!("{URL}{path}"), &opts))
            .await
            .map_err(error)?
            .dyn_into::<Response>()
            .map_err(error)?;
    let status = response.status();
    let text = JsFuture::from(response.text().map_err(error)?)
        .await
        .map_err(error)?
        .as_string()
        .unwrap_or_default();
    let value = if text.is_empty() {
        Value::Null
    } else {
        serde_json::from_str(&text).unwrap_or_else(|_| json!({"message":text}))
    };
    if !(200..300).contains(&status) {
        return Err(value["msg"]
            .as_str()
            .or(value["message"].as_str())
            .or(value["error_description"].as_str())
            .or(value["error"].as_str())
            .map(str::to_string)
            .unwrap_or_else(|| format!("HTTP {status}")));
    }
    Ok(value)
}
fn store_session(mut session: Session) {
    if session.expires_at == 0 {
        session.expires_at = b::now() / 1000 + session.expires_in.max(3600);
    }
    let _ = b::storage_set(SESSION, &serde_json::to_string(&session).unwrap());
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        c.view.email = session.user.email.clone();
        c.session = Some(session);
    });
}
fn accept(value: Value) -> Result<(), String> {
    let s: Session = serde_json::from_value(value).map_err(|e| e.to_string())?;
    if s.access_token.is_empty() {
        return Err("sync_check_email".into());
    }
    store_session(s);
    Ok(())
}
async fn ensure_session() -> Result<Session, String> {
    let session = CLOUD
        .with(|c| c.borrow().session.clone())
        .ok_or("Not signed in")?;
    if session.expires_at > b::now() / 1000 + 60 {
        return Ok(session);
    }
    let result = request(
        "POST",
        "/auth/v1/token?grant_type=refresh_token",
        Some(json!({"refresh_token":session.refresh_token})),
        None,
    )
    .await?;
    if token().as_deref() != Some(&session.access_token) {
        return Err("Session changed during refresh".into());
    }
    accept(result)?;
    CLOUD
        .with(|c| c.borrow().session.clone())
        .ok_or_else(|| "Session expired".into())
}
fn meta(updated: i64) {
    CLOUD.with(|c| c.borrow_mut().view.updated = updated);
    let _ = b::storage_set("timecon.sync", &json!({"updated":updated}).to_string());
}
async fn upload(session: &Session) -> Result<(), String> {
    let (state, version) = b::with_app(|a| (a.state.clone(), a.version));
    let at = b::now();
    request(
        "POST",
        "/rest/v1/timecon_state?on_conflict=user_id",
        Some(json!({"user_id":session.user.id,"data":state,"updated_at":at})),
        Some(&session.access_token),
    )
    .await?;
    if token().as_deref() != Some(&session.access_token) {
        return Ok(());
    }
    meta(at);
    if b::with_app(|a| a.version == version) {
        set_dirty(false)
    }
    Ok(())
}
async fn cycle() -> Result<(), String> {
    let session = ensure_session().await?;
    watch();
    let rows = request(
        "GET",
        &format!(
            "/rest/v1/timecon_state?select=data,updated_at&user_id=eq.{}",
            session.user.id
        ),
        None,
        Some(&session.access_token),
    )
    .await?;
    if token().as_deref() != Some(&session.access_token) {
        return Ok(());
    }
    let (updated, dirty) = CLOUD.with(|c| {
        let c = c.borrow();
        (c.view.updated, c.dirty)
    });
    if let Some(row) = rows.as_array().and_then(|v| v.first()) {
        let remote_ts = row["updated_at"]
            .as_i64()
            .or_else(|| row["updated_at"].as_str().and_then(|v| v.parse().ok()))
            .unwrap_or(0);
        if remote_ts != updated {
            let remote = State::from_json(&row["data"].to_string())?;
            b::with_app(|a| {
                a.state = if dirty {
                    a.state.merge(&remote)
                } else {
                    remote
                };
            });
            b::save();
            meta(remote_ts);
            if dirty {
                upload(&session).await?
            }
            b::render(true);
        } else if dirty {
            upload(&session).await?
        }
    } else {
        upload(&session).await?
    }
    CLOUD.with(|c| c.borrow_mut().view.message.clear());
    b::render(true);
    Ok(())
}
pub fn sync() {
    let start = CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        if c.session.is_none() {
            return false;
        }
        if c.syncing {
            c.pending = true;
            return false;
        }
        c.syncing = true;
        true
    });
    if !start {
        return;
    }
    spawn_local(async {
        if let Err(e) = cycle().await {
            msg(e)
        }
        let pending = CLOUD.with(|c| {
            let mut c = c.borrow_mut();
            c.syncing = false;
            let p = c.pending;
            c.pending = false;
            p
        });
        if pending {
            sync()
        }
    });
}
fn stop() {
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        if let Some(ws) = c.socket.take() {
            ws.set_onmessage(None);
            ws.set_onopen(None);
            let _ = ws.close();
        }
        c.heartbeat = None;
        c.socket_token.clear();
    });
}
fn send(event: &str, payload: Value, topic: &str) {
    CLOUD.with(|c|{let mut c=c.borrow_mut();c.reference+=1;if let Some(ws)=&c.socket{let _=ws.send_with_str(&json!({"topic":topic,"event":event,"payload":payload,"ref":c.reference.to_string()}).to_string());}});
}
fn watch() {
    let Some(session) = CLOUD.with(|c| c.borrow().session.clone()) else {
        return;
    };
    let needed = CLOUD.with(|c| {
        let c = c.borrow();
        c.socket.as_ref().is_none_or(|ws| ws.ready_state() > 1)
            || c.socket_token != session.access_token
    });
    if !needed {
        return;
    }
    stop();
    let ws_url = format!(
        "{}/realtime/v1/websocket?apikey={}&vsn=1.0.0",
        URL.replacen("https://", "wss://", 1)
            .replacen("http://", "ws://", 1),
        KEY
    );
    let Ok(ws) = WebSocket::new(&ws_url) else {
        return;
    };
    let topic = format!("realtime:timecon-{}", session.user.id);
    let open = Closure::<dyn FnMut(web_sys::Event)>::new(move |_| {
        send(
            "phx_join",
            json!({"config":{"broadcast":{"ack":false,"self":false},"presence":{"key":""},"postgres_changes":[{"event":"*","schema":"public","table":"timecon_state","filter":format!("user_id=eq.{}",session.user.id)}],"private":false},"access_token":session.access_token}),
            &topic,
        );
    });
    ws.set_onopen(Some(open.as_ref().unchecked_ref()));
    open.forget();
    let message = Closure::<dyn FnMut(MessageEvent)>::new(move |e: MessageEvent| {
        if let Some(text) = e.data().as_string()
            && let Ok(v) = serde_json::from_str::<Value>(&text)
            && v["event"] == "postgres_changes"
        {
            sync();
        }
    });
    ws.set_onmessage(Some(message.as_ref().unchecked_ref()));
    message.forget();
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        c.socket = Some(ws);
        c.socket_token = c
            .session
            .as_ref()
            .map(|s| s.access_token.clone())
            .unwrap_or_default();
        c.heartbeat = Some(gloo_timers::callback::Interval::new(25000, || {
            send("heartbeat", json!({}), "phoenix")
        }));
    });
}
pub fn auth(up: bool, email: String, password: String) {
    busy(true);
    spawn_local(async move {
        // A new account must not receive a previous account's state automatically.
        let path = if up {
            "/auth/v1/signup"
        } else {
            "/auth/v1/token?grant_type=password"
        };
        let result = request(
            "POST",
            path,
            Some(json!({"email":email,"password":password})),
            None,
        )
        .await
        .and_then(accept);
        match result {
            Ok(()) => {
                meta(0);
                set_dirty(false);
                CLOUD.with(|c| c.borrow_mut().view.message.clear());
                sync();
            }
            Err(e) => msg(e),
        }
        busy(false);
    });
}
pub fn toggle_forgot() {
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        c.view.forgot = !c.view.forgot;
        c.view.forgot_sent = false;
    });
}
fn redirect() -> String {
    let location = b::window().location();
    format!(
        "{}{}",
        location.origin().unwrap_or_default(),
        location.pathname().unwrap_or_else(|_| "/".into())
    )
}
pub fn forgot(email: String) {
    busy(true);
    spawn_local(async move {
        let encoded = js_sys::encode_uri_component(&redirect())
            .as_string()
            .unwrap_or_default();
        match request(
            "POST",
            &format!("/auth/v1/recover?redirect_to={encoded}"),
            Some(json!({"email":email})),
            None,
        )
        .await
        {
            Ok(_) => CLOUD.with(|c| c.borrow_mut().view.forgot_sent = true),
            Err(e) => msg(e),
        }
        busy(false);
    });
}
pub fn password(first: String, second: String) {
    if first != second {
        msg("sync_password_mismatch".into());
        return;
    }
    busy(true);
    spawn_local(async move {
        match ensure_session().await {
            Ok(s) => match request(
                "PUT",
                "/auth/v1/user",
                Some(json!({"password":first})),
                Some(&s.access_token),
            )
            .await
            {
                Ok(_) => {
                    CLOUD.with(|c| c.borrow_mut().view.recovery = false);
                    msg("sync_password_updated".into());
                    sync();
                }
                Err(e) => msg(e),
            },
            Err(e) => msg(e),
        }
        busy(false);
    });
}
pub fn google() {
    // Supabase implicit OAuth supports static Pages deployments with no JS SDK.
    let encoded = js_sys::encode_uri_component(&redirect())
        .as_string()
        .unwrap_or_default();
    let _ = b::window().location().set_href(&format!(
        "{URL}/auth/v1/authorize?provider=google&redirect_to={encoded}"
    ));
}
pub fn logout() {
    let old = token();
    stop();
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        c.session = None;
        c.view = SyncView::default();
    });
    b::storage_remove(SESSION);
    b::storage_remove("sb-gpzujtfvlxzwiiwyvllj-auth-token");
    b::storage_remove("timecon.owner");
    meta(0);
    set_dirty(true);
    b::render(true);
    if let Some(token) = old {
        spawn_local(async move {
            let _ = request("POST", "/auth/v1/logout", None, Some(&token)).await;
        });
    }
}
pub fn init() {
    let session = b::storage_get(SESSION)
        .or_else(|| b::storage_get("sb-gpzujtfvlxzwiiwyvllj-auth-token"))
        .and_then(|v| serde_json::from_str::<Session>(&v).ok())
        .filter(|s| !s.access_token.is_empty());
    let updated = b::storage_get("timecon.sync")
        .and_then(|v| serde_json::from_str::<Value>(&v).ok())
        .and_then(|v| v["updated"].as_i64())
        .unwrap_or(0);
    CLOUD.with(|c| {
        let mut c = c.borrow_mut();
        c.view.updated = updated;
        c.dirty = b::storage_get("timecon.dirty").as_deref() == Some("1")
            || b::storage_get("timecon.sync").is_none();
    });
    if let Some(session) = session {
        store_session(session)
    }
    spawn_local(async {
        let location = b::window().location();
        let hash = location.hash().unwrap_or_default();
        let params = web_sys::UrlSearchParams::new_with_str(hash.trim_start_matches('#')).ok();
        if let Some(params) = params.filter(|p| p.has("access_token")) {
            let access = params.get("access_token").unwrap_or_default();
            let refresh = params.get("refresh_token").unwrap_or_default();
            let recovery = params.get("type").as_deref() == Some("recovery");
            match request("GET", "/auth/v1/user", None, Some(&access)).await {
                Ok(user) => {
                    let session = Session {
                        access_token: access,
                        refresh_token: refresh,
                        expires_at: b::now() / 1000
                            + params
                                .get("expires_in")
                                .and_then(|v| v.parse::<i64>().ok())
                                .unwrap_or(3600),
                        user: serde_json::from_value(user).unwrap_or_default(),
                        ..Default::default()
                    };
                    store_session(session);
                    CLOUD.with(|c| c.borrow_mut().view.recovery = recovery);
                    b::with_app(|a| {
                        if recovery {
                            a.ui.view = "settings".into()
                        }
                    });
                    meta(0);
                    set_dirty(false);
                }
                Err(e) => msg(e),
            }
            let _ = b::window()
                .history()
                .and_then(|h| h.replace_state_with_url(&JsValue::NULL, "", Some(&redirect())));
        }
        let params =
            web_sys::UrlSearchParams::new_with_str(&location.search().unwrap_or_default()).ok();
        if let Some(code) = params.and_then(|p| p.get("code")) {
            if let Some(verifier) =
                b::storage_get("sb-gpzujtfvlxzwiiwyvllj-auth-token-code-verifier")
            {
                let verifier = verifier
                    .trim_matches('"')
                    .split('/')
                    .next()
                    .unwrap_or("")
                    .to_string();
                match request(
                    "POST",
                    "/auth/v1/token?grant_type=pkce",
                    Some(json!({"auth_code":code,"code_verifier":verifier})),
                    None,
                )
                .await
                .and_then(accept)
                {
                    Ok(()) => {}
                    Err(e) => msg(e),
                }
                let _ = b::window()
                    .history()
                    .and_then(|h| h.replace_state_with_url(&JsValue::NULL, "", Some(&redirect())));
            } else {
                msg("sync_link_expired".into());
            }
        }
        b::render(true);
        sync();
    });
}
