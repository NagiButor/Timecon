pub mod model;
pub mod syntax;
pub mod view;

#[cfg(target_arch = "wasm32")]
mod browser;
#[cfg(target_arch = "wasm32")]
mod cloud;
#[cfg(target_arch = "wasm32")]
mod worker;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen(start)]
pub fn start() -> Result<(), wasm_bindgen::JsValue> {
    console_error_panic_hook::set_once();
    if web_sys::window().is_some() {
        browser::start()
    } else {
        worker::start()
    }
}
