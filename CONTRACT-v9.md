# CONTRACT-v9 — срочность, доступ к проектам, темы (v9)

Документ изменений v9 (2026-10-02), миграция `migrateV8`. API-контракт: `README.md`.

## 1. Срочность задачи (urgency)

- Колонка `task.urgency TEXT NULL` (миграция v8: `ALTER TABLE task ADD COLUMN urgency TEXT`).
- Значения: `'h' | 'm' | 'l'` (строчные, сервер нормализует `toUpperCase→toLowerCase`), `NULL` = не задана.
- REST: `POST /api/tasks`, `PATCH /api/tasks/:id` — опциональное поле `urgency`;
  пустая строка/`null`/отсутствие = очистить (`NULL`); иное значение → 400 (перечень допустимых).
- MCP: `kanban_create_task`, `kanban_update_task` — `urgency` в inputSchema (enum h/m/l, nullable).
- Экспорт `/api/export` несёт `urgency` в задачах автоматически (через `TASK_COLUMNS`).
- UI: квадратик 11px слева от `#id` в канбан-карточке, таблице и календарной карточке:
  h → `--urg-high`, m → `--urg-mid`, l → `--urg-low`; NULL → ничего.
  Таблица: колонка «Срочность» (сортировка h > m > l > null). Модалка: select `#mf-urgency`
  (— / Высокая / Средняя / Низкая + i18n).

## 2. Доступ к проектам (не-админы)

- Новая таблица (миграция v8):
  ```sql
  CREATE TABLE IF NOT EXISTS project_access (
    project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES kbar_user(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
  )
  ```
- Видимость:
  - **admin** (сессия): все проекты и задачи, как раньше.
  - **bearer-токен**: все проекты (не скоупится — осознанно, токены только у админа).
  - **member (сессия)**: только проекты из `project_access`
    (`user_id = session.user_id`); задачи — только `project_id IS NOT NULL` и проект
    в доступе (задачи «без проекта» членам не видны). Чужой проект в
    `GET /api/tasks/:id` → 404.
- Мутации member'ом: create/patch/move на недоступный проект → 403 «Нет доступа к проекту»
  (в PATCH проверяется целевой `project_id`; у «чужой» задачи create/patch → 404/403).
  Создать задачу «без проекта» member'ом → 403.
- Роуты (только admin-сессия; bearer-токенам 403, как у других admin-роутов):
  - `GET /api/projects/:id/access` → `{"user_ids":[…]}`
  - `PUT /api/projects/:id/access` ← `{"user_ids":[…]}` (полный replace-set;
    не существующие user_id → 400; последний админ не удаляется из ничего — доступ
    роли не ограничивает админов).
- UI: пункт «Доступ» в dots-меню проекта (только при `state.me.role === 'admin'`);
  модалка с чекбоксами пользователей; сохранить = PUT; после — reload.
- `/api/me` отдаёт `role` (уже отдавал).

## 3. Тема оформления

- localStorage `kanban.theme`: `system | light | dark` (по умолчанию `system`).
- Переключатель в попапе настроек (кнопки по образцу языковых) —
  «Системная / Светлая / Тёмная» (i18n `settings.theme*`).
- Реализация: `document.documentElement.dataset.theme = 'dark'|''`;
  при `system` — по `matchMedia('(prefers-color-scheme: dark)')` + подписка на изменения.
- CSS: все цветовые `:root`-переменные переопределяются в `[data-theme="dark"]`;
  зашитые светлые литералы (≈30 мест) вынесены в токены:
  `--bg-input, --bg-subtle, --bg-subtle-2, --bg-th, --bg-chip, --border-hover,
  --scrollbar, --hover-overlay` (+ dark-значения).
- `<meta name="color-scheme">` и `theme-color` в index.html переключаются из JS.

## 4. Баг-фиксы v9

- **Кнопка «+ Новый» вверху колонки канбана**: порядок колонки
  `.col-head → .col-foot(кнопка) → .col-cards`; инлайн-форма по-прежнему в `.col-foot`.
  В таблице кнопка добавления — в шапке таблицы (справа), вместо подвала.
- **«Без срока» в календаре сворачиваемый**: заголовок-кнопка с шевроном;
  `collapsed` скрывает `.cal-nodue-cards`; состояние в localStorage
  `kanban.calNoDueCollapsed`; счётчик виден всегда.

## Баг-фиксы из истории (актуальны, не сломать)

1. Сравнения id — `String(a) === String(b)`.
2. Никакой серверной сортировки канбана (position не пересчитывается).
3. Drag на пустую колонку — `targetStage` из `data-stage` колонки.
4. Custom-поля: NUMBER принимает число ИЛИ строку-число; CHECKBOX — `'1'/'0'/'true'/'false'`.
5. Archived-проект: клики через `.project-open`.
6. Markdown: HTML всегда экранируется (`escapeHtmlAttr` первым шагом); превью по умолчанию.
7. Тесты: `.test/kanban-ws-test-v2.js` (63+), `.test/kanban-mobile-test.js` (35) — зелёные до деплоя.
8. Календарь не трогает position/stage (только `due_at`), `state.calDragged ≠ state.dragged`.
9. Полный токен показывается один раз (в БД — sha256).
10. CSP `style-src 'unsafe-inline'` обязателен (инлайн-цвета); `script-src 'self'`.
11. Стадии динамические (`is_done` вместо `stage==='COMPLETED'`).
12. `state.dragged` сбрасывается в `moveProj()`/dragend.
13. `tr()` — не перекрывать переменными (в т.ч. в новых циклах).
14. Engine duality: общий SQL-подмножество SQLite/PG; без `INSERT OR REPLACE`/`rowid`.
15. Mobile ≤720px: drawer, `--safe-b`, лейблы в `<span class="vs-label">`.
16. Rate-limits до чтения тела (login/setup/mcp).
17. Setup transactional (re-check в транзакции).
18. Сравнение setup-токена — `timingSafeEqual` поверх sha256.
19. Публичная нейтральность: никаких личных имён/IP/путей.