'use strict';

/*
 * store/index.js — DB engine selection + PostgreSQL DDL dialect.
 *
 * Engine choice (first match wins):
 *   1. DATABASE_URL                         → PostgreSQL (connection string)
 *   2. POSTGRES_HOST / PGHOST (+parts)      → PostgreSQL (individual vars)
 *   3. otherwise                            → node:sqlite (default)
 *
 * PostgreSQL needs the optional "pg" package; it is required ONLY when an
 * engine override is present, so the default install keeps working with
 * zero npm dependencies (node:sqlite).
 */

function selectEngineFromEnv(env) {
  env = env || process.env;
  if (env.DATABASE_URL) {
    return { engine: 'postgres', url: env.DATABASE_URL };
  }
  const host = env.POSTGRES_HOST || env.PGHOST;
  if (host) {
    const port = Number.parseInt(env.POSTGRES_PORT || env.PGPORT || '5432', 10);
    const user = env.POSTGRES_USER || env.PGUSER || 'postgres';
    const database = env.POSTGRES_DB || env.PGDATABASE || user;
    const password = env.POSTGRES_PASSWORD || env.PGPASSWORD || undefined;
    const auth = password !== undefined ? encodeURIComponent(user) + ':' + encodeURIComponent(password) + '@' : encodeURIComponent(user) + '@';
    const url = `postgres://${auth}${host}:${Number.isFinite(port) ? port : 5432}/${encodeURIComponent(database)}`;
    const ssl = env.POSTGRES_SSL === '1' || env.POSTGRES_SSL === 'true' ? true : undefined;
    return { engine: 'postgres', url, ssl };
  }
  return { engine: 'sqlite' };
}

// ---------------------------------------------------------------------------
// DDL translation (SQLite → PostgreSQL) for the schema executed at startup.
// Only the constructs this codebase uses need handling; the rest of the SQL
// (type checks, FKs, indexes, ALTER TABLE) is compatible as-is.
// ---------------------------------------------------------------------------

function pgDdl(sqlText) {
  return sqlText
    // AUTOINCREMENT has no PG equivalent — SERIAL implies the same semantics
    .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
    // SQLite REAL (float) → PG double precision
    .replace(/\bREAL\b/g, 'DOUBLE PRECISION');
}

function openDatabase(engineChoice, sqliteDbPath) {
  if (engineChoice.engine === 'postgres') {
    // Lazy require: without an engine override the default install never
    // touches npm packages (node:sqlite covers it).
    const { PgSync } = require('./pg-sync.js');
    return new PgSync(engineChoice.url, { ssl: engineChoice.ssl });
  }
  const { DatabaseSync } = require('node:sqlite');
  return new DatabaseSync(sqliteDbPath);
}

module.exports = { selectEngineFromEnv, pgDdl, openDatabase };