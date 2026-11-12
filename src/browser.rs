use crate::{
    cloud,
    model::*,
    syntax,
    view::{self, Ui},
};
use chrono::Datelike;
use js_sys::{Array, Date, Promise};
use std::cell::RefCell;
use wasm_bindgen::{JsCast, JsValue, closure::Closure};
use wasm_bindgen_futures::{JsFuture, spawn_local};
use web_sys::*;

pub struct App {
    pub state: State,
    pub ui: Ui,
    pub version: u64,
}
thread_local! {
    static APP: RefCell<Option<App>> = const { RefCell::new(None) };
    static AUDIO: RefCell<Option<AudioContext>> = const { RefCell::new(None) };
    static SHEET_FOCUS: RefCell<Option<HtmlElement>> = const { RefCell::new(None) };
    static SHEET_SCROLL: RefCell<f64> = const { RefCell::new(0.0) };
    static RENDERED: RefCell<String> = const { RefCell::new(String::new()) };
}
pub fn window() -> Window {
    web_sys::window().unwrap()
}
pub fn document() -> Document {
    window().document().unwrap()
}
pub fn now() -> i64 {
    Date::now() as i64
}
pub fn today() -> String {
    let d = Date::new_0();
    format!(
        "{:04}-{:02}-{:02}",
        d.get_full_year(),
        d.get_month() + 1,
        d.get_date()
    )
}
pub fn uid() -> String {
    format!(
        "{:x}-{:x}",
        now(),
        (js_sys::Math::random() * u32::MAX as f64) as u32
    )
}
pub fn storage_get(key: &str) -> Option<String> {
    window()
        .local_storage()
        .ok()
        .flatten()
        .and_then(|s| s.get_item(key).ok().flatten())
}
pub fn storage_set(key: &str, value: &str) -> Result<(), JsValue> {
    window()
        .local_storage()?
        .ok_or_else(|| JsValue::from_str("Browser storage is unavailable"))?
        .set_item(key, value)
}
pub fn storage_remove(key: &str) {
    if let Ok(Some(s)) = window().local_storage() {
        let _ = s.remove_item(key);
    }
}
pub fn select(selector: &str) -> Option<Element> {
    document().query_selector(selector).ok().flatten()
}
fn all(selector: &str) -> Vec<Element> {
    let Ok(nodes) = document().query_selector_all(selector) else {
        return vec![];
    };
    (0..nodes.length())
        .filter_map(|i| nodes.item(i)?.dyn_into().ok())
        .collect()
}
pub fn with_app<R>(f: impl FnOnce(&mut App) -> R) -> R {
    APP.with(|a| f(a.borrow_mut().as_mut().unwrap()))
}
pub fn message(text: &str) {
    let _ = window().alert_with_message(text);
}
fn t(key: &str) -> String {
    with_app(|a| view::tr(&a.state.lang, key))
}
pub fn save() {
    let text = with_app(|a| serde_json::to_string(&a.state).unwrap());
    if storage_set(STORAGE_KEY, &text).is_err() {
        message(&t("storage_full"));
    }
}
pub fn persist() {
    with_app(|a| a.version += 1);
    cloud::set_dirty(true);
    save();
    render(false);
    cloud::schedule();
}
fn touch() {
    with_app(|a| a.version += 1);
    cloud::set_dirty(true);
    save();
    cloud::schedule();
}
fn data(e: &Element, key: &str) -> String {
    e.get_attribute(&format!("data-{key}")).unwrap_or_default()
}
fn value(e: &Element) -> String {
    if let Some(v) = e.dyn_ref::<HtmlInputElement>() {
        v.value()
    } else if let Some(v) = e.dyn_ref::<HtmlTextAreaElement>() {
        v.value()
    } else if let Some(v) = e.dyn_ref::<HtmlSelectElement>() {
        v.value()
    } else {
        String::new()
    }
}
fn listen(
    target: &EventTarget,
    event: &str,
    handler: impl Fn(Event) + 'static,
) -> Result<(), JsValue> {
    // Programmatic anchor/file-input clicks may synchronously re-enter this listener.
    let c = Closure::<dyn Fn(Event)>::new(handler);
    target.add_event_listener_with_callback(event, c.as_ref().unchecked_ref())?;
    c.forget();
    Ok(())
}

struct Field {
    key: String,
    value: String,
    checked: bool,
    focused: bool,
    selection: Option<(u32, u32)>,
}
fn field_key(e: &Element, i: usize) -> String {
    format!(
        "{}|{}|{}|{}|{}",
        e.closest("form")
            .ok()
            .flatten()
            .map(|f| data(&f, "form"))
            .unwrap_or_default(),
        e.get_attribute("name").unwrap_or_default(),
        e.id(),
        data(e, "block"),
        if e.has_attribute("data-note-title") {
            String::from("title")
        } else {
            format!("{}:{}:{i}", data(e, "change"), data(e, "id"))
        }
    )
}
pub fn render(preserve: bool) {
    let added = with_app(|a| {
        let current = today();
        let mut added = a.state.ensure_day(&current);
        added |= a.state.ensure_day(&a.ui.day);
        added
    });
    if added {
        touch();
    }
    let same = with_app(|a| RENDERED.with(|r| *r.borrow() == a.ui.view));
    let active = document().active_element();
    let fields: Vec<_> = if same && preserve {
        all("#main input, #main textarea, #main select")
            .iter()
            .enumerate()
            .map(|(i, e)| {
                let input = e.dyn_ref::<HtmlInputElement>();
                let ta = e.dyn_ref::<HtmlTextAreaElement>();
                let selection = if let Some(ta) = ta {
                    ta.selection_start()
                        .ok()
                        .flatten()
                        .zip(ta.selection_end().ok().flatten())
                } else {
                    input.and_then(|v| {
                        v.selection_start()
                            .ok()
                            .flatten()
                            .zip(v.selection_end().ok().flatten())
                    })
                };
                Field {
                    key: field_key(e, i),
                    value: value(e),
                    checked: input.is_some_and(|v| v.checked()),
                    focused: active.as_ref() == Some(e),
                    selection,
                }
            })
            .collect()
    } else {
        vec![]
    };
    let disclosures: Vec<_> = all("#main details[open]")
        .iter()
        .map(|e| data(e, "disclosure"))
        .collect();
    let focus_action = active
        .as_ref()
        .and_then(|e| e.closest("#main [data-act]").ok().flatten())
        .map(|e| {
            (
                data(&e, "act"),
                data(&e, "id"),
                data(&e, "n"),
                data(&e, "wd"),
            )
        });
    let scroll = if same {
        window().scroll_y().unwrap_or(0.0)
    } else {
        0.0
    };
    let sync = cloud::view();
    let (main, nav, warn, lang, theme, index, view_name) = with_app(|a| {
        let index = ["tasks", "notes", "stats", "finance", "settings"]
            .iter()
            .position(|v| *v == a.ui.view)
            .unwrap_or(0);
        (
            view::main(&a.state, &a.ui, now(), &sync),
            view::nav(&a.state, &a.ui),
            view::warn(&a.state, &sync),
            a.state.lang.clone(),
            a.state.theme.clone(),
            index,
            a.ui.view.clone(),
        )
    });
    if let Some(root) = document().document_element() {
        let _ = root.set_attribute("lang", &lang);
        let _ = root.set_attribute("data-theme", &theme);
    }
    if let Some(el) = select("#main") {
        el.set_inner_html(&main);
    }
    if let Some(el) = select("#nav") {
        el.set_inner_html(&nav);
        let _ = el.set_attribute("style", &format!("--tab:{index}"));
    }
    if let Some(el) = select("#warn") {
        el.set_inner_html(&warn);
        let _ = el.set_attribute("style", if warn.is_empty() { "display:none" } else { "" });
    }
    if same {
        for e in all("#main details[data-disclosure]") {
            if disclosures.contains(&data(&e, "disclosure")) {
                let _ = e.set_attribute("open", "");
            }
        }
        for (i, e) in all("#main input, #main textarea, #main select")
            .iter()
            .enumerate()
        {
            if let Some(f) = fields.iter().find(|f| f.key == field_key(e, i)) {
                if let Some(v) = e.dyn_ref::<HtmlInputElement>() {
                    if v.type_() != "file" {
                        v.set_value(&f.value);
                    }
                    if ["checkbox", "radio"].contains(&v.type_().as_str()) {
                        v.set_checked(f.checked);
                    }
                }
                if let Some(v) = e.dyn_ref::<HtmlTextAreaElement>() {
                    v.set_value(&f.value);
                }
                if let Some(v) = e.dyn_ref::<HtmlSelectElement>() {
                    v.set_value(&f.value);
                }
                if f.focused {
                    if let Some(v) = e.dyn_ref::<HtmlElement>() {
                        let _ = v.focus();
                    }
                    if let Some((s, end)) = f.selection {
                        if let Some(v) = e.dyn_ref::<HtmlTextAreaElement>() {
                            let _ = v.set_selection_range(s, end);
                        }
                        if let Some(v) = e.dyn_ref::<HtmlInputElement>() {
                            let _ = v.set_selection_range(s, end);
                        }
                    }
                }
            }
        }
        if fields.iter().all(|f| !f.focused)
            && let Some(key) = focus_action
            && let Some(e) = all("#main [data-act]")
                .into_iter()
                .find(|e| (data(e, "act"), data(e, "id"), data(e, "n"), data(e, "wd")) == key)
            && let Some(e) = e.dyn_ref::<HtmlElement>()
        {
            let _ = e.focus();
        }
    }
    RENDERED.with(|r| *r.borrow_mut() = view_name);
    window().scroll_to_with_x_and_y(0.0, scroll);
}
fn open_sheet(kind: &str) {
    let content = with_app(|a| view::sheet(&a.state, &a.ui, kind));
    SHEET_FOCUS
        .with(|f| *f.borrow_mut() = document().active_element().and_then(|e| e.dyn_into().ok()));
    SHEET_SCROLL.with(|s| *s.borrow_mut() = window().scroll_y().unwrap_or(0.0));
    if let Some(dialog) = select("#entrySheet").and_then(|e| e.dyn_into::<HtmlDialogElement>().ok())
    {
        dialog.set_inner_html(&content);
        if let Some(body) = document().body() {
            let _ = body.set_attribute("class", "sheet-open");
            let _ = body.set_attribute(
                "style",
                &format!("top:-{}px", SHEET_SCROLL.with(|s| *s.borrow())),
            );
        }
        let _ = dialog.show_modal();
        if let Ok(Some(input)) = dialog.query_selector("input")
            && let Some(el) = input.dyn_ref::<HtmlElement>()
        {
            let _ = el.focus();
        }
    }
}
fn close_sheet() {
    if let Some(d) = select("#entrySheet").and_then(|e| e.dyn_into::<HtmlDialogElement>().ok()) {
        d.close();
    }
}
fn confirm(key: &str) -> bool {
    window().confirm_with_message(&t(key)).unwrap_or(false)
}
fn unlock_audio() {
    AUDIO.with(|audio| {
        if audio.borrow().is_none() {
            *audio.borrow_mut() = AudioContext::new().ok();
        }
        if let Some(a) = audio.borrow().as_ref() {
            let _ = a.resume();
        }
    });
    if notifications_available() && Notification::permission() == NotificationPermission::Default {
        let _ = Notification::request_permission();
    }
}
fn alarm(title: &str) {
    AUDIO.with(|audio| {
        if let Some(ac) = audio.borrow().as_ref() {
            for delay in [0.0, 0.6, 1.2] {
                if let (Ok(o), Ok(g)) = (ac.create_oscillator(), ac.create_gain()) {
                    o.frequency().set_value(880.0);
                    let _ = o.connect_with_audio_node(&g);
                    let _ = g.connect_with_audio_node(&ac.destination());
                    let _ = g.gain().set_value_at_time(0.3, ac.current_time() + delay);
                    let _ = g
                        .gain()
                        .set_value_at_time(0.0, ac.current_time() + delay + 0.4);
                    let _ = o.start_with_when(ac.current_time() + delay);
                    let _ = o.stop_with_when(ac.current_time() + delay + 0.45);
                }
            }
        }
    });
    let pattern = Array::new();
    for n in [400, 200, 400, 200, 400] {
        pattern.push(&JsValue::from_f64(n as f64));
    }
    let navigator = window().navigator();
    if js_sys::Reflect::get(&navigator, &JsValue::from_str("vibrate"))
        .is_ok_and(|v| v.is_function())
    {
        let _ = navigator.vibrate_with_pattern(&pattern);
    }
    if notifications_available() && Notification::permission() == NotificationPermission::Granted {
        let opts = NotificationOptions::new();
        opts.set_body(&format!("{}: {title}", t("timer_done")));
        let _ = Notification::new_with_options("Timecon", &opts);
    }
}
fn notifications_available() -> bool {
    js_sys::Reflect::get(&window(), &JsValue::from_str("Notification"))
        .is_ok_and(|v| v.is_function())
}
fn click(e: Event) {
    let Some(target) = e.target().and_then(|t| t.dyn_into::<Element>().ok()) else {
        return;
    };
    let Some(b) = target.closest("[data-act]").ok().flatten() else {
        return;
    };
    let act = data(&b, "act");
    let id = data(&b, "id");
    let at = now();
    match act.as_str() {
        "openSheet" => {
            open_sheet(&data(&b, "sheet"));
            return;
        }
        "closeSheet" => {
            close_sheet();
            return;
        }
        "syncNow" => {
            cloud::sync();
            return;
        }
        "google" => {
            cloud::google();
            return;
        }
        "syncOut" => {
            cloud::logout();
            return;
        }
        "forgotShow" => {
            cloud::toggle_forgot();
            render(true);
            return;
        }
        "intro" => {
            intro_go(0);
            return;
        }
        "introSkip" => {
            intro_go(2);
            return;
        }
        "introNext" => {
            let i = with_app(|a| a.ui.intro.unwrap_or(0));
            intro_go(i + 1);
            return;
        }
        "introTap" => {
            let i = with_app(|a| a.ui.intro.unwrap_or(0));
            let x = e
                .dyn_ref::<MouseEvent>()
                .map(|e| e.client_x() as f64)
                .unwrap_or(999.0);
            let rect = b.get_bounding_client_rect();
            intro_go(if x - rect.left() < rect.width() * 0.3 {
                i.saturating_sub(1)
            } else {
                i + 1
            });
            return;
        }
        "export" | "exportCsv" => {
            let csv = act == "exportCsv";
            let text = with_app(|a| {
                if csv {
                    a.state.csv()
                } else {
                    serde_json::to_string_pretty(&a.state).unwrap()
                }
            });
            let ext = if csv { "csv" } else { "json" };
            download(
                &format!("timecon-{}.{ext}", today()),
                &text,
                if csv {
                    "text/csv;charset=utf-8"
                } else {
                    "application/json"
                },
            );
            return;
        }
        "notePickPhoto" => {
            if let Some(el) = select("#notePhoto").and_then(|e| e.dyn_into::<HtmlElement>().ok()) {
                el.click();
            }
            return;
        }
        "cancel" => {
            if !confirm("cancel_confirm") {
                return;
            }
        }
        "noteDel" => {
            if !confirm("note_confirm_del") {
                return;
            }
        }
        "clearPreset" => {
            if !confirm("preset_clear_confirm") {
                return;
            }
        }
        "applyPreset" => {
            if with_app(|a| a.state.days.get(&a.ui.day).is_some_and(|v| !v.is_empty()))
                && !confirm("preset_confirm")
            {
                return;
            }
        }
        "delCat" => {
            let used = with_app(|a| {
                if data(&b, "kind") == "cats" {
                    a.state
                        .days
                        .values()
                        .flatten()
                        .chain(a.state.backlog.iter())
                        .chain(a.state.presets.values().flatten())
                        .chain(a.state.daily.iter().map(|series| &series.task))
                        .any(|t| t.cat_id == id)
                } else {
                    a.state.fin.expenses.iter().any(|e| e.cat_id == id)
                }
            });
            if used && !confirm("cat_in_use") {
                return;
            }
        }
        "start" => unlock_audio(),
        _ => {}
    }
    let ui_only = with_app(|a| {
        let s = &mut a.state;
        let u = &mut a.ui;
        match act.as_str() {
            "tab" => {
                u.view = data(&b, "v");
                u.move_id.clear();
                u.time_id.clear();
                u.note_id.clear();
                return true;
            }
            "day" => {
                u.day = add_days(&u.day, data(&b, "n").parse().unwrap_or(0));
                u.move_id.clear();
                u.time_id.clear();
                return true;
            }
            "today" => {
                u.day = today();
                return true;
            }
            "month" => {
                u.month = shift_month(&u.month, data(&b, "n").parse().unwrap_or(0));
                return true;
            }
            "period" => {
                u.period = data(&b, "p");
                return true;
            }
            "taskMore" => {
                u.actions_id = if u.actions_id == id {
                    String::new()
                } else {
                    id.clone()
                };
                return true;
            }
            "focusTimer" => {
                u.focus_id = id.clone();
                return true;
            }
            "time" => {
                u.time_id = if u.time_id == id {
                    String::new()
                } else {
                    id.clone()
                };
                return true;
            }
            "move" => {
                u.move_id = if u.move_id == id {
                    String::new()
                } else {
                    id.clone()
                };
                return true;
            }
            "start" => {
                s.start_task(&id, at);
            }
            "cancel" => s.cancel_task(&id, at),
            "finishNow" => s.finish_now(&id, at),
            "stopRepeat" => {
                let from = add_days(std::cmp::max(u.day.as_str(), u.today.as_str()), 1);
                s.stop_daily_task(&id, &from, at);
            }
            "verdict" => {
                if let Some(t) = s.task_mut(&id).filter(|t| t.status == Status::Ask) {
                    t.status = if data(&b, "v") == "done" {
                        Status::Done
                    } else {
                        Status::Failed
                    };
                    t.updated_at = at;
                }
            }
            "restore" => {
                if let Some(t) = s.task_mut(&id) {
                    t.status = Status::Pending;
                    t.updated_at = at;
                }
            }
            "del" | "delBacklog" => s.delete_task(&id, at),
            "timeClear" => {
                if let Some(t) = s.task_mut(&id) {
                    t.start_at = None;
                    t.auto_done = false;
                    t.updated_at = at;
                }
                u.time_id.clear();
            }
            "up" | "down" => {
                if let Some(list) = s.days.get_mut(&u.day)
                    && let Some(i) = list.iter().position(|t| t.id == id)
                {
                    let j = i as i64 + if act == "up" { -1 } else { 1 };
                    if j >= 0 && (j as usize) < list.len() {
                        list.swap(i, j as usize);
                    }
                }
            }
            "fromBacklog" => {
                if let Some(i) = s.backlog.iter().position(|t| t.id == id) {
                    let mut task = s.backlog.remove(i);
                    task.updated_at = at;
                    task.auto_done = false;
                    s.add_task(&u.day, task);
                }
            }
            "savePreset" => {
                let wd = date(&u.day).weekday().num_days_from_sunday().to_string();
                s.deleted.remove(&format!("preset-{wd}"));
                let tasks = s
                    .days
                    .get(&u.day)
                    .into_iter()
                    .flatten()
                    .filter(|task| task.repeat_id.is_empty())
                    .cloned()
                    .collect();
                s.presets.insert(wd, tasks);
            }
            "applyPreset" => {
                let wd = data(&b, "wd");
                for mut task in s.presets.get(&wd).cloned().unwrap_or_default() {
                    task.id = uid();
                    task.repeat_id.clear();
                    task.status = Status::Pending;
                    task.started_at = None;
                    task.updated_at = at;
                    task.auto_done = false;
                    task.manual = false;
                    s.add_task(&u.day, task);
                }
            }
            "clearPreset" => {
                let wd = data(&b, "wd");
                s.presets.remove(&wd);
                s.deleted.insert(format!("preset-{wd}"), at);
            }
            "noteNew" => {
                let id = uid();
                s.notes.push(Note {
                    id: id.clone(),
                    icon: "note".into(),
                    updated_at: at,
                    blocks: vec![Block {
                        id: uid(),
                        kind: "text".into(),
                        ..Default::default()
                    }],
                    ..Default::default()
                });
                u.note_id = id;
                u.icon_pick = false;
            }
            "noteOpen" => {
                u.note_id = id.clone();
                u.icon_pick = false;
                return true;
            }
            "noteBack" => {
                u.note_id.clear();
                u.icon_pick = false;
                return true;
            }
            "noteIconPick" => {
                u.icon_pick = !u.icon_pick;
                return true;
            }
            "noteDel" => {
                s.notes.retain(|n| n.id != id);
                s.deleted.insert(id.clone(), at);
                if u.note_id == id {
                    u.note_id.clear();
                }
            }
            "noteIconSet" | "noteAdd" | "noteBlockDel" | "noteUp" | "noteDown" => {
                if let Some(n) = s.notes.iter_mut().find(|n| n.id == u.note_id) {
                    match act.as_str() {
                        "noteIconSet" => {
                            n.icon = data(&b, "icon");
                            u.icon_pick = false
                        }
                        "noteAdd" => n.blocks.push(Block {
                            id: uid(),
                            kind: data(&b, "type"),
                            ..Default::default()
                        }),
                        "noteBlockDel" => n.blocks.retain(|b| b.id != id),
                        _ => {
                            if let Some(i) = n.blocks.iter().position(|b| b.id == id) {
                                let j = i as i64 + if act == "noteUp" { -1 } else { 1 };
                                if j >= 0 && (j as usize) < n.blocks.len() {
                                    n.blocks.swap(i, j as usize);
                                }
                            }
                        }
                    }
                    n.updated_at = at;
                }
            }
            "delFin" => {
                if data(&b, "kind") == "income" {
                    s.fin.incomes.retain(|e| e.id != id)
                } else {
                    s.fin.expenses.retain(|e| e.id != id)
                }
                s.deleted.insert(id.clone(), at);
            }
            "delCat" => {
                if data(&b, "kind") == "cats" {
                    s.cats.retain(|c| c.id != id)
                } else {
                    s.fin.cats.retain(|c| c.id != id)
                }
                s.deleted.insert(id.clone(), at);
            }
            "payAdd" => {
                if let Some(day) = (1..=31).find(|d| !s.fin.pays.iter().any(|p| p.day == *d)) {
                    s.fin.pays.push(Pay {
                        id: uid(),
                        day,
                        amount: 0.0,
                    });
                }
            }
            "payDel" => {
                s.fin.pays.retain(|p| p.id != id);
                s.deleted.insert(id.clone(), at);
            }
            "warnLogin" => {
                u.view = "settings".into();
                u.note_id.clear();
                return true;
            }
            _ => return true,
        }
        false
    });
    if ui_only {
        render(true)
    } else {
        persist()
    }
    if act == "warnLogin"
        && let Some(el) = select("#syncSection")
    {
        el.scroll_into_view();
    }
}
fn fd(data: &FormData, key: &str) -> String {
    data.get(key).as_string().unwrap_or_default()
}
fn valid_time(time: &str) -> Option<String> {
    let (h, m) = time.split_once(':')?;
    if h.parse::<u32>().ok()? < 24 && m.parse::<u32>().ok()? < 60 {
        Some(time.into())
    } else {
        None
    }
}
fn submit(e: Event) {
    let Some(form) = e
        .target()
        .and_then(|e| e.dyn_into::<HtmlFormElement>().ok())
    else {
        return;
    };
    e.prevent_default();
    let Ok(f) = FormData::new_with_form(&form) else {
        return;
    };
    let kind = data(&form, "form");
    match kind.as_str() {
        "syncAuth" => {
            let up = e
                .dyn_ref::<SubmitEvent>()
                .and_then(|e| e.submitter())
                .is_some_and(|e| e.get_attribute("value").as_deref() == Some("up"));
            cloud::auth(up, fd(&f, "email").trim().into(), fd(&f, "password"));
            return;
        }
        "syncForgot" => {
            cloud::forgot(fd(&f, "email").trim().into());
            return;
        }
        "syncRecovery" => {
            cloud::password(fd(&f, "pw1"), fd(&f, "pw2"));
            return;
        }
        _ => {}
    }
    let changed = with_app(|a| {
        let s = &mut a.state;
        let u = &mut a.ui;
        let at = now();
        match kind.as_str() {
            "addTask" => {
                let title = fd(&f, "title").trim().to_string();
                if title.is_empty() {
                    return false;
                }
                let no_timer = fd(&f, "mode") != "timed";
                let task = Task {
                    id: uid(),
                    title,
                    minutes: if no_timer {
                        0
                    } else {
                        fd(&f, "minutes").parse::<u32>().unwrap_or(25).clamp(1, 600)
                    },
                    no_timer,
                    cat_id: fd(&f, "cat"),
                    start_at: if no_timer {
                        None
                    } else {
                        valid_time(&fd(&f, "startAt"))
                    },
                    updated_at: at,
                    ..Default::default()
                };
                if fd(&f, "repeatDaily") == "on" {
                    s.add_daily_task(&u.day, task);
                } else {
                    s.add_task(&u.day, task);
                }
            }
            "setTime" => {
                if let Some(t) = s.task_mut(&data(&form, "id")).filter(|t| !t.no_timer) {
                    t.start_at = valid_time(&fd(&f, "time"));
                    t.auto_done = false;
                    t.updated_at = at;
                }
                u.time_id.clear();
            }
            "move" => {
                let when = fd(&f, "when");
                let target = if when == "later" {
                    None
                } else if when == "date" {
                    let d = fd(&f, "date");
                    if chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").is_err() {
                        return false;
                    }
                    Some(d)
                } else {
                    Some(add_days(&today(), when.parse().unwrap_or(1)))
                };
                s.move_task(&data(&form, "id"), target.as_deref(), at);
                u.move_id.clear();
            }
            "addIncome" | "addExpense" => {
                let amount = fd(&f, "amount").parse::<f64>().unwrap_or(0.0);
                let d = fd(&f, "date");
                if !amount.is_finite()
                    || amount <= 0.0
                    || chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").is_err()
                {
                    return false;
                }
                let entry = Entry {
                    id: uid(),
                    date: d,
                    amount,
                    note: fd(&f, "note"),
                    cat_id: fd(&f, "catId"),
                    needed: fd(&f, "needed") == "on",
                };
                if kind == "addIncome" {
                    s.fin.incomes.push(entry)
                } else {
                    s.fin.expenses.push(entry)
                }
            }
            "addCat" | "addFinCat" => {
                let name = fd(&f, "name").trim().to_string();
                if name.is_empty() {
                    return false;
                }
                let cat = Category {
                    id: uid(),
                    name,
                    icon: fd(&f, "icon"),
                    color: view::safe_color(&fd(&f, "color")).into(),
                    ..Default::default()
                };
                if kind == "addCat" {
                    s.cats.push(cat)
                } else {
                    s.fin.cats.push(cat)
                }
            }
            "settings" => {
                s.lang = if fd(&f, "lang") == "en" { "en" } else { "ru" }.into();
                s.theme = if fd(&f, "theme") == "light" {
                    "light"
                } else {
                    "dark"
                }
                .into();
                s.currency = fd(&f, "currency");
            }
            _ => return false,
        }
        true
    });
    if changed {
        if ["addTask", "addIncome", "addExpense"].contains(&kind.as_str()) {
            form.reset();
            close_sheet();
            if let Some(el) = select("#actionStatus") {
                el.set_text_content(Some(&t(if kind == "addTask" {
                    "task_added"
                } else {
                    "entry_added"
                })));
            }
        }
        persist();
    }
}
fn input(e: Event) {
    let Some(el) = e.target().and_then(|e| e.dyn_into::<Element>().ok()) else {
        return;
    };
    let val = value(&el);
    let block = data(&el, "block");
    let lang = data(&el, "lang");
    let result = with_app(|a| {
        let n = a.state.notes.iter_mut().find(|n| n.id == a.ui.note_id)?;
        let mut code = None;
        if el.has_attribute("data-note-title") {
            n.title = val.clone();
        } else {
            let b = n
                .blocks
                .iter_mut()
                .find(|b| b.id == block || b.id == lang)?;
            if !block.is_empty() {
                b.text = val.clone()
            } else {
                b.lang = val.trim().into()
            }
            if b.kind == "code" {
                code = Some(b.clone());
            }
        }
        n.updated_at = now();
        Some((n.updated_at, code))
    });
    if let Some((ts, code)) = result {
        touch();
        if let Some(el) = select("#noteUpdated") {
            el.set_text_content(Some(&format!(
                "{}: {}",
                t("note_updated"),
                view::local_time(ts)
            )));
        }
        if let Some(b) = code {
            if let Some(el) = all("[data-code-view]")
                .into_iter()
                .find(|e| data(e, "code-view") == b.id)
            {
                el.set_inner_html(&syntax::highlight(
                    &b.text,
                    if b.lang.is_empty() {
                        syntax::detect(&b.text)
                    } else {
                        &b.lang
                    },
                ));
            }
            if let Some(el) = all("[data-lang-label]")
                .into_iter()
                .find(|e| data(e, "lang-label") == b.id)
            {
                el.set_text_content(Some(&format!(
                    "{}: {}",
                    t("note_lang"),
                    if b.lang.is_empty() {
                        syntax::detect(&b.text)
                    } else {
                        &b.lang
                    }
                )));
            }
        }
    }
}
fn change(e: Event) {
    let Some(el) = e.target().and_then(|e| e.dyn_into::<Element>().ok()) else {
        return;
    };
    let kind = data(&el, "change");
    match kind.as_str() {
        "taskMode" => {
            if let Some(fields) = el
                .closest("form")
                .ok()
                .flatten()
                .and_then(|form| form.query_selector("[data-timer-fields]").ok().flatten())
            {
                if value(&el) == "timed" {
                    let _ = fields.remove_attribute("hidden");
                    let _ = fields.remove_attribute("disabled");
                } else {
                    let _ = fields.set_attribute("hidden", "");
                    let _ = fields.set_attribute("disabled", "");
                }
            }
        }
        "sort" => {
            with_app(|a| a.ui.sort = value(&el));
            render(false)
        }
        "shift" => {
            with_app(|a| {
                a.state.fin.shift_weekend = el
                    .dyn_ref::<HtmlInputElement>()
                    .is_some_and(|i| i.checked())
            });
            touch()
        }
        "payDay" | "payAmount" => {
            with_app(|a| {
                if let Some(p) = a
                    .state
                    .fin
                    .pays
                    .iter_mut()
                    .find(|p| p.id == data(&el, "id"))
                {
                    if kind == "payDay" {
                        p.day = value(&el).parse::<u32>().unwrap_or(1).clamp(1, 31)
                    } else {
                        let v = value(&el).parse::<f64>().unwrap_or(0.0);
                        p.amount = if v.is_finite() { v.max(0.0) } else { 0.0 }
                    }
                }
            });
            touch()
        }
        "import" | "notePhoto" => {
            let Some(input) = el.dyn_ref::<HtmlInputElement>() else {
                return;
            };
            let Some(files) = input.files() else { return };
            let files: Vec<_> = (0..files.length()).filter_map(|i| files.item(i)).collect();
            input.set_value("");
            let note_id = with_app(|a| a.ui.note_id.clone());
            spawn_local(async move {
                if kind == "import" {
                    if let Some(file) = files.first() {
                        match JsFuture::from(file.text())
                            .await
                            .ok()
                            .and_then(|v| v.as_string())
                            .ok_or_else(|| "Could not read file".into())
                            .and_then(|v| State::from_json(&v))
                        {
                            Ok(state) => {
                                if confirm("import_json") {
                                    with_app(|a| {
                                        a.state = state;
                                        a.ui.note_id.clear()
                                    });
                                    persist();
                                }
                            }
                            Err(error) => message(&format!("Import error: {error}")),
                        }
                    }
                } else {
                    for file in files {
                        match photo(file).await {
                            Ok(src) => {
                                with_app(|a| {
                                    if let Some(n) =
                                        a.state.notes.iter_mut().find(|n| n.id == note_id)
                                    {
                                        n.blocks.push(Block {
                                            id: uid(),
                                            kind: "photo".into(),
                                            src,
                                            ..Default::default()
                                        });
                                        n.updated_at = now();
                                    }
                                });
                                persist()
                            }
                            Err(_) => message(&t("note_photo_fail")),
                        }
                    }
                }
            });
        }
        _ => {}
    }
}
async fn photo(file: File) -> Result<String, JsValue> {
    let url = Url::create_object_url_with_blob(&file)?;
    let image = HtmlImageElement::new()?;
    let load = Promise::new(&mut |resolve, reject| {
        let onload = Closure::once_into_js(move || {
            let _ = resolve.call0(&JsValue::NULL);
        });
        let onerror = Closure::once_into_js(move || {
            let _ = reject.call1(&JsValue::NULL, &JsValue::from_str("Image decode failed"));
        });
        image.set_onload(Some(onload.unchecked_ref()));
        image.set_onerror(Some(onerror.unchecked_ref()));
    });
    image.set_src(&url);
    let loaded = JsFuture::from(load).await;
    let _ = Url::revoke_object_url(&url);
    image.set_onload(None);
    image.set_onerror(None);
    loaded?;
    let scale = (1280.0 / f64::from(image.natural_width().max(image.natural_height()))).min(1.0);
    let canvas = document()
        .create_element("canvas")?
        .dyn_into::<HtmlCanvasElement>()?;
    canvas.set_width((f64::from(image.natural_width()) * scale).round().max(1.0) as u32);
    canvas.set_height((f64::from(image.natural_height()) * scale).round().max(1.0) as u32);
    let context = canvas
        .get_context("2d")?
        .ok_or_else(|| JsValue::from_str("Canvas unavailable"))?
        .dyn_into::<CanvasRenderingContext2d>()?;
    context.draw_image_with_html_image_element_and_dw_and_dh(
        &image,
        0.0,
        0.0,
        canvas.width() as f64,
        canvas.height() as f64,
    )?;
    canvas.to_data_url_with_type_and_encoder_options("image/jpeg", &JsValue::from_f64(0.72))
}
fn download(name: &str, text: &str, mime: &str) {
    let parts = Array::new();
    parts.push(&JsValue::from_str(text));
    let options = BlobPropertyBag::new();
    options.set_type(mime);
    if let Ok(blob) = Blob::new_with_str_sequence_and_options(&parts, &options)
        && let Ok(url) = Url::create_object_url_with_blob(&blob)
        && let Ok(el) = document()
            .create_element("a")
            .and_then(|e| e.dyn_into::<HtmlAnchorElement>().map_err(Into::into))
    {
        el.set_href(&url);
        el.set_download(name);
        if let Some(body) = document().body() {
            let _ = body.append_child(&el);
        }
        el.click();
        el.remove();
        let revoke = url.clone();
        gloo_timers::callback::Timeout::new(10_000, move || {
            let _ = Url::revoke_object_url(&revoke);
        })
        .forget();
    }
}
fn intro_go(slide: usize) {
    if slide >= 2 {
        with_app(|a| a.ui.intro = None);
        let _ = storage_set("timecon.intro", "done");
        if let Some(el) = select("#intro") {
            let _ = el.set_attribute("hidden", "");
        }
        if let Some(body) = document().body() {
            let _ = body.class_list().remove_1("intro-open");
        }
        return;
    }
    let content = with_app(|a| {
        a.ui.intro = Some(slide);
        a.ui.intro_deadline = now() + if slide == 0 { 9000 } else { 12000 };
        view::intro(&a.state, slide)
    });
    if let Some(el) = select("#intro") {
        el.set_inner_html(&content);
        let _ = el.remove_attribute("hidden");
    }
    if let Some(body) = document().body() {
        let _ = body.class_list().add_1("intro-open");
    }
}
fn tick() {
    let at = now();
    let current = today();
    let (titles, changed, intro) = with_app(|a| {
        let followed_today = a.ui.day == a.ui.today;
        let new_day = a.ui.today != current;
        a.ui.today = current.clone();
        if new_day && followed_today {
            a.ui.day = current.clone();
        }
        let added = a.state.ensure_day(&current);
        let titles = a.state.expire(at);
        let mut changed = added || new_day || !titles.is_empty();
        if at >= a.state.auto_cooldown_until {
            let tasks: Vec<_> = a
                .state
                .days
                .get(&current)
                .into_iter()
                .flatten()
                .filter(|t| t.status == Status::Pending && !t.no_timer && !t.auto_done)
                .filter_map(|t| {
                    let time = t.start_at.as_ref()?;
                    valid_time(time)?;
                    let parts: Vec<_> = time.split(':').collect();
                    let d = Date::new_0();
                    d.set_hours(0);
                    d.set_minutes(0);
                    d.set_seconds(0);
                    d.set_milliseconds(0);
                    let target = d.get_time() as i64
                        + parts[0].parse::<i64>().ok()? * 3_600_000
                        + parts[1].parse::<i64>().ok()? * 60_000;
                    if (0..=7_200_000).contains(&(at - target)) {
                        Some(t.id.clone())
                    } else {
                        None
                    }
                })
                .collect();
            for id in tasks {
                if a.state.start_task(&id, at) {
                    if let Some(t) = a.state.task_mut(&id) {
                        t.auto_done = true;
                    }
                    changed = true;
                }
            }
        }
        (
            titles,
            changed,
            a.ui.intro.filter(|_| at >= a.ui.intro_deadline),
        )
    });
    for title in titles {
        alarm(&title)
    }
    if changed {
        persist()
    } else {
        let runs = with_app(|a| a.state.running.clone());
        for e in all("[data-timer]") {
            if let Some(run) = runs.iter().find(|r| r.task_id == data(&e, "timer")) {
                e.set_text_content(Some(&view::clock(run.end_at - at)));
            }
        }
        for e in all("[data-prog]") {
            if let Some(r) = runs.iter().find(|r| r.task_id == data(&e, "prog")) {
                let _ = e.set_attribute(
                    "style",
                    &format!(
                        "width:{}%",
                        ((r.end_at - at) as f64 / (r.end_at - r.started_at).max(1) as f64 * 100.0)
                            .clamp(0.0, 100.0)
                    ),
                );
            }
        }
    }
    if let Some(i) = intro {
        intro_go(i + 1)
    }
}
pub fn start() -> Result<(), JsValue> {
    let raw = storage_get(STORAGE_KEY);
    let state = match raw.as_deref().map(State::from_json) {
        Some(Ok(s)) => s,
        Some(Err(error)) => {
            let _ = storage_set(
                &format!("timecon.corrupt-backup.{}", now()),
                raw.as_deref().unwrap(),
            );
            message(&format!(
                "Cannot read saved data; a backup was retained. {error}"
            ));
            State::default()
        }
        None => State::default(),
    };
    APP.with(|a| {
        *a.borrow_mut() = Some(App {
            state,
            ui: Ui::new(today()),
            version: 0,
        })
    });
    let body = document()
        .body()
        .ok_or_else(|| JsValue::from_str("Missing body"))?;
    let dialog = document().create_element("dialog")?;
    dialog.set_id("entrySheet");
    dialog.set_class_name("entry-sheet");
    dialog.set_attribute("aria-labelledby", "sheetTitle")?;
    body.append_child(&dialog)?;
    let status = document().create_element("div")?;
    status.set_id("actionStatus");
    status.set_class_name("sr-only");
    status.set_attribute("role", "status")?;
    body.append_child(&status)?;
    let intro = document().create_element("div")?;
    intro.set_id("intro");
    intro.set_class_name("intro");
    intro.set_attribute("hidden", "")?;
    body.append_child(&intro)?;
    listen(document().as_ref(), "click", click)?;
    listen(document().as_ref(), "submit", submit)?;
    listen(document().as_ref(), "input", input)?;
    listen(document().as_ref(), "change", change)?;
    listen(dialog.as_ref(), "close", move |_| {
        if let Some(body) = document().body() {
            let _ = body.class_list().remove_1("sheet-open");
            let _ = body.remove_attribute("style");
        }
        window().scroll_to_with_x_and_y(0.0, SHEET_SCROLL.with(|s| *s.borrow()));
        SHEET_FOCUS.with(|f| {
            if let Some(el) = f.borrow().as_ref().filter(|e| e.is_connected()) {
                let _ = el.focus();
            }
        });
    })?;
    listen(dialog.as_ref(), "click", move |e| {
        if let (Some(mouse), Some(target)) = (
            e.dyn_ref::<MouseEvent>(),
            e.target()
                .and_then(|t| t.dyn_into::<HtmlDialogElement>().ok()),
        ) {
            let r = target.get_bounding_client_rect();
            let x = mouse.client_x() as f64;
            let y = mouse.client_y() as f64;
            if x < r.left() || x > r.right() || y < r.top() || y > r.bottom() {
                target.close();
            }
        }
    })?;
    let scroll = Closure::<dyn FnMut(Event)>::new(move |e: Event| {
        if let Some(el) = e.target().and_then(|t| t.dyn_into::<Element>().ok()) {
            let id = data(&el, "block");
            if !id.is_empty()
                && let (Some(src), Some(dst)) = (
                    el.dyn_ref::<HtmlElement>(),
                    all("[data-code-view]")
                        .into_iter()
                        .find(|e| data(e, "code-view") == id)
                        .and_then(|e| e.dyn_into::<HtmlElement>().ok()),
                )
            {
                dst.set_scroll_top(src.scroll_top());
                dst.set_scroll_left(src.scroll_left());
            }
        }
    });
    document().add_event_listener_with_callback_and_bool(
        "scroll",
        scroll.as_ref().unchecked_ref(),
        true,
    )?;
    scroll.forget();
    listen(document().as_ref(), "visibilitychange", |_| {
        if !document().hidden() {
            tick();
            cloud::sync();
        }
    })?;
    listen(window().as_ref(), "focus", |_| {
        tick();
        cloud::sync();
    })?;
    listen(window().as_ref(), "online", |_| cloud::sync())?;
    cloud::init();
    render(false);
    if storage_get("timecon.intro").as_deref() != Some("done") {
        intro_go(0);
    }
    gloo_timers::callback::Interval::new(500, tick).forget();
    gloo_timers::callback::Interval::new(15000, || {
        if !document().hidden() {
            cloud::sync();
        }
    })
    .forget();
    let _ = window().navigator().service_worker().register("sw.js");
    Ok(())
}
