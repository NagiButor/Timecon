use crate::{model::*, syntax};
use chrono::Datelike;
use maud::{Markup, PreEscaped, html};
use serde_json::Value;
use std::{collections::BTreeMap, sync::LazyLock};

static TEXT: LazyLock<Value> =
    LazyLock::new(|| serde_json::from_str(include_str!("../assets/i18n.json")).unwrap());
static ICONS: LazyLock<Value> =
    LazyLock::new(|| serde_json::from_str(include_str!("../assets/icons.json")).unwrap());
pub const CAT_ICONS: &[&str] = &[
    "dumbbell",
    "briefcase",
    "coffee",
    "book",
    "home",
    "cart",
    "heart",
    "star",
    "code",
    "music",
    "moon",
    "phone",
];
pub const NOTE_ICONS: &[&str] = &[
    "note",
    "note2",
    "filetext",
    "image",
    "pin",
    "list",
    "clipboard",
    "palette",
    "star",
    "heart",
    "book",
    "briefcase",
    "code",
    "music",
    "cart",
    "home",
];
pub fn tr(lang: &str, key: &str) -> String {
    TEXT[lang][key]
        .as_str()
        .or_else(|| TEXT["ru"][key].as_str())
        .unwrap_or(key)
        .into()
}
pub fn weekday(lang: &str, day: &str) -> String {
    TEXT[lang]["wd"][date(day).weekday().num_days_from_sunday() as usize]
        .as_str()
        .unwrap_or("")
        .into()
}
pub fn icon(name: &str) -> Markup {
    html! { svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" { (PreEscaped(ICONS[name].as_str().unwrap_or(""))) } }
}
fn google_logo() -> Markup {
    html! {
        svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {
            path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" {}
            path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" {}
            path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" {}
            path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" {}
        }
    }
}
pub fn duration(min: u32, lang: &str) -> String {
    let mut p = vec![];
    if min >= 1440 {
        p.push(format!("{}{}", min / 1440, tr(lang, "d")));
    }
    if min % 1440 >= 60 {
        p.push(format!("{}{}", min % 1440 / 60, tr(lang, "h")));
    }
    if !min.is_multiple_of(60) || p.is_empty() {
        p.push(format!("{} {}", min % 60, tr(lang, "min")));
    }
    p.join(" ")
}
pub fn clock(ms: i64) -> String {
    let s = (ms.max(0) + 999) / 1000;
    format!("{:02}:{:02}", s / 60, s % 60)
}
pub fn money(n: f64, currency: &str) -> String {
    let symbol = match currency {
        "RUB" => "₽",
        "USD" => "$",
        "EUR" => "€",
        "KZT" => "₸",
        "UAH" => "₴",
        "BYN" => "Br",
        "GBP" => "£",
        v => v,
    };
    format!("{n:.2} {symbol}")
}
#[derive(Clone, Debug)]
pub struct Ui {
    pub view: String,
    pub day: String,
    pub today: String,
    pub month: String,
    pub sort: String,
    pub period: String,
    pub move_id: String,
    pub time_id: String,
    pub note_id: String,
    pub actions_id: String,
    pub focus_id: String,
    pub icon_pick: bool,
    pub intro: Option<usize>,
    pub intro_deadline: i64,
}
impl Ui {
    pub fn new(today: String) -> Self {
        Self {
            view: "tasks".into(),
            day: today.clone(),
            month: today[..7].into(),
            today,
            sort: "manual".into(),
            period: "day".into(),
            move_id: String::new(),
            time_id: String::new(),
            note_id: String::new(),
            actions_id: String::new(),
            focus_id: String::new(),
            icon_pick: false,
            intro: None,
            intro_deadline: 0,
        }
    }
}
#[derive(Clone, Debug, Default)]
pub struct SyncView {
    pub email: String,
    pub updated: i64,
    pub message: String,
    pub busy: bool,
    pub recovery: bool,
    pub forgot: bool,
    pub forgot_sent: bool,
}
struct Ctx<'a> {
    s: &'a State,
    ui: &'a Ui,
    now: i64,
    sync: &'a SyncView,
}
impl Ctx<'_> {
    fn t(&self, k: &str) -> String {
        tr(&self.s.lang, k)
    }
    fn label(&self, c: &Category) -> String {
        if c.key.is_empty() {
            c.name.clone()
        } else {
            self.t(&c.key)
        }
    }
    fn button(&self, act: &str, id: &str, text: &str, ic: &str, class: &str) -> Markup {
        html! {button type="button" class=(class) data-act=(act) data-id=(id) aria-label=(self.t(text)) { @if !ic.is_empty(){(icon(ic))} (self.t(text)) }}
    }
    fn cat_options(&self, finance: bool) -> Markup {
        let cats = if finance {
            &self.s.fin.cats
        } else {
            &self.s.cats
        };
        html! {@for c in cats {option value=(&c.id){(self.label(c))}}}
    }
    fn task(&self, t: &Task, i: usize, total: usize, focused: bool) -> Markup {
        let cat = self.s.cats.iter().find(|c| c.id == t.cat_id);
        let color = cat.map(|c| c.color.as_str()).unwrap_or("#8b93a7");
        let repeating = self
            .s
            .daily
            .iter()
            .any(|series| series.id == t.repeat_id && series.stopped_from.is_none());
        html! {
            li class=(format!("task {} {}",t.status.as_str(),if focused{"focused"}else{""})) data-task-id=(&t.id) data-status=(t.status.as_str()) style=(format!("--c:{}",safe_color(color))) {
                div class="task-head" { span class="cat-ico"{(icon(cat.map(|c|c.icon.as_str()).unwrap_or("star")))}
                    div class="task-title" {span class="ttl"{(&t.title)} small {
                        @if t.no_timer {(self.t("no_timer"))} @else {
                            (t.minutes) " " (self.t("min"))
                            @if let Some(at)=&t.start_at {" · " (self.t("auto_at")) " " (at)}
                            @if let Some(ts)=t.started_at {" · " (self.t("started_at")) " " (local_time(ts))}
                            @if t.manual && t.status==Status::Done {" · " (self.t("manual_mark"))}
                        }
                        @if !t.repeat_id.is_empty() {" · " (self.t("daily"))}
                    }}
                    @if t.status==Status::Done || t.status==Status::Failed {span class=(if t.status==Status::Done{"mark ok"}else{"mark bad"}){(icon(if t.status==Status::Done{"check"}else{"x"}))}}
                    @if t.status==Status::Running {(self.button("focusTimer",&t.id,"focus_timer","clock","icon-btn ghost"))}
                }
                @match t.status {
                    Status::Running => { @let run=self.s.running.iter().find(|r|r.task_id==t.id); @let end=run.map(|r|r.end_at).unwrap_or(self.now);
                        div class="timer-label"{(self.t("remaining"))} span class="clock" data-timer=(&t.id){(clock(end-self.now))}
                        div class="task-progress"{i data-prog=(&t.id) style=(format!("width:{}%",run.map(|r|((r.end_at-self.now) as f64/(r.end_at-r.started_at).max(1) as f64*100.0).clamp(0.0,100.0)).unwrap_or(0.0))) {}}
                        div class="acts center"{(self.button("cancel",&t.id,"cancel","x","bad"))}
                    },
                    Status::Ask => {div class="verdict"{span{(self.t("ask_q"))}
                        button class="ok" data-act="verdict" data-id=(&t.id) data-v="done"{(icon("check")) (self.t("verdict_done"))}
                        button class="bad" data-act="verdict" data-id=(&t.id) data-v="failed"{(icon("x")) (self.t("verdict_failed"))}
                    }},
                    Status::Pending => {
                        div class=(if t.no_timer{"acts task-primary-actions untimed-actions"}else{"acts task-primary-actions"}) {
                            @if !t.no_timer {(self.button("start",&t.id,"start","play","primary"))}
                            (self.button("finishNow",&t.id,"mark_done","check","ok"))
                            button class="ghost task-more-toggle" data-act="taskMore" data-id=(&t.id) aria-expanded=(self.ui.actions_id==t.id){(self.t("more_actions")) " ⋯"}
                        }
                        @if self.ui.actions_id==t.id {div class="secondary-actions" {
                            @if !t.no_timer {(self.button("time",&t.id,"auto_on","clock",""))}
                            @if self.ui.sort=="manual" {
                                button data-act="up" data-id=(&t.id) disabled[i==0]{(self.t("up"))}
                                button data-act="down" data-id=(&t.id) disabled[i+1>=total]{(self.t("down"))}
                            }
                            (self.button("move",&t.id,"move","move","")) (self.button("del",&t.id,if t.repeat_id.is_empty(){"delete"}else{"delete_occurrence"},"trash",""))
                            @if repeating {(self.button("stopRepeat",&t.repeat_id,"stop_repeat","",""))}
                        }}
                    },
                    _ => {div class="acts"{(self.button("restore",&t.id,"restore","undo","ghost")) (self.button("del",&t.id,if t.repeat_id.is_empty(){"delete"}else{"delete_occurrence"},"trash","ghost")) @if repeating {(self.button("stopRepeat",&t.repeat_id,"stop_repeat","","ghost"))}}}
                }
                @if self.ui.move_id==t.id {
                    form class="move" data-form="move" data-id=(&t.id){
                        select name="when"{@for (v,k) in [("1","tomorrow"),("2","after_tomorrow"),("7","in_week"),("date","pick_date"),("later","later")] {option value=(v){(self.t(k))}}}
                        input type="date" name="date" value=(add_days(&self.ui.day,1)); button class="primary"{(self.t("ok"))}
                    }
                }
                @if self.ui.time_id==t.id && !t.no_timer {form class="move" data-form="setTime" data-id=(&t.id){input type="time" name="time" value=(t.start_at.as_deref().unwrap_or("")); button class="primary"{(self.t("ok"))} (self.button("timeClear",&t.id,"auto_off","","ghost"))}}
            }
        }
    }
    fn tasks(&self) -> Markup {
        let mut list: Vec<_> = self
            .s
            .days
            .get(&self.ui.day)
            .into_iter()
            .flatten()
            .collect();
        match self.ui.sort.as_str() {
            "cat" => list.sort_by_key(|t| self.s.cats.iter().position(|c| c.id == t.cat_id)),
            "status" => list.sort_by_key(|t| match t.status {
                Status::Pending => 0,
                Status::Running => 1,
                Status::Ask => 2,
                Status::Done => 3,
                Status::Failed => 4,
            }),
            "time" => list.sort_by_key(|t| std::cmp::Reverse(t.timed_minutes())),
            _ => {}
        }
        let active: Vec<_> = list
            .iter()
            .copied()
            .filter(|t| matches!(t.status, Status::Running | Status::Ask))
            .collect();
        let rest: Vec<_> = list
            .iter()
            .copied()
            .filter(|t| !matches!(t.status, Status::Running | Status::Ask))
            .collect();
        let focus = active
            .iter()
            .find(|t| t.id == self.ui.focus_id)
            .or(active.first())
            .map(|t| t.id.as_str())
            .unwrap_or("");
        let planned_minutes: u32 = list.iter().map(|t| t.timed_minutes()).sum();
        html! {
            section class="day-hero"{div class="day-heading"{div{p class="eyebrow"{(weekday(&self.s.lang,&self.ui.day)) " · " (&self.ui.day)} h2{(if self.ui.day==self.ui.today{self.t("today")}else{self.ui.day.clone()})}}
                div class="day-arrows"{@for (n,k,ic) in [(-1,"previous_day","left"),(1,"next_day","right")]{button class="icon-btn ghost" data-act="day" data-n=(n) aria-label=(self.t(k)){(icon(ic))}}}
            }
            @if !list.is_empty(){p class="day-summary"{b{(list.iter().filter(|t|t.status==Status::Done).count())} " " (self.t("of")) " " (list.len()) " " (self.t("tasks_done")) @if planned_minutes>0 {span{"·"} (duration(planned_minutes,&self.s.lang)) " " (self.t("planned"))}}}
            }
            @if !active.is_empty(){div class="section-label"{span class="live-dot"{} (self.t("focus")) small{(active.len())}} ul class="tasks focus-list"{@for t in active {(self.task(t,list.iter().position(|v|v.id==t.id).unwrap_or(0),list.len(),focus==t.id))}}}
            @if !rest.is_empty(){div class="toolbar plan-toolbar"{h3{(self.t("day_plan"))} label{span class="sr-only"{(self.t("sort"))} select data-change="sort" aria-label=(self.t("sort")){@for (v,k) in [("manual","sort_manual"),("cat","sort_cat"),("status","sort_status"),("time","sort_time")]{option value=(v) selected[self.ui.sort==v]{(self.t(k))}}}}}
                ul class="tasks"{@for t in rest{(self.task(t,list.iter().position(|v|v.id==t.id).unwrap_or(0),list.len(),false))}}
            } @else if list.is_empty(){section class="empty-day"{span class="empty-symbol"{(icon("tasks"))} h3{(self.t("empty_title"))} p{(self.t("empty_hint"))}}}
            div class="day-actions"{button class="primary add-task" data-act="openSheet" data-sheet="addTask"{(icon("plus")) (self.t("new_task"))} @if self.ui.day!=self.ui.today{(self.button("today","","today","","ghost"))}}
            @let daily: Vec<_> = self.s.daily.iter().filter(|s| s.stopped_from.is_none()).collect();
            @if !daily.is_empty() {details class="quiet-section" data-disclosure="daily"{summary{(self.t("daily_tasks")) span{(daily.len())}}
                p class="muted hint"{(self.t("daily_hint"))}
                ul class="mini"{@for series in daily {li{(icon("tasks")) span{(&series.task.title)} (self.button("stopRepeat",&series.id,"stop_repeat","","ghost"))}}}
            }}
            details class="quiet-section" data-disclosure="presets"{summary{(self.t("presets")) span{(self.s.presets.values().filter(|v|!v.is_empty()).count())}}
                section class="card"{h3{(self.t("presets"))}
                    @for wd in [1,2,3,4,5,6,0] {@if let Some(tasks)=self.s.presets.get(&wd.to_string()).filter(|v|!v.is_empty()){
                        div class="preset"{div class="preset-head"{b{(TEXT[&self.s.lang]["wd"][wd].as_str().unwrap_or(""))}
                            button class="ghost" data-act="applyPreset" data-wd=(wd){(self.t("apply_preset"))}
                            button class="icon-btn" data-act="clearPreset" data-wd=(wd) aria-label=(self.t("clear_preset")){(icon("trash"))}}
                            ul class="mini"{@for p in tasks{li{(icon(if p.no_timer{"tasks"}else{"clock"})) span{(&p.title)} small{@if p.no_timer{(self.t("no_timer"))}@else{(p.minutes) " " (self.t("min")) " " (p.start_at.as_deref().unwrap_or(""))}}}}}
                        }
                    }}
                    @if self.s.presets.values().all(Vec::is_empty){p class="empty"{(self.t("presets_empty"))}}
                    div class="acts"{(self.button("savePreset","","save_preset","plus",""))} p class="muted hint"{(self.t("preset_hint"))}
                }
            }
            details class="quiet-section" data-disclosure="backlog"{summary{(self.t("backlog")) span{(self.s.backlog.len())}}
                ul class="mini"{@for t in &self.s.backlog{li{(icon("tasks")) span{(&t.title)} (self.button("fromBacklog",&t.id,"to_day","","ghost")) (self.button("delBacklog",&t.id,"delete","trash","icon-btn"))}}}
                @if self.s.backlog.is_empty(){p class="empty"{(self.t("none"))}}
            }
        }
    }
    fn stats(&self) -> Markup {
        let start = add_days(
            &self.ui.day,
            -i64::from(date(&self.ui.day).weekday().num_days_from_monday()),
        );
        let end = add_days(&start, 6);
        let entries: Vec<_> = self
            .s
            .days
            .iter()
            .filter(|(d, _)| match self.ui.period.as_str() {
                "day" => **d == self.ui.day,
                "week" => **d >= start && **d <= end,
                "month" => d.starts_with(&self.ui.day[..7]),
                _ => true,
            })
            .flat_map(|(_, v)| v)
            .collect();
        let done: Vec<_> = entries
            .iter()
            .copied()
            .filter(|t| t.status == Status::Done)
            .collect();
        let failed = entries
            .iter()
            .filter(|t| t.status == Status::Failed)
            .count();
        let pct = if done.len() + failed > 0 {
            done.len() * 100 / (done.len() + failed)
        } else {
            0
        };
        let mut by_task = BTreeMap::new();
        let mut by_cat = BTreeMap::new();
        for t in done.iter().filter(|t| !t.no_timer) {
            *by_task.entry(t.title.clone()).or_insert(0.0) += f64::from(t.minutes);
            *by_cat
                .entry(self.s.category_label(&t.cat_id, false))
                .or_insert(0.0) += f64::from(t.minutes);
        }
        html! {
            div class="periods"{@for (v,k) in [("day","period_day"),("week","period_week"),("month","period_month"),("all","period_all")]{button class=(if self.ui.period==v{"on"}else{""}) data-act="period" data-p=(v){(self.t(k))}}}
            section class="card"{div class="tiles"{
                (self.tile("total_time",&duration(done.iter().map(|t|t.timed_minutes()).sum(),&self.s.lang),""))
                (self.tile("completion",&format!("{pct}%"),"")) (self.tile("done_count",&done.len().to_string(),"pos")) (self.tile("failed_count",&failed.to_string(),"neg"))
            }}
            section class="card"{h3{(self.t("by_task"))} (self.bars(by_task,false))}
            section class="card"{h3{(self.t("by_cat"))} (self.bars(by_cat,false))}
        }
    }
    fn tile(&self, key: &str, value: &str, class: &str) -> Markup {
        html! {div class="tile"{small{(self.t(key))} b class=(class){(value)}}}
    }
    fn bars(&self, map: BTreeMap<String, f64>, cash: bool) -> Markup {
        let mut rows: Vec<_> = map.into_iter().collect();
        rows.sort_by(|a, b| b.1.total_cmp(&a.1));
        let max = rows.first().map(|r| r.1).unwrap_or(0.0);
        html! {@if rows.is_empty(){p class="empty"{(self.t("no_data"))}} @for (label,val) in rows{div class="bar-row"{div class="bar-l"{span{(label)} small{(if cash{money(val,&self.s.currency)}else{duration(val.round() as u32,&self.s.lang)})}} div class="bar"{i style=(format!("width:{}%",if max>0.0{val/max*100.0}else{0.0})) {}}}}}
    }
    fn finance(&self) -> Markup {
        let inc: Vec<_> = self
            .s
            .fin
            .incomes
            .iter()
            .filter(|e| e.date.starts_with(&self.ui.month))
            .collect();
        let exp: Vec<_> = self
            .s
            .fin
            .expenses
            .iter()
            .filter(|e| e.date.starts_with(&self.ui.month))
            .collect();
        let income = inc.iter().map(|e| e.amount).sum::<f64>()
            + paydates(&self.s.fin, &self.ui.month)
                .iter()
                .map(|p| p.1)
                .sum::<f64>();
        let spent = exp.iter().map(|e| e.amount).sum::<f64>();
        let unneeded = exp
            .iter()
            .filter(|e| !e.needed)
            .map(|e| e.amount)
            .sum::<f64>();
        let balance = income - spent;
        let mut groups = BTreeMap::new();
        for e in &exp {
            *groups
                .entry(self.s.category_label(&e.cat_id, true))
                .or_insert(0.0) += e.amount;
        }
        let mut rows: Vec<_> = inc
            .iter()
            .map(|e| ("income", *e))
            .chain(exp.iter().map(|e| ("expense", *e)))
            .collect();
        rows.sort_by(|a, b| b.1.date.cmp(&a.1.date));
        let next = (0..3)
            .flat_map(|n| paydates(&self.s.fin, &shift_month(&self.ui.today[..7], n)))
            .find(|(d, _)| d >= &self.ui.today);
        html! {
            div class="card daybar"{button class="icon-btn" data-act="month" data-n="-1" aria-label=(self.t("previous_month")){(icon("left"))} b{(&self.ui.month)} button class="icon-btn" data-act="month" data-n="1" aria-label=(self.t("next_month")){(icon("right"))}}
            section class="card balance-card"{p class="eyebrow"{(self.t("balance"))} b class=(if balance<0.0{"balance-value neg"}else{"balance-value"}){(money(balance,&self.s.currency))}
                div class="balance-breakdown"{div{span{(self.t("income"))} b class="pos"{(money(income,&self.s.currency))}} div{span{(self.t("expenses"))} b class="neg"{(money(spent,&self.s.currency))}}}
                details class="finance-details" data-disclosure="finance"{summary{(self.t("details"))} div class="tiles"{
                    (self.tile("efficiency",&format!("{:.0}%",if income>0.0{balance/income*100.0}else{0.0}),""))
                    (self.tile("unneeded",&money(unneeded,&self.s.currency),"")) (self.tile("unneeded_share",&format!("{:.0}%",if spent>0.0{unneeded/spent*100.0}else{0.0}),""))
                }}
                @if let Some((d,amount))=next.filter(|(_,a)|*a>0.0){p class="muted payday"{(self.t("next_payday")) ": " (d) " · " (money(amount,&self.s.currency))}}
            }
            div class="row2 finance-actions"{@for (kind,k,class) in [("addExpense","expense_short","primary"),("addIncome","income_short","")]{button class=(class) data-act="openSheet" data-sheet=(kind){(self.t(k))}}}
            section class="card"{h3{(self.t("by_cat"))} (self.bars(groups,true))}
            section class="card"{h3{(self.t("transactions"))} ul class="mini transactions"{
                @if rows.is_empty(){li class="empty"{(self.t("no_transactions"))}}
                @for (kind,e) in rows{li{small{(&e.date)} span{(if e.note.is_empty(){self.s.category_label(&e.cat_id,true)}else{e.note.clone()})} b class=(if kind=="income"{"pos"}else{"neg"}){(if kind=="income"{"+"}else{"−"}) (money(e.amount,&self.s.currency))}
                    button class="icon-btn" data-act="delFin" data-kind=(kind) data-id=(&e.id) aria-label=(self.t("delete")){(icon("trash"))}
                }}
            }}
        }
    }
    fn cat_editor(&self, finance: bool) -> Markup {
        let cats = if finance {
            &self.s.fin.cats
        } else {
            &self.s.cats
        };
        html! {ul class="mini"{@for c in cats{li{(icon(&c.icon)) span{(self.label(c))} button class="icon-btn" data-act="delCat" data-kind=(if finance{"finCats"}else{"cats"}) data-id=(&c.id) aria-label=(self.t("delete")){(icon("trash"))}}}}
            form class="form" data-form=(if finance{"addFinCat"}else{"addCat"}){
                input name="name" placeholder=(self.t("name")) required maxlength="30";
                div class="icon-grid"{@for (i,n) in CAT_ICONS.iter().enumerate(){label class="ico"{input type="radio" name="icon" value=(n) checked[i==0];(icon(n))}}}
                @if !finance{input name="color" type="color" value="#d4af37";}
                button class="primary"{(icon("plus")) (self.t("add_cat"))}
            }
        }
    }
    fn settings(&self) -> Markup {
        html! {
            form class="card form" data-form="settings"{h3{(self.t("settings"))}
                label{(self.t("language")) select name="lang"{@for (v,label) in [("ru","Русский"),("en","English")]{option value=(v) selected[self.s.lang==v]{(label)}}}}
                label{(self.t("theme")) select name="theme"{@for v in ["dark","light"]{option value=(v) selected[self.s.theme==v]{(self.t(v))}}}}
                label{(self.t("currency")) select name="currency"{@for v in ["RUB","USD","EUR","KZT","UAH","BYN","GBP"]{option value=(v) selected[self.s.currency==v]{(v)}}}}
                button class="primary"{(self.t("save"))}
            }
            section class="card"{h3{(self.t("pay_title"))} ul class="mini"{@for p in &self.s.fin.pays{li class="pays-row"{
                input type="number" min="1" max="31" value=(p.day) data-change="payDay" data-id=(&p.id) aria-label=(self.t("pay_day"));
                input type="number" min="0" step="0.01" value=(p.amount) data-change="payAmount" data-id=(&p.id) aria-label=(self.t("pay_amount"));
                (self.button("payDel",&p.id,"delete","trash","icon-btn"))
            }}} div class="acts"{(self.button("payAdd","","pay_add","plus",""))}
                label class="check"{input type="checkbox" data-change="shift" checked[self.s.fin.shift_weekend];(self.t("shift_weekend"))}
            }
            p class="muted"{ "Timecon " (BUILD) }
            section class="card"{h3{(self.t("categories"))} (self.cat_editor(false))}
            section class="card"{h3{(self.t("fin_categories"))} (self.cat_editor(true))}
            section class="card"{h3{(self.t("data"))} div class="acts"{
                (self.button("export","","export_json","","")) (self.button("exportCsv","","export_csv","",""))
                label class="btn-like"{(self.t("import_json")) input type="file" accept="application/json" data-change="import" hidden;}
            }}
            section class="card"{(self.button("intro","","intro_show","play",""))}
            section class="card" id="syncSection"{h3{(self.t("sync_title"))} (self.sync())}
        }
    }
    fn sync(&self) -> Markup {
        html! {
            @if self.sync.recovery {
                form class="form" data-form="syncRecovery"{h3{(self.t("sync_recovery_title"))}
                    input name="pw1" type="password" autocomplete="new-password" minlength="6" required placeholder=(self.t("sync_password"));
                    input name="pw2" type="password" autocomplete="new-password" minlength="6" required placeholder=(self.t("sync_password2"));
                    button class="primary" disabled[self.sync.busy]{(self.t("sync_set_password"))}
                }
            } @else if !self.sync.email.is_empty(){
                p class="muted"{(self.t("sync_in")) ": " (&self.sync.email)} p class="muted"{(self.t("sync_last")) ": " (local_time(self.sync.updated))}
                div class="acts"{(self.button("syncNow","","sync_now","","")) (self.button("syncOut","","sync_out","","ghost"))}
            } @else {
                form class="form" data-form="syncAuth"{
                    input name="email" type="email" autocomplete="username" required placeholder=(self.t("sync_email"));
                    input name="password" type="password" autocomplete="current-password" minlength="6" required placeholder=(self.t("sync_password"));
                    p class="muted"{(self.t("sync_hint"))}
                    div class="row2"{button class="primary" name="mode" value="in" disabled[self.sync.busy]{(self.t("sync_login"))} button name="mode" value="up" disabled[self.sync.busy]{(self.t("sync_signup"))}}
                }
                div class="auth-alt"{
                    button type="button" class="btn-google" data-act="google" aria-label=(self.t("sync_google")) {
                        span class="g-logo"{(google_logo())}
                        span{(self.t("sync_google"))}
                    }
                    (self.button("forgotShow","","sync_forgot","","btn-link"))
                }
                p class="muted"{(self.t("sync_standalone_hint"))}
                @if self.sync.forgot{form class="form" data-form="syncForgot"{input name="email" type="email" required autocomplete="username" placeholder=(self.t("sync_email"));button disabled[self.sync.busy]{(self.t("sync_forgot_send"))}}}
                @if self.sync.forgot_sent{p class="muted"{(self.t("sync_forgot_sent"))}}
            }
            @if !self.sync.message.is_empty(){p class="muted" role="status"{(self.t(&self.sync.message))}}
        }
    }
    fn notes(&self) -> Markup {
        if let Some(n) = self.s.notes.iter().find(|n| n.id == self.ui.note_id) {
            return self.note_editor(n);
        }
        let mut notes: Vec<_> = self.s.notes.iter().collect();
        notes.sort_by_key(|n| std::cmp::Reverse(n.updated_at));
        html! {(self.button("noteNew","","note_new","plus","primary"))
            @if notes.is_empty(){p class="empty"{(self.t("note_empty"))}}
            @for n in notes{div class="card note-card" data-act="noteOpen" data-id=(&n.id) tabindex="0" role="button"{
                div class="note-head"{span class="note-ico"{(icon(&n.icon))} div class="note-meta"{b{(if n.title.is_empty(){self.t("note_title")}else{n.title.clone()})} small{(self.t("note_updated")) ": " (local_time(n.updated_at))}} (self.button("noteDel",&n.id,"delete","trash","icon-btn"))}
                p class="muted"{(n.blocks.iter().find(|b|!b.text.trim().is_empty()).map(|b|b.text.chars().take(90).collect::<String>()).unwrap_or_else(||self.t("none")))}
            }}
        }
    }
    fn note_editor(&self, n: &Note) -> Markup {
        html! {
            div class="toolbar"{(self.button("noteBack","","back","left","ghost")) span class="muted" id="noteUpdated"{(self.t("note_updated")) ": " (local_time(n.updated_at))}}
            div class="card form"{div class="note-title-row"{(self.button("noteIconPick","","note_icon",&n.icon,"icon-btn note-ico-btn")) input data-note-title value=(&n.title) placeholder=(self.t("note_title")) maxlength="80";}
                @if self.ui.icon_pick{div class="icon-grid"{@for name in NOTE_ICONS{button class="ico" data-act="noteIconSet" data-icon=(name) aria-label=(name){(icon(name))}}}}
            }
            div class="note-blocks"{@for (i,b) in n.blocks.iter().enumerate(){div class="card note-block"{
                div class="note-block-head"{span class="muted"{(self.t(match b.kind.as_str(){"code"=>"note_add_code","photo"=>"note_add_photo",_=>"note_add_text"}))}
                    button class="icon-btn" data-act="noteUp" data-id=(&b.id) disabled[i==0] aria-label=(self.t("up")){"↑"}
                    button class="icon-btn" data-act="noteDown" data-id=(&b.id) disabled[i+1==n.blocks.len()] aria-label=(self.t("down")){"↓"}
                    (self.button("noteBlockDel",&b.id,"delete","trash","icon-btn"))
                }
                @match b.kind.as_str(){
                    "photo"=>{img class="note-photo" src=(if b.src.starts_with("data:image/"){b.src.as_str()}else{""}) alt="";},
                    "code"=>{input data-lang=(&b.id) value=(&b.lang) placeholder=(self.t("note_code_lang")) maxlength="20" list="langList";
                        div class="code-wrap"{pre class="code-view" data-code-view=(&b.id) aria-hidden="true"{(PreEscaped(syntax::highlight(&b.text,if b.lang.is_empty(){syntax::detect(&b.text)}else{&b.lang})))}
                            textarea class="code" data-block=(&b.id) rows="4" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder=(self.t("note_add_code")){(&b.text)}
                        } small class="muted" data-lang-label=(&b.id){(self.t("note_lang")) ": " (if b.lang.is_empty(){syntax::detect(&b.text)}else{&b.lang})}
                    },
                    _=>{textarea data-block=(&b.id) rows="3" placeholder=(self.t("note_add_text")){(&b.text)}}
                }
            }}}
            div class="card acts"{@for (kind,key,ic) in [("text","note_add_text","filetext"),("photo","note_add_photo","image"),("code","note_add_code","code")]{button data-act=(if kind=="photo"{"notePickPhoto"}else{"noteAdd"}) data-type=(kind){(icon(ic)) (self.t(key))}}}
            p class="muted"{(self.t("note_blocks_hint"))}
            datalist id="langList"{@for lang in ["rust","js","ts","python","html","css","json","sql","bash","c","java","php"]{option value=(lang);}}
            input type="file" id="notePhoto" accept="image/*" multiple hidden data-change="notePhoto";
        }
    }
}
pub fn safe_color(color: &str) -> &str {
    if color.len() == 7
        && color.starts_with('#')
        && color[1..].bytes().all(|b| b.is_ascii_hexdigit())
    {
        color
    } else {
        "#d4af37"
    }
}
pub fn local_time(ts: i64) -> String {
    #[cfg(target_arch = "wasm32")]
    {
        let d = js_sys::Date::new(&wasm_bindgen::JsValue::from_f64(ts as f64));
        format!(
            "{:04}-{:02}-{:02} {:02}:{:02}",
            d.get_full_year(),
            d.get_month() + 1,
            d.get_date(),
            d.get_hours(),
            d.get_minutes()
        )
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        chrono::DateTime::from_timestamp_millis(ts)
            .map(|d| d.format("%Y-%m-%d %H:%M").to_string())
            .unwrap_or_default()
    }
}
pub fn main(s: &State, ui: &Ui, now: i64, sync: &SyncView) -> String {
    let c = Ctx { s, ui, now, sync };
    match ui.view.as_str() {
        "notes" => c.notes(),
        "stats" => c.stats(),
        "finance" => c.finance(),
        "settings" => c.settings(),
        _ => c.tasks(),
    }
    .into_string()
}
pub fn nav(s: &State, ui: &Ui) -> String {
    html!{@for (v,ic) in [("tasks","tasks"),("notes","note"),("stats","chart"),("finance","wallet"),("settings","gear")]{button class=(if ui.view==v{"on"}else{""}) data-act="tab" data-v=(v) aria-current=(if ui.view==v{"page"}else{"false"}){(icon(ic)) span{(tr(&s.lang,v))}}}}.into_string()
}
pub fn warn(s: &State, sync: &SyncView) -> String {
    html!{@if sync.email.is_empty(){div class="local-storage"{details{summary{(icon("home")) (tr(&s.lang,"local_data"))} p{(tr(&s.lang,"warn_text"))}} button class="ghost" data-act="warnLogin"{(tr(&s.lang,"enable_sync"))}}}}.into_string()
}
pub fn sheet(s: &State, ui: &Ui, kind: &str) -> String {
    let sync = SyncView::default();
    let c = Ctx {
        s,
        ui,
        now: 0,
        sync: &sync,
    };
    let task = kind == "addTask";
    let expense = kind == "addExpense";
    html!{
        div class="sheet-head"{h2 id="sheetTitle"{(c.t(if task{"new_task"}else if expense{"add_expense"}else{"add_income"}))} button type="button" class="icon-btn ghost" data-act="closeSheet" aria-label=(c.t("close")){(icon("x"))}}
        form class="form sheet-form" data-form=(kind){
            @if task{
                label{(c.t("task_title")) input name="title" required maxlength="80" autocomplete="off";}
                fieldset class="task-mode"{legend class="sr-only"{(c.t("task_mode"))}
                    label{input type="radio" name="mode" value="plain" data-change="taskMode" checked; (icon("tasks")) (c.t("no_timer"))}
                    label{input type="radio" name="mode" value="timed" data-change="taskMode"; (icon("clock")) (c.t("with_timer"))}
                }
                p class="muted hint"{(c.t("task_mode_hint"))}
                label{(c.t("category")) select name="cat"{(c.cat_options(false))}}
                div class="repeat-option"{
                    label class="check"{input type="checkbox" name="repeatDaily" aria-describedby="repeatHint"; (c.t("repeat_daily"))}
                    p class="muted hint" id="repeatHint"{(c.t("repeat_daily_hint")) " " (&ui.day) "."}
                }
                fieldset class="form timer-fields" data-timer-fields hidden disabled{
                    label{(c.t("minutes")) input name="minutes" type="number" min="1" max="600" value="25" required inputmode="numeric";}
                    details class="advanced"{summary{(c.t("more"))} label{(c.t("auto_start")) input name="startAt" type="time";} p class="muted hint"{(c.t("auto_hint"))}}
                }
            } @else {
                div class="row2"{label{(c.t("amount")) input name="amount" type="number" step="0.01" min="0.01" required inputmode="decimal";} label{(c.t("date")) input name="date" type="date" value=(&ui.today) required;}}
                @if expense{div class="row2"{label{(c.t("cat_fin")) select name="catId"{(c.cat_options(true))}} label class="check"{input name="needed" type="checkbox" checked; (c.t("needed"))}}}
                label{(c.t("note")) input name="note" maxlength="60";}
            }
            button class="primary"{(icon("plus")) (c.t("add"))}
        }
    }.into_string()
}
pub fn intro(s: &State, slide: usize) -> String {
    html!{div class="intro-bars"{@for n in 0..2{ i{b style=(if n<slide{"width:100%"}else{"width:0%"}){}}}}
        div class="intro-stage" data-act="introTap"{img class="intro-img" src=(if slide==0{"intro1.jpg"}else{"intro2.jpg"}) alt="Timecon";}
        div class="intro-foot"{button class="ghost" data-act="introSkip"{(tr(&s.lang,"intro_skip"))} button class="primary" data-act="introNext"{(tr(&s.lang,if slide==0{"intro_next"}else{"intro_start"}))}}
    }.into_string()
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn all_views_render_and_escape() {
        let mut s = State::default();
        s.add_task(
            "2026-11-10",
            Task {
                title: "<img onerror=alert(1)>".into(),
                ..Default::default()
            },
        );
        let mut ui = Ui::new("2026-11-10".into());
        for v in ["tasks", "notes", "stats", "finance", "settings"] {
            ui.view = v.into();
            let h = main(&s, &ui, 0, &SyncView::default());
            assert!(!h.is_empty());
            assert!(!h.contains("<img onerror"));
        }
    }
    #[test]
    fn styles_cannot_be_injected() {
        assert_eq!(safe_color("red;position:fixed"), "#d4af37");
    }
    #[test]
    fn plain_tasks_have_no_timer_controls_or_invented_time_in_stats() {
        let mut s = State::default();
        s.add_task(
            "2026-11-10",
            Task {
                id: "plain".into(),
                title: "Купить продукты".into(),
                no_timer: true,
                // Ignore a stale duration even before imported data is normalized.
                minutes: 90,
                ..Default::default()
            },
        );
        let mut ui = Ui::new("2026-11-10".into());
        ui.actions_id = "plain".into();
        ui.time_id = "plain".into();
        let h = main(&s, &ui, 0, &SyncView::default());
        assert!(h.contains("Без таймера"));
        assert!(h.contains("data-act=\"finishNow\""));
        assert!(!h.contains("data-act=\"start\""));
        assert!(!h.contains("data-act=\"time\""));
        assert!(!h.contains("data-form=\"setTime\""));
        assert!(!h.contains("по плану"));
        s.finish_now("plain", 1);
        s.add_task(
            "2026-11-10",
            Task {
                id: "timed".into(),
                title: "Чтение".into(),
                minutes: 25,
                status: Status::Done,
                ..Default::default()
            },
        );
        ui.view = "stats".into();
        let stats = main(&s, &ui, 1, &SyncView::default());
        assert!(stats.contains("25 мин"));
        assert!(stats.contains("Выполнено</small><b class=\"pos\">2</b>"));
        assert!(!stats.contains("Купить продукты"));
        assert!(stats.contains("Чтение"));
    }
    #[test]
    fn google_sign_in_has_branded_logo_in_both_languages_and_themes() {
        let mut s = State::default();
        let mut ui = Ui::new("2026-11-10".into());
        ui.view = "settings".into();
        for lang in ["ru", "en"] {
            s.lang = lang.into();
            for theme in ["dark", "light"] {
                s.theme = theme.into();
                let h = main(&s, &ui, 0, &SyncView::default());
                let button = h
                    .split("class=\"btn-google\"")
                    .nth(1)
                    .unwrap()
                    .split("</button>")
                    .next()
                    .unwrap();
                assert!(button.contains("data-act=\"google\""));
                assert!(button.contains(&tr(lang, "sync_google")));
                assert!(button.contains("class=\"g-logo\"><svg"));
                assert!(button.contains("aria-hidden=\"true\" focusable=\"false\""));
                for color in ["#4285F4", "#34A853", "#FBBC05", "#EA4335"] {
                    assert!(button.contains(&format!("fill=\"{color}\"")));
                }
            }
        }
    }
}
