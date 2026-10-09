const KEY = 'timecon.v1';
const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const weekdayOf = (k) => parseKey(k).getDay();
const monthOf = (k) => k.slice(0, 7);
const shiftMonth = (m, n) => { const d = new Date(+m.slice(0, 4), +m.slice(5) - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const sum = (a) => a.reduce((s, x) => s + x, 0);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CAT_ICONS = ['dumbbell', 'briefcase', 'coffee', 'book', 'home', 'cart', 'heart', 'star', 'code', 'music', 'moon', 'phone'];
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const CUR = { RUB: '₽', USD: '$', EUR: '€', KZT: '₸', UAH: '₴', BYN: 'Br', GBP: '£' };

const T = {
  ru: {
    tasks: 'Задачи', stats: 'Статистика', finance: 'Финансы', settings: 'Настройки',
    today: 'Сегодня', sort: 'Сортировка', sort_manual: 'Как добавлены', sort_cat: 'По категории', sort_status: 'По статусу', sort_time: 'По времени',
    no_tasks: 'На этот день задач нет', task_title: 'Название задачи', minutes: 'Минут', min: 'мин', category: 'Категория', add: 'Добавить',
    preset_for: 'Пресет на', apply_preset: 'Применить к дню', save_preset: 'Сохранить день как пресет', clear_preset: 'Очистить пресет',
    backlog: 'На потом', to_day: 'На этот день', start: 'Старт', ask_q: 'Время вышло. Задача выполнена?',
    verdict_done: 'Выполнено', verdict_failed: 'Не выполнено', restore: 'Вернуть в работу', move: 'Перенести', ok: 'ОК',
    tomorrow: 'Завтра', after_tomorrow: 'Послезавтра', in_week: 'Через неделю', pick_date: 'Выбрать дату', later: 'На потом',
    delete: 'Удалить', timer_done: 'Время вышло', busy: 'Сначала дождись окончания текущего таймера',
    period_day: 'День', period_week: 'Неделя', period_month: 'Месяц', period_all: 'Всё время',
    total_time: 'Время выполненных задач', done_count: 'Выполнено', failed_count: 'Не выполнено', completion: 'Выполнение',
    by_task: 'По задачам', by_cat: 'По категориям', no_data: 'Нет данных', none: 'Пусто',
    income: 'Доходы', expenses: 'Расходы', savings: 'Экономия', efficiency: 'Доля экономии', unneeded: 'Ненужные траты', unneeded_share: 'Доля ненужных',
    next_payday: 'Следующая зарплата', add_income: 'Добавить доход', add_expense: 'Добавить трату', amount: 'Сумма', date: 'Дата', note: 'Заметка',
    needed: 'Нужная трата', cat_fin: 'Категория', save: 'Сохранить',
    language: 'Язык', theme: 'Тема', dark: 'Тёмная', light: 'Светлая', currency: 'Валюта',
    pay_days: 'Дни зарплаты (через запятую)', salary: 'Сумма на каждую выплату', shift_weekend: 'Если день выходной, платят раньше (в пятницу)',
    categories: 'Категории задач', fin_categories: 'Категории расходов', add_cat: 'Добавить категорию', name: 'Название', data: 'Данные',
    export_json: 'Экспорт JSON (бэкап)', import_json: 'Импорт JSON', export_csv: 'Экспорт CSV',
    sync_title: 'Синхронизация', sync_not_config: 'Синхронизация не настроена: заполни app/config.js (см. README.md).',
    sync_in: 'Вход выполнен', sync_email: 'Почта', sync_send: 'Получить код', sync_code: 'Код из письма', sync_verify: 'Войти',
    sync_sent: 'Код отправлен на почту. Введи его ниже.', sync_fail: 'Ошибка синхронизации. Проверь интернет.', sync_bad_code: 'Неверный код',
    sync_now: 'Синхронизировать сейчас', sync_out: 'Выйти',
    sync_hint: 'При входе на новом устройстве данные с сервера заменят локальные, если там уже есть данные.',
    d: 'д', h: 'ч',
    wd: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    cat_sport: 'Спорт', cat_work: 'Работа', cat_rest: 'Отдых', cat_study: 'Учёба', cat_home: 'Дом',
    fcat_food: 'Еда', fcat_home: 'Жильё', fcat_fun: 'Развлечения', fcat_other: 'Прочее',
  },
  en: {
    tasks: 'Tasks', stats: 'Stats', finance: 'Finance', settings: 'Settings',
    today: 'Today', sort: 'Sort', sort_manual: 'As added', sort_cat: 'By category', sort_status: 'By status', sort_time: 'By duration',
    no_tasks: 'No tasks for this day', task_title: 'Task title', minutes: 'Minutes', min: 'min', category: 'Category', add: 'Add',
    preset_for: 'Preset for', apply_preset: 'Apply to day', save_preset: 'Save day as preset', clear_preset: 'Clear preset',
    backlog: 'Later', to_day: 'To this day', start: 'Start', ask_q: 'Time is up. Was the task done?',
    verdict_done: 'Done', verdict_failed: 'Not done', restore: 'Back to work', move: 'Move', ok: 'OK',
    tomorrow: 'Tomorrow', after_tomorrow: 'Day after tomorrow', in_week: 'In a week', pick_date: 'Pick a date', later: 'Later',
    delete: 'Delete', timer_done: 'Time is up', busy: 'Wait for the current timer to finish first',
    period_day: 'Day', period_week: 'Week', period_month: 'Month', period_all: 'All time',
    total_time: 'Time on done tasks', done_count: 'Done', failed_count: 'Not done', completion: 'Completion',
    by_task: 'By task', by_cat: 'By category', no_data: 'No data', none: 'Empty',
    income: 'Income', expenses: 'Expenses', savings: 'Savings', efficiency: 'Savings rate', unneeded: 'Unneeded spending', unneeded_share: 'Unneeded share',
    next_payday: 'Next pay day', add_income: 'Add income', add_expense: 'Add expense', amount: 'Amount', date: 'Date', note: 'Note',
    needed: 'Necessary', cat_fin: 'Category', save: 'Save',
    language: 'Language', theme: 'Theme', dark: 'Dark', light: 'Light', currency: 'Currency',
    pay_days: 'Pay days (comma separated)', salary: 'Amount per payment', shift_weekend: 'If the day is a weekend, pay is moved earlier (Friday)',
    categories: 'Task categories', fin_categories: 'Expense categories', add_cat: 'Add category', name: 'Name', data: 'Data',
    export_json: 'Export JSON (backup)', import_json: 'Import JSON', export_csv: 'Export CSV',
    sync_title: 'Sync', sync_not_config: 'Sync is not set up: fill in app/config.js (see README.md).',
    sync_in: 'Signed in', sync_email: 'Email', sync_send: 'Get code', sync_code: 'Code from email', sync_verify: 'Sign in',
    sync_sent: 'Code sent to your email. Enter it below.', sync_fail: 'Sync error. Check your connection.', sync_bad_code: 'Wrong code',
    sync_now: 'Sync now', sync_out: 'Sign out',
    sync_hint: 'When signing in on a new device, server data replaces local data if the server already has data.',
    d: 'd', h: 'h',
    wd: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    cat_sport: 'Sport', cat_work: 'Work', cat_rest: 'Rest', cat_study: 'Study', cat_home: 'Home',
    fcat_food: 'Food', fcat_home: 'Housing', fcat_fun: 'Fun', fcat_other: 'Other',
  },
};

function defaults() {
  return {
    v: 1, lang: 'ru', theme: 'dark', currency: 'RUB',
    cats: [
      { id: 'c_sport', key: 'cat_sport', icon: 'dumbbell', color: '#9ece6a' },
      { id: 'c_work', key: 'cat_work', icon: 'briefcase', color: '#7aa2f7' },
      { id: 'c_rest', key: 'cat_rest', icon: 'coffee', color: '#e0af68' },
      { id: 'c_study', key: 'cat_study', icon: 'book', color: '#bb9af7' },
      { id: 'c_home', key: 'cat_home', icon: 'home', color: '#73daca' },
    ],
    presets: {},
    days: {},
    backlog: [],
    running: null,
    fin: {
      cats: [
        { id: 'f_food', key: 'fcat_food', icon: 'cart' },
        { id: 'f_home', key: 'fcat_home', icon: 'home' },
        { id: 'f_fun', key: 'fcat_fun', icon: 'star' },
        { id: 'f_other', key: 'fcat_other', icon: 'heart' },
      ],
      incomes: [], expenses: [], payDays: [5, 20], salary: 0, shiftWeekend: true,
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch (e) { /* повреждённые данные — начинаем заново */ }
  return defaults();
}
let S = load();
const ui = { view: 'tasks', day: keyOf(new Date()), sort: 'manual', period: 'day', month: keyOf(new Date()).slice(0, 7), moveId: null };

function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function persist() { save(); render(); schedulePush(); }

function t(k) { return (T[S.lang] && T[S.lang][k]) ?? T.ru[k] ?? k; }
function locale() { return S.lang === 'ru' ? 'ru-RU' : 'en-US'; }
function money(n) { return `${Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: 2 })} ${CUR[S.currency] || S.currency}`; }
function label(c) { return !c ? '—' : (c.key ? t(c.key) : c.name); }
function catById(id) { return S.cats.find((c) => c.id === id); }
function finCat(id) { return S.fin.cats.find((c) => c.id === id); }
function fmtDur(min) {
  min = Math.round(min);
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  const p = [];
  if (d) p.push(d + t('d'));
  if (h) p.push(h + t('h'));
  if (m || !p.length) p.push(m + t('min'));
  return p.join(' ');
}
function fmtClock(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
function fmtDate(k) { return parseKey(k).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }); }
function findTask(id) {
  for (const k in S.days) {
    const x = S.days[k].find((y) => y.id === id);
    if (x) return { task: x, key: k };
  }
  return null;
}

function monthPaydates(m) {
  const [y, mo] = m.split('-').map(Number);
  const dim = new Date(y, mo, 0).getDate();
  const res = [];
  for (const d0 of [...new Set(S.fin.payDays)]) {
    const date = new Date(y, mo - 1, Math.min(d0, dim));
    if (S.fin.shiftWeekend) {
      const w = date.getDay();
      if (w === 6) date.setDate(date.getDate() - 1);
      else if (w === 0) date.setDate(date.getDate() - 2);
    }
    res.push(keyOf(date));
  }
  return res.filter((k) => monthOf(k) === m).sort();
}
function nextPayday() {
  const today = keyOf(new Date());
  let m = monthOf(today);
  for (let i = 0; i < 3; i++) {
    const c = monthPaydates(m).find((k) => k >= today);
    if (c) return c;
    m = shiftMonth(m, 1);
  }
  return null;
}

function agg(list, keyFn, labelFn, valFn) {
  const map = new Map();
  list.forEach((x) => {
    const k = keyFn(x);
    const e = map.get(k) || { key: k, label: labelFn(x), val: 0, n: 0 };
    e.val += valFn(x);
    e.n++;
    map.set(k, e);
  });
  return [...map.values()].sort((a, b) => b.val - a.val);
}
const bars = (rows, fmt, ic) => rows.length
  ? rows.map((r) => `<div class="bar-row"><div class="bar-l">${ic ? ic(r.key) : ''}<span>${esc(r.label)}</span><small>${fmt(r.val)} · ×${r.n}</small></div><div class="bar"><i style="width:${rows[0].val ? Math.round(r.val / rows[0].val * 100) : 0}%"></i></div></div>`).join('')
  : `<p class="empty">${t('no_data')}</p>`;

function sortTasks(list) {
  const order = { pending: 0, running: 1, ask: 2, done: 3, failed: 4 };
  const arr = [...list];
  if (ui.sort === 'cat') arr.sort((a, b) => S.cats.findIndex((c) => c.id === a.catId) - S.cats.findIndex((c) => c.id === b.catId));
  if (ui.sort === 'status') arr.sort((a, b) => order[a.status] - order[b.status]);
  if (ui.sort === 'time') arr.sort((a, b) => b.minutes - a.minutes);
  return arr;
}

function addTaskTo(key, task) {
  if (!S.days[key]) S.days[key] = [];
  S.days[key].push(task);
}
function deleteTask(id) {
  const f = findTask(id);
  if (!f || f.task.status === 'running') return;
  S.days[f.key] = S.days[f.key].filter((x) => x.id !== id);
}
function startTask(id) {
  if (S.running) { alert(t('busy')); return; }
  const f = findTask(id);
  if (!f || f.task.status !== 'pending') return;
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  S.running = { taskId: id, endAt: Date.now() + f.task.minutes * 60000 };
  f.task.status = 'running';
}
function finishTimer() {
  const r = S.running;
  const f = findTask(r.taskId);
  S.running = null;
  if (f) f.task.status = 'ask';
  alarm(f ? f.task.title : '');
}
function verdict(id, v) {
  const f = findTask(id);
  if (f && f.task.status === 'ask') f.task.status = v;
}
function setPending(id) {
  const f = findTask(id);
  if (f) f.task.status = 'pending';
}
function moveTask(id, when, date) {
  const f = findTask(id);
  if (!f || f.task.status !== 'pending') return;
  S.days[f.key] = S.days[f.key].filter((x) => x.id !== id);
  if (when === 'later') { S.backlog.push(f.task); return; }
  const target = when === 'date' ? (date || f.key) : addDays(keyOf(new Date()), +when);
  addTaskTo(target, f.task);
}
function fromBacklog(id) {
  const x = S.backlog.find((y) => y.id === id);
  if (!x) return;
  S.backlog = S.backlog.filter((y) => y.id !== id);
  addTaskTo(ui.day, x);
}
function applyPreset() {
  const list = S.presets[weekdayOf(ui.day)] || [];
  list.forEach((p) => addTaskTo(ui.day, { id: uid(), title: p.title, minutes: p.minutes, catId: p.catId, status: 'pending' }));
}
function savePreset() {
  S.presets[weekdayOf(ui.day)] = (S.days[ui.day] || []).map((x) => ({ title: x.title, minutes: x.minutes, catId: x.catId }));
}

function alarm(title) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.6, 1.2].forEach((s) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = 880;
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.3, ac.currentTime + s);
      g.gain.setValueAtTime(0, ac.currentTime + s + 0.4);
      o.start(ac.currentTime + s); o.stop(ac.currentTime + s + 0.45);
    });
  } catch (e) { /* звук недоступен */ }
  if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Timecon', { body: `${t('timer_done')}: ${title}` });
  }
}
function tick() {
  if (!S.running) return;
  const left = S.running.endAt - Date.now();
  if (left <= 0) { finishTimer(); persist(); return; }
  const el = document.querySelector('[data-timer]');
  if (el) el.textContent = fmtClock(left);
}
setInterval(tick, 500);

function download(name, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
}
function exportJSON() {
  download(`timecon-${keyOf(new Date())}.json`, JSON.stringify(S, null, 2), 'application/json');
}
function exportCSV() {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['type', 'date', 'title_or_note', 'amount_or_minutes', 'category', 'status']];
  Object.entries(S.days).forEach(([k, arr]) => arr.forEach((x) => rows.push(['task', k, x.title, x.minutes, label(catById(x.catId)), x.status])));
  S.fin.incomes.forEach((x) => rows.push(['income', x.date, x.note, x.amount, '', '']));
  S.fin.expenses.forEach((x) => rows.push(['expense', x.date, x.note, x.amount, label(finCat(x.catId)), x.needed ? 'needed' : 'unneeded']));
  download(`timecon-${keyOf(new Date())}.csv`, '\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\n'), 'text/csv');
}

function taskCard(x) {
  const c = catById(x.catId) || { icon: 'star', color: '#8b93a7' };
  let body = '';
  if (x.status === 'running') {
    body = `<span class="clock" data-timer>${fmtClock(S.running.endAt - Date.now())}</span>`;
  } else if (x.status === 'ask') {
    body = `<div class="verdict"><span>${t('ask_q')}</span>
      <button class="ok" data-act="verdict" data-id="${x.id}" data-v="done">${icon('check')} ${t('verdict_done')}</button>
      <button class="bad" data-act="verdict" data-id="${x.id}" data-v="failed">${icon('x')} ${t('verdict_failed')}</button></div>`;
  } else if (x.status === 'pending') {
    body = `<div class="acts">
      <button class="primary" data-act="start" data-id="${x.id}" ${S.running ? 'disabled' : ''}>${icon('play')} ${t('start')}</button>
      <button class="icon-btn" data-act="move" data-id="${x.id}" title="${t('move')}">${icon('move')}</button>
      <button class="icon-btn" data-act="del" data-id="${x.id}" title="${t('delete')}">${icon('trash')}</button></div>`;
  } else {
    body = `<div class="acts">
      <button class="icon-btn" data-act="restore" data-id="${x.id}" title="${t('restore')}">${icon('undo')}</button>
      <button class="icon-btn" data-act="del" data-id="${x.id}" title="${t('delete')}">${icon('trash')}</button></div>`;
  }
  const mark = x.status === 'done' ? `<span class="mark ok">${icon('check')}</span>`
    : x.status === 'failed' ? `<span class="mark bad">${icon('x')}</span>` : '';
  const moveForm = ui.moveId === x.id ? `<form class="move" data-form="move" data-id="${x.id}">
      <select name="when">
        <option value="1">${t('tomorrow')}</option><option value="2">${t('after_tomorrow')}</option>
        <option value="7">${t('in_week')}</option><option value="date">${t('pick_date')}</option><option value="later">${t('later')}</option>
      </select>
      <input type="date" name="date" value="${addDays(ui.day, 1)}">
      <button class="primary">${t('ok')}</button></form>` : '';
  return `<li class="task ${x.status}" style="--c:${c.color}">
    <div class="task-head"><span class="cat-ico">${icon(c.icon)}</span>
      <div class="task-title"><span class="ttl">${esc(x.title)}</span><small>${x.minutes} ${t('min')}</small></div>${mark}</div>
    ${body}${moveForm}</li>`;
}

function viewTasks() {
  const list = sortTasks(S.days[ui.day] || []);
  const wd = weekdayOf(ui.day);
  const preset = S.presets[wd] || [];
  const sorts = [['manual', 'sort_manual'], ['cat', 'sort_cat'], ['status', 'sort_status'], ['time', 'sort_time']];
  return `
    <div class="card daybar">
      <button class="icon-btn" data-act="day" data-n="-1">${icon('left')}</button>
      <div class="daylabel"><b>${esc(fmtDate(ui.day))}</b><small>${t('wd')[wd]}</small></div>
      <button class="icon-btn" data-act="day" data-n="1">${icon('right')}</button>
    </div>
    <div class="toolbar">
      <button class="ghost" data-act="today">${t('today')}</button>
      <label>${t('sort')}
        <select data-change="sort">${sorts.map(([v, k]) => `<option value="${v}" ${ui.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>
      </label>
    </div>
    <ul class="tasks">${list.length ? list.map(taskCard).join('') : `<li class="empty">${t('no_tasks')}</li>`}</ul>
    <form class="card form" data-form="addTask">
      <input name="title" placeholder="${t('task_title')}" required maxlength="80">
      <div class="row2">
        <label>${t('minutes')}<input name="minutes" type="number" min="1" max="600" value="25"></label>
        <label>${t('category')}<select name="cat">${S.cats.map((c) => `<option value="${c.id}">${esc(label(c))}</option>`).join('')}</select></label>
      </div>
      <button class="primary">${icon('plus')} ${t('add')}</button>
    </form>
    <section class="card">
      <h3>${t('preset_for')} ${t('wd')[wd]}</h3>
      ${preset.length ? `<ul class="mini">${preset.map((p) => `<li>${icon((catById(p.catId) || {}).icon || 'star')}<span>${esc(p.title)}</span><small>${p.minutes} ${t('min')}</small></li>`).join('')}</ul>` : `<p class="empty">${t('none')}</p>`}
      <div class="acts">
        <button data-act="applyPreset" ${preset.length ? '' : 'disabled'}>${t('apply_preset')}</button>
        <button data-act="savePreset">${t('save_preset')}</button>
        <button class="ghost" data-act="clearPreset" ${preset.length ? '' : 'disabled'}>${t('clear_preset')}</button>
      </div>
    </section>
    <section class="card">
      <h3>${t('backlog')}</h3>
      ${S.backlog.length ? `<ul class="mini">${S.backlog.map((x) => `<li>${icon((catById(x.catId) || {}).icon || 'star')}<span>${esc(x.title)}</span>
        <button class="ghost" data-act="fromBacklog" data-id="${x.id}">${icon('move')} ${t('to_day')}</button>
        <button class="icon-btn" data-act="delBacklog" data-id="${x.id}">${icon('trash')}</button></li>`).join('')}</ul>` : `<p class="empty">${t('none')}</p>`}
    </section>`;
}

function periodPred() {
  const d = ui.day;
  if (ui.period === 'day') return (k) => k === d;
  if (ui.period === 'week') {
    const dow = (parseKey(d).getDay() + 6) % 7;
    const start = addDays(d, -dow), end = addDays(start, 6);
    return (k) => k >= start && k <= end;
  }
  if (ui.period === 'month') return (k) => monthOf(k) === monthOf(d);
  return () => true;
}

function viewStats() {
  const pred = periodPred();
  const entries = Object.entries(S.days).filter(([k]) => pred(k)).flatMap(([k, arr]) => arr.map((x) => ({ ...x, day: k })));
  const done = entries.filter((x) => x.status === 'done');
  const failed = entries.filter((x) => x.status === 'failed');
  const doneMin = sum(done.map((x) => x.minutes));
  const pct = done.length + failed.length ? Math.round(done.length / (done.length + failed.length) * 100) : 0;
  const byTask = agg(done, (x) => x.title, (x) => x.title, (x) => x.minutes);
  const byCat = agg(done, (x) => x.catId, (x) => label(catById(x.catId)), (x) => x.minutes);
  const periods = [['day', 'period_day'], ['week', 'period_week'], ['month', 'period_month'], ['all', 'period_all']];
  return `
    <div class="periods">${periods.map(([v, k]) => `<button class="${ui.period === v ? 'on' : ''}" data-act="period" data-p="${v}">${t(k)}</button>`).join('')}</div>
    <section class="card">
      <div class="tiles">
        <div class="tile"><small>${t('total_time')}</small><b>${fmtDur(doneMin)}</b></div>
        <div class="tile"><small>${t('completion')}</small><b>${pct}%</b></div>
        <div class="tile"><small>${t('done_count')}</small><b class="pos">${done.length}</b></div>
        <div class="tile"><small>${t('failed_count')}</small><b class="neg">${failed.length}</b></div>
      </div>
    </section>
    <section class="card"><h3>${t('by_task')}</h3>${bars(byTask, fmtDur)}</section>
    <section class="card"><h3>${t('by_cat')}</h3>${bars(byCat, fmtDur, (id) => `<span class="cat-ico" style="--c:${(catById(id) || {}).color}">${icon((catById(id) || {}).icon || 'star')}</span>`)}</section>`;
}

function viewFinance() {
  const m = ui.month;
  const salaryTotal = monthPaydates(m).length * (+S.fin.salary || 0);
  const incs = S.fin.incomes.filter((x) => monthOf(x.date) === m);
  const exps = S.fin.expenses.filter((x) => monthOf(x.date) === m);
  const income = salaryTotal + sum(incs.map((x) => +x.amount || 0));
  const spent = sum(exps.map((x) => +x.amount || 0));
  const unneeded = sum(exps.filter((x) => !x.needed).map((x) => +x.amount || 0));
  const savings = income - spent;
  const eff = income > 0 ? Math.round(savings / income * 100) : 0;
  const unShare = spent > 0 ? Math.round(unneeded / spent * 100) : 0;
  const byCat = agg(exps, (x) => x.catId, (x) => label(finCat(x.catId)), (x) => +x.amount || 0);
  const np = nextPayday();
  const catOpts = S.fin.cats.map((c) => `<option value="${c.id}">${esc(label(c))}</option>`).join('');
  const rows = [
    ...incs.map((x) => ({ kind: 'income', x, sub: x.note || t('income') })),
    ...exps.map((x) => ({ kind: 'expense', x, sub: x.note || label(finCat(x.catId)) })),
  ].sort((a, b) => b.x.date.localeCompare(a.x.date));
  const monthLabel = new Date(+m.slice(0, 4), +m.slice(5) - 1, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  return `
    <div class="card daybar">
      <button class="icon-btn" data-act="month" data-n="-1">${icon('left')}</button>
      <b>${esc(monthLabel)}</b>
      <button class="icon-btn" data-act="month" data-n="1">${icon('right')}</button>
    </div>
    <section class="card">
      <div class="tiles">
        <div class="tile"><small>${t('income')}</small><b>${money(income)}</b></div>
        <div class="tile"><small>${t('expenses')}</small><b>${money(spent)}</b></div>
        <div class="tile"><small>${t('savings')}</small><b class="${savings >= 0 ? 'pos' : 'neg'}">${money(savings)}</b></div>
        <div class="tile"><small>${t('efficiency')}</small><b class="${eff >= 0 ? 'pos' : 'neg'}">${eff}%</b></div>
        <div class="tile"><small>${t('unneeded')}</small><b class="neg">${money(unneeded)}</b></div>
        <div class="tile"><small>${t('unneeded_share')}</small><b class="neg">${unShare}%</b></div>
      </div>
      ${np ? `<p class="muted">${t('next_payday')}: ${esc(fmtDate(np))}</p>` : ''}
    </section>
    <section class="card"><h3>${t('by_cat')}</h3>${bars(byCat, money)}</section>
    <form class="card form" data-form="addIncome">
      <h3>${t('add_income')}</h3>
      <div class="row2">
        <label>${t('amount')}<input name="amount" type="number" step="0.01" min="0" required></label>
        <label>${t('date')}<input name="date" type="date" value="${keyOf(new Date())}" required></label>
      </div>
      <input name="note" placeholder="${t('note')}" maxlength="60">
      <button class="primary">${icon('plus')} ${t('add_income')}</button>
    </form>
    <form class="card form" data-form="addExpense">
      <h3>${t('add_expense')}</h3>
      <div class="row2">
        <label>${t('amount')}<input name="amount" type="number" step="0.01" min="0" required></label>
        <label>${t('date')}<input name="date" type="date" value="${keyOf(new Date())}" required></label>
      </div>
      <div class="row2">
        <label>${t('cat_fin')}<select name="catId">${catOpts}</select></label>
        <label class="check"><input type="checkbox" name="needed" checked> ${t('needed')}</label>
      </div>
      <input name="note" placeholder="${t('note')}" maxlength="60">
      <button class="primary">${icon('plus')} ${t('add_expense')}</button>
    </form>
    <section class="card">
      <ul class="mini">${rows.length ? rows.map((r) => `<li><small>${r.x.date.slice(5)}</small><span>${esc(r.sub)}</span>
        <b class="${r.kind === 'income' ? 'pos' : 'neg'}">${r.kind === 'income' ? '+' : '−'}${money(r.x.amount)}</b>
        <button class="icon-btn" data-act="delFin" data-kind="${r.kind}" data-id="${r.x.id}">${icon('trash')}</button></li>`).join('') : `<li class="empty">${t('none')}</li>`}</ul>
    </section>`;
}

function catEditor(kind, list, formKind) {
  return `<ul class="mini">${list.map((c) => `<li>${icon(c.icon)}<span>${esc(label(c))}</span>
      <button class="icon-btn" data-act="delCat" data-kind="${kind}" data-id="${c.id}">${icon('trash')}</button></li>`).join('')}</ul>
    <form class="form" data-form="${formKind}">
      <input name="name" placeholder="${t('name')}" required maxlength="30">
      <div class="icon-grid">${CAT_ICONS.map((n, i) => `<label class="ico"><input type="radio" name="icon" value="${n}" ${i === 0 ? 'checked' : ''}>${icon(n)}</label>`).join('')}</div>
      ${kind === 'cats' ? '<input name="color" type="color" value="#7aa2f7">' : ''}
      <button class="primary">${icon('plus')} ${t('add_cat')}</button>
    </form>`;
}

function viewSettings() {
  return `
    <form class="card form" data-form="settings">
      <h3>${t('settings')}</h3>
      <label>${t('language')}<select name="lang">
        <option value="ru" ${S.lang === 'ru' ? 'selected' : ''}>Русский</option>
        <option value="en" ${S.lang === 'en' ? 'selected' : ''}>English</option></select></label>
      <label>${t('theme')}<select name="theme">
        <option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>${t('dark')}</option>
        <option value="light" ${S.theme === 'light' ? 'selected' : ''}>${t('light')}</option></select></label>
      <label>${t('currency')}<select name="currency">${Object.keys(CUR).map((c) => `<option value="${c}" ${S.currency === c ? 'selected' : ''}>${c} ${CUR[c]}</option>`).join('')}</select></label>
      <label>${t('pay_days')}<input name="payDays" value="${S.fin.payDays.join(', ')}"></label>
      <label>${t('salary')}<input name="salary" type="number" step="0.01" min="0" value="${S.fin.salary}"></label>
      <label class="check"><input type="checkbox" name="shift" ${S.fin.shiftWeekend ? 'checked' : ''}> ${t('shift_weekend')}</label>
      <button class="primary">${t('save')}</button>
    </form>
    <section class="card"><h3>${t('categories')}</h3>${catEditor('cats', S.cats, 'addCat')}</section>
    <section class="card"><h3>${t('fin_categories')}</h3>${catEditor('finCats', S.fin.cats, 'addFinCat')}</section>
    <section class="card">
      <h3>${t('data')}</h3>
      <div class="acts">
        <button data-act="export">${t('export_json')}</button>
        <button data-act="exportCsv">${t('export_csv')}</button>
        <label class="btn-like">${t('import_json')}<input type="file" accept="application/json" data-change="import" hidden></label>
      </div>
    </section>
    <section class="card"><h3>${t('sync_title')}</h3>${viewSync()}</section>`;
}

const NAV = [['tasks', 'tasks'], ['stats', 'chart'], ['finance', 'wallet'], ['settings', 'gear']];
const VIEWS = { tasks: viewTasks, stats: viewStats, finance: viewFinance, settings: viewSettings };

function render() {
  document.documentElement.dataset.theme = S.theme;
  document.documentElement.lang = S.lang;
  $('#nav').innerHTML = NAV.map(([v, ic]) => `<button class="${ui.view === v ? 'on' : ''}" data-act="tab" data-v="${v}">${icon(ic)}<span>${t(v)}</span></button>`).join('');
  $('#main').innerHTML = VIEWS[ui.view]();
}

const SYNC_KEY = 'timecon.sync';
const cfg = window.TIMECON_SUPABASE || {};
const sync = { user: null, client: null, updated: 0, timer: null, email: '', sent: false, msg: '' };
try { sync.updated = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}').updated || 0; } catch (e) { /* пусто */ }

function syncMeta(ts) { sync.updated = ts; localStorage.setItem(SYNC_KEY, JSON.stringify({ updated: ts })); }
function sbc() {
  if (sync.client) return sync.client;
  if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
  sync.client = window.supabase.createClient(cfg.url, cfg.anonKey);
  return sync.client;
}
function schedulePush() {
  if (!sync.user) return;
  clearTimeout(sync.timer);
  sync.timer = setTimeout(flushPush, 800);
}
async function uploadNow() {
  const now = Date.now();
  const { error } = await sbc().from('timecon_state').upsert({ user_id: sync.user.id, data: S, updated_at: now });
  if (error) throw error;
  syncMeta(now);
}
async function pullRemote() {
  const { data, error } = await sbc().from('timecon_state').select('data, updated_at').eq('user_id', sync.user.id).maybeSingle();
  if (error) throw error;
  if (!data) {
    await uploadNow();
  } else if (Number(data.updated_at) > sync.updated) {
    S = { ...defaults(), ...data.data };
    save();
    syncMeta(Number(data.updated_at));
  }
  sync.msg = '';
  render();
}
async function flushPush() {
  if (!sync.user) return;
  try {
    const { data, error } = await sbc().from('timecon_state').select('updated_at').eq('user_id', sync.user.id).maybeSingle();
    if (error) throw error;
    if (data && Number(data.updated_at) > sync.updated) await pullRemote();
    else await uploadNow();
    sync.msg = '';
  } catch (e) {
    sync.msg = 'sync_fail';
    render();
  }
}
function pullSafe() {
  pullRemote().catch(() => { sync.msg = 'sync_fail'; render(); });
}
function syncInit() {
  const c = sbc();
  if (!c) return;
  c.auth.onAuthStateChange((_e, session) => {
    sync.user = session ? session.user : null;
    if (sync.user) pullSafe();
    else render();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sync.user) pullSafe(); });
}
async function syncSend(email) {
  const { error } = await sbc().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  sync.email = email;
  sync.sent = !error;
  sync.msg = error ? 'sync_fail' : 'sync_sent';
  render();
}
async function syncVerify(code) {
  const { error } = await sbc().auth.verifyOtp({ email: sync.email, token: code, type: 'email' });
  sync.msg = error ? 'sync_bad_code' : '';
  if (!error) sync.sent = false;
  render();
}
function viewSync() {
  if (!sbc()) return `<p class="muted">${t('sync_not_config')}</p>`;
  if (sync.user) return `<p class="muted">${t('sync_in')}: ${esc(sync.user.email)}</p>
    <div class="acts"><button data-act="syncNow">${t('sync_now')}</button><button class="ghost" data-act="syncOut">${t('sync_out')}</button></div>
    ${sync.msg ? `<p class="muted">${t(sync.msg)}</p>` : ''}`;
  if (!sync.sent) return `<form class="form" data-form="syncSend">
      <input name="email" type="email" required placeholder="${t('sync_email')}" value="${esc(sync.email)}">
      <p class="muted">${t('sync_hint')}</p>
      <button class="primary">${t('sync_send')}</button></form>
    ${sync.msg ? `<p class="muted">${t(sync.msg)}</p>` : ''}`;
  return `<form class="form" data-form="syncVerify">
      <input name="code" inputmode="numeric" autocomplete="one-time-code" required placeholder="${t('sync_code')}">
      <button class="primary">${t('sync_verify')}</button></form>
    <p class="muted">${t('sync_sent')}</p>
    ${sync.msg ? `<p class="muted">${t(sync.msg)}</p>` : ''}`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  switch (a) {
    case 'tab': ui.view = b.dataset.v; ui.moveId = null; break;
    case 'day': ui.day = addDays(ui.day, +b.dataset.n); ui.moveId = null; break;
    case 'today': ui.day = keyOf(new Date()); break;
    case 'month': ui.month = shiftMonth(ui.month, +b.dataset.n); break;
    case 'period': ui.period = b.dataset.p; break;
    case 'start': startTask(id); break;
    case 'verdict': verdict(id, b.dataset.v); break;
    case 'restore': setPending(id); break;
    case 'del': deleteTask(id); break;
    case 'move': ui.moveId = ui.moveId === id ? null : id; break;
    case 'fromBacklog': fromBacklog(id); break;
    case 'delBacklog': S.backlog = S.backlog.filter((x) => x.id !== id); break;
    case 'applyPreset': applyPreset(); break;
    case 'savePreset': savePreset(); break;
    case 'clearPreset': delete S.presets[weekdayOf(ui.day)]; break;
    case 'delFin': {
      const key = b.dataset.kind === 'income' ? 'incomes' : 'expenses';
      S.fin[key] = S.fin[key].filter((x) => x.id !== id);
      break;
    }
    case 'delCat': {
      if (b.dataset.kind === 'cats') S.cats = S.cats.filter((c) => c.id !== id);
      else S.fin.cats = S.fin.cats.filter((c) => c.id !== id);
      break;
    }
    case 'syncNow': flushPush().then(render); return;
    case 'syncOut': sbc().auth.signOut(); sync.sent = false; return;
    case 'export': exportJSON(); return;
    case 'exportCsv': exportCSV(); return;
    default: return;
  }
  persist();
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const fd = new FormData(f);
  const kind = f.dataset.form;
  switch (kind) {
    case 'addTask': {
      const title = String(fd.get('title') || '').trim();
      if (!title) return;
      const minutes = Math.max(1, Math.min(600, parseInt(fd.get('minutes'), 10) || 25));
      addTaskTo(ui.day, { id: uid(), title, minutes, catId: fd.get('cat'), status: 'pending' });
      break;
    }
    case 'move':
      moveTask(f.dataset.id, fd.get('when'), fd.get('date'));
      ui.moveId = null;
      break;
    case 'addIncome':
      S.fin.incomes.push({ id: uid(), date: fd.get('date') || keyOf(new Date()), amount: +fd.get('amount') || 0, note: String(fd.get('note') || '') });
      break;
    case 'addExpense':
      S.fin.expenses.push({ id: uid(), date: fd.get('date') || keyOf(new Date()), amount: +fd.get('amount') || 0, catId: fd.get('catId'), needed: fd.get('needed') === 'on', note: String(fd.get('note') || '') });
      break;
    case 'addCat': {
      const name = String(fd.get('name') || '').trim();
      if (!name) return;
      S.cats.push({ id: uid(), name, icon: fd.get('icon') || 'star', color: fd.get('color') || '#7aa2f7' });
      break;
    }
    case 'addFinCat': {
      const name = String(fd.get('name') || '').trim();
      if (!name) return;
      S.fin.cats.push({ id: uid(), name, icon: fd.get('icon') || 'star' });
      break;
    }
    case 'settings':
      S.lang = fd.get('lang');
      S.theme = fd.get('theme');
      S.currency = fd.get('currency');
      S.fin.payDays = String(fd.get('payDays') || '').split(/[,\s]+/).map(Number).filter((n) => n >= 1 && n <= 31);
      S.fin.salary = +fd.get('salary') || 0;
      S.fin.shiftWeekend = fd.get('shift') === 'on';
      break;
    default: return;
  }
  persist();
});

document.addEventListener('submit', (e) => {
  const f = e.target;
  if (!f.dataset.form || !f.dataset.form.startsWith('sync')) return;
  e.preventDefault();
  const fd = new FormData(f);
  if (f.dataset.form === 'syncSend') syncSend(String(fd.get('email') || '').trim());
  else syncVerify(String(fd.get('code') || '').trim());
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.change === 'sort') { ui.sort = el.value; render(); }
  if (el.dataset.change === 'import') {
    const f = el.files[0];
    if (!f) return;
    f.text().then((txt) => { S = { ...defaults(), ...JSON.parse(txt) }; persist(); }).catch(() => alert('Import error'));
  }
});

render();
syncInit();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
