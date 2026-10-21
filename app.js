const KEY = 'timecon.v1';
const BUILD = 'v32';
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
// Фирменный разноцветный логотип Google для кнопки входа (официальная палитра).
const GOOGLE_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/></svg>`;

const CUR = { RUB: '₽', USD: '$', EUR: '€', KZT: '₸', UAH: '₴', BYN: 'Br', GBP: '£', CNY: '¥', JPY: '¥', KRW: '₩', TRY: '₺', BRL: 'R$', INR: '₹', PLN: 'zł', CHF: 'CHF', CAD: 'C$', AUD: 'A$' };

// Translations live in i18n.js; English fills in any missing key.
const T = window.TIMECON_I18N || { en: {} };
const UI_LANGS = Object.keys(T);
const browserLangs = () => [...(navigator.languages || []), navigator.language].filter(Boolean).map(String);
// First run: the first supported browser language, and a currency from the browser's region.
function guessLang() {
  return browserLangs().map((l) => l.toLowerCase().split('-')[0]).find((c) => T[c]) || 'en';
}
const EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
const REGION_CUR = { RU: 'RUB', US: 'USD', GB: 'GBP', KZ: 'KZT', UA: 'UAH', BY: 'BYN', CN: 'CNY', JP: 'JPY', KR: 'KRW', TR: 'TRY', BR: 'BRL', IN: 'INR', PL: 'PLN', CH: 'CHF', CA: 'CAD', AU: 'AUD' };
function guessCurrency() {
  for (const tag of browserLangs()) {
    try {
      const region = new Intl.Locale(tag).maximize().region;
      if (REGION_CUR[region]) return REGION_CUR[region];
      if (EURO.includes(region)) return 'EUR';
    } catch (e) { /* invalid tag */ }
  }
  return 'USD';
}

function defaults() {
  return {
    v: 1, lang: guessLang(), theme: 'dark', currency: guessCurrency(),
    cats: [
      { id: 'c_sport', key: 'cat_sport', icon: 'dumbbell', color: '#d4af37' },
      { id: 'c_work', key: 'cat_work', icon: 'briefcase', color: '#e0a458' },
      { id: 'c_rest', key: 'cat_rest', icon: 'coffee', color: '#c2a878' },
      { id: 'c_study', key: 'cat_study', icon: 'book', color: '#b08968' },
      { id: 'c_home', key: 'cat_home', icon: 'home', color: '#9caf88' },
    ],
    presets: {},
    days: {},
    backlog: [],
    notes: [],
    running: null,
    fin: {
      cats: [
        { id: 'f_food', key: 'fcat_food', icon: 'cart' },
        { id: 'f_home', key: 'fcat_home', icon: 'home' },
        { id: 'f_fun', key: 'fcat_fun', icon: 'star' },
        { id: 'f_other', key: 'fcat_other', icon: 'heart' },
      ],
      incomes: [], expenses: [], pays: [{ id: 'p5', day: 5, amount: 0 }, { id: 'p20', day: 20, amount: 0 }], shiftWeekend: true,
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate({ ...defaults(), ...JSON.parse(raw) });
  } catch (e) { /* повреждённые данные — начинаем заново */ }
  return defaults();
}
// Старые стандартные цвета категорий приводим к тёплой палитре.
const OLD_COLORS = { '#9ece6a': '#d4af37', '#7aa2f7': '#e0a458', '#e0af68': '#c2a878', '#bb9af7': '#b08968', '#73daca': '#9caf88' };
function migrate(st) {
  (st.cats || []).forEach((c) => { if (OLD_COLORS[c.color]) c.color = OLD_COLORS[c.color]; });
  if (!st.fin) st.fin = defaults().fin;
  if (!Array.isArray(st.fin.pays)) {
    const days = Array.isArray(st.fin.payDays) ? st.fin.payDays : [];
    const amount = +st.fin.salary || 0;
    st.fin.pays = days.filter((d) => d >= 1 && d <= 31).map((d) => ({ id: uid(), day: d, amount }));
    delete st.fin.payDays;
    delete st.fin.salary;
  }
  return reconcileRunning(st);
}
let S = load();
const ui = { view: 'tasks', day: keyOf(new Date()), statsDay: keyOf(new Date()), sort: 'manual', period: 'day', month: keyOf(new Date()).slice(0, 7), moveId: null, timeId: null, noteId: null, noteIconPick: false, focusTask: null, actionsId: null };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { alert(t('storage_full')); }
}
function persist() { ver++; setDirty(true); save(); render(); schedulePush(); }
// Изменение без перерисовки — чтобы не сбрасывать ввод при наборе текста.
function touch() { ver++; setDirty(true); save(); schedulePush(); }

function t(k) { return T[S.lang]?.[k] ?? T.en?.[k] ?? k; }
const localeCache = {};
// The browser's own regional variant (en-GB, pt-PT…) wins when it matches the UI language.
function locale() {
  if (!localeCache[S.lang]) {
    let own = browserLangs().find((l) => l.toLowerCase().split('-')[0] === S.lang);
    if (S.lang === 'zh' && !/^zh(-(hans|cn|sg)|$)/i.test(own || '')) own = null;
    let loc = t('locale');
    try { if (own && Intl.DateTimeFormat.supportedLocalesOf(own).length) loc = own; } catch (e) { /* keep default */ }
    localeCache[S.lang] = loc;
  }
  return localeCache[S.lang];
}
// Locale-aware separators and symbol position, but the app's own currency symbols.
function money(n) {
  const v = Number(n || 0);
  const digits = Number.isInteger(v) ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency: S.currency, minimumFractionDigits: digits, maximumFractionDigits: digits })
      .formatToParts(v).map((p) => (p.type === 'currency' ? CUR[S.currency] || p.value : p.value)).join('');
  } catch (e) {
    return `${v.toLocaleString(locale(), { maximumFractionDigits: 2 })} ${CUR[S.currency] || S.currency}`;
  }
}
const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase(locale()) + s.slice(1) : s);
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
const fmtShortDate = (k) => parseKey(k).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
const fmtTime = (ts) => new Date(ts).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
const fmtDateTime = (ts) => new Date(ts).toLocaleString(locale(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  (S.fin.pays || []).forEach((p) => {
    const d0 = +p.day;
    if (!(d0 >= 1 && d0 <= 31)) return;
    const date = new Date(y, mo - 1, Math.min(d0, dim));
    if (S.fin.shiftWeekend) {
      const w = date.getDay();
      if (w === 6) date.setDate(date.getDate() - 1);
      else if (w === 0) date.setDate(date.getDate() - 2);
    }
    res.push({ key: keyOf(date), amount: +p.amount || 0 });
  });
  return res.filter((r) => monthOf(r.key) === m).sort((a, b) => (a.key < b.key ? -1 : 1));
}
function nextPayday() {
  const today = keyOf(new Date());
  let m = monthOf(today);
  for (let i = 0; i < 3; i++) {
    const c = monthPaydates(m).find((r) => r.key >= today);
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

function stampT(x) { if (x) x.updatedAt = Date.now(); }
function addTaskTo(key, task) {
  if (!S.days[key]) S.days[key] = [];
  if (!task.updatedAt) task.updatedAt = Date.now();
  S.days[key].push(task);
}
function deleteTask(id) {
  const f = findTask(id);
  if (!f || f.task.status === 'running') return;
  removeWithUndo(() => S.days[f.key] || (S.days[f.key] = []), id, 'task_deleted', stampT);
}
// Deletion is immediate; a snackbar offers to put the item back in its place.
// The list is looked up again on undo because a sync may have replaced S meanwhile.
function removeWithUndo(getList, id, msgKey, onRestore) {
  const list = getList();
  const at = list ? list.findIndex((x) => x.id === id) : -1;
  if (at < 0) return;
  const [item] = list.splice(at, 1);
  showUndo(t(msgKey), () => {
    const now = getList();
    if (!now || now.some((x) => x.id === id)) return;
    now.splice(Math.min(at, now.length), 0, item);
    if (onRestore) onRestore(item);
  });
}
const toast = { el: null, timer: null, undo: null };
function showUndo(msg, undo) {
  if (!toast.el) {
    toast.el = document.createElement('div');
    toast.el.className = 'toast';
    toast.el.innerHTML = '<span></span><button type="button" class="primary" data-act="undo"></button>';
    document.body.appendChild(toast.el);
  }
  toast.undo = undo;
  toast.el.querySelector('span').textContent = msg;
  toast.el.querySelector('button').textContent = t('undo');
  toast.el.hidden = false;
  toast.el.classList.remove('show');
  void toast.el.offsetWidth;
  toast.el.classList.add('show');
  $('#actionStatus').textContent = msg;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(hideToast, 6000);
}
function hideToast() {
  clearTimeout(toast.timer);
  toast.undo = null;
  if (toast.el) toast.el.hidden = true;
}
function runningList() {
  if (Array.isArray(S.running)) return S.running;
  return S.running ? [S.running] : [];
}
function findRun(id) { return runningList().find((r) => r.taskId === id); }
function dropRun(id) {
  S.running = runningList().filter((r) => r.taskId !== id);
  if (!S.running.length) S.running = null;
}
function startTask(id) {
  if (findRun(id)) return;
  const f = findTask(id);
  if (!f || f.task.status !== 'pending') return;
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  const startedAt = Date.now();
  const list = runningList();
  list.push({ taskId: id, endAt: startedAt + f.task.minutes * 60000, startedAt });
  S.running = list;
  f.task.startedAt = startedAt;
  f.task.status = 'running';
  stampT(f.task);
}
function finishTimer(run) {
  const f = findTask(run.taskId);
  dropRun(run.taskId);
  if (f) { f.task.status = 'ask'; stampT(f.task); }
  alarm(f ? f.task.title : '');
}
// Отмена начатой задачи: остановить отсчёт и вернуть задачу в невыполненные.
function cancelTask(id) {
  if (!findRun(id)) return;
  if (!confirm(t('cancel_confirm'))) return;
  const f = findTask(id);
  dropRun(id);
  if (f) {
    f.task.status = 'pending';
    f.task.startedAt = null;
    f.task.autoDone = true;
    stampT(f.task);
  }
  S.autoCooldownUntil = Date.now() + 120000;
  persist();
}
function verdict(id, v) {
  const f = findTask(id);
  if (f && f.task.status === 'ask') { f.task.status = v; stampT(f.task); }
}
function setPending(id) {
  const f = findTask(id);
  if (f) { f.task.status = 'pending'; stampT(f.task); }
}
function moveTask(id, when, date) {
  const f = findTask(id);
  if (!f || f.task.status !== 'pending') return;
  S.days[f.key] = S.days[f.key].filter((x) => x.id !== id);
  stampT(f.task);
  if (when === 'later') { S.backlog.push(f.task); return; }
  const target = when === 'date' ? (date || f.key) : addDays(keyOf(new Date()), +when);
  addTaskTo(target, f.task);
}
function reorderTask(id, dir) {
  const arr = S.days[ui.day] || [];
  const i = arr.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}
function setAutoTime(id, value) {
  const f = findTask(id);
  if (!f) return;
  f.task.startAt = value || null;
  f.task.autoDone = false;
  stampT(f.task);
}
function fromBacklog(id) {
  const x = S.backlog.find((y) => y.id === id);
  if (!x) return;
  S.backlog = S.backlog.filter((y) => y.id !== id);
  stampT(x);
  addTaskTo(ui.day, x);
}
function applyPreset(wd) {
  const day = wd === undefined || wd === null ? weekdayOf(ui.day) : Number(wd);
  const list = S.presets[day] || [];
  if (!list.length) return;
  const current = S.days[ui.day] || [];
  if (current.length && !confirm(t('preset_confirm'))) return;
  list.forEach((p) => addTaskTo(ui.day, { id: uid(), title: p.title, minutes: p.minutes, catId: p.catId, status: 'pending', startAt: p.startAt || null }));
}
function clearPreset(wd) {
  if (!confirm(t('preset_clear_confirm'))) return;
  delete S.presets[wd];
}
function savePreset() {
  S.presets[weekdayOf(ui.day)] = (S.days[ui.day] || []).map((x) => ({ title: x.title, minutes: x.minutes, catId: x.catId, startAt: x.startAt || null }));
}
// Задача выполнена без таймера: отмечаем сделанной, время берём из плана.
function finishNow(id) {
  const f = findTask(id);
  if (!f || f.task.status !== 'pending') return;
  dropRun(id);
  f.task.status = 'done';
  f.task.startedAt = null;
  f.task.manual = true;
  stampT(f.task);
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
  const now = Date.now();
  let changed = false;
  runningList().slice().forEach((r) => {
    if (r.endAt - now <= 0) { finishTimer(r); changed = true; return; }
    const el = document.querySelector('[data-timer="' + r.taskId + '"]');
    if (el) el.textContent = fmtClock(r.endAt - now);
    const bar = document.querySelector('[data-prog="' + r.taskId + '"]');
    if (bar) {
      const total = Math.max(1, r.endAt - r.startedAt);
      bar.style.width = Math.max(0, Math.min(100, (r.endAt - now) / total * 100)).toFixed(2) + '%';
    }
  });
  if (changed) persist();
  autoStartTick();
}
setInterval(tick, 500);

// Автозапуск задач, у которых задано время старта. Работает, пока приложение открыто.
const AUTO_WINDOW = 120 * 60000;
function autoStartTick() {
  const today = keyOf(new Date());
  const list = S.days[today] || [];
  const now = Date.now();
  if (S.autoCooldownUntil && now < S.autoCooldownUntil) return;
  let started = false;
  list.forEach((x) => {
    if (x.status !== 'pending' || !x.startAt || x.autoDone) return;
    const [h, m] = String(x.startAt).split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const at = parseKey(today);
    at.setHours(h, m, 0, 0);
    const diff = now - at.getTime();
    if (diff < 0 || diff > AUTO_WINDOW) return;
    const f = findTask(x.id);
    if (!f || findRun(x.id)) return;
    startTask(x.id);
    if (findRun(x.id)) {
      f.task.autoDone = true;
      stampT(f.task);
      started = true;
    }
  });
  if (started) persist();
}

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
  (S.notes || []).forEach((n) => {
    rows.push(['note', '', n.title || '', (n.blocks || []).length, '', '']);
    (n.blocks || []).forEach((b) => {
      if (b.type === 'photo') rows.push(['note_photo', '', '', '', '', '']);
      else rows.push(['note_' + b.type, '', (b.lang ? '[' + b.lang + '] ' : '') + (b.text || ''), '', '', '']);
    });
  });
  download(`timecon-${keyOf(new Date())}.csv`, '\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\n'), 'text/csv');
}

function taskCard(x, i, total, focused = false) {
  const c = catById(x.catId) || { icon: 'star', color: '#8b93a7' };
  let body = '';
  if (x.status === 'running') {
    const run = findRun(x.id) || { endAt: Date.now(), startedAt: Date.now() };
    const total = Math.max(1, run.endAt - run.startedAt);
    const done = Math.max(0, Math.min(100, Math.round((run.endAt - Date.now()) / total * 100)));
    body = `<div class="timer-label">${t('remaining')}</div><span class="clock" data-timer="${x.id}">${fmtClock(run.endAt - Date.now())}</span>
      <div class="task-progress"><i data-prog="${x.id}" style="width:${done}%"></i></div>
      <div class="acts center">
        <button class="bad" data-act="cancel" data-id="${x.id}">${icon('x')} ${t('cancel')}</button>
      </div>`;
  } else if (x.status === 'ask') {
    body = `<div class="verdict"><span>${t('ask_q')}</span>
      <button class="ok" data-act="verdict" data-id="${x.id}" data-v="done">${icon('check')} ${t('verdict_done')}</button>
      <button class="bad" data-act="verdict" data-id="${x.id}" data-v="failed">${icon('x')} ${t('verdict_failed')}</button></div>`;
  } else if (x.status === 'pending') {
    const order = ui.sort === 'manual'
      ? `<button type="button" data-act="up" data-id="${x.id}" ${i === 0 ? 'disabled' : ''}>${icon('right', 'rot-up')} ${t('up')}</button><button type="button" data-act="down" data-id="${x.id}" ${i === total - 1 ? 'disabled' : ''}>${icon('right', 'rot-down')} ${t('down')}</button>` : '';
    body = `<div class="acts task-primary-actions">
      <button class="primary" data-act="start" data-id="${x.id}">${icon('play')} ${t('start')}</button>
      <button class="ok" data-act="finishNow" data-id="${x.id}" title="${t('mark_done_hint')}">${icon('check')} ${t('mark_done')}</button>
      <button type="button" class="ghost task-more-toggle" data-act="taskMore" data-id="${x.id}" aria-expanded="${ui.actionsId === x.id}" aria-controls="actions-${x.id}">${t('more_actions')} <span aria-hidden="true">⋯</span></button></div>
      ${ui.actionsId === x.id ? `<div class="secondary-actions" id="actions-${x.id}">
        <button type="button" data-act="edit" data-id="${x.id}">${icon('edit')} ${t('edit')}</button>
        <button type="button" data-act="time" data-id="${x.id}">${icon('clock')} ${t('auto_on')}</button>${order}
        <button type="button" data-act="move" data-id="${x.id}">${icon('move')} ${t('move')}</button>
        <button type="button" data-act="del" data-id="${x.id}">${icon('trash')} ${t('delete')}</button>
      </div>` : ''}`;
  } else {
    body = `<div class="acts">
      <button class="icon-btn" data-act="restore" data-id="${x.id}" title="${t('restore')}">${icon('undo')}</button>
      <button class="icon-btn" data-act="edit" data-id="${x.id}" title="${t('edit')}">${icon('edit')}</button>
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
  const timeForm = ui.timeId === x.id ? `<form class="move" data-form="setTime" data-id="${x.id}">
      <input type="time" name="time" value="${esc(x.startAt || '')}">
      <button class="primary" type="submit">${t('ok')}</button>
      <button class="ghost" type="button" data-act="timeClear" data-id="${x.id}">${t('auto_off')}</button></form>` : '';
  const auto = x.startAt ? ` · ${t('auto_at')} ${esc(x.startAt)}` : '';
  const manual = x.manual && x.status === 'done' ? ` · ${t('manual_mark')}` : '';
  return `<li data-task-id="${x.id}" data-status="${x.status}" class="task ${x.status} ${focused ? 'focused' : ''}" style="--c:${c.color}">
    <div class="task-head"><span class="cat-ico">${icon(c.icon)}</span>
      <div class="task-title"><span class="ttl">${esc(x.title)}</span><small>${x.minutes} ${t('min')}${auto}${x.startedAt ? ` · ${t('started_at')} ${fmtTime(x.startedAt)}` : ''}${manual}</small></div>${mark}${x.status === 'running' ? `<button class="icon-btn ghost focus-select" data-act="focusTimer" data-id="${x.id}" aria-label="${t('focus_timer')}" aria-pressed="${focused}">${icon('clock')}</button>` : ''}</div>
    ${body}${moveForm}${timeForm}</li>`;
}

function viewPresets() {
  const wd = weekdayOf(ui.day);
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => (S.presets[d] || []).length);
  const todayHas = (S.presets[wd] || []).length > 0;
  return `<section class="card">
      <h3>${t('presets')}</h3>
      ${days.length ? days.map((d) => `<div class="preset">
        <div class="preset-head">
          <b>${t('wd')[d]}</b>
          <button class="ghost" data-act="applyPreset" data-wd="${d}">${t('apply_preset')}</button>
          <button class="icon-btn" data-act="clearPreset" data-wd="${d}" title="${t('clear_preset')}">${icon('trash')}</button>
        </div>
        <ul class="mini">${(S.presets[d] || []).map((p) => `<li>${icon((catById(p.catId) || {}).icon || 'star')}<span>${esc(p.title)}</span><small>${p.minutes} ${t('min')}${p.startAt ? ` · ${t('auto_at')} ${esc(p.startAt)}` : ''}</small></li>`).join('')}</ul>
      </div>`).join('') : `<p class="empty">${t('presets_empty')}</p>`}
      <div class="acts">
        <button data-act="savePreset">${icon('plus')} ${t('save_preset')}</button>
      </div>
      <p class="muted hint">${t('preset_hint')}</p>
    </section>`;
}

function viewTasks() {
  const list = sortTasks(S.days[ui.day] || []);
  const active = list.filter((x) => ['running', 'ask'].includes(x.status));
  const rest = list.filter((x) => !['running', 'ask'].includes(x.status));
  const focusId = active.some((x) => x.id === ui.focusTask) ? ui.focusTask : (active[0] || {}).id;
  const completed = list.filter((x) => x.status === 'done').length;
  const sorts = [['manual', 'sort_manual'], ['cat', 'sort_cat'], ['status', 'sort_status'], ['time', 'sort_time']];
  const isToday = ui.day === keyOf(new Date());
  const heading = isToday ? t('today') : parseKey(ui.day).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
  const card = (x) => taskCard(x, list.indexOf(x), list.length, x.id === focusId);
  return `
    <section class="day-hero">
      <div class="day-heading"><div><p class="eyebrow">${esc(t('wd')[weekdayOf(ui.day)])} · ${esc(parseKey(ui.day).toLocaleDateString(locale(), {day:'numeric',month:'long'}))}</p>
        <h2>${esc(heading)}</h2></div>
        <div class="day-arrows"><button class="icon-btn ghost" data-act="day" data-n="-1" aria-label="${t('previous_day')}" aria-keyshortcuts="ArrowLeft">${icon('left')}</button>
        <span class="date-jump" title="${t('go_to_date')}">${icon('calendar')}<input type="date" data-change="jumpDay" data-transient value="${ui.day}" aria-label="${t('go_to_date')}"></span>
        <button class="icon-btn ghost" data-act="day" data-n="1" aria-label="${t('next_day')}" aria-keyshortcuts="ArrowRight">${icon('right')}</button></div></div>
      ${list.length ? `<p class="day-summary"><b>${completed}</b> ${t('of')} ${list.length} ${t('tasks_done')}<span>·</span>${fmtDur(sum(list.map((x) => +x.minutes || 0)))} ${t('planned')}</p>` : ''}
    </section>
    ${active.length ? `<div class="section-label"><span class="live-dot"></span>${t('focus')}<small>${active.length}</small></div><ul class="tasks focus-list">${active.map(card).join('')}</ul>` : ''}
    ${rest.length ? `<div class="toolbar plan-toolbar"><h3>${t('day_plan')}</h3><label><span class="sr-only">${t('sort')}</span><select aria-label="${t('sort')}" data-change="sort">${sorts.map(([v,k]) => `<option value="${v}" ${ui.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></label></div>` : ''}
    ${rest.length ? `<ul class="tasks">${rest.map(card).join('')}</ul>` : !list.length ? `<section class="empty-day"><span class="empty-symbol">${icon('tasks')}</span><h3>${t('empty_title')}</h3><p>${t('empty_hint')}</p></section>` : ''}
    <div class="day-actions"><button class="primary add-task" data-act="openSheet" data-sheet="addTask" aria-keyshortcuts="N">${icon('plus')} ${t('new_task')}</button>${!isToday ? `<button class="ghost" data-act="today" aria-keyshortcuts="T">${t('today')}</button>` : ''}</div>
    <details class="quiet-section" data-disclosure="presets"><summary>${t('presets')}<span>${Object.values(S.presets).filter((a) => a.length).length}</span></summary>${viewPresets()}</details>
    <details class="quiet-section" data-disclosure="backlog"><summary>${t('backlog')}<span>${S.backlog.length}</span></summary>
      ${S.backlog.length ? `<ul class="mini">${S.backlog.map((x) => `<li>${icon((catById(x.catId) || {}).icon || 'star')}<span>${esc(x.title)}</span><button class="ghost" data-act="fromBacklog" data-id="${x.id}">${t('to_day')}</button><button class="icon-btn" data-act="delBacklog" data-id="${x.id}" aria-label="${t('delete')}">${icon('trash')}</button></li>`).join('')}</ul>` : `<p class="empty">${t('none')}</p>`}
    </details>`;
}

function weekRange(d) {
  const start = addDays(d, -((parseKey(d).getDay() + 6) % 7));
  return { start, end: addDays(start, 6) };
}
function periodPred() {
  const d = ui.statsDay;
  if (ui.period === 'day') return (k) => k === d;
  if (ui.period === 'week') {
    const { start, end } = weekRange(d);
    return (k) => k >= start && k <= end;
  }
  if (ui.period === 'month') return (k) => monthOf(k) === monthOf(d);
  return () => true;
}
function periodLabel() {
  const d = parseKey(ui.statsDay);
  const year = d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {};
  if (ui.period === 'day') return cap(d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long', ...year }));
  if (ui.period === 'month') return cap(d.toLocaleDateString(locale(), { month: 'long', year: 'numeric' }));
  const { start, end } = weekRange(ui.statsDay);
  const f = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', ...year });
  return f.formatRange ? f.formatRange(parseKey(start), parseKey(end)) : `${f.format(parseKey(start))} – ${f.format(parseKey(end))}`;
}
function shiftStats(n) {
  ui.statsDay = ui.period === 'day' ? addDays(ui.statsDay, n)
    : ui.period === 'week' ? addDays(ui.statsDay, 7 * n)
    : `${shiftMonth(monthOf(ui.statsDay), n)}-01`;
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
    <div class="periods">${periods.map(([v, k]) => `<button class="${ui.period === v ? 'on' : ''}" data-act="period" data-p="${v}" aria-pressed="${ui.period === v}">${t(k)}</button>`).join('')}</div>
    ${ui.period !== 'all' ? `<div class="card daybar">
      <button class="icon-btn" data-act="statsShift" data-n="-1" aria-label="${t('previous_period')}" aria-keyshortcuts="ArrowLeft">${icon('left')}</button>
      <b>${esc(periodLabel())}</b>
      <button class="icon-btn" data-act="statsShift" data-n="1" aria-label="${t('next_period')}" aria-keyshortcuts="ArrowRight">${icon('right')}</button>
    </div>` : ''}
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
  const salaryTotal = sum(monthPaydates(m).map((r) => r.amount));
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
  const monthLabel = cap(new Date(+m.slice(0, 4), +m.slice(5) - 1, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }));
  return `
    <div class="card daybar">
      <button class="icon-btn" data-act="month" data-n="-1" aria-label="${t('previous_month')}" aria-keyshortcuts="ArrowLeft">${icon('left')}</button>
      <b>${esc(monthLabel)}</b>
      <button class="icon-btn" data-act="month" data-n="1" aria-label="${t('next_month')}" aria-keyshortcuts="ArrowRight">${icon('right')}</button>
    </div>
    <section class="card balance-card">
      <p class="eyebrow">${t('balance')}</p><b class="balance-value ${savings < 0 ? 'neg' : ''}">${money(savings)}</b>
      <div class="balance-breakdown"><div><span>${t('income')}</span><b>${money(income)}</b></div><div><span>${t('expenses')}</span><b>${money(spent)}</b></div></div>
      <details class="finance-details" data-disclosure="finance"><summary>${t('details')}</summary><div class="tiles">
        <div class="tile"><small>${t('efficiency')}</small><b class="${eff >= 0 ? 'pos' : 'neg'}">${eff}%</b></div>
        <div class="tile"><small>${t('unneeded')}</small><b>${money(unneeded)}</b></div>
        <div class="tile"><small>${t('unneeded_share')}</small><b>${unShare}%</b></div>
      </div></details>
      ${np && np.amount > 0 ? `<p class="muted payday">${t('next_payday')}: ${esc(fmtDate(np.key))} · ${money(np.amount)}</p>` : ''}
    </section>
    <div class="row2 finance-actions"><button class="primary" data-act="openSheet" data-sheet="addExpense" aria-keyshortcuts="N">− ${t('expense_short')}</button><button data-act="openSheet" data-sheet="addIncome">${icon('plus')} ${t('income_short')}</button></div>
    <section class="card"><h3>${t('by_cat')}</h3>${byCat.length ? bars(byCat, money) : `<p class="muted finance-empty">${t('empty_finance')}</p>`}</section>


    <section class="card">
      <h3>${t('transactions')}</h3><ul class="mini transactions">${rows.length ? rows.map((r) => `<li><small>${esc(fmtShortDate(r.x.date))}</small><span>${esc(r.sub)}</span>
        <b class="${r.kind === 'income' ? 'pos' : 'neg'}">${r.kind === 'income' ? '+' : '−'}${money(r.x.amount)}</b>
        <button class="icon-btn" data-act="delFin" data-kind="${r.kind}" data-id="${r.x.id}" aria-label="${t('delete')}">${icon('trash')}</button></li>`).join('') : `<li class="empty">${t('no_transactions')}</li>`}</ul>
    </section>`;
}

function catEditor(kind, list, formKind) {
  return `<ul class="mini">${list.map((c) => `<li>${icon(c.icon)}<span>${esc(label(c))}</span>
      <button class="icon-btn" data-act="delCat" data-kind="${kind}" data-id="${c.id}" aria-label="${t('delete')}">${icon('trash')}</button></li>`).join('')}</ul>
    <form class="form" data-form="${formKind}">
      <input name="name" placeholder="${t('name')}" required maxlength="30">
      <div class="icon-grid">${CAT_ICONS.map((n, i) => `<label class="ico"><input type="radio" name="icon" value="${n}" ${i === 0 ? 'checked' : ''}>${icon(n)}</label>`).join('')}</div>
      ${kind === 'cats' ? '<input name="color" type="color" value="#d4af37">' : ''}
      <button class="primary">${icon('plus')} ${t('add_cat')}</button>
    </form>`;
}

function viewSettings() {
  return `
    <section class="card form">
      <h3>${t('settings')}</h3>
      <label>${t('language')}${S.lang === 'en' ? '' : ' · Language'}<select data-change="lang">${UI_LANGS.map((c) => `<option value="${c}" ${S.lang === c ? 'selected' : ''}>${esc(T[c].lang_name || c)}</option>`).join('')}</select></label>
      <label>${t('theme')}<select data-change="theme">${[['dark', 'dark'], ['light', 'light'], ['system', 'theme_system']].map(([v, k]) => `<option value="${v}" ${S.theme === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></label>
      <label>${t('currency')}<select data-change="currency">${Object.keys(CUR).map((c) => `<option value="${c}" ${S.currency === c ? 'selected' : ''}>${c} ${CUR[c]}</option>`).join('')}</select></label>
    </section>
    <section class="card">
      <h3>${t('pay_title')}</h3>
      <ul class="mini">${[...S.fin.pays].sort((a, b) => a.day - b.day).map((p) => `<li class="pays-row">
        <input type="number" min="1" max="31" value="${p.day}" data-change="payDay" data-id="${p.id}" aria-label="${t('pay_day')}">
        <input type="number" min="0" step="0.01" value="${p.amount}" data-change="payAmount" data-id="${p.id}" aria-label="${t('pay_amount')}">
        <button class="icon-btn" data-act="payDel" data-id="${p.id}" title="${t('delete')}">${icon('trash')}</button></li>`).join('') || `<li class="empty">${t('pay_empty')}</li>`}</ul>
      <div class="acts"><button data-act="payAdd">${icon('plus')} ${t('pay_add')}</button></div>
      <label class="check"><input type="checkbox" data-change="shift" ${S.fin.shiftWeekend ? 'checked' : ''}> ${t('shift_weekend')}</label>
    </section>
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
    <section class="card">
      <h3>${t('help')}</h3>
      <div class="acts">
        <button data-act="intro">${icon('play')} ${t('intro_show')}</button>
        ${installPrompt ? `<button data-act="install">${icon('download')} ${t('install_app')}</button>` : ''}
      </div>
      <p class="muted hint shortcut-hint">${t('shortcuts')}: ${t('shortcuts_text')}</p>
    </section>
    <section class="card" id="syncSection"><h3>${t('sync_title')}</h3>${viewSync()}</section>
    <p class="muted version">Timecon ${BUILD}</p>`;
}

const NOTE_ICONS = ['note', 'note2', 'filetext', 'image', 'pin', 'list', 'clipboard', 'palette', 'star', 'heart', 'book', 'briefcase', 'code', 'music', 'cart', 'home'];

// ---- Подсветка синтаксиса ----
const LANGS = {
  js: { title: 'JavaScript', line: '//', block: ['/*', '*/'], quotes: '\'"`', kw: 'const let var function return if else for while do break continue new class extends super this typeof instanceof in of try catch finally throw async await yield import export from default delete void switch case static get set null undefined', boo: 'true false null undefined NaN Infinity' },
  ts: { title: 'TypeScript', line: '//', block: ['/*', '*/'], quotes: '\'"`', kw: 'const let var function return if else for while do break continue new class extends implements interface type enum super this typeof instanceof in of try catch finally throw async await yield import export from default delete void switch case static get set public private protected readonly namespace declare abstract as satisfies null undefined', boo: 'true false null undefined' },
  python: { title: 'Python', line: '#', block: null, quotes: '\'"', kw: 'def return if elif else for while break continue class import from as try except finally raise with lambda pass global nonlocal assert yield async await del in is not and or None self True False', boo: 'True False None' },
  sql: { title: 'SQL', line: '--', block: ['/*', '*/'], quotes: '\'"`', kw: 'select insert update delete create alter drop table from where join left right inner outer on group by order having limit offset values into set and or not null is as distinct count sum avg min max union all case when then end primary key foreign references index unique default check constraint', boo: 'null true false' },
  bash: { title: 'Shell', line: '#', block: null, quotes: '\'"', kw: 'if then else fi for while do done case esac function return export local read echo cd ls mkdir rm cp mv cat grep sed awk curl wget git npm sudo apt docker chmod chown tar ssh scp kill ps touch find xargs which source exit set unset', boo: 'true false' },
  clike: { title: 'C / Java', line: '//', block: ['/*', '*/'], quotes: '\'"', kw: 'int long short char float double void bool boolean string struct class public private protected static final const new return if else for while do break continue switch case default try catch finally throw throws import package using namespace include define typedef unsigned signed true false null nullptr this super extends implements interface enum var let function print println printf System', boo: 'true false null' },
  css: { title: 'CSS', line: null, block: ['/*', '*/'], quotes: '\'"', kw: 'important media supports keyframes import charset from to and not', boo: '' },
  html: { title: 'HTML', line: null, block: ['<!--', '-->'], quotes: '\'"', kw: '', boo: '' },
  json: { title: 'JSON', line: null, block: null, quotes: '"', kw: '', boo: 'true false null' },
  php: { title: 'PHP', line: '//', block: ['/*', '*/'], quotes: '\'"', kw: 'function return if else elseif for foreach while do break continue class extends implements public private protected static new echo print try catch finally throw use namespace require include array null true false this self', boo: 'true false null' },
};
const LANG_ORDER = ['js', 'ts', 'python', 'html', 'css', 'json', 'sql', 'bash', 'clike', 'php'];
function detectLang(src) {
  const s = String(src || '').trim();
  if (!s) return '';
  if (/^<\?php/.test(s)) return 'php';
  if (/^<!doctype|<html[\s>]|<\/(div|span|body|head|p|ul|li|a|table|h[1-6])>/i.test(s)) return 'html';
  if (/^[{[]/.test(s)) { try { JSON.parse(s); return 'json'; } catch (e) { /* не JSON */ } }
  if (/^\s*(select|insert|update|delete|create|alter|drop)\b[\s\S]*\b(from|into|table|set|where|values)\b/i.test(s)) return 'sql';
  if (/^#!|^\s*(sudo|apt|apt-get|brew|npm|yarn|pnpm|git|cd|ls|mkdir|curl|wget|docker|pip|python3?)\s+[-\w./]/m.test(s)) return 'bash';
  if (/\b(def|elif|lambda|self)\b|^\s*from\s+\w+\s+import\s/m.test(s)) return 'python';
  if (/^\s*[.#@]?[A-Za-z][\w-]*[^{}]*\{[^}]*[\w-]+\s*:\s*[^;}]+;/m.test(s)) return 'css';
  if (/\b(interface|type|enum)\s+\w+\s*[={]|:\s*(string|number|boolean|any)\b|\breadonly\b|\bsatisfies\b/.test(s)) return 'ts';
  if (/\b(const|let|var|function|=>|import|export|class|async|await|console\.log)\b/.test(s)) return 'js';
  if (/#include|using namespace|public\s+(static\s+)?(void|class)|System\.out|fmt\./.test(s)) return 'clike';
  if (/[{};]$|\)\s*{$/.test(s)) return 'clike';
  return '';
}
function highlightCode(src, lang) {
  const L = LANGS[lang];
  const escH = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  if (!L) return escH(src);
  if (lang === 'html') return highlightHtml(src);
  const kw = new Set(L.kw.split(/\s+/).filter(Boolean));
  const boo = new Set((L.boo || '').split(/\s+/).filter(Boolean));
  const out = [];
  const push = (cls, text) => out.push(cls ? `<span class="tok-${cls}">${escH(text)}</span>` : escH(text));
  const n = src.length;
  let i = 0;
  while (i < n) {
    if (L.line && src.startsWith(L.line, i)) {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      push('com', src.slice(i, j));
      i = j;
      continue;
    }
    if (L.block && src.startsWith(L.block[0], i)) {
      let j = src.indexOf(L.block[1], i + L.block[0].length);
      j = j < 0 ? n : j + L.block[1].length;
      push('com', src.slice(i, j));
      i = j;
      continue;
    }
    const c = src[i];
    if (L.quotes.includes(c)) {
      const triple = (c === '"' || c === "'") && src.startsWith(c + c + c, i);
      const q = triple ? c + c + c : c;
      let j = i + q.length;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src.startsWith(q, j)) { j += q.length; break; }
        if (!triple && src[j] === '\n') break;
        j++;
      }
      j = Math.min(j, n);
      const tail = src.slice(j, j + 30);
      const isKey = lang === 'json' && /^\s*:/.test(tail);
      push(isKey ? 'key' : 'str', src.slice(i, j));
      i = j;
      continue;
    }
    if (/[0-9]/.test(c) && !/[\w$]/.test(src[i - 1] || '')) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObB._]/.test(src[j])) j++;
      push('num', src.slice(i, j));
      i = j;
      continue;
    }
    if (/[A-Za-z_$@#]/.test(c)) {
      let j = i;
      while (j < n && /[\w$-]/.test(src[j])) j++;
      const w = src.slice(i, j);
      if (kw.has(w)) push('kw', w);
      else if (boo.has(w)) push('boo', w);
      else if (/^[.#@]/.test(w)) push('kw', w);
      else if (/^\s*\(/.test(src.slice(j))) push('fn', w);
      else push(null, w);
      i = j;
      continue;
    }
    push(null, c);
    i++;
  }
  return out.join('');
}
function highlightHtml(src) {
  const escH = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) { out += escH(src.slice(i)); break; }
    out += escH(src.slice(i, lt));
    if (src.startsWith('<!--', lt)) {
      let j = src.indexOf('-->', lt);
      j = j < 0 ? n : j + 3;
      out += `<span class="tok-com">${escH(src.slice(lt, j))}</span>`;
      i = j;
      continue;
    }
    const gt = src.indexOf('>', lt);
    if (gt < 0) { out += escH(src.slice(lt)); break; }
    const tag = src.slice(lt, gt + 1);
    const m = tag.match(/^<(\/?)([\w-]+)/);
    if (!m) { out += escH(tag); i = gt + 1; continue; }
    out += `<span class="tok-tag">${escH('<' + m[1] + m[2])}</span>`;
    let rest = tag.slice(1 + m[1].length + m[2].length);
    const close = rest.match(/(\/?)>$/);
    if (close) rest = rest.slice(0, rest.length - close[0].length);
    const re = /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?|(\s+)|([^\s]+)/g;
    let mm;
    while ((mm = re.exec(rest))) {
      if (mm[1]) {
        out += `<span class="tok-attr">${escH(mm[1])}</span>${escH(mm[2] || '')}`;
        if (mm[3]) out += `<span class="tok-str">${escH(mm[3])}</span>`;
      } else if (mm[4]) out += escH(mm[4]);
      else out += escH(mm[5]);
    }
    out += escH(close ? close[0] : '>');
    i = gt + 1;
  }
  return out;
}

function notePreview(n) {
  const b = (n.blocks || []).find((x) => (x.type === 'text' || x.type === 'code') && x.text && x.text.trim());
  if (b) return b.text.trim().replace(/\s+/g, ' ').slice(0, 90);
  if ((n.blocks || []).some((x) => x.type === 'photo')) return t('note_add_photo');
  return t('none');
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('image'));
      img.src = fr.result;
    };
    fr.onerror = () => reject(new Error('read'));
    fr.readAsDataURL(file);
  });
}
async function noteAddPhotos(files) {
  const n = S.notes.find((x) => x.id === ui.noteId);
  if (!n) return;
  for (const f of files) {
    try {
      const src = await fileToDataUrl(f);
      n.blocks.push({ id: uid(), type: 'photo', src });
    } catch (e) { alert(t('note_photo_fail')); }
  }
  n.updatedAt = Date.now();
  persist();
}
function noteCard(n) {
  return `<div class="card note-card" data-act="noteOpen" data-id="${n.id}" role="button" tabindex="0">
    <div class="note-head"><span class="note-ico">${icon(n.icon || 'note')}</span>
      <div class="note-meta"><b>${esc(n.title || t('note_title'))}</b>
      <small>${t('note_updated')}: ${fmtDateTime(n.updatedAt || Date.now())}</small></div>
      <button class="icon-btn" data-act="noteDel" data-id="${n.id}" aria-label="${t('delete')}">${icon('trash')}</button></div>
    <p class="muted">${esc(notePreview(n))}</p></div>`;
}
function noteBlock(b, i, total) {
  const typeName = b.type === 'text' ? t('note_add_text') : b.type === 'photo' ? t('note_add_photo') : t('note_add_code');
  let body = '';
  if (b.type === 'photo') {
    body = `<img class="note-photo" src="${esc(b.src)}" alt="">`;
  } else if (b.type === 'code') {
    const detected = b.lang ? '' : detectLang(b.text || '');
    const label = b.lang ? b.lang : (detected ? `${detected} · ${t('auto')}` : t('auto'));
    body = `<input data-lang="${b.id}" value="${esc(b.lang || '')}" placeholder="${t('note_code_lang')}" maxlength="20" list="langList">
      <div class="code-wrap">
        <pre class="code-view" data-code-view="${b.id}" aria-hidden="true">${highlightCode(b.text || '', b.lang || detected || 'js')}</pre>
        <textarea class="code" data-block="${b.id}" rows="4" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="${t('note_add_code')}">${esc(b.text || '')}</textarea>
      </div>
      <small class="muted">${t('note_lang')}: ${esc(label)}</small>`;
  } else {
    body = `<textarea data-block="${b.id}" rows="3" placeholder="${t('note_add_text')}">${esc(b.text || '')}</textarea>`;
  }
  return `<div class="card note-block">
    <div class="note-block-head"><span class="muted">${typeName}</span>
      <button class="icon-btn" data-act="noteUp" data-id="${b.id}" aria-label="${t('up')}" ${i === 0 ? 'disabled' : ''}>${icon('right', 'rot-up')}</button>
      <button class="icon-btn" data-act="noteDown" data-id="${b.id}" aria-label="${t('down')}" ${i === total - 1 ? 'disabled' : ''}>${icon('right', 'rot-down')}</button>
      <button class="icon-btn" data-act="noteBlockDel" data-id="${b.id}" aria-label="${t('delete')}">${icon('trash')}</button></div>
    ${body}</div>`;
}
function viewNoteEditor() {
  const n = S.notes.find((x) => x.id === ui.noteId);
  if (!n) { ui.noteId = null; return viewNotes(); }
  const picker = ui.noteIconPick
    ? `<div class="icon-grid">${NOTE_ICONS.map((nm) => `<button class="ico ${n.icon === nm ? 'on' : ''}" data-act="noteIconSet" data-icon="${nm}">${icon(nm)}</button>`).join('')}</div>`
    : '';
  return `
    <div class="toolbar">
      <button class="ghost" data-act="noteBack">${icon('left')} ${t('back')}</button>
      <span class="muted" id="noteUpdated">${t('note_updated')}: ${fmtDateTime(n.updatedAt || Date.now())}</span>
    </div>
    <div class="card form">
      <div class="note-title-row">
        <button class="icon-btn note-ico-btn" data-act="noteIconPick" title="${t('note_icon')}">${icon(n.icon || 'note')}</button>
        <input data-note-title value="${esc(n.title || '')}" placeholder="${t('note_title')}" maxlength="80">
      </div>
      ${picker}
    </div>
    <div class="note-blocks">${n.blocks.length ? n.blocks.map((b, i) => noteBlock(b, i, n.blocks.length)).join('') : `<p class="empty">${t('none')}</p>`}</div>
    <div class="card acts">
      <button data-act="noteAdd" data-type="text">${icon('filetext')} ${t('note_add_text')}</button>
      <button data-act="notePickPhoto">${icon('image')} ${t('note_add_photo')}</button>
      <button data-act="noteAdd" data-type="code">${icon('code')} ${t('note_add_code')}</button>
    </div>
    <p class="muted">${t('note_blocks_hint')}</p>
    <datalist id="langList">${LANG_ORDER.map((k) => `<option value="${k}">${LANGS[k].title}</option>`).join('')}</datalist>
    <input type="file" id="notePhoto" accept="image/*" multiple hidden data-change="notePhoto">`;
}
function viewNotes() {
  if (ui.noteId) return viewNoteEditor();
  const notes = [...S.notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return `<button class="primary" data-act="noteNew" aria-keyshortcuts="N">${icon('plus')} ${t('note_new')}</button>
    ${notes.length ? notes.map(noteCard).join('') : `<p class="empty">${t('note_empty')}</p>`}`;
}

const NAV = [['tasks', 'tasks'], ['notes', 'note'], ['stats', 'chart'], ['finance', 'wallet'], ['settings', 'gear']];
const VIEWS = { tasks: viewTasks, notes: viewNotes, stats: viewStats, finance: viewFinance, settings: viewSettings };

// Native dialog supplies keyboard trapping, Escape, and inert background.
let sheetTrigger = null;
let sheetScroll = 0;
function sheetForm(kind) {
  const catOpts = S.fin.cats.map((c) => `<option value="${c.id}">${esc(label(c))}</option>`).join('');
  switch (kind) {
    case 'addTask': return `
    <form class="form sheet-form" data-form="addTask">
      <label>${t('task_title')}<input name="title" placeholder="${t('task_title')}" required maxlength="80" autocomplete="off"></label>
      <div class="row2">
        <label>${t('minutes')}<input name="minutes" type="number" min="1" max="600" value="25" required inputmode="numeric"></label>
        <label>${t('category')}<select name="cat">${S.cats.map((c) => `<option value="${c.id}">${esc(label(c))}</option>`).join('')}</select></label>
      </div>
      <details class="advanced"><summary>${t('more')}</summary><label>${t('auto_start')}<input name="startAt" type="time"></label>
      <p class="muted hint">${t('auto_hint')}</p></details>
      <button class="primary">${icon('plus')} ${t('add')}</button>
    </form>`;
    case 'addIncome': return `
    <form class="form sheet-form" data-form="addIncome">
      <div class="row2">
        <label>${t('amount')}<input name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" required></label>
        <label>${t('date')}<input name="date" type="date" value="${keyOf(new Date())}" required></label>
      </div>
      <label>${t('note')}<input name="note" placeholder="${t('note')}" maxlength="60"></label>
      <button class="primary">${icon('plus')} ${t('add_income')}</button>
    </form>`;
    case 'addExpense': return `
    <form class="form sheet-form" data-form="addExpense">
      <div class="row2">
        <label>${t('amount')}<input name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" required></label>
        <label>${t('date')}<input name="date" type="date" value="${keyOf(new Date())}" required></label>
      </div>
      <div class="row2">
        <label>${t('cat_fin')}<select name="catId">${catOpts}</select></label>
        <label class="check"><input type="checkbox" name="needed" checked> ${t('needed')}</label>
      </div>
      <label>${t('note')}<input name="note" placeholder="${t('note')}" maxlength="60"></label>
      <button class="primary">${icon('plus')} ${t('add_expense')}</button>
    </form>`;
    default: return '';
  }
}
function openSheet(kind) {
  const content = sheetForm(kind);
  if (!content) return;
  const dialog = $('#entrySheet');
  sheetTrigger = document.activeElement;
  sheetScroll = window.scrollY;
  dialog.innerHTML = `<div class="sheet-head"><h2 id="sheetTitle">${t(kind === 'addTask' ? 'new_task' : kind === 'addIncome' ? 'add_income' : 'add_expense')}</h2><button type="button" class="icon-btn ghost" data-act="closeSheet" aria-label="${t('close')}">${icon('x')}</button></div>${content}`;
  document.body.classList.add('sheet-open');
  document.body.style.top = `-${sheetScroll}px`;
  dialog.showModal();
  dialog.querySelector('input').focus();
}
function closeSheet() { const d = $('#entrySheet'); if (d.open) d.close(); }
function initSheet() {
  const dialog = document.createElement('dialog');
  dialog.id = 'entrySheet'; dialog.className = 'entry-sheet';
  dialog.setAttribute('aria-labelledby', 'sheetTitle');
  document.body.appendChild(dialog);
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) closeSheet();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('sheet-open'); document.body.style.top = '';
    window.scrollTo(0, sheetScroll);
    if (sheetTrigger && sheetTrigger.isConnected) sheetTrigger.focus({preventScroll:true});
    else $('#main [data-act="openSheet"]')?.focus({preventScroll:true});
  });
  const status = document.createElement('div'); status.id = 'actionStatus'; status.className = 'sr-only'; status.setAttribute('role','status'); document.body.appendChild(status);
}
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = () => motionPreference.matches;
motionPreference.addEventListener('change', (e) => {
  if (e.matches) document.getAnimations().forEach((animation) => animation.cancel());
});
function taskPositions() {
  return new Map([...document.querySelectorAll('[data-task-id]')].map((el) => [el.dataset.taskId, {rect: el.getBoundingClientRect(), status: el.dataset.status, focused: el.classList.contains('focused')}]));
}
function animateTasks(previous) {
  if (reduceMotion()) return;
  document.querySelectorAll('[data-task-id]').forEach((el) => {
    const prev = previous.get(el.dataset.taskId), rect = el.getBoundingClientRect();
    if (!prev) el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:220,easing:'ease-out'});
    else {
      const dy = prev.rect.top - rect.top;
      if (Math.abs(dy) > 1) el.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
      if (prev.status !== el.dataset.status || prev.focused !== el.classList.contains('focused')) {
        el.animate([{backgroundColor:el.dataset.status === 'done' ? 'color-mix(in srgb, var(--ok) 14%, var(--card))' : 'var(--card2)'},{backgroundColor:getComputedStyle(el).backgroundColor}],{duration:300});
        if (el.dataset.status === 'done') el.querySelectorAll('.mark path, .mark polyline').forEach((path) => path.animate([{strokeDasharray:40,strokeDashoffset:40},{strokeDasharray:40,strokeDashoffset:0}],{duration:300}));
      }
    }
  });
}

let renderedView = null;
function fieldKeys(root) {
  const seen = new Map();
  return [...root.querySelectorAll('input, select, textarea')].map((el) => {
    const form = el.closest('form');
    const base = (form ? form.dataset.form || 'f' : 'x') + '|' + (el.name || el.id || el.type);
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return { el, key: base + '#' + n };
  });
}
// Запоминаем введённое в поля, чтобы перерисовка от синхронизации не сбрасывала ввод.
function captureFields() {
  const root = $('#main');
  if (!root || renderedView !== ui.view) return null;
  const map = new Map();
  fieldKeys(root).forEach(({ el, key }) => {
    map.set(key, {
      value: el.type === 'checkbox' || el.type === 'radio' || el.type === 'file' ? null : el.value,
      checked: el.checked,
      focused: el === document.activeElement,
      selStart: el.selectionStart,
      selEnd: el.selectionEnd,
    });
  });
  return map;
}
function restoreFields(snap) {
  if (!snap) return;
  const root = $('#main');
  if (!root) return;
  let focus = null;
  fieldKeys(root).forEach(({ el, key }) => {
    const d = snap.get(key);
    if (!d) return;
    if (d.value !== null) el.value = d.value;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = d.checked;
    if (d.focused) focus = { el, s: d.selStart, e: d.selEnd };
  });
  if (focus) {
    try {
      focus.el.focus();
      if (focus.s !== null && focus.e !== null && focus.el.setSelectionRange) focus.el.setSelectionRange(focus.s, focus.e);
    } catch (e) { /* поле уже перерисовано */ }
  }
}
function render() {
  const snap = captureFields();
  const previous = taskPositions();
  const viewChanged = renderedView !== ui.view;
  const disclosures = [...document.querySelectorAll('#main details[data-disclosure]')].filter((el) => el.open).map((el) => el.dataset.disclosure);
  const focused = document.activeElement?.closest('#main [data-act]');
  const focusKey = focused ? {act:focused.dataset.act, id:focused.dataset.id, n:focused.dataset.n, wd:focused.dataset.wd} : null;
  const keepScroll = renderedView === ui.view ? window.scrollY : 0;
  document.documentElement.dataset.theme = S.theme;
  document.documentElement.lang = S.lang;
  $('#nav').style.setProperty('--tab', NAV.findIndex(([v]) => v === ui.view));
  if (!$('#nav').children.length) $('#nav').innerHTML = NAV.map(([v, ic]) => `<button aria-current="${ui.view === v ? 'page' : 'false'}" class="${ui.view === v ? 'on' : ''}" data-act="tab" data-v="${v}">${icon(ic)}<span>${t(v)}</span></button>`).join('');
  $('#nav').querySelectorAll('[data-v]').forEach((button) => { const active = button.dataset.v === ui.view; button.classList.toggle('on', active); button.setAttribute('aria-current', active ? 'page' : 'false'); button.querySelector('span').textContent = t(button.dataset.v); });
  $('#main').innerHTML = VIEWS[ui.view]();
  $('#main').querySelectorAll('button[title]').forEach((button) => { if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.title); });
  renderedView = ui.view;
  restoreFields(snap);
  if (!viewChanged) {
    document.querySelectorAll('#main details[data-disclosure]').forEach((el) => { el.open = disclosures.includes(el.dataset.disclosure); });
    if (focusKey) [...document.querySelectorAll('#main [data-act]')].find((el) => el.dataset.act === focusKey.act && el.dataset.id === focusKey.id && el.dataset.n === focusKey.n && el.dataset.wd === focusKey.wd)?.focus({preventScroll:true});
  }
  if (viewChanged && !reduceMotion()) $('#main').animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:160,easing:'ease-out'});
  else animateTasks(previous);
  window.scrollTo(0, keepScroll);
  updateWarn();
}
// Предупреждение, пока не выполнен вход: иначе данные живут только на этом устройстве.
function updateWarn() {
  const el = $('#warn');
  if (!el) return;
  const needLogin = !!sbc() && !sync.user;
  el.hidden = !needLogin;
  if (!needLogin) return;
  const opened = !!el.querySelector('details[open]');
  el.innerHTML = `<div class="local-storage"><details ${opened ? 'open' : ''}><summary aria-label="${t('storage_info')}">${icon('home')} ${t('local_data')}</summary><p>${t('warn_text')}</p></details><button class="ghost" data-act="warnLogin">${t('enable_sync')}</button></div>`;
}

const SYNC_KEY = 'timecon.sync';
let ver = 0;
let dirty = localStorage.getItem('timecon.dirty') === '1' || !localStorage.getItem(SYNC_KEY);
function setDirty(v) { dirty = v; localStorage.setItem('timecon.dirty', v ? '1' : '0'); }
const cfg = window.TIMECON_SUPABASE || {};
const sync = { user: null, client: null, channel: null, updated: 0, timer: null, email: '', sent: false, msg: '', recovery: false, forgot: false, forgotSent: false, busy: false, syncing: false, pending: false };
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
  sync.timer = setTimeout(pullSafe, 800);
}
function unionById(a = [], b = []) {
  const m = new Map();
  [...b, ...a].forEach((x) => m.set(x.id, x));
  return [...m.values()];
}
// Объединение, где при совпадении id побеждает более свежая правка (по updatedAt).
// Нужно, чтобы статус задачи с одного устройства не затирался старой копией с другого.
function unionNewer(a = [], b = []) {
  const m = new Map();
  [...b, ...a].forEach((x) => {
    const prev = m.get(x.id);
    if (!prev) { m.set(x.id, x); return; }
    m.set(x.id, (x.updatedAt || 0) >= (prev.updatedAt || 0) ? x : prev);
  });
  return [...m.values()];
}
// Чистим зависшие состояния: записи таймеров без задач «running»
// и задачи «running» без записей таймеров (бывает после объединения
// данных с двух устройств). Заодно приводит старый формат к массиву.
function reconcileRunning(st) {
  const list = Array.isArray(st.running) ? st.running : (st.running ? [st.running] : []);
  const byId = {};
  Object.values(st.days || {}).forEach((arr) => (arr || []).forEach((x) => { byId[x.id] = x; }));
  (st.backlog || []).forEach((x) => { byId[x.id] = x; });
  const hasRun = new Set(list.filter((r) => r && r.taskId).map((r) => r.taskId));
  // Задача помечена running, а таймера нет — возвращаем в невыполненные.
  Object.values(byId).forEach((x) => {
    if (x && x.status === 'running' && !hasRun.has(x.id)) {
      x.status = 'pending';
      x.startedAt = null;
    }
  });
  const kept = list.filter((r) => r && byId[r.taskId] && byId[r.taskId].status === 'running');
  st.running = kept.length ? kept : null;
  return st;
}
function mergeState(local, remote) {
  const base = { ...defaults(), ...remote };
  const days = { ...base.days };
  Object.keys(local.days || {}).forEach((k) => { days[k] = unionNewer(local.days[k], base.days[k]); });
  return reconcileRunning({
    ...base,
    lang: local.lang, theme: local.theme, currency: local.currency,
    cats: unionById(local.cats, base.cats),
    presets: { ...base.presets, ...local.presets },
    days,
    backlog: unionNewer(local.backlog, base.backlog),
    notes: unionNewer(local.notes, base.notes),
    running: (() => {
      const norm = (r) => (Array.isArray(r) ? r : (r ? [r] : []));
      const m = new Map();
      [...norm(base.running), ...norm(local.running)].forEach((r) => { if (r && r.taskId) m.set(r.taskId, r); });
      return [...m.values()];
    })(),
    fin: {
      ...base.fin,
      ...local.fin,
      cats: unionById(local.fin.cats, base.fin.cats),
      incomes: unionById(local.fin.incomes, base.fin.incomes),
      expenses: unionById(local.fin.expenses, base.fin.expenses),
      pays: (() => {
        const m = new Map();
        [...(base.fin.pays || []), ...(local.fin.pays || [])].forEach((p) => m.set(String(p.day), p));
        return [...m.values()].sort((a, b) => a.day - b.day);
      })(),
    },
  });
}
async function uploadNow() {
  const now = Date.now();
  const v = ver;
  const { error } = await sbc().from('timecon_state').upsert({ user_id: sync.user.id, data: S, updated_at: now });
  if (error) throw error;
  syncMeta(now);
  if (v === ver) setDirty(false);
}
async function syncCycle() {
  if (!sync.user) return;
  const { data, error } = await sbc().from('timecon_state').select('data, updated_at').eq('user_id', sync.user.id).maybeSingle();
  if (error) throw error;
  let changed = false;
  if (!data) {
    await uploadNow();
  } else if (Number(data.updated_at) !== sync.updated) {
    if (dirty) {
      S = migrate(mergeState(S, data.data));
      save();
      await uploadNow();
      changed = true;
    } else {
      S = migrate({ ...defaults(), ...data.data });
      save();
      syncMeta(Number(data.updated_at));
      changed = true;
    }
  } else if (dirty) {
    await uploadNow();
  }
  if (sync.msg) { sync.msg = ''; changed = true; }
  if (changed) render();
}
function failSync() {
  sync.msg = 'sync_fail';
  render();
}
// Синхронизацию запускаем по одному разу за раз: Realtime, опрос и кнопка
// не должны выполнять цикл одновременно. Лишние вызовы схлопываются в один повтор.
function pullSafe() {
  if (sync.syncing) { sync.pending = true; return; }
  const run = async () => {
    sync.syncing = true;
    try { await syncCycle(); }
    catch (e) { failSync(); }
    finally {
      sync.syncing = false;
      if (sync.pending) { sync.pending = false; pullSafe(); }
    }
  };
  run();
}
// Мгновенное получение изменений с других устройств через Realtime.
function onRemote(payload) {
  const row = payload.new;
  if (!row || !row.updated_at) return;
  if (Number(row.updated_at) === sync.updated) return; // это отражение нашей же записи
  if (dirty) { pullSafe(); return; } // есть локальные правки — объединим на сервере
  S = migrate({ ...defaults(), ...row.data });
  save();
  syncMeta(Number(row.updated_at));
  render();
}
function watchRealtime() {
  const c = sbc();
  if (!c || !sync.user || sync.channel) return;
  sync.channel = c
    .channel(`timecon-${sync.user.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'timecon_state', filter: `user_id=eq.${sync.user.id}` }, onRemote)
    .subscribe();
}
function stopRealtime() {
  if (!sync.channel) return;
  sbc().removeChannel(sync.channel);
  sync.channel = null;
}
function syncInit() {
  const c = sbc();
  if (!c) return;
  c.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY') {
      sync.recovery = true;
      if (session) sync.user = session.user;
      render();
      updateWarn();
      return;
    }
    sync.user = session ? session.user : null;
    if (sync.user) { pullSafe(); watchRealtime(); }
    else { stopRealtime(); render(); }
    updateWarn();
  });
  handleOAuthReturn();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sync.user) pullSafe(); });
  window.addEventListener('focus', () => { if (sync.user) pullSafe(); });
  // Резервная синхронизация, если Realtime-канал отключился.
  setInterval(() => { if (sync.user && !document.hidden) pullSafe(); }, 15000);
}
// Возврат из Google и из письма восстановления пароля: в ссылке приходит ?code=, меняем его на сессию.
async function handleOAuthReturn() {
  let code = null;
  try { code = new URL(location.href).searchParams.get('code'); } catch (e) { return; }
  if (!code || !sbc()) return;
  try { history.replaceState(null, '', location.href.split('?')[0].split('#')[0]); } catch (e) { /* старые браузеры */ }
  const { error } = await sbc().auth.exchangeCodeForSession(code);
  if (error) { sync.msg = error.message; render(); }
}
async function syncGoogle() {
  sync.msg = '';
  sync.busy = true;
  render();
  try {
    const { error } = await sbc().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/' } });
    if (error) sync.msg = error.message;
  } catch (e) {
    sync.msg = e.message || t('sync_fail');
  } finally {
    sync.busy = false;
    render();
  }
}
async function syncForgot(email) {
  sync.msg = '';
  sync.busy = true;
  render();
  try {
    const { error } = await sbc().auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' });
    sync.forgotSent = !error;
    if (error) sync.msg = error.message;
  } catch (e) {
    sync.msg = e.message || t('sync_fail');
  } finally {
    sync.busy = false;
    render();
  }
}
async function syncSetPassword(pw1, pw2) {
  if (pw1 !== pw2) { sync.msg = 'sync_password_mismatch'; render(); return; }
  if (!sbc() || !sync.user) { sync.msg = 'sync_link_expired'; render(); return; }
  sync.busy = true;
  sync.msg = '';
  render();
  try {
    const { error } = await sbc().auth.updateUser({ password: pw1 });
    if (error) sync.msg = error.message;
    else { sync.recovery = false; sync.forgotSent = false; sync.msg = 'sync_password_updated'; }
  } catch (e) {
    sync.msg = e.message || t('sync_fail');
  } finally {
    sync.busy = false;
    render();
    updateWarn();
  }
  if (sync.user) pullSafe();
}
function isStandalone() {
  try { return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches; }
  catch (e) { return false; }
}
async function syncAuth(mode, email, password) {
  sync.msg = '';
  sync.busy = true;
  render();
  try {
    const c = sbc().auth;
    const { data, error } = mode === 'up'
      ? await c.signUp({ email, password })
      : await c.signInWithPassword({ email, password });
    if (error) sync.msg = error.message;
    else if (mode === 'up' && !data.session) sync.msg = 'sync_check_email';
    else sync.user = data.session ? data.session.user : null;
  } catch (e) {
    sync.msg = e.message || t('sync_fail');
  } finally {
    sync.busy = false;
    render();
    updateWarn();
  }
  if (sync.user) pullSafe();
}
function viewSync() {
  if (!sbc()) return `<p class="muted">${t('sync_not_config')}</p>`;
  if (sync.recovery) return `<form class="form" data-form="syncRecovery">
      <h3>${t('sync_recovery_title')}</h3>
      <input name="pw1" type="password" autocomplete="new-password" minlength="6" required placeholder="${t('sync_password')}">
      <input name="pw2" type="password" autocomplete="new-password" minlength="6" required placeholder="${t('sync_password2')}">
      <button class="primary">${t('sync_set_password')}</button></form>
    ${sync.msg ? `<p class="muted">${['sync_password_mismatch', 'sync_password_updated', 'sync_link_expired'].includes(sync.msg) ? t(sync.msg) : esc(sync.msg)}</p>` : ''}`;
  if (sync.user) return `<p class="muted">${t('sync_in')}: ${esc(sync.user.email)}</p>
    <p class="muted">${t('sync_last')}: ${sync.updated ? new Date(sync.updated).toLocaleString(locale()) : '—'}</p>
    <div class="acts"><button data-act="syncNow">${t('sync_now')}</button><button class="ghost" data-act="syncOut">${t('sync_out')}</button></div>
    ${sync.msg ? `<p class="muted">${sync.msg === 'sync_check_email' || sync.msg === 'sync_fail' ? t(sync.msg) : esc(sync.msg)}</p>` : ''}`;
  return `<form class="form" data-form="syncAuth">
      <input name="email" type="email" autocomplete="username" required placeholder="${t('sync_email')}">
      <input name="password" type="password" autocomplete="current-password" minlength="6" required placeholder="${t('sync_password')}">
      <p class="muted">${t('sync_hint')}</p>
      <div class="row2">
        <button class="primary" name="mode" value="in" ${sync.busy ? 'disabled' : ''}>${t('sync_login')}</button>
        <button name="mode" value="up" ${sync.busy ? 'disabled' : ''}>${t('sync_signup')}</button>
      </div></form>
    <div class="auth-alt">
      <button class="btn-google" data-act="google"><span class="g-logo">${GOOGLE_LOGO}</span><span>${t('sync_google')}</span></button>
      <button class="btn-link" data-act="forgotShow">${t('sync_forgot')}</button>
    </div>
    ${isStandalone() ? `<p class="muted">${t('sync_standalone_hint')}</p>` : ''}
    ${sync.forgot ? `<form class="form" data-form="syncForgot">
      <input name="email" type="email" autocomplete="username" required placeholder="${t('sync_email')}">
      <button>${t('sync_forgot_send')}</button></form>` : ''}
    ${sync.forgotSent ? `<p class="muted">${t('sync_forgot_sent')}</p>` : ''}
    ${sync.msg ? `<p class="muted">${sync.msg === 'sync_check_email' ? t(sync.msg) : esc(sync.msg)}</p>` : ''}`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  switch (a) {
    case 'openSheet': openSheet(b.dataset.sheet); return;
    case 'closeSheet': closeSheet(); return;
    case 'taskMore': ui.actionsId = ui.actionsId === id ? null : id; render(); return;
    case 'focusTimer': ui.focusTask = id; render(); return;
    case 'tab': ui.view = b.dataset.v; ui.moveId = null; ui.timeId = null; ui.noteId = null; break;
    case 'day': ui.day = addDays(ui.day, +b.dataset.n); ui.moveId = null; ui.timeId = null; break;
    case 'today': ui.day = keyOf(new Date()); break;
    case 'up': reorderTask(id, -1); break;
    case 'down': reorderTask(id, 1); break;
    case 'time': ui.timeId = ui.timeId === id ? null : id; break;
    case 'timeClear': setAutoTime(id, ''); ui.timeId = null; break;
    case 'month': ui.month = shiftMonth(ui.month, +b.dataset.n); break;
    case 'period': ui.period = b.dataset.p; break;
    case 'noteNew': {
      const n = { id: uid(), title: '', icon: 'note', updatedAt: Date.now(), blocks: [{ id: uid(), type: 'text', text: '' }] };
      S.notes.push(n);
      ui.noteId = n.id;
      ui.noteIconPick = false;
      break;
    }
    case 'noteOpen': ui.noteId = id; ui.noteIconPick = false; render(); return;
    case 'noteBack': ui.noteId = null; ui.noteIconPick = false; render(); return;
    case 'noteDel': {
      if (!confirm(t('note_confirm_del'))) return;
      S.notes = S.notes.filter((x) => x.id !== id);
      if (ui.noteId === id) ui.noteId = null;
      break;
    }
    case 'noteIconPick': ui.noteIconPick = !ui.noteIconPick; render(); return;
    case 'noteIconSet': {
      const n = S.notes.find((x) => x.id === ui.noteId);
      if (n) { n.icon = b.dataset.icon; n.updatedAt = Date.now(); }
      ui.noteIconPick = false;
      break;
    }
    case 'notePickPhoto': { const el = $('#notePhoto'); if (el) el.click(); return; }
    case 'noteAdd': {
      const n = S.notes.find((x) => x.id === ui.noteId);
      if (!n) return;
      n.blocks.push(b.dataset.type === 'code' ? { id: uid(), type: 'code', lang: '', text: '' } : { id: uid(), type: 'text', text: '' });
      n.updatedAt = Date.now();
      break;
    }
    case 'noteBlockDel': {
      const n = S.notes.find((x) => x.id === ui.noteId);
      if (!n) return;
      n.blocks = n.blocks.filter((x) => x.id !== id);
      n.updatedAt = Date.now();
      break;
    }
    case 'noteUp': case 'noteDown': {
      const n = S.notes.find((x) => x.id === ui.noteId);
      if (!n) return;
      const i = n.blocks.findIndex((x) => x.id === id);
      const j = a === 'noteUp' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= n.blocks.length) return;
      [n.blocks[i], n.blocks[j]] = [n.blocks[j], n.blocks[i]];
      n.updatedAt = Date.now();
      break;
    }
    case 'start': startTask(id); break;
    case 'finishNow': finishNow(id); break;
    case 'cancel': cancelTask(id); break;
    case 'verdict': verdict(id, b.dataset.v); break;
    case 'restore': setPending(id); break;
    case 'del': deleteTask(id); break;
    case 'move': ui.moveId = ui.moveId === id ? null : id; break;
    case 'fromBacklog': fromBacklog(id); break;
    case 'delBacklog': S.backlog = S.backlog.filter((x) => x.id !== id); break;
    case 'applyPreset': applyPreset(b.dataset.wd); break;
    case 'savePreset': savePreset(); break;
    case 'clearPreset': clearPreset(+b.dataset.wd); break;
    case 'delFin': {
      const key = b.dataset.kind === 'income' ? 'incomes' : 'expenses';
      S.fin[key] = S.fin[key].filter((x) => x.id !== id);
      break;
    }
    case 'delCat': {
      const isTask = b.dataset.kind === 'cats';
      const used = isTask
        ? Object.values(S.days).reduce((n, arr) => n + arr.filter((x) => x.catId === id).length, 0)
          + S.backlog.filter((x) => x.catId === id).length
          + Object.values(S.presets).reduce((n, arr) => n + arr.filter((p) => p.catId === id).length, 0)
        : S.fin.expenses.filter((x) => x.catId === id).length;
      if (used > 0 && !confirm(t('cat_in_use'))) return;
      if (isTask) S.cats = S.cats.filter((c) => c.id !== id);
      else S.fin.cats = S.fin.cats.filter((c) => c.id !== id);
      break;
    }
    case 'payAdd': {
      const used = new Set((S.fin.pays || []).map((p) => +p.day));
      let day = 1;
      while (day <= 31 && used.has(day)) day++;
      if (day > 31) return;
      S.fin.pays.push({ id: uid(), day, amount: 0 });
      break;
    }
    case 'payDel':
      S.fin.pays = (S.fin.pays || []).filter((p) => p.id !== id);
      break;
    case 'syncNow': pullSafe(); return;
    case 'google': syncGoogle(); return;
    case 'forgotShow': sync.forgot = !sync.forgot; sync.forgotSent = false; render(); return;
    case 'syncOut': stopRealtime(); sbc().auth.signOut().then(() => { sync.user = null; sync.recovery = false; sync.forgot = false; sync.forgotSent = false; render(); }); return;
    case 'intro': showIntro(); return;
    case 'warnLogin': {
      ui.view = 'settings';
      ui.noteId = null;
      ui.moveId = null;
      render();
      const sec = $('#syncSection');
      if (sec && sec.scrollIntoView) sec.scrollIntoView({ block: 'start' });
      return;
    }
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
      const startAt = String(fd.get('startAt') || '').trim() || null;
      addTaskTo(ui.day, { id: uid(), title, minutes, catId: fd.get('cat'), status: 'pending', startAt });
      break;
    }
    case 'setTime':
      setAutoTime(f.dataset.id, String(fd.get('time') || '').trim());
      ui.timeId = null;
      break;
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
      S.cats.push({ id: uid(), name, icon: fd.get('icon') || 'star', color: fd.get('color') || '#d4af37' });
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
      break;
    default: return;
  }
  if (['addTask', 'addIncome', 'addExpense'].includes(kind)) {
    f.reset(); closeSheet();
    $('#actionStatus').textContent = t(kind === 'addTask' ? 'task_added' : 'entry_added');
  }
  persist();
});

document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.dataset.form === 'syncForgot') {
    e.preventDefault();
    syncForgot(String(new FormData(f).get('email') || '').trim());
    return;
  }
  if (f.dataset.form === 'syncRecovery') {
    e.preventDefault();
    const fd = new FormData(f);
    syncSetPassword(String(fd.get('pw1') || ''), String(fd.get('pw2') || ''));
    return;
  }
  if (f.dataset.form !== 'syncAuth') return;
  e.preventDefault();
  const fd = new FormData(f);
  const mode = e.submitter && e.submitter.value === 'up' ? 'up' : 'in';
  syncAuth(mode, String(fd.get('email') || '').trim(), String(fd.get('password') || ''));
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const n = ui.noteId ? S.notes.find((x) => x.id === ui.noteId) : null;
  if (!n) return;
  let handled = false;
  if (el.dataset.block) {
    const b = n.blocks.find((x) => x.id === el.dataset.block);
    if (b) {
      b.text = el.value;
      handled = true;
      if (b.type === 'code') refreshCodeView(b);
    }
  } else if (el.dataset.lang) {
    const b = n.blocks.find((x) => x.id === el.dataset.lang);
    if (b) { b.lang = el.value.trim(); handled = true; refreshCodeView(b); }
  } else if (el.hasAttribute('data-note-title')) {
    n.title = el.value;
    handled = true;
  }
  if (!handled) return;
  n.updatedAt = Date.now();
  touch();
  const upd = $('#noteUpdated');
  if (upd) upd.textContent = `${t('note_updated')}: ${fmtDateTime(n.updatedAt)}`;
});
// Перерисовывает подсветку кода и подпись языка для одного блока.
function refreshCodeView(b) {
  const detected = b.lang ? '' : detectLang(b.text || '');
  const lang = b.lang || detected || 'js';
  const pre = document.querySelector(`[data-code-view="${b.id}"]`);
  if (pre) {
    pre.innerHTML = highlightCode(b.text || '', lang);
    const ta = document.querySelector(`[data-block="${b.id}"]`);
    if (ta) pre.scrollTop = ta.scrollTop;
  }
  const block = pre ? pre.closest('.note-block') : null;
  const lbl = block ? block.querySelector('small.muted') : null;
  if (lbl) lbl.textContent = `${t('note_lang')}: ${b.lang || (detected ? `${detected} · ${t('auto')}` : t('auto'))}`;
}
// Прокрутка подсветки вслед за полем кода.
document.addEventListener('scroll', (e) => {
  const el = e.target;
  if (!el || !el.dataset || !el.dataset.block) return;
  const pre = document.querySelector(`[data-code-view="${el.dataset.block}"]`);
  if (pre) pre.scrollTop = el.scrollTop;
}, true);

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.change === 'sort') { ui.sort = el.value; render(); }
  if (el.dataset.change === 'shift') { S.fin.shiftWeekend = el.checked; touch(); }
  if (el.dataset.change === 'payDay' || el.dataset.change === 'payAmount') {
    const p = (S.fin.pays || []).find((x) => x.id === el.dataset.id);
    if (p) {
      if (el.dataset.change === 'payDay') p.day = Math.max(1, Math.min(31, parseInt(el.value, 10) || 1));
      else p.amount = Math.max(0, +el.value || 0);
      touch();
    }
  }
  if (el.dataset.change === 'notePhoto') { noteAddPhotos([...el.files]); el.value = ''; }
  if (el.dataset.change === 'import') {
    const f = el.files[0];
    if (!f) return;
    f.text().then((txt) => { S = migrate({ ...defaults(), ...JSON.parse(txt) }); persist(); }).catch(() => alert('Import error'));
  }
});

// ---- Приветствие при первом запуске (в стиле сторисов) ----
const INTRO_KEY = 'timecon.intro';
const INTRO_SLIDES = [
  { img: 'intro1.jpg', sec: 9 },
  { img: 'intro2.jpg', sec: 12 },
];
const intro = { el: null, i: 0, timer: null };
function introEl() {
  if (intro.el) return intro.el;
  const d = document.createElement('div');
  d.className = 'intro';
  d.hidden = true;
  d.innerHTML = `
    <div class="intro-bars">${INTRO_SLIDES.map(() => '<i><b></b></i>').join('')}</div>
    <div class="intro-stage"></div>
    <div class="intro-foot">
      <button class="ghost" data-intro="skip">${t('intro_skip')}</button>
      <button class="primary" data-intro="next">${t('intro_next')}</button>
    </div>`;
  d.addEventListener('click', (e) => {
    const b = e.target.closest('[data-intro]');
    if (b) {
      if (b.dataset.intro === 'skip') return introDone();
      return intro.i >= INTRO_SLIDES.length - 1 ? introDone() : introGo(intro.i + 1);
    }
    // Тап по экрану, как в сторисах: левая часть — назад, правая — вперёд.
    const stage = e.target.closest('.intro-stage');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    introGo(e.clientX - r.left < r.width * 0.3 ? intro.i - 1 : intro.i + 1);
  });
  document.body.appendChild(d);
  intro.el = d;
  return d;
}
function introGo(i) {
  if (i < 0) i = 0;
  if (i >= INTRO_SLIDES.length) return introDone();
  intro.i = i;
  const el = introEl();
  const s = INTRO_SLIDES[i];
  el.querySelector('.intro-stage').innerHTML = `<img class="intro-img" src="${s.img}" alt="">`;
  el.querySelectorAll('.intro-bars i').forEach((bar, n) => {
    const b = bar.querySelector('b');
    b.style.transition = 'none';
    b.style.width = n < i ? '100%' : '0%';
    if (n === i) {
      b.getBoundingClientRect(); // заставляем браузер применить нулевую ширину
      b.style.transition = `width ${s.sec}s linear`;
      b.style.width = '100%';
    }
  });
  el.querySelector('[data-intro="next"]').textContent = i === INTRO_SLIDES.length - 1 ? t('intro_start') : t('intro_next');
  clearTimeout(intro.timer);
  intro.timer = setTimeout(() => introGo(i + 1), s.sec * 1000);
}
function introDone() {
  clearTimeout(intro.timer);
  if (intro.el) intro.el.hidden = true;
  document.body.classList.remove('intro-open');
  try { localStorage.setItem(INTRO_KEY, 'done'); } catch (e) { /* приватный режим */ }
}
function showIntro() {
  const el = introEl();
  el.hidden = false;
  document.body.classList.add('intro-open');
  // Тексты кнопок могли смениться вместе с языком
  el.querySelector('[data-intro="skip"]').textContent = t('intro_skip');
  introGo(0);
}
function introMaybeShow() {
  try { if (localStorage.getItem(INTRO_KEY) === 'done') return; } catch (e) { /* покажем */ }
  showIntro();
}

initSheet();
render();
syncInit();
introMaybeShow();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
