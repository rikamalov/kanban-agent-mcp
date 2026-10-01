# kanban-agent-mcp

<div align="center">

**为 AI 智能体打造的自托管看板**

Node 26 stdlib 后端 • 零 npm 依赖（SQLite） • 原生 JS，无需构建
内置 MCP 服务器 —— 智能体原生操作看板

</div>

<p align="center">
  <a href="#快速开始docker">快速开始</a> •
  <a href="#面向-ai-智能体的-mcp">面向智能体的 MCP</a> •
  <a href="#api-概览">API</a> •
  <a href="#作者">作者</a>
</p>

---

单容器看板应用：**Node 26 stdlib 后端**（默认零 npm 依赖 —
`node:http` + 内置 `node:sqlite`），**原生 JS 前端**，无需构建。
视觉风格受 Twenty CRM 启发（主色 `#4662d5`，背景 `#fcfcfc`）。

**为什么说「为智能体」？** 看板是共享工作区，AI 编程智能体（Claude Code、
Cursor、Codex、OpenCode 等）在其中是一等公民：规划阶段，智能体把功能拆解
成任务并放上看板；实现阶段，它沿流程拖动卡片、在备注中记录进度、完成后
关闭任务。人类实时看到进展，智能体获得结构化的任务而不是聊天里的待办。
为此内置两条集成通道：

1. **MCP 服务器**（`POST /mcp`）—— 11 个 `kanban_*` 工具：列出项目、
   阶段和任务，创建/更新/移动/删除任务，管理执行人。任何 MCP 客户端
   直接连接实例 URL 即可使用。
2. **REST + bearer 令牌** —— 通过普通 HTTP 完成相同操作：
   `Authorization: Bearer kb_…`， scope 为 `read`/`write`；数据库仅存
   令牌哈希，每次变更都记录审计。

此外：带角色的多用户支持、首次运行设置向导、动态流程（列在界面中
配置）、可选 PostgreSQL。

- **多用户**：管理员帐户通过首次运行的设置向导创建（在浏览器中，
  环境变量和配置文件中不出现任何明文密码）；管理员之后可以邀请
  更多用户（每人拥有独立的用户名和密码）。
- **动态流程**：看板列（阶段）在界面中配置。
- **API + MCP**：面向智能体的 bearer 令牌自动化，`POST /mcp` 上的
  MCP 服务器，审计日志。
- **可选 PostgreSQL**：通过环境变量切换存储引擎；SQLite 是零配置
  的默认选项。

## 快速开始（Docker）

```bash
docker build -t kanban .
docker volume create kanban_data
docker run -d --name kanban --restart unless-stopped \
  -p 3100:3100 -v kanban_data:/data \
  kanban
```

打开 **http://localhost:3100/** —— 首次运行会进入设置向导：

1. 选择界面语言（English / Русский / 中文）。
2. 创建管理员帐户（用户名 + 密码）。
3. 开始使用看板；之后在 **用户**（仅管理员可见）中添加用户。

> 面向公网实例的可选加固：设置 `-e KANBAN_SETUP_TOKEN=…` 后，向导
> 在接受管理员帐户前会要求提供该令牌 —— 陌生人无法抢先占用你的
> 全新实例。

### docker compose

仓库包含 `docker-compose.yml`。方案 A（最简单 —— 自动创建卷）：从
compose 文件的 `volumes:` 部分删除 `external: true`。方案 B（显式，
防止 compose 项目重命名导致数据丢失）：

```bash
docker volume create kanban_data
docker compose up -d
```

## 存储引擎

| 引擎 | 何时使用 | 配置 |
| --- | --- | --- |
| SQLite（默认） | 未做任何配置 | 数据位于 `$KANBAN_DATA/kanban.db`（WAL 模式） |
| PostgreSQL（可选） | 设置了 `DATABASE_URL` 或 `POSTGRES_HOST` | 需要 `npm install`（`pg` 包，可选依赖） |

环境变量：

```bash
# 或使用完整连接串
DATABASE_URL=postgres://user:pass@host:5432/kanban

# 或按字段配置
POSTGRES_HOST=host
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=kanban
POSTGRES_SSL=1        # 可选：启用 TLS
```

两种引擎上的数据库模式都会自动创建；迁移是幂等的。要把现有的
SQLite 安装迁移到 PostgreSQL，先用 `GET /api/export` 导出，再将
JSON 导入新实例。

### 不用 Docker 运行

```bash
npm install            # 仅 PostgreSQL 模式需要
KANBAN_PORT=3100 KANBAN_DATA=./data node server.js
```

需要 Node ≥ 26（内置 `node:sqlite`）。

## 面向 AI 智能体的 MCP

MCP 端点为 `POST {URL}/mcp`（JSON-RPC 2.0，Streamable HTTP，无状态）。
仅支持 bearer 令牌认证 —— 在 **智能体与令牌** 中创建令牌。

```bash
curl -X POST http://localhost:3100/mcp \
  -H "Authorization: Bearer kb_…" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

工具：`kanban_list_projects`、`kanban_create_project`、`kanban_list_tasks`、
`kanban_get_task`、`kanban_create_task`、`kanban_update_task`、
`kanban_move_task`、`kanban_delete_task`、`kanban_list_members`、
`kanban_list_custom_fields`、`kanban_list_stages`。

`read` scope 的令牌可调用只读工具；变更类操作（create/update/move/
/delete）需要 `write` scope。不要硬编码阶段 id —— 请从
`kanban_list_stages` 获取。

## 用户与角色

| 角色 | 权限 |
| --- | --- |
| `admin` | 一切操作 + 用户管理（创建用户、重置密码、修改角色、删除） |
| `member` | 处理项目、任务、阶段；无权访问用户管理 |

密码仅以 scrypt 哈希存储；会话为存储在数据库中的 HTTP-only Cookie
（重启后仍然有效，可随时撤销）。

**智能体**（自动化）使用 bearer 令牌认证（`Authorization: Bearer kb_…`），
在 **智能体与令牌** 中创建。数据库只保存令牌的 sha256 哈希；完整值
仅在创建时显示一次。

## 环境变量

| 变量 | 含义 |
| --- | --- |
| `KANBAN_PORT` | 端口（默认 `3100`） |
| `KANBAN_DATA` | 数据目录（默认 `./data`） |
| `KANBAN_SETUP_TOKEN` | 要求设置向导提供此令牌 |
| `KANBAN_INSECURE_COOKIE` | 设为 `1` 去除 Cookie 的 `Secure` 标志（无 TLS 代理的纯 HTTP） |
| `KANBAN_MAX_LIFETIME_MS` | N 毫秒后自我终止（冒烟测试用） |
| `DATABASE_URL`, `POSTGRES_*` | 切换到 PostgreSQL |

## API 概览

人类认证：`POST /api/login {username, password}` → Cookie `sid`。
智能体认证：在 `/api/*` 与 `/mcp` 上使用 `Authorization: Bearer kb_…`。

```
GET/POST /api/projects          PATCH/DELETE /api/projects/:id (+?archived=0|1|all)
GET/POST /api/tasks             GET /api/tasks?project=<id>|none
PATCH/DELETE /api/tasks/:id     POST /api/tasks/:id/move {stage, before_id?|after_id?}
GET/POST /api/stages            PATCH/DELETE /api/stages/:id?reassign=<stage_id>
GET/POST /api/members           PATCH/DELETE /api/members/:id
GET/POST /api/custom-fields     PATCH/DELETE /api/custom-fields/:id
GET/PATCH /api/view-fields      （各视图的字段设置）
GET/POST /api/users             PATCH/DELETE /api/users/:id     （仅管理员）
GET /api/audit                  （仅管理员）
GET /api/sessions               DELETE /api/sessions/:sid       （仅管理员）
GET /api/export                 （仅管理员）
GET/POST /api/tokens            PATCH/DELETE /api/tokens/:id
GET /api/me                     POST /api/setup（尚无任何用户时可用）
```

阶段是动态的：id 来自 `GET /api/stages`。恰好一个阶段带有
`is_done: 1`（终点）；完成判定基于该标志，而非硬编码 id。
`project_id: null` 是合法状态（“无项目”）。

## 文件

| 路径 | 说明 |
| --- | --- |
| `server.js` | 后端：stdlib http + sqlite/pg 适配器，认证（scrypt），带 ETag 的静态服务 |
| `store/` | 存储引擎选择，同步 PostgreSQL 适配器（worker 中的 `pg`） |
| `public/` | 前端：`index.html` + `app.js`（应用），`login.html`，`setup.html`，`style.css` |
| `.test/` | jsdom DOM 测试（`npm test`；需要 `jsdom`） |
| `Dockerfile` | 镜像：node:26-alpine + server + public + store |

## 开发

应用由三个原生 JS 文件组成，没有构建步骤。样式颜色集中在 `:root`
CSS 变量中（`public/style.css`）；图标是 `ICONS` 对象中的内联 SVG
（`public/app.js`）；界面文案在 `I18N` 字典中（英文为准，新增文案
需同时补齐三种语言）。

## 作者

我开发自托管工具并撰写开发相关的文章。欢迎通过以下渠道反馈和提问：

[![YouTube](https://img.shields.io/badge/YouTube-@rikamalov-FF0000?logo=youtube&logoColor=white)](https://youtube.com/@rikamalov)
[![Telegram](https://img.shields.io/badge/Telegram-my__python__notes-26A5E4?logo=telegram&logoColor=white)](https://t.me/my_python_notes)

- 📺 YouTube —— <https://youtube.com/@rikamalov>
- 💬 Telegram —— <https://t.me/my_python_notes>

## 许可证

MIT —— 可任意使用，欢迎注明出处。