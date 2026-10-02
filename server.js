'use strict';

/*
 * Kanban backend — self-hosted kanban board. Zero npm dependencies by
 * default: Node stdlib only (http, crypto, fs, path, node:sqlite). CommonJS.
 * Run: node server.js
 *
 * Storage engines (store/index.js):
 *   default   — node:sqlite (file $KANBAN_DATA/kanban.db)
 *   optional  — PostgreSQL when DATABASE_URL or POSTGRES_HOST/POSTGRES_* is
 *               set (needs the optional "pg" package); the schema and all
 *               queries are engine-agnostic, see store/pg-sync.js
 *
 * ENV:
 *   KANBAN_PORT            — port, default 3100 (listening on 0.0.0.0)
 *   KANBAN_DATA            — data directory, default ./data
 *   KANBAN_MAX_LIFETIME_MS — self-terminate after N ms (smoke tests only)
 *   DATABASE_URL           — PostgreSQL connection string (switches engine)
 *   POSTGRES_HOST|PORT|USER|PASSWORD|DB|SSL — PostgreSQL via parts
 *   KANBAN_SETUP_TOKEN     — (optional) require this token in the setup
 *                            wizard to claim a fresh instance
 *
 * Data files (directory is created automatically):
 *   $KANBAN_DATA/kanban.db        — SQLite (only when using the default engine)
 *   $KANBAN_DATA/config.json      — setup marker: { setup_completed_at }
 *
 * Authentication (v8):
 *   humans  — username + password (scrypt), cookie session (sid, stored in
 *             the DB, survives restarts). Roles: 'admin' | 'member'.
 *   agents  — Authorization: Bearer kb_<token>; the DB stores only the
 *             sha256 hash (api_token.token_hash) + prefix; the full token is
 *             shown ONCE at creation.
 *   MCP     — POST /mcp (JSON-RPC 2.0, Streamable HTTP, stateless), Bearer.
 *
 * First-run setup (v8): with no users in the DB the server is in "setup"
 * mode — GET / serves public/setup.html (welcome wizard) and POST
 * /api/setup creates the administrator account. KANBAN_PASSWORD is gone;
 * credentials never exist in plain text anywhere.
 */

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Engine selection FIRST (store/pg-*.js are lazily loaded only for postgres).
const { selectEngineFromEnv, pgDdl, openDatabase } = require('./store/index.js');
const ENGINE = selectEngineFromEnv(process.env);

// ---------------------------------------------------------------------------
// Конфигурация
// ---------------------------------------------------------------------------

const PORT = Number.parseInt(process.env.KANBAN_PORT || '3100', 10) || 3100;
const DATA_DIR = process.env.KANBAN_DATA || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'kanban.db');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SETUP_TOKEN = process.env.KANBAN_SETUP_TOKEN || null;

// STAGES — исходный список-сид; с миграции v6 этапы живут в таблице stage
// (переименование/порядок/видимость/добавление/удаление через /api/stages).
const STAGES = ['DISCUSSION', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
const STAGE_LABELS = {
  DISCUSSION: 'Discuss',
  IN_PROGRESS: 'In progress',
  REVIEW: 'Review',
  COMPLETED: 'Done',
};
const STAGE_COLORS = {
  DISCUSSION: '#6BBFFF',
  IN_PROGRESS: '#926FFF',
  REVIEW: '#FF913B',
  COMPLETED: '#55D379',
};
const STAGE_SEED = STAGES.map((key, i) => ({
  key,
  label: STAGE_LABELS[key],
  color: STAGE_COLORS[key],
  is_done: key === 'COMPLETED' ? 1 : 0,
}));
const PALETTE = ['#6bbfff', '#926fff', '#ff913b', '#fcdb51', '#55d379', '#4662d5', '#ff7269', '#20c0c0', '#e57ae1', '#f0b100'];

// CONTRACT-v2: типы пользовательских полей и системные ключи представлений.
const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'CHECKBOX'];
// v5: настройки полей — на все представления, включая календарь.
const VIEW_TYPES = ['KANBAN', 'TABLE', 'CALENDAR'];
// ключ → дефолтная подпись (label) в настройках представлений.
const SYSTEM_FIELDS = {
  title: 'Task',
  stage: 'Stage',
  project: 'Project',
  due_at: 'Due date',
  assignee: 'Assignee',
  created_at: 'Created',
  // v9: срочность задачи — колонка в «Таблице».
  urgency: 'Urgency',
};
// Структура «системных» полей одна во всех локалях фронтенда: фронт
// подставляет локализованные подписи по ключу (I18N), здесь — EN по умолчанию.
// view_type → [field_key, ...] в дефолтном порядке (title всегда виден).
// KANBAN: без project/created_at (проект и так выбран фильтром вида; дата создания не нужна на карточке).
// TABLE: полный набор. mergeFieldRows добавит скрытые/новые поля как локальные при расхождении.
const DEFAULT_VIEW_FIELDS = {
  KANBAN: ['title', 'stage', 'project', 'due_at', 'assignee'],
  TABLE: ['title', 'stage', 'project', 'due_at', 'assignee', 'created_at'],
};
const MEMBER_COLORS = PALETTE;
const MEMBER_DEFAULT_COLOR = PALETTE[5]; // #4662d5 — «цвет по умолчанию»
const CUSTOM_TEXT_MAX = 500;

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const SESSION_COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);
const LOGIN_RATE_LIMIT = 5;          // попыток на IP
const LOGIN_RATE_WINDOW_MS = 60_000; // в минуту
const BODY_LIMIT_BYTES = 1024 * 1024;
const SCRYPT_KEYLEN = 64;

// API-токены агентов (v3): в БД только sha256-хеш; сравнение — timingSafeEqual.
const TOKEN_PREFIX = 'kb_';
const TOKEN_BYTES = 32;             // 256 бит энтропии
const TOKEN_RATE_LIMIT = 120;       // запросов на токен
const TOKEN_RATE_WINDOW_MS = 60_000; // в минуту
const TOKEN_SCOPES = ['read', 'write'];

// MCP (v3): JSON-RPC 2.0 поверх HTTP, stateless без SSE-стрима.
const MCP_PROTOCOL_VERSION = '2025-06-18';
const JSONRPC_BATCH_LIMIT = 32;

// Самоубийство по таймеру — только для smoke-тестов (в обычной работе не задаётся).
const MAX_LIFETIME_MS = Number.parseInt(process.env.KANBAN_MAX_LIFETIME_MS || '0', 10);
if (MAX_LIFETIME_MS > 0) {
  setTimeout(() => {
    console.log(`[kanban] KANBAN_MAX_LIFETIME_MS=${MAX_LIFETIME_MS} elapsed — self-termination`);
    process.exit(0);
  }, MAX_LIFETIME_MS).unref();
}

// Каталог данных создаём до всего остального.
fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Сессии в SQLite (переживают рестарт; можно отозвать) + rate-limit логина
// ---------------------------------------------------------------------------

function createSession(userId) {
  const sid = crypto.randomBytes(24).toString('base64url');
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_TTL_MS);
  db.prepare('INSERT INTO session (sid, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(sid, userId, created.toISOString(), expires.toISOString());
  return sid;
}

function getSession(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  const row = db.prepare(`
    SELECT s.sid, s.expires_at, u.id AS user_id, u.username, u.role, u.display_name
    FROM session s JOIN ${USER_TABLE} u ON u.id = s.user_id
    WHERE s.sid = ?
  `).get(sid);
  if (!row) return null;
  const expiresAt = Date.parse(row.expires_at);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    db.prepare('DELETE FROM session WHERE sid = ?').run(sid);
    return null;
  }
  return {
    sid,
    via: 'user',
    user: { id: row.user_id, username: row.username, role: row.role, display_name: row.display_name },
  };
}

function sessionCookie(sid) {
  return `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}` + COOKIE_SECURE_ATTRIBUTE;
}

// Secure-флаг на куке сессии: включён по умолчанию, отключается KANBAN_INSECURE_COOKIE=1
// для чистого HTTP (например, локальная разработка или доступ по IP без TLS).
const COOKIE_SECURE_ATTRIBUTE = process.env.KANBAN_INSECURE_COOKIE === '1' ? '' : '; Secure';

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
}

// Map ip -> timestamps
const loginAttempts = new Map();

function allowLoginAttempt(ip) {
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter((t) => now - t < LOGIN_RATE_WINDOW_MS);
  if (attempts.length >= LOGIN_RATE_LIMIT) {
    loginAttempts.set(ip, attempts);
    return false;
  }
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  return true;
}

// Чистка просроченных сессий и старых попыток логина — по таймеру.
setInterval(() => {
  const nowIsoStr = nowIso();
  db.prepare('DELETE FROM session WHERE expires_at <= ?').run(nowIsoStr);
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts) {
    const fresh = attempts.filter((t) => now - t < LOGIN_RATE_WINDOW_MS);
    if (fresh.length === 0) loginAttempts.delete(ip);
    else loginAttempts.set(ip, fresh);
  }
  for (const [key, attempts] of tokenAttempts) {
    const fresh = attempts.filter((t) => now - t < TOKEN_RATE_WINDOW_MS);
    if (fresh.length === 0) tokenAttempts.delete(key);
    else tokenAttempts.set(key, fresh);
  }
}, 10 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Аутентификация: users (username + scrypt), роли admin|member
// ---------------------------------------------------------------------------

const USER_ROLES = ['admin', 'member'];
const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,31}$/; // 2–32, латиница/цифры/._-
const SCRYPT_USER_KEYLEN = 64;
// Явные параметры scrypt (OWASP: N = 2^15, r = 8, p = 1 для интерактивной аутентификации).
// scryptSync блокирует event loop на время вычисления — рост N поднимает и
// стоимость офлайн-подбора, и время обработки каждого запроса на вход.
const SCRYPT_N = 2 ** 15;
const SCRYPT_PARAMS = { N: SCRYPT_N, r: 8, p: 1, maxmem: 128 * SCRYPT_N * 8 * 2 };
// Хеши, созданные до ужесточения, считались с node-дефолтом (N = 2^14);
// они остаются валидными и обновляются до новых параметров при следующем входе.
const SCRYPT_PARAMS_LEGACY = { N: 2 ** 14, r: 8, p: 1, maxmem: 128 * (2 ** 14) * 8 * 2 };

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, SCRYPT_USER_KEYLEN, SCRYPT_PARAMS).toString('hex');
}

// Фиктивная запись пароля: scrypt-вычисление той же стоимости для неизвестных
// имён — выравнивание времени ответа (защита от перечисления username по таймингу).
const DUMMY_SALT = crypto.randomBytes(16).toString('hex');
function dummyPasswordRecord() {
  crypto.scryptSync('invalid-password-placeholder', DUMMY_SALT, SCRYPT_USER_KEYLEN, SCRYPT_PARAMS);
}

function makePasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
}

function verifyUserPassword(row, password) {
  const stored = Buffer.from(row.password_hash, 'hex');
  const actual = crypto.scryptSync(password, row.password_salt, SCRYPT_USER_KEYLEN, SCRYPT_PARAMS);
  if (actual.length === stored.length && crypto.timingSafeEqual(actual, stored)) return true;
  const legacy = crypto.scryptSync(password, row.password_salt, SCRYPT_USER_KEYLEN, SCRYPT_PARAMS_LEGACY);
  if (legacy.length === stored.length && crypto.timingSafeEqual(legacy, stored)) {
    // Тихий апгрейд: пересохраняем хеш с ужесточёнными параметрами.
    try {
      db.prepare('UPDATE kbar_user SET password_salt = ?, password_hash = ? WHERE id = ?')
        .run(row.password_salt, hashPassword(password, row.password_salt), row.id);
    } catch { /* апгрейд не ломает вход */ }
    return true;
  }
  return false;
}

// Режим первичной настройки: пользователей ещё нет.
function isSetupMode() {
  return db.prepare('SELECT COUNT(*) AS c FROM kbar_user').get().c === 0;
}

function countAdmins() {
  return db.prepare("SELECT COUNT(*) AS c FROM kbar_user WHERE role = 'admin'").get().c;
}

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM kbar_user WHERE username = ?').get(String(username || '').trim().toLowerCase());
}

function getUserById(id) {
  return db.prepare('SELECT id, username, display_name, role, created_at, last_login_at FROM kbar_user WHERE id = ?').get(id);
}

function userPublic(u) {
  return u
    ? { id: u.id, username: u.username, display_name: u.display_name, role: u.role, created_at: u.created_at, last_login_at: u.last_login_at }
    : null;
}

// ---------------------------------------------------------------------------
// API-токены агентов (v3): bearer kb_…; в БД только sha256-хеш
// ---------------------------------------------------------------------------

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

// Map key -> [timestamps]; для токенов ключ = token_id, для IP — IP.
const tokenAttempts = new Map();
// token_id -> 'YYYY-MM-DDTHH:mm' последнего обновления last_used_at.
const tokenLastUsed = new Map();

function allowTokenAttempt(tokenId) {
  const now = Date.now();
  const attempts = (tokenAttempts.get(tokenId) || []).filter((t) => now - t < TOKEN_RATE_WINDOW_MS);
  if (attempts.length >= TOKEN_RATE_LIMIT) {
    tokenAttempts.set(tokenId, attempts);
    return false;
  }
  attempts.push(now);
  tokenAttempts.set(tokenId, attempts);
  return true;
}

// Извлечь bearer-токен из заголовка. Возвращает строку kb_… или null.
function extractBearer(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  if (!m) return null;
  return m[1].trim();
}

// Проверить bearer-токен → { row, scopes, via: 'token' } | null.
// Сравнение дайджестов — timingSafeEqual по необработанным байтам.
function getTokenByBearer(raw) {
  if (typeof raw !== 'string' || !raw.startsWith(TOKEN_PREFIX)) return null;
  const hash = hashToken(raw);
  const row = db.prepare(`
    SELECT id, name, token_hash, prefix, scopes, expires_at, revoked_at
    FROM api_token WHERE token_hash = ?
  `).get(hash);
  if (!row) return null;
  const check = Buffer.from(row.token_hash, 'hex');
  const given = Buffer.from(hash, 'hex');
  if (check.length !== given.length || !crypto.timingSafeEqual(check, given)) return null;
  if (row.revoked_at) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return null;
  const scopes = String(row.scopes || 'write').split(',').map((s) => s.trim()).filter(Boolean);
  return { row, scopes, via: 'token' };
}

// ---------------------------------------------------------------------------
// БД: node:sqlite (по умолчанию) или PostgreSQL (store/pg-sync.js)
// ---------------------------------------------------------------------------

const DIALECT = ENGINE.engine; // 'sqlite' | 'postgres'

const db = openDatabase(ENGINE, DB_PATH);
if (DIALECT === 'postgres') {
  console.log('[kanban] DB engine: PostgreSQL');
}
if (DIALECT === 'sqlite') {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
}
const USER_TABLE = 'kbar_user'; // на PostgreSQL `user` зарезервировано

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS ${USER_TABLE} (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS session (
  sid        TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES ${USER_TABLE}(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api_token (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  prefix       TEXT NOT NULL,
  scopes       TEXT NOT NULL DEFAULT 'write',
  created_by   INTEGER,
  created_at   TEXT NOT NULL,
  last_used_at TEXT,
  expires_at   TEXT,
  revoked_at   TEXT
);
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  at         TEXT NOT NULL,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  detail     TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at);

CREATE TABLE IF NOT EXISTS project (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  color      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  archived   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stage (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  color      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  is_done    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS member (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  color      TEXT,
  initials   TEXT,
  position   REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS task (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  stage      TEXT NOT NULL DEFAULT 'DISCUSSION',
  position   REAL NOT NULL DEFAULT 0,
  due_at     TEXT,
  assignee   TEXT,
  assignee_id INTEGER REFERENCES member(id) ON DELETE SET NULL,
  notes      TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_field (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'TEXT'
             CHECK (type IN ('TEXT', 'NUMBER', 'DATE', 'CHECKBOX')),
  position   REAL NOT NULL DEFAULT 0,
  is_active  INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS task_field_value (
  task_id    INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  field_id   INTEGER NOT NULL REFERENCES custom_field(id) ON DELETE CASCADE,
  value_text TEXT,
  PRIMARY KEY (task_id, field_id)
);
CREATE TABLE IF NOT EXISTS view_field (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  view_type  TEXT NOT NULL,
  field_key  TEXT NOT NULL,
  label      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS project_access (
  project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES ${USER_TABLE}(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);
`;

// На SQLite PRAGMA foreign_keys — вне транзакций; на PostgreSQL заменяем на
// no-op (FK объявлены в DDL). journal_mode=WAL — только SQLite.
db.exec(DIALECT === 'postgres' ? pgDdl(SCHEMA_SQL) : SCHEMA_SQL);

// DDL внутри миграций: на PostgreSQL прогоняем через pgDdl (AUTOINCREMENT→SERIAL,
// REAL→DOUBLE PRECISION); на SQLite оставляем как есть.
const migDdl = (sqlText) => (DIALECT === 'postgres' ? pgDdl(sqlText) : sqlText);

// ---------------------------------------------------------------------------
// Миграции CONTRACT-v4 (идемпотентны, выполняются при каждом старте):
//   api_token(id, name, token_hash UNIQUE, prefix, scopes, created_at,
//             last_used_at, expires_at, revoked_at)
//   audit_log(id, at, actor, action, entity, entity_id, detail)
//   session(sid PK, created_at, expires_at) — сессии переживают рестарт
// ---------------------------------------------------------------------------

function migrateV4() {
  const migrated = [];
  // Сессии, созданные до v4 (в памяти) — протухли при старте; чистим мусор.
  // (nowIso ещё в TDZ — используем прямую дату.)
  db.prepare('DELETE FROM session WHERE expires_at <= ?').run(new Date().toISOString());
  // expires_at TEXT с индексом для чистки.
  db.exec('CREATE INDEX IF NOT EXISTS idx_session_expires ON session(expires_at)');
  if (migrated.length > 0) console.log(`[kanban] Migrations v4: ${migrated.join('; ')}`);
}
migrateV4();

// ---------------------------------------------------------------------------
// Миграция v5: view_field на все типы представлений (KANBAN, TABLE, CALENDAR)
// ---------------------------------------------------------------------------

function migrateV5() {
  const migrated = [];
  // На свежей БД таблицы ещё нет (создаётся в migrateV2 позже) — создаём сразу
  // без CHECK, чтобы порядок запуска миграций не зависел от v2.
  db.exec(migDdl(`
CREATE TABLE IF NOT EXISTS view_field (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  view_type  TEXT NOT NULL,
  field_key  TEXT NOT NULL,
  label      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1
);
  `));
  const cols = db.prepare('PRAGMA table_info(view_field)').all();
  // CHECK (view_type IN (...)) нельзя снять ALTER'ом — пересоздаём таблицу.
  if (cols.length > 0) {
    const check = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = 'view_field'").get();
    if (check && /CHECK\s*\(view_type/i.test(check.sql)) {
      db.exec('BEGIN');
      try {
        db.exec(`
CREATE TABLE view_field_new (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  view_type  TEXT NOT NULL,
  field_key  TEXT NOT NULL,
  label      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1
);
INSERT INTO view_field_new (id, view_type, field_key, label, position, is_visible)
  SELECT id, view_type, field_key, label, position, is_visible FROM view_field;
DROP TABLE view_field;
ALTER TABLE view_field_new RENAME TO view_field;
`);
        db.exec('COMMIT');
        migrated.push('view_field: dropped the view_type CHECK');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }
  }
  // Дефолтные поля для CALENDAR — только если записей ещё нет.
  if (!db.prepare("SELECT COUNT(*) AS c FROM view_field WHERE view_type = 'CALENDAR'").get().c) {
    const ins = db.prepare('INSERT INTO view_field (view_type, field_key, label, position, is_visible) VALUES (?, ?, ?, ?, 1)');
    DEFAULT_VIEW_FIELDS.KANBAN.forEach((key, i) => ins.run('CALENDAR', key, SYSTEM_FIELDS[key], i + 1));
    migrated.push('view_field: CALENDAR defaults');
  }
  if (migrated.length > 0) console.log(`[kanban] Migrations v5: ${migrated.join('; ')}`);
}
migrateV5();

// ---------------------------------------------------------------------------
// Миграция v6: этапы в таблице stage (+ task.project_id nullable → «без проекта»)
// ---------------------------------------------------------------------------

function migrateV6() {
  const migrated = [];
  const hasStageTable = db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name = 'stage'").get().c > 0;
  if (!hasStageTable) {
    db.exec(migDdl(`
CREATE TABLE stage (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  color      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  is_done    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`));
  }
  // Сид этапов: таблицы не было ИЛИ она пуста (task.stage дефолтится на DISCUSSION —
  // валидация id должна находить хотя бы сид-этапы).
  if (!db.prepare('SELECT COUNT(*) AS c FROM stage').get().c) {
    const ins = db.prepare('INSERT INTO stage (id, label, color, position, is_visible, is_done, created_at) VALUES (?, ?, ?, ?, 1, ?, ?)');
    const ts = new Date().toISOString();
    db.exec('BEGIN');
    try {
      STAGE_SEED.forEach((s, i) => ins.run(s.key, s.label, s.color, i + 1, s.is_done, ts));
      db.exec('COMMIT');
      migrated.push('stage: seeded 5 stages');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  // task: project_id NULLABLE + снятие CHECK со stage — обе правки требуют пересоздания.
  const tcols = db.prepare('PRAGMA table_info(task)').all();
  const tpk = tcols.find((c) => c.name === 'project_id');
  const taskHasCheck = (() => {
    const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = 'task'").get();
    return !!(sql && /CHECK\s*\(stage/i.test(sql.sql));
  })();
  if ((tpk && tpk.notnull === 1) || taskHasCheck) {
    db.exec('BEGIN');
    try {
      db.exec(migDdl(`
CREATE TABLE task_new (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  stage      TEXT NOT NULL DEFAULT 'DISCUSSION',
  position   REAL NOT NULL DEFAULT 0,
  due_at     TEXT,
  assignee   TEXT,
  notes      TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO task_new (id, project_id, title, stage, position, due_at, assignee, notes, created_at, updated_at)
  SELECT id, project_id, title, stage, position, due_at, assignee, notes, created_at, updated_at FROM task;
DROP TABLE task;
ALTER TABLE task_new RENAME TO task;
`));
      db.exec('COMMIT');
      migrated.push('task: project_id made nullable, stage CHECK dropped');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
  // assignee_id мог добавляться ALTER'ом (migrateV2) — восстанавливаем, если нет.
  const tcols2 = tableColumns('task');
  if (!tcols2.includes('assignee_id')) {
    db.exec('ALTER TABLE task ADD COLUMN assignee_id INTEGER REFERENCES member(id) ON DELETE SET NULL');
    migrated.push('task.assignee_id restored');
  }
  if (migrated.length > 0) console.log(`[kanban] Migrations v6: ${migrated.join('; ')}`);
}
migrateV6();

// ---------------------------------------------------------------------------
// Миграция v7: multi-user.
//   kbar_user(id, username UNIQUE, display_name, role, password_salt,
//             password_hash, created_at, last_login_at)
//   session.user_id NOT NULL REFERENCES kbar_user ON DELETE CASCADE
// Одно-парольные установки (config.json с password_salt/password_hash)
// мигрируют: пароль сохраняется, создаётся администратор с именем "admin",
// при первом входе пароль можно сменить. Свежая БД остаётся пустой —
// администратор создаётся в web-мастере первичной настройки (setup).
// ---------------------------------------------------------------------------

function migrateV7() {
  const migrated = [];
  const nowIsoV7 = () => new Date().toISOString();

  // kbar_user (на PostgreSQL имя `user` зарезервировано — везде kbar_user).
  db.exec(migDdl(`
CREATE TABLE IF NOT EXISTS kbar_user (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'member',
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);
  `));

  // session.user_id: колонки нет → добавить и привязать старые сессии
  // к администратору-мигранту (см. ниже).
  const sesCols = tableColumns('session');
  if (!sesCols.includes('user_id')) {
    // Одно-парольная эра: пароль один на всех, admin ровно один.
    const uid = ensureMigratedAdmin(nowIsoV7, migrated);
    db.exec(`ALTER TABLE session ADD COLUMN user_id INTEGER REFERENCES ${USER_TABLE}(id) ON DELETE CASCADE`);
    if (uid !== null) {
      db.prepare('UPDATE session SET user_id = ? WHERE user_id IS NULL').run(uid);
    }
    migrated.push('session.user_id added');
  } else {
    ensureMigratedAdmin(nowIsoV7, migrated); // идемпотентно: только при наличии config.json
  }
  if (migrated.length > 0) console.log(`[kanban] Migrations v7: ${migrated.join('; ')}`);
}

// Одно-парольные установки: config.json → учётка admin с тем же паролем.
function ensureMigratedAdmin(nowIsoV7, migrated) {
  // config.json рядом с БД (DATA_DIR может отличаться — читаем оба места).
  const candidates = [path.join(DATA_DIR, 'config.json')];
  let cfg = null;
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      }
    } catch (_) { /* повреждённый файл — пропустить */ }
  }
  if (!cfg || typeof cfg.password_salt !== 'string' || typeof cfg.password_hash !== 'string') return null;
  if (db.prepare('SELECT COUNT(*) AS c FROM kbar_user').get().c > 0) return null;
  const info = db.prepare(`INSERT INTO ${USER_TABLE} (username, display_name, role, password_salt, password_hash, created_at) VALUES (?, ?, 'admin', ?, ?, ?)`)
    .run('admin', 'Administrator', cfg.password_salt, cfg.password_hash, nowIsoV7());
  migrated.push('config.json migrated into the admin account (password preserved)');
  return Number(info.lastInsertRowid);
}
migrateV7();

// Этапы из БД (кэш + список для валидации). Пусто — сид уже был в v6.
function listStageRows() {
  return db.prepare('SELECT id, label, color, position, is_visible, is_done, created_at FROM stage ORDER BY position, id').all();
}

// Валидация stage: id должен существовать в таблице stage (строгое String-сравнение).
function validStage(id) {
  if (typeof id !== 'string' || !id) return false;
  return !!db.prepare('SELECT id FROM stage WHERE id = ?').get(id);
}

const STAGE_ID_RE = /^[A-Z][A-Z0-9_]{1,31}$/;

// Первая (низшая) стадия — куда переезжают задачи из удалённого этапа.
function firstStageId() {
  const rows = listStageRows();
  return rows.length > 0 ? rows[0].id : null;
}

// ---------------------------------------------------------------------------
// Миграции CONTRACT-v2 (идемпотентны, выполняются при каждом старте):
//   member(id, name, color, initials, position, created_at)
//   task.assignee_id INTEGER REFERENCES member(id) ON DELETE SET NULL
//   custom_field(id, name, type, position, is_active)
//   task_field_value(task_id, field_id, value_text)
//   view_field(id, view_type, field_key, label, position, is_visible)
// Перенос task.assignee (TEXT) → assignee_id (member).
// ---------------------------------------------------------------------------

function tableColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((c) => c.name);
}

function migrateV3() {
  const migrated = [];
  const cols = db.prepare("PRAGMA table_info(project)").all();
  if (!cols.some((c) => c.name === 'archived')) {
    db.exec('ALTER TABLE project ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');
    migrated.push('project.archived added');
  }
  if (migrated.length > 0) console.log(`[kanban] Migrations v3: ${migrated.join('; ')}`);
}
migrateV3();

function migrateV2() {
  const migrated = [];
  const nowIso = () => new Date().toISOString(); // helpers ниже ещё не инициализированы (TDZ)

  db.exec(migDdl(`
CREATE TABLE IF NOT EXISTS member (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  color      TEXT,
  initials   TEXT,
  position   REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_field (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'TEXT'
             CHECK (type IN ('TEXT', 'NUMBER', 'DATE', 'CHECKBOX')),
  position   REAL NOT NULL DEFAULT 0,
  is_active  INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS task_field_value (
  task_id    INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  field_id   INTEGER NOT NULL REFERENCES custom_field(id) ON DELETE CASCADE,
  value_text TEXT,
  PRIMARY KEY (task_id, field_id)
);
CREATE TABLE IF NOT EXISTS view_field (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  view_type  TEXT NOT NULL
             CHECK (view_type IN ('KANBAN', 'TABLE')),
  field_key  TEXT NOT NULL,
  label      TEXT,
  position   REAL NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1
);
  `));

  // task.assignee_id: ALTER, если колонки ещё нет.
  const taskCols = tableColumns('task');
  if (!taskCols.includes('assignee_id')) {
    db.exec("ALTER TABLE task ADD COLUMN assignee_id INTEGER REFERENCES member(id) ON DELETE SET NULL");
    migrated.push('task.assignee_id added');
  }

  // Перенос старого TEXT-поля assignee → assignee_id (только непустые значения).
  const legacy = db.prepare("SELECT id, assignee FROM task WHERE assignee IS NOT NULL AND TRIM(assignee) != '' AND assignee_id IS NULL").all();
  if (legacy.length > 0) {
    const memberByName = new Map(db.prepare('SELECT id, name FROM member').all().map((m) => [m.name, m.id]));
    const maxPos = () => db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM member').get().m;
    const upd = db.prepare('UPDATE task SET assignee_id = ? WHERE id = ?');
    db.exec('BEGIN');
    try {
      let pos = maxPos();
      for (const row of legacy) {
        const name = row.assignee.trim().slice(0, 200);
        if (!name) continue;
        let memberId = memberByName.get(name);
        if (memberId === undefined) {
          const initials = name.split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join('');
          const info = db.prepare('INSERT INTO member (name, color, initials, position, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(name, MEMBER_DEFAULT_COLOR, initials || name.slice(0, 2).toUpperCase(), (pos += 1), nowIso());
          memberId = Number(info.lastInsertRowid);
          memberByName.set(name, memberId);
        }
        upd.run(memberId, row.id);
      }
      db.exec('COMMIT');
      migrated.push(`task.assignee → assignee_id: migrated ${legacy.length} tasks`);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  // Дефолтные view_field — только если для view_type ещё нет ни одной записи.
  const seedView = (viewType) => {
    const has = db.prepare('SELECT COUNT(*) AS c FROM view_field WHERE view_type = ?').get(viewType).c > 0;
    if (has) return;
    const ins = db.prepare('INSERT INTO view_field (view_type, field_key, label, position, is_visible) VALUES (?, ?, ?, ?, 1)');
    db.exec('BEGIN');
    try {
      DEFAULT_VIEW_FIELDS[viewType].forEach((key, i) => ins.run(viewType, key, SYSTEM_FIELDS[key], i + 1));
      db.exec('COMMIT');
      migrated.push(`view_field: ${viewType} defaults`);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
  seedView('KANBAN');
  seedView('TABLE');

  if (migrated.length > 0) console.log(`[kanban] Migrations v2: ${migrated.join('; ')}`);
}

migrateV2();

// ---------------------------------------------------------------------------
// Миграция v8: срочность задачи + доступ не-админов к проектам.
//   task.urgency TEXT NULL ('h' | 'm' | 'l', NULL = нет)
//   project_access(project_id, user_id) — композитный PK, заменяемый набор
//   view_field(field_key='urgency', view_type='TABLE') — колонка срочности
//   в «Таблице», сидируется как новый системный ключ (idempotentно).
// Запуск ПОСЛЕ v2: сид системных TABLE-полей в v2 не должен блокироваться
// наличием 'urgency' (иначе дефолтный набор остался бы невидимым).
// ---------------------------------------------------------------------------

function migrateV8() {
  const migrated = [];

  // task.urgency: ALTER, если колонки ещё нет.
  const taskCols = tableColumns('task');
  if (!taskCols.includes('urgency')) {
    db.exec('ALTER TABLE task ADD COLUMN urgency TEXT');
    migrated.push('task.urgency added');
  }

  // project_access: CREATE TABLE IF NOT EXISTS — идемпотентно само по себе.
  db.exec(migDdl(`
CREATE TABLE IF NOT EXISTS project_access (
  project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES ${USER_TABLE}(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);
  `));

  // Сид view_field для нового системного ключа 'urgency': тот же механизм,
  // что у custom-полей (createCustomField) — строка в TABLE (max+1), is_visible=1.
  // Запуск ПОСЛЕ migrateV2: на свежей БД к этому моменту TABLE-дефолты уже
  // сиидированы (v2 → v9), поэтому ветка hasTableDefaults всегда истинна.
  const seededNow = [];
  if (!db.prepare("SELECT COUNT(*) AS c FROM view_field WHERE view_type = 'TABLE' AND field_key = 'urgency'").get().c) {
    const hasTableDefaults = db.prepare("SELECT COUNT(*) AS c FROM view_field WHERE view_type = 'TABLE'").get().c > 0;
    if (hasTableDefaults) {
      const maxPos = db.prepare("SELECT COALESCE(MAX(position), 0) AS m FROM view_field WHERE view_type = 'TABLE'").get().m;
      db.prepare('INSERT INTO view_field (view_type, field_key, label, position, is_visible) VALUES (?, ?, ?, ?, 1)')
        .run('TABLE', 'urgency', SYSTEM_FIELDS.urgency, maxPos + 1);
      seededNow.push('TABLE');
    }
  }
  if (seededNow.length > 0) migrated.push(`view_field: urgency seeded into ${seededNow.join(', ')}`);

  if (migrated.length > 0) console.log(`[kanban] Migrations v8: ${migrated.join('; ')}`);
}
migrateV8();

// ---------------------------------------------------------------------------
// Помощники
// ---------------------------------------------------------------------------

const nowIso = () => new Date().toISOString();
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function asId(v) {
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  if (typeof v === 'string' && /^[0-9]+$/.test(v)) return Number(v);
  return null;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sendJson(res, status, payload, extraHeaders) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    // nosniff для API; no-store — ответы содержат данные/cookies.
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...(extraHeaders || {}),
  });
  res.end(body);
}

const badRequest = (res, msg) => sendJson(res, 400, { error: msg });
const notFound = (res, msg) => sendJson(res, 404, { error: msg });

// Цвета (проект/исполнитель/этап) — только hex, они попадают в inline style="".
// Серверная проверка делает гарантию независимой от экранирования во фронтенде.
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function validColor(v) {
  return typeof v === 'string' && HEX_COLOR_RE.test(v.trim());
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT_BYTES) {
        reject(httpError(413, 'Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      let parsed;
      try {
        parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return reject(httpError(400, 'Invalid JSON body'));
      }
      if (!isPlainObject(parsed)) return reject(httpError(400, 'Body must be a JSON object'));
      resolve(parsed);
    });
    req.on('error', (err) => reject(err));
  });
}

function getProject(id) {
  return db.prepare('SELECT id, name, color, position, archived, created_at FROM project WHERE id = ?').get(id);
}

const TASK_COLUMNS = 'id, project_id, title, stage, position, due_at, assignee, assignee_id, notes, urgency, created_at, updated_at';

// v9: доступ не-админов к проектам (project_access). Возвращает null, когда
// фильтр не применяется (bearer-токен — user_id нет, не скоупится осознанно;
// либо admin-сессия), либо user_id member-сессии — тогда видимы/доступны
// только проекты из project_access, а задачи «без проекта» не видны вовсе.
function sessionProjectFilter(auth) {
  const user = auth && auth.via === 'user' ? auth.user : null;
  if (!user || user.role === 'admin') return null;
  return user.id;
}

// v9: доступен ли проект (projectId === null → «без проекта») данному auth.
// Для сессий админа и токенов — всегда true; для member — только назначенные.
function canAccessProject(auth, projectId) {
  const memberUserId = sessionProjectFilter(auth);
  if (memberUserId === null) return true;
  if (projectId === null) return false; // null-project членам не виден
  return !!db.prepare('SELECT 1 FROM project_access WHERE user_id = ? AND project_id = ?').get(memberUserId, projectId);
}

function getTask(id) {
  return db.prepare(`SELECT ${TASK_COLUMNS} FROM task WHERE id = ?`).get(id);
}

// Custom-значения задачи: { "<field_id>": value } — value по типу поля.
function taskCustomValues(taskId) {
  const rows = db.prepare(`
    SELECT v.field_id, v.value_text, f.type
    FROM task_field_value v JOIN custom_field f ON f.id = v.field_id
    WHERE v.task_id = ? AND f.is_active = 1
  `).all(taskId);
  const out = {};
  for (const r of rows) out[String(r.field_id)] = parseStoredValue(r.type, r.value_text);
  return out;
}

function listTasks(req, res, params, searchParams, body, auth) {
  const projectParam = searchParams.get('project');
  const memberUserId = sessionProjectFilter(auth);
  let rows;
  if (projectParam !== null) {
    if (projectParam === 'none') {
      // Вид «Без проекта»: задачи с project_id IS NULL.
      // v9: member'ам задачи «без проекта» не видны (нет project-доступа).
      if (memberUserId !== null) {
        sendJson(res, 200, []);
        return;
      }
      rows = db.prepare(`SELECT ${TASK_COLUMNS} FROM task WHERE project_id IS NULL ORDER BY position, id`).all();
    } else {
      const pid = asId(projectParam);
      if (pid === null) {
        badRequest(res, 'Parameter "project" must be a project id or "none"');
        return;
      }
      if (!getProject(pid)) {
        notFound(res, `Project ${pid} not found`);
        return;
      }
      // v9: чужой для member проект → пусто (не палим существование 404-м только
      // для единичного task — здесь список просто не должен содержать чужих задач).
      if (memberUserId !== null && !canAccessProject(auth, pid)) {
        sendJson(res, 200, []);
        return;
      }
      rows = db.prepare(`SELECT ${TASK_COLUMNS} FROM task WHERE project_id = ? ORDER BY position, id`).all(pid);
    }
  } else if (memberUserId !== null) {
    rows = db.prepare(`
      SELECT ${TASK_COLUMNS} FROM task
      WHERE project_id IS NOT NULL
        AND project_id IN (SELECT project_id FROM project_access WHERE user_id = ?)
      ORDER BY position, id
    `).all(memberUserId);
  } else {
    rows = db.prepare(`SELECT ${TASK_COLUMNS} FROM task ORDER BY position, id`).all();
  }
  sendJson(res, 200, rows.map((t) => ({ ...t, custom: taskCustomValues(t.id) })));
}

const maxProjectPosition = () => db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM project').get().m;
const maxTaskPosition = (projectId, stage) =>
  db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM task WHERE project_id IS ? AND stage = ?').get(projectId, stage).m;
const maxMemberPosition = () => db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM member').get().m;
const maxCustomFieldPosition = () => db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM custom_field').get().m;

// ---------------------------------------------------------------------------
// Аудит (v3): пишем мутации; actor = 'user' | 'token:<name>'
// ---------------------------------------------------------------------------

function audit(actor, action, entity, entityId, detail) {
  try {
    db.prepare('INSERT INTO audit_log (at, actor, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?, ?)')
      .run(nowIso(), String(actor || 'user'), String(action), entity || null,
        entityId === undefined || entityId === null ? null : String(entityId),
        detail === undefined || detail === null ? null : JSON.stringify(detail).slice(0, 2000));
  } catch (err) {
    console.error('[kanban] Audit write failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Управление API-токенами (v3) — только из сессии человека
// ---------------------------------------------------------------------------

// Ответ создания: name, prefix, scopes, token (ОДИН раз — потом только хеш в БД).
function createApiToken(req, res, params, query, body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    badRequest(res, 'Field "name" is required');
    return;
  }
  if (name.length > 100) {
    badRequest(res, 'Field "name" is too long (max 100)');
    return;
  }
  const scopeRaw = body.scopes === undefined ? 'write' : body.scopes;
  const scopes = Array.isArray(scopeRaw)
    ? scopeRaw.map((s) => String(s).trim()).filter(Boolean)
    : String(scopeRaw).split(',').map((s) => s.trim()).filter(Boolean);
  const bad = scopes.find((s) => !TOKEN_SCOPES.includes(s));
  if (scopes.length === 0 || bad) {
    badRequest(res, `Invalid scopes "${String(body.scopes)}". Allowed: ${TOKEN_SCOPES.join(', ')}`);
    return;
  }
  if (body.expires_at !== undefined && body.expires_at !== null) {
    if (typeof body.expires_at !== 'string' || Number.isNaN(Date.parse(body.expires_at))) {
      badRequest(res, 'Field "expires_at" must be an ISO date or null');
      return;
    }
  }
  const raw = TOKEN_PREFIX + crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const prefix = raw.slice(0, TOKEN_PREFIX.length + 8);
  const ts = nowIso();
  const info = db.prepare(`
    INSERT INTO api_token (name, token_hash, prefix, scopes, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, hashToken(raw), prefix, scopes.join(','), ts,
    body.expires_at || null);
  audit('user', 'token.create', 'api_token', Number(info.lastInsertRowid), { name, scopes });
  sendJson(res, 200, {
    id: Number(info.lastInsertRowid),
    name,
    prefix,
    scopes,
    created_at: ts,
    expires_at: body.expires_at || null,
    token: raw, // ПОСЛЕДНИЙ раз, когда полный токен виден
  });
}

function listApiTokens(req, res) {
  const rows = db.prepare(`
    SELECT id, name, prefix, scopes, created_at, last_used_at, expires_at, revoked_at
    FROM api_token ORDER BY id
  `).all();
  sendJson(res, 200, rows);
}

function revokeApiToken(req, res, params) {
  const id = asId(params.id);
  const row = id === null ? null : db.prepare('SELECT id, name FROM api_token WHERE id = ?').get(id);
  if (!row) {
    notFound(res, `Token ${params.id} not found`);
    return;
  }
  db.prepare('UPDATE api_token SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(nowIso(), row.id);
  audit('user', 'token.revoke', 'api_token', row.id, { name: row.name });
  sendJson(res, 200, { ok: true, revoked: row.id });
}

function deleteApiToken(req, res, params) {
  const id = asId(params.id);
  const row = id === null ? null : db.prepare('SELECT id, name FROM api_token WHERE id = ?').get(id);
  if (!row) {
    notFound(res, `Token ${params.id} not found`);
    return;
  }
  db.prepare('DELETE FROM api_token WHERE id = ?').run(row.id);
  audit('user', 'token.delete', 'api_token', row.id, { name: row.name });
  sendJson(res, 200, { ok: true, deleted: row.id });
}

function listAudit(req, res, params, searchParams) {
  const limitRaw = Number.parseInt(searchParams.get('limit') || '200', 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 200;
  const rows = db.prepare('SELECT id, at, actor, action, entity, entity_id, detail FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
  sendJson(res, 200, rows.map((r) => ({ ...r, detail: r.detail ? JSON.parse(r.detail) : null })));
}

function listSessions(req, res) {
  const rows = db.prepare(`
    SELECT s.sid, s.created_at, s.expires_at, u.username
    FROM session s LEFT JOIN ${USER_TABLE} u ON u.id = s.user_id
    ORDER BY s.created_at
  `).all();
  const now = Date.now();
  sendJson(res, 200, rows.map((r) => ({
    id: r.sid.slice(0, 6) + '…',
    username: r.username || null,
    created_at: r.created_at,
    expires_at: r.expires_at,
    active: Date.parse(r.expires_at) > now,
  })));
}

// ---------------------------------------------------------------------------
// Пользователи (учётные записи) — CRUD, только для роли admin.
// Исполнители (member) — отдельная сущность: подпись на карточках, без входа.
// ---------------------------------------------------------------------------

function listUsers(req, res) {
  const rows = db.prepare('SELECT id, username, display_name, role, created_at, last_login_at FROM kbar_user ORDER BY id').all();
  sendJson(res, 200, rows.map(userPublic));
}

function createUser(req, res, params, query, body, auth) {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!USERNAME_RE.test(username)) {
    badRequest(res, 'Username: 2–32 chars, latin letters/digits/._-, starts with a letter or digit');
    return;
  }
  if (getUserByUsername(username)) {
    badRequest(res, `Username "${username}" is taken`);
    return;
  }
  const pwErr = validatePassword(body.password);
  if (pwErr) {
    badRequest(res, pwErr);
    return;
  }
  const role = body.role === undefined ? 'member' : body.role;
  if (!USER_ROLES.includes(role)) {
    badRequest(res, `Invalid role "${String(role)}". Allowed: ${USER_ROLES.join(', ')}`);
    return;
  }
  const display = typeof body.display_name === 'string' && body.display_name.trim()
    ? body.display_name.trim().slice(0, 100)
    : null;
  const rec = makePasswordRecord(body.password);
  const info = db.prepare(`
    INSERT INTO ${USER_TABLE} (username, display_name, role, password_salt, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(username, display, role, rec.salt, rec.hash, nowIso());
  const uid = Number(info.lastInsertRowid);
  audit(actorOf(auth), 'user.create', 'kbar_user', uid, { username, role });
  sendJson(res, 200, userPublic(getUserById(uid)));
}

function patchUser(req, res, params, query, body, auth) {
  const id = asId(params.id);
  const target = id === null ? null : db.prepare('SELECT * FROM kbar_user WHERE id = ?').get(id);
  if (!target) {
    notFound(res, `User ${params.id} not found`);
    return;
  }
  const self = auth.user && auth.user.id === target.id;
  const sets = {};
  if (body.display_name !== undefined) {
    if (body.display_name === null) sets.display_name = null;
    else if (typeof body.display_name === 'string' && body.display_name.trim()) sets.display_name = body.display_name.trim().slice(0, 100);
    else { badRequest(res, 'Field "display_name" must be a non-empty string or null'); return; }
  }
  if (body.password !== undefined) {
    const pwErr = validatePassword(body.password);
    if (pwErr) { badRequest(res, pwErr); return; }
    const rec = makePasswordRecord(body.password);
    sets.password_salt = rec.salt;
    sets.password_hash = rec.hash;
    // После смены пароля — выкидываем все другие сессии этой учётки.
    db.prepare('DELETE FROM session WHERE user_id = ? AND sid != ?').run(target.id, auth.sid || '');
  }
  if (body.role !== undefined) {
    if (!USER_ROLES.includes(body.role)) {
      badRequest(res, `Invalid role "${String(body.role)}". Allowed: ${USER_ROLES.join(', ')}`);
      return;
    }
    if (target.role === 'admin' && body.role !== 'admin' && countAdmins() <= 1) {
      badRequest(res, 'Cannot demote the last administrator');
      return;
    }
    sets.role = body.role;
  }
  const keys = Object.keys(sets);
  if (keys.length === 0) {
    badRequest(res, 'Nothing to update (display_name, password, role)');
    return;
  }
  if (target.id === auth.user?.id && sets.role && sets.role !== 'admin' && countAdmins() - (target.role === 'admin' ? 1 : 0) <= 0) {
    badRequest(res, 'Cannot demote yourself as the last administrator');
    return;
  }
  const sql = `UPDATE kbar_user SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...keys.map((k) => sets[k]), target.id);
  audit(actorOf(auth), 'user.update', 'kbar_user', target.id, { username: target.username, fields: keys.filter((k) => !k.startsWith('password')) });
  sendJson(res, 200, userPublic(getUserById(target.id)));
}

function deleteUser(req, res, params, query, body, auth) {
  const id = asId(params.id);
  const target = id === null ? null : db.prepare('SELECT * FROM kbar_user WHERE id = ?').get(id);
  if (!target) {
    notFound(res, `User ${params.id} not found`);
    return;
  }
  if (target.id === auth.user?.id) {
    badRequest(res, 'Cannot delete your own account');
    return;
  }
  if (target.role === 'admin' && countAdmins() <= 1) {
    badRequest(res, 'Cannot delete the last administrator');
    return;
  }
  db.prepare('DELETE FROM session WHERE user_id = ?').run(target.id);
  db.prepare('DELETE FROM kbar_user WHERE id = ?').run(target.id);
  audit(actorOf(auth), 'user.delete', 'kbar_user', target.id, { username: target.username });
  sendJson(res, 200, { ok: true, deleted: target.id });
}

function actorOf(auth) {
  return auth && auth.user ? 'user:' + auth.user.username : 'user';
}

function revokeSession(req, res, params) {
  const prefix = String(params.sid || '');
  if (prefix.length < 6) {
    badRequest(res, 'Expected a sid prefix (at least 6 characters)');
    return;
  }
  // Экранируем LIKE-wildcards (% _) — иначе префикс «______» (6 подчёркиваний)
  // совпал бы с любой сессией и отозвал ВСЕ сессии инстанса.
  const like = prefix.replace(/[\\%_]/g, (ch) => '\\' + ch);
  const rows = db.prepare("SELECT sid FROM session WHERE sid LIKE ? || '%' ESCAPE '\\'").all(like);
  for (const r of rows) db.prepare('DELETE FROM session WHERE sid = ?').run(r.sid);
  sendJson(res, 200, { ok: true, revoked: rows.length });
}

function handleLogin(req, res, params, query, body) {
  // Rate-limit (allowLoginAttempt) уже проверен в handleApi ДО чтения тела.
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    badRequest(res, 'Expected {"username": "...", "password": "..."}');
    return;
  }
  const row = getUserByUsername(username);
  const ip = req.socket.remoteAddress || 'unknown';
  if (!row) {
    // Неизвестный пользователь — прогоняем parity-скорость scrypt по dummy-записи,
    // чтобы время ответа не выдавало существование имени (timing-энумерация).
    dummyPasswordRecord();
    audit('anonymous', 'login.fail', 'session', null, { ip: req.socket.remoteAddress || 'unknown', username: username.slice(0, 32) });
    sendJson(res, 401, { error: 'Invalid username or password' });
    return;
  }
  if (!verifyUserPassword(row, password)) {
    audit('anonymous', 'login.fail', 'session', null, { ip: req.socket.remoteAddress || 'unknown', username: username.slice(0, 32) });
    sendJson(res, 401, { error: 'Invalid username or password' });
    return;
  }
  audit('user:' + row.username, 'login.ok', 'session', row.id, { ip });
  // Ротация sid: новая сессия на каждый вход (защита от session fixation).
  const sid = createSession(row.id);
  db.prepare('UPDATE kbar_user SET last_login_at = ? WHERE id = ?').run(nowIso(), row.id);
  sendJson(res, 200, { ok: true, user: userPublic(row) }, { 'Set-Cookie': sessionCookie(sid) });
}

function handleLogout(req, res, params, query, body, auth) {
  db.prepare('DELETE FROM session WHERE sid = ?').run(auth.sid);
  sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + COOKIE_SECURE_ATTRIBUTE });
}

// PATCH /api/me/password {current_password, password} — смена СВОЕГО пароля
// (любая роль; не путать с admin-ресетом через /api/users/:id).
function handleMePassword(req, res, params, query, body, auth) {
  if (!auth.user) {
    sendJson(res, 403, { error: 'Password change requires a user session (cookie), not a token' });
    return;
  }
  const row = db.prepare('SELECT * FROM kbar_user WHERE id = ?').get(auth.user.id);
  if (!row) {
    notFound(res, 'User not found');
    return;
  }
  const current = typeof body.current_password === 'string' ? body.current_password : '';
  if (!current || !verifyUserPassword(row, current)) {
    audit(actorOf(auth), 'user.password_change_denied', 'kbar_user', row.id, null);
    sendJson(res, 403, { error: 'Current password is incorrect' });
    return;
  }
  const pwErr = validatePassword(body.password);
  if (pwErr) {
    badRequest(res, pwErr);
    return;
  }
  const rec = makePasswordRecord(body.password);
  db.prepare('UPDATE kbar_user SET password_salt = ?, password_hash = ? WHERE id = ?')
    .run(rec.salt, rec.hash, row.id);
  // Все прочие сессии этой учётки выходят; текущая остаётся живой.
  db.prepare('DELETE FROM session WHERE user_id = ? AND sid != ?').run(row.id, auth.sid || '');
  audit(actorOf(auth), 'user.password_change', 'kbar_user', row.id, null);
  sendJson(res, 200, { ok: true });
}

// GET /api/me — публичный: сообщает, требуется ли настройка, и кто вошёл.
function handleMe(req, res, params, query, body, auth) {
  if (isSetupMode()) {
    sendJson(res, 200, { setup_required: true, engine: DIALECT, setup_token_required: !!SETUP_TOKEN });
    return;
  }
  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Unauthorized', setup_required: false });
    return;
  }
  // v9: user содержит role (нужно фронту и проверкам доступа на клиенте).
  sendJson(res, 200, {
    setup_required: false,
    engine: DIALECT,
    user: session.user || (auth && auth.user) || null,
  });
}

// ---------------------------------------------------------------------------
// Первичная настройка (setup): доступна только пока пользователей нет.
// Состояние режима отдаёт GET /api/me (handleMe); здесь только создание админа.
// ---------------------------------------------------------------------------

// POST /api/setup {username, password, display_name?, setup_token?} → admin.
function handleSetup(req, res, params, query, body) {
  const ip = req.socket.remoteAddress || 'unknown';
  if (!isSetupMode()) {
    sendJson(res, 403, { error: 'Setup is already completed' });
    return;
  }
  if (!allowLoginAttempt(ip)) {
    sendJson(res, 429, { error: 'Too many attempts. Wait a minute.' });
    return;
  }
  if (SETUP_TOKEN) {
    const given = typeof body.setup_token === 'string' ? body.setup_token : '';
    // timingSafeEqual бросает исключение при разной длине буферов; для
    // сравнения строк разной длины окутываем обе стороны в sha256 (32 байта
    // фиксированной длины, без потери timing-стойкости).
    let tokenOk = false;
    try {
      tokenOk = given.length > 0 && given.length <= 200 && crypto.timingSafeEqual(
        crypto.createHash('sha256').update(given, 'utf8').digest(),
        crypto.createHash('sha256').update(SETUP_TOKEN, 'utf8').digest(),
      );
    } catch { /* malformed input → not ok */ }
    if (!tokenOk) {
      audit('anonymous', 'setup.fail', 'session', null, { ip, reason: 'bad setup token' });
      sendJson(res, 403, { error: 'Invalid setup token (KANBAN_SETUP_TOKEN)' });
      return;
    }
  }
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!USERNAME_RE.test(username)) {
    badRequest(res, 'Username: 2–32 chars, latin letters/digits/._-, starts with a letter or digit');
    return;
  }
  if (getUserByUsername(username)) {
    badRequest(res, `Username "${username}" is taken`);
    return;
  }
  const pwErr = validatePassword(password);
  if (pwErr) {
    badRequest(res, pwErr);
    return;
  }
  const display = typeof body.display_name === 'string' && body.display_name.trim()
    ? body.display_name.trim().slice(0, 100)
    : null;
  // Транзакция закрывает гонку двух параллельных setup-запросов (каждый видел
  // бы пустую users-таблицу и создал бы своего админа): повторная проверка
  // условия «пользователей нет» выполняется уже внутри транзакции.
  db.exec('BEGIN IMMEDIATE');
  try {
    if (!isSetupMode()) {
      db.exec('ROLLBACK');
      sendJson(res, 403, { error: 'Setup is already completed' });
      return;
    }
    const rec = makePasswordRecord(password);
    const ts = nowIso();
    const info = db.prepare(`
      INSERT INTO ${USER_TABLE} (username, display_name, role, password_salt, password_hash, created_at)
      VALUES (?, ?, 'admin', ?, ?, ?)
    `).run(username, display, rec.salt, rec.hash, ts);
    const uid = Number(info.lastInsertRowid);
    audit('setup', 'user.create', 'kbar_user', uid, { username, role: 'admin' });
    audit('setup', 'setup.completed', 'instance', null, { ip, username });
    console.log(`[kanban] Setup completed: administrator "${username}" created`);
    const sid = createSession(uid);
    db.exec('COMMIT');
    sendJson(res, 200, { ok: true, user: { id: uid, username, display_name: display, role: 'admin' } },
      { 'Set-Cookie': sessionCookie(sid) });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 200) return 'Password must be at most 200 characters';
  // Дружелюбная, но не пустышка-политика: не только цифры, не только повтор.
  if (/^\d+$/.test(password)) return 'Password cannot consist of digits only';
  if (/^(.)\1+$/.test(password)) return 'Password cannot be a single repeated character';
  const classes = /[a-z]/.test(password) + /[A-Z]/.test(password) + /\d/.test(password) + /[^A-Za-z0-9]/.test(password);
  if (password.length < 12 && classes < 2) return 'Password needs at least 2 character classes (letters, digits, symbols) or 12+ characters';
  return null;
}

// ---------------------------------------------------------------------------
// Обработчики API (все ответы JSON; ошибки {error} + 400/404/500)
// ---------------------------------------------------------------------------

// v9: id проектов, назначенных пользователю в project_access.
function accessibleProjectIds(userId) {
  return db.prepare('SELECT project_id FROM project_access WHERE user_id = ?').all(userId)
    .map((r) => r.project_id);
}

function listProjects(req, res, params, query, body, auth) {
  // дефолт: только активные (archived=0); ?archived=1 → только архивные; ?archived=all → все
  const q = String(query && query.get ? query.get('archived') || '0' : '0');
  let where = '';
  if (q === '0' || q === '1') where = ' WHERE archived = ' + (q === '1' ? '1' : '0');
  else if (q !== 'all') where = ' WHERE archived = 0';
  // v9: member-сессия видит только назначенные ей проекты (project_access);
  // админ-сессии и bearer-токены — все (токены не скоупятся — осознанно).
  const memberUserId = sessionProjectFilter(auth);
  let sql = 'SELECT id, name, color, position, archived, created_at FROM project';
  const args = [];
  if (memberUserId !== null) {
    const parts = [];
    if (where) {
      parts.push(where.trim().replace(/^WHERE\s+/i, ''));
    }
    parts.push('id IN (SELECT project_id FROM project_access WHERE user_id = ?)');
    args.push(memberUserId);
    sql += ' WHERE ' + parts.join(' AND ');
  } else {
    sql += where;
  }
  sql += ' ORDER BY position, id';
  const rows = db.prepare(sql).all(...args);
  sendJson(res, 200, rows);
}

function createProject(req, res, params, query, body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    badRequest(res, 'Field "name" is required');
    return;
  }
  if (name.length > 200) {
    badRequest(res, 'Field "name" is too long (max 200)');
    return;
  }
  let color;
  if (typeof body.color === 'string' && body.color.trim()) {
    if (!validColor(body.color)) {
      badRequest(res, 'Field "color" must be a hex color like #4662d5');
      return;
    }
    color = body.color.trim();
  } else {
    const count = Number(db.prepare('SELECT COUNT(*) AS c FROM project').get().c);
    color = PALETTE[count % PALETTE.length];
  }
  const info = db.prepare('INSERT INTO project (name, color, position, created_at) VALUES (?, ?, ?, ?)')
    .run(name, color, maxProjectPosition() + 1, nowIso());
  sendJson(res, 200, getProject(Number(info.lastInsertRowid)));
}

function patchProject(req, res, params, query, body) {
  const id = asId(params.id);
  const project = id === null ? null : getProject(id);
  if (!project) {
    notFound(res, `Project ${params.id} not found`);
    return;
  }
  const sets = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      badRequest(res, 'Field "name" must be a non-empty string');
      return;
    }
    sets.name = body.name.trim();
  }
  if (body.color !== undefined) {
    if (typeof body.color !== 'string' || !validColor(body.color)) {
      badRequest(res, 'Field "color" must be a hex color like #4662d5');
      return;
    }
    sets.color = body.color.trim();
  }
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) {
      badRequest(res, 'Field "position" must be a number');
      return;
    }
    sets.position = body.position;
  }
  if (body.archived !== undefined) {
    if (typeof body.archived !== 'boolean') {
      badRequest(res, 'Field "archived" must be a boolean');
      return;
    }
    sets.archived = body.archived ? 1 : 0;
  }
  const keys = Object.keys(sets);
  if (keys.length === 0) {
    badRequest(res, 'Nothing to update (name, color, position, archived)');
    return;
  }
  const sql = `UPDATE project SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...keys.map((k) => sets[k]), project.id);
  sendJson(res, 200, getProject(project.id));
}

function deleteProject(req, res, params) {
  const id = asId(params.id);
  const project = id === null ? null : getProject(id);
  if (!project) {
    notFound(res, `Project ${params.id} not found`);
    return;
  }
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM task WHERE project_id = ?').run(project.id); // каскад (страховка к ON DELETE CASCADE)
    db.prepare('DELETE FROM project WHERE id = ?').run(project.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  sendJson(res, 200, { ok: true, deleted: project.id });
}

// v9: GET /api/tasks/:id — доступ member'а к чужому проекту даёт 404.
function getTaskHandler(req, res, params, query, body, auth) {
  const id = asId(params.id);
  const task = id === null ? null : getTask(id);
  if (!task || !canAccessProject(auth, task.project_id)) {
    notFound(res, `Task ${params.id} not found`);
    return;
  }
  sendJson(res, 200, { ...task, custom: taskCustomValues(task.id) });
}

// v9: доступ не-админов к проектам — GET/PUT /api/projects/:id/access.
// Только admin-сессия (bearer-токенам отказ осознанно: у токенов нет роли).
function requireAdminSession(req, res, auth) {
  if (!auth || auth.via !== 'user' || !auth.user || auth.user.role !== 'admin') {
    sendJson(res, 403, { error: 'Administrator role required' });
    return false;
  }
  return true;
}

function getProjectAccess(req, res, params, query, body, auth) {
  if (!requireAdminSession(req, res, auth)) return;
  const id = asId(params.id);
  if (id === null || !getProject(id)) {
    notFound(res, `Project ${params.id} not found`);
    return;
  }
  const user_ids = db.prepare('SELECT user_id FROM project_access WHERE project_id = ? ORDER BY user_id').all(id)
    .map((r) => r.user_id);
  sendJson(res, 200, { user_ids });
}

function putProjectAccess(req, res, params, query, body, auth) {
  if (!requireAdminSession(req, res, auth)) return;
  const id = asId(params.id);
  if (id === null || !getProject(id)) {
    notFound(res, `Project ${params.id} not found`);
    return;
  }
  if (!Array.isArray(body.user_ids)) {
    badRequest(res, 'Expected {"user_ids": [integer, ...]}');
    return;
  }
  const ids = [];
  for (const raw of body.user_ids) {
    const uid = asId(raw);
    if (uid === null) {
      badRequest(res, 'Every entry in "user_ids" must be a user id');
      return;
    }
    if (!ids.includes(uid)) ids.push(uid);
  }
  const placeholders = ids.map(() => '?').join(', ');
  const existing = ids.length > 0
    ? db.prepare(`SELECT id FROM ${USER_TABLE} WHERE id IN (${placeholders})`).all(...ids).map((r) => r.id)
    : [];
  const missing = ids.filter((uid) => !existing.includes(uid));
  if (missing.length > 0) {
    notFound(res, `User ${missing.join(', ')} not found`);
    return;
  }
  // replace-set: одна транзакция — чистим старое, вставляем новое.
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM project_access WHERE project_id = ?').run(id);
    const ins = db.prepare('INSERT INTO project_access (project_id, user_id) VALUES (?, ?)');
    for (const uid of ids) ins.run(id, uid);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  const user_ids = db.prepare('SELECT user_id FROM project_access WHERE project_id = ? ORDER BY user_id').all(id)
    .map((r) => r.user_id);
  sendJson(res, 200, { user_ids });
}

function createTask(req, res, params, query, body, auth) {
  const out = createTaskCore(body, auth);
  sendJson(res, out.status, out.payload);
}

function patchTask(req, res, params, query, body, auth) {
  const id = asId(params.id);
  const out = patchTaskCore(id, body, auth);
  sendJson(res, out.status, out.payload);
}

function deleteTask(req, res, params, query, body, auth) {
  const id = params.id;
  const out = deleteTaskCore(id, auth);
  sendJson(res, out.status, out.payload);
}

// POST /api/tasks/:id/move {stage, before_id?|after_id?} → вычислить position.
//   after_id = X  → карточка встаёт сразу ПОСЛЕ X: position = midpoint(X, следующий за X)
//   before_id = X → карточка встаёт сразу ПЕРЕД X: position = midpoint(предыдущий, X)
//   без соседей   → в конец колонки: position = max+1 (1, если колонка пуста)
function moveTask(req, res, params, query, body, auth) {
  const id = asId(params.id);
  const out = moveTaskCore(id, body, auth);
  sendJson(res, out.status, out.payload);
}

// ---------------------------------------------------------------------------
// Пользовательские поля: сериализация/валидация значений по типу
// ---------------------------------------------------------------------------

// value_text (SQLite TEXT) → значение для JSON (по типу поля).
function parseStoredValue(type, text) {
  if (text === null || text === undefined) return null;
  if (type === 'NUMBER') {
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }
  if (type === 'CHECKBOX') return text === '1';
  return text; // TEXT и DATE хранятся/отдаются как строки
}

// Валидация значения custom-поля по его типу. Возвращает {value} (строка для
// value_text) или {error}. null очищает значение.
function validateCustomValue(field, value) {
  if (value === null) return { value: null }; // очистить значение
  switch (field.type) {
    case 'NUMBER': {
      // Браузерные input.value всегда строки — принимаем и число, и числовую строку.
      const n = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value.trim()) : NaN);
      if (!Number.isFinite(n)) {
        return { error: `expected a number, got ${typeof value}` };
      }
      return { value: String(n) };
    }
    case 'CHECKBOX': {
      // Допустимо: true/false, '1'/'0', 'true'/'false', '' (снять).
      if (typeof value === 'boolean') return { value: value ? '1' : '0' };
      if (value === '1' || value === 'true') return { value: '1' };
      if (value === '0' || value === 'false' || value === '') return { value: '0' };
      return { error: `expected a boolean, got ${typeof value}` };
    }
    case 'DATE':
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        return { error: 'expected a date in YYYY-MM-DD format' };
      }
      return { value };
    case 'TEXT':
    default:
      if (typeof value !== 'string') {
        return { error: `expected a string, got ${typeof value}` };
      }
      if (value.length > CUSTOM_TEXT_MAX) {
        return { error: `string longer than ${CUSTOM_TEXT_MAX} characters` };
      }
      return { value };
  }
}

// ---------------------------------------------------------------------------
// Исполнители (member) — CONTRACT-v2
// ---------------------------------------------------------------------------

function getMember(id) {
  return db.prepare('SELECT id, name, color, initials, position, created_at FROM member WHERE id = ?').get(id);
}

function memberInitials(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map((w) => w[0].toUpperCase()).slice(0, 2).join('');
}

function listMembers(req, res) {
  sendJson(res, 200, db.prepare('SELECT id, name, color, initials, position, created_at FROM member ORDER BY position, id').all());
}

function createMember(req, res, params, query, body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    badRequest(res, 'Field "name" is required');
    return;
  }
  if (name.length > 200) {
    badRequest(res, 'Field "name" is too long (max 200)');
    return;
  }
  let color;
  if (typeof body.color === 'string' && body.color.trim()) {
    if (!validColor(body.color)) {
      badRequest(res, 'Field "color" must be a hex color like #4662d5');
      return;
    }
    color = body.color.trim();
  } else {
    const count = Number(db.prepare('SELECT COUNT(*) AS c FROM member').get().c);
    color = MEMBER_COLORS[count % MEMBER_COLORS.length];
  }
  const info = db.prepare('INSERT INTO member (name, color, initials, position, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name, color, memberInitials(name), maxMemberPosition() + 1, nowIso());
  sendJson(res, 200, getMember(Number(info.lastInsertRowid)));
}

function patchMember(req, res, params, query, body) {
  const id = asId(params.id);
  const member = id === null ? null : getMember(id);
  if (!member) {
    notFound(res, `Assignee ${params.id} not found`);
    return;
  }
  const sets = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      badRequest(res, 'Field "name" must be a non-empty string');
      return;
    }
    sets.name = body.name.trim();
  }
  if (body.color !== undefined) {
    if (typeof body.color !== 'string' || !validColor(body.color)) {
      badRequest(res, 'Field "color" must be a hex color like #4662d5');
      return;
    }
    sets.color = body.color.trim();
  }
  if (body.initials !== undefined) {
    if (body.initials === null) {
      sets.initials = null;
    } else if (typeof body.initials === 'string' && body.initials.trim()) {
      sets.initials = body.initials.trim().slice(0, 4);
    } else {
      badRequest(res, 'Field "initials" must be a string or null');
      return;
    }
  }
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) {
      badRequest(res, 'Field "position" must be a number');
      return;
    }
    sets.position = body.position;
  }
  const keys = Object.keys(sets);
  if (keys.length === 0) {
    badRequest(res, 'Nothing to update (name, color, initials, position)');
    return;
  }
  if (sets.name !== undefined && body.initials === undefined) sets.initials = memberInitials(sets.name);
  const sql = `UPDATE member SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...keys.map((k) => sets[k]), member.id);
  sendJson(res, 200, getMember(member.id));
}

function deleteMember(req, res, params) {
  const id = asId(params.id);
  const member = id === null ? null : getMember(id);
  if (!member) {
    notFound(res, `Assignee ${params.id} not found`);
    return;
  }
  // ON DELETE SET NULL + страховка явным UPDATE до удаления.
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE task SET assignee_id = NULL WHERE assignee_id = ?').run(member.id);
    db.prepare('DELETE FROM member WHERE id = ?').run(member.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  sendJson(res, 200, { ok: true, deleted: member.id });
}

// ---------------------------------------------------------------------------
// Пользовательские поля (custom_field) — CONTRACT-v2
// ---------------------------------------------------------------------------

function getCustomField(id) {
  return db.prepare('SELECT id, name, type, position, is_active FROM custom_field WHERE id = ?').get(id);
}

function listCustomFields(req, res) {
  sendJson(res, 200, db.prepare('SELECT id, name, type, position, is_active FROM custom_field ORDER BY position, id').all());
}

function createCustomField(req, res, params, query, body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    badRequest(res, 'Field "name" is required');
    return;
  }
  if (name.length > 200) {
    badRequest(res, 'Field "name" is too long (max 200)');
    return;
  }
  let type = 'TEXT';
  if (body.type !== undefined && body.type !== null) {
    if (!FIELD_TYPES.includes(body.type)) {
      badRequest(res, `Invalid type "${String(body.type)}". Allowed: ${FIELD_TYPES.join(', ')}`);
      return;
    }
    type = body.type;
  }
  const info = db.prepare('INSERT INTO custom_field (name, type, position, is_active) VALUES (?, ?, ?, 1)')
    .run(name, type, maxCustomFieldPosition() + 1);
  // Новый custom-филд сразу появляется в настройках обоих представлений (в конец списка).
  for (const viewType of VIEW_TYPES) {
    const maxPos = db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM view_field WHERE view_type = ?').get(viewType).m;
    db.prepare('INSERT INTO view_field (view_type, field_key, label, position, is_visible) VALUES (?, ?, ?, ?, 1)')
      .run(viewType, `custom:${info.lastInsertRowid}`, name, maxPos + 1);
  }
  sendJson(res, 200, getCustomField(Number(info.lastInsertRowid)));
}

function patchCustomField(req, res, params, query, body) {
  const id = asId(params.id);
  const field = id === null ? null : getCustomField(id);
  if (!field) {
    notFound(res, `Custom field ${params.id} not found`);
    return;
  }
  const sets = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      badRequest(res, 'Field "name" must be a non-empty string');
      return;
    }
    sets.name = body.name.trim();
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') {
      badRequest(res, 'Field "is_active" must be a boolean');
      return;
    }
    sets.is_active = body.is_active ? 1 : 0;
  }
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) {
      badRequest(res, 'Field "position" must be a number');
      return;
    }
    sets.position = body.position;
  }
  const keys = Object.keys(sets);
  if (keys.length === 0) {
    badRequest(res, 'Nothing to update (name, is_active, position)');
    return;
  }
  const sql = `UPDATE custom_field SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...keys.map((k) => sets[k]), field.id);
  if (sets.name !== undefined) {
    // Синхронизируем label в view_field, если label не переопределён пользователем.
    const vf = db.prepare("SELECT id FROM view_field WHERE field_key = ? AND (label IS NULL OR label = ?)").all(`custom:${field.id}`, field.name);
    if (vf.length > 0) {
      db.prepare('UPDATE view_field SET label = ? WHERE field_key = ? AND (label IS NULL OR label = ?)')
        .run(sets.name, `custom:${field.id}`, field.name);
    }
  }
  sendJson(res, 200, getCustomField(field.id));
}

function deleteCustomField(req, res, params) {
  const id = asId(params.id);
  const field = id === null ? null : getCustomField(id);
  if (!field) {
    notFound(res, `Custom field ${params.id} not found`);
    return;
  }
  // Значения чистятся каскадом (ON DELETE CASCADE) + страховка явным DELETE.
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM task_field_value WHERE field_id = ?').run(field.id);
    db.prepare('DELETE FROM view_field WHERE field_key = ?').run(`custom:${field.id}`);
    db.prepare('DELETE FROM custom_field WHERE id = ?').run(field.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  sendJson(res, 200, { ok: true, deleted: field.id });
}

// ---------------------------------------------------------------------------
// Настройки представлений (view_field) — CONTRACT-v2
// ---------------------------------------------------------------------------

function listViewFields(req, res, params, searchParams) {
  const view = searchParams.get('view');
  if (view === null) {
    sendJson(res, 200, db.prepare('SELECT id, view_type, field_key, label, position, is_visible FROM view_field ORDER BY view_type, position, id').all());
    return;
  }
  if (!VIEW_TYPES.includes(view)) {
    badRequest(res, `Invalid view "${view}". Allowed: ${VIEW_TYPES.join(', ')}`);
    return;
  }
  sendJson(res, 200, db.prepare('SELECT id, view_type, field_key, label, position, is_visible FROM view_field WHERE view_type = ? ORDER BY position, id').all(view));
}

function patchViewFields(req, res, params, query, body) {
  if (!Array.isArray(body.items)) {
    badRequest(res, 'Expected {"items": [{id, position?, is_visible?, label?}, ...]}');
    return;
  }
  const updates = [];
  for (const item of body.items) {
    if (!isPlainObject(item)) {
      badRequest(res, 'Every item in "items" must be an object');
      return;
    }
    const id = asId(item.id);
    if (id === null) {
      badRequest(res, 'Every item in "items" must carry a valid "id"');
      return;
    }
    const row = db.prepare('SELECT id, field_key, label FROM view_field WHERE id = ?').get(id);
    if (!row) {
      notFound(res, `view_field ${id} not found`);
      return;
    }
    const sets = {};
    if (item.position !== undefined) {
      if (typeof item.position !== 'number' || !Number.isFinite(item.position)) {
        badRequest(res, `view_field ${id}: "position" must be a number`);
        return;
      }
      sets.position = item.position;
    }
    if (item.is_visible !== undefined) {
      if (typeof item.is_visible !== 'boolean') {
        badRequest(res, `view_field ${id}: "is_visible" must be a boolean`);
        return;
      }
      sets.is_visible = item.is_visible ? 1 : 0;
    }
    if (item.label !== undefined) {
      if (item.label === null) {
        sets.label = SYSTEM_FIELDS[row.field_key] !== undefined ? SYSTEM_FIELDS[row.field_key] : null;
      } else if (typeof item.label === 'string' && item.label.trim()) {
        sets.label = item.label.trim().slice(0, 200);
      } else {
        badRequest(res, `view_field ${id}: "label" must be a non-empty string or null`);
        return;
      }
    }
    if (Object.keys(sets).length === 0) continue;
    updates.push({ id, sets });
  }
  db.exec('BEGIN');
  try {
    for (const { id, sets } of updates) {
      const sql = `UPDATE view_field SET ${Object.keys(sets).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...Object.keys(sets).map((k) => sets[k]), id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  sendJson(res, 200, { ok: true, updated: updates.length });
}

// ---------------------------------------------------------------------------
// Этапы (stage) — настройка пайплайна канбан-доски
// ---------------------------------------------------------------------------

function getStage(id) {
  return db.prepare('SELECT id, label, color, position, is_visible, is_done, created_at FROM stage WHERE id = ?').get(id);
}

function listStages(req, res) {
  sendJson(res, 200, listStageRows());
}

function stageToPayload(row) {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
    position: row.position,
    is_visible: !!row.is_visible,
    is_done: !!row.is_done,
  };
}

function createStage(req, res, params, query, body) {
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) { badRequest(res, 'Field "label" is required'); return; }
  if (label.length > 100) { badRequest(res, 'Field "label" is too long (max 100)'); return; }
  let id = typeof body.id === 'string' ? body.id.trim().toUpperCase() : '';
  if (!id) {
    // Транслит из label: латиница/цифры, остальное → '_'; пусто → 'STAGE_N'.
    const base = label.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
    id = base || null;
    if (id) {
      let n = 2;
      const exists = (v) => !!db.prepare('SELECT id FROM stage WHERE id = ?').get(v);
      while (exists(id)) id = base.slice(0, 24) + '_' + n++;
    } else {
      const n = db.prepare('SELECT COUNT(*) AS c FROM stage').get().c + 1;
      id = 'STAGE_' + n;
      while (db.prepare('SELECT id FROM stage WHERE id = ?').get(id)) id = 'STAGE_' + (++n);
    }
  } else if (!STAGE_ID_RE.test(id)) {
    badRequest(res, 'Field "id" — latin letters/digits/underscore, starts with a letter, 2-32 chars');
    return;
  } else if (db.prepare('SELECT id FROM stage WHERE id = ?').get(id)) {
    badRequest(res, `Stage "${id}" already exists`);
    return;
  }
  let color = typeof body.color === 'string' && body.color.trim() ? body.color.trim() : null;
  if (color && !validColor(color)) {
    badRequest(res, 'Field "color" must be a hex color like #4662d5');
    return;
  }
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM stage').get().m;
  const isDone = body.is_done === true ? 1 : 0;
  db.prepare('INSERT INTO stage (id, label, color, position, is_visible, is_done, created_at) VALUES (?, ?, ?, ?, 1, ?, ?)')
    .run(id, label, color, maxPos + 1, isDone, nowIso());
  sendJson(res, 200, stageToPayload(getStage(id)));
}

function stageSetsFromBody(body, row) {
  const sets = {};
  if (body.label !== undefined) {
    if (typeof body.label !== 'string' || !body.label.trim()) return { error: 'Field "label" must be a non-empty string' };
    sets.label = body.label.trim().slice(0, 100);
  }
  if (body.color !== undefined) {
    if (body.color === null) sets.color = null;
    else if (typeof body.color === 'string' && validColor(body.color)) sets.color = body.color.trim();
    else return { error: 'Field "color" must be a hex color like #4662d5 or null' };
  }
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) return { error: 'Field "position" must be a number' };
    sets.position = body.position;
  }
  if (body.is_visible !== undefined) {
    if (typeof body.is_visible !== 'boolean') return { error: 'Field "is_visible" must be a boolean' };
    sets.is_visible = body.is_visible ? 1 : 0;
  }
  if (body.is_done !== undefined) {
    if (typeof body.is_done !== 'boolean') return { error: 'Field "is_done" must be a boolean' };
    // is_done = true может быть только у одного этапа.
    if (body.is_done && !row.is_done) {
      db.prepare('UPDATE stage SET is_done = 0 WHERE is_done = 1').run();
    }
    sets.is_done = body.is_done ? 1 : 0;
  }
  return { sets };
}

function patchStage(req, res, params, query, body) {
  const id = String(params.id || '');
  const row = getStage(id);
  if (!row) { notFound(res, `Stage ${params.id} not found`); return; }
  const parsed = stageSetsFromBody(body, row);
  if (parsed.error) { badRequest(res, parsed.error); return; }
  const sets = parsed.sets;
  const keys = Object.keys(sets);
  if (keys.length === 0) { badRequest(res, 'Nothing to update (label, color, position, is_visible, is_done)'); return; }
  const sql = `UPDATE stage SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...keys.map((k) => sets[k]), row.id);
  sendJson(res, 200, stageToPayload(getStage(row.id)));
}

// DELETE /api/stages/:id?reassign=<stage_id> — задачи этапа переезжают на reassign
// (или на первый этап, если не указан). Последний этап удалить нельзя.
function deleteStage(req, res, params, searchParams) {
  const id = String(params.id || '');
  const row = getStage(id);
  if (!row) { notFound(res, `Stage ${params.id} not found`); return; }
  const all = listStageRows();
  if (all.length <= 1) {
    badRequest(res, 'Cannot delete the last stage');
    return;
  }
  let targetId = searchParams.get('reassign');
  if (targetId) {
    if (!all.some((s) => s.id === targetId)) {
      badRequest(res, `reassign: stage "${targetId}" not found`);
      return;
    }
    if (targetId === id) {
      badRequest(res, 'reassign cannot point at the stage being deleted');
      return;
    }
  } else {
    const rest = all.filter((s) => s.id !== id);
    // Предпочитаем этап с is_done при удалении завершающего, иначе — первый в порядке.
    const done = rest.find((s) => s.is_done);
    targetId = (row.is_done && done ? done.id : rest[0].id);
  }
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE task SET stage = ?, updated_at = ? WHERE stage = ?').run(targetId, nowIso(), id);
    db.prepare('DELETE FROM stage WHERE id = ?').run(id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  sendJson(res, 200, { ok: true, deleted: id, reassigned_to: targetId });
}

// ---------------------------------------------------------------------------
// Экспорт
// ---------------------------------------------------------------------------

function exportAll(req, res) {
  sendJson(res, 200, {
    exported_at: nowIso(),
    projects: db.prepare('SELECT id, name, color, position, created_at FROM project ORDER BY position, id').all(),
    stages: listStageRows().map(stageToPayload),
    tasks: db.prepare(`SELECT ${TASK_COLUMNS} FROM task ORDER BY position, id`).all().map((t) => ({ ...t, custom: taskCustomValues(t.id) })),
    members: db.prepare('SELECT id, name, color, initials, position, created_at FROM member ORDER BY position, id').all(),
    custom_fields: db.prepare('SELECT id, name, type, position, is_active FROM custom_field ORDER BY position, id').all(),
    view_fields: db.prepare('SELECT id, view_type, field_key, label, position, is_visible FROM view_field ORDER BY view_type, position, id').all(),
  });
}

// ---------------------------------------------------------------------------
// Ядро мутаций задач (v3): общее для REST и MCP. Возвращают {status, payload}.
// Валидация одна — расхождений между API и MCP нет.
// ---------------------------------------------------------------------------

// v9: срочность 'h' | 'm' | 'l' (регистр не важен), пусто/undefined/null = NULL.
const URGENCY_VALUES = ['h', 'm', 'l'];
function normalizeUrgency(body, fieldLabel = 'urgency') {
  const v = body.urgency;
  if (v === undefined || v === null) return { value: null, valid: true };
  if (typeof v !== 'string') {
    return { value: null, valid: false, error: `Field "${fieldLabel}" must be a string or null (h/m/l)` };
  }
  const low = v.trim().toLowerCase();
  if (low === '') return { value: null, valid: true };
  if (URGENCY_VALUES.includes(low)) return { value: low, valid: true };
  return {
    value: null,
    valid: false,
    error: `Invalid urgency "${v}". Allowed: h, m, l (case-insensitive) or empty/null`,
  };
}

function createTaskCore(body, auth = null) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return { status: 400, payload: { error: 'Field "title" is required' } };
  if (title.length > 500) return { status: 400, payload: { error: 'Field "title" is too long (max 500)' } };
  let stage = 'DISCUSSION';
  if (body.stage !== undefined && body.stage !== null) {
    if (!validStage(body.stage)) {
      return { status: 400, payload: { error: `Invalid stage "${String(body.stage)}". Allowed: ${listStageRows().map((s) => s.id).join(', ')}` } };
    }
    stage = body.stage;
  }
  let projectId;
  if (body.project_id === undefined || body.project_id === null || body.project_id === '') {
    // v7: «без проекта» — осмысленное состояние, а не «первый попавшийся проект».
    // v9: member-сессии «без проекта» создавать нельзя (такие задачи им не видны).
    if (!canAccessProject(auth, null)) {
      return { status: 403, payload: { error: 'Нет доступа к проекту' } };
    }
    projectId = null;
  } else if (body.project_id === 'none') {
    if (!canAccessProject(auth, null)) {
      return { status: 403, payload: { error: 'Нет доступа к проекту' } };
    }
    projectId = null;
  } else {
    const pid = asId(body.project_id);
    if (pid === null) return { status: 400, payload: { error: 'Field "project_id" must be a project id, "none", or null' } };
    if (!getProject(pid)) return { status: 404, payload: { error: `Project ${pid} not found` } };
    if (!canAccessProject(auth, pid)) return { status: 403, payload: { error: 'Нет доступа к проекту' } };
    projectId = pid;
  }
  const optional = {};
  for (const f of ['due_at', 'notes']) {
    const v = body[f];
    if (v === undefined || v === null) {
      optional[f] = null;
      continue;
    }
    if (typeof v !== 'string') return { status: 400, payload: { error: `Field "${f}" must be a string or null` } };
    optional[f] = v;
  }
  let assigneeId = null;
  if (body.assignee_id !== undefined && body.assignee_id !== null && body.assignee_id !== '') {
    const mid = asId(body.assignee_id);
    if (mid === null) return { status: 400, payload: { error: 'Field "assignee_id" must be an assignee id' } };
    if (!getMember(mid)) return { status: 404, payload: { error: `Assignee ${mid} not found` } };
    assigneeId = mid;
  }
  if (body.assignee !== undefined && typeof body.assignee === 'string' && body.assignee.trim()) {
    const m = db.prepare('SELECT id FROM member WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))').get(body.assignee);
    if (!m) return { status: 404, payload: { error: `Assignee "${body.assignee.trim()}" not found` } };
    assigneeId = m.id;
  }
  const urgency = normalizeUrgency(body);
  if (!urgency.valid) return { status: 400, payload: { error: urgency.error } };
  const ts = nowIso();
  // maxTaskPosition принимает NULL (IS ?) — «без проекта» своя очередь позиций.
  const position = maxTaskPosition(projectId, stage) + 1; // дефолт: max+1 в колонке
  const info = db.prepare('INSERT INTO task (project_id, title, stage, position, due_at, assignee_id, notes, urgency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(projectId, title, stage, position, optional.due_at, assigneeId, optional.notes, urgency.value, ts, ts);
  return { status: 200, payload: { ...getTask(Number(info.lastInsertRowid)), custom: {} } };
}

function patchTaskCore(id, body, auth = null) {
  const task = id === null ? null : getTask(id);
  if (!task) return { status: 404, payload: { error: `Task ${id} not found` } };
  // v9: задача в чужом для member проекте → 404 (не палим существование);
  // текущий null-project для member тоже «не существует».
  if (!canAccessProject(auth, task.project_id)) {
    return { status: 404, payload: { error: `Task ${id} not found` } };
  }
  const sets = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return { status: 400, payload: { error: 'Field "title" must be a non-empty string' } };
    sets.title = body.title.trim();
  }
  if (body.stage !== undefined) {
    if (!validStage(body.stage)) return { status: 400, payload: { error: `Invalid stage "${String(body.stage)}". Allowed: ${listStageRows().map((s) => s.id).join(', ')}` } };
    sets.stage = body.stage;
  }
  // Перенос между проектами: project_id (id | 'none' | null) или project (имя).
  if (body.project_id !== undefined) {
    if (body.project_id === null || body.project_id === '' || body.project_id === 'none') {
      // v9: member — целевой проект «без проекта» недоступен.
      if (!canAccessProject(auth, null)) {
        return { status: 403, payload: { error: 'Нет доступа к проекту' } };
      }
      sets.project_id = null;
    } else {
      const pid = asId(body.project_id);
      if (pid === null) return { status: 400, payload: { error: 'Field "project_id" must be a project id, "none", or null' } };
      if (!getProject(pid)) return { status: 404, payload: { error: `Project ${pid} not found` } };
      // v9: ЦЕЛЕВОЙ проект должен быть в доступе member'а.
      if (!canAccessProject(auth, pid)) return { status: 403, payload: { error: 'Нет доступа к проекту' } };
      sets.project_id = pid;
    }
  }
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) return { status: 400, payload: { error: 'Field "position" must be a number' } };
    sets.position = body.position;
  }
  for (const f of ['due_at', 'notes']) {
    if (body[f] === undefined) continue;
    if (body[f] !== null && typeof body[f] !== 'string') return { status: 400, payload: { error: `Field "${f}" must be a string or null` } };
    sets[f] = body[f];
  }
  // Исполнитель: assignee_id (id) или assignee (имя, совместимость с v1).
  let assigneeId = task.assignee_id;
  let assigneeTouched = false;
  if (body.assignee_id !== undefined) {
    assigneeTouched = true;
    if (body.assignee_id === null || body.assignee_id === '') {
      assigneeId = null;
    } else {
      const mid = asId(body.assignee_id);
      if (mid === null) return { status: 400, payload: { error: 'Field "assignee_id" must be an assignee id or null' } };
      if (!getMember(mid)) return { status: 404, payload: { error: `Assignee ${mid} not found` } };
      assigneeId = mid;
    }
  }
  if (body.assignee !== undefined) {
    assigneeTouched = true;
    if (body.assignee === null || body.assignee === '') {
      assigneeId = null;
    } else if (typeof body.assignee !== 'string') {
      return { status: 400, payload: { error: 'Field "assignee" must be a string or null' } };
    } else {
      const m = db.prepare('SELECT id FROM member WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))').get(body.assignee);
      if (!m) return { status: 404, payload: { error: `Assignee "${body.assignee.trim()}" not found` } };
      assigneeId = m.id;
    }
  }
  if (assigneeTouched) sets.assignee_id = assigneeId;

  if (body.urgency !== undefined) {
    const u = normalizeUrgency(body);
    if (!u.valid) return { status: 400, payload: { error: u.error } };
    sets.urgency = u.value;
  }

  // Custom-поля: ключи "custom:<field_id>" → значение с валидацией по типу.
  const customSets = {};
  for (const [key, value] of Object.entries(body)) {
    if (!key.startsWith('custom:')) continue;
    const fid = asId(key.slice(7));
    if (fid === null) return { status: 400, payload: { error: `Invalid key "${key}" (expected custom:<field_id>)` } };
    const field = getCustomField(fid);
    if (!field) return { status: 404, payload: { error: `Custom field ${fid} not found` } };
    const parsed = validateCustomValue(field, value);
    if (parsed.error) return { status: 400, payload: { error: `custom:${fid}: ${parsed.error}` } };
    customSets[fid] = parsed.value;
  }

  const keys = Object.keys(sets);
  if (keys.length === 0 && Object.keys(customSets).length === 0) {
    return { status: 400, payload: { error: 'Nothing to update (title, stage, position, project_id, urgency, due_at, assignee_id/assignee, notes, custom:<id>)' } };
  }
  db.exec('BEGIN');
  try {
    if (keys.length > 0) {
      keys.push('updated_at');
      const sql = `UPDATE task SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...keys.map((k) => (k === 'updated_at' ? nowIso() : sets[k])), task.id);
    } else {
      db.prepare('UPDATE task SET updated_at = ? WHERE id = ?').run(nowIso(), task.id);
    }
    for (const [fid, value] of Object.entries(customSets)) {
      if (value === null) {
        db.prepare('DELETE FROM task_field_value WHERE task_id = ? AND field_id = ?').run(task.id, fid);
      } else {
        db.prepare('INSERT INTO task_field_value (task_id, field_id, value_text) VALUES (?, ?, ?) ON CONFLICT(task_id, field_id) DO UPDATE SET value_text = excluded.value_text')
          .run(task.id, fid, value);
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { status: 200, payload: { ...getTask(task.id), custom: taskCustomValues(task.id) } };
}

function moveTaskCore(id, body, auth = null) {
  const task = id === null ? null : getTask(id);
  if (!task) return { status: 404, payload: { error: `Task ${id} not found` } };
  // v9: перенос из чужого проекта → 404 (не палим существование).
  if (!canAccessProject(auth, task.project_id)) {
    return { status: 404, payload: { error: `Task ${id} not found` } };
  }
  if (body.stage === undefined) return { status: 400, payload: { error: 'Field "stage" is required' } };
  if (!validStage(body.stage)) return { status: 400, payload: { error: `Invalid stage "${String(body.stage)}". Allowed: ${listStageRows().map((s) => s.id).join(', ')}` } };

  // Опциональный перенос между проектами / в «без проекта» (v7).
  let projectId = task.project_id;
  if (body.project_id !== undefined) {
    if (body.project_id === null || body.project_id === '' || body.project_id === 'none') {
      // v9: member — целевой проект «без проекта» недоступен.
      if (!canAccessProject(auth, null)) {
        return { status: 403, payload: { error: 'Нет доступа к проекту' } };
      }
      projectId = null;
    } else {
      const pid = asId(body.project_id);
      if (pid === null) return { status: 400, payload: { error: 'Field "project_id" must be a project id, "none", or null' } };
      if (!getProject(pid)) return { status: 404, payload: { error: `Project ${pid} not found` } };
      // v9: ЦЕЛЕВОЙ проект должен быть в доступе member'а.
      if (!canAccessProject(auth, pid)) return { status: 403, payload: { error: 'Нет доступа к проекту' } };
      projectId = pid;
    }
  }

  const hasAfter = body.after_id !== undefined && body.after_id !== null;
  const hasBefore = body.before_id !== undefined && body.before_id !== null;
  if (hasAfter && hasBefore) return { status: 400, payload: { error: 'Provide only one of "after_id" / "before_id"' } };

  // Соседи в целевой колонке (проект + стадия; саму двигаемую задачу исключаем).
  const column = db.prepare('SELECT id, position FROM task WHERE project_id IS ? AND stage = ? AND id != ? ORDER BY position, id')
    .all(projectId, body.stage, task.id);

  let position;
  if (hasAfter || hasBefore) {
    const refId = asId(hasAfter ? body.after_id : body.before_id);
    if (refId === null) {
      return { status: 400, payload: { error: hasAfter
        ? 'Field "after_id" must be a task id'
        : 'Field "before_id" must be a task id' } };
    }
    if (refId === task.id) return { status: 400, payload: { error: 'Cannot move relative to itself' } };
    const refTask = getTask(refId);
    if (!refTask) return { status: 404, payload: { error: `Task (${hasAfter ? 'after_id' : 'before_id'}=${refId}) not found` } };
    if (String(refTask.project_id ?? 'none') !== String(projectId ?? 'none') || refTask.stage !== body.stage) {
      return { status: 400, payload: { error: `Task ${refId} is not in stage ${body.stage} of project ${projectId === null ? 'none' : projectId}` } };
    }
    const idx = column.findIndex((r) => r.id === refId);
    if (hasAfter) {
      const next = column[idx + 1];
      position = next ? (refTask.position + next.position) / 2 : refTask.position + 1;
    } else {
      const prev = idx > 0 ? column[idx - 1] : null;
      position = prev ? (prev.position + refTask.position) / 2 : refTask.position / 2;
      if (!(position > 0)) position = refTask.position - 0.5; // защита от вырождения
    }
  } else {
    position = column.length > 0 ? column[column.length - 1].position + 1 : 1;
  }

  db.prepare('UPDATE task SET stage = ?, project_id = ?, position = ?, updated_at = ? WHERE id = ?')
    .run(body.stage, projectId, position, nowIso(), task.id);
  return { status: 200, payload: getTask(task.id) };
}

function deleteTaskCore(id, auth = null) {
  const tid = asId(id);
  const task = tid === null ? null : getTask(tid);
  if (!task) return { status: 404, payload: { error: `Task ${id} not found` } };
  // v9: чужой для member проект → 404 (не палим существование).
  if (!canAccessProject(auth, task.project_id)) {
    return { status: 404, payload: { error: `Task ${id} not found` } };
  }
  db.prepare('DELETE FROM task WHERE id = ?').run(task.id);
  return { status: 200, payload: { ok: true, deleted: task.id } };
}

// ---------------------------------------------------------------------------
// MCP (v3): JSON-RPC 2.0 поверх POST /mcp (Streamable HTTP, stateless).
// Аутентификация — только Bearer-токен; cookie игнорируются.
// ---------------------------------------------------------------------------

// Вспомогательный svc-слой — те же данные, что у REST, но без req/res.
// Токены (MCP) не скоупятся по project_access — осознанное поведение (user_id
// у токена нет); все svc-вызовы идут от имени токена.
const svc = {
  listProjects: () => db.prepare('SELECT id, name, color, position, archived, created_at FROM project ORDER BY position, id').all(),
  getProject: (id) => getProject(id),
  createProject: (name, color) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw httpError(400, 'Field "name" is required');
    if (trimmed.length > 200) throw httpError(400, 'Field "name" is too long (max 200)');
    let c = color;
    if (!c || typeof c !== 'string' || !c.trim()) {
      const count = Number(db.prepare('SELECT COUNT(*) AS c FROM project').get().c);
      c = PALETTE[count % PALETTE.length];
    } else {
      c = c.trim().slice(0, 32);
    }
    const info = db.prepare('INSERT INTO project (name, color, position, created_at) VALUES (?, ?, ?, ?)')
      .run(trimmed, c, maxProjectPosition() + 1, nowIso());
    return getProject(Number(info.lastInsertRowid));
  },
  listTasks: (filters) => {
    const f = filters || {};
    let sql = `SELECT ${TASK_COLUMNS} FROM task WHERE 1=1`;
    const args = [];
    if (f.project_id !== undefined && f.project_id !== null) {
      if (f.project_id === 'none') {
        sql += ' AND project_id IS NULL';
      } else {
        const pid = asId(f.project_id);
        if (pid === null) throw httpError(400, 'project_id must be a project id or "none"');
        sql += ' AND project_id = ?';
        args.push(pid);
      }
    }
    if (f.stage !== undefined && f.stage !== null) {
      if (!validStage(f.stage)) throw httpError(400, `Invalid stage "${String(f.stage)}". Allowed: ${listStageRows().map((s) => s.id).join(', ')}`);
      sql += ' AND stage = ?';
      args.push(f.stage);
    }
    if (f.assignee_id !== undefined && f.assignee_id !== null) {
      const mid = asId(f.assignee_id);
      if (mid === null) throw httpError(400, 'assignee_id must be an assignee id');
      sql += ' AND assignee_id = ?';
      args.push(mid);
    }
    if (typeof f.search === 'string' && f.search.trim()) {
      sql += ' AND LOWER(title) LIKE ?';
      args.push('%' + f.search.trim().toLowerCase() + '%');
    }
    sql += ' ORDER BY position, id';
    let rows = db.prepare(sql).all(...args);
    if (f.due_before || f.due_after) {
      const before = f.due_before ? Date.parse(f.due_before) : null;
      const after = f.due_after ? Date.parse(f.due_after) : null;
      rows = rows.filter((t) => {
        if (!t.due_at) return false;
        const d = Date.parse(t.due_at);
        if (!Number.isFinite(d)) return false;
        if (before !== null && d > before) return false;
        if (after !== null && d < after) return false;
        return true;
      });
    }
    const limit = asId(f.limit === undefined ? null : f.limit);
    if (limit !== null) rows = rows.slice(0, limit);
    return rows.map((t) => ({ ...t, custom: taskCustomValues(t.id) }));
  },
  getTask: (id) => {
    const t = getTask(asId(id));
    if (!t) throw httpError(404, `Task ${id} not found`);
    return { ...t, custom: taskCustomValues(t.id) };
  },
  createTask: (b) => {
    const out = createTaskCore(b);
    if (out.status !== 200) throw httpError(out.status, out.payload.error);
    return out.payload;
  },
  updateTask: (id, b) => {
    const out = patchTaskCore(asId(id), b);
    if (out.status !== 200) throw httpError(out.status, out.payload.error);
    return out.payload;
  },
  moveTask: (id, b) => {
    const out = moveTaskCore(asId(id), b);
    if (out.status !== 200) throw httpError(out.status, out.payload.error);
    return out.payload;
  },
  deleteTask: (id) => {
    const out = deleteTaskCore(id);
    if (out.status !== 200) throw httpError(out.status, out.payload.error);
    return out.payload;
  },
  listMembers: () => db.prepare('SELECT id, name, color, initials, position, created_at FROM member ORDER BY position, id').all(),
  listCustomFields: () => db.prepare('SELECT id, name, type, position, is_active FROM custom_field ORDER BY position, id').all(),
};

// svc-слой этапов для MCP (v7).
const svcStages = {
  list: () => listStageRows().map(stageToPayload),
};
// MCP-инструменты. name → { description, inputSchema, handler }.
const MCP_TOOLS = [
  {
    name: 'kanban_list_projects',
    readOnly: true,
    description: 'List kanban board projects (id, name, color, archived flag). No parameters.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => svc.listProjects(),
  },
  {
    name: 'kanban_create_project',
    description: 'Create a project. {name: string (required), color?: string}. Returns the created project.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' }, color: { type: 'string' } },
      required: ['name'],
    },
    handler: (a) => svc.createProject(a.name, a.color),
  },
  {
    name: 'kanban_list_tasks',
    readOnly: true,
    description: 'List tasks with filters {project_id? ("none" = no project), stage?, assignee_id?, search?, due_before?, due_after?, limit?}. stage: a stage id from kanban_list_stages. Returns an array of tasks (id, project_id (null = no project), title, stage, position, due_at, assignee_id, notes, created_at, updated_at, custom).',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: ['integer', 'string'], description: 'project id or "none"' },
        stage: { type: 'string', description: 'stage id from kanban_list_stages' },
        assignee_id: { type: ['integer', 'string'], description: 'assignee id' },
        search: { type: 'string', description: 'substring of the title' },
        due_before: { type: 'string', description: 'ISO date' },
        due_after: { type: 'string', description: 'ISO date' },
        limit: { type: 'integer', description: 'макс. число задач' },
      },
      additionalProperties: false,
    },
    handler: (a) => svc.listTasks(a),
  },
  {
    name: 'kanban_get_task',
    readOnly: true,
    description: 'Get a task by id. {id: integer|string}.',
    inputSchema: { type: 'object', properties: { id: { type: ['integer', 'string'] } }, required: ['id'], additionalProperties: false },
    handler: (a) => svc.getTask(a.id),
  },
  {
    name: 'kanban_create_task',
    description: 'Create a task {title (required), project_id? (id or "none" = no project; defaults to no project), stage?, due_at?, notes?, assignee_id?, assignee?, urgency?}. Returns the created task.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        project_id: { type: ['integer', 'string'], description: 'project id or "none"' },
        stage: { type: 'string', description: 'stage id from kanban_list_stages' },
        due_at: { type: 'string', description: 'ISO or YYYY-MM-DD' },
        notes: { type: 'string', description: 'markdown' },
        assignee_id: { type: ['integer', 'string'] },
        assignee: { type: 'string', description: 'assignee name' },
        urgency: {
          type: ['string', 'null'],
          enum: ['h', 'm', 'l', null],
          description: 'urgency: "h"=high, "m"=medium, "l"=low (case-insensitive on input, stored lowercase); null/empty = no urgency',
        },
      },
      required: ['title'],
    },
    handler: (a) => svc.createTask(a),
  },
  {
    name: 'kanban_update_task',
    description: 'Update a task {id (required), title?, stage?, project_id? (id or "none"), urgency? ("h"/"m"/"l", null clears), due_at?, notes?, assignee_id?, assignee?, custom:<field_id>?: value}. For custom NUMBER pass a number or numeric string; CHECKBOX — true/false; empty string/null clears the value. Returns the updated task.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: ['integer', 'string'] },
        title: { type: 'string' },
        stage: { type: 'string', description: 'stage id from kanban_list_stages' },
        project_id: { type: ['integer', 'string'], description: 'project id or "none"' },
        due_at: { type: 'string' },
        notes: { type: 'string' },
        assignee_id: { type: ['integer', 'string'] },
        assignee: { type: 'string' },
        urgency: {
          type: ['string', 'null'],
          enum: ['h', 'm', 'l', null],
          description: 'urgency: "h"=high, "m"=medium, "l"=low (case-insensitive on input, stored lowercase); null/empty = no urgency',
        },
      },
      required: ['id'],
    },
    handler: (a) => svc.updateTask(a.id, a),
  },
  {
    name: 'kanban_move_task',
    description: 'Move a task to a column/position {id (required), stage (required), project_id? (id or "none" = move between projects), before_id?/after_id?}. Without neighbors the task goes to the end of the column. Same move as drag-n-drop on the board.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: ['integer', 'string'] },
        stage: { type: 'string', description: 'stage id from kanban_list_stages' },
        project_id: { type: ['integer', 'string'], description: 'project id or "none"' },
        before_id: { type: ['integer', 'string'] },
        after_id: { type: ['integer', 'string'] },
      },
      required: ['id', 'stage'],
      additionalProperties: false,
    },
    handler: (a) => svc.moveTask(a.id, a),
  },
  {
    name: 'kanban_delete_task',
    description: 'Delete a task permanently {id}. Caution: irreversible.',
    inputSchema: { type: 'object', properties: { id: { type: ['integer', 'string'] } }, required: ['id'], additionalProperties: false },
    handler: (a) => svc.deleteTask(a.id),
  },
  {
    name: 'kanban_list_members',
    readOnly: true,
    description: 'List assignees (id, name, color, initials). These are labels for tasks, not login accounts.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => svc.listMembers(),
  },
  {
    name: 'kanban_list_custom_fields',
    readOnly: true,
    description: 'List custom fields (id, name, type: TEXT|NUMBER|DATE|CHECKBOX, is_active). Use for custom:<id> keys in kanban_update_task.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => svc.listCustomFields(),
  },
  {
    name: 'kanban_list_stages',
    readOnly: true,
    description: 'List pipeline stages (id, label, color, position, is_visible, is_done). Dynamic: kanban columns are configured in the UI. Take ids from here, do not hardcode.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => svcStages.list(),
  },
];

const READ_TOOL_NAMES = MCP_TOOLS.filter((t) => t.readOnly).map((t) => t.name);
function mcpResultText(obj) {
  return [{ type: 'text', text: JSON.stringify(obj, null, 2) }];
}

function mcpSend(res, status, payload, extraHeaders) {
  sendJson(res, status, payload, extraHeaders);
}

function mcpErrorPayload(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// Разбор JSON-RPC-запроса. Возвращает {valid, batch} или null при ошибке парсинга.
function parseJsonRpc(bodyText) {
  let parsed;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return null;
  }
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length > JSONRPC_BATCH_LIMIT) return { valid: false, batch: null };
  const items = [];
  for (const item of arr) {
    if (!isPlainObject(item)) return { valid: false, batch: null };
    if (item.jsonrpc !== '2.0' || typeof item.method !== 'string') return { valid: false, batch: null };
    items.push(item);
  }
  return { valid: true, batch: items, isBatch: Array.isArray(parsed) };
}

// handlers: method → fn(req, res, item)
const mcpMethods = {
  initialize: (item) => ({
    jsonrpc: '2.0',
    id: item.id,
    result: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'kanban', version: '1.0.0' },
      instructions: 'Kanban board. Call kanban_list_projects/kanban_list_stages/kanban_list_tasks before mutations. stage is a stage id from kanban_list_stages (never hardcode). project_id "none" means no project. In kanban_update_task, custom fields are passed with "custom:<field_id>" keys.',
    },
  }),
  ping: (item) => ({ jsonrpc: '2.0', id: item.id, result: {} }),
  'tools/list': (item) => ({
    jsonrpc: '2.0',
    id: item.id,
    result: {
      tools: MCP_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    },
  }),
  'tools/call': async (item, ctx) => {
    const params = isPlainObject(item.params) ? item.params : {};
    const toolName = params.name;
    const tool = MCP_TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      return { jsonrpc: '2.0', id: item.id, error: { code: -32602, message: `Unknown tool "${String(toolName)}"` } };
    }
    // Скоуп: мутации требуют write (read-инструменты помечены флагом readOnly).
    const mutating = !READ_TOOL_NAMES.includes(toolName);
    if (mutating && !ctx.scopes.includes('write')) {
      audit(ctx.actor, `mcp.${toolName}.denied`, 'tool', null, { reason: 'read-only token' });
      return { jsonrpc: '2.0', id: item.id, error: { code: -32603, message: 'Token is read-only (missing the "write" scope)' } };
    }
    try {
      const result = await tool.handler(isPlainObject(params.arguments) ? params.arguments : {});
      audit(ctx.actor, `mcp.${toolName}`, 'tool', null, mutating ? { args_sample: JSON.stringify(params.arguments || {}).slice(0, 500) } : undefined);
      return { jsonrpc: '2.0', id: item.id, result: { content: mcpResultText(result), isError: false } };
    } catch (err) {
      if (err && err.status) {
        return { jsonrpc: '2.0', id: item.id, result: { content: mcpResultText({ error: err.message }), isError: true } };
      }
      console.error('[kanban] MCP tools/call error:', (err && err.stack) || err);
      return { jsonrpc: '2.0', id: item.id, error: { code: -32603, message: 'Internal error' } };
    }
  },
};

async function handleMcp(req, res, pathname, searchParams, bodyText) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'MCP: use the POST method' }, { Allow: 'POST' });
    return;
  }
  const bearer = extractBearer(req);
  const authed = bearer ? getTokenByBearer(bearer) : null;
  if (!authed) {
    sendJson(res, 401, mcpErrorPayload(null, -32001, 'Bearer token required'), { 'WWW-Authenticate': 'Bearer realm="kanban-mcp"' });
    return;
  }
  if (!allowTokenAttempt(authed.row.id)) {
    sendJson(res, 429, { error: 'Too many requests for this token. Wait a minute.' });
    return;
  }
  // last_used_at (не чаще раза в минуту).
  const ts = nowIso();
  const prevTs = tokenLastUsed.get(authed.row.id);
  if (!prevTs || ts.slice(0, 16) !== prevTs) {
    tokenLastUsed.set(authed.row.id, ts);
    try { db.prepare('UPDATE api_token SET last_used_at = ? WHERE id = ?').run(ts, authed.row.id); } catch {}
  }
  const parsed = parseJsonRpc(bodyText);
  if (!parsed || !parsed.valid) {
    sendJson(res, 400, mcpErrorPayload(null, -32700, 'Parse error'));
    return;
  }
  const ctx = { scopes: authed.scopes, actor: 'token:' + authed.row.name };
  const isBatch = parsed.isBatch;
  const results = [];
  for (const item of parsed.batch) {
    if (typeof item.id === 'undefined' && item.method.startsWith('notifications/')) continue; // уведомление
    const handler = mcpMethods[item.method];
    if (!handler) {
      if (typeof item.id !== 'undefined') results.push({ jsonrpc: '2.0', id: item.id, error: { code: -32601, message: `Method ${item.method} not found` } });
      continue;
    }
    const out = await handler(item, ctx);
    if (out) results.push(out);
  }
  if (isBatch) {
    mcpSend(res, 200, results);
  } else {
    mcpSend(res, 200, results[0] || null);
  }
}

// ---------------------------------------------------------------------------
// Маршруты API
// ---------------------------------------------------------------------------

const routes = [
  { method: 'POST',   re: /^\/api\/login\/?$/,                          handler: handleLogin },
  { method: 'POST',   re: /^\/api\/logout\/?$/,                         handler: handleLogout },
  { method: 'GET',    re: /^\/api\/me\/?$/,                             handler: handleMe },
  { method: 'PATCH',  re: /^\/api\/me\/password\/?$/,                   handler: handleMePassword },
  { method: 'POST',   re: /^\/api\/setup\/?$/,                          handler: handleSetup },
  { method: 'GET',    re: /^\/api\/users\/?$/,                          handler: listUsers },
  { method: 'POST',   re: /^\/api\/users\/?$/,                          handler: createUser },
  { method: 'PATCH',  re: /^\/api\/users\/(?<id>[0-9]+)\/?$/,           handler: patchUser },
  { method: 'DELETE', re: /^\/api\/users\/(?<id>[0-9]+)\/?$/,           handler: deleteUser },
  { method: 'GET',    re: /^\/api\/projects\/?$/,                       handler: listProjects },
  { method: 'POST',   re: /^\/api\/projects\/?$/,                       handler: createProject },
  { method: 'PATCH',  re: /^\/api\/projects\/(?<id>[0-9]+)\/?$/,        handler: patchProject },
  { method: 'DELETE', re: /^\/api\/projects\/(?<id>[0-9]+)\/?$/,        handler: deleteProject },
  // v9: доступ не-админов к проекту — заменяемый набор user_ids (только admin-сессия).
  { method: 'GET',    re: /^\/api\/projects\/(?<id>[0-9]+)\/access\/?$/, handler: getProjectAccess },
  { method: 'PUT',    re: /^\/api\/projects\/(?<id>[0-9]+)\/access\/?$/, handler: putProjectAccess },
  { method: 'GET',    re: /^\/api\/tasks\/?$/,                          handler: listTasks },
  { method: 'POST',   re: /^\/api\/tasks\/?$/,                          handler: createTask },
  { method: 'PATCH',  re: /^\/api\/tasks\/(?<id>[0-9]+)\/?$/,           handler: patchTask },
  // v9: GET /api/tasks/:id — member'у чужой проект → 404 (не палим существование).
  // (svc.getTask для MCP ходит от токенов — там скоупинг не применяется.)
  { method: 'GET',    re: /^\/api\/tasks\/(?<id>[0-9]+)\/?$/,             handler: getTaskHandler },
  { method: 'DELETE', re: /^\/api\/tasks\/(?<id>[0-9]+)\/?$/,           handler: deleteTask },
  { method: 'POST',   re: /^\/api\/tasks\/(?<id>[0-9]+)\/move\/?$/,     handler: moveTask },
  { method: 'GET',    re: /^\/api\/stages\/?$/,                          handler: listStages },
  { method: 'POST',   re: /^\/api\/stages\/?$/,                          handler: createStage },
  { method: 'PATCH',  re: /^\/api\/stages\/(?<id>[A-Za-z0-9_]+)\/?$/,    handler: patchStage },
  { method: 'DELETE', re: /^\/api\/stages\/(?<id>[A-Za-z0-9_]+)\/?$/,    handler: deleteStage },
  { method: 'GET',    re: /^\/api\/members\/?$/,                         handler: listMembers },
  { method: 'POST',   re: /^\/api\/members\/?$/,                         handler: createMember },
  { method: 'PATCH',  re: /^\/api\/members\/(?<id>[0-9]+)\/?$/,          handler: patchMember },
  { method: 'DELETE', re: /^\/api\/members\/(?<id>[0-9]+)\/?$/,          handler: deleteMember },
  { method: 'GET',    re: /^\/api\/view-fields\/?$/,                     handler: listViewFields },
  { method: 'PATCH',  re: /^\/api\/view-fields\/?$/,                     handler: patchViewFields },
  { method: 'GET',    re: /^\/api\/custom-fields\/?$/,                   handler: listCustomFields },
  { method: 'POST',   re: /^\/api\/custom-fields\/?$/,                   handler: createCustomField },
  { method: 'PATCH',  re: /^\/api\/custom-fields\/(?<id>[0-9]+)\/?$/,    handler: patchCustomField },
  { method: 'DELETE', re: /^\/api\/custom-fields\/(?<id>[0-9]+)\/?$/,    handler: deleteCustomField },
  { method: 'GET',    re: /^\/api\/audit\/?$/,                           handler: listAudit },
  { method: 'GET',    re: /^\/api\/sessions\/?$/,                        handler: listSessions },
  { method: 'DELETE', re: /^\/api\/sessions\/(?<sid>[A-Za-z0-9_-]+)\/?$/, handler: revokeSession },
  { method: 'GET',    re: /^\/api\/tokens\/?$/,                          handler: listApiTokens },
  { method: 'POST',   re: /^\/api\/tokens\/?$/,                          handler: createApiToken },
  { method: 'DELETE', re: /^\/api\/tokens\/(?<id>[0-9]+)\/?$/,           handler: deleteApiToken },
  { method: 'PATCH',  re: /^\/api\/tokens\/(?<id>[0-9]+)\/?$/,           handler: revokeApiToken },
  { method: 'GET',    re: /^\/api\/export\/?$/,                          handler: exportAll },
];

// Роуты, доступные только роли admin в cookie-сессии (bearer-токены к ним
// не допускаются в принципе): /api/users*, /api/audit, /api/sessions*, /api/export.
const ADMIN_ONLY_ROUTES = [
  /^\/api\/users/,
  /^\/api\/audit\/?$/,
  /^\/api\/sessions/,
  /^\/api\/export\/?$/,
  // v9: управление доступом к проектам — в дополнение к isAdminRoute-проверке
  // роли в handleApi requireAdminSession дублирует её внутри обработчиков
  // (bearer-токенам отказ ещё раньше — на гейте admin-роутов).
  /^\/api\/projects\/[0-9]+\/access/,
];

function isAdminRoute(pathname) {
  return ADMIN_ONLY_ROUTES.some((re) => re.test(pathname));
}

// Скоуп-политика REST: методы мутации требуют write, иначе 403.
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

async function handleApi(req, res, pathname, searchParams) {
  const isLogin = req.method === 'POST' && pathname === '/api/login';
  const isSetup = req.method === 'POST' && pathname === '/api/setup';
  const isSetupStatus = req.method === 'GET' && pathname === '/api/me';
  // Rate-limit по IP до чтения/парсинга тела: анонимный клиент не должен
  // вынуждать сервер принимать и парсить до 1 МиБ JSON с неограниченной частотой.
  if (isLogin || isSetup) {
    const ip = req.socket.remoteAddress || 'unknown';
    if (!allowLoginAttempt(ip)) {
      sendJson(res, 429, { error: 'Too many attempts. Wait a minute.' });
      return;
    }
  }
  let auth = null; // { via: 'user'|'token', sid?, user?, row?, scopes? }
  let actor = 'user';
  if (!isLogin && !isSetup && !isSetupStatus) {
    const bearer = extractBearer(req);
    if (bearer) {
      // Агент: bearer-токен (даже к REST). Cookie в расчёт не берём.
      // Admin-роуты — только для сессий людей с ролью admin (у токенов нет роли).
      if (isAdminRoute(pathname)) {
        sendJson(res, 403, { error: 'This route requires an administrator session (cookie), not a token' });
        return;
      }
      if (!allowTokenAttempt('ip:' + (req.socket.remoteAddress || 'unknown'))) {
        sendJson(res, 429, { error: 'Too many requests. Wait a minute.' });
        return;
      }
      const found = getTokenByBearer(bearer); // {row, scopes, via}
      if (!found) {
        sendJson(res, 401, { error: 'Invalid or revoked token' });
        return;
      }
      if (!allowTokenAttempt(found.row.id)) {
        sendJson(res, 429, { error: 'Too many requests for this token. Wait a minute.' });
        return;
      }
      if (WRITE_METHODS.has(req.method) && !found.scopes.includes('write')) {
        sendJson(res, 403, { error: 'Token is read-only (missing the "write" scope)' });
        return;
      }
      auth = { via: 'token', row: found.row, scopes: found.scopes };
      actor = 'token:' + found.row.name;
      // last_used_at обновляем не чаще раза в минуту.
      const ts = nowIso();
      const prev = tokenLastUsed.get(found.row.id);
      if (!prev || ts.slice(0, 16) !== prev) {
        tokenLastUsed.set(found.row.id, ts);
        try { db.prepare('UPDATE api_token SET last_used_at = ? WHERE id = ?').run(ts, found.row.id); } catch {}
      }
    } else {
      // Человек: cookie-сессия (ВСЕ /api/* кроме login/setup).
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }
      auth = { via: 'user', sid: session.sid, user: session.user };
      actor = 'user:' + session.user.username;
      // Admin-роуты: управление учётными записями, журнал, сессии, экспорт —
      // только role='admin'. (Bearer-токены сюда не допускаются в принципе:
      // у агентов нет роли.)
      if (isAdminRoute(pathname) && session.user.role !== 'admin') {
        sendJson(res, 403, { error: 'Administrator role required' });
        return;
      }
    }
  }

  // Аудит мутаций — обёрткой вокруг handler'а.
  for (const route of routes) {
    if (route.method !== req.method) continue;
    const match = route.re.exec(pathname);
    if (!match) continue;
    let params = match.groups || {};
    let body = {};
    // v9: PUT тоже мутация с телом (например, /api/projects/:id/access).
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      try {
        body = await readJsonBody(req);
      } catch (err) {
        sendJson(res, err.status || 400, { error: err.message || 'Bad request' });
        return;
      }
    }
    if (auditWorthy(req.method, pathname)) {
      const rPath = pathname;
      const rActor = actor;
      const rMethod = req.method;
      // Оборачиваем dispatch: перехватываем вызовы sendJson/res.writeHead
      // этого handler'а, чтобы узнать ответный статус, затем пишем аудит.
      /* eslint-disable no-inner-declarations */
      let capturedStatus = 0;
      const origWriteHead = res.writeHead.bind(res);
      res.writeHead = function (status, ...rest) {
        capturedStatus = status;
        return origWriteHead(status, ...rest);
      };
      try {
        route.handler(req, res, params, searchParams, body, auth);
        if (capturedStatus === 0) capturedStatus = res.statusCode;
      } finally {
        res.writeHead = origWriteHead;
      }
      try {
        const action = rMethod + ' ' + rPath.replace(/^\/api\//, '');
        const m = /\/(\d+)(?:\/move)?$/.exec(rPath);
        audit(rActor, action, /^\/api\/([a-z-]+)/.exec(rPath)?.[1] || null, m ? m[1] : null, { status: capturedStatus });
      } catch { /* аудит не должен ломать ответ */ }
      return;
    }
    route.handler(req, res, params, searchParams, body, auth);
    return;
  }
  sendJson(res, 404, { error: 'Not found' });
}

// Какие запросы попадают в аудит: мутации + login/logout/setup.
function auditWorthy(method, pathname) {
  if (!WRITE_METHODS.has(method)) return false;
  return /^\/api\/(login|logout|setup|users|projects|tasks|members|stages|custom-fields|view-fields|tokens|sessions)/.test(pathname);
}

// Читаем сырое тело (для MCP: строка JSON; лимит тот же).
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT_BYTES) {
        reject(httpError(413, 'Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', (err) => reject(err));
  });
}

// ---------------------------------------------------------------------------
// Статика из public/ с ETag-кэшем
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res, pathname, method) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    badRequest(res, 'Bad path');
    return;
  }
  let publicFile = rel === '/' || rel === '' ? 'index.html' : rel.replace(/^\/+/, '');

  // index.html (приложение) отдаётся только с валидной сессией. Статика
  // (css/js/setup.html) — публична. В режиме настройки (пользователей нет)
  // «/» показывает мастер первичной настройки.
  if (publicFile === 'index.html') {
    if (isSetupMode()) {
      const setupFile = path.join(PUBLIC_DIR, 'setup.html');
      try {
        const buf = fs.readFileSync(setupFile);
        sendStaticBuffer(req, res, method, buf, '.html');
      } catch {
        sendJson(res, 503, { error: 'Setup page missing (public/setup.html)' });
      }
      return;
    }
    if (!getSession(req)) {
      const loginFile = path.join(PUBLIC_DIR, 'login.html');
      try {
        const buf = fs.readFileSync(loginFile);
        sendStaticBuffer(req, res, method, buf, '.html');
      } catch {
        notFound(res, 'Not found');
      }
      return;
    }
  }
  let rootReal;
  try {
    rootReal = fs.realpathSync(PUBLIC_DIR);
  } catch {
    notFound(res, 'Not found');
    return;
  }
  // «/» — это index.html; для остальной статики убираем ведущий слэш.
  const relPath = publicFile;
  const resolved = path.resolve(PUBLIC_DIR, relPath);
  let real;
  try {
    real = fs.realpathSync(resolved);
  } catch {
    notFound(res, 'Not found');
    return;
  }
  if (real !== rootReal && !real.startsWith(rootReal + path.sep)) {
    notFound(res, 'Not found'); // защита от выхода за пределы public/
    return;
  }
  let stat;
  try {
    stat = fs.statSync(real);
  } catch {
    notFound(res, 'Not found');
    return;
  }
  if (!stat.isFile()) {
    notFound(res, 'Not found');
    return;
  }
  sendStaticBuffer(req, res, method, fs.readFileSync(real), path.extname(real).toLowerCase());
}

function sendStaticBuffer(req, res, method, buf, ext) {
  const etag = `"${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 32)}"`;
  const inm = req.headers['if-none-match'];
  if (inm && String(inm).split(',').map((s) => s.trim()).some((t) => t === '*' || t === etag || t === `W/${etag}`)) {
    res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
    res.end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': buf.length,
    ETag: etag,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  });
  res.end(method === 'HEAD' ? undefined : buf);
}

// ---------------------------------------------------------------------------
// HTTP-сервер + логи stdout: ISO-время, метод, путь, статус, длительность мс
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  const started = process.hrtime.bigint();
  const method = req.method || 'GET';
  let pathname = '/';
  let search = '';
  let searchParams = new URLSearchParams();
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    pathname = url.pathname;
    search = url.search || '';
    searchParams = url.searchParams;
  } catch {
    // оставляем дефолты
  }
  const pathForLog = `${pathname}${search}`;

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(`${nowIso()} ${method} ${pathForLog} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });

  (async () => {
    if (pathname === '/mcp') {
      // MCP: только POST с JSON-телом; аутентификация внутри handleMcp.
      if (method !== 'POST') {
        sendJson(res, 405, { error: 'MCP: use the POST method' }, { Allow: 'POST' });
        return;
      }
      // Rate-limit по IP ДО чтения тела: аноним не должен вынуждать сервер
      // буферизовать до 1 МиБ на запрос с неограниченной частотой.
      const mcpIp = req.socket.remoteAddress || 'unknown';
      if (!allowTokenAttempt('ip:' + mcpIp)) {
        sendJson(res, 429, { error: 'Too many requests. Wait a minute.' });
        return;
      }
      const bodyText = await readRawBody(req);
      await handleMcp(req, res, pathname, searchParams, bodyText);
    } else if (pathname === '/api' || pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname, searchParams);
    } else if (method === 'GET' || method === 'HEAD') {
      serveStatic(req, res, pathname, method);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  })().catch((err) => {
    const status = err && err.status ? err.status : 500;
    if (status === 500) {
      console.error('[kanban] Request handling error:', (err && err.stack) || err);
    }
    try {
      if (!res.headersSent) {
        // Неожиданные исключения (err.status отсутствует) наружу не раскрываем:
        // message таких ошибок может содержать схемы/таблицы/пути файловой системы.
        const message = status === 500 ? 'Internal server error' : (err && err.message) || 'Request error';
        sendJson(res, status, { error: message });
      } else if (!res.writableEnded) {
        res.end();
      }
    } catch {
      // клиент уже ушёл
    }
  });
});

process.on('uncaughtException', (err) => {
  console.error('[kanban] uncaughtException:', (err && err.stack) || err);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}

// ---------------------------------------------------------------------------
// Старт
// ---------------------------------------------------------------------------

async function bootstrap() {
  if (DIALECT === 'postgres' && db.syncReady) {
    await db.syncReady();
  }
  if (isSetupMode()) {
    console.log('[kanban] No users yet — setup wizard: open http://<host>:' + PORT + '/ in a browser');
    if (SETUP_TOKEN) console.log('[kanban] Setup token protection is ON (KANBAN_SETUP_TOKEN)');
  }
}

bootstrap().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[kanban] Kanban is listening on http://0.0.0.0:${PORT} (data: ${DATA_DIR}, engine: ${DIALECT})`);
  });
}).catch((err) => {
  console.error('[kanban] Fatal during bootstrap:', (err && err.stack) || err);
  process.exit(1);
});