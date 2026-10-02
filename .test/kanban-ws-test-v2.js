/* DOM-тест v2: календарь-попап, drag «без срока», этапы, «без проекта». */
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

/* --- моки --- */
const requests = [];
let failNextPatch = false;
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
  { id: 'HUMAN_LOOP', label: 'Human loop', color: '#FF913B', position: 3, is_visible: 1, is_done: 0 },
  { id: 'VERIFICATION', label: 'На проверке', color: '#FCDB51', position: 4, is_visible: 1, is_done: 0 },
  { id: 'COMPLETED', label: 'Завершена', color: '#55D379', position: 5, is_visible: 1, is_done: 1 },
];
const data = {
  projects: [{ id: 1, name: 'Проект А', color: '#4662d5', position: 1, archived: 0 }],
  tasks: [
    mkTask(1, { due_at: curYM + '-10' }),
    mkTask(2, { due_at: curYM + '-10', stage: 'IN_PROGRESS' }),
    mkTask(3, { due_at: curYM + '-10', stage: 'VERIFICATION' }),
    mkTask(4, { due_at: curYM + '-10', stage: 'COMPLETED' }),
    mkTask(5, { due_at: curYM + '-11' }),
    mkTask(6, { due_at: null }),
    mkTask(7, { due_at: '2026-08-05', stage: 'HUMAN_LOOP' }),
    mkTask(8, { due_at: '2026-10-01' }),
    mkTask(9, { due_at: curYM + '-10' }),
    mkTask(10, { due_at: curYM + '-10' }),
    mkTask(11, { project_id: null }), // без проекта
  ],
  members: [{ id: 1, name: 'Аня', color: '#6BBFFF', initials: 'А' }],
  stages: stagesSeed,
  tokens: [],        // API-токены (создаются в ходе теста)
  tokenSeq: 0,
  createdFullTokens: {}, // полный token из ответа POST — по id
};

window.fetch = async (url, opts) => {
  const u = String(url);
  const method = (opts && opts.method) || 'GET';
  const resp = (status, body) => ({ ok: status < 400, status, json: async () => body });
  if (u === '/api/login' && method === 'POST') return resp(200, { ok: true });
  if (u === '/api/projects') return resp(200, { projects: data.projects });
  if (u === '/api/tasks' && method === 'GET') return resp(200, { tasks: data.tasks });
  if (u.startsWith('/api/tasks/') && method === 'PATCH') {
    if (failNextPatch) { failNextPatch = false; return resp(500, { error: 'сервер сломался' }); }
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
    if (b.project_id === 'none') b.project_id = null; // как реальный сервер
    const t = data.tasks.find((x) => x.id === id);
    if (t) Object.assign(t, b);
    requests.push({ method, u, body: b });
    return resp(200, t);
  }
  if (u.startsWith('/api/members')) return resp(200, { members: data.members });
  if (u === '/api/stages') return resp(200, data.stages);
  if (u === '/api/tokens' && method === 'GET') {
    const rows = data.tokens.map(({ token, ...rest }) => rest); // список без полных значений (как сервер)
    return resp(200, { tokens: rows });
  }
  if (u === '/api/tokens' && method === 'POST') {
    const b = JSON.parse(opts.body);
    data.tokenSeq++;
    const full = 'kb_raw_' + data.tokenSeq + '_full_value';
    data.createdFullTokens[data.tokenSeq] = full;
    data.tokens.push({
      id: data.tokenSeq, name: b.name, prefix: 'kb_' + data.tokenSeq,
      scopes: Array.isArray(b.scopes) ? b.scopes.join(',') : String(b.scopes || 'write'),
      created_at: '2026-10-01T12:57:36Z', expires_at: null, revoked_at: null,
    });
    // Полное значение — один раз, в ответе на создание (как реальный сервер).
    return resp(200, { id: data.tokenSeq, name: b.name, prefix: 'kb_' + data.tokenSeq, scopes: 'write', created_at: '2026-10-01T12:57:36Z', expires_at: null, token: full });
  }
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
w.eval(appSrc + '\n;window.__test = { state, renderBody, boot, renderApp, renderSidebar, openAgentsPanel, closeAgentsPanel, renderAgentsModal, applyTheme, openTaskModal, renderTable, sortedTableTasks, renderCalendar };');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) passed++;
  else { failed++; console.error('  ✗ ' + name); }
}

(async () => {
  await w.__test.boot();

  ok(!!document.querySelector('.sidebar'), 'sidebar отрисован');
  ok(!!document.querySelector('#ws-tasks'), 'секция «Задачи» есть');
  ok(document.querySelectorAll('#board .col').length === 5, '5 колонок канбана по сид-этапам');

  /* Канбан: карточки «Без проекта» не показываются в проекте / показываются в «Все задачи» */
  ok(document.querySelectorAll('#board .card').length === 11, 'в «Все задачи» 11 карточек (вкл. задачу без проекта)');

  /* --- Сайдбар: «Без проекта» --- */
  const noneRow = document.querySelector('.side-item.none-row');
  ok(!!noneRow, '«Без проекта» в сайдбаре');
  ok(noneRow.textContent.includes('1'), 'счётчик «Без проекта» = 1');

  noneRow.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok(w.__test.state.view.type === 'none', 'клик по «Без проекта» переключил вид');
  await new Promise((r) => setTimeout(r, 0));
  ok(document.querySelectorAll('#board .card').length === 1, 'в «Без проекта» 1 карточка');
  w.__test.state.view = { type: 'all' };
  w.__test.renderApp();

  /* --- Календарь --- */
  w.__test.state.viewType = 'CALENDAR';
  w.__test.renderBody();
  ok(!!document.querySelector('#ws-calendar'), 'секция «Календарь» есть (viewType=CALENDAR)');
  ok(document.querySelectorAll('#ws-calendar .cal-cell').length === 42, '42 ячейки календаря');
  ok(document.querySelector('#ws-calendar .cal-nodue') !== null, 'блок «Без срока» есть');
  ok(document.querySelectorAll('#ws-calendar .cal-nodue .cal-card').length === 2, 'в «Без срока» 2 карточки (з.6 и з.11 без проекта)');

  /* день 10-го: 5 задач → 3 карточки + попап */
  const findDay = (suffix) => [...document.querySelectorAll('#ws-calendar .cal-cell')]
    .find((c) => c.dataset.date && c.dataset.date.endsWith(suffix));
  const dayCell = findDay('-10');
  ok(dayCell && dayCell.querySelectorAll('.cal-card').length === 3, 'в дне показано максимум 3 карточки');
  const moreBtn = dayCell.querySelector('.cal-more');
  ok(!!moreBtn, 'в переполненном дне есть «Ещё N»');

  /* попап «Ещё N» */
  moreBtn.click();
  await new Promise((r) => setTimeout(r, 0));
  const pop = document.querySelector('#cal-pop');
  ok(!!pop, 'попап «Ещё N» открылся');
  ok(pop && pop.querySelectorAll('.cal-card').length === 6, 'в попапе все 6 задач дня');
  ok(pop && pop.querySelectorAll('.cal-card').length > 3, 'попап больше сжатого дня');
  /* закрытие */
  pop.querySelector('[data-pop-close]').click();
  await new Promise((r) => setTimeout(r, 0));
  ok(document.querySelector('#cal-pop') === null, 'попап закрылся');

  /* drag: drop на 16-е число (задачу с «Ещё N» перетаскиваем из попапа) */
  const cell = findDay('-16');
  ok(!!cell, 'ячейка 16-го найдена');
  const t5 = data.tasks.find((t) => t.id === 5);
  w.__test.state.calDragged = '5';
  cell.dispatchEvent(new w.Event('dragover', { bubbles: true }));
  cell.dispatchEvent(new w.Event('drop', { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 10));
  ok(String(t5.due_at).slice(0, 10) === cell.dataset.date, 'drop перенёс due_at на ' + cell.dataset.date);
  ok(requests.some((r) => r.method === 'PATCH' && r.u.includes('/api/tasks/5')), 'PATCH отправлен');

  /* откат при ошибке сервера */
  failNextPatch = true;
  const t6 = data.tasks.find((t) => t.id === 6);
  t6.due_at = curYM + '-05';
  w.__test.renderBody();
  const cell2 = findDay('-20');
  w.__test.state.calDragged = '6';
  cell2.dispatchEvent(new w.Event('drop', { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 10));
  ok(t6.due_at === curYM + '-05', 'при ошибке сервера срок откатился');

  /* XSS: заголовок задачи экранируется */
  data.tasks.push(mkTask(99, { due_at: curYM + '-15', title: '<img src=x onerror=alert(1)>' }));
  w.__test.renderBody();
  const xssCard = document.querySelector('.cal-card[data-id="99"]');
  ok(xssCard && !xssCard.querySelector('img'), 'XSS в заголовке задачи экранирован');

  /* drag в сайдбар: перенос в «Без проекта» */
  w.__test.state.viewType = 'KANBAN';
  w.__test.renderApp();
  const t1 = data.tasks.find((t) => t.id === 1);
  const sideEl = document.querySelector('#sidebar');
  w.__test.state.dragged = '1';
  const noneRow2 = document.querySelector('.side-item.none-row');
  noneRow2.dispatchEvent(new w.Event('drop', { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 10));
  ok(t1.project_id === null, 'drop на «Без проекта» обнулил project_id');
  ok(requests.some((r) => r.method === 'POST' && r.u.includes('/move') && r.body.project_id === null), 'move {project_id:"none"} отправлен');

  /* drop на проект из «без проекта» */
  w.__test.state.dragged = '1';
  const projRow = document.querySelector('.project-row[data-view="1"]');
  projRow.dispatchEvent(new w.Event('drop', { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 10));
  ok(String(data.tasks.find((t) => t.id === 1).project_id) === '1', 'drop на проект вернул project_id');
  ok(requests.some((r) => r.method === 'POST' && r.u.includes('/move') && String(r.body.project_id) === '1'), 'move {project_id:1} отправлен');

  /* таблица живёт в блоке «Задачи» + шестерёнка видна */
  w.__test.state.viewType = 'TABLE';
  w.__test.renderApp();
  ok(document.querySelector('#ws-tasks .table-wrap') !== null, 'таблица в блоке «Задачи» (viewType=TABLE)');
  ok(!!document.querySelector('#fields-btn'), 'шестерёнка «Настройки полей» в TABLE');
  ok(document.querySelector('#stages-btn') === null, 'панель этапов не показывается в TABLE');

  /* шестерёнка календаря */
  w.__test.state.viewType = 'CALENDAR';
  w.__test.renderApp();
  ok(!!document.querySelector('#fields-btn'), 'шестерёнка «Поля календаря» в CALENDAR');

  /* канбан: шестерёнка этапов */
  w.__test.state.viewType = 'KANBAN';
  w.__test.renderApp();
  ok(!!document.querySelector('#stages-btn'), 'шестерёнка этапов в KANBAN');
  ok(document.querySelector('#fields-btn') === null, 'панель полей не показывается в KANBAN');

  /* кнопка «Обновить» есть во всех видах и перезагружает данные */
  const rb = document.querySelector('#reload-btn');
  ok(!!rb, 'кнопка «Обновить» в шапке');
  const tasksCountBefore = data.tasks.length;
  data.tasks.push(mkTask(50, { title: 'Пришла от агента' }));
  rb.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 30));
  ok(w.__test.state.tasks.some((t) => t.id === 50), 'клик «Обновить» подтянул новую задачу');
  ok(!rb.classList.contains('spinning') || document.querySelector('#reload-btn') !== null, 'спиннер снят после загрузки');

  /* панель этапов: переименование видно, checkbox есть */
  document.querySelector('#stages-btn').click();
  await new Promise((r) => setTimeout(r, 0));
  const sp = document.querySelector('#stages-panel');
  ok(!!sp, 'панель этапов открылась');
  ok(sp.querySelectorAll('.st-row').length === 5, '5 строк этапов');
  ok(!!sp.querySelector('input[data-st-vis]'), 'чекбокс видимости этапа есть');
  ok(sp.querySelector('#st-add-open') !== null, 'кнопка «Добавить этап» есть');


  /* --- Панель этапов: переименование, видимость, добавление --- */
  const stName = sp.querySelector('.st-name[data-slabel="IN_PROGRESS"]');
  stName.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const ren = stName.querySelector('input.vf-rename');
  ok(!!ren, 'клик по имени этапа включил переименование');
  if (ren) {
    ren.value = 'Кодим';
    ren.blur();
    await new Promise((r) => setTimeout(r, 20));
    const sAfter = stagesSeed.find((x) => x.id === 'IN_PROGRESS');
    ok(sAfter.label === 'Кодим', 'PATCH label отправлен и применился (mock)');
  }

  /* видимость: снять IN_PROGRESS */
  const visCb = sp.querySelector('input[data-st-vis="IN_PROGRESS"]');
  visCb.checked = false;
  visCb.dispatchEvent(new w.Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  const sVis = stagesSeed.find((x) => x.id === 'IN_PROGRESS');
  ok(sVis.is_visible === false, 'PATCH is_visible=false применился');

  /* колонок стало 4 */
  w.__test.state.stages = stagesSeed; // reload не делаем, mock мутирует те же объекты
  w.__test.renderApp();
  ok(document.querySelectorAll('#board .col').length === 4, 'скрытый этап → 4 колонки на доске');

  /* вернуть видимость */
  const visCb2 = document.querySelector('input[data-st-vis="IN_PROGRESS"]');
  if (visCb2) {
    visCb2.checked = true;
    visCb2.dispatchEvent(new w.Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
  }
  ok(stagesSeed.find((x) => x.id === 'IN_PROGRESS').is_visible === true, 'видимость вернулась');

  /* модалка задачи: селект проекта с «Без проекта» (клик по карточке) */
  const card = document.querySelector('#board .card');
  card.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 30));
  const mfs = document.querySelector('#mf-stage');
  ok(mfs && mfs.querySelectorAll('option').length === stagesSeed.length + (stagesSeed.some((x) => x.id === 'DISCUSSION') ? 0 : 0), 'модалка: селект стадии из динамических этапов (' + (mfs ? mfs.options.length : 'нет') + ' опций)');
  const mfp = document.querySelector('#mf-project');
  ok(mfp && !![...mfp.options].find((o) => o.value === 'none'), 'модалка: селект проекта содержит «Без проекта»');

  /* Заметки: по умолчанию markdown-просмотр, редактор — по кнопке */
  const noteTa = document.querySelector('#mf-notes');
  const notePrev = document.querySelector('#notes-preview');
  const noteToggle = document.querySelector('#notes-toggle');
  ok(noteTa && noteTa.hidden, 'заметки: редактор скрыт при открытии задачи');
  ok(notePrev && !notePrev.hidden, 'заметки: markdown-просмотр виден сразу при открытии');
  ok(notePrev && !!notePrev.querySelector('.md-empty'), 'заметки: пустые заметки — заглушка в просмотре');
  const noteBtnLabel = noteToggle.textContent.trim();
  noteToggle.click();
  ok(!noteTa.hidden && notePrev.hidden, 'заметки: кнопка переключила в редактор');
  ok(noteToggle.textContent.trim() !== noteBtnLabel, 'заметки: подпись кнопки сменилась на редактор');
  noteTa.value = '# Заголовок\n\n- пункт **жирный**';
  noteToggle.click();
  ok(noteTa.hidden && !notePrev.hidden, 'заметки: кнопка вернула markdown-просмотр');
  ok(!!notePrev.querySelector('h1'), 'заметки: просмотр отрисовал markdown-заголовок');
  ok(!!notePrev.querySelector('ul li strong'), 'заметки: просмотр отрисовал список и жирный текст');

  /* --- Панель «Agents & tokens»: рендер с непустым списком (регрессия 565c1d2) --- */
  w.__test.openAgentsPanel();
  await new Promise((r) => setTimeout(r, 10)); // loadTokens отработал
  const am = document.querySelector('#agents-modal');
  ok(!!am, 'модалка агентов открылась');
  // Список ещё пуст → «нет токенов»; ошибок рендера быть не должно
  ok(!!am.querySelector('.tok-list .side-empty'), 'пустой список: строка «нет токенов»');
  // Создаём токен через форму
  am.querySelector('#tok-name').value = 'manager';
  am.querySelector('#tok-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 20));
  ok(document.querySelectorAll('#agents-modal .tok-row').length === 1, 'после создания 1 .tok-row (рендер не упал)');
  ok(document.querySelector('#agents-modal .tok-scope') !== null, 'scope-чип отрисовался (регрессия t→tr)');
  ok(document.querySelector('#nt-value') && document.querySelector('#nt-value').textContent.indexOf('kb_raw_') === 0, 'полное значение токена показано один раз');
  // Повторный рендер модалки (как при следующем открытии): список из state.tokens не бросает
  w.__test.renderAgentsModal();
  ok(document.querySelectorAll('#agents-modal .tok-row').length === 1, 'повторный рендер с непустым списком не бросает');
  // state обновлён
  ok(w.__test.state.tokens.length === 1, 'в state один токен');
  // Полное значение больше не в DOM (state.newToken сброшен только при закрытии — проверяем, что рендер без newToken его не рисует)
  state_newToken_check: {
    w.__test.state.newToken = null;
    w.__test.renderAgentsModal();
    ok(document.querySelector('#nt-value') === null, 'без state.newToken полное значение не рисуется');
  }
  w.__test.closeAgentsPanel();

  /* ==================== v9: urgency + project_access + theme + DOM-порядок ==================== */

  /* --- Дополнительные моки к существующему fetch-роутеру --- */
  const accessRequests = []; // журнал /access
  const usersSeed = [
    { id: 101, username: 'anna', display_name: 'Аня', role: 'member' },
    { id: 102, username: 'boris', display_name: 'Борис', role: 'member' },
    { id: 103, username: 'admin', display_name: 'Админ', role: 'admin' },
  ];
  data.users = usersSeed;
  data.access = { 1: { user_ids: [101, 103] } }; // проект 1 уже делится с anna
  const prevFetch = window.fetch;
  window.fetch = async (url, opts) => {
    const u = String(url);
    const method = (opts && opts.method) || 'GET';
    const resp = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (u === '/api/users' && method === 'GET') return resp(200, { users: data.users });
    if (u === '/api/users' && method === 'POST') { const b = JSON.parse(opts.body); return resp(200, { id: 900, username: b.username, role: b.role }); }
    if (u.startsWith('/api/users/') && method === 'PATCH') return resp(200, {});
    if (u.startsWith('/api/users/') && method === 'DELETE') return resp(200, {});
    if (u.startsWith('/api/projects/') && u.endsWith('/access')) {
      const pid = Number(u.split('/')[3]);
      if (method === 'GET') return resp(200, data.access[pid] || { user_ids: [] });
      if (method === 'PUT') {
        const b = JSON.parse(opts.body);
        data.access[pid] = { user_ids: [...b.user_ids] };
        accessRequests.push({ u, body: b });
        return resp(200, {});
      }
    }
    return prevFetch(url, opts);
  };
  ok(data.users.length === 3, 'v9: моки /api/users и /access добавлены');

  /* --- Общие хелперы v9 --- */
  const v9t = (id) => w.__test.state.tasks.find((t) => String(t.id) === String(id));
  // «reload»: state.tasks ссылаются на те же объекты, что и data.tasks, boot() не нужен
  const v9reload = () => w.__test.renderApp();
  // Кнопки и карточки кликаем через JS API: MouseEvent не реализует composed path для closest()
  const jsClick = (elm) => { if (!elm) throw new Error('jsClick: element not found'); elm.click(); };
  // Убеждаемся, что язык ru для проверок локали
  w.__test.state.lang = 'ru';

  /* ============ 1. УРГЕНТНОСТЬ ============ */
  w.__test.state.view = { type: 'all' };

  // Мок-задачи с ургентностью
  w.__test.state.tasks.push(mkTask(70, { stage: 'DISCUSSION', urgency: 'h' }));
  w.__test.state.tasks.push(mkTask(71, { stage: 'DISCUSSION', urgency: 'm' }));
  w.__test.state.tasks.push(mkTask(72, { stage: 'DISCUSSION', urgency: 'l' }));
  w.__test.state.tasks.push(mkTask(73, { stage: 'DISCUSSION', urgency: null }));
  w.__test.renderApp();

  const cardH = document.querySelector('.card[data-id="70"]');
  ok(!!cardH, 'v9: карточка urgency=h создана в DOM');
  ok(cardH.querySelector('.urg-square.urg-h') !== null, 'v9: канбан-карточка urgency=h содержит .urg-square.urg-h');
  const sqH = cardH.querySelector('.urg-square');
  ok(sqH && sqH.title.includes('Срочность'), 'v9: тултип квадратика содержит «Срочность»');
  ok(sqH && sqH.title.includes('Высокая'), 'v9: тултип квадратика содержит «Высокая»');
  ok(document.querySelector('.card[data-id="73"] .urg-square') === null, 'v9: задача без urgency — квадратика нет на канбан-карточке');

  /* Таблица: title-ячейка + колонка «Срочность» */
  w.__test.state.viewType = 'TABLE';
  w.__test.state.tableSort = { key: null, dir: 'asc' };
  v9reload();
  const titleTdH = document.querySelector('#ws-tasks tbody tr[data-id="70"] td.td-title');
  ok(!!titleTdH, 'v9: строка таблицы urgency=h отрисована');
  ok(titleTdH.querySelector('.urg-square.urg-h') !== null, 'v9: title-ячейка таблицы содержит квадратик urg-h');

  // Включаем поле urgency в TABLE через state.viewFields (GET-мок сидирует дефолтные 6 полей)
  ok(w.__test.state.viewFields.TABLE.some((r) => r.field_key === 'urgency'), 'v9: SYSTEM_KEYS дотянул urgency в TABLE-поля автоматически');
  const vfT = w.__test.state.viewFields.TABLE.find((r) => r.field_key === 'urgency');
  vfT.is_visible = true;
  v9reload();
  const urgTh = [...document.querySelectorAll('#ws-tasks thead th')].find((th) => th.dataset.k === 'urgency');
  ok(!!urgTh, 'v9: колонка «Срочность» появилась в TABLE');
  const urgTdH = document.querySelector('#ws-tasks tbody tr[data-id="70"] td .urg-square.urg-h');
  ok(!!urgTdH, 'v9: в колонке «Срочность» квадратик urg-h');

  // квадратика не должно быть ни в одной ячейке urgency-колонки у null-задачи
  const urgTd73 = document.querySelector('#ws-tasks tbody tr[data-id="73"] td .urg-square');
  ok(urgTd73 === null, 'v9: null-urgency — квадратика нет в колонке таблицы');

  /* Календарь: urgency=m на карточке */
  w.__test.state.viewType = 'CALENDAR';
  v9reload();
  const calM = document.querySelector('#ws-calendar .cal-card[data-id="71"]');
  ok(!!calM, 'v9: календарная карточка urgency=m отрисована');
  ok(calM.querySelector('.urg-square.urg-m') !== null, 'v9: календарная карточка содержит .urg-square.urg-m');
  ok(document.querySelector('#ws-calendar .cal-card[data-id="73"] .urg-square') === null, 'v9: null-urgency в календаре без квадратика');

  /* ============ 2. СОРТИРОВКА ============ */
  w.__test.state.viewType = 'TABLE';
  w.__test.state.tableSort = { key: 'urgency', dir: 'desc' };
  v9reload();
  const bodyRows = [...document.querySelectorAll('#ws-tasks tbody tr[data-id]')];
  ok(bodyRows.length >= 16, 'v9: в таблице достаточно строк для сортировки');
  /* При desc первая строка — null-urgency (значение 3 — максимум, уходит наверх при убывании);
     квадратика у неё нет — это и проверяем + отдельный asc-блок ниже даёт h→m→l→null. */
  const firstUrgTd = bodyRows[0].querySelector('td .urg-square');
  ok(firstUrgTd === null, 'v9: первая строка после сортировки urgency desc — без квадратика (null-urgency наверху)');
  const urgOrder = bodyRows.map((r) => {
    const sq = r.querySelector('td .urg-square');
    if (!sq) return 'null';
    if (sq.className.includes('urg-h')) return 'h';
    if (sq.className.includes('urg-m')) return 'm';
    if (sq.className.includes('urg-l')) return 'l';
    return '?';
  });
  /* Фактическая семантика app.js: sortValue urgency {h:0,m:1,l:2,null:3};
     desc (по убыванию числа) → null,l,m,h; asc → h,m,l,null («наивысшая срочность наверху»). */
  ok(urgOrder.indexOf('h') === urgOrder.lastIndexOf('h') && urgOrder.indexOf('h') === urgOrder.length - 1, 'v9: сортировка desc — h последняя (обратная семантика sortValue)');
  ok(urgOrder.indexOf('null') === 0, 'v9: сортировка desc — null первые');
  ok(urgOrder.indexOf('l') < urgOrder.indexOf('m') && urgOrder.indexOf('m') < urgOrder.lastIndexOf('h'), 'v9: сортировка desc — порядок null→l→m→h');
  // asc (первый клик по th или key с asc): h→m→l→null
  w.__test.state.tableSort = { key: 'urgency', dir: 'asc' };
  v9reload();
  const ascRows = [...document.querySelectorAll('#ws-tasks tbody tr[data-id]')];
  const ascOrder = ascRows.map((r) => {
    const sq = r.querySelector('td .urg-square');
    if (!sq) return 'null';
    if (sq.className.includes('urg-h')) return 'h';
    if (sq.className.includes('urg-m')) return 'm';
    if (sq.className.includes('urg-l')) return 'l';
    return 'null';
  });
  ok(ascOrder.indexOf('h') === 0, 'v9: сортировка asc — h первая строка');
  ok(ascOrder.indexOf('m') < ascOrder.indexOf('l'), 'v9: сортировка asc — m раньше l');
  ok(ascOrder.lastIndexOf('null') === ascOrder.length - 1, 'v9: сортировка asc — null последняя');
  w.__test.state.tableSort = { key: null, dir: 'asc' };

  /* ============ 3. МОДАЛКА ============ */
  const urg71 = v9t(71);
  ok(urg71 && urg71.urgency === 'm', 'v9: задача 71 имеет urgency=m в state');

  w.__test.state.viewType = 'KANBAN';
  v9reload();
  jsClick(document.querySelector('.card[data-id="71"]'));
  await new Promise((r) => setTimeout(r, 30));
  const mfUrg = document.querySelector('#mf-urgency');
  ok(!!mfUrg, 'v9: модалка содержит #mf-urgency');
  ok(mfUrg && mfUrg.value === 'm', 'v9: openTaskModal(m) → #mf-urgency.value=m');
  mfUrg.value = 'l';
  requests.length = 0;
  jsClick(document.querySelector('#mf-save'));
  await new Promise((r) => setTimeout(r, 30));
  const urgPatch = requests.find((r) => r.method === 'PATCH' && r.u.includes('/api/tasks/71'));
  ok(!!urgPatch, 'v9: PATCH задачи 71 отправлен');
  ok(!!urgPatch && urgPatch.body.urgency === 'l', 'v9: PATCH body urgency=l');
  ok(!!urgPatch && v9t(71).urgency === 'l', 'v9: mock применил urgency=l к задаче');

  // пустой (—) → null
  jsClick(document.querySelector('.card[data-id="71"]'));
  await new Promise((r) => setTimeout(r, 30));
  const mfUrg2 = document.querySelector('#mf-urgency');
  ok(mfUrg2 && mfUrg2.value === 'l', 'v9: повторное открытие модалки — urgency=l');
  mfUrg2.value = ''; // (—)
  requests.length = 0;
  jsClick(document.querySelector('#mf-save'));
  await new Promise((r) => setTimeout(r, 30));
  const urgNullPatch = requests.find((r) => r.method === 'PATCH' && r.u.includes('/api/tasks/71'));
  ok(!!urgNullPatch && urgNullPatch.body.urgency === null, 'v9: PATCH body urgency=null (пустой селект)');

  /* ============ 4. ДОСТУП (dots-меню) ============ */
  w.__test.state.me = { id: 103, username: 'admin', display_name: 'Админ', role: 'admin' };
  v9reload();
  const moreBtnV9 = document.querySelector('.project-row[data-view="1"] .project-more');
  ok(!!moreBtnV9, 'v9: dots-кнопка проекта отрисована');
  jsClick(moreBtnV9);
  const ctxAdmin = document.querySelector('.ctx-menu');
  ok(!!ctxAdmin, 'v9: dots-меню открылось (admin)');
  ok(ctxAdmin && [...ctxAdmin.querySelectorAll('.ctx-item')].some((b) => b.textContent.includes('Доступ')), 'v9: dots-меню содержит «Доступ»');
  // Клик «Доступ» → модалка с чекбоксами
  const accItem = [...ctxAdmin.querySelectorAll('.ctx-item')].find((b) => b.textContent.includes('Доступ'));
  jsClick(accItem);
  await new Promise((r) => setTimeout(r, 30));
  const accModal = document.querySelector('#access-modal');
  ok(!!accModal, 'v9: модалка доступа открылась');
  ok(document.querySelectorAll('#access-modal .acc-check').length === 3, 'v9: 3 чекбокса пользователей');
  const chkAnna = document.querySelector('#access-modal .acc-check[data-uid="101"]');
  const chkBoris = document.querySelector('#access-modal .acc-check[data-uid="102"]');
  ok(chkAnna && chkAnna.checked, 'v9: чекбокс anna предзаполнен из GET /access');
  ok(chkBoris && !chkBoris.checked, 'v9: чекбокс boris не отмечен');
  // Отмечаем boris, сохраняем
  chkBoris.checked = true;
  jsClick(document.querySelector('#access-save'));
  await new Promise((r) => setTimeout(r, 30));
  const putReq = accessRequests.find((r) => r.u.endsWith('/access'));
  ok(!!putReq, 'v9: PUT /api/projects/1/access отправлен');
  ok(!!putReq && JSON.stringify(putReq.body.user_ids.slice().sort()) === JSON.stringify([101, 102, 103].map(String).sort()), 'v9: PUT body {user_ids:[…]} правильный');
  ok([...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('обновлён')), 'v9: тост access.saved показан');
  ok(document.querySelector('#access-modal') === null, 'v9: модалка доступа закрылась после сохранения');

  // member: пункта «Доступ» нет
  w.__test.state.me = { id: 101, username: 'anna', display_name: 'Аня', role: 'member' };
  v9reload();
  jsClick(document.querySelector('.project-row[data-view="1"] .project-more'));
  const ctxMember = document.querySelector('.ctx-menu');
  ok(!!ctxMember, 'v9: dots-меню открылось (member)');
  ok(ctxMember && ![...ctxMember.querySelectorAll('.ctx-item')].some((b) => b.textContent.includes('Доступ')), 'v9: у member нет пункта «Доступ»');
  w.__test.state.me = { id: 103, username: 'admin', display_name: 'Админ', role: 'admin' };

  /* ============ 5. ТЕМА ============ */
  /* In-realm state читал kanban.theme при IIFE-инициализации app.js (там localStorage
     существует только с запуском node --localstorage-file=…). Хранилище в realm: */
  const realmSet = (k, v) => w.eval('localStorage.setItem(' + JSON.stringify(k) + ',' + JSON.stringify(v) + ')');
  const realmGet = (k) => w.eval('(function(){ try { return localStorage.getItem(' + JSON.stringify(k) + '); } catch (e) { return null; } })()');

  w.__test.renderSidebar();
  jsClick(document.querySelector('#settings-btn'));
  const themePop = document.querySelector('#settings-pop');
  ok(!!themePop, 'v9: попап настроек открылся');
  ok(themePop.querySelectorAll('.ssp-theme-btn').length === 3, 'v9: 3 кнопки темы (system/light/dark)');
  // dark
  jsClick(themePop.querySelector('.ssp-theme-btn[data-theme="dark"]'));
  ok(document.documentElement.dataset.theme === 'dark', 'v9: клик dark → dataset.theme=dark');
  ok(realmGet('kanban.theme') === 'dark', 'v9: клик dark → kanban.theme=dark (в realm-хранилище)');

  /* reload-имитация: как при старте делает IIFE state.theme — читаю LS и применяю */
  w.eval('__test.state.theme = (function(){ try { var th = localStorage.getItem("kanban.theme"); return (th === "dark" || th === "light" || th === "system") ? th : "system"; } catch (_) { return "system"; } })();');
  ok(w.eval('__test.state.theme') === 'dark', 'v9: reload-инициализация state.theme=dark из localStorage');
  // light
  jsClick(document.querySelector('.ssp-theme-btn[data-theme="light"]'));
  ok(document.documentElement.dataset.theme !== 'dark', 'v9: клик light → dataset.theme<>dark');
  ok(realmGet('kanban.theme') === 'light', 'v9: клик light → kanban.theme=light');

  /* ============ 5b. Система dark/light через matchMedia ============ */
  // jsdom не реализует matchMedia — замокать (нужен и внутри realm, где его нет совсем)
  const mqState = { matches: false }; // системная тёмная?
  w.matchMedia = (q) => ({
    media: q,
    matches: q === '(prefers-color-scheme: dark)' ? mqState.matches : false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent() { return false; },
  });
  // applyTheme смотрит window.matchMedia — в realm window это наш же замоканный объект
  w.eval('__test.state.theme = "system";');
  jsClick(document.querySelector('#settings-btn')); // переоткрыть попап (state.theme сменился вне кликов)
  w.eval('__test.applyTheme();');
  ok(w.eval('document.documentElement.dataset.theme') === '', 'v9: system + светлая ОС → dataset.theme пуст');
  mqState.matches = true; // «пользователь включил тёмную тему ОС»
  w.eval('__test.applyTheme();');
  ok(w.eval('document.documentElement.dataset.theme') === 'dark', 'v9: system + тёмная ОС → dataset.theme=dark');
  mqState.matches = false;
  w.eval('__test.state.theme = "dark"; __test.applyTheme();');
  ok(document.documentElement.dataset.theme === 'dark', 'v9: theme=dark восстановлен после системных переключений');
  ok(realmGet('kanban.theme') === 'light', 'v9: kanban.theme в LS не перезаписался системными переключениями');

  /* ============ 6. НОВЫЙ-НАВЕРХ ============ */
  w.__test.state.viewType = 'KANBAN';
  w.__test.renderApp();
  const col1 = document.querySelector('#board .col');
  const orderOk = col1
    && col1.querySelector('.col-head') !== null
    && col1.querySelector('.col-foot') !== null
    && col1.querySelector('.col-cards') !== null
    && col1.querySelector('.col-foot').nextElementSibling === col1.querySelector('.col-cards')
    && col1.querySelector('.col-head').nextElementSibling === col1.querySelector('.col-foot');
  ok(orderOk, 'v9: в колонке порядок col-head → col-foot → col-cards');
  // col-foot выше всех карточек той же колонки
  const firstCardInCol = col1.querySelector('.col-cards .card');
  ok(!firstCardInCol || (firstCardInCol.compareDocumentPosition(col1.querySelector('.col-foot')) & 2) !== 0, 'v9: col-foot выше карточек (новая кнопка над списком)');

  w.__test.state.viewType = 'TABLE';
  w.__test.state.tableSort = { key: null, dir: 'asc' };
  w.__test.renderApp();
  const tableHeadRow = document.querySelector('#table-head-row');
  const tableGrid = document.querySelector('#ws-tasks table.grid');
  ok(!!tableHeadRow && !!tableGrid, 'v9: table-head-row и table.grid существуют');
  ok(tableHeadRow.querySelector('#table-add-btn') !== null, 'v9: #table-add-btn внутри #table-head-row');
  ok((tableHeadRow.compareDocumentPosition(tableGrid) & 4) !== 0, 'v9: table-add-btn (head) раньше <table> в DOM');

  /* ============ 7. NODUE ============ */
  w.__test.state.viewType = 'CALENDAR';
  realmSet('kanban.calNoDueCollapsed', '0');
  w.__test.state.calNoDueCollapsed = false;
  w.__test.renderApp();
  const nodueBlock = document.querySelector('#ws-calendar .cal-nodue');
  ok(!!nodueBlock, 'v9: блок «Без срока» в календаре');
  const nodueToggle = document.querySelector('#cal-nodue-toggle');
  ok(!!nodueToggle, 'v9: #cal-nodue-toggle есть');
  ok(document.querySelectorAll('#ws-calendar .cal-nodue .cal-card').length >= 2, 'v9: карточки без срока видны (не свёрнуто)');
  // клик (in-realm, реальный event-путь) → collapse
  w.eval('document.querySelector("#cal-nodue-toggle").click()');
  await new Promise((r) => setTimeout(r, 20));
  const nodueAfter = document.querySelector('#ws-calendar .cal-nodue');
  ok(nodueAfter.classList.contains('collapsed'), 'v9: клик по тогглу свернул .cal-nodue.collapsed');
  ok(nodueAfter.querySelector('.cal-nodue-cards') !== null, 'v9: контейнер карточек на месте в свёрнутом блоке');
  // скрытие делает CSS-правило (.cal-nodue.collapsed .cal-nodue-cards { display: none; }) — сверяемся со style.css
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');
  ok(/\.cal-nodue\.collapsed \.cal-nodue-cards\s*\{\s*display:\s*none;/.test(cssSrc), 'v9: css .cal-nodue.collapsed скрывает .cal-nodue-cards (display:none)');
  ok(realmGet('kanban.calNoDueCollapsed') === '1', 'v9: localStorage kanban.calNoDueCollapsed=1 после клика');
  ok(w.__test.state.calNoDueCollapsed === true, 'v9: state.calNoDueCollapsed=true');
  // повторный клик → раскрыто
  w.eval('document.querySelector("#cal-nodue-toggle").click()');
  await new Promise((r) => setTimeout(r, 20));
  ok(!document.querySelector('#ws-calendar .cal-nodue').classList.contains('collapsed'), 'v9: повторный клик раскрыл блок');
  ok(realmGet('kanban.calNoDueCollapsed') === '0', 'v9: localStorage kanban.calNoDueCollapsed=0 после второго клика');
  // reload-сценарий: persisted state восстанавливается
  realmSet('kanban.calNoDueCollapsed', '1');
  w.eval('__test.state.calNoDueCollapsed = (function(){ try { return localStorage.getItem("kanban.calNoDueCollapsed") === "1"; } catch (_) { return false; } })();');
  w.__test.renderApp();
  ok(document.querySelector('#ws-calendar .cal-nodue').classList.contains('collapsed'), 'v9: после reload с persists=1 блок свёрнут');
  realmSet('kanban.calNoDueCollapsed', '0');
  w.eval('__test.state.calNoDueCollapsed = false;');
  w.__test.renderApp();

  console.log('\nDOM-тест: ' + passed + ' OK, ' + failed + ' FAIL');
  process.exit(failed ? 1 : 0);

})().catch((e) => { console.error('CRASH:', e); process.exit(2); });
