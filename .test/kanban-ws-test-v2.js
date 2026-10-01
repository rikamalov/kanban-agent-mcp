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
w.eval(appSrc + '\n;window.__test = { state, renderBody, boot, renderApp, renderSidebar, openAgentsPanel, closeAgentsPanel, renderAgentsModal };');

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

  console.log('\nDOM-тест: ' + passed + ' OK, ' + failed + ' FAIL');
  process.exit(failed ? 1 : 0);

})().catch((e) => { console.error('CRASH:', e); process.exit(2); });
