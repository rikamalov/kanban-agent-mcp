/* DOM-тест мобильной вёрстки: шторка сайдбара, бургер, переключатель вида, скрим.
   Запуск: node .test/kanban-mobile-test.js (jsdom из npm). */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3100/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const { window } = dom;
const { document } = window;

/* --- моки (как в v2) --- */
const requests = [];
function mkTask(id, patch) {
  return Object.assign({
    id, project_id: 1, title: 'Задача ' + id, stage: 'DISCUSSION',
    position: id, due_at: null, assignee: '', assignee_id: null,
    notes: '', created_at: '2026-09-01T10:00:00Z', updated_at: '2026-09-01T10:00:00Z', custom: {},
  }, patch || {});
}
const NOW = new Date();
const curYM = NOW.getFullYear() + '-' + String(NOW.getMonth() + 1).padStart(2, '0');
const stagesSeed = [
  { id: 'DISCUSSION', label: 'На обсуждении', color: '#6BBFFF', position: 1, is_visible: 1, is_done: 0 },
  { id: 'IN_PROGRESS', label: 'В работе', color: '#926FFF', position: 2, is_visible: 1, is_done: 0 },
  { id: 'COMPLETED', label: 'Завершена', color: '#55D379', position: 3, is_visible: 1, is_done: 1 },
];
const data = {
  projects: [{ id: 1, name: 'Проект А', color: '#4662d5', position: 1, archived: 0 }],
  tasks: [
    mkTask(1), mkTask(2, { stage: 'IN_PROGRESS' }),
    mkTask(3, { due_at: curYM + '-10' }), mkTask(4, { project_id: null }),
  ],
  members: [{ id: 1, name: 'Аня', color: '#6BBFFF', initials: 'А' }],
  stages: stagesSeed,
};

window.fetch = async (url, opts) => {
  const u = String(url);
  const method = (opts && opts.method) || 'GET';
  const resp = (status, body) => ({ ok: status < 400, status, json: async () => body });
  if (u === '/api/login' && method === 'POST') return resp(200, { ok: true });
  if (u === '/api/me' && method === 'GET') return resp(200, { user: { id: 1, username: 'admin', role: 'admin', display_name: 'Admin' }, lang: 'ru' });
  if (u === '/api/projects') return resp(200, { projects: data.projects });
  if (u === '/api/tasks' && method === 'GET') return resp(200, { tasks: data.tasks });
  if (u.startsWith('/api/tasks/') && method === 'PATCH') {
    const id = Number(u.split('/')[3]);
    const b = JSON.parse(opts.body);
    const t = data.tasks.find((x) => x.id === id);
    if (t) Object.assign(t, b);
    requests.push({ method, u, body: b });
    return resp(200, t);
  }
  if (u.includes('/move') && method === 'POST') {
    const id = Number(u.split('/')[3]);
    const b = JSON.parse(opts.body);
    if (b.project_id === 'none') b.project_id = null;
    const t = data.tasks.find((x) => x.id === id);
    if (t) Object.assign(t, b);
    requests.push({ method, u, body: b });
    return resp(200, t);
  }
  if (u.startsWith('/api/members')) return resp(200, { members: data.members });
  if (u === '/api/stages') return resp(200, data.stages);
  if (u.startsWith('/api/custom-fields')) return resp(200, { fields: [] });
  if (u === '/api/view-fields' && method === 'GET') {
    const view = u.split('view=')[1] || 'KANBAN';
    return resp(200, defaultRows());
  }
  if (u === '/api/view-fields' && method === 'PATCH') return resp(200, {});
  requests.push({ method, u });
  return resp(200, {});
};
function defaultRows() {
  return ['title', 'stage', 'project', 'due_at', 'assignee', 'created_at'].map((k, i) => ({
    id: 'vf_' + k, field_key: k, label: null, is_visible: true, position: i,
  }));
}

const w = window;
w.eval(appSrc + '\n;window.__test = { state, renderBody, boot, renderApp, renderSidebar, openMobileSide, closeMobileSide };');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) passed++;
  else { failed++; console.error('  ✗ ' + name); }
}

(async () => {
  await w.__test.boot();

  /* --- Базовые элементы приложения --- */
  ok(!!document.querySelector('.sidebar'), 'sidebar отрисован');
  ok(!!document.querySelector('#board-head'), 'шапка доски отрисована');
  ok(!!document.querySelector('#side-scrim'), 'скрим шторки есть в DOM');

  /* --- Бургер в шапке --- */
  const burger = document.querySelector('#side-burger');
  ok(!!burger, 'бургер-кнопка в шапке есть');
  ok(burger && burger.closest('.board-title') !== null, 'бургер находится в .board-title');
  ok(!!(burger && burger.querySelector('svg')), 'у бургера есть иконка');

  /* --- Открытие шторки --- */
  burger.click();
  ok(w.__test.state.mobileSideOpen === true, 'клик по бургеру открыл шторку (state)');
  ok(document.querySelector('.app').classList.contains('side-open'), 'класс side-open на .app');

  /* --- Закрытие шторки: клик по затемнению --- */
  const scrim = document.querySelector('#side-scrim');
  scrim.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true }));
  ok(w.__test.state.mobileSideOpen === false, 'тап по скриму закрыл шторку');

  /* --- Закрытие шторки при выборе вида в сайдбаре --- */
  burger.click(); // снова открыть
  ok(w.__test.state.mobileSideOpen === true, 'шторка снова открылась');
  const noneRow = document.querySelector('.side-item.none-row');
  ok(!!noneRow, 'в шторке виден список видов (Без проекта)');
  noneRow.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok(w.__test.state.view.type === 'none', 'выбор вида из шторки применился');
  ok(w.__test.state.mobileSideOpen === false, 'после выбора вида шторка закрылась');
  w.__test.state.view = { type: 'all' };
  w.__test.renderApp();

  /* --- Переключатель вида: подписи в спанах (для CSS mobile) --- */
  const labels = document.querySelectorAll('.vs-btn .vs-label');
  ok(labels.length === 3, 'подписи вида обёрнуты в .vs-label (3 шт.)');
  ok(document.querySelector('.vs-btn[data-vt="KANBAN"] .vs-label') !== null, 'у KANBAN-кнопки есть .vs-label');

  /* --- Шестерёнка настроек в подвале сайдбара открывает попап --- */
  const gearBtn = document.querySelector('#settings-btn');
  ok(!!gearBtn, 'шестерёнка настроек есть в сайдбаре');
  gearBtn.click();
  ok(!!document.querySelector('#settings-pop'), 'попап настроек открылся по клику');
  ok(!!document.querySelector('#pass-form'), 'форма смены пароля в попапе есть');
  /* клик вне попапа закрывает */
  document.body.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok(document.querySelector('#settings-pop') === null, 'клик вне попапа закрыл его');

  /* --- Модалка задачи: открытие, закрытие по фону --- */
  const card = document.querySelector('#board .card');
  ok(!!card, 'карточка на доске есть');
  card.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const overlay = document.querySelector('#modal-overlay');
  ok(overlay && overlay.hidden === false, 'модалка задачи открылась');
  ok(!!document.querySelector('#mf-title'), 'поле названия в модалке есть');
  /* сохранение работает */
  document.querySelector('#mf-title').value = 'Обновлённое название';
  document.querySelector('#mf-save').click();
  await new Promise((r) => setTimeout(r, 10));
  ok(requests.some((r) => r.method === 'PATCH' && r.body && r.body.title === 'Обновлённое название'), 'PATCH с новым названием отправлен');

  /* --- Бургер не дублируется после renderHead --- */
  ok(document.querySelectorAll('#side-burger').length === 1, 'бургер единственный');

  /* --- Смена вида через переключатель --- */
  document.querySelector('.vs-btn[data-vt="TABLE"]').click();
  await new Promise((r) => setTimeout(r, 0));
  ok(document.querySelector('#ws-tasks .table-wrap') !== null, 'вид «Таблица» переключился');
  ok(!!document.querySelector('#side-burger'), 'бургер остаётся в TABLE');

  document.querySelector('.vs-btn[data-vt="CALENDAR"]').click();
  await new Promise((r) => setTimeout(r, 0));
  ok(document.querySelector('#ws-calendar') !== null, 'вид «Календарь» переключился');
  ok(!!document.querySelector('#side-burger'), 'бургер остаётся в CALENDAR');

  /* --- CSS: мобильные правила присутствуют --- */
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');
  ok(css.includes('@media (max-width: 720px)'), 'CSS: медиазапрос мобильной вёрстки есть');
  ok(css.includes('.burger-btn'), 'CSS: стили бургера есть');
  ok(css.includes('side-open'), 'CSS: правило шторки side-open есть');
  ok(css.includes('env(safe-area-inset-bottom'), 'CSS: safe-area учтён');
  ok(css.includes('scroll-snap'), 'CSS: магнитный скролл канбана есть');
  ok(css.includes('100dvh') || css.includes('100svh'), 'CSS: динамическая высота вьюпорта учтена');
  ok(css.includes('.vs-label') && /\.vs-btn \.vs-label \{ display: none/.test(css), 'CSS: подписи вида прячутся на мобильном');

  console.log('Мобильный DOM-тест: ' + passed + ' OK, ' + failed + ' FAIL');
  if (failed) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });