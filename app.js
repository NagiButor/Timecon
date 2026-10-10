const KEY = 'timecon.v1';
const BUILD = 'v23';
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
    today: 'Сегодня', sort: 'Сортировка', sort_manual: 'По порядку добавления', sort_cat: 'По категории', sort_status: 'По статусу', sort_time: 'По времени',
    no_tasks: 'На этот день задач нет', task_title: 'Название задачи', minutes: 'Минут', min: 'мин', category: 'Категория', add: 'Добавить',
    preset_for: 'Пресет на', apply_preset: 'Применить к дню', save_preset: 'Сохранить день как пресет', clear_preset: 'Очистить пресет',
    backlog: 'На потом', to_day: 'На этот день', start: 'Старт', ask_q: 'Время вышло. Задача выполнена?',
    verdict_done: 'Выполнено', verdict_failed: 'Не выполнено', restore: 'Вернуть в работу', move: 'Перенести', ok: 'ОК',
    tomorrow: 'Завтра', after_tomorrow: 'Послезавтра', in_week: 'Через неделю', pick_date: 'Выбрать дату', later: 'На потом',
    delete: 'Удалить', timer_done: 'Время вышло',
    cancel: 'Отменить', cancel_confirm: 'Отменить начатую задачу? Отсчёт остановится, и задачу можно будет запустить заново.',
    period_day: 'День', period_week: 'Неделя', period_month: 'Месяц', period_all: 'Всё время',
    total_time: 'Время выполненных задач', done_count: 'Выполнено', failed_count: 'Не выполнено', completion: 'Доля выполненных',
    by_task: 'По задачам', by_cat: 'По категориям', no_data: 'Нет данных', none: 'Пусто',
    income: 'Доходы', expenses: 'Расходы', savings: 'Экономия', efficiency: 'Доля экономии', unneeded: 'Ненужные траты', unneeded_share: 'Доля ненужных',
    next_payday: 'Следующая выплата', add_income: 'Добавить доход', add_expense: 'Добавить трату', amount: 'Сумма', date: 'Дата', note: 'Заметка',
    needed: 'Нужная трата', cat_fin: 'Категория', save: 'Сохранить',
    language: 'Язык', theme: 'Тема', dark: 'Тёмная', light: 'Светлая', currency: 'Валюта',
    pay_title: 'Выплаты зарплаты', pay_day: 'Число', pay_amount: 'Сумма', pay_add: 'Добавить выплату', pay_empty: 'Выплаты не настроены',
    shift_weekend: 'Если выплата выпадает на выходной, переносить её на пятницу',
    categories: 'Категории задач', fin_categories: 'Категории расходов', add_cat: 'Добавить категорию', name: 'Название', data: 'Данные',
    export_json: 'Экспорт JSON (резервная копия)', import_json: 'Импорт JSON', export_csv: 'Экспорт CSV',
    sync_title: 'Синхронизация', sync_not_config: 'Синхронизация не настроена: заполни config.js (см. README.md).',
    sync_in: 'Вход выполнен', sync_email: 'Почта', sync_password: 'Пароль (минимум 6 символов)',
    sync_login: 'Войти', sync_signup: 'Регистрация',
    sync_google: 'Войти через Google', sync_forgot: 'Забыл пароль', sync_forgot_send: 'Отправить ссылку',
    sync_forgot_sent: 'Ссылка для сброса пароля отправлена на почту. Проверь и папку «Спам».',
    sync_recovery_title: 'Новый пароль', sync_password2: 'Повтори пароль', sync_set_password: 'Сохранить пароль',
    sync_password_mismatch: 'Пароли не совпадают', sync_password_updated: 'Пароль обновлён. Ты вошёл в аккаунт.',
    sync_standalone_hint: 'Приложение открыто с экрана «Домой»: если вход через Google не возвращает в приложение, войди с почтой и паролем.',
    sync_check_email: 'Аккаунт создан. Войди с этой почтой и паролем.',
    sync_fail: 'Ошибка синхронизации. Проверь интернет.',
    sync_now: 'Синхронизировать сейчас', sync_out: 'Выйти', sync_last: 'Последняя синхронизация',
    sync_hint: 'Один аккаунт на всех устройствах: введи на каждом ту же почту и пароль. При входе на новом устройстве данные с сервера заменят данные на этом устройстве, если на сервере уже что-то есть.',
    warn_title: 'Данные не сохраняются',
    warn_text: 'Ты не вошёл в аккаунт. Задачи, заметки и финансы хранятся только на этом устройстве и будут потеряны, если очистить данные браузера.',
    warn_btn: 'Войти',
    d: 'д', h: 'ч',
    wd: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    cat_sport: 'Спорт', cat_work: 'Работа', cat_rest: 'Отдых', cat_study: 'Учёба', cat_home: 'Дом',
    fcat_food: 'Еда', fcat_home: 'Жильё', fcat_fun: 'Развлечения', fcat_other: 'Прочее',
    notes: 'Заметки', note_new: 'Новая заметка', note_title: 'Название заметки', note_icon: 'Иконка',
    note_add_text: 'Текст', note_add_photo: 'Фото', note_add_code: 'Код', note_updated: 'Изменено',
    note_empty: 'Заметок пока нет. Создай первую.', note_code_lang: 'Язык', note_confirm_del: 'Удалить заметку?',
    note_blocks_hint: 'Блоки идут сверху вниз: текст, фото, код. Добавляй в нужном порядке.',
    note_photo_fail: 'Не удалось загрузить фото', back: 'Назад', started_at: 'Начало',
    storage_full: 'Память заполнена. Удали лишние фото из заметок.',
    auto_start: 'Время автозапуска (необязательно)', auto_at: 'Авто', auto_off: 'Убрать', auto_on: 'Время автозапуска',
    auto_hint: 'Задача запустится сама в указанное время, если приложение открыто. Если указанное время прошло больше двух часов назад, задача сама не запустится.',
    up: 'Выше', down: 'Ниже', auto: 'авто', note_lang: 'Язык',
    intro_skip: 'Пропустить', intro_next: 'Далее', intro_start: 'Начать', intro_show: 'Показать обучение',
  },
  en: {
    tasks: 'Tasks', stats: 'Stats', finance: 'Finance', settings: 'Settings',
    today: 'Today', sort: 'Sort', sort_manual: 'In added order', sort_cat: 'By category', sort_status: 'By status', sort_time: 'By duration',
    no_tasks: 'No tasks for this day', task_title: 'Task title', minutes: 'Minutes', min: 'min', category: 'Category', add: 'Add',
    preset_for: 'Preset for', apply_preset: 'Apply to day', save_preset: 'Save day as preset', clear_preset: 'Clear preset',
    backlog: 'Later', to_day: 'To this day', start: 'Start', ask_q: 'Time is up. Was the task done?',
    verdict_done: 'Done', verdict_failed: 'Not done', restore: 'Back to work', move: 'Move', ok: 'OK',
    tomorrow: 'Tomorrow', after_tomorrow: 'Day after tomorrow', in_week: 'In a week', pick_date: 'Pick a date', later: 'Later',
    delete: 'Delete', timer_done: 'Time is up',
    cancel: 'Cancel', cancel_confirm: 'Cancel the started task? The countdown will stop, and you will be able to start the task again.',
    period_day: 'Day', period_week: 'Week', period_month: 'Month', period_all: 'All time',
    total_time: 'Time on done tasks', done_count: 'Done', failed_count: 'Not done', completion: 'Completion rate',
    by_task: 'By task', by_cat: 'By category', no_data: 'No data', none: 'Empty',
    income: 'Income', expenses: 'Expenses', savings: 'Savings', efficiency: 'Savings rate', unneeded: 'Unneeded spending', unneeded_share: 'Unneeded share',
    next_payday: 'Next payment', add_income: 'Add income', add_expense: 'Add expense', amount: 'Amount', date: 'Date', note: 'Note',
    needed: 'Necessary', cat_fin: 'Category', save: 'Save',
    language: 'Language', theme: 'Theme', dark: 'Dark', light: 'Light', currency: 'Currency',
    pay_title: 'Pay schedule', pay_day: 'Day', pay_amount: 'Amount', pay_add: 'Add payment', pay_empty: 'No payments set',
    shift_weekend: 'If a pay day falls on a weekend, move it to Friday',
    categories: 'Task categories', fin_categories: 'Expense categories', add_cat: 'Add category', name: 'Name', data: 'Data',
    export_json: 'Export JSON (backup)', import_json: 'Import JSON', export_csv: 'Export CSV',
    sync_title: 'Sync', sync_not_config: 'Sync is not set up: fill in config.js (see README.md).',
    sync_in: 'Signed in', sync_email: 'Email', sync_password: 'Password (min 6 characters)',
    sync_login: 'Sign in', sync_signup: 'Sign up',
    sync_google: 'Sign in with Google', sync_forgot: 'Forgot password', sync_forgot_send: 'Send link',
    sync_forgot_sent: 'Password reset link sent to your email. Check the spam folder too.',
    sync_recovery_title: 'New password', sync_password2: 'Repeat password', sync_set_password: 'Save password',
    sync_password_mismatch: 'Passwords do not match', sync_password_updated: 'Password updated. You are signed in.',
    sync_standalone_hint: 'The app is open from the Home Screen: if Google sign-in does not bring you back, sign in with email and password.',
    sync_check_email: 'Account created. Sign in with this email and password.',
    sync_fail: 'Sync error. Check your connection.',
    sync_now: 'Sync now', sync_out: 'Sign out', sync_last: 'Last sync',
    sync_hint: 'One account for all devices: enter the same email and password on each. When signing in on a new device, server data will replace the data on this device if the server already has data.',
    warn_title: 'Data is not being saved',
    warn_text: 'You are not signed in. Tasks, notes and finances are stored only on this device and will be lost if you clear browser data.',
    warn_btn: 'Sign in',
    d: 'd', h: 'h',
    wd: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    cat_sport: 'Sport', cat_work: 'Work', cat_rest: 'Rest', cat_study: 'Study', cat_home: 'Home',
    fcat_food: 'Food', fcat_home: 'Housing', fcat_fun: 'Fun', fcat_other: 'Other',
    notes: 'Notes', note_new: 'New note', note_title: 'Note title', note_icon: 'Icon',
    note_add_text: 'Text', note_add_photo: 'Photo', note_add_code: 'Code', note_updated: 'Updated',
    note_empty: 'No notes yet. Create the first one.', note_code_lang: 'Language', note_confirm_del: 'Delete this note?',
    note_blocks_hint: 'Blocks stack top to bottom: text, photo, code. Add them in any order.',
    note_photo_fail: 'Could not load the photo', back: 'Back', started_at: 'Started',
    storage_full: 'Storage is full. Remove some photos from notes.',
    auto_start: 'Auto-start time (optional)', auto_at: 'Auto', auto_off: 'Clear', auto_on: 'Auto-start time',
    auto_hint: 'The task starts by itself at the set time when the app is open. If the set time was more than two hours ago, the task will not start by itself.',
    up: 'Up', down: 'Down', auto: 'auto', note_lang: 'Language',
    intro_skip: 'Skip', intro_next: 'Next', intro_start: 'Start', intro_show: 'Show intro',
  },
};

function defaults() {
  return {
    v: 1, lang: 'ru', theme: 'dark', currency: 'RUB',
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
const ui = { view: 'tasks', day: keyOf(new Date()), sort: 'manual', period: 'day', month: keyOf(new Date()).slice(0, 7), moveId: null, timeId: null, noteId: null, noteIconPick: false };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { alert(t('storage_full')); }
}
function persist() { ver++; setDirty(true); save(); render(); schedulePush(); }
// Изменение без перерисовки — чтобы не сбрасывать ввод при наборе текста.
function touch() { ver++; setDirty(true); save(); schedulePush(); }

function t(k) { return (T[S.lang] && T[S.lang][k]) ?? T.ru[k] ?? k; }
function locale() { return S.lang === 'ru' ? 'ru-RU' : 'en-US'; }
function money(n) { return `${Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: 2 })} ${CUR[S.currency] || S.currency}`; }
function label(c) { return !c ? '—' : (c.key ? t(c.key) : c.name); }
// День недели для заголовка пресета: по-русски нужен винительный падеж («на понедельник»).
function presetDay(wd) {
  const name = t('wd')[wd];
  return S.lang === 'ru' ? name.toLowerCase() : name;
}
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
  S.days[f.key] = S.days[f.key].filter((x) => x.id !== id);
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
  const now = Date.now();
  let changed = false;
  runningList().slice().forEach((r) => {
    if (r.endAt - now <= 0) { finishTimer(r); changed = true; return; }
    const el = document.querySelector('[data-timer="' + r.taskId + '"]');
    if (el) el.textContent = fmtClock(r.endAt - now);
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

function taskCard(x, i, total) {
  const c = catById(x.catId) || { icon: 'star', color: '#8b93a7' };
  let body = '';
  if (x.status === 'running') {
    body = `<span class="clock" data-timer="${x.id}">${fmtClock((findRun(x.id) || { endAt: Date.now() }).endAt - Date.now())}</span>
      <div class="acts center">
        <button class="bad" data-act="cancel" data-id="${x.id}">${icon('x')} ${t('cancel')}</button>
      </div>`;
  } else if (x.status === 'ask') {
    body = `<div class="verdict"><span>${t('ask_q')}</span>
      <button class="ok" data-act="verdict" data-id="${x.id}" data-v="done">${icon('check')} ${t('verdict_done')}</button>
      <button class="bad" data-act="verdict" data-id="${x.id}" data-v="failed">${icon('x')} ${t('verdict_failed')}</button></div>`;
  } else if (x.status === 'pending') {
    const order = ui.sort === 'manual'
      ? `<button class="icon-btn" data-act="up" data-id="${x.id}" ${i === 0 ? 'disabled' : ''} title="${t('up')}">${icon('right', 'rot-up')}</button>
         <button class="icon-btn" data-act="down" data-id="${x.id}" ${i === total - 1 ? 'disabled' : ''} title="${t('down')}">${icon('right', 'rot-down')}</button>`
      : '';
    body = `<div class="acts">
      <button class="primary" data-act="start" data-id="${x.id}">${icon('play')} ${t('start')}</button>
      <button class="icon-btn" data-act="time" data-id="${x.id}" title="${t('auto_on')}">${icon('clock')}</button>
      ${order}
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
  const timeForm = ui.timeId === x.id ? `<form class="move" data-form="setTime" data-id="${x.id}">
      <input type="time" name="time" value="${esc(x.startAt || '')}">
      <button class="primary" type="submit">${t('ok')}</button>
      <button class="ghost" type="button" data-act="timeClear" data-id="${x.id}">${t('auto_off')}</button></form>` : '';
  const auto = x.startAt ? ` · ${t('auto_at')} ${esc(x.startAt)}` : '';
  return `<li class="task ${x.status}" style="--c:${c.color}">
    <div class="task-head"><span class="cat-ico">${icon(c.icon)}</span>
      <div class="task-title"><span class="ttl">${esc(x.title)}</span><small>${x.minutes} ${t('min')}${auto}${x.startedAt ? ` · ${t('started_at')} ${fmtTime(x.startedAt)}` : ''}</small></div>${mark}</div>
    ${body}${moveForm}${timeForm}</li>`;
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
    <ul class="tasks">${list.length ? list.map((x, i) => taskCard(x, i, list.length)).join('') : `<li class="empty">${t('no_tasks')}</li>`}</ul>
    <form class="card form" data-form="addTask">
      <input name="title" placeholder="${t('task_title')}" required maxlength="80">
      <div class="row2">
        <label>${t('minutes')}<input name="minutes" type="number" min="1" max="600" value="25"></label>
        <label>${t('category')}<select name="cat">${S.cats.map((c) => `<option value="${c.id}">${esc(label(c))}</option>`).join('')}</select></label>
      </div>
      <label>${t('auto_start')}<input name="startAt" type="time"></label>
      <p class="muted hint">${t('auto_hint')}</p>
      <button class="primary">${icon('plus')} ${t('add')}</button>
    </form>
    <section class="card">
      <h3>${t('preset_for')} ${presetDay(wd)}</h3>
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
      ${np ? `<p class="muted">${t('next_payday')}: ${esc(fmtDate(np.key))} · ${money(np.amount)}</p>` : ''}
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
      ${kind === 'cats' ? '<input name="color" type="color" value="#d4af37">' : ''}
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
      <button class="primary">${t('save')}</button>
    </form>
    <section class="card">
      <h3>${t('pay_title')}</h3>
      <ul class="mini">${[...S.fin.pays].sort((a, b) => a.day - b.day).map((p) => `<li class="pays-row">
        <input type="number" min="1" max="31" value="${p.day}" data-change="payDay" data-id="${p.id}" aria-label="${t('pay_day')}">
        <input type="number" min="0" step="0.01" value="${p.amount}" data-change="payAmount" data-id="${p.id}" aria-label="${t('pay_amount')}">
        <button class="icon-btn" data-act="payDel" data-id="${p.id}" title="${t('delete')}">${icon('trash')}</button></li>`).join('') || `<li class="empty">${t('pay_empty')}</li>`}</ul>
      <div class="acts"><button data-act="payAdd">${icon('plus')} ${t('pay_add')}</button></div>
      <label class="check"><input type="checkbox" data-change="shift" ${S.fin.shiftWeekend ? 'checked' : ''}> ${t('shift_weekend')}</label>
    </section>
    <p class="muted" style="text-align:center">Timecon ${BUILD}</p>
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
      <h3>${t('intro_show')}</h3>
      <button data-act="intro">${icon('play')} ${t('intro_show')}</button>
    </section>
    <section class="card" id="syncSection"><h3>${t('sync_title')}</h3>${viewSync()}</section>`;
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
  return `<div class="card note-card" data-act="noteOpen" data-id="${n.id}">
    <div class="note-head"><span class="note-ico">${icon(n.icon || 'note')}</span>
      <div class="note-meta"><b>${esc(n.title || t('note_title'))}</b>
      <small>${t('note_updated')}: ${fmtDateTime(n.updatedAt || Date.now())}</small></div>
      <button class="icon-btn" data-act="noteDel" data-id="${n.id}">${icon('trash')}</button></div>
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
      <button class="icon-btn" data-act="noteUp" data-id="${b.id}" ${i === 0 ? 'disabled' : ''}>${icon('right', 'rot-up')}</button>
      <button class="icon-btn" data-act="noteDown" data-id="${b.id}" ${i === total - 1 ? 'disabled' : ''}>${icon('right', 'rot-down')}</button>
      <button class="icon-btn" data-act="noteBlockDel" data-id="${b.id}">${icon('trash')}</button></div>
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
  return `<button class="primary" data-act="noteNew">${icon('plus')} ${t('note_new')}</button>
    ${notes.length ? notes.map(noteCard).join('') : `<p class="empty">${t('note_empty')}</p>`}`;
}

const NAV = [['tasks', 'tasks'], ['notes', 'note'], ['stats', 'chart'], ['finance', 'wallet'], ['settings', 'gear']];
const VIEWS = { tasks: viewTasks, notes: viewNotes, stats: viewStats, finance: viewFinance, settings: viewSettings };

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
  const keepScroll = renderedView === ui.view ? window.scrollY : 0;
  document.documentElement.dataset.theme = S.theme;
  document.documentElement.lang = S.lang;
  $('#nav').innerHTML = NAV.map(([v, ic]) => `<button class="${ui.view === v ? 'on' : ''}" data-act="tab" data-v="${v}">${icon(ic)}<span>${t(v)}</span></button>`).join('');
  $('#main').innerHTML = VIEWS[ui.view]();
  renderedView = ui.view;
  restoreFields(snap);
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
  el.innerHTML = `<div class="warn-box">
      <div class="warn-txt"><b>${t('warn_title')}</b><span>${t('warn_text')}</span></div>
      <button class="primary" data-act="warnLogin">${t('warn_btn')}</button>
    </div>`;
}

const SYNC_KEY = 'timecon.sync';
let ver = 0;
let dirty = localStorage.getItem('timecon.dirty') === '1' || !localStorage.getItem(SYNC_KEY);
function setDirty(v) { dirty = v; localStorage.setItem('timecon.dirty', v ? '1' : '0'); }
const cfg = window.TIMECON_SUPABASE || {};
const sync = { user: null, client: null, channel: null, updated: 0, timer: null, email: '', sent: false, msg: '', recovery: false, forgot: false, forgotSent: false };
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
  sync.timer = setTimeout(() => syncCycle().catch(failSync), 800);
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
// Чистим ссылки на запущенные таймеры, которые не совпадают со статусом задач.
// Бывает после объединения данных с двух устройств. Заодно приводит старый формат к массиву.
function reconcileRunning(st) {
  const list = Array.isArray(st.running) ? st.running : (st.running ? [st.running] : []);
  const byId = {};
  Object.values(st.days || {}).forEach((arr) => (arr || []).forEach((x) => { byId[x.id] = x; }));
  (st.backlog || []).forEach((x) => { byId[x.id] = x; });
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
function pullSafe() {
  syncCycle().catch(failSync);
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
  render();
  const { error } = await sbc().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/' } });
  if (error) { sync.msg = error.message; render(); }
}
async function syncForgot(email) {
  sync.msg = '';
  const { error } = await sbc().auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' });
  sync.forgotSent = !error;
  if (error) sync.msg = error.message;
  render();
}
async function syncSetPassword(pw1, pw2) {
  if (pw1 !== pw2) { sync.msg = 'sync_password_mismatch'; render(); return; }
  const { error } = await sbc().auth.updateUser({ password: pw1 });
  if (error) { sync.msg = error.message; }
  else { sync.recovery = false; sync.forgotSent = false; sync.msg = 'sync_password_updated'; }
  render();
  updateWarn();
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
  const c = sbc().auth;
  const { data, error } = mode === 'up'
    ? await c.signUp({ email, password })
    : await c.signInWithPassword({ email, password });
  sync.busy = false;
  if (error) sync.msg = error.message;
  else if (mode === 'up' && !data.session) sync.msg = 'sync_check_email';
  else sync.user = data.session ? data.session.user : null;
  render();
  updateWarn();
  if (sync.user) pullSafe();
}
function viewSync() {
  if (!sbc()) return `<p class="muted">${t('sync_not_config')}</p>`;
  if (sync.recovery) return `<form class="form" data-form="syncRecovery">
      <h3>${t('sync_recovery_title')}</h3>
      <input name="pw1" type="password" autocomplete="new-password" minlength="6" required placeholder="${t('sync_password')}">
      <input name="pw2" type="password" autocomplete="new-password" minlength="6" required placeholder="${t('sync_password2')}">
      <button class="primary">${t('sync_set_password')}</button></form>
    ${sync.msg ? `<p class="muted">${['sync_password_mismatch', 'sync_password_updated'].includes(sync.msg) ? t(sync.msg) : esc(sync.msg)}</p>` : ''}`;
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
    <div class="acts"><button class="ghost" data-act="google">${t('sync_google')}</button>
      <button class="ghost" data-act="forgotShow">${t('sync_forgot')}</button></div>
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
    case 'cancel': cancelTask(id); break;
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
    case 'syncNow': syncCycle().catch(failSync); return;
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

render();
syncInit();
introMaybeShow();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
