# kanban-agent-mcp

<div align="center">

**Self-hosted kanban board built for AI agents**

Node 26 stdlib backend • zero npm dependencies (SQLite) • vanilla JS, no build step
MCP server onboard — your agents work the board natively

</div>

<p align="center">
  <a href="#quick-start-docker">Quick start</a> •
  <a href="#mcp-for-ai-agents">MCP for agents</a> •
  <a href="#api-overview">API</a> •
  <a href="#author">Author</a>
</p>

---

A single-container kanban board: **Node 26 stdlib backend** (zero npm
dependencies by default — `node:http` + built-in `node:sqlite`), **vanilla JS
frontend** with no build step. Visual style inspired by Twenty CRM
(accent `#4662d5`, background `#fcfcfc`).

**Why "for agents"?** The board is a shared workspace where AI coding agents
(Claude Code, Cursor, Codex, OpenCode, …) act as first-class users: at the
planning stage an agent breaks a feature into tasks and puts them on the
board; while implementing, it drags cards along the pipeline, leaves progress
in the notes, and closes the task when done. The human sees live progress,
the agent gets structure instead of a to-do in a chat. Two integration
channels are built for this:

1. **MCP server** (`POST /mcp`) — 11 `kanban_*` tools: list projects,
   stages and tasks, create/update/move/delete tasks, manage assignees.
   Point any MCP client at the instance URL.
2. **REST + bearer tokens** — the same operations over plain HTTP:
   `Authorization: Bearer kb_…` with `read` or `write` scopes; stored
   tokens are hashed (sha256), every mutation is audited.

More: multi-user access with roles, a setup wizard on first run, dynamic
pipeline (columns configured in the UI), optional PostgreSQL.

- **Multi-user**: administrator account is created in a first-run setup
  wizard (in the browser, no passwords in env vars or config files); the
  admin can invite more users (each with their own login/password).
- **Dynamic pipeline**: kanban columns (stages) are configured in the UI.
- **API + MCP**: bearer-token automation for agents, MCP server at `POST /mcp`,
  audit log.
- **Optional PostgreSQL**: switch the storage engine via environment
  variables; SQLite stays the zero-config default.

## Quick start (Docker)

```bash
docker build -t kanban .
docker volume create kanban_data
docker run -d --name kanban --restart unless-stopped \
  -p 3100:3100 -v kanban_data:/data \
  kanban
```

Open **http://localhost:3100/** — the setup wizard greets you on first run:

1. Pick the interface language (English / Русский / 中文).
2. Create the administrator account (username + password).
3. Start using the board; add users later under **Users** (admins only).

> Optional hardening for exposed instances: `-e KANBAN_SETUP_TOKEN=…` makes
> the wizard ask for that token before accepting the administrator account,
> so a stranger cannot claim your fresh instance first.

### docker compose

`docker-compose.yml` is included. Option A (simplest — volume auto-created):
remove `external: true` from `volumes:` in the compose file. Option B
(explicit, protects against compose-project renames):

```bash
docker volume create kanban_data
docker compose up -d
```

## Storage engines

| Engine | When | Configuration |
| --- | --- | --- |
| SQLite (default) | nothing configured | data in `$KANBAN_DATA/kanban.db` (WAL mode) |
| PostgreSQL (optional) | `DATABASE_URL` or `POSTGRES_HOST` set | requires `npm install` (the `pg` package, optional dependency) |

Environment variables:

```bash
# either a full connection string
DATABASE_URL=postgres://user:pass@host:5432/kanban

# or individual parts
POSTGRES_HOST=host
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=kanban
POSTGRES_SSL=1        # optional: enable TLS
```

The schema is created automatically on both engines; migrations are
idempotent. To move an existing SQLite installation to PostgreSQL, export
with `GET /api/export` and re-import the JSON into the new instance.

### Run without Docker

```bash
npm install            # only needed for PostgreSQL mode
KANBAN_PORT=3100 KANBAN_DATA=./data node server.js
```

Requires Node ≥ 26 (built-in `node:sqlite`).

## MCP for AI agents

The MCP endpoint is `POST {URL}/mcp` (JSON-RPC 2.0, Streamable HTTP,
stateless). Bearer-token auth only — create a token in **Agents & tokens**.

```bash
curl -X POST http://localhost:3100/mcp \
  -H "Authorization: Bearer kb_…" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Tools: `kanban_list_projects`, `kanban_create_project`, `kanban_list_tasks`,
`kanban_get_task`, `kanban_create_task`, `kanban_update_task`,
`kanban_move_task`, `kanban_delete_task`, `kanban_list_members`,
`kanban_list_custom_fields`, `kanban_list_stages`.

Read-scope tokens may call the read tools; mutations (`create/update/move/
/delete`) require the `write` scope. Never hardcode stage ids — take them
from `kanban_list_stages`.

## Users and roles

| Role | Can |
| --- | --- |
| `admin` | everything + user management (create users, reset passwords, change roles, remove) |
| `member` | work with projects, tasks, stages; no access to user management |

Passwords are stored only as scrypt hashes; sessions are HTTP-only cookies
stored in the database (they survive restarts and can be revoked).

**Agents** (automation) authenticate with bearer tokens (`Authorization:
Bearer kb_…`), created in **Agents & tokens**. Only the sha256 hash of a
token is stored; the full value is shown once at creation.

## Environment variables

| Variable | Meaning |
| --- | --- |
| `KANBAN_PORT` | port (default `3100`) |
| `KANBAN_DATA` | data directory (default `./data`) |
| `KANBAN_SETUP_TOKEN` | require this token in the setup wizard |
| `KANBAN_INSECURE_COOKIE` | set `1` to drop the `Secure` cookie flag (plain HTTP without a TLS proxy) |
| `KANBAN_MAX_LIFETIME_MS` | self-terminate after N ms (smoke tests) |
| `DATABASE_URL`, `POSTGRES_*` | switch to PostgreSQL |

## API overview

Human-facing auth: `POST /api/login {username, password}` → cookie `sid`.
Agent auth: `Authorization: Bearer kb_…` on `/api/*` and `/mcp`.

```
GET/POST /api/projects          PATCH/DELETE /api/projects/:id (+?archived=0|1|all)
GET/PUT /api/projects/:id/access  {user_ids:[…]} (admin only; PUT = full replace)
GET/POST /api/tasks             GET /api/tasks?project=<id>|none
PATCH/DELETE /api/tasks/:id     POST /api/tasks/:id/move {stage, before_id?|after_id?}
GET /api/tasks/:id
GET/POST /api/stages            PATCH/DELETE /api/stages/:id?reassign=<stage_id>
GET/POST /api/members           PATCH/DELETE /api/members/:id
GET/POST /api/custom-fields     PATCH/DELETE /api/custom-fields/:id
GET/PATCH /api/view-fields      (per-view column settings)
GET/POST /api/users             PATCH/DELETE /api/users/:id     (admin only)
GET /api/audit                  (admin only)
GET /api/sessions               DELETE /api/sessions/:sid       (admin only)
GET /api/export                 (admin only)
GET/POST /api/tokens            PATCH/DELETE /api/tokens/:id
GET /api/me                     POST /api/setup (while no users exist)
```

Stages are dynamic: ids come from `GET /api/stages`. Exactly one stage has
`is_done: 1` (the finish); completion checks use the flag, not a hardcoded
id. `project_id: null` is a valid location (“No project”).

Tasks accept an optional `urgency` field (`'h' | 'm' | 'l'`, empty/clears to
`null`) on create/patch — shown as a colored square next to the task number.

Project visibility: `admin` sessions and bearer tokens see every project;
`member` sessions see only projects granted to them via
`/api/projects/:id/access` (and cannot see “No project” tasks).

## Files

| Path | What |
| --- | --- |
| `server.js` | backend: stdlib http + sqlite/pg adapters, auth (scrypt), static with ETag |
| `store/` | storage engine selection, PostgreSQL sync adapter (`pg` in a worker) |
| `public/` | frontend: `index.html` + `app.js` (app), `login.html`, `setup.html`, `style.css` |
| `.test/` | jsdom DOM test suite (ws: 134 checks incl. v9 scenarios; mobile: 35 — `npm test`) |
| `Dockerfile` | image: node:26-alpine + server + public + store |

## Development

The app is three files of vanilla JS with no build step. Style colors live
in `:root` CSS variables (`public/style.css`); icons are inline SVG in the
`ICONS` object (`public/app.js`); UI strings live in the `I18N` dictionary
(English is canonical, additions go to all three locales).

## Author

I build self-hosted tools and write about development. Questions and
feedback about the project are welcome:

[![YouTube](https://img.shields.io/badge/YouTube-@rikamalov-FF0000?logo=youtube&logoColor=white)](https://youtube.com/@rikamalov)
[![Telegram](https://img.shields.io/badge/Telegram-my__python__notes-26A5E4?logo=telegram&logoColor=white)](https://t.me/my_python_notes)

- 📺 YouTube — <https://youtube.com/@rikamalov>
- 💬 Telegram — <https://t.me/my_python_notes>

## License

MIT — do whatever you want, attribution appreciated.