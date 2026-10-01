'use strict';

/*
 * pg-worker.js — worker thread that owns the single PostgreSQL connection.
 *
 * Protocol with the main thread (see pg-sync.js):
 *   parentPort: { type: 'init', connectionString, ssl, sab, port } — port is
 *     a MessageChannel port used for all queries afterwards.
 *     Replies: { type: 'ready' } | { type: 'fatal', message } on parentPort.
 *   port: { kind, sql, params } — one in-flight request at a time.
 *     The response JSON is written into the shared SharedArrayBuffer at
 *     offset 12, its byte length into the u32 at offset 8, and the i32 flag
 *     at offset 4 is flipped 1 → 0 (Atomics + notify) to wake the blocked
 *     main thread.
 *
 * kinds:
 *   'exec' — no params, multi-statement allowed
 *   'all' | 'get' | 'run' — positional params
 *
 * `run` on INSERT appends RETURNING id so the caller receives
 * { changes, lastInsertRowid } exactly like node:sqlite.
 *
 * SQL translation (SQLite dialect → PostgreSQL):
 *   `?`                  → $1..$N
 *   `col IS ?`           → `col IS NOT DISTINCT FROM $n`
 *   INSERT (no RETURNING) → + RETURNING id
 *   PRAGMA table_info(x) → information_schema.columns (SQLite-shaped rows)
 *   sqlite_master reads  → information_schema.tables / [{ sql: null }]
 *   bare `rowid`         → id (ORDER BY tiebreaker in migrations)
 * `SELECT sql FROM sqlite_master` returns [{ sql: null }] — legacy-SQLite
 * rebuild paths in migrations compare `.sql` against CHECK constraints and
 * null safely disables them (PostgreSQL is always created in final shape).
 */

const { parentPort } = require('node:worker_threads');

const MAGIC = 0x4b424e42; // 'KBNB'

let port = null;
let sab = null;

function writeFatal(message) {
  parentPort.postMessage({ type: 'fatal', message: String(message) });
}

// ---------------------------------------------------------------------------
// SQL translation
// ---------------------------------------------------------------------------

// Single pass: replaces every '?' with $n; a '?' right after IS becomes
// "IS NOT DISTINCT FROM $n" (task queries match project_id IS NULL through
// a parameter — plain "IS $n" returns FALSE for NULL in PostgreSQL).
function translateParams(sqlIn) {
  let n = 0;
  return sqlIn.replace(/\?/g, () => '$' + (++n));
}

function translateIs(sqlIn) {
  // "col IS ?" → "col IS NOT DISTINCT FROM ?" (двухпроходно, до $-нумерации).
  return sqlIn.replace(/\bIS\s+\?/gi, 'IS NOT DISTINCT FROM ?');
}

function translate(sqlIn) {
  return translateParams(translateIs(sqlIn));
}

// Tables WITHOUT a serial id column (composite primary keys in this schema:
// session — TEXT PK, task_field_value — composite PK). INSERTs into them
// must not get "RETURNING id" appended (there is no id column → PG error).
const NO_ID_TABLES = new Set(['session', 'task_field_value']);

function tableOf(sqlIn) {
  const m = /^\s*INSERT\s+INTO\s+["`]?([A-Za-z0-9_]+)/i.exec(sqlIn);
  return m ? m[1].toLowerCase() : null;
}

function withReturning(sqlIn) {
  if (!/^\s*INSERT\b/i.test(sqlIn) || /\bRETURNING\b/i.test(sqlIn)) return sqlIn;
  const table = tableOf(sqlIn);
  if (table && NO_ID_TABLES.has(table)) return sqlIn;
  return sqlIn.replace(/\s*;\s*$/, '') + ' RETURNING id';
}

// PRAGMA table_info(t) → rows shaped like SQLite: { name, notnull (0|1), dflt_value }.
function tableInfo(tableName) {
  return client.query(
    `SELECT column_name AS name,
            CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
            column_default AS dflt_value
     FROM information_schema.columns
     WHERE table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  ).then((r) => r.rows);
}

// sqlite_master reads used by migrations, translated:
//   COUNT(*) AS c … WHERE name = 'x' → real count from information_schema
//   SELECT sql …                     → [{ sql: null }]
function sqliteMasterQuery(sqlIn) {
  const m = /SELECT\s+COUNT\s*\(\s*\*\s*\)\s+AS\s+c\s+FROM\s+sqlite_master.+?name\s*=\s*'([^']+)'/i.exec(sqlIn);
  if (m) {
    return client.query(
      `SELECT COUNT(*)::int AS c FROM information_schema.tables WHERE table_name = $1`,
      [m[1].toLowerCase()]
    ).then((r) => r.rows);
  }
  // SELECT sql FROM sqlite_master … — migrations only regex-test .sql for
  // legacy SQLite CHECK constraints; null disables those rebuild paths.
  return Promise.resolve([{ sql: null }]);
}

let Client = null;
let client = null;

async function runSql(kind, sqlRaw, params) {
  const trimmed = sqlRaw.trim();

  if (/^PRAGMA\b/i.test(trimmed)) {
    const ti = /^PRAGMA\s+table_info\s*\(\s*["`]?([A-Za-z0-9_]+)["`]?\s*\)/i.exec(trimmed);
    if (ti) {
      const rows = await tableInfo(ti[1].toLowerCase());
      return { rows, rowCount: rows.length };
    }
    return { rows: [], rowCount: 0 }; // journal_mode / foreign_keys … — no-ops
  }
  if (/sqlite_master/i.test(trimmed)) {
    const rows = await sqliteMasterQuery(trimmed);
    return { rows, rowCount: rows.length };
  }
  if (kind === 'exec') {
    await client.query(trimmed); // simple protocol: multi-statement allowed
    return { rows: [], rowCount: 0 };
  }

  let sql = translate(trimmed);
  if (kind === 'run') sql = withReturning(sql);
  const r = await client.query(sql, params || []);
  const rows = kind === 'run' ? [] : r.rows.map(coerceRow);
  if (kind === 'run') {
    let lastInsertRowid;
    if (r.rows && r.rows.length > 0 && r.rows[0].id !== undefined) {
      lastInsertRowid = Number(r.rows[0].id);
    }
    return { rows: [], rowCount: r.rowCount || 0, lastInsertRowid };
  }
  return { rows, rowCount: r.rowCount || 0 };
}

// node:sqlite returns INTEGER columns as JS numbers; the pg type parsers
// (set at connect) normalize int8/numeric to numbers, so no row coercion
// is needed here — rows pass through as delivered by pg.
function coerceRow(row) {
  return row;
}

// `rowid` has no PostgreSQL equivalent; migrations use it only as an
// insertion-order tiebreaker in ORDER BY — `id` is a safe stand-in.
function preprocess(sqlIn) {
  return sqlIn.replace(/\browid\b/gi, 'id');
}

// ---------------------------------------------------------------------------
// Message loop
// ---------------------------------------------------------------------------

function respond(payload) {
  const dv = new DataView(sab);
  const bytes = new Uint8Array(sab, 12);
  let text;
  try {
    text = JSON.stringify(payload);
  } catch (err) {
    text = JSON.stringify({ ok: false, error: 'Response is not serializable: ' + err.message });
  }
  if (Buffer.byteLength(text) > bytes.length) {
    text = JSON.stringify({ ok: false, error: 'Response too large for the comms buffer (' + bytes.length + ' bytes)' });
    if (Buffer.byteLength(text) > bytes.length) {
      // Cannot even carry the error — give up loudly.
      parentPort.postMessage({ type: 'fatal', message: 'SharedArrayBuffer too small even for the error response' });
      return;
    }
  }
  Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).write(text, 0, 'utf8');
  dv.setUint32(8, Buffer.byteLength(text), true);
  dv.setUint32(0, MAGIC, true);
  // Flag at offset 4 flips 1 → 0 — wakes Atomics.wait on the main thread.
  Atomics.store(new Int32Array(sab, 4, 1), 0, 0);
  Atomics.notify(new Int32Array(sab, 4, 1), 0);
}

parentPort.on('message', async (msg) => {
  if (msg.type !== 'init') return;
  sab = msg.sab;
  port = msg.port;
  port.on('message', async (q) => {
    try {
      const payload = await runSql(q.kind, preprocess(q.sql), q.params);
      respond({ ok: true, payload });
    } catch (err) {
      respond({ ok: false, error: err && err.message ? err.message : String(err) });
    }
  });
  try {
    Client = require('pg').Client;
    // node:sqlite yields INTEGER columns as JS numbers; pg returns BIGINT
    // (int8, OID 20) and NUMERIC (OID 1700) as strings by default — forcing
    // them to numbers keeps the data shapes identical between engines
    // (COUNT(*) AS c, ids from SUM/coalesce, etc.).
    const pgTypes = require('pg').types;
    pgTypes.setTypeParser(20, (v) => (v === null ? null : Number(v)));      // int8
    pgTypes.setTypeParser(1700, (v) => (v === null ? null : Number(v)));    // numeric
    pgTypes.setTypeParser(114, (v) => JSON.stringify(v));                   // json → text
    pgTypes.setTypeParser(3802, (v) => JSON.stringify(v));                  // jsonb → text
    client = new Client({
      connectionString: msg.connectionString,
      ssl: msg.ssl,
      application_name: 'kanban',
    });
    await client.connect();
    parentPort.postMessage({ type: 'ready' });
  } catch (err) {
    writeFatal('PostgreSQL connect failed: ' + (err && err.message ? err.message : err));
  }
});