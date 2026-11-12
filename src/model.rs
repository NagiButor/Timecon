use chrono::{Datelike, Duration, NaiveDate, Weekday};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

pub const STORAGE_KEY: &str = "timecon.v1";
pub const BUILD: &str = "v34 · Rust";

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub key: String,
    pub name: String,
    pub icon: String,
    pub color: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    #[default]
    Pending,
    Running,
    Ask,
    Done,
    Failed,
}
impl Status {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Running => "running",
            Self::Ask => "ask",
            Self::Done => "done",
            Self::Failed => "failed",
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub minutes: u32,
    pub no_timer: bool,
    pub repeat_id: String,
    #[serde(deserialize_with = "nullable_string")]
    pub cat_id: String,
    pub status: Status,
    pub start_at: Option<String>,
    pub started_at: Option<i64>,
    pub updated_at: i64,
    pub auto_done: bool,
    pub manual: bool,
}
impl Default for Task {
    fn default() -> Self {
        Self {
            id: String::new(),
            title: String::new(),
            minutes: 25,
            no_timer: false,
            repeat_id: String::new(),
            cat_id: String::new(),
            status: Status::Pending,
            start_at: None,
            started_at: None,
            updated_at: 0,
            auto_done: false,
            manual: false,
        }
    }
}
impl Task {
    pub fn timed_minutes(&self) -> u32 {
        if self.no_timer { 0 } else { self.minutes }
    }
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct DailyTask {
    pub id: String,
    pub start_day: String,
    pub stopped_from: Option<String>,
    pub updated_at: i64,
    pub task: Task,
}
impl DailyTask {
    pub fn includes(&self, day: &str) -> bool {
        day >= self.start_day.as_str() && self.stopped_from.as_deref().is_none_or(|end| day < end)
    }
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Run {
    pub task_id: String,
    pub end_at: i64,
    pub started_at: i64,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Block {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub text: String,
    pub lang: String,
    pub src: String,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub icon: String,
    pub updated_at: i64,
    pub blocks: Vec<Block>,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub date: String,
    pub amount: f64,
    pub note: String,
    #[serde(deserialize_with = "nullable_string")]
    pub cat_id: String,
    pub needed: bool,
}
fn nullable_string<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
    Ok(Option::<String>::deserialize(deserializer)?.unwrap_or_default())
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct Pay {
    pub id: String,
    pub day: u32,
    pub amount: f64,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Finance {
    pub cats: Vec<Category>,
    pub incomes: Vec<Entry>,
    pub expenses: Vec<Entry>,
    pub pays: Vec<Pay>,
    pub shift_weekend: bool,
}
impl Default for Finance {
    fn default() -> Self {
        Self {
            cats: [
                ("food", "cart"),
                ("home", "home"),
                ("fun", "star"),
                ("other", "heart"),
            ]
            .into_iter()
            .map(|(n, icon)| Category {
                id: format!("f_{n}"),
                key: format!("fcat_{n}"),
                icon: icon.into(),
                ..Default::default()
            })
            .collect(),
            incomes: vec![],
            expenses: vec![],
            pays: vec![
                Pay {
                    id: "p5".into(),
                    day: 5,
                    amount: 0.0,
                },
                Pay {
                    id: "p20".into(),
                    day: 20,
                    amount: 0.0,
                },
            ],
            shift_weekend: true,
        }
    }
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct State {
    pub v: u32,
    pub lang: String,
    pub theme: String,
    pub currency: String,
    pub cats: Vec<Category>,
    pub presets: BTreeMap<String, Vec<Task>>,
    pub days: BTreeMap<String, Vec<Task>>,
    pub backlog: Vec<Task>,
    pub daily: Vec<DailyTask>,
    pub notes: Vec<Note>,
    pub running: Vec<Run>,
    pub fin: Finance,
    pub auto_cooldown_until: i64,
    // Tombstones also prevent deleted/moved records being resurrected after an offline merge.
    pub deleted: BTreeMap<String, i64>,
}
impl Default for State {
    fn default() -> Self {
        let cats = [
            ("sport", "dumbbell", "#d4af37"),
            ("work", "briefcase", "#e0a458"),
            ("rest", "coffee", "#c2a878"),
            ("study", "book", "#b08968"),
            ("home", "home", "#9caf88"),
        ]
        .into_iter()
        .map(|(n, icon, color)| Category {
            id: format!("c_{n}"),
            key: format!("cat_{n}"),
            icon: icon.into(),
            color: color.into(),
            ..Default::default()
        })
        .collect();
        Self {
            v: 1,
            lang: "ru".into(),
            theme: "dark".into(),
            currency: "RUB".into(),
            cats,
            presets: BTreeMap::new(),
            days: BTreeMap::new(),
            backlog: vec![],
            daily: vec![],
            notes: vec![],
            running: vec![],
            fin: Finance::default(),
            auto_cooldown_until: 0,
            deleted: BTreeMap::new(),
        }
    }
}

impl State {
    pub fn from_json(text: &str) -> Result<Self, String> {
        let mut value: Value = serde_json::from_str(text).map_err(|e| e.to_string())?;
        if !value.is_object() {
            return Err("Expected a Timecon JSON object".into());
        }
        for field in ["days", "presets"] {
            if value.get(field).is_some_and(|v| !v.is_object()) {
                return Err(format!("Invalid {field}"));
            }
        }
        if let Some(running) = value.get_mut("running") {
            if running.is_null() {
                *running = serde_json::json!([]);
            } else if running.is_object() {
                *running = serde_json::json!([running.clone()]);
            }
        }
        if let Some(fin) = value.get_mut("fin").and_then(Value::as_object_mut)
            && !fin.contains_key("pays")
        {
            let amount = fin.get("salary").and_then(Value::as_f64).unwrap_or(0.0);
            let pays: Vec<Value> = fin.get("payDays").and_then(Value::as_array).into_iter().flatten()
                    .filter_map(|d| d.as_u64()).filter(|d| (1..=31).contains(d))
                    .map(|day| serde_json::json!({"id": format!("legacy-{day}"), "day":day, "amount":amount})).collect();
            fin.insert("pays".into(), Value::Array(pays));
        }
        let mut state: Self = serde_json::from_value(value).map_err(|e| e.to_string())?;
        for cat in &mut state.cats {
            cat.color = match cat.color.as_str() {
                "#9ece6a" => "#d4af37",
                "#7aa2f7" => "#e0a458",
                "#e0af68" => "#c2a878",
                "#bb9af7" => "#b08968",
                "#73daca" => "#9caf88",
                other => other,
            }
            .into();
        }
        state.reconcile();
        Ok(state)
    }
    pub fn task(&self, id: &str) -> Option<&Task> {
        self.days.values().flatten().find(|t| t.id == id)
    }
    pub fn task_mut(&mut self, id: &str) -> Option<&mut Task> {
        self.days.values_mut().flatten().find(|t| t.id == id)
    }
    pub fn add_task(&mut self, day: &str, task: Task) {
        self.days.entry(day.into()).or_default().push(task);
    }
    pub fn add_daily_task(&mut self, day: &str, task: Task) {
        self.daily.push(DailyTask {
            id: task.id.clone(),
            start_day: day.into(),
            updated_at: task.updated_at,
            task,
            ..Default::default()
        });
        self.ensure_day(day);
    }
    pub fn ensure_day(&mut self, day: &str) -> bool {
        if self.daily.is_empty() || NaiveDate::parse_from_str(day, "%Y-%m-%d").is_err() {
            return false;
        }
        let existing: BTreeSet<_> = self
            .days
            .values()
            .flatten()
            .chain(self.backlog.iter())
            .map(|task| task.id.as_str())
            .collect();
        let mut added = vec![];
        for series in self.daily.iter().filter(|series| series.includes(day)) {
            // Both devices generate the same occurrence, even while offline.
            let id = format!("daily-{}-{day}", series.id);
            if existing.contains(id.as_str()) || self.deleted.contains_key(&id) {
                continue;
            }
            let mut task = series.task.clone();
            task.id = id;
            task.repeat_id = series.id.clone();
            task.status = Status::Pending;
            task.started_at = None;
            task.updated_at = series.task.updated_at;
            task.auto_done = false;
            task.manual = false;
            added.push(task);
        }
        let changed = !added.is_empty();
        if changed {
            self.days.entry(day.into()).or_default().extend(added);
        }
        changed
    }
    pub fn stop_daily_task(&mut self, id: &str, from: &str, now: i64) {
        if let Some(series) = self.daily.iter_mut().find(|series| series.id == id) {
            if series
                .stopped_from
                .as_deref()
                .is_some_and(|end| end <= from)
            {
                return;
            }
            series.stopped_from = Some(from.into());
            series.updated_at = now;
            self.reconcile();
        }
    }
    pub fn start_task(&mut self, id: &str, now: i64) -> bool {
        if self.running.iter().any(|r| r.task_id == id) {
            return false;
        }
        let Some(task) = self
            .task_mut(id)
            .filter(|t| t.status == Status::Pending && !t.no_timer)
        else {
            return false;
        };
        task.status = Status::Running;
        task.started_at = Some(now);
        task.updated_at = now;
        task.manual = false;
        let end_at = now + i64::from(task.minutes) * 60_000;
        self.running.push(Run {
            task_id: id.into(),
            end_at,
            started_at: now,
        });
        true
    }
    pub fn cancel_task(&mut self, id: &str, now: i64) {
        if !self.running.iter().any(|r| r.task_id == id) {
            return;
        }
        self.running.retain(|r| r.task_id != id);
        if let Some(task) = self.task_mut(id) {
            task.status = Status::Pending;
            task.started_at = None;
            task.auto_done = true;
            task.updated_at = now;
        }
        self.auto_cooldown_until = now + 120_000;
    }
    pub fn finish_now(&mut self, id: &str, now: i64) {
        if let Some(t) = self.task_mut(id).filter(|t| t.status == Status::Pending) {
            t.status = Status::Done;
            t.started_at = None;
            t.manual = !t.no_timer;
            t.updated_at = now;
        }
    }
    pub fn expire(&mut self, now: i64) -> Vec<String> {
        let expired: Vec<_> = self
            .running
            .iter()
            .filter(|r| r.end_at <= now)
            .map(|r| r.task_id.clone())
            .collect();
        let mut titles = vec![];
        for id in &expired {
            if let Some(t) = self.task_mut(id) {
                t.status = Status::Ask;
                t.updated_at = now;
                titles.push(t.title.clone());
            }
        }
        self.running.retain(|r| !expired.contains(&r.task_id));
        titles
    }
    pub fn delete_task(&mut self, id: &str, now: i64) {
        if self.task(id).is_some_and(|t| t.status == Status::Running) {
            return;
        }
        for list in self.days.values_mut() {
            list.retain(|t| t.id != id);
        }
        self.backlog.retain(|t| t.id != id);
        self.deleted.insert(id.into(), now);
    }
    pub fn move_task(&mut self, id: &str, target: Option<&str>, now: i64) {
        let mut found = None;
        for list in self.days.values_mut() {
            if let Some(i) = list
                .iter()
                .position(|t| t.id == id && t.status == Status::Pending)
            {
                found = Some(list.remove(i));
                break;
            }
        }
        if let Some(mut task) = found {
            task.updated_at = now;
            task.auto_done = false;
            if let Some(day) = target {
                self.add_task(day, task);
            } else {
                self.backlog.push(task);
            }
        }
    }
    pub fn reconcile(&mut self) {
        // Remove only untouched future occurrences when a series is stopped.
        // Completed days and running timers remain part of the history.
        for list in self.days.values_mut() {
            list.retain(|task| {
                task.status != Status::Pending
                    || !self.daily.iter().any(|series| {
                        task.repeat_id == series.id
                            && series.stopped_from.as_deref().is_some_and(|end| {
                                task.id
                                    .strip_prefix(&format!("daily-{}-", series.id))
                                    .is_some_and(|day| day >= end)
                            })
                    })
            });
        }
        let ids: BTreeSet<_> = self.running.iter().map(|r| r.task_id.clone()).collect();
        for task in self
            .days
            .values_mut()
            .flatten()
            .chain(self.backlog.iter_mut())
            .chain(self.presets.values_mut().flatten())
            .chain(self.daily.iter_mut().map(|series| &mut series.task))
        {
            if task.no_timer {
                task.minutes = 0;
                task.start_at = None;
                task.started_at = None;
                task.auto_done = false;
                task.manual = false;
                if matches!(task.status, Status::Running | Status::Ask) {
                    task.status = Status::Pending;
                }
            }
            if task.status == Status::Running && !ids.contains(&task.id) {
                task.status = Status::Pending;
                task.started_at = None;
            }
        }
        let running: BTreeSet<_> = self
            .days
            .values()
            .flatten()
            .filter(|t| t.status == Status::Running)
            .map(|t| t.id.clone())
            .collect();
        self.running.retain(|r| running.contains(&r.task_id));
    }
    pub fn merge(&self, remote: &Self) -> Self {
        let mut out = remote.clone();
        out.lang = self.lang.clone();
        out.theme = self.theme.clone();
        out.currency = self.currency.clone();
        for (id, ts) in &self.deleted {
            out.deleted
                .entry(id.clone())
                .and_modify(|v| *v = (*v).max(*ts))
                .or_insert(*ts);
        }
        // A task has one location; merging per-day would duplicate moved tasks.
        let mut tasks: BTreeMap<String, (Option<String>, Task)> = BTreeMap::new();
        let mut order = vec![];
        for state in [self, remote] {
            for (day, list) in &state.days {
                for task in list {
                    insert_task(&mut tasks, &mut order, Some(day.clone()), task);
                }
            }
            for task in &state.backlog {
                insert_task(&mut tasks, &mut order, None, task);
            }
        }
        out.days.clear();
        out.backlog.clear();
        for id in order {
            let (day, task) = tasks.remove(&id).unwrap();
            if out
                .deleted
                .get(&id)
                .is_some_and(|ts| *ts >= task.updated_at)
            {
                continue;
            }
            if let Some(day) = day {
                out.add_task(&day, task);
            } else {
                out.backlog.push(task);
            }
        }
        out.notes = union(&self.notes, &remote.notes, |n| &n.id, |n| n.updated_at);
        out.notes
            .retain(|n| !out.deleted.get(&n.id).is_some_and(|ts| *ts >= n.updated_at));
        out.cats = union(&self.cats, &remote.cats, |c| &c.id, |_| 0);
        out.fin.cats = union(&self.fin.cats, &remote.fin.cats, |c| &c.id, |_| 0);
        out.fin.incomes = union(&self.fin.incomes, &remote.fin.incomes, |e| &e.id, |_| 0);
        out.fin.expenses = union(&self.fin.expenses, &remote.fin.expenses, |e| &e.id, |_| 0);
        out.fin.pays = union(&self.fin.pays, &remote.fin.pays, |p| &p.id, |_| 0);
        out.cats.retain(|x| !out.deleted.contains_key(&x.id));
        out.fin.cats.retain(|x| !out.deleted.contains_key(&x.id));
        out.fin.incomes.retain(|x| !out.deleted.contains_key(&x.id));
        out.fin
            .expenses
            .retain(|x| !out.deleted.contains_key(&x.id));
        out.fin.pays.retain(|x| !out.deleted.contains_key(&x.id));
        out.fin.shift_weekend = self.fin.shift_weekend;
        out.presets.extend(self.presets.clone());
        out.presets
            .retain(|day, _| !out.deleted.contains_key(&format!("preset-{day}")));
        out.running = union(
            &self.running,
            &remote.running,
            |r| &r.task_id,
            |r| r.started_at,
        );
        out.auto_cooldown_until = self.auto_cooldown_until.max(remote.auto_cooldown_until);
        out.daily = union(&self.daily, &remote.daily, |s| &s.id, |s| s.updated_at);
        out.reconcile();
        out
    }
    pub fn csv(&self) -> String {
        let mut rows = vec![vec![
            "type".into(),
            "date".into(),
            "title_or_note".into(),
            "amount_or_minutes".into(),
            "category".into(),
            "status".into(),
        ]];
        for (day, list) in &self.days {
            for t in list {
                rows.push(vec![
                    "task".into(),
                    day.clone(),
                    t.title.clone(),
                    if t.no_timer {
                        String::new()
                    } else {
                        t.minutes.to_string()
                    },
                    self.category_label(&t.cat_id, false),
                    t.status.as_str().into(),
                ]);
            }
        }
        for (kind, list) in [
            ("income", &self.fin.incomes),
            ("expense", &self.fin.expenses),
        ] {
            for e in list {
                rows.push(vec![
                    kind.into(),
                    e.date.clone(),
                    e.note.clone(),
                    e.amount.to_string(),
                    self.category_label(&e.cat_id, true),
                    if kind == "expense" {
                        if e.needed { "needed" } else { "unneeded" }
                    } else {
                        ""
                    }
                    .into(),
                ]);
            }
        }
        for n in &self.notes {
            rows.push(vec![
                "note".into(),
                String::new(),
                n.title.clone(),
                n.blocks.len().to_string(),
                String::new(),
                String::new(),
            ]);
            for b in &n.blocks {
                rows.push(vec![
                    format!("note_{}", b.kind),
                    String::new(),
                    b.text.clone(),
                    String::new(),
                    b.lang.clone(),
                    String::new(),
                ]);
            }
        }
        format!(
            "\u{feff}{}",
            rows.into_iter()
                .map(|r| r
                    .into_iter()
                    .map(|v| {
                        // Neutralize spreadsheet formulas in user-controlled text.
                        let v = if v.starts_with(['=', '+', '-', '@', '\t', '\r']) {
                            format!("'{v}")
                        } else {
                            v
                        };
                        format!("\"{}\"", v.replace('"', "\"\""))
                    })
                    .collect::<Vec<_>>()
                    .join(","))
                .collect::<Vec<_>>()
                .join("\r\n")
        )
    }
    pub fn category_label(&self, id: &str, finance: bool) -> String {
        let list = if finance { &self.fin.cats } else { &self.cats };
        list.iter()
            .find(|c| c.id == id)
            .map(|c| {
                if c.key.is_empty() {
                    c.name.clone()
                } else {
                    crate::view::tr(&self.lang, &c.key)
                }
            })
            .unwrap_or_else(|| "—".into())
    }
}
fn insert_task(
    map: &mut BTreeMap<String, (Option<String>, Task)>,
    order: &mut Vec<String>,
    day: Option<String>,
    task: &Task,
) {
    if !map.contains_key(&task.id) {
        order.push(task.id.clone());
    }
    if map
        .get(&task.id)
        .is_none_or(|(_, old)| task.updated_at > old.updated_at)
    {
        map.insert(task.id.clone(), (day, task.clone()));
    }
}
fn union<T: Clone>(
    local: &[T],
    remote: &[T],
    id: impl Fn(&T) -> &String,
    ts: impl Fn(&T) -> i64,
) -> Vec<T> {
    let mut out: Vec<T> = remote.to_vec();
    for x in local {
        if let Some(i) = out.iter().position(|v| id(v) == id(x)) {
            if ts(x) >= ts(&out[i]) {
                out[i] = x.clone();
            }
        } else {
            out.push(x.clone());
        }
    }
    out
}
pub fn date(key: &str) -> NaiveDate {
    NaiveDate::parse_from_str(key, "%Y-%m-%d")
        .unwrap_or_else(|_| NaiveDate::from_ymd_opt(2026, 1, 1).unwrap())
}
pub fn add_days(key: &str, n: i64) -> String {
    (date(key) + Duration::days(n.clamp(-366_000, 366_000))).to_string()
}
pub fn shift_month(month: &str, n: i32) -> String {
    let d = date(&format!("{month}-01"));
    let total = d.year() * 12 + d.month0() as i32 + n;
    format!(
        "{:04}-{:02}",
        total.div_euclid(12),
        total.rem_euclid(12) + 1
    )
}
pub fn paydates(fin: &Finance, month: &str) -> Vec<(String, f64)> {
    let start = date(&format!("{month}-01"));
    let last = date(&format!("{}-01", shift_month(month, 1))) - Duration::days(1);
    let mut out = vec![];
    for pay in &fin.pays {
        if !(1..=31).contains(&pay.day) {
            continue;
        }
        let mut d = start.with_day(pay.day.min(last.day())).unwrap();
        if fin.shift_weekend {
            d -= Duration::days(match d.weekday() {
                Weekday::Sat => 1,
                Weekday::Sun => 2,
                _ => 0,
            });
        }
        if d.format("%Y-%m").to_string() == month {
            out.push((d.to_string(), pay.amount));
        }
    }
    out.sort_by(|a, b| a.0.cmp(&b.0));
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    fn task(id: &str, ts: i64) -> Task {
        Task {
            id: id.into(),
            title: "test".into(),
            updated_at: ts,
            ..Default::default()
        }
    }
    #[test]
    fn migrates_single_timer_and_salary() {
        let s = State::from_json(r#"{"running":{"taskId":"a","endAt":900,"startedAt":1},"days":{"2026-11-10":[{"id":"a","status":"running"}]},"fin":{"payDays":[5,20],"salary":100}}"#).unwrap();
        assert_eq!(s.running.len(), 1);
        assert_eq!(s.fin.pays[1].amount, 100.0);
    }
    #[test]
    fn timers_are_concurrent_and_wall_clock_based() {
        let mut s = State::default();
        s.add_task("2026-11-10", task("a", 1));
        s.add_task("2026-11-10", task("b", 1));
        assert!(s.start_task("a", 10));
        assert!(s.start_task("b", 10));
        assert!(!s.start_task("a", 10));
        assert_eq!(s.expire(1_500_010).len(), 2);
        assert!(s.running.is_empty());
        assert_eq!(s.task("a").unwrap().status, Status::Ask);
    }
    #[test]
    fn plain_tasks_complete_move_and_sync_without_timers() {
        let mut local = State::default();
        local.add_task(
            "2026-11-10",
            Task {
                no_timer: true,
                minutes: 0,
                ..task("a", 1)
            },
        );
        assert!(!local.start_task("a", 2));
        assert!(local.running.is_empty());
        local.move_task("a", None, 3);
        let mut remote = State::from_json(&serde_json::to_string(&local).unwrap()).unwrap();
        let moved = remote.backlog.remove(0);
        assert!(moved.no_timer);
        remote.add_task("2026-11-11", moved);
        remote.finish_now("a", 4);
        let merged = local.merge(&remote);
        let done = merged.task("a").unwrap();
        assert_eq!(done.status, Status::Done);
        assert!(done.no_timer);
        assert_eq!(done.timed_minutes(), 0);
        assert!(!done.manual);
        assert!(done.started_at.is_none());
        assert!(merged.running.is_empty());
        assert!(merged.backlog.is_empty());
        assert!(merged.csv().contains("\"test\",\"\""));
    }
    #[test]
    fn imports_preserve_legacy_timers_and_clear_plain_task_timer_state() {
        let state = State::from_json(
            r#"{"days":{"2026-11-10":[{"id":"legacy","minutes":45},{"id":"plain","noTimer":true,"minutes":30,"startAt":"12:00","startedAt":1,"status":"running"}]},"running":[{"taskId":"plain","startedAt":1,"endAt":999999}],"presets":{"1":[{"noTimer":true,"minutes":25,"startAt":"12:00"}]},"backlog":[{"noTimer":true,"status":"ask"}]}"#,
        )
        .unwrap();
        assert!(!state.task("legacy").unwrap().no_timer);
        assert_eq!(state.task("legacy").unwrap().minutes, 45);
        let plain = state.task("plain").unwrap();
        assert_eq!(plain.status, Status::Pending);
        assert_eq!(plain.minutes, 0);
        assert!(plain.start_at.is_none());
        assert!(plain.started_at.is_none());
        assert!(state.running.is_empty());
        assert!(state.presets["1"][0].no_timer);
        assert!(state.presets["1"][0].start_at.is_none());
        assert_eq!(state.backlog[0].status, Status::Pending);
    }
    #[test]
    fn daily_tasks_have_independent_days_and_survive_import() {
        let mut state = State::default();
        let mut daily = task("daily", 1);
        daily.start_at = Some("08:00".into());
        state.add_daily_task("2026-12-31", daily);
        assert!(!state.ensure_day("2026-12-30"));
        assert!(!state.ensure_day("2026-12-31"));
        let first = state.days["2026-12-31"][0].id.clone();
        state.start_task(&first, 2);
        state.expire(1_500_002);
        state.task_mut(&first).unwrap().status = Status::Done;
        assert!(state.ensure_day("2027-01-01"));
        let next = &state.days["2027-01-01"][0];
        assert_eq!(next.status, Status::Pending);
        assert_eq!(next.repeat_id, "daily");
        assert_eq!(next.minutes, 25);
        assert_eq!(next.start_at.as_deref(), Some("08:00"));
        assert!(next.started_at.is_none());
        assert!(!next.manual);
        assert!(!next.auto_done);
        assert_eq!(state.task(&first).unwrap().status, Status::Done);
        let mut imported = State::from_json(&serde_json::to_string(&state).unwrap()).unwrap();
        assert_eq!(state, imported);
        assert!(imported.ensure_day("2030-06-01"));
        assert_eq!(imported.days["2030-06-01"].len(), 1);
    }
    #[test]
    fn daily_deletion_and_moves_do_not_recreate_occurrences() {
        let mut state = State::default();
        state.add_daily_task("2026-11-12", task("daily", 1));
        let id = state.days["2026-11-12"][0].id.clone();
        state.delete_task(&id, 2);
        assert!(!state.ensure_day("2026-11-12"));
        assert!(state.ensure_day("2026-11-13"));
        let id = state.days["2026-11-13"][0].id.clone();
        state.move_task(&id, None, 3);
        assert!(!state.ensure_day("2026-11-13"));
        assert_eq!(state.backlog.len(), 1);
        let moved = state.backlog.remove(0);
        state.add_task("2026-11-14", moved);
        assert!(!state.ensure_day("2026-11-13"));
        assert!(state.ensure_day("2026-11-14"));
        assert_eq!(state.days["2026-11-14"].len(), 2);
    }
    #[test]
    fn daily_offline_merge_deduplicates_and_keeps_completions() {
        let mut local = State::default();
        local.add_daily_task("2026-11-12", task("daily", 1));
        let mut remote = local.clone();
        local.ensure_day("2026-11-13");
        remote.ensure_day("2026-11-13");
        let id = remote.days["2026-11-13"][0].id.clone();
        remote.finish_now(&id, 3);
        let mut merged = local.merge(&remote);
        assert_eq!(merged.daily.len(), 1);
        assert_eq!(merged.days["2026-11-13"].len(), 1);
        assert_eq!(merged.task(&id).unwrap().status, Status::Done);
        assert!(!merged.ensure_day("2026-11-13"));
    }
    #[test]
    fn stopping_daily_tasks_survives_stale_sync_and_preserves_history() {
        let mut local = State::default();
        local.add_daily_task("2026-11-12", task("daily", 1));
        for day in ["2026-11-13", "2026-11-14", "2026-11-15"] {
            local.ensure_day(day);
        }
        let completed = local.days["2026-11-12"][0].id.clone();
        local.finish_now(&completed, 2);
        let mut remote = local.clone();
        remote.stop_daily_task("daily", "2026-11-13", 3);
        for mut merged in [local.merge(&remote), remote.merge(&local)] {
            assert_eq!(merged.task(&completed).unwrap().status, Status::Done);
            assert!(merged.days["2026-11-13"].is_empty());
            assert!(merged.days["2026-11-14"].is_empty());
            assert!(!merged.ensure_day("2026-11-15"));
            assert!(!merged.ensure_day("2027-01-01"));
            assert!(!merged.ensure_day("2026-11-12"));
        }
    }
    #[test]
    fn stopping_does_not_make_new_copies_overwrite_completed_days() {
        let mut local = State::default();
        local.add_daily_task("2026-11-12", task("daily", 1));
        let mut remote = local.clone();
        local.ensure_day("2026-11-13");
        let id = local.days["2026-11-13"][0].id.clone();
        local.finish_now(&id, 2);
        remote.stop_daily_task("daily", "2026-11-14", 3);
        remote.ensure_day("2026-11-13");
        assert_eq!(local.merge(&remote).task(&id).unwrap().status, Status::Done);
        assert_eq!(remote.merge(&local).task(&id).unwrap().status, Status::Done);
    }
    #[test]
    fn cancellation_sets_cooldown() {
        let mut s = State::default();
        s.add_task("d", task("a", 1));
        s.start_task("a", 100);
        s.cancel_task("a", 200);
        assert_eq!(s.auto_cooldown_until, 120200);
        assert!(s.task("a").unwrap().auto_done);
    }
    #[test]
    fn merge_moves_without_duplicates_and_keeps_latest_verdict() {
        let mut a = State::default();
        a.add_task("2026-11-10", task("a", 1));
        let mut b = a.clone();
        b.move_task("a", Some("2026-11-11"), 100);
        let s = a.merge(&b);
        assert_eq!(s.days.values().map(Vec::len).sum::<usize>(), 1);
        assert_eq!(s.days["2026-11-11"][0].id, "a");
    }
    #[test]
    fn tombstone_prevents_resurrection() {
        let mut a = State::default();
        a.add_task("d", task("a", 1));
        let b = a.clone();
        a.delete_task("a", 10);
        assert!(a.merge(&b).task("a").is_none());
    }
    #[test]
    fn newer_verdict_wins_over_stale_running_copy() {
        let mut local = State::default();
        local.add_task("d", task("a", 1));
        local.start_task("a", 2);
        let mut remote = local.clone();
        remote.running.clear();
        let t = remote.task_mut("a").unwrap();
        t.status = Status::Done;
        t.updated_at = 100;
        let merged = local.merge(&remote);
        assert_eq!(merged.task("a").unwrap().status, Status::Done);
        assert!(merged.running.is_empty());
    }
    #[test]
    fn merge_preserves_local_manual_order() {
        let mut local = State::default();
        for id in ["b", "a"] {
            local.add_task("d", task(id, 1));
        }
        let mut remote = local.clone();
        remote.days.get_mut("d").unwrap().reverse();
        let merged = local.merge(&remote);
        assert_eq!(
            merged.days["d"]
                .iter()
                .map(|t| t.id.as_str())
                .collect::<Vec<_>>(),
            vec!["b", "a"]
        );
    }
    #[test]
    fn removes_orphaned_and_duplicate_timer_states() {
        let mut state = State::default();
        let mut orphan = task("a", 1);
        orphan.status = Status::Running;
        state.add_task("d", orphan);
        state.running.push(Run {
            task_id: "missing".into(),
            end_at: 100,
            started_at: 1,
        });
        state.reconcile();
        assert!(state.running.is_empty());
        assert_eq!(state.task("a").unwrap().status, Status::Pending);
    }
    #[test]
    fn existing_json_roundtrips_without_data_loss() {
        let mut state = State::default();
        state.add_task("2026-11-10", task("a", 1));
        state.notes.push(Note {
            id: "n".into(),
            title: "Заметка".into(),
            blocks: vec![Block {
                id: "b".into(),
                kind: "code".into(),
                text: "fn main() {}".into(),
                ..Default::default()
            }],
            ..Default::default()
        });
        assert_eq!(
            State::from_json(&serde_json::to_string(&state).unwrap()).unwrap(),
            state
        );
    }
    #[test]
    fn imports_tasks_without_a_selected_category() {
        let state = State::from_json(r#"{"days":{"2026-11-10":[{"id":"a","catId":null}]},"fin":{"expenses":[{"id":"e","catId":null}]}}"#).unwrap();
        assert!(state.task("a").unwrap().cat_id.is_empty());
        assert!(state.fin.expenses[0].cat_id.is_empty());
    }
    #[test]
    fn pays_clamp_and_shift_weekends() {
        let f = Finance {
            pays: vec![Pay {
                id: "p".into(),
                day: 31,
                amount: 100.0,
            }],
            ..Default::default()
        };
        assert_eq!(paydates(&f, "2026-02"), vec![("2026-02-27".into(), 100.0)]);
    }
    #[test]
    fn dates_cross_year_and_leap_day() {
        assert_eq!(add_days("2024-02-28", 1), "2024-02-29");
        assert_eq!(shift_month("2026-01", -1), "2025-12");
    }
    #[test]
    fn import_rejects_bad_shape() {
        assert!(State::from_json("[]").is_err());
        assert!(State::from_json(r#"{"days":[]}"#).is_err());
    }
    #[test]
    fn csv_escapes_quotes_and_formulas() {
        let mut s = State::default();
        let mut t = task("a", 0);
        t.title = "=HYPERLINK(\"x\")".into();
        s.add_task("d", t);
        assert!(s.csv().contains("' =").not());
        assert!(s.csv().contains("'=HYPERLINK(\"\"x\"\")"));
    }
    use std::ops::Not;
}
