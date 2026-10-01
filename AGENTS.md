# AGENTS.md — kanban-agent-mcp (self-hosted kanban board for AI agents)

> Entry point for AI agents in this folder. Contracts, architecture, checks,
> deploy. API contracts: `README.md` (+ `README.ru.md`, `README.zh.md`).

## What it is

Self-hosted kanban board **built for AI agents** in a **single Docker
container**: Node 26 (stdlib only by default — `node:http` + `node:sqlite`,
0 npm dependencies) + vanilla JS frontend without build tooling. Twenty CRM
styling (accent `#4662d5`, background `#fcfcfc`), port **3100**. Public repo
name: **kanban-agent-mcp**; nothing personal/hardcoded may enter the code
or docs (keep the repo neutral for anyone to run and customize).

- **Multi-user (v8)**: usernames + scrypt passwords, roles `admin`/`member`.
  The first-run **setup wizard** (`public/setup.html`) creates the admin
  when the users table is empty. `KANBAN_PASSWORD` is REMOVED — no plain
  passwords anywhere.
- **Optional PostgreSQL (v8)**: `DATABASE_URL` or `POSTGRES_HOST` switches
  the engine (needs the optional `pg` package). Otherwise `node:sqlite`.
- **UI languages**: EN (default) / RU / ZH, switcher on login and in the
  sidebar; strings live in `I18N` inside `public/app.js`.

## Project map

| File | Purpose |
| --- | --- |
| `server.js` | backend: stdlib http + sqlite/pg, routes, migrations, sessions (DB + scrypt), bearer tokens for agents, MCP (`POST /mcp`), audit log |
| `store/index.js` | engine selection (`DATABASE_URL`/`POSTGRES_*` → postgres, else sqlite) + DDL dialect |
| `store/pg-sync.js` + `store/pg-worker.js` | PostgreSQL adapter: synchronous DatabaseSync-like API through a worker + SharedArrayBuffer/Atomics |
| `public/app.js` | whole frontend: sidebar, kanban/table/calendar, drag-n-drop, workspace sections, task modal (markdown notes), assignees, custom fields, users panel |
| `public/login.html` + `public/login.js` | public sign-in page (served instead of index.html without a session) |
| `public/setup.html` + `public/setup.js` | first-run wizard (served while no users exist) |
| `public/style.css` | Twenty-palette styles, variables in `:root` |
| `public/index.html` | app shell |
| `Dockerfile` | node:26-alpine, copies `server.js`, `store/`, `public/` |
| `docker-compose.yml` | port 3100, volume `kanban_data` (**external: true** — never recreate!), PG example |
| `package.json` | metadata + `pg` as **optional** dependency (used only in PostgreSQL mode) |

Fully self-contained: no external AI services or keys.

## Critical invariant: data

**Volume `kanban_data` is external — docker compose up must NOT recreate it.**
History: recreating the compose project once created a fresh volume and data
was nearly lost (recovered from the old volume). Backups: SQLite → copy
`kanban.db` **main + -wal + -shm** together after `PRAGMA wal_checkpoint`;
PostgreSQL → any standard pg backup tooling.

## Run / deploy

```bash
docker build -t kanban . && docker compose up -d
```

First run: open the port in a browser → setup wizard → admin account.
After deploy checks: login via the API works, `/api/tasks` returns data.

## Architecture and contracts

- **Entities:** `project` (id, name, color, position, archived, created_at),
  `task` (id, project_id FK CASCADE **nullable — “no project”**, title,
  stage, position, due_at, assignee legacy TEXT, `assignee_id` FK member
  SET NULL, notes, created_at, updated_at),
  `stage` (id TEXT PK, label, color, position, is_visible, is_done),
  `member` (assignee label, no login),
  **`kbar_user` (v8: username UNIQUE, display_name, role admin|member,
  password_salt, password_hash scrypt, last_login_at)**,
  `custom_field`, `task_field_value`, `view_field` (view_type:
  KANBAN|TABLE|CALENDAR), `session` (sid PK, **user_id FK** — survives
  restart), `api_token` (token_hash UNIQUE, prefix, scopes read|write,
  revoked_at), `audit_log`.
- **Migrations** run on every start, idempotent (`migrateV2`…`migrateV7`).
  Pattern: `PRAGMA table_info(...)` → `ALTER TABLE` if missing; CHECK removal
  only via table recreation. On PostgreSQL `PRAGMA table_info` is translated
  to `information_schema.columns` by the adapter; legacy CHECK-detection
  returns null (PG schema is always created in final shape).
- **Setup mode (v8):** zero users → `GET /` serves `setup.html`,
  `POST /api/setup` creates the admin (once), `GET /api/me` reports
  `setup_required`. Optional `KANBAN_SETUP_TOKEN` gates the wizard.
- **Auth (v8):** login+password for humans (cookie sessions tied to
  `kbar_user`), `Authorization: Bearer kb_…` for agents (REST + MCP, bearer
  wins over cookie). Mutations with a read token → 403. Session cookie:
  `HttpOnly; SameSite=Strict` + `Secure` by default
  (`KANBAN_INSECURE_COOKIE=1` drops `Secure` for plain-HTTP deploys).
- **Admin-only routes:** `/api/users*`, `/api/audit`, `/api/sessions*`,
  `/api/export` (bearer tokens are rejected there in principle; protections:
  cannot delete/demote the self or the last admin).
- **Rate limits (must not break):** login/setup are IP-limited BEFORE the
  request body is read (5/min/IP); MCP has an IP limit before body read
  too, plus per-token limits (120/min). Unknown usernames get a dummy
  scrypt computation so response timing does not enumerate users.
- **MCP:** `POST /mcp` — JSON-RPC 2.0 (Streamable HTTP, stateless), Bearer
  only. 11 `kanban_*` tools; validation shared with REST; read tools carry
  a `readOnly` flag — `READ_TOOL_NAMES` is derived from it (scope check).
- **Password policy:** ≥ 8 chars, not digits-only, not a repeated char,
  2+ character classes below 12 chars. Hashes: scrypt N=2^15/r=8/p=1
  (legacy N=2^14 hashes still verify and are silently re-hashed on login).
- **Colors** (project/member/stage) must pass `validColor()` — strict hex
  `#rrggbb`; they are interpolated into inline `style=""` on the frontend.

## Bug-fix history (do not break!)

1. **All id comparisons — `String(a) === String(b)`**: DOM ids arrive as
   strings, data ids as numbers; strict `===` silently broke filters and drag.
2. **NO server-side sorting on kanban** (position is not recalculated) —
   order is set by dragging. Any server sort breaks drop.
3. **Drag onto empty columns**: take `targetStage` from the `data-stage` of
   the COLUMN, not a neighbor card.
4. **CUSTOM fields:** server-side VALUE validation is lenient (NUMBER accepts
   a number OR a numeric string — browser `input.value` is always a string;
   CHECKBOX — `'1'/'0'/'true'/'false'`). Empty string = clear value (null).
5. **Archived project**: row clicks go through `.project-open`; `data-view`
   lives on the `.side-item.project-row` wrapper.
6. **Markdown notes** are rendered by the built-in parser
   (`renderMarkdown`/`mdInline`), HTML is ALWAYS escaped
   (`escapeHtmlAttr` first) — XSS test relies on it.
7. **Test suite:** DOM test `.test/kanban-ws-test-v2.js` (jsdom, mock fetch,
   47 checks). Run: `node .test/kanban-ws-test-v2.js` (jsdom from npm).
   Mobile drawer: `.test/kanban-mobile-test.js` (35 checks: burger, scrim,
   side-open, vs-label, settings gear pop).
8. **Calendar never touches position/stage**: calendar drag changes only
   `due_at` (PATCH), kanban drag — `/move`. Drag states are isolated:
   `state.calDragged` ≠ `state.dragged`. Calendar is a separate view
   (viewType `CALENDAR`).
9. **Agent tokens**: the full token is shown ONCE (POST /api/tokens
   response); DB/logs/audit contain only the sha256 hash and prefix.
10. **CSP**: `style-src` must include `'unsafe-inline'` — the frontend builds
    colors via inline `style="background:…"`. Strict `'self'` silently breaks
    colors. `script-src 'self'` — no relaxations.
11. **Stages are dynamic (v4+)**: UI and MCP take stage ids from
    `GET /api/stages`, no Cyrillic in ids. `stageById()` in app.js is the
    single source of truth for label/color. Deletion always with reassign.
    “Done” checks — by the stage's `is_done`, not `stage === 'COMPLETED'`.
12. **Drag into sidebar**: reset `state.dragged` in `moveProj()` (and
    dragend) — otherwise card clicks die (`if (state.dragged) return`).
13. **Frontend i18n (v8)**: the translate function is `tr()` — do NOT name
    loop variables `t` (task loops shadow it; `tr` was chosen deliberately).
    The login/setup pages duplicate their mini-i18n independently
    (`login.js`, `setup.js`): keep their strings in sync with `I18N`.
14. **Engine duality (v8)**: every new query must stay inside the shared
    SQLite/PG SQL subset (no `PRAGMA` except `table_info`, no
    `INSERT OR REPLACE` — use `ON CONFLICT … DO UPDATE`, no `rowid` in new
    code; `IS ?` is translated to `IS NOT DISTINCT FROM`, but prefer
    writing it that way yourself for PG mode readability).
15. **Mobile layout (≤720px)**: sidebar becomes a drawer — `.app.side-open`
    + `#side-scrim`; state `mobileSideOpen`. Burger `#side-burger` lives in
    `.board-title` (hidden on desktop by CSS `display:none`). View-switch
    labels must stay wrapped in `<span class="vs-label">…</span>` (CSS hides
    them on mobile, keeps icons). `renderSidebar()` uses
    `collapsed = sidebarCollapsed && !isMobileLayout()` — the drawer is
    always expanded on mobile. Modals/toasts/panels rely on `--safe-b`
    (`env(safe-area-inset-bottom)`) and inputs stay ≥16px or iOS zooms.
    Kanban uses `scroll-snap`; calendar grid is `minmax(0,1fr)` — do NOT
    restore fixed `15vw` min widths (7×15vw overflows 100%).
16. **Rate limits run BEFORE the body is read** (moved pre-body in the
    open-source hardening pass): login/setup check `allowLoginAttempt(ip)`
    in `handleApi` before `readJsonBody`; `/mcp` checks the IP limit before
    `readRawBody`. Do not move them back into handlers — that re-opens the
    1 MiB-body flood. The duplicate checks that used to live at the top of
    `handleLogin`/`handleSetup` were removed (the limit would double-charge).
17. **Setup is transactional**: `handleSetup` re-checks `isSetupMode()`
    inside `BEGIN IMMEDIATE` — do not remove the in-transaction recheck,
    it closes the two-admins race.
18. **Setup token compare**: `timingSafeEqual` over sha256-wrapped buffers
    (raw compare throws on length mismatch and leaked the Node error text).
19. **Public-repo neutrality**: no personal names, handles, emails, IPs or
    machine paths anywhere in code/docs; `validColor()` (strict `#rrggbb`)
    must stay on every color write path; unexpected 500s return a generic
    `Internal server error` (no `err.message` echo).

## Style rules

- Palette/visuals — only from `:root` (no ad-hoc hex codes); accent `#4662d5`.
- Icons — inline SVG in the `ICONS` object (app.js), no external libraries.
- New UI strings — add the key to all three locales in `I18N` (en, ru, zh).
- Code comments — Russian is fine for internal notes; user-facing strings
  never hardcode a language.

## Agent workflow rules (short)

- Commits — only on explicit user command, after all edits are in.
- Secrets: none in the repo. `KANBAN_SETUP_TOKEN` lives in env/compose only;
  user passwords and API tokens exist in the DB as hashes only.
- After each deploy, verify the live instance (login + `/api/tasks`).
- Database moves: same engine → file/volume copy; cross-engine → `/api/export`
  JSON.