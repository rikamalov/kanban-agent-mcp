'use strict';

/*
 * pg-sync.js — PostgreSQL-backed drop-in for node:sqlite's DatabaseSync.
 *
 * The main thread keeps its synchronous shape:
 *   db.exec(sql)                     — multi-statement DDL
 *   db.prepare(sql).run(...params)   — { changes, lastInsertRowid }
 *   db.prepare(sql).get(...params)   — row | undefined
 *   db.prepare(sql).all(...params)   — rows array
 *
 * Blocking is done with Atomics.wait on a SharedArrayBuffer flag; the worker
 * (store/pg-worker.js) writes the response bytes into the same buffer. One
 * in-flight request at a time — the same serialized session semantics as
 * SQLite's single connection, so BEGIN/COMMIT blocks stay consistent.
 *
 * Engine selection lives in server.js: DATABASE_URL / POSTGRES_* present →
 * PostgreSQL (requires the optional `pg` package), otherwise node:sqlite.
 * SQLite-isms are translated in the worker; DDL differences are handled by
 * pgDdl()/PG_DIALECT in server.js.
 */

const { Worker } = require('node:worker_threads');
const path = require('node:path');

const WORKER_PATH = path.join(__dirname, 'pg-worker.js');

const HDR_U32 = 3; // header as u32 words: magic | flag | length
const HDR = HDR_U32 * 4; // then response bytes
const MAGIC = 0x4b424e42; // 'KBNB'

class PgSync {
  constructor(connectionString, opts) {
    opts = opts || {};
    // [magic][flag][len][bytes…]
    this._sab = new SharedArrayBuffer(HDR + (opts.bufferSize || 8 * 1024 * 1024));
    const dv = new DataView(this._sab);
    dv.setUint32(0, MAGIC, true);
    dv.setUint32(4, 0, true); // flag: 0 = idle

    this._fatal = null;
    // Resolved when the worker signals 'ready'; rejected on 'fatal'.
    this._ready = new Promise((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });

    this._worker = new Worker(WORKER_PATH);
    this._worker.on('message', (msg) => {
      if (msg.type === 'fatal') {
        this._fatal = new Error(msg.message);
        this._readyReject(this._fatal);
        return;
      }
      if (msg.type === 'ready') this._readyResolve();
    });
    // Query port: the worker answers into the SAB and flips the flag; the
    // port itself is only used to deliver requests (results stay in the SAB).
    const { port1, port2 } = new MessageChannel();
    this._port = port1;
    this._worker.postMessage(
      { type: 'init', connectionString, ssl: opts.ssl, sab: this._sab, port: port2 },
      [port2]
    );
  }

  // Must be awaited once right after construction (in async boot code).
  syncReady() {
    return this._ready;
  }

  _call(kind, sql, params) {
    if (this._fatal) throw this._fatal;
    const i32 = new Int32Array(this._sab, 0, HDR_U32);
    const dv = new DataView(this._sab);
    Atomics.store(i32, 1, 1); // flag (word 1): 1 = request in flight
    this._port.postMessage({ kind, sql, params });
    for (;;) {
      const ret = Atomics.wait(i32, 1, 1, 120000);
      if (ret === 'timed-out') throw new Error('PostgreSQL request timed out');
      if (Atomics.load(i32, 1) === 0) break;
      // spurious wake-up — keep waiting
    }
    if (dv.getUint32(0, true) !== MAGIC) throw new Error('PostgreSQL handshake corruption');
    const len = dv.getUint32(8, true);
    const u8 = new Uint8Array(this._sab, HDR, len);
    const text = Buffer.from(u8.buffer, u8.byteOffset, len).toString('utf8');
    const res = JSON.parse(text);
    if (!res.ok) {
      const err = new Error(res.error);
      err.pg = true;
      throw err;
    }
    return res.payload;
  }

  exec(sqlText) {
    this._call('exec', sqlText, []);
    return undefined;
  }

  prepare(sqlText) {
    const self = this;
    const call = (kind, params) => self._call(kind, sqlText, normalizeParams(params));
    return {
      run(...params) {
        const p = call('run', params);
        return { changes: p.rowCount, lastInsertRowid: p.lastInsertRowid };
      },
      get(...params) {
        return call('get', params).rows[0];
      },
      all(...params) {
        return call('all', params).rows;
      },
      iterate(...params) {
        const rows = call('all', params).rows;
        return (function* () { yield* rows; })();
      },
    };
  }

  close() {
    try { this._port.close(); } catch (_) {}
    try { this._worker.terminate(); } catch (_) {}
  }
}

function normalizeParams(params) {
  return params.map((v) => (v === undefined ? null : v));
}

module.exports = { PgSync };