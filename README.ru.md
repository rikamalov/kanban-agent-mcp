# kanban-agent-mcp

<div align="center">

**Самохостинговая канбан-доска, созданная для работы с ИИ-агентами**

Бэкенд на stdlib Node 26 • ноль npm-зависимостей (SQLite) • ванильный JS без сборки
Встроенный MCP-сервер — агенты работают с доской нативно

</div>

<p align="center">
  <a href="#Быстрый-старт-docker">Быстрый старт</a> •
  <a href="#MCP-для-ИИ-агентов">MCP для агентов</a> •
  <a href="#Обзор-API">API</a> •
  <a href="#Автор">Автор</a>
</p>

---

Одноконтейнерная канбан-доска: **бэкенд на stdlib Node 26** (по умолчанию
ноль npm-зависимостей — `node:http` + встроенный `node:sqlite`), **ванильный
JS-фронт** без сборки. Стилистика вдохновлена Twenty CRM (акцент `#4662d5`,
фон `#fcfcfc`).

**Почему «для агентов»?** Доска — общее рабочее пространство, где ИИ-агенты
(Claude Code, Cursor, Codex, OpenCode, …) действуют как полноценные
пользователи: на этапе планирования агент разбивает фичу на задачи и
выставляет их на доску; во время реализации двигает карточки по пайплайну,
оставляет прогресс в заметках и закрывает задачу по завершении. Человек видит
живой прогресс, агент получает структуру вместо списка дел в чате. Для этого
есть два канала интеграции:

1. **MCP-сервер** (`POST /mcp`) — 11 инструментов `kanban_*`: списки проектов,
   этапов и задач, создание/изменение/перемещение/удаление задач, работа с
   исполнителями. Любой MCP-клиент подключается к URL инстанса.
2. **REST + bearer-токены** — те же операции по обычному HTTP:
   `Authorization: Bearer kb_…` со скоупами `read`/`write`; в БД хранятся
   только хеши токенов, каждая мутация попадает в журнал.

А ещё: многопользовательский доступ с ролями, мастер первого запуска,
динамический пайплайн (колонки настраиваются в UI), опциональный PostgreSQL.

- **Многопользовательность**: учётная запись администратора создаётся в
  мастере первого запуска (в браузере; никаких паролей в env или файлах
  конфигурации); админ может добавлять пользователей — у каждого свой
  логин и пароль.
- **Динамический пайплайн**: колонки канбана (этапы) настраиваются в UI.
- **API + MCP**: bearer-токены для агентов, MCP-сервер на `POST /mcp`,
  журнал действий (аудит).
- **Опциональный PostgreSQL**: движок хранения переключается переменными
  окружения; SQLite — нулевой-конфигурации дефолт.

## Быстрый старт (Docker)

```bash
docker build -t kanban .
docker volume create kanban_data
docker run -d --name kanban --restart unless-stopped \
  -p 3100:3100 -v kanban_data:/data \
  kanban
```

Откройте **http://localhost:3100/** — при первом запуске вас встретит мастер
настройки:

1. Выберите язык интерфейса (English / Русский / 中文).
2. Создайте учётную запись администратора (логин + пароль).
3. Работайте с доской; пользователей добавляйте позже в разделе
   **Пользователи** (доступно админам).

> Дополнительная защита для публичных инстансов: `-e KANBAN_SETUP_TOKEN=…`
> заставит мастер запросить этот токен перед созданием учётной записи
> администратора — посторонний не успеет первым занять свежий инстанс.

### docker compose

Включён `docker-compose.yml`. Вариант A (проще — volume создастся сам):
уберите `external: true` из секции `volumes:`. Вариант B (явный, защищает
от переименования compose-проекта):

```bash
docker volume create kanban_data
docker compose up -d
```

## Движки хранения

| Движок | Когда | Настройка |
| --- | --- | --- |
| SQLite (по умолчанию) | ничего не сконфигурировано | данные в `$KANBAN_DATA/kanban.db` (WAL) |
| PostgreSQL (опционально) | задан `DATABASE_URL` или `POSTGRES_HOST` | нужен `npm install` (пакет `pg`, optional dependency) |

Переменные окружения:

```bash
# либо полная строка подключения
DATABASE_URL=postgres://user:pass@host:5432/kanban

# либо по частям
POSTGRES_HOST=host
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=kanban
POSTGRES_SSL=1        # опционально: включить TLS
```

Схема создаётся автоматически на обоих движках; миграции идемпотентны.
Чтобы перенести существующую SQLite-установку в PostgreSQL, выгрузите
`GET /api/export` и импортируйте JSON в новый инстанс.

### Запуск без Docker

```bash
npm install            # нужен только для режима PostgreSQL
KANBAN_PORT=3100 KANBAN_DATA=./data node server.js
```

Требуется Node ≥ 26 (встроенный `node:sqlite`).

## MCP для ИИ-агентов

Эндпоинт MCP — `POST {URL}/mcp` (JSON-RPC 2.0, Streamable HTTP, stateless).
Только bearer-токен: создайте токен в разделе **Агенты и токены**.

```bash
curl -X POST http://localhost:3100/mcp \
  -H "Authorization: Bearer kb_…" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Инструменты: `kanban_list_projects`, `kanban_create_project`,
`kanban_list_tasks`, `kanban_get_task`, `kanban_create_task`,
`kanban_update_task`, `kanban_move_task`, `kanban_delete_task`,
`kanban_list_members`, `kanban_list_custom_fields`, `kanban_list_stages`.

Токен со скоупом `read` вызывает read-инструменты; мутации
(create/update/move/delete) требуют скоуп `write`. Не зашивайте id этапов —
берите их из `kanban_list_stages`.

## Пользователи и роли

| Роль | Может |
| --- | --- |
| `admin` | всё + управление пользователями (создание, смена паролей, роли, удаление) |
| `member` | работа с проектами, задачами, этапами; без доступа к управлению пользователями |

Пароли хранятся только в виде scrypt-хешей; сессии — HTTP-only куки в БД
(переживают рестарт, можно отозвать).

**Агенты** (автоматизация) аутентифицируются bearer-токенами
(`Authorization: Bearer kb_…`), создаются в разделе **Агенты и токены**.
В БД хранится только sha256-хеш токена; полное значение показывается один раз.

## Переменные окружения

| Переменная | Значение |
| --- | --- |
| `KANBAN_PORT` | порт (по умолчанию `3100`) |
| `KANBAN_DATA` | каталог данных (по умолчанию `./data`) |
| `KANBAN_SETUP_TOKEN` |require этого токена в мастере настройки |
| `KANBAN_INSECURE_COOKIE` | `1` — убрать флаг `Secure` у куки (чистый HTTP без TLS-прокси) |
| `KANBAN_MAX_LIFETIME_MS` | самоликвидация через N мс (smoke-тесты) |
| `DATABASE_URL`, `POSTGRES_*` | переключение на PostgreSQL |

## Обзор API

Аутентификация людей: `POST /api/login {username, password}` → кука `sid`.
Аутентификация агентов: `Authorization: Bearer kb_…` на `/api/*` и `/mcp`.

```
GET/POST /api/projects          PATCH/DELETE /api/projects/:id (+?archived=0|1|all)
GET/POST /api/tasks             GET /api/tasks?project=<id>|none
PATCH/DELETE /api/tasks/:id     POST /api/tasks/:id/move {stage, before_id?|after_id?}
GET/POST /api/stages            PATCH/DELETE /api/stages/:id?reassign=<stage_id>
GET/POST /api/members           PATCH/DELETE /api/members/:id
GET/POST /api/custom-fields     PATCH/DELETE /api/custom-fields/:id
GET/PATCH /api/view-fields      (настройки колонок представлений)
GET/POST /api/users             PATCH/DELETE /api/users/:id     (только админ)
GET /api/audit                  (только админ)
GET /api/sessions               DELETE /api/sessions/:sid       (только админ)
GET /api/export                 (только админ)
GET/POST /api/tokens            PATCH/DELETE /api/tokens/:id
GET /api/me                     POST /api/setup (пока нет ни одного пользователя)
```

Этапы динамические: id берутся из `GET /api/stages`. Ровно один этап имеет
`is_done: 1` (финиш); проверки завершённости — по флагу, не по зашитому id.
`project_id: null` — легитимное расположение («Без проекта»).

## Файлы

| Путь | Что |
| --- | --- |
| `server.js` | бэкенд: stdlib http + sqlite/pg-адаптеры, auth (scrypt), статика с ETag |
| `store/` | выбор движка хранения, синхронный PostgreSQL-адаптер (`pg` в воркере) |
| `public/` | фронтенд: `index.html` + `app.js` (приложение), `login.html`, `setup.html`, `style.css` |
| `.test/` | jsdom DOM-тесты (`npm test`; нужен `jsdom`) |
| `Dockerfile` | образ: node:26-alpine + server + public + store |

## Разработка

Приложение — три файла ванильного JS без сборки. Цвета стилей — в CSS-
переменных `:root` (`public/style.css`); иконки — инлайн-SVG в объекте
`ICONS` (`public/app.js`); строки интерфейса — в словаре `I18N`
(канонический английский, дополнения вносятся во все три локали).

## Автор

Делаю self-hosted инструменты и пишу о разработке. Вопросы и фидбек по
проекту — приветствуются:

[![YouTube](https://img.shields.io/badge/YouTube-@rikamalov-FF0000?logo=youtube&logoColor=white)](https://youtube.com/@rikamalov)
[![Telegram](https://img.shields.io/badge/Telegram-my__python__notes-26A5E4?logo=telegram&logoColor=white)](https://t.me/my_python_notes)

- 📺 YouTube — <https://youtube.com/@rikamalov>
- 💬 Telegram — <https://t.me/my_python_notes>

## Лицензия

MIT — делайте что хотите, упоминание авторов приветствуется.