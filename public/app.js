/* ============================================================
   Kanban — vanilla JS SPA, Twenty CRM styling
   Multilingual (EN default, ZH, RU — switcher in the sidebar)
   ============================================================ */
'use strict';

/* ---------- i18n ---------- */

const I18N = {
  en: {
    /* login / setup */
    'login.title': 'Kanban',
    'login.subtitle': 'Sign in to your workspace',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.invalid': 'Invalid username or password',
    'login.rate': 'Too many attempts. Wait a minute.',
    'login.failed': 'Sign-in failed',
    'login.unavailable': 'Server unreachable',
    'setup.title': 'Welcome to Kanban',
    'setup.desc': 'Create the administrator account to finish setting up. You can add more users later in Settings.',
    'setup.username': 'Username',
    'setup.username_hint': '2–32 characters: latin letters, digits, dot, dash, underscore',
    'setup.display_name': 'Display name (optional)',
    'setup.display_name_hint': 'Shown on the board; defaults to the username',
    'setup.password': 'Password',
    'setup.password_hint': 'At least 8 characters',
    'setup.confirm': 'Confirm password',
    'setup.mismatch': 'Passwords do not match',
    'setup.submit': 'Create account and start',
    'setup.done_title': 'All set',
    'setup.token': 'Setup token (if configured)',
    /* common */
    'cancel': 'Cancel',
    'save': 'Save',
    'create': 'Create',
    'add': 'Add',
    'delete': 'Delete',
    'rename': 'Rename',
    'copy': 'Copy',
    'close': 'Close',
    'today': 'Today',
    'loading': 'Loading…',
    'empty': 'Nothing here yet',
    /* sidebar */
    'sidebar.workspace': 'Workspace',
    'sidebar.all_tasks': 'All tasks',
    'sidebar.no_project': 'No project',
    'sidebar.no_project_hint': 'Tasks without a project',
    'sidebar.new_project': 'New project',
    'sidebar.project_name': 'Project name',
    'sidebar.assignees': 'Assignees',
    'sidebar.add_assignee': 'Add assignee',
    'sidebar.assignee_name': 'Assignee name',
    'sidebar.nobody': 'Nobody yet',
    'sidebar.agents': 'Agents',
    'sidebar.agents_tokens': 'Agents & tokens',
    'sidebar.journal': 'Journal',
    'sidebar.users': 'Users',
    'sidebar.settings': 'Settings',
    'sidebar.sign_out': 'Sign out',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.theme_system': 'System',
    'settings.theme_light': 'Light',
    'settings.theme_dark': 'Dark',
    'settings.change_password': 'Change password',
    'settings.current_password': 'Current password',
    'settings.new_password': 'New password',
    'settings.repeat_password': 'Repeat new password',
    'settings.mismatch': 'Passwords do not match',
    'settings.wrong_current': 'Current password is incorrect',
    'settings.saved': 'Password updated',
    'settings.fail_min': 'Password must be at least 8 characters',
    'settings.fail_digits': 'Password cannot consist of digits only',
    'settings.fail_repeat': 'Password cannot be a single repeated character',
    'settings.fail_classes': 'Password needs at least 2 character classes (letters, digits, symbols) or 12+ characters',
    'sidebar.expand': 'Expand menu',
    'sidebar.collapse': 'Collapse menu',
    'sidebar.to_archive': 'To archive',
    'sidebar.from_archive': 'From archive',
    /* board */
    'board.tasks': 'Tasks',
    'board.calendar': 'Calendar',
    'board.kanban': 'Kanban',
    'board.table': 'Table',
    'board.no_due': 'No due date',
    'board.new_task': 'New task',
    'board.no_tasks': 'No tasks yet',
    'board.overdue': 'overdue',
    /* card modal */
    'card.title': 'Task title',
    'card.notes': 'Notes',
    'card.due': 'Due date',
    'card.stage': 'Stage',
    'card.assignee': 'Assignee',
    'card.project': 'Project',
    'card.unassigned': 'Unassigned',
    'card.delete_confirm': 'Click again to delete',
    'card.moved_to': 'Task moved to ',
    'task.urgency': 'Urgency',
    'task.urg_h': 'High',
    'task.urg_m': 'Medium',
    'task.urg_l': 'Low',
    /* fields panel */
    'fields.panel': 'Field settings',
    'fields.add': 'Add field',
    'fields.name': 'Field name',
    'fields.always_visible': 'Title is always displayed',
    'fields.type_text': 'Text',
    'fields.type_number': 'Number',
    'fields.type_date': 'Date',
    'fields.type_checkbox': 'Checkbox',
    /* stages panel */
    'stages.panel': 'Stages & pipeline',
    'stages.add': 'Add stage',
    'stages.name': 'Stage name',
    'stages.finish': 'finish',
    'stages.hint': 'order, name, visibility',
    'stages.delete_warn': 'Click again — tasks will move to the neighboring stage',
    /* agents modal */
    'agents.title': 'Agents & tokens',
    'agents.mcp_hint': 'MCP server:',
    'agents.auth_hint': 'auth:',
    'agents.tools_hint': 'tools:',
    'agents.none': 'No tokens yet. Create the first one to connect an agent.',
    'agents.name': 'Agent name (e.g. “Planner”)',
    'agents.scope_write': 'write',
    'agents.scope_read': 'read-only',
    'agents.create': 'Create token',
    'agents.created': 'Token created. Copy it now — it is not shown again:',
    'agents.warn': 'The token grants full access (or read-only per scope) until revoked. Treat it like a password.',
    'agents.prefix': 'prefix',
    'agents.never_used': '· never used',
    'agents.last_used': '· used',
    'agents.revoke': 'Revoke',
    'agents.delete_record': 'Delete record',
    'agents.revoked': 'revoked',
    'agents.expired': 'expired',
    'agents.active': 'active',
    'agents.copy_fail': 'Copy failed — select the text manually',
    'agents.name_required': 'Enter a token name',
    /* journal */
    'audit.title': 'Activity journal',
    /* users modal */
    'users.title': 'Users',
    'users.none': 'No users yet.',
    'users.username': 'Username',
    'users.display_name': 'Display name',
    'users.role': 'Role',
    'users.role_admin': 'admin',
    'users.role_member': 'member',
    'users.password': 'Password',
    'users.password_hint': 'leave empty to keep the current password',
    'users.created': 'User created',
    'users.last_login': 'last sign-in',
    'users.never': 'never',
    'users.you': 'you',
    'users.name_required': 'Enter a username',
    'users.pass_required': 'Enter a password (min. 8 characters)',
    /* toasts */
    'toast.rename_failed': 'Rename failed',
    'toast.save_failed': 'Save failed',
    'toast.move_failed': 'Move failed',
    'toast.reschedule_failed': 'Reschedule failed',
    'toast.delete_failed': 'Delete failed',
    'toast.copy_fail': 'Copy failed — select the text manually',
    /* misc */
    'view.title': 'View',
    'misc.date': 'Date',
    'misc.stage': 'Stage',
    'misc.project': 'Project',
    'misc.assignee': 'Assignee',
    'misc.created': 'Created',
    'misc.name': 'Name',
    'misc.task_n': 'Task #',
    'misc.done': 'Done',
    'misc.due': 'Due',
    'misc.enter_name_project': 'Enter a project name',
    'misc.enter_name_assignee': 'Enter an assignee name',
    'misc.enter_name_stage': 'Enter a stage name',
    'misc.enter_name_field': 'Enter a field name',
    'misc.lang': 'Language',
    'board.reload': 'Refresh (tasks may have arrived from agents)',
    'board.menu': 'Menu',
    'cal.prev_month': 'Previous month',
    'cal.next_month': 'Next month',
    'cal.show_day': 'Show all tasks of the day',
    'misc.copied': 'Copied',
    'misc.field': 'Field',
    'misc.bad_server_reply': 'Unexpected server reply',
    'misc.field_added': 'Field added',
    'misc.field_deleted': 'Field deleted',
    'misc.stages_done_flag': 'Finishing stage: tasks here count as done',
    'misc.stage_deleted_to': 'Stage deleted, tasks moved to',
    'misc.stage_added': 'Stage added',
    'misc.created_short': 'created',
    'misc.check': 'Checkbox',
    'misc.dblclick': 'Double-click opens the card',
    'misc.sort': 'Sort',
    'misc.keep_option': '(not in the list)',
    'misc.stage_gone': '(stage deleted?)',
    'misc.project_gone': '(project deleted?)',
    'misc.notes_empty': 'Empty',
    'misc.editor': 'Editor',
    'misc.preview': 'Preview',
    'misc.delete_confirm_task': 'Delete this task?',
    'misc.create_project_first': 'Create a project first',
    'misc.new_task_default': 'New task',
    'misc.delete_with_tasks': 'Delete with tasks?',
    'misc.confirm_short': 'Sure?',
    'fields.name_placeholder': 'Field name',
    'stages.name_placeholder': 'Stage name',
    'stages.is_done_label': 'finishing stage',
    'kanban.new': 'New',
    'card.title_placeholder': 'Task title',
    'misc.show_col': 'Show the column on the board',
    'misc.click_rename': 'Click to rename',

    'fields.drag': 'Drag to reorder',
    'fields.show': 'Show in this view',
    'misc.more': 'More',
    'misc.task_deleted': 'Task deleted',
    'misc.project_archived': 'Project archived',
    'misc.project_unarchived': 'Project restored from archive',
    'misc.project_deleted': 'Project deleted',
    'misc.failed_update': 'Update failed',
    'misc.enter_title': 'Enter a task title',
    'misc.empty_title': 'Title cannot be empty',
    'misc.tasks_no_due': 'No due date',
    'misc.day_more': 'More',
    'proj.access': 'Access',
    'access.load_failed': 'Failed to load users',
    'access.saved': 'Access updated',
  },
  ru: {
    'login.title': 'Kanban',
    'login.subtitle': 'Войдите в своё рабочее пространство',
    'login.username': 'Логин',
    'login.password': 'Пароль',
    'login.submit': 'Войти',
    'login.invalid': 'Неверный логин или пароль',
    'login.rate': 'Слишком много попыток. Подождите минуту.',
    'login.failed': 'Ошибка входа',
    'login.unavailable': 'Сервер недоступен',
    'setup.title': 'Добро пожаловать в Kanban',
    'setup.desc': 'Создайте учётную запись администратора, чтобы завершить настройку. Пользователей можно добавлять позже в настройках.',
    'setup.username': 'Логин',
    'setup.username_hint': '2–32 символа: латиница, цифры, точка, дефис, подчёркивание',
    'setup.display_name': 'Отображаемое имя (необязательно)',
    'setup.display_name_hint': 'Показывается на доске; по умолчанию — логин',
    'setup.password': 'Пароль',
    'setup.password_hint': 'Минимум 8 символов',
    'setup.confirm': 'Повторите пароль',
    'setup.mismatch': 'Пароли не совпадают',
    'setup.submit': 'Создать учётную запись и начать',
    'setup.done_title': 'Всё готово',
    'setup.token': 'Токен настройки (если задан)',
    'cancel': 'Отмена',
    'save': 'Сохранить',
    'create': 'Создать',
    'add': 'Добавить',
    'delete': 'Удалить',
    'rename': 'Переименовать',
    'copy': 'Копировать',
    'close': 'Закрыть',
    'today': 'Сегодня',
    'loading': 'Загрузка…',
    'empty': 'Пока пусто',
    'sidebar.workspace': 'Рабочая область',
    'sidebar.all_tasks': 'Все задачи',
    'sidebar.no_project': 'Без проекта',
    'sidebar.no_project_hint': 'Задачи без проекта',
    'sidebar.new_project': 'Новый проект',
    'sidebar.project_name': 'Имя проекта',
    'sidebar.assignees': 'Исполнители',
    'sidebar.add_assignee': 'Добавить исполнителя',
    'sidebar.assignee_name': 'Имя исполнителя',
    'sidebar.nobody': 'Пока никого нет',
    'sidebar.agents': 'Агенты',
    'sidebar.agents_tokens': 'Агенты и токены',
    'sidebar.journal': 'Журнал',
    'sidebar.users': 'Пользователи',
    'sidebar.settings': 'Настройки',
    'sidebar.sign_out': 'Выйти',
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.theme': 'Тема',
    'settings.theme_system': 'Системная',
    'settings.theme_light': 'Светлая',
    'settings.theme_dark': 'Тёмная',
    'settings.change_password': 'Смена пароля',
    'settings.current_password': 'Текущий пароль',
    'settings.new_password': 'Новый пароль',
    'settings.repeat_password': 'Повторите новый пароль',
    'settings.mismatch': 'Пароли не совпадают',
    'settings.wrong_current': 'Текущий пароль неверен',
    'settings.saved': 'Пароль обновлён',
    'settings.fail_min': 'Пароль должен быть не менее 8 символов',
    'settings.fail_digits': 'Пароль не может состоять только из цифр',
    'settings.fail_repeat': 'Пароль не может быть одним повторяющимся символом',
    'settings.fail_classes': 'Паролю нужны минимум 2 класса символов (буквы, цифры, спецсимволы) или 12+ символов',
    'sidebar.expand': 'Развернуть меню',
    'sidebar.collapse': 'Свернуть меню',
    'sidebar.to_archive': 'В архив',
    'sidebar.from_archive': 'Из архива',
    'board.tasks': 'Задачи',
    'board.calendar': 'Календарь',
    'board.kanban': 'Канбан',
    'board.table': 'Таблица',
    'board.no_due': 'Без срока',
    'board.new_task': 'Новая задача',
    'board.no_tasks': 'Задач пока нет',
    'board.overdue': 'просрочена',
    'card.title': 'Название задачи',
    'card.notes': 'Заметки',
    'card.due': 'Срок',
    'card.stage': 'Этап',
    'card.assignee': 'Исполнитель',
    'card.project': 'Проект',
    'card.unassigned': 'Не назначен',
    'card.delete_confirm': 'Нажмите ещё раз, чтобы удалить',
    'card.moved_to': 'Задача перенесена в «',
    'task.urgency': 'Срочность',
    'task.urg_h': 'Высокая',
    'task.urg_m': 'Средняя',
    'task.urg_l': 'Низкая',
    'fields.panel': 'Настройки полей',
    'fields.add': 'Добавить поле',
    'fields.name': 'Название поля',
    'fields.always_visible': 'Название всегда отображается',
    'fields.type_text': 'Текст',
    'fields.type_number': 'Число',
    'fields.type_date': 'Дата',
    'fields.type_checkbox': 'Флажок',
    'stages.panel': 'Этапы и пайплайн',
    'stages.add': 'Добавить этап',
    'stages.name': 'Название этапа',
    'stages.finish': 'финиш',
    'stages.hint': 'порядок, имя, видимость',
    'stages.delete_warn': 'Нажмите ещё раз — задачи переедут на соседний этап',
    'agents.title': 'Агенты и токены',
    'agents.mcp_hint': 'MCP-сервер:',
    'agents.auth_hint': 'авторизация:',
    'agents.tools_hint': 'инструменты:',
    'agents.none': 'Токенов пока нет. Создайте первый — подключите агента.',
    'agents.name': 'Имя агента (напр. «Планировщик»)',
    'agents.scope_write': 'запись',
    'agents.scope_read': 'только чтение',
    'agents.create': 'Создать токен',
    'agents.created': 'Токен создан. Скопируйте его сейчас — позже он не показывается:',
    'agents.warn': 'Токен даёт полный доступ (или чтение — по scope) до отзыва. Храните как пароль.',
    'agents.prefix': 'префикс',
    'agents.never_used': '· ещё не использовался',
    'agents.last_used': '· использован',
    'agents.revoke': 'Отозвать',
    'agents.delete_record': 'Удалить запись',
    'agents.revoked': 'отозван',
    'agents.expired': 'истёк',
    'agents.active': 'активен',
    'agents.copy_fail': 'Не удалось скопировать — выделите текст',
    'agents.name_required': 'Введите имя токена',
    'audit.title': 'Журнал действий',
    'users.title': 'Пользователи',
    'users.none': 'Пользователей пока нет.',
    'users.username': 'Логин',
    'users.display_name': 'Отображаемое имя',
    'users.role': 'Роль',
    'users.role_admin': 'админ',
    'users.role_member': 'участник',
    'users.password': 'Пароль',
    'users.password_hint': 'оставьте пустым, чтобы не менять пароль',
    'users.created': 'Пользователь создан',
    'users.last_login': 'последний вход',
    'users.never': 'никогда',
    'users.you': 'вы',
    'users.name_required': 'Введите логин',
    'users.pass_required': 'Введите пароль (мин. 8 символов)',
    'toast.rename_failed': 'Не удалось переименовать',
    'toast.save_failed': 'Не удалось сохранить',
    'toast.move_failed': 'Не удалось переместить',
    'toast.reschedule_failed': 'Не удалось перенести срок',
    'toast.delete_failed': 'Не удалось удалить',
    'toast.copy_fail': 'Не удалось скопировать — выделите текст',
    'view.title': 'Просмотр',
    'misc.date': 'Дата',
    'misc.stage': 'Этап',
    'misc.project': 'Проект',
    'misc.assignee': 'Исполнитель',
    'misc.created': 'Создана',
    'misc.name': 'Название',
    'misc.task_n': 'Задача #',
    'misc.done': 'Готово',
    'misc.due': 'Срок',
    'misc.enter_name_project': 'Введите имя проекта',
    'misc.enter_name_assignee': 'Введите имя исполнителя',
    'misc.enter_name_stage': 'Введите название этапа',
    'misc.enter_name_field': 'Введите название поля',
    'misc.lang': 'Язык',
    'board.reload': 'Обновить данные (задачи могли прийти от агентов)',
    'board.menu': 'Меню',
    'cal.prev_month': 'Предыдущий месяц',
    'cal.next_month': 'Следующий месяц',
    'cal.show_day': 'Показать все задачи дня',
    'misc.copied': 'Скопировано',
    'misc.field': 'Поле',
    'misc.bad_server_reply': 'Некорректный ответ сервера',
    'misc.field_added': 'Поле добавлено',
    'misc.field_deleted': 'Поле удалено',
    'misc.stages_done_flag': 'Завершающий этап: задачи на нём считаются выполненными',
    'misc.stage_deleted_to': 'Этап удалён, задачи переехали на',
    'misc.stage_added': 'Этап добавлен',
    'misc.created_short': 'создана',
    'misc.check': 'Отметка',
    'misc.dblclick': 'Двойной клик — открыть карточку',
    'misc.sort': 'Сортировать',
    'misc.keep_option': '(нет в списке)',
    'misc.stage_gone': '(этап удалён?)',
    'misc.project_gone': '(проект удалён?)',
    'misc.notes_empty': 'Пусто',
    'misc.editor': 'Редактор',
    'misc.preview': 'Просмотр',
    'misc.delete_confirm_task': 'Удалить эту задачу?',
    'misc.create_project_first': 'Сначала создайте проект',
    'misc.new_task_default': 'Новая задача',
    'misc.delete_with_tasks': 'Удалить с задачами?',
    'misc.confirm_short': 'Точно?',
    'fields.name_placeholder': 'Название поля',
    'stages.name_placeholder': 'Название этапа',
    'stages.is_done_label': 'завершающий этап',
    'kanban.new': 'Новый',
    'card.title_placeholder': 'Название задачи',
    'misc.show_col': 'Показывать колонку на доске',
    'misc.click_rename': 'Кликните, чтобы переименовать',

    'fields.drag': 'Перетащите, чтобы изменить порядок',
    'fields.show': 'Показывать в представлении',
    'misc.more': 'Ещё',
    'misc.task_deleted': 'Задача удалена',
    'misc.project_archived': 'Проект в архиве',
    'misc.project_unarchived': 'Проект извлечён из архива',
    'misc.project_deleted': 'Проект удалён',
    'misc.failed_update': 'Не удалось обновить',
    'misc.enter_title': 'Введите название задачи',
    'misc.empty_title': 'Название не может быть пустым',
    'misc.tasks_no_due': 'Без срока',
    'misc.day_more': 'Ещё',
    'proj.access': 'Доступ',
    'access.load_failed': 'Не удалось загрузить пользователей',
    'access.saved': 'Доступ обновлён',
  },
  zh: {
    'login.title': '看板',
    'login.subtitle': '登录到您的工作区',
    'login.username': '用户名',
    'login.password': '密码',
    'login.submit': '登录',
    'login.invalid': '用户名或密码错误',
    'login.rate': '尝试次数过多，请稍后再试。',
    'login.failed': '登录失败',
    'login.unavailable': '服务器无法连接',
    'setup.title': '欢迎使用看板',
    'setup.desc': '创建管理员帐户以完成设置。之后可以在设置中添加更多用户。',
    'setup.username': '用户名',
    'setup.username_hint': '2–32 个字符：字母、数字、点、连字符、下划线',
    'setup.display_name': '显示名称（可选）',
    'setup.display_name_hint': '显示在版面上；默认为用户名',
    'setup.password': '密码',
    'setup.password_hint': '至少 8 个字符',
    'setup.confirm': '确认密码',
    'setup.mismatch': '两次输入的密码不一致',
    'setup.submit': '创建帐户并开始',
    'setup.done_title': '设置完成',
    'setup.token': '设置令牌（如已配置）',
    'cancel': '取消',
    'save': '保存',
    'create': '创建',
    'add': '添加',
    'delete': '删除',
    'rename': '重命名',
    'copy': '复制',
    'close': '关闭',
    'today': '今天',
    'loading': '加载中…',
    'empty': '暂无内容',
    'sidebar.workspace': '工作区',
    'sidebar.all_tasks': '所有任务',
    'sidebar.no_project': '无项目',
    'sidebar.no_project_hint': '未分配项目的任务',
    'sidebar.new_project': '新建项目',
    'sidebar.project_name': '项目名称',
    'sidebar.assignees': '负责人',
    'sidebar.add_assignee': '添加负责人',
    'sidebar.assignee_name': '负责人姓名',
    'sidebar.nobody': '还没有人',
    'sidebar.agents': '智能体',
    'sidebar.agents_tokens': '智能体与令牌',
    'sidebar.journal': '日志',
    'sidebar.users': '用户',
    'sidebar.settings': '设置',
    'sidebar.sign_out': '退出登录',
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.theme_system': '跟随系统',
    'settings.theme_light': '浅色',
    'settings.theme_dark': '深色',
    'settings.change_password': '修改密码',
    'settings.current_password': '当前密码',
    'settings.new_password': '新密码',
    'settings.repeat_password': '重复新密码',
    'settings.mismatch': '两次输入的密码不一致',
    'settings.wrong_current': '当前密码不正确',
    'settings.saved': '密码已更新',
    'settings.fail_min': '密码至少需要 8 个字符',
    'settings.fail_digits': '密码不能只包含数字',
    'settings.fail_repeat': '密码不能是同一个字符的重复',
    'settings.fail_classes': '密码需要至少 2 种字符类别（字母、数字、符号）或 12 个以上字符',
    'sidebar.expand': '展开菜单',
    'sidebar.collapse': '折叠菜单',
    'sidebar.to_archive': '移入归档',
    'sidebar.from_archive': '移出归档',
    'board.tasks': '任务',
    'board.calendar': '日历',
    'board.kanban': '看板',
    'board.table': '表格',
    'board.no_due': '无截止日期',
    'board.new_task': '新任务',
    'board.no_tasks': '暂无任务',
    'board.overdue': '已逾期',
    'card.title': '任务标题',
    'card.notes': '备注',
    'card.due': '截止日期',
    'card.stage': '阶段',
    'card.assignee': '负责人',
    'card.project': '项目',
    'card.unassigned': '未分配',
    'card.delete_confirm': '再次点击以删除',
    'card.moved_to': '任务已移动到「',
    'task.urgency': '紧急',
    'task.urg_h': '高',
    'task.urg_m': '中',
    'task.urg_l': '低',
    'fields.panel': '字段设置',
    'fields.add': '添加字段',
    'fields.name': '字段名称',
    'fields.always_visible': '标题始终显示',
    'fields.type_text': '文本',
    'fields.type_number': '数字',
    'fields.type_date': '日期',
    'fields.type_checkbox': '复选框',
    'stages.panel': '阶段与流程',
    'stages.add': '添加阶段',
    'stages.name': '阶段名称',
    'stages.finish': '完结',
    'stages.hint': '顺序、名称、可见性',
    'stages.delete_warn': '再次点击 — 任务将移动到相邻阶段',
    'agents.title': '智能体与令牌',
    'agents.mcp_hint': 'MCP 服务器：',
    'agents.auth_hint': '认证：',
    'agents.tools_hint': '工具：',
    'agents.none': '还没有令牌。创建第一个令牌以连接智能体。',
    'agents.name': '智能体名称（例如“规划器”）',
    'agents.scope_write': '写入',
    'agents.scope_read': '只读',
    'agents.create': '创建令牌',
    'agents.created': '令牌已创建。请立即复制 — 之后不再显示：',
    'agents.warn': '令牌在撤销前拥有完全访问权限（或按 scope 只读）。请像密码一样保管。',
    'agents.prefix': '前缀',
    'agents.never_used': '· 从未使用',
    'agents.last_used': '· 上次使用',
    'agents.revoke': '撤销',
    'agents.delete_record': '删除记录',
    'agents.revoked': '已撤销',
    'agents.expired': '已过期',
    'agents.active': '有效',
    'agents.copy_fail': '复制失败 — 请手动选中文本',
    'agents.name_required': '请输入令牌名称',
    'audit.title': '操作日志',
    'users.title': '用户',
    'users.none': '还没有用户。',
    'users.username': '用户名',
    'users.display_name': '显示名称',
    'users.role': '角色',
    'users.role_admin': '管理员',
    'users.role_member': '成员',
    'users.password': '密码',
    'users.password_hint': '留空则不修改密码',
    'users.created': '用户已创建',
    'users.last_login': '上次登录',
    'users.never': '从未',
    'users.you': '您',
    'users.name_required': '请输入用户名',
    'users.pass_required': '请输入密码（至少 8 个字符）',
    'toast.rename_failed': '重命名失败',
    'toast.save_failed': '保存失败',
    'toast.move_failed': '移动失败',
    'toast.reschedule_failed': '改期失败',
    'toast.delete_failed': '删除失败',
    'toast.copy_fail': '复制失败 — 请手动选中文本',
    'view.title': '视图',
    'misc.date': '日期',
    'misc.stage': '阶段',
    'misc.project': '项目',
    'misc.assignee': '负责人',
    'misc.created': '创建于',
    'misc.name': '名称',
    'misc.task_n': '任务 #',
    'misc.done': '完成',
    'misc.due': '截止',
    'misc.enter_name_project': '请输入项目名称',
    'misc.enter_name_assignee': '请输入负责人姓名',
    'misc.enter_name_stage': '请输入阶段名称',
    'misc.enter_name_field': '请输入字段名称',
    'misc.lang': '语言',
    'board.reload': '刷新（任务可能来自智能体）',
    'board.menu': '菜单',
    'cal.prev_month': '上个月',
    'cal.next_month': '下个月',
    'cal.show_day': '显示当天的所有任务',
    'misc.copied': '已复制',
    'misc.field': '字段',
    'misc.bad_server_reply': '服务器响应异常',
    'misc.field_added': '字段已添加',
    'misc.field_deleted': '字段已删除',
    'misc.stages_done_flag': '完结阶段：此阶段的任务视为已完成',
    'misc.stage_deleted_to': '阶段已删除，任务已移动到',
    'misc.stage_added': '阶段已添加',
    'misc.created_short': '创建于',
    'misc.check': '勾选',
    'misc.dblclick': '双击打开卡片',
    'misc.sort': '排序',
    'misc.keep_option': '(不在列表中)',
    'misc.stage_gone': '(阶段已删除？)',
    'misc.project_gone': '(项目已删除？)',
    'misc.notes_empty': '空',
    'misc.editor': '编辑',
    'misc.preview': '预览',
    'misc.delete_confirm_task': '删除此任务？',
    'misc.create_project_first': '请先创建项目',
    'misc.new_task_default': '新任务',
    'misc.delete_with_tasks': '连同任务一起删除？',
    'misc.confirm_short': '确定？',
    'fields.name_placeholder': '字段名称',
    'stages.name_placeholder': '阶段名称',
    'stages.is_done_label': '完结阶段',
    'kanban.new': '新建',
    'card.title_placeholder': '任务标题',
    'misc.show_col': '在版面上显示此列',
    'misc.click_rename': '点击重命名',

    'fields.drag': '拖拽以调整顺序',
    'fields.show': '在此视图中显示',
    'misc.more': '更多',
    'misc.task_deleted': '任务已删除',
    'misc.project_archived': '项目已归档',
    'misc.project_unarchived': '项目已从归档恢复',
    'misc.project_deleted': '项目已删除',
    'misc.failed_update': '更新失败',
    'misc.enter_title': '请输入任务标题',
    'misc.empty_title': '标题不能为空',
    'misc.tasks_no_due': '无截止日期',
    'misc.day_more': '更多',
    'proj.access': '访问',
    'access.load_failed': '无法加载用户',
    'access.saved': '访问权限已更新',
  },
};

const I18N_LOCALES = ['en', 'ru', 'zh'];
const I18N_NAMES = { en: 'English', ru: 'Русский', zh: '中文' };

function tr(key) {
  const lang = state && state.lang ? state.lang : 'en';
  const dict = I18N[lang] || I18N.en;
  return dict[key] !== undefined ? dict[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
}

function currentLocaleTag() {
  return state && state.lang === 'ru' ? 'ru-RU' : (state && state.lang === 'zh' ? 'zh-CN' : 'en-US');
}

/* ---------- Константы ---------- */

/* Этапы динамические (GET /api/stages): id, label, color, position, is_visible, is_done.
   До загрузки списка используем нейтральный сид — на сервере этапы уже созданы
   миграцией; фронт тянет фактический список сразу после логина. */
const STAGE_SEED = [
  { id: 'DISCUSSION',   label: 'Discuss',     color: '#6BBFFF', is_visible: true,  is_done: false },
  { id: 'IN_PROGRESS',  label: 'In progress', color: '#926FFF', is_visible: true,  is_done: false },
  { id: 'REVIEW',       label: 'Review',      color: '#FF913B', is_visible: true,  is_done: false },
  { id: 'COMPLETED',    label: 'Done',        color: '#55D379', is_visible: true,  is_done: true  },
];

const PALETTE = ['#6BBFFF', '#926FFF', '#FF913B', '#FCDB51', '#55D379', '#FF6250', '#4662D5', '#EB6F6F'];

/* светлые цвета палитры — на них тёмный текст кружка */
const LIGHT_COLORS = new Set(['#6BBFFF', '#FCDB51', '#55D379']);

/* Дни недели и месяцы — по текущей локали (I18N). */
const WEEKDAY_MIN = { en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], zh: ['一', '二', '三', '四', '五', '六', '日'] };

/* ---------- Динамические этапы: хелперы ---------- */

function stagesAll() {
  return state.stages.length ? state.stages : STAGE_SEED;
}

function visibleStages() {
  return stagesAll().filter((s) => s.is_visible !== false);
}

function stageById(id) {
  return stagesAll().find((s) => String(s.id) === String(id)) || null;
}

function stageLabel(id) {
  const s = stageById(id);
  return s ? s.label : String(id || '');
}

function stageColor(id) {
  const s = stageById(id);
  return (s && s.color) || '#c9c9d1';
}

function isDoneStage(id) {
  const s = stageById(id);
  return !!(s && s.is_done);
}

/* Яркость hex-цвета (0..255): тёмный текст на светлых чипах. */
function hexLuma(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/* Сид-этапы сохранили прежние цвета текста; новые — по яркости цвета. */
const SEED_TEXT_DARK = new Set(['REVIEW', 'COMPLETED']);
function stageTextDark(id) {
  const s = stageById(id);
  if (!s) return false;
  if (SEED_TEXT_DARK.has(String(s.id))) return true;
  return hexLuma(s.color) > 168;
}

/* системные ключи полей представления; подписи — локализуемые (I18N) */
const SYSTEM_KEYS = ['title', 'stage', 'project', 'due_at', 'assignee', 'urgency', 'created_at'];
const FIELD_LABELS = {
  get title() { return tr('card.title'); },
  get stage() { return tr('misc.stage'); },
  get project() { return tr('misc.project'); },
  get due_at() { return tr('misc.due'); },
  get assignee() { return tr('misc.assignee'); },
  get urgency() { return tr('task.urgency'); },
  get created_at() { return tr('misc.created'); },
};
const TYPE_LABELS = {
  get TEXT() { return tr('fields.type_text'); },
  get NUMBER() { return tr('fields.type_number'); },
  get DATE() { return tr('fields.type_date'); },
  get CHECKBOX() { return tr('fields.type_checkbox'); },
};
/* представления с настройками; VIEW_TYPES для view-fields */
const VIEW_TYPES = ['KANBAN', 'TABLE', 'CALENDAR'];

/* ---------- Иконки (инлайн-SVG) ---------- */

const ICONS = {
  menu: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  chevrons: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 7l-5 5 5 5M18 7l-5 5 5 5"/></svg>',
  chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
  kanban: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9v6M12 9v3M16 9v8"/></svg>',
  table: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18"/></svg>',
  columns: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
  grip: '<svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor"><circle cx="2" cy="2.2" r="1.3"/><circle cx="6" cy="2.2" r="1.3"/><circle cx="2" cy="7" r="1.3"/><circle cx="6" cy="7" r="1.3"/><circle cx="2" cy="11.8" r="1.3"/><circle cx="6" cy="11.8" r="1.3"/></svg>',
  dots: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  chev: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  check: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  calendar: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  user: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
  trash: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  gear: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>',
  filter: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  sort: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6v12M8 18l-3-3M8 18l3-3M16 18V6M16 6l-3 3M16 6l3 3"/></svg>',
  key: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M15 8l3 3"/></svg>',
  journal: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="0.5"/><circle cx="4" cy="12" r="0.5"/><circle cx="4" cy="18" r="0.5"/></svg>',
  bot: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M8 4h8"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>',
  users: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};

/* ---------- API ---------- */

async function api(method, url, body) {
  const opts = { method, credentials: 'same-origin', headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw new Error(tr('login.unavailable'));
  }
  if (res.status === 401) {
    showLogin();
    throw new Error('AUTH_REQUIRED');
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const err = new Error((data && data.error) || ('Error ' + res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- Утилиты ---------- */

const $ = (sel, root) => (root || document).querySelector(sel);
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function avatarColor(name) {
  let h = 0;
  for (const c of String(name || '')) h = (h * 31 + c.codePointAt(0)) % 360;
  return 'hsl(' + h + ', 62%, 86%)';
}

function colorTextOn(c) {
  return LIGHT_COLORS.has(String(c || '').toUpperCase()) ? '#1b1b1f' : '#ffffff';
}

function fmtDate(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  return d.toLocaleDateString(currentLocaleTag(), { day: 'numeric', month: 'short' });
}

function isOverdue(iso) {
  const d = parseDate(iso);
  if (!d) return false;
  const today = new Date();
  d.setHours(23, 59, 59, 999);
  return d < today;
}

/* парсим ISO-строку или 'YYYY-MM-DD' (date input) в Date в локальной зоне */
function parseDate(v) {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, day] = v.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

function dateInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function asList(d, keys) {
  if (Array.isArray(d)) return d;
  for (const k of (keys || ['items'])) {
    if (d && Array.isArray(d[k])) return d[k];
  }
  return [];
}

function rethrowAuth(e) {
  if (e && e.message === 'AUTH_REQUIRED') throw e;
}

function isTrue(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

/* ---------- Справочники: поля, исполнители ---------- */

function isSystemKey(k) { return !String(k).startsWith('custom:'); }

function customFieldById(id) {
  return state.customFields.find((f) => String(f.id) === String(id)) || null;
}

/* Номер задачи для отображения: #<id> */
function taskNum(t) {
  return '#' + (t != null && t.id != null ? t.id : '?');
}

/* Квадратик срочности слева от #id: h/m/l — цветной квадрат, null — ничего. */
function urgencySquareHTML(t) {
  const u = t && t.urgency != null ? String(t.urgency).toLowerCase() : '';
  if (u !== 'h' && u !== 'm' && u !== 'l') return '';
  return '<span class="urg-square urg-' + u + '" title="' + esc(tr('task.urgency') + ': ' + tr('task.urg_' + u)) + '"></span>';
}

function memberById(id) {
  return state.members.find((m) => String(m.id) === String(id)) || null;
}

function assigneeOf(t) {
  return t.assignee_id != null ? memberById(t.assignee_id) : null;
}

function assigneeLabel(t) {
  const m = assigneeOf(t);
  if (m) return m.name;
  return t.assignee || '';
}

function activeCustomFields() {
  return state.customFields
    .filter((f) => f.is_active !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/* значения custom-полей задачи: поддерживаем несколько форм ответа бэкенда */
function taskCustomMap(t) {
  const map = {};
  if (!t) return map;
  if (Array.isArray(t.field_values)) {
    for (const v of t.field_values) {
      if (v && v.field_id != null) map[String(v.field_id)] = v.value_text != null ? v.value_text : v.value;
    }
  }
  if (t.custom_values && typeof t.custom_values === 'object') {
    for (const [k, v] of Object.entries(t.custom_values)) map[String(k)] = v;
  }
  for (const k of Object.keys(t)) {
    const m = /^custom:(.+)$/.exec(k);
    if (m) map[m[1]] = t[k];
  }
  return map;
}

function defaultFieldLabel(key) {
  if (!isSystemKey(key)) {
    const f = customFieldById(key.slice(7));
    return f ? f.name : tr('misc.name');
  }
  return FIELD_LABELS[key] || key;
}

function defaultVisible(vt, key) {
  if (key === 'title') return true;
  if (vt === 'TABLE') return true;
  return key !== 'created_at';
}

function mkLocalRow(vt, key, label) {
  const lbl = label != null ? label : defaultFieldLabel(key);
  return { id: 'local:' + key, field_key: key, label: lbl, position: 0, is_visible: defaultVisible(vt, key), __label0: lbl };
}

function mergeFieldRows(vt, arr) {
  const rows = (Array.isArray(arr) ? arr : [])
    .map((r) => ({
      id: String(r.id != null ? r.id : ''),
      field_key: String(r.field_key != null ? r.field_key : ''),
      label: r.label != null && String(r.label).trim() !== '' ? String(r.label) : defaultFieldLabel(r.field_key),
      position: Number.isFinite(+r.position) ? +r.position : 0,
      is_visible: r.is_visible == null ? defaultVisible(vt, r.field_key) : !!r.is_visible,
    }))
    .filter((r) => r.id && r.field_key)
    .sort((a, b) => a.position - b.position);
  const have = new Set(rows.map((r) => r.field_key));
  for (const k of SYSTEM_KEYS) if (!have.has(k)) rows.push(mkLocalRow(vt, k));
  for (const f of state.customFields) {
    const k = 'custom:' + f.id;
    if (!have.has(k)) rows.push(mkLocalRow(vt, k, f.name));
  }
  const filtered = rows.filter((r) => isSystemKey(r.field_key) || customFieldById(r.field_key.slice(7)));
  for (const r of filtered) if (r.__label0 === undefined) r.__label0 = r.label;
  return filtered;
}

function defaultFieldRows(vt) {
  const rows = SYSTEM_KEYS.map((k) => mkLocalRow(vt, k));
  for (const f of state.customFields) rows.push(mkLocalRow(vt, 'custom:' + f.id, f.name));
  return rows;
}

async function reloadViewFields() {
  for (const vt of VIEW_TYPES) {
    try {
      const d = await api('GET', '/api/view-fields?view=' + vt);
      state.viewFields[vt] = mergeFieldRows(vt, asList(d, ['fields', 'items', 'view_fields']));
    } catch (e) {
      rethrowAuth(e);
      state.viewFields[vt] = defaultFieldRows(vt);
    }
  }
}

async function reloadStages() {
  try {
    const rows = await api('GET', '/api/stages');
    state.stages = Array.isArray(rows) ? rows : [];
  } catch (e) {
    rethrowAuth(e);
    state.stages = [];
  }
}

async function reloadMembers() {
  try {
    state.members = asList(await api('GET', '/api/members'), ['members']);
  } catch (e) {
    rethrowAuth(e);
    state.members = [];
  }
}

/* ---------- Состояние ---------- */

const state = {
  lang: (function () {
    try {
      const saved = localStorage.getItem('kanban.lang');
      if (saved && I18N[saved]) return saved;
    } catch (_) {}
    const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
    return /^ru/i.test(nav) ? 'ru' : (/^zh/i.test(nav) ? 'zh' : 'en');
  })(),
  me: null,                          // текущий пользователь {id, username, role, display_name}
  mobileSideOpen: false,             // мобильная шторка сайдбара открыта
  settingsPop: false,                // открыт попап настроек в подвале сайдбара
  projects: [],
  tasks: [],
  members: [],                       // исполнители
  customFields: [],                  // пользовательские поля
  stages: [],                        // этапы пайплайна (GET /api/stages); пусто → сид
  viewFields: { KANBAN: [], TABLE: [], CALENDAR: [] },
  view: { type: 'all'},              // {type:'all'} | {type:'none'} | {type:'project', id}
  stagesOpen: false,                 // открыта панель настройки этапов
  stageDelArmed: null,               // id этапа с активированной мусоркой
  stAddOpen: false,                  // открыта форма «Добавить этап»
  viewType: 'KANBAN',                // текущий вид: KANBAN | TABLE | CALENDAR (загрузится ниже)
  fieldsOpen: false,                 // открыта панель настроек представления
  fieldsDirty: false,                // есть несохранённые изменения полей
  dragged: null,                     // id перетаскиваемой карточки
  dropProj: null,                    // проект-приёмник при перетаскивании в сайдбар
  stDrag: null,                      // id перетаскиваемого этапа в настройке этапов
  calPop: null,                      // открытый попап «Ещё N»: {key, x, y} | null
  sidebarCollapsed: (function () {
    try { return localStorage.getItem('kanban.sidebarCollapsed') === '1'; } catch (_) { return false; }
  })(),
  tasksCollapsed: (function () {     // свёрнут блок «Задачи» в рабочей области
    try { return localStorage.getItem('kanban.tasksCollapsed') === '1'; } catch (_) { return false; }
  })(),
  calNoDueCollapsed: (function () {  // свёрнут блок «Без срока» в календаре
    try { return localStorage.getItem('kanban.calNoDueCollapsed') === '1'; } catch (_) { return false; }
  })(),
  theme: (function () {               // тема: system | light | dark
    try {
      const th = localStorage.getItem('kanban.theme');
      return (th === 'dark' || th === 'light' || th === 'system') ? th : 'system';
    } catch (_) { return 'system'; }
  })(),
  calDragged: null,                  // id задачи при перетаскивании в календаре
  calCursor: null,                   // 1-е число показанного месяца (инициализация ниже)
  fpAddOpen: false,                  // открыта форма «Добавить поле»
  fieldDelArmed: null,               // id поля с активированной мусоркой
  fpDrag: null,                      // id перетаскиваемой строки в панели
  tableSort: { key: null, dir: 'asc' },
  memberRenameId: null,              // id исполнителя в режиме переименования
  memFormOpen: false,                // открыта форма «Добавить исполнителя»
  ctxMenu: null,                     // открытое контекстное меню
  npOpen: false,                     // открыта инлайн-форма нового проекта
  deleteArmed: false,                // confirm-состояние кнопки «Удалить»
  agentsOpen: false,                 // открыта панель «Агенты и токены»
  tokens: [],                        // список API-токенов (без полных значений)
  auditOpen: false,                  // открыта панель «Журнал»
  audit: [],                         // последние записи журнала
  newToken: null,                    // только что созданный токен (показывается 1 раз)
  tokenDelArmed: null,               // id токена с активированной мусоркой
  users: [],                         // учётные записи (admin)
  newUser: null,                     // только что созданный пользователь
  userDelArmed: null,                // id пользователя с активированной мусоркой
  accessPid: null,                   // открыт попап «Доступ» для проекта (id)
};

/* calCursor: 1-е число текущего месяца; хранится локальной датой */
try {
  const now = new Date();
  state.calCursor = new Date(now.getFullYear(), now.getMonth(), 1);
} catch (_) { state.calCursor = null; }

/* восстановление viewType из localStorage (после объявления state) */
try {
  const savedVT = localStorage.getItem('kanban.viewType');
  if (savedVT === 'TABLE' || savedVT === 'CALENDAR') state.viewType = savedVT;
} catch (_) {}

/* Тема: применяем сохранённую (kanban.theme) сразу при старте */
applyTheme();

/* календарь: попап «Ещё N» закрывается при смене месяца/вида */
state.calPop = null;

/* ---------- Тосты ---------- */

function toast(msg, kind) {
  let host = $('.toasts');
  if (!host) {
    host = el('<div class="toasts"></div>');
    document.body.appendChild(host);
  }
  const tt = el('<div class="toast ' + (kind || 'error') + '">' + esc(msg) + '</div>');
  host.appendChild(tt);
  const kill = () => {
    tt.classList.add('out');
    setTimeout(() => tt.remove(), 220);
  };
  tt.addEventListener('click', kill);
  setTimeout(kill, 4000);
}

/* ---------- Логин ---------- */

/* Сессионных куков нет → сервер на GET / сам отдаёт login.html; здесь
   app.js просто перебрасывает (кнопка «Выйти», истёкшая сессия). */
function showLogin() {
  state.me = null;
  location.replace('/login.html');
}

/* ---------- Язык ---------- */

function langSwitcherHtml() {
  return '<div class="lang-switch">' + I18N_LOCALES.map((l) =>
    '<button type="button" class="lang-opt' + (state.lang === l ? ' on' : '') + '" data-lang="' + l + '">' + I18N_NAMES[l] + '</button>'
  ).join('') + '</div>';
}

/* Переключатель языка: перерисовывает переданный экран (логин/сетап) или всё приложение. */
function wireLangSwitcher(hostEl, rerender) {
  hostEl.querySelectorAll('.lang-opt').forEach((b) => {
    b.addEventListener('click', () => {
      const lang = b.dataset.lang;
      if (!I18N_LOCALES.includes(lang) || lang === state.lang) return;
      state.lang = lang;
      try { localStorage.setItem('kanban.lang', lang); } catch (_) {}
      rerender();
    });
  });
}

/* ---------- Тема: system | light | dark (localStorage kanban.theme) ---------- */

/* dataset.theme на <html>: 'dark' | '' — палитра в style.css ([data-theme="dark"]). */
function applyTheme() {
  const pref = state.theme || 'system';
  let dark = false;
  try {
    if (pref === 'dark') dark = true;
    else if (pref === 'system') dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (_) {
    dark = pref === 'dark';
  }
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  /* meta в head держим в синхроне с палитрой */
  const cs = document.querySelector('meta[name="color-scheme"]');
  if (cs) cs.setAttribute('content', dark ? 'dark' : 'light');
  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', dark ? '#141519' : '#fcfcfc');
  /* favicon перекрашиваем под акцент темы */
  const fav = document.querySelector('link[rel="icon"]');
  if (fav) {
    const accent = dark ? '#5a76e8' : '#4662d5';
    try {
      fav.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='" + accent.replace('#', '%23') + "'/%3E%3Ctext x='16' y='22' font-family='Arial,sans-serif' font-size='16' font-weight='600' fill='%23ffffff' text-anchor='middle'%3EK%3C/text%3E%3C/svg%3E";
    } catch (_) {}
  }
}

/* Пока выбран режим «system», смена системной темы применяется на лету. */
try {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((state.theme || 'system') === 'system') applyTheme();
  });
} catch (_) { /* старые браузеры — не критично */ }

const THEME_OPTIONS = ['system', 'light', 'dark'];

/* ---------- Первичная настройка (setup wizard): публичная страница ----------
   Собственный входной файл (public/setup.html + public/setup.js); app.js
   остается за аутентифицированным приложением. */

/* ---------- Настройки (попап в подвале сайдбара) ---------- */

/* state.settingsPop: null | true — открыт попап настроек подвала. */

function settingsPopHTML() {
  const me = state.me;
  const isAdmin = !!(me && me.role === 'admin');
  return (
    '<div class="side-settings-pop" id="settings-pop" role="dialog">' +
      '<div class="ssp-title">' + esc(tr('settings.title')) + '</div>' +
      '<div class="ssp-label">' + esc(tr('settings.language')) + '</div>' +
      '<div class="ssp-lang">' + I18N_LOCALES.map((l) =>
        '<button type="button" class="ssp-lang-btn' + (state.lang === l ? ' on' : '') + '" data-lang="' + l + '">' + I18N_NAMES[l] + '</button>'
      ).join('') + '</div>' +
      '<div class="ssp-label">' + esc(tr('settings.theme')) + '</div>' +
      '<div class="ssp-theme">' + THEME_OPTIONS.map((th) =>
        '<button type="button" class="ssp-theme-btn' + ((state.theme || 'system') === th ? ' on' : '') + '" data-theme="' + th + '">' + esc(tr('settings.theme_' + th)) + '</button>'
      ).join('') + '</div>' +
      '<form class="ssp-pass" id="pass-form">' +
        '<div class="ssp-label">' + esc(tr('settings.change_password')) + '</div>' +
        '<input id="pw-cur" type="password" placeholder="' + esc(tr('settings.current_password')) + '" autocomplete="current-password" required>' +
        '<input id="pw-new" type="password" placeholder="' + esc(tr('settings.new_password')) + '" autocomplete="new-password" required>' +
        '<input id="pw-new2" type="password" placeholder="' + esc(tr('settings.repeat_password')) + '" autocomplete="new-password" required>' +
        '<p class="login-error" id="pw-error" hidden></p>' +
        '<button class="btn primary" type="submit">' + esc(tr('settings.change_password')) + '</button>' +
      '</form>' +
    '</div>'
  );
}

function toggleSettingsPop(force) {
  state.settingsPop = force === undefined ? !state.settingsPop : !!force;
  renderSidebar();
  if (state.settingsPop) {
    const pop = $('#settings-pop');
    if (pop) {
      const input = $('#pw-cur', pop);
      if (input) input.focus();
    }
  }
}

function wireSettingsPop(side) {
  const gear = $('#settings-btn', side);
  if (gear) {
    gear.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSettingsPop();
    });
  }
  const pop = $('#settings-pop', side);
  if (!pop) return;
  // Клик внутри попапа не закрывает его.
  pop.addEventListener('click', (e) => e.stopPropagation());
  // Переключатели языка внутри попапа.
  pop.querySelectorAll('.ssp-lang-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const lang = b.dataset.lang;
      if (!I18N_LOCALES.includes(lang) || lang === state.lang) return;
      state.lang = lang;
      try { localStorage.setItem('kanban.lang', lang); } catch (_) {}
      toggleSettingsPop(true); // перерисовать в новом языке, попап остаётся открытым
    });
  });
  // Переключатели темы внутри попапа (system/light/dark).
  pop.querySelectorAll('.ssp-theme-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const th = b.dataset.theme;
      if (!THEME_OPTIONS.includes(th) || th === state.theme) return;
      state.theme = th;
      try { localStorage.setItem('kanban.theme', th); } catch (_) {}
      applyTheme();
      toggleSettingsPop(true); // перерисовать попап — активная кнопка сменилась
    });
  });
  // Админ: переход к управлению пользователями.
  const ub = $('#settings-users-btn', pop);
  if (ub) {
    ub.addEventListener('click', () => {
      toggleSettingsPop(false);
      openUsersPanel();
    });
  }
  // Смена пароля.
  const form = $('#pass-form', pop);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#pw-error', pop);
    errEl.hidden = true;
    const cur = $('#pw-cur', pop).value;
    const nw = $('#pw-new', pop).value;
    const nw2 = $('#pw-new2', pop).value;
    if (nw !== nw2) { errEl.textContent = tr('settings.mismatch'); errEl.hidden = false; return; }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api('PATCH', '/api/me/password', { current_password: cur, password: nw });
      errEl.hidden = true;
      toast(tr('settings.saved'), 'ok');
      toggleSettingsPop(false);
    } catch (err) {
      // Маппинг серверных ошибок на локализованные тексты.
      const m = String(err && err.message || '');
      if (/current password/i.test(m)) errEl.textContent = tr('settings.wrong_current');
      else if (/digits only/i.test(m)) errEl.textContent = tr('settings.fail_digits');
      else if (/repeated character/i.test(m)) errEl.textContent = tr('settings.fail_repeat');
      else if (/character classes/i.test(m)) errEl.textContent = tr('settings.fail_classes');
      else if (/at least 8/i.test(m)) errEl.textContent = tr('settings.fail_min');
      else errEl.textContent = m || tr('toast.save_failed');
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
}

/* Закрытие попапа настроек кликом вне его (вешается один раз). */
document.addEventListener('click', (e) => {
  if (!state.settingsPop) return;
  if (e.target.closest && e.target.closest('#settings-pop')) return;
  if (e.target.closest && e.target.closest('#settings-btn')) return;
  state.settingsPop = false;
  renderSidebar();
});

/* ---------- Загрузка данных ---------- */

/* GET /api/me → { user, setup_required, engine } (без аутентификации). */
async function fetchMe() {
  const res = await fetch('/api/me', { credentials: 'same-origin' });
  if (res.status === 404) return null; // совместимость со старым сервером
  if (!res.ok) return null;
  return res.json();
}

async function loadCore() {
  const [projects, tasks] = await Promise.all([
    api('GET', '/api/projects'),
    api('GET', '/api/tasks'),
  ]);
  state.projects = asList(projects, ['projects']);
  state.tasks = asList(tasks, ['tasks']);
  if (state.view.type === 'project' && !state.projects.some((p) => String(p.id) === String(state.view.id))) {
    state.view = { type: 'all' };
  }
}

async function loadDir() {
  await reloadStages();
  try { await reloadMembers(); } catch (e) { rethrowAuth(e); }
  try {
    const d = await api('GET', '/api/custom-fields');
    state.customFields = asList(d, ['fields', 'custom_fields', 'items']);
  } catch (e) {
    rethrowAuth(e);
    state.customFields = [];
  }
  await reloadViewFields();
  // Токены — не критично для доски: тянем в фоне (счётчик в сайдбаре).
  loadTokens().catch(() => {});
}

async function boot() {
  // Кто я? Сервер сам сообщает: setup-режим (→ setup.html) или требуется логин.
  const me = await fetchMe();
  if (me && me.setup_required) { location.replace('/'); return; } // сервер отдаёт setup.html
  state.me = me && me.user ? me.user : null;
  await loadCore();
  await loadDir();
  renderApp();
}

async function reloadData() {
  await loadCore();
  renderApp();
}

/* ---------- Каркас ---------- */

function renderApp() {
  const root = $('#root');
  root.innerHTML =
    '<div class="app' + (state.mobileSideOpen ? ' side-open' : '') + '">' +
      '<aside class="sidebar" id="sidebar"></aside>' +
      '<main class="main">' +
        '<header class="board-head" id="board-head"></header>' +
        '<div class="view-host" id="view-host"></div>' +
      '</main>' +
      '<div class="scrim" id="side-scrim" hidden></div>' +
    '</div>' +
    '<div class="modal-overlay" id="modal-overlay" hidden></div>';
  const app = $('.app', root);
  const scrim = $('#side-scrim', app);
  /* Шторка: тап по затемнению закрывает. На десктопе скрим спрятан (CSS) и не открыт. */
  if (scrim) scrim.addEventListener('mousedown', closeMobileSide);
  syncMobileScrim();
  renderSidebar();
  renderView();
}

/* --- Мобильная шторка сайдбара --- */

function isMobileLayout() {
  try { return window.matchMedia('(max-width: 720px)').matches; } catch (_) { return false; }
}

/* Скрим видим, только когда шторка открыта и вёрстка мобильная */
function syncMobileScrim() {
  const scrim = $('#side-scrim');
  if (!scrim) return;
  scrim.hidden = !(state.mobileSideOpen && isMobileLayout());
}

function openMobileSide() {
  state.mobileSideOpen = true;
  const app = $('.app');
  if (app) app.classList.add('side-open');
  syncMobileScrim();
}

function closeMobileSide() {
  if (!state.mobileSideOpen) return;
  state.mobileSideOpen = false;
  const app = $('.app');
  if (app) app.classList.remove('side-open');
  syncMobileScrim();
  /* попап настроек принадлежит шторке — закрываем вместе с ней */
  if (state.settingsPop) {
    state.settingsPop = false;
    renderSidebar();
  }
}

function renderView() {
  renderHead();
  renderBody();
}

/* Секция: заголовок со сворачиванием + тело (fill вызывается, когда не свёрнуто).
   onToggle: null — секция без сворачивания (шеврон не строится). */
function renderSection(opts) {
  const sec = el('<section class="ws-section" id="' + esc(opts.id) + '"></section>');
  const body = el('<div class="ws-body"></div>');
  const head = el('<div class="ws-head"></div>');
  if (opts.onToggle) {
    const tgl = el(
      '<button class="ws-toggle" title="' + esc(opts.collapsed ? tr('sidebar.expand') : tr('sidebar.collapse')) + '">' +
        '<span class="ws-chev">' + ICONS.chev + '</span>' +
      '</button>'
    );
    head.appendChild(tgl);
    var tglEl = tgl;
  }
  const title = el('<span class="ws-title">' + esc(opts.title) + '</span>');
  head.appendChild(title);
  if (opts.sub) {
    const sub = el('<span class="ws-sub">' + opts.sub + '</span>');
    head.appendChild(sub);
  }
  if (opts.extra) {
    /* extra строится из собственных констант (эскейпится на месте) */
    const slot = el('<span class="ws-extra">' + opts.extra + '</span>');
    head.appendChild(slot);
    if (opts.wireExtra) opts.wireExtra(slot);
  }

  if (opts.onToggle) {
    const tgl = tglEl;
    const apply = (collapsed, withFill) => {
      sec.classList.toggle('collapsed', collapsed);
      tgl.title = collapsed ? tr('sidebar.expand') : tr('sidebar.collapse');
      if (!collapsed && withFill && body.childElementCount === 0 && opts.fill) opts.fill(body);
      opts.onToggle(collapsed);
    };
    tgl.addEventListener('click', () => apply(!sec.classList.contains('collapsed'), true));
    apply(!!opts.collapsed, true);
  } else if (opts.fill) {
    opts.fill(body);
  }

  sec.appendChild(head);
  sec.appendChild(body);
  return sec;
}

function renderBody() {
  const host = $('#view-host');
  if (!host) return;
  /* частые ререндеры не должны сбрасывать скролл рабочей области */
  const wsScrollTop = host.scrollTop;
  host.innerHTML = '';

  if (state.viewType === 'CALENDAR') {
    /* --- Вид «Календарь» (отдельное представление) --- */
    host.appendChild(renderSection({
      id: 'ws-calendar',
      title: tr('board.calendar'),
      sub: '<span class="ws-count">' + visibleTasks().filter((t) => taskDateKey(t)).length + '</span>',
      collapsed: false,
      extra: calToolbarHTML(),
      wireExtra: wireCalToolbar,
      onToggle: null,
      fill: fillCalendarBody,
    }));
    host.scrollTop = 0;
    return;
  }

  /* --- Блок «Задачи» (канбан или таблица) --- */
  host.appendChild(renderSection({
    id: 'ws-tasks',
    title: tr('board.tasks'),
    sub: '<span class="ws-count">' + visibleTasks().length + '</span>',
    collapsed: state.tasksCollapsed,
    onToggle: (now) => {
      state.tasksCollapsed = now;
      try { localStorage.setItem('kanban.tasksCollapsed', now ? '1' : '0'); } catch (_) {}
    },
    fill: (body) => {
      body.innerHTML = '';
      if (state.viewType === 'TABLE') {
        body.appendChild(renderTable());
      } else {
        const board = el('<div class="board" id="board"></div>');
        body.appendChild(board);
        for (const st of visibleStages()) board.appendChild(renderColumn(st.id));
      }
    },
  }));

  if (wsScrollTop) host.scrollTop = wsScrollTop;
}

/* ---------- Календарь ---------- */

const WEEKDAYS = WEEKDAY_MIN[state.lang] || WEEKDAY_MIN.en;

function taskDateKey(t) {
  /* t.due_at==null → null (задача попадает в блок «Без срока», не в сетку) */
  if (t == null || t.due_at == null) return null;
  const d = parseDate(t.due_at);
  if (!d) return null;
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function dateKeyOf(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function calendarMonthLabel(d) {
  const label = d.toLocaleDateString(currentLocaleTag(), { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function calToolbarHTML() {
  const d = state.calCursor || new Date();
  return (
    '<div class="cal-nav">' +
      '<button class="icon-btn cal-nav-btn" data-cal="prev" title="' + esc(tr('cal.prev_month')) + '">' + ICONS.chev + '</button>' +
      '<span class="cal-month">' + esc(calendarMonthLabel(d)) + '</span>' +
      '<button class="icon-btn cal-nav-btn next" data-cal="next" title="' + esc(tr('cal.next_month')) + '">' + ICONS.chev + '</button>' +
      '<button class="btn ghost btn-sm" data-cal="today">' + esc(tr('today')) + '</button>' +
    '</div>'
  );
}

/* клики по тулбару календаря: предыдущий/следующий месяц, «Сегодня».
   Смена месяца закрывает попап «Ещё N» — день может уйти из сетки. */
function wireCalToolbar(slot) {
  slot.querySelectorAll('[data-cal]').forEach((b) => {
    b.addEventListener('click', () => {
      const cur = state.calCursor || new Date();
      state.calPop = null;
      if (b.dataset.cal === 'prev') {
        state.calCursor = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
      } else if (b.dataset.cal === 'next') {
        state.calCursor = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      } else {
        const n = new Date();
        state.calCursor = new Date(n.getFullYear(), n.getMonth(), 1);
      }
      renderBody();
    });
  });
}

function fillCalendarBody(body) {
  body.innerHTML = '';
  body.appendChild(renderCalendar());
}

/* Сетка месяца: 42 ячейки от понедельника, задачи с due_at, «без срока» отдельно */
function renderCalendar() {
  const cur = state.calCursor || new Date();
  const y = cur.getFullYear(), m = cur.getMonth();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  /* 42 ячейки: от понедельника недели с 1-м числом до воскресенья 6-й недели */
  const first = new Date(y, m, 1);
  const startOffset = (first.getDay() + 6) % 7;          // дней от понедельника
  const start = new Date(y, m, 1 - startOffset);
  const byDay = new Map();                               // 'YYYY-MM-DD' → задачи
  for (const t of visibleTasks()) {
    const k = taskDateKey(t);
    if (!k) continue;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(t);
  }

  let headHTML = '';
  for (const w of WEEKDAYS) headHTML += '<div class="cal-dow">' + esc(w) + '</div>';

  const CAL_MAX = 3; // карточек в сжатом дне
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dateKeyOf(d);
    const inMonth = d.getMonth() === m;
    const isToday = key === dateKeyOf(today);
    const list = byDay.get(key) || [];
    const hidden = Math.max(0, list.length - CAL_MAX);

    cells +=
      '<div class="cal-cell' + (inMonth ? '' : ' out') + (isToday ? ' today' : '') + '" data-date="' + esc(key) + '">' +
        '<div class="cal-cell-head">' +
          '<span class="cal-daynum' + (isToday ? ' today' : '') + '">' + d.getDate() + '</span>' +
          (list.length > CAL_MAX
            ? '<button type="button" class="cal-batch' + (state.calPop && state.calPop.key === key ? ' on' : '') + '" data-pop="' + esc(key) + '" title="' + esc(tr('cal.show_day')) + '">' + list.length + '</button>'
            : '') +
        '</div>' +
        '<div class="cal-cards">' +
          list.slice(0, CAL_MAX).map((t) => renderCalCard(t, inMonth)).join('') +
          (hidden > 0
            ? '<button type="button" class="cal-more" data-pop="' + esc(key) + '">' + esc(tr('misc.more')) + ' ' + hidden + '</button>'
            : '') +
        '</div>' +
      '</div>';
  }

  /* Задачи без срока — отдельной строкой снизу */
  const noDue = visibleTasks().filter((t) => !taskDateKey(t));
  const noDueCollapsed = !!state.calNoDueCollapsed;
  const noDueHTML =
    '<div class="cal-nodue' + (noDueCollapsed ? ' collapsed' : '') + (noDue.length ? '' : ' empty') + '">' +
      '<button type="button" class="cal-nodue-label" id="cal-nodue-toggle" title="' + esc(noDueCollapsed ? tr('sidebar.expand') : tr('sidebar.collapse')) + '">' +
        '<span class="cal-nodue-chev">' + ICONS.chev + '</span>' +
        ICONS.calendar + ' ' + esc(tr('board.no_due')) +
        ' <span class="cal-count">' + noDue.length + '</span>' +
      '</button>' +
      '<div class="cal-nodue-cards">' +
        (noDue.length
          ? noDue.map((t) => renderCalCard(t, true)).join('')
          : '<span class="cal-none">' + esc(tr('board.no_tasks')) + '</span>') +
      '</div>' +
    '</div>';

  /* Попап «Ещё N»: обычный список задач дня со скроллом; позиционируем по ячейке */
  let popHTML = '';
  if (state.calPop && byDay.has(state.calPop.key)) {
    const list = byDay.get(state.calPop.key);
    popHTML =
      '<div class="cal-pop" id="cal-pop" role="dialog">' +
        '<div class="cal-pop-head">' +
          '<span class="cal-pop-title">' + esc(calPopTitle(state.calPop.key)) + '</span>' +
          '<button type="button" class="icon-btn" data-pop-close title="' + esc(tr('close')) + '">' + ICONS.x + '</button>' +
        '</div>' +
        '<div class="cal-pop-list">' + list.map((t) => renderCalCard(t, true)).join('') + '</div>' +
      '</div>';
  }

  const wrap = el(
    '<div class="cal" id="calendar">' +
      '<div class="cal-week">' + headHTML + '</div>' +
      '<div class="cal-grid">' + cells + '</div>' +
      noDueHTML +
      popHTML +
    '</div>'
  );

  /* Попап дня (бейдж-число и «Ещё N»), клик по карточке */
  const popEl = wrap.querySelector('#cal-pop');
  if (popEl && state.calPop) {
    /* геометрия от .cal (relative): под ячейкой дня, ширина = ширина ячейки */
    popEl.style.left = Math.max(0, state.calPop.x) + 'px';
    popEl.style.top = state.calPop.y + 'px';
    if (state.calPop.w) popEl.style.width = Math.max(240, state.calPop.w) + 'px';
  }

  /* Кнопки попапа дня (бейдж-число и «Ещё N») + клик по карточке */
  wrap.addEventListener('click', (e) => {
    /* тоггл «Без срока»: сворачивание + persist в localStorage */
    if (e.target.closest('#cal-nodue-toggle')) {
      state.calNoDueCollapsed = !state.calNoDueCollapsed;
      try { localStorage.setItem('kanban.calNoDueCollapsed', state.calNoDueCollapsed ? '1' : '0'); } catch (_) {}
      renderBody();
      return;
    }
    const popBtn = e.target.closest('[data-pop]');
    if (popBtn) {
      const key = popBtn.dataset.pop;
      if (state.calPop && state.calPop.key === key) {
        state.calPop = null;
      } else {
        /* позиционируем под ячейкой дня */
        const cell = wrap.querySelector('.cal-cell[data-date="' + key + '"]');
        const r = cell ? cell.getBoundingClientRect() : null;
        const hostR = wrap.getBoundingClientRect();
        state.calPop = {
          key,
          x: r ? (r.left - hostR.left) : 0,
          y: r ? (r.bottom - hostR.top + 4) : 0,
          w: r ? r.width : 240,
        };
      }
      renderBody();
      return;
    }
    if (e.target.closest('[data-pop-close]')) {
      state.calPop = null;
      renderBody();
      return;
    }
    const card = e.target.closest('.cal-card');
    if (card && !state.calDragged) openTaskModal(card.dataset.id);
  });

  attachCalDnD(wrap);
  return wrap;
}

function calPopTitle(key) {
  const d = parseDate(key);
  if (!d) return key;
  return d.toLocaleDateString(currentLocaleTag(), { day: 'numeric', month: 'long', weekday: 'short' });
}

/* Карточка в календарной ячейке: клик — модалка, drag — перенос срока.
   Цветная полоса слева = стадия; просрочка — красный фон даты в заголовке дня не трогаем,
   карточка получает .overdue (красный текст срока + полоса).
   draggable на КОРНЕ карточки: раньше drag стартовал только с текста названия
   (браузер начинает HTML5-drag лишь с выделения текста) — теперь тянется целиком. */
function renderCalCard(t, inMonth) {
  const stage = stageById(t.stage) ? t.stage : firstStageId();
  const overdue = isOverdue(t.due_at) && !isDoneStage(t.stage);
  const done = isDoneStage(t.stage);
  return '<article class="cal-card' + (inMonth === false ? ' out' : '') + (overdue ? ' overdue' : '') + (done ? ' done' : '') + '" draggable="true" data-id="' + esc(t.id) + '" title="' + esc(stageLabel(stage)) + (overdue ? ' · ' + tr('board.overdue') : '') + '">' +
    '<span class="cal-stage-bar" style="background:' + esc(stageColor(stage)) + '"></span>' +
    '<span class="cal-card-grip">' + ICONS.grip + '</span>' +
    urgencySquareHTML(t) +
    '<span class="cal-card-title">' + esc(t.title) + '</span>' +
    '<span class="cal-assignee">' + (assigneeOf(t) ? esc((assigneeOf(t).initials || initials(assigneeOf(t).name))) : '') + '</span>' +
  '</article>';
}

/* Drag-n-drop в календаре: перенос срока задачи на другую дату.
   Дроп-зоны: ячейки дней И блок «Без срока»... нет: «без срока» — источник,
   приёмник только ячейка дня (у блока нет даты). Источник: карточка целиком. */
function attachCalDnD(wrap) {
  /* Chrome и Firefox сами не начинают drag с элемента с user-select:none,
     если не выделен текст; принудительно ставим флаг в mousedown. */
  wrap.addEventListener('mousedown', (e) => {
    const card = e.target.closest && e.target.closest('.cal-card');
    if (!card || e.button !== 0) return;
    card.draggable = true;
  });
  wrap.addEventListener('dragstart', (e) => {
    const card = e.target.closest && e.target.closest('.cal-card');
    if (!card) return;
    state.calDragged = card.dataset.id;
    card.classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', String(card.dataset.id)); } catch (_) {}
    e.dataTransfer.effectAllowed = 'move';
  });
  wrap.addEventListener('dragend', () => {
    state.calDragged = null;
    wrap.querySelectorAll('.cal-card.dragging').forEach((c) => c.classList.remove('dragging'));
    wrap.querySelectorAll('.cal-cell.drag-over').forEach((c) => c.classList.remove('drag-over'));
  });
  wrap.addEventListener('dragover', (e) => {
    if (!state.calDragged) return;
    const cell = e.target.closest('.cal-cell');
    if (!cell) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    wrap.querySelectorAll('.cal-cell.drag-over').forEach((c) => c.classList.remove('drag-over'));
    cell.classList.add('drag-over');
  });
  wrap.addEventListener('dragleave', (e) => {
    const cell = e.target.closest && e.target.closest('.cal-cell');
    if (cell && !cell.contains(e.relatedTarget)) cell.classList.remove('drag-over');
  });
  wrap.addEventListener('drop', async (e) => {
    const cell = e.target.closest('.cal-cell');
    if (!cell || !state.calDragged) return;
    e.preventDefault();
    const id = state.calDragged;
    state.calDragged = null;
    wrap.querySelectorAll('.cal-cell.drag-over').forEach((c) => c.classList.remove('drag-over'));
    wrap.querySelectorAll('.cal-card.dragging').forEach((c) => c.classList.remove('dragging'));
    const date = cell.dataset.date;
    if (!date) return;
    const t = taskById(id);
    if (!t) return;
    const oldKey = taskDateKey(t);
    if (oldKey === date) return;
    /* оптимистично: подмена срока локально, при ошибке — откат */
    const snapshot = t.due_at;
    t.due_at = date + 'T12:00:00.000Z';
    renderBody();
    try {
      const updated = await api('PATCH', '/api/tasks/' + encodeURIComponent(id), { due_at: t.due_at });
      if (updated && updated.id) {
        const i = state.tasks.findIndex((x) => String(x.id) === String(id));
        if (i > -1) state.tasks[i] = Object.assign({}, state.tasks[i], updated);
      }
      renderBody();
    } catch (err) {
      t.due_at = snapshot;
      renderBody();
      toast(tr('toast.reschedule_failed') + ': ' + err.message, 'error');
    }
  });
}

function currentProject() {
  return state.view.type === 'project'
    ? state.projects.find((p) => String(p.id) === String(state.view.id)) || null
    : null;
}

function visibleTasks() {
  if (state.view.type === 'all') return state.tasks;
  if (state.view.type === 'none') return state.tasks.filter((t) => t.project_id == null);
  return state.tasks.filter((t) => String(t.project_id) === String(state.view.id));
}

/* id первого (низшего) видимого этапа — куда определять задачу,
   если её текущий этап скрыт/удалён */
function firstStageId() {
  const vis = visibleStages();
  if (vis.length) return vis[0].id;
  const all = stagesAll();
  return all.length ? all[0].id : 'DISCUSSION';
}

/* Перенос задачи в другой проект / «без проекта» (pid === null → none).
   Оптимистично: меняем project_id локально, при ошибке — откат. */
async function moveProj(id, pid, stage) {
  state.dragged = null; // drag завершён — иначе клики по карточкам блокируются
  const t = taskById(id);
  if (!t) return;
  const snapshot = Object.assign({}, t);
  t.project_id = pid;
  if (stage != null) t.stage = stage;
  renderApp();
  try {
    const updated = await api('POST', '/api/tasks/' + encodeURIComponent(id) + '/move', {
      stage: stage != null ? stage : t.stage,
      project_id: pid === null ? 'none' : pid,
    });
    if (updated && updated.id) {
      const i = state.tasks.findIndex((x) => String(x.id) === String(id));
      if (i > -1) state.tasks[i] = Object.assign({}, state.tasks[i], updated);
    }
    renderApp();
    const p = pid === null ? null : state.projects.find((x) => String(x.id) === String(pid));
    toast(tr('card.moved_to') + (p ? p.name + '»' : tr('sidebar.no_project') + '»'), 'ok');
  } catch (err) {
    const i = state.tasks.findIndex((x) => String(x.id) === String(id));
    if (i > -1) state.tasks[i] = snapshot;
    renderApp();
    toast(tr('toast.move_failed') + ': ' + err.message, 'error');
  }
}

/* ---------- Сайдбар ---------- */

function bindSideToggle(side) {
  const t = $('#side-toggle', side);
  if (!t) return;
  t.addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    try { localStorage.setItem('kanban.sidebarCollapsed', state.sidebarCollapsed ? '1' : '0'); } catch (_) {}
    renderSidebar();
  });
}

function renderSidebar() {
  const side = $('#sidebar');
  if (!side) return;
  const isAll = state.view.type === 'all';
  /* На мобильной вёрстке шторка всегда развёрнута: в свёрнутом виде
     в ней не было бы списка проектов. Кнопка сворачивания спрятана CSS. */
  const collapsed = !!state.sidebarCollapsed && !isMobileLayout();
  const isAdmin = !!(state.me && state.me.role === 'admin');
  const collapseBtn = '<button class="side-collapse" id="side-toggle" title="' +
    esc(tr(collapsed ? 'sidebar.expand' : 'sidebar.collapse')) + '">' +
    (collapsed ? ICONS.chevron : ICONS.chevrons) + '</button>';
  let html =
    '<div class="brand"><div class="brand-logo">K</div><div class="brand-name">Kanban</div></div>' +
    collapseBtn +
    (collapsed
      ? ''
      : '<div class="side-label">' + esc(tr('sidebar.workspace')) + '</div>' +
        '<nav class="side-list">');

  html +=
    '<button class="side-item' + (isAll ? ' active' : '') + '" data-view="all">' +
      '<span class="side-ic">' + ICONS.kanban + '</span>' +
      '<span class="side-name">' + esc(tr('sidebar.all_tasks')) + '</span>' +
      '<span class="side-count">' + state.tasks.length + '</span>' +
    '</button>';

  /* «Без проекта»: задачи вне всяких проектов (project_id IS NULL) */
  const noneCnt = state.tasks.filter((tk) => tk.project_id == null).length;
  const noneActive = state.view.type === 'none';
  html +=
    '<button class="side-item none-row' + (noneActive ? ' active' : '') + '" data-view="none" title="' + esc(tr('sidebar.no_project_hint')) + '">' +
      '<span class="side-ic">' + ICONS.box + '</span>' +
      '<span class="side-name">' + esc(tr('sidebar.no_project')) + '</span>' +
      '<span class="side-count">' + noneCnt + '</span>' +
    '</button>';

  for (const p of state.projects) {
    if (projRenameId !== null && String(p.id) === String(projRenameId)) {
      html +=
        '<div class="side-item project-row" data-view="' + esc(p.id) + '">' +
          '<input class="proj-rename" type="text" maxlength="200" value="' + esc(p.name) + '">' +
        '</div>';
      continue;
    }
    const active = state.view.type === 'project' && String(state.view.id) === String(p.id);
    const cnt = state.tasks.filter((tk) => String(tk.project_id) === String(p.id)).length;
    html +=
      '<div class="side-item project-row' + (active ? ' active' : '') + '" data-view="' + esc(p.id) + '">' +
        '<button type="button" class="project-open">' +
          '<span class="side-ic">' + ICONS.folder + '</span>' +
          '<span class="side-name">' + esc(p.name) + '</span>' +
          '<span class="dot" style="background:' + esc(p.color || '#c9c9d1') + '"></span>' +
          '<span class="side-count">' + cnt + '</span>' +
        '</button>' +
        '<button type="button" class="side-more project-more" data-pid="' + esc(p.id) + '" title="' + esc(tr('rename')) + '">' + ICONS.dots + '</button>' +
      '</div>';
  }

  html += '</nav>';

  if (collapsed) {
    /* Схлопнуто: только иконки — логотип, разворот, настройки, выход. */
    side.classList.add('collapsed');
    side.innerHTML =
      '<div class="brand"><div class="brand-logo">K</div></div>' +
      collapseBtn +
      '<div class="side-bottom">' +
        '<button class="side-item' + (state.settingsPop ? ' active' : '') + '" id="settings-btn" title="' + esc(tr('sidebar.settings')) + '"><span class="side-ic">' + ICONS.gear + '</span></button>' +
        (isAdmin ? '<button class="side-item" id="users-btn" title="' + esc(tr('sidebar.users')) + '"><span class="side-ic">' + ICONS.users + '</span></button>' : '') +
        '<button class="side-item" id="logout-btn" title="' + esc(tr('sidebar.sign_out')) + '"><span class="side-ic">' + ICONS.user + '</span></button>' +
      '</div>' +
      (state.settingsPop ? settingsPopHTML() : '');
    bindSideToggle(side);
    wireSettingsPop(side);
    wireSidebarBottom(side);
    return;
  }
  side.classList.remove('collapsed');

  const isNpOpen = state.npOpen;
  if (isNpOpen) {
    html +=
      '<form class="np-form" id="np-form">' +
        '<input id="np-name" type="text" placeholder="' + esc(tr('sidebar.project_name')) + '" maxlength="64">' +
        '<div class="np-colors">' +
          PALETTE.map((c, i) =>
            '<button type="button" class="np-color' + (i === 0 ? ' sel' : '') + '" data-color="' + c + '" style="background:' + c + '" title="' + c + '"></button>'
          ).join('') +
        '</div>' +
        '<button type="submit" class="btn primary">' + esc(tr('create')) + '</button>' +
      '</form>';
  } else {
    html += '<div class="side-section"><button class="side-item side-add" id="np-open"><span class="side-ic">' + ICONS.plus + '</span><span class="side-name">' + esc(tr('sidebar.new_project')) + '</span></button></div>';
  }

  /* --- Исполнители --- */
  html += '<div class="side-label side-label-mt">' + esc(tr('sidebar.assignees')) + '</div><nav class="side-list">';
  if (!state.members.length) html += '<div class="side-empty">' + esc(tr('sidebar.nobody')) + '</div>';
  for (const m of state.members) {
    if (state.memberRenameId === m.id) {
      html +=
        '<div class="side-item member-row" data-mid="' + esc(m.id) + '">' +
          '<span class="member-dot" style="background:' + esc(m.color || '#c9c9d1') + '">' + esc(m.initials || initials(m.name)) + '</span>' +
          '<input class="mem-rename" type="text" maxlength="64" value="' + esc(m.name) + '">' +
        '</div>';
    } else {
      html +=
        '<div class="side-item member-row" data-mid="' + esc(m.id) + '">' +
          '<span class="member-dot" style="background:' + esc(m.color || '#c9c9d1') + ';color:' + (m.color ? colorTextOn(m.color) : '#1b1b1f') + '">' + esc(m.initials || initials(m.name)) + '</span>' +
          '<span class="side-name">' + esc(m.name) + '</span>' +
          '<button class="side-more" title="' + esc(tr('rename')) + '">' + ICONS.dots + '</button>' +
        '</div>';
    }
  }
  html += '</nav>';
  if (state.memFormOpen) {
    html +=
      '<form class="np-form" id="mem-form">' +
        '<input id="mem-name" type="text" placeholder="' + esc(tr('sidebar.assignee_name')) + '" maxlength="64">' +
        '<div class="np-colors">' +
          PALETTE.map((c, i) =>
            '<button type="button" class="np-color' + (i === 0 ? ' sel' : '') + '" data-color="' + c + '" style="background:' + c + '" title="' + c + '"></button>'
          ).join('') +
        '</div>' +
        '<button type="submit" class="btn primary">' + esc(tr('add')) + '</button>' +
      '</form>';
  } else {
    html += '<div class="side-section"><button class="side-item side-add" id="mem-open"><span class="side-ic">' + ICONS.plus + '</span><span class="side-name">' + esc(tr('sidebar.add_assignee')) + '</span></button></div>';
  }

  /* --- Агенты (MCP) --- */
  html += '<div class="side-label side-label-mt">' + esc(tr('sidebar.agents')) + '</div><nav class="side-list">';
  html +=
    '<button class="side-item" id="agents-open">' +
      '<span class="side-ic">' + ICONS.bot + '</span>' +
      '<span class="side-name">' + esc(tr('sidebar.agents_tokens')) + '</span>' +
      '<span class="side-count">' + state.tokens.filter((tk) => !tk.revoked_at).length + '</span>' +
    '</button>';
  html +=
    '<button class="side-item" id="audit-open">' +
      '<span class="side-ic">' + ICONS.journal + '</span>' +
      '<span class="side-name">' + esc(tr('sidebar.journal')) + '</span>' +
    '</button>';
  if (isAdmin) {
    html +=
      '<button class="side-item" id="users-open">' +
        '<span class="side-ic">' + ICONS.users + '</span>' +
        '<span class="side-name">' + esc(tr('sidebar.users')) + '</span>' +
      '</button>';
  }
  html += '</nav>';

  html +=
    '<div class="side-bottom">' +
      '<div class="side-me">' +
        '<button class="icon-btn' + (state.settingsPop ? ' on' : '') + '" id="settings-btn" title="' + esc(tr('sidebar.settings')) + '">' + ICONS.gear + '</button>' +
        (state.me
          ? '<span class="member-dot" style="background:' + avatarColor(state.me.username) + '">' + esc(initials(state.me.display_name || state.me.username)) + '</span>' +
            '<span class="side-name">' + esc(state.me.display_name || state.me.username) + '</span>'
          : '') +
      '</div>' +
      '<button class="side-item" id="logout-btn"><span class="side-ic">' + ICONS.user + '</span><span class="side-name">' + esc(tr('sidebar.sign_out')) + '</span></button>' +
    '</div>' +
    (state.settingsPop ? settingsPopHTML() : '');

  side.innerHTML = html;

  bindSideToggle(side);
  wireSettingsPop(side);
  wireSidebarBottom(side);

  side.querySelectorAll('.side-item[data-view]').forEach((row) => {
    const open = row.classList.contains('project-row') ? row.querySelector('.project-open') : row;
    if (!open) return;
    open.addEventListener('click', () => {
      const v = row.dataset.view;
      state.view = v === 'all' ? { type: 'all' } : (v === 'none' ? { type: 'none' } : { type: 'project', id: v });
      state.npOpen = false;
      projRenameId = null;
      state.mobileSideOpen = false; /* шторка закрывается после выбора */
      renderApp();
    });
    if (row.classList.contains('project-row')) {
      const more = row.querySelector('.project-more');
      more.addEventListener('click', (e) => {
        e.stopPropagation();
        const pr = state.projects.find((pp) => String(pp.id) === String(row.dataset.view));
        if (pr) openProjectCtx(pr, more);
      });
    }
  });

  /* Перенос задачи между проектами: карточку бросаем на строку проекта в сайдбаре.
     Приёмники: строки проектов (в т.ч. их кнопки) и строка «Без проекта». */
  side.querySelectorAll('.project-row[data-view]').forEach((row) => {
    const pid = row.dataset.view;
    row.addEventListener('dragover', (e) => {
      if (!state.dragged) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (state.dropProj !== pid) {
        state.dropProj = pid;
        side.querySelectorAll('.side-item.accept').forEach((x) => x.classList.remove('accept'));
        row.classList.add('accept');
      }
    });
    row.addEventListener('dragleave', (e) => {
      if (!row.contains(e.relatedTarget) && state.dropProj === pid) {
        state.dropProj = null;
        row.classList.remove('accept');
      }
    });
    row.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = state.dragged;
      state.dropProj = null;
      side.querySelectorAll('.side-item.accept').forEach((x) => x.classList.remove('accept'));
      if (!id) return;
      const t = taskById(id);
      if (!t || String(t.project_id ?? 'none') === String(pid)) return;
      const st = visibleStages().some((s) => String(s.id) === String(t.stage)) ? t.stage : firstStageId();
      await moveProj(id, pid, st);
    });
  });
  const noneRow = side.querySelector('.side-item.none-row[data-view]');
  if (noneRow) {
    noneRow.addEventListener('dragover', (e) => {
      if (!state.dragged) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (state.dropProj !== 'none') {
        state.dropProj = 'none';
        side.querySelectorAll('.side-item.accept').forEach((x) => x.classList.remove('accept'));
        noneRow.classList.add('accept');
      }
    });
    noneRow.addEventListener('dragleave', (e) => {
      if (!noneRow.contains(e.relatedTarget) && state.dropProj === 'none') {
        state.dropProj = null;
        noneRow.classList.remove('accept');
      }
    });
    noneRow.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = state.dragged;
      state.dropProj = null;
      side.querySelectorAll('.side-item.accept').forEach((x) => x.classList.remove('accept'));
      if (!id) return;
      const t = taskById(id);
      if (!t || t.project_id == null) return;
      await moveProj(id, null, t.stage);
    });
  }

  const opener = $('#np-open');
  if (opener) {
    opener.addEventListener('click', () => {
      state.npOpen = true;
      renderSidebar();
      const inp = $('#np-name');
      if (inp) inp.focus();
    });
  }

  const npForm = $('#np-form');
  if (npForm) {
    npForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#np-name').value.trim();
      if (!name) { toast(tr('misc.enter_name_project'), 'error'); $('#np-name').focus(); return; }
      const colorSel = npForm.querySelector('.np-color.sel');
      const color = colorSel ? colorSel.dataset.color : PALETTE[0];
      try {
        await api('POST', '/api/projects', { name, color });
        state.npOpen = false;
        await reloadData();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    npForm.querySelectorAll('.np-color').forEach((b) => {
      b.addEventListener('click', () => {
        npForm.querySelectorAll('.np-color').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
      });
    });
  }

  /* --- Исполнители: события --- */
    side.querySelectorAll('.proj-rename').forEach((inp) => {
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== 'Escape') return;
      e.preventDefault();
      const pid = inp.closest('[data-view]').dataset.view;
      if (e.key === 'Enter' && inp.value.trim()) {
        api('PATCH', '/api/projects/' + encodeURIComponent(pid), { name: inp.value.trim() })
          .then(async () => { projRenameId = null; await loadCore(); renderApp(); })
          .catch((err) => toast(tr('toast.rename_failed') + ': ' + err.message, 'error'));
      } else {
        projRenameId = null;
        renderSidebar();
        if (e.key === 'Enter') { projRenameId = Number(pid); renderSidebar(); }
      }
    });
  });

side.querySelectorAll('.member-row').forEach((row) => {
    const m = state.members.find((x) => String(x.id) === String(row.dataset.mid));
    if (!m) return;
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openMemberCtx(m, e.clientX, e.clientY);
    });
    const more = $('.side-more', row);
    if (more) {
      more.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = more.getBoundingClientRect();
        openMemberCtx(m, r.left, r.bottom + 4);
      });
    }
    const ren = $('.mem-rename', row);
    if (ren) {
      let cancelled = false;
      ren.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); ren.blur(); }
        else if (e.key === 'Escape') { e.stopPropagation(); cancelled = true; ren.blur(); }
      });
      ren.addEventListener('blur', async () => {
        if (state.memberRenameId !== m.id) return;
        if (cancelled) { state.memberRenameId = null; renderSidebar(); return; }
        const v = ren.value.trim();
        if (!v || v === m.name) { state.memberRenameId = null; renderSidebar(); return; }
        try {
          const upd = await api('PATCH', '/api/members/' + encodeURIComponent(m.id), { name: v });
          const merged = upd && upd.id ? Object.assign({}, m, upd) : Object.assign({}, m, { name: v });
          const i = state.members.findIndex((x) => String(x.id) === String(m.id));
          if (i > -1) state.members[i] = merged;
          state.memberRenameId = null;
          renderSidebar();
          renderBody();
        } catch (err) {
          toast(tr('toast.rename_failed') + ': ' + err.message, 'error');
          state.memberRenameId = null;
          renderSidebar();
        }
      });
    }
  });

  const memOpen = $('#mem-open');
  if (memOpen) {
    memOpen.addEventListener('click', () => {
      state.memFormOpen = true;
      renderSidebar();
      const inp = $('#mem-name');
      if (inp) inp.focus();
    });
  }

  const memForm = $('#mem-form');
  if (memForm) {
    memForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#mem-name').value.trim();
      if (!name) { toast(tr('misc.enter_name_assignee'), 'error'); $('#mem-name').focus(); return; }
      const colorSel = memForm.querySelector('.np-color.sel');
      const color = colorSel ? colorSel.dataset.color : PALETTE[0];
      try {
        await api('POST', '/api/members', { name, color });
        state.memFormOpen = false;
        await reloadMembers();
        renderSidebar();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    memForm.querySelectorAll('.np-color').forEach((b) => {
      b.addEventListener('click', () => {
        memForm.querySelectorAll('.np-color').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
      });
    });
  }

  /* --- Агенты: события --- */
  const agentsBtn = $('#agents-open');
  if (agentsBtn) agentsBtn.addEventListener('click', () => { openAgentsPanel(); });
  const auditBtn = $('#audit-open');
  if (auditBtn) auditBtn.addEventListener('click', () => { openAuditPanel(); });
  const usersBtn = $('#users-open');
  if (usersBtn) usersBtn.addEventListener('click', () => { openUsersPanel(); });
}

/* Нижняя часть сайдбара: язык, пользователи (admin), выход — общий и для свёрнутого вида. */
function wireSidebarBottom(scope) {
  const host = scope || $('#sidebar');
  if (!host) return;
  wireLangSwitcher(host, () => renderApp());
  const ub = $('#users-btn', host) || $('#users-open', host);
  if (ub) ub.addEventListener('click', () => { openUsersPanel(); });
  const lb = $('#logout-btn', host);
  if (lb) lb.addEventListener('click', async () => {
    try { await api('POST', '/api/logout'); } catch (_) {}
    showLogin();
  });
}

/* ---------- Язык: компактный переключатель для сайдбара ---------- */
/* (переехал в попап настроек — settingsPopHTML(); функции удалены) */

/* --- Панель «Агенты и токены» (модалка в общем overlay) --- */

async function loadTokens() {
  try {
    const d = await api('GET', '/api/tokens');
    state.tokens = asList(d, ['tokens', 'items']);
  } catch (err) {
    rethrowAuth(err);
    state.tokens = [];
  }
}

async function loadAudit() {
  try {
    const d = await api('GET', '/api/audit?limit=200');
    state.audit = Array.isArray(d) ? d : asList(d, ['items']);
  } catch (err) {
    rethrowAuth(err);
    state.audit = [];
  }
}

/* Пользовательские подписи к системным полям и ключам локалей. */
function tokenScopeChip(tk) {
  const write = String(tk.scopes || '').includes('write');
  return '<span class="tok-scope ' + (write ? 'on' : '') + '">' + esc(tr(write ? 'agents.scope_write' : 'agents.scope_read')) + '</span>';
}

function tokenStatus(tk) {
  if (tk.revoked_at) return '<span class="tok-status off">' + esc(tr('agents.revoked')) + '</span>';
  if (tk.expires_at && Date.parse(tk.expires_at) <= Date.now()) return '<span class="tok-status off">' + esc(tr('agents.expired')) + '</span>';
  return '<span class="tok-status ok">' + esc(tr('agents.active')) + '</span>';
}

function fmtAuditAction(action) {
  return esc(action);
}

function openAgentsPanel() {
  closeCtxMenu();
  closeMobileSide(); /* модалка на мобильном перекрывает шторку */
  const overlay = $('#modal-overlay');
  overlay.hidden = false;
  overlay.innerHTML = '<div class="modal" role="dialog" aria-modal="true" id="agents-modal"><div class="modal-body"><p class="side-empty">' + esc(tr('loading')) + '</p></div></div>';
  renderAgentsModal();
  // Клик по фону закрывает (как в задаче).
  overlay.onclick = (e) => { if (e.target === overlay) closeAgentsPanel(); };
  loadTokens().then(renderAgentsModal).catch((err) => toast(err.message, 'error'));
}

function closeAgentsPanel() {
  const overlay = $('#modal-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
  overlay.onclick = null;
  state.newToken = null;
  state.tokenDelArmed = null;
}

function renderAgentsModal() {
  const modal = $('#agents-modal');
  if (!modal) return;
  let list = '';
  if (!state.tokens.length) list = '<div class="side-empty">' + esc(tr('agents.none')) + '</div>';
  for (const tk of state.tokens) {
    const armed = String(state.tokenDelArmed) === String(tk.id);
    list +=
      '<div class="tok-row" data-tid="' + esc(tk.id) + '">' +
        '<div class="tok-main">' +
          '<span class="tok-name">' + esc(tk.name) + '</span>' +
          tokenScopeChip(tk) + tokenStatus(tk) +
        '</div>' +
        '<div class="tok-meta">' + esc(tr('agents.prefix')) + ' <code>' + esc(tk.prefix) + '</code>' +
          (tk.last_used_at ? tr('agents.last_used') + ' ' + esc(fmtDate(tk.last_used_at)) : tr('agents.never_used')) +
        '</div>' +
        '<div class="tok-actions">' +
          '<button class="icon-btn danger tok-revoke" title="' + esc(tk.revoked_at ? tr('agents.delete_record') : tr('agents.revoke')) + '">' +
            (tk.revoked_at ? ICONS.trash : ICONS.x) + '</button>' +
        '</div>' +
      '</div>';
  }
  let newTokenHtml = '';
  if (state.newToken) {
    newTokenHtml =
      '<div class="new-token">' +
        '<div class="nt-head">' + esc(tr('agents.created')) + '</div>' +
        '<div class="nt-row"><code id="nt-value">' + esc(state.newToken.token) + '</code>' +
        '<button class="btn ghost btn-sm" id="nt-copy">' + esc(tr('copy')) + '</button></div>' +
        '<div class="nt-warn">' + esc(tr('agents.warn')) + '</div>' +
      '</div>';
  }
  modal.innerHTML =
    '<div class="modal-head">' +
      '<span class="modal-title">' + ICONS.bot + ' ' + esc(tr('agents.title')) + '</span>' +
      '<button class="icon-btn" id="agents-close" title="' + esc(tr('close')) + '">' + ICONS.x + '</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<p class="agents-sub">' + esc(tr('agents.mcp_hint')) + ' <code>POST ' + esc(location.origin) + '/mcp</code> · ' + esc(tr('agents.auth_hint')) + ' <code>Authorization: Bearer &lt;token&gt;</code> · ' + esc(tr('agents.tools_hint')) + ' <code>tools/list</code>, <code>tools/call</code></p>' +
      newTokenHtml +
      '<div class="tok-list">' + list + '</div>' +
      '<form class="nt-form" id="tok-form">' +
        '<input id="tok-name" type="text" placeholder="' + esc(tr('agents.name')) + '" maxlength="100">' +
        '<label class="tok-scope-pick"><input type="radio" name="tok-scope" value="write" checked> ' + esc(tr('agents.scope_write')) + '</label>' +
        '<label class="tok-scope-pick"><input type="radio" name="tok-scope" value="read"> ' + esc(tr('agents.scope_read')) + '</label>' +
        '<button class="btn primary" type="submit">' + ICONS.plus + ' ' + esc(tr('agents.create')) + '</button>' +
      '</form>' +
    '</div>';
  $('#agents-close').addEventListener('click', closeAgentsPanel);
  const form = $('#tok-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#tok-name').value.trim();
    if (!name) { toast(tr('agents.name_required'), 'error'); $('#tok-name').focus(); return; }
    const scope = form.querySelector('input[name="tok-scope"]:checked').value;
    try {
      const created = await api('POST', '/api/tokens', { name, scopes: [scope] });
      state.newToken = created;
      $('#tok-name').value = '';
      await loadTokens();
      renderAgentsModal();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  const copyBtn = $('#nt-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(state.newToken.token);
        copyBtn.textContent = tr('misc.copied');
      } catch (_) { toast(tr('toast.copy_fail'), 'error'); }
    });
  }
  modal.querySelectorAll('.tok-row').forEach((rowEl) => {
    const tid = rowEl.dataset.tid;
    const tokenRow = state.tokens.find((x) => String(x.id) === String(tid));
    if (!tokenRow) return;
    const btn = rowEl.querySelector('.tok-revoke');
    btn.addEventListener('click', async () => {
      if (!tokenRow.revoked_at && String(state.tokenDelArmed) !== String(tid)) {
        state.tokenDelArmed = tid; // первый клик — предупреждение
        renderAgentsModal();
        return;
      }
      try {
        if (tokenRow.revoked_at) {
          await api('DELETE', '/api/tokens/' + encodeURIComponent(tid));
        } else {
          await api('PATCH', '/api/tokens/' + encodeURIComponent(tid));
          await loadAudit().catch(() => {});
        }
        await loadTokens();
        renderAgentsModal();
        renderSidebar();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

/* --- Панель «Журнал» --- */

function openAuditPanel() {
  closeCtxMenu();
  closeMobileSide(); /* модалка на мобильном перекрывает шторку */
  const overlay = $('#modal-overlay');
  overlay.hidden = false;
  overlay.innerHTML = '<div class="modal" role="dialog" aria-modal="true" id="audit-modal"><div class="modal-body"><p class="side-empty">' + esc(tr('loading')) + '</p></div></div>';
  renderAuditModal();
  overlay.onclick = (e) => { if (e.target === overlay) closeAuditPanel(); };
  loadAudit().then(renderAuditModal).catch((err) => toast(err.message, 'error'));
}

function closeAuditPanel() {
  const overlay = $('#modal-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
  overlay.onclick = null;
}

function renderAuditModal() {
  const modal = $('#audit-modal');
  if (!modal) return;
  let rows = '';
  if (!state.audit.length) rows = '<div class="side-empty">' + esc(tr('empty')) + '</div>';
  for (const r of state.audit) {
    rows +=
      '<div class="au-row">' +
        '<span class="au-at">' + esc((r.at || '').replace('T', ' ').slice(0, 19)) + '</span>' +
        '<span class="au-actor">' + esc(r.actor || 'user') + '</span>' +
        '<span class="au-action">' + fmtAuditAction(r.action || '') + '</span>' +
      '</div>';
  }
  modal.innerHTML =
    '<div class="modal-head">' +
      '<span class="modal-title">' + ICONS.journal + ' ' + esc(tr('audit.title')) + '</span>' +
      '<button class="icon-btn" id="audit-close" title="' + esc(tr('close')) + '">' + ICONS.x + '</button>' +
    '</div>' +
    '<div class="modal-body"><div class="au-list">' + rows + '</div></div>';
  $('#audit-close').addEventListener('click', closeAuditPanel);
}

/* --- Панель «Пользователи» (модалка, только admin) --- */

async function loadUsers() {
  const d = await api('GET', '/api/users');
  state.users = Array.isArray(d) ? d : asList(d, ['users', 'items']);
}

function openUsersPanel() {
  closeCtxMenu();
  closeMobileSide(); /* модалка на мобильном перекрывает шторку */
  const overlay = $('#modal-overlay');
  overlay.hidden = false;
  overlay.innerHTML = '<div class="modal" role="dialog" aria-modal="true" id="users-modal"><div class="modal-body"><p class="side-empty">' + esc(tr('loading')) + '</p></div></div>';
  overlay.onclick = (e) => { if (e.target === overlay) closeUsersPanel(); };
  renderUsersModal();
  loadUsers().then(renderUsersModal).catch((err) => {
    if (err && err.status === 403) { closeUsersPanel(); toast(err.message, 'error'); return; }
    toast(err.message, 'error');
  });
}

function closeUsersPanel() {
  const overlay = $('#modal-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
  overlay.onclick = null;
  state.newUser = null;
  state.userDelArmed = null;
}

function renderUsersModal() {
  const modal = $('#users-modal');
  if (!modal) return;
  const me = state.me;
  let list = '';
  if (!state.users.length) list = '<div class="side-empty">' + esc(tr('users.none')) + '</div>';
  for (const u of state.users) {
    const armed = String(state.userDelArmed) === String(u.id);
    const isMe = me && String(u.id) === String(me.id);
    const roleChip = '<span class="tok-scope ' + (u.role === 'admin' ? 'on' : '') + '">' +
      esc(u.role === 'admin' ? tr('users.role_admin') : tr('users.role_member')) + '</span>';
    const lastLogin = u.last_login_at
      ? tr('users.last_login') + ' ' + esc(fmtDate(u.last_login_at))
      : tr('users.never');
    list +=
      '<div class="tok-row user-row" data-uid="' + esc(u.id) + '">' +
        '<div class="tok-main">' +
          '<span class="member-dot" style="background:' + avatarColor(u.username) + '">' + esc(initials(u.display_name || u.username)) + '</span>' +
          '<span class="tok-name">' + esc(u.username) + '</span>' +
          (u.display_name && u.display_name !== u.username ? '<span class="user-display">' + esc(u.display_name) + '</span>' : '') +
          (isMe ? '<span class="tok-meta">(' + esc(tr('users.you')) + ')</span>' : '') +
        '</div>' +
        '<div class="tok-actions">' +
          '<button class="icon-btn user-reset" title="' + esc(tr('users.password')) + '">' + ICONS.key + '</button>' +
          (!isMe
            ? '<button class="icon-btn danger user-del' + (armed ? ' armed' : '') + '" title="' + esc(armed ? tr('card.delete_confirm') : tr('delete')) + '">' + ICONS.trash + '</button>'
            : '') +
        '</div>' +
        /* Вторая строка: роль + время последнего входа */
        '<div class="user-line2">' + roleChip +
          '<span class="tok-meta">' + lastLogin + '</span>' +
        '</div>' +
      '</div>';
  }
  let createdHtml = '';
  if (state.newUser) {
    createdHtml =
      '<div class="new-token">' +
        '<div class="nt-head">' + esc(tr('users.created')) + '</div>' +
        '<div class="nt-row"><code>' + esc(state.newUser.username) + '</code></div>' +
        '<div class="nt-warn">' + esc(tr('users.password')) + ': <code>' + esc(state.newUser.password) + '</code></div>' +
        '<div class="nt-warn">' + esc(tr('users.password_hint')) + '</div>' +
      '</div>';
  }
  modal.innerHTML =
    '<div class="modal-head">' +
      '<span class="modal-title">' + ICONS.users + ' ' + esc(tr('users.title')) + '</span>' +
      '<button class="icon-btn" id="users-close" title="' + esc(tr('close')) + '">' + ICONS.x + '</button>' +
    '</div>' +
    '<div class="modal-body">' +
      createdHtml +
      '<div class="tok-list">' + list + '</div>' +
      '<form class="nt-form user-form" id="user-form">' +
        '<div class="uf-row">' +
          '<input id="user-name" type="text" placeholder="' + esc(tr('users.username')) + '" maxlength="32" autocomplete="off">' +
          '<input id="user-display" type="text" placeholder="' + esc(tr('users.display_name')) + '" maxlength="100" autocomplete="off">' +
        '</div>' +
        '<div class="uf-row">' +
          '<input id="user-pass" type="password" placeholder="' + esc(tr('users.password')) + '" maxlength="200" autocomplete="new-password">' +
          '<label class="tok-scope-pick"><input type="radio" name="user-role" value="member" checked> ' + esc(tr('users.role_member')) + '</label>' +
          '<label class="tok-scope-pick"><input type="radio" name="user-role" value="admin"> ' + esc(tr('users.role_admin')) + '</label>' +
        '</div>' +
        '<button class="btn primary" type="submit">' + ICONS.plus + ' ' + esc(tr('add')) + '</button>' +
      '</form>' +
    '</div>';
  $('#users-close').addEventListener('click', closeUsersPanel);

  const form = $('#user-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('#user-name').value.trim();
    const password = $('#user-pass').value;
    if (!username) { toast(tr('users.name_required'), 'error'); $('#user-name').focus(); return; }
    if (!password || password.length < 8) { toast(tr('users.pass_required'), 'error'); $('#user-pass').focus(); return; }
    const role = form.querySelector('input[name="user-role"]:checked').value;
    const display_name = $('#user-display').value.trim() || null;
    try {
      const created = await api('POST', '/api/users', { username, password, role, display_name });
      state.newUser = { username: created.username, password };
      $('#user-name').value = '';
      $('#user-display').value = '';
      $('#user-pass').value = '';
      await loadUsers();
      renderUsersModal();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  modal.querySelectorAll('.user-reset').forEach((b) => {
    b.addEventListener('click', async () => {
      const row = b.closest('[data-uid]');
      const uid = row ? row.dataset.uid : null;
      const u = state.users.find((x) => String(x.id) === String(uid));
      if (!u) return;
      const np = prompt(tr('users.password') + ' — ' + u.username + ' (' + tr('users.role') + ': ' + u.role + ')');
      if (!np) return;
      if (np.length < 8) { toast(tr('users.pass_required'), 'error'); return; }
      try {
        await api('PATCH', '/api/users/' + encodeURIComponent(u.id), { password: np });
        toast(tr('save') + ': ' + u.username, 'ok');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });

  modal.querySelectorAll('.user-del').forEach((b) => {
    b.addEventListener('click', async () => {
      const row = b.closest('[data-uid]');
      const uid = row ? row.dataset.uid : null;
      const u = state.users.find((x) => String(x.id) === String(uid));
      if (!u) return;
      if (String(state.userDelArmed) !== String(u.id)) {
        state.userDelArmed = u.id;
        renderUsersModal();
        return;
      }
      state.userDelArmed = null;
      try {
        await api('DELETE', '/api/users/' + encodeURIComponent(u.id));
        await loadUsers();
        renderUsersModal();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

/* --- Контекстное меню исполнителя --- */

function closeCtxMenu() {
  if (state.ctxMenu) {
    state.ctxMenu.remove();
    state.ctxMenu = null;
  }
}

function openMemberCtx(m, x, y) {
  closeCtxMenu();
  const menu = el('<div class="ctx-menu" role="menu"></div>');
  const bRen = el('<button class="ctx-item" type="button">' + esc(tr('rename')) + '</button>');
  const bDel = el('<button class="ctx-item danger" type="button">' + esc(tr('delete')) + '</button>');
  menu.appendChild(bRen);
  menu.appendChild(bDel);
  document.body.appendChild(menu);
  const r = menu.getBoundingClientRect();
  const nx = Math.max(8, Math.min(x, window.innerWidth - r.width - 8));
  const ny = Math.max(8, Math.min(y, window.innerHeight - r.height - 8));
  menu.style.left = nx + 'px';
  menu.style.top = ny + 'px';
  state.ctxMenu = menu;

  bRen.addEventListener('click', () => {
    closeCtxMenu();
    state.memberRenameId = m.id;
    renderSidebar();
    const inp = $('#sidebar .mem-rename');
    if (inp) { inp.focus(); inp.select(); }
  });

  let armed = false;
  bDel.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      bDel.textContent = tr('card.delete_confirm');
      bDel.classList.add('armed');
      return;
    }
    closeCtxMenu();
    try {
      await api('DELETE', '/api/members/' + encodeURIComponent(m.id));
      await loadCore();
      await reloadMembers();
      renderApp();
    } catch (err) {
      toast(tr('toast.delete_failed') + ': ' + err.message, 'error');
    }
  });
}


/* --- Контекстное меню проекта: переименовать / в архив / из архива / удалить --- */

let projRenameId = null;

function openProjectCtx(p, anchorBtn) {
  closeCtxMenu();
  const menu = el('<div class="ctx-menu" role="menu"></div>');
  const bRen = el('<button class="ctx-item" type="button">' + esc(tr('rename')) + '</button>');
  const bArc = el('<button class="ctx-item" type="button">' + esc(p.archived ? tr('sidebar.from_archive') : tr('sidebar.to_archive')) + '</button>');
  const bDel = el('<button class="ctx-item danger" type="button">' + esc(tr('delete')) + '</button>');
  const isAdminCtx = !!(state.me && state.me.role === 'admin');
  const bAcc = isAdminCtx ? el('<button class="ctx-item" type="button">' + esc(tr('proj.access')) + '</button>') : null;
  menu.appendChild(bRen); menu.appendChild(bArc);
  if (bAcc) menu.appendChild(bAcc);
  menu.appendChild(bDel);
  document.body.appendChild(menu);
  const r = menu.getBoundingClientRect();
  const a = anchorBtn.getBoundingClientRect();
  const nx = Math.max(8, Math.min(a.left, window.innerWidth - r.width - 8));
  const ny = Math.max(8, Math.min(a.bottom + 4, window.innerHeight - r.height - 8));
  menu.style.left = nx + 'px';
  menu.style.top = ny + 'px';
  state.ctxMenu = menu;

  if (bAcc) {
    bAcc.addEventListener('click', () => {
      closeCtxMenu();
      openProjectAccess(p.id);
    });
  }

  bRen.addEventListener('click', () => {
    closeCtxMenu();
    projRenameId = p.id;
    renderSidebar();
    const inp = $('#sidebar .proj-rename');
    if (inp) { inp.focus(); inp.select(); }
  });

  bArc.addEventListener('click', async () => {
    closeCtxMenu();
    try {
      await api('PATCH', '/api/projects/' + encodeURIComponent(p.id), { archived: !p.archived });
      toast(p.archived ? tr('misc.project_unarchived') : tr('misc.project_archived'));
      await loadCore();
      if (state.view.type === 'project' && String(state.view.id) === String(p.id) && p.archived) state.view = { type: 'all' };
      renderApp();
    } catch (err) {
      toast(tr('misc.failed_update') + ': ' + err.message, 'error');
    }
  });

  let armed = false;
  bDel.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      bDel.textContent = tr('misc.delete_with_tasks');
      bDel.classList.add('armed');
      return;
    }
    closeCtxMenu();
    try {
      await api('DELETE', '/api/projects/' + encodeURIComponent(p.id));
      if (state.view.type === 'project' && String(state.view.id) === String(p.id)) state.view = { type: 'all' };
      await loadCore();
      renderApp();
      toast(tr('misc.project_deleted'));
    } catch (err) {
      toast(tr('toast.delete_failed') + ': ' + err.message, 'error');
    }
  });
}

/* --- Модалка «Доступ к проекту» (только admin) --- */

async function openProjectAccess(pid) {
  closeCtxMenu();
  closeMobileSide();
  const overlay = $('#modal-overlay');
  if (!overlay) return;
  overlay.hidden = false;
  overlay.innerHTML = '<div class="modal" role="dialog" aria-modal="true" id="access-modal"><div class="modal-body"><p class="side-empty">' + esc(tr('loading')) + '</p></div></div>';
  overlay.onclick = (e) => { if (e.target === overlay) closeAccessPanel(); };
  state.accessPid = pid;
  try {
    /* оба списка — админ-роуты; их отсутствие (сервер старее) → fallback-сообщение */
    const [users, acc] = await Promise.all([
      api('GET', '/api/users'),
      api('GET', '/api/projects/' + encodeURIComponent(pid) + '/access'),
    ]);
    state.users = Array.isArray(users) ? users : asList(users, ['users', 'items']);
    const granted = acc && acc.user_ids ? acc.user_ids : (Array.isArray(acc) ? acc : asList(acc, ['user_ids', 'users']));
    renderAccessModal(new Set(granted.map(String)));
  } catch (err) {
    rethrowAuth(err);
    state.accessPid = null;
    toast(tr('access.load_failed') + ': ' + err.message, 'error');
    closeAccessPanel();
  }
}

function closeAccessPanel() {
  const overlay = $('#modal-overlay');
  if (overlay) { overlay.hidden = true; overlay.innerHTML = ''; overlay.onclick = null; }
  state.accessPid = null;
}

/* Строим DOM модалки доступа и вешаем обработчики. */
function renderAccessModal(grantedSet) {
  const modal = $('#access-modal');
  const pid = state.accessPid;
  if (!modal || pid == null) return null;
  modal.innerHTML =
    '<div class="modal-head">' +
      '<span class="modal-title">' + ICONS.users + ' ' + esc(tr('proj.access')) + '</span>' +
      '<button class="icon-btn" id="access-close" title="' + esc(tr('close')) + '">' + ICONS.x + '</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="tok-list" id="access-list">' +
        state.users.map((u) =>
          '<label class="acc-row" data-uid="' + esc(u.id) + '">' +
            '<input type="checkbox" class="acc-check" data-uid="' + esc(u.id) + '"' + (grantedSet.has(String(u.id)) ? ' checked' : '') + '>' +
            '<span class="member-dot" style="background:' + avatarColor(u.username) + '">' + esc(initials(u.display_name || u.username)) + '</span>' +
            '<span class="tok-name">' + esc(u.username) + '</span>' +
            (u.display_name && u.display_name !== u.username ? '<span class="user-display">' + esc(u.display_name) + '</span>' : '') +
          '</label>'
        ).join('') +
      '</div>' +
      '<button class="btn primary" id="access-save">' + esc(tr('save')) + '</button>' +
    '</div>';
  $('#access-close', modal).addEventListener('click', closeAccessPanel);
  $('#access-save', modal).addEventListener('click', async () => {
    const ids = [...modal.querySelectorAll('.acc-check:checked')].map((c) => c.dataset.uid);
    try {
      await api('PUT', '/api/projects/' + encodeURIComponent(pid) + '/access', { user_ids: ids });
      toast(tr('access.saved'), 'ok');
      closeAccessPanel();
      await Promise.all([loadCore(), reloadViewFields()]);
      renderApp();
    } catch (err) {
      toast(tr('toast.save_failed') + ': ' + err.message, 'error');
    }
  });
}

/* ---------- Шапка: переключатель вида + «Поля» ---------- */

function setViewType(vt) {
  if (state.viewType === vt) return;
  closeFieldsPanel();
  closeStagesPanel();
  state.viewType = vt === 'TABLE' || vt === 'CALENDAR' ? vt : 'KANBAN';
  try { localStorage.setItem('kanban.viewType', state.viewType); } catch (_) {}
  renderApp();
}

function renderHead() {
  const head = $('#board-head');
  if (!head) return;
  const proj = currentProject();
  const name = state.view.type === 'none' ? tr('sidebar.no_project') : (proj ? proj.name : tr('sidebar.all_tasks'));
  const cnt = visibleTasks().length;
  head.innerHTML =
    '<div class="board-title">' +
      '<button class="icon-btn burger-btn" id="side-burger" title="' + esc(tr('board.menu')) + '" aria-label="' + esc(tr('board.menu')) + '">' + ICONS.menu + '</button>' +
      '<h1 class="board-name">' + esc(name) + '</h1>' +
      '<span class="board-count">' + cnt + '</span>' +
    '</div>' +
    '<div class="board-actions">' +
      '<div class="view-switch" role="tablist">' +
        '<button class="vs-btn' + (state.viewType === 'KANBAN' ? ' active' : '') + '" data-vt="KANBAN" title="' + esc(tr('board.kanban')) + '">' + ICONS.kanban + ' <span class="vs-label">' + esc(tr('board.kanban')) + '</span></button>' +
        '<button class="vs-btn' + (state.viewType === 'TABLE' ? ' active' : '') + '" data-vt="TABLE" title="' + esc(tr('board.table')) + '">' + ICONS.table + ' <span class="vs-label">' + esc(tr('board.table')) + '</span></button>' +
        '<button class="vs-btn' + (state.viewType === 'CALENDAR' ? ' active' : '') + '" data-vt="CALENDAR" title="' + esc(tr('board.calendar')) + '">' + ICONS.calendar + ' <span class="vs-label">' + esc(tr('board.calendar')) + '</span></button>' +
      '</div>' +
      '<button class="icon-btn gear-btn" id="reload-btn" title="' + esc(tr('board.reload')) + '">' + ICONS.refresh + '</button>' +
      (state.viewType === 'KANBAN'
        ? '<button class="icon-btn gear-btn' + (state.stagesOpen ? ' on' : '') + '" id="stages-btn" title="' + esc(tr('stages.panel')) + '">' + ICONS.gear + '</button>'
        : '') +
      (state.viewType === 'TABLE' || state.viewType === 'CALENDAR'
        ? '<button class="icon-btn gear-btn' + (state.fieldsOpen ? ' on' : '') + '" id="fields-btn" title="' + esc(tr('fields.panel')) + '">' + ICONS.gear + '</button>'
        : '') +
      (state.fieldsOpen && (state.viewType === 'TABLE' || state.viewType === 'CALENDAR') ? fieldsPanelHTML() : '') +
      (state.stagesOpen && state.viewType === 'KANBAN' ? stagesPanelHTML() : '') +
    '</div>';

  head.querySelectorAll('.vs-btn').forEach((b) => {
    b.addEventListener('click', () => setViewType(b.dataset.vt));
  });

  /* Бургер: открыть мобильную шторку сайдбара */
  const burger = $('#side-burger', head);
  if (burger) burger.addEventListener('click', openMobileSide);

  const rb = $('#reload-btn', head);
  if (rb) {
    rb.addEventListener('click', async () => {
      if (rb.classList.contains('spinning')) return; // защита от даблклика
      rb.classList.add('spinning');
      try {
        await loadCore();       // проекты + задачи
        await reloadStages();   // этапы (могли поменяться)
        await reloadMembers();  // исполнители
        renderApp();
      } catch (err) {
        rethrowAuth(err);
        toast(tr('toast.save_failed') + ': ' + err.message, 'error');
      } finally {
        const btn = $('#reload-btn');
        if (btn) btn.classList.remove('spinning');
      }
    });
  }

  const fb = $('#fields-btn', head);
  if (fb) {
    fb.addEventListener('click', () => {
      if (state.fieldsOpen) closeFieldsPanel();
      else {
        closeStagesPanel();
        state.fieldsOpen = true;
        state.fieldDelArmed = null;
        renderHead(); /* внутри сам вызовет wireFieldsPanel() */
      }
    });
  }
  const sb = $('#stages-btn', head);
  if (sb) {
    sb.addEventListener('click', () => {
      if (state.stagesOpen) closeStagesPanel();
      else {
        closeFieldsPanel();
        state.stagesOpen = true;
        state.stageDelArmed = null;
        renderHead(); /* внутри сам вызовет wireStagesPanel() */
      }
    });
  }
  if (state.fieldsOpen) wireFieldsPanel();
  if (state.stagesOpen) wireStagesPanel();
}

/* ---------- Панель «Поля» ---------- */

function fieldsPanelHTML() {
  const vt = state.viewType;
  const title = (vt === 'CALENDAR' ? tr('board.calendar') + ' — ' : '') + tr('fields.panel');
  let rowsHTML = '';
  for (const r of state.viewFields[vt]) {
    const isTitle = r.field_key === 'title';
    const cf = !isSystemKey(r.field_key) ? customFieldById(r.field_key.slice(7)) : null;
    const armed = String(state.fieldDelArmed) === String(r.id);
    rowsHTML +=
      '<div class="vf-row" draggable="true" data-fid="' + esc(r.id) + '">' +
        '<span class="vf-handle" title="' + esc(tr('fields.drag')) + '">' + ICONS.grip + '</span>' +
        '<label class="vf-vis">' +
          '<input type="checkbox"' + (r.is_visible ? ' checked' : '') + (isTitle ? ' disabled title="' + esc(tr('fields.always_visible')) + '"' : ' title="' + esc(tr('fields.show')) + '"') + '>' +
        '</label>' +
        '<span class="vf-name">' + esc(r.label || defaultFieldLabel(r.field_key)) + '</span>' +
        (cf
          ? '<span class="vf-type">' + esc(TYPE_LABELS[cf.type] || cf.type) + '</span>' +
            '<button class="vf-del icon-btn' + (armed ? ' armed' : '') + '" title="' + esc(armed ? tr('card.delete_confirm') : tr('delete')) + '">' + ICONS.trash + '</button>'
          : '') +
      '</div>';
  }
  const foot = state.fpAddOpen
    ? '<form id="fp-add-form" class="fp-add-form">' +
        '<input id="fp-add-name" type="text" placeholder="' + esc(tr('fields.name_placeholder')) + '" maxlength="64">' +
        '<select id="fp-add-type">' +
          '<option value="TEXT">' + esc(tr('fields.type_text')) + '</option>' +
          '<option value="NUMBER">' + esc(tr('fields.type_number')) + '</option>' +
          '<option value="DATE">' + esc(tr('fields.type_date')) + '</option>' +
          '<option value="CHECKBOX">' + esc(tr('fields.type_checkbox')) + '</option>' +
        '</select>' +
        '<div class="fp-add-actions">' +
          '<button type="button" class="btn ghost" id="fp-add-cancel">' + esc(tr('cancel')) + '</button>' +
          '<button type="submit" class="btn primary">' + esc(tr('misc.done')) + '</button>' +
        '</div>' +
      '</form>'
    : '<button class="fp-add" id="fp-add-open">' + ICONS.plus + ' ' + esc(tr('fields.add')) + '</button>';
  return '<div class="fields-panel" id="fields-panel">' +
    '<div class="fp-head"><span class="fp-title">' + esc(title) + '</span><span class="fp-hint">' + esc(tr('stages.hint')) + '</span></div>' +
    '<div class="fp-list" id="fp-list">' + rowsHTML + '</div>' +
    '<div class="fp-foot">' + foot + '</div>' +
  '</div>';
}

function wireFieldsPanel() {
  const panel = $('#fields-panel');
  if (!panel) return;
  const vt = state.viewType;

  panel.querySelectorAll('.vf-row').forEach((row) => {
    const rid = row.dataset.fid;
    const r = state.viewFields[vt].find((x) => String(x.id) === String(rid));
    if (!r) return;
    const cb = $('input[type="checkbox"]', row);
    if (cb && !cb.disabled) {
      cb.addEventListener('change', () => {
        r.is_visible = cb.checked;
        state.fieldsDirty = true;
        renderBody();
      });
    }
    const nameEl = $('.vf-name', row);
    if (nameEl && !isSystemKey(r.field_key)) {
      nameEl.classList.add('editable');
      nameEl.title = tr('misc.click_rename');
      nameEl.addEventListener('click', () => {
        if (nameEl.querySelector('input')) return;
        beginFieldRename(r, nameEl);
      });
    }
    const del = $('.vf-del', row);
    if (del) del.addEventListener('click', () => onFieldDelete(r));
    row.addEventListener('dragstart', (e) => {
      if (e.target.closest('input')) { e.preventDefault(); return; }
      state.fpDrag = String(rid);
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(rid)); } catch (_) {}
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.vf-line').forEach((x) => x.remove());
      if (state.fpDrag === String(rid)) state.fpDrag = null;
    });
  });

  const list = $('#fp-list', panel);
  list.addEventListener('dragover', (e) => {
    if (!state.fpDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rowsAll = [...list.querySelectorAll('.vf-row')];
    const dragRow = rowsAll.find((r) => r.dataset.fid === state.fpDrag);
    if (!dragRow) return;
    const others = rowsAll.filter((r) => r !== dragRow);
    let ref = null;
    for (const r of others) {
      const b = r.getBoundingClientRect();
      if (e.clientY < b.top + b.height / 2) { ref = r; break; }
    }
    let line = $('.vf-line', list);
    if (!line) line = el('<div class="vf-line"></div>');
    if (ref) list.insertBefore(line, ref);
    else if (others.length) others[others.length - 1].after(line);
    else list.appendChild(line);
  });
  list.addEventListener('dragleave', (e) => {
    if (list.contains(e.relatedTarget)) return;
    const line = $('.vf-line', list);
    if (line) line.remove();
  });
  list.addEventListener('drop', (e) => {
    if (!state.fpDrag) return;
    e.preventDefault();
    const rid = state.fpDrag;
    state.fpDrag = null;
    const line = $('.vf-line', list);
    const arr = state.viewFields[vt];
    const from = arr.findIndex((r) => String(r.id) === String(rid));
    if (from < 0) { if (line) line.remove(); return; }
    let idx = arr.length - 1;
    if (line) {
      let n = line.previousElementSibling;
      let count = 0;
      while (n) {
        if (n.classList && n.classList.contains('vf-row') && String(n.dataset.fid) !== String(rid)) count++;
        n = n.previousElementSibling;
      }
      line.remove();
      idx = count;
    }
    const moved = arr.splice(from, 1)[0];
    arr.splice(Math.max(0, Math.min(idx, arr.length)), 0, moved);
    state.fieldsDirty = true;
    renderHead();
    renderBody();
  });

  const addOpen = $('#fp-add-open', panel);
  if (addOpen) {
    addOpen.addEventListener('click', () => {
      state.fpAddOpen = true;
      renderHead();
      const inp = $('#fp-add-name');
      if (inp) inp.focus();
    });
  }
  const addForm = $('#fp-add-form', panel);
  if (addForm) {
    addForm.addEventListener('submit', onCreateCustomField);
    $('#fp-add-cancel', panel).addEventListener('click', () => {
      state.fpAddOpen = false;
      renderHead();
    });
  }
}

async function onCreateCustomField(e) {
  e.preventDefault();
  const name = $('#fp-add-name').value.trim();
  const type = $('#fp-add-type').value;
  if (!name) { toast(tr('misc.enter_name_field'), 'error'); $('#fp-add-name').focus(); return; }
  try {
    const created = await api('POST', '/api/custom-fields', { name, type });
    if (!created || created.id == null) throw new Error(tr('misc.bad_server_reply'));
    state.customFields.push({
      id: String(created.id),
      name: created.name || name,
      type: created.type || type,
      position: created.position,
      is_active: created.is_active !== false,
    });
    state.fpAddOpen = false;
    await reloadViewFields();
    renderApp();
    toast(tr('misc.field_added') + ': ' + name, 'ok');
  } catch (err) {
    toast(tr('fields.add') + ': ' + err.message, 'error');
  }
}

function beginFieldRename(r, nameEl) {
  const inp = el('<input class="vf-rename" type="text" maxlength="64">');
  inp.value = r.label || '';
  nameEl.innerHTML = '';
  nameEl.appendChild(inp);
  inp.focus();
  inp.select();
  let cancelled = false;
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    else if (e.key === 'Escape') { e.stopPropagation(); cancelled = true; inp.blur(); }
  });
  inp.addEventListener('blur', () => {
    if (cancelled) { renderHead(); return; }
    const v = inp.value.trim();
    if (!v || v === r.label) { renderHead(); return; }
    r.label = v;
    state.fieldsDirty = true;
    syncCustomRename(r, v);
    renderHead();
    renderBody();
  });
}

/* переименование custom-поля: синхронно для обоих представлений + сам справочник */
function syncCustomRename(r, v) {
  if (!r.field_key.startsWith('custom:')) return;
  const fid = r.field_key.slice(7);
  const f = customFieldById(fid);
  if (f && f.name !== v) {
    f.name = v;
    api('PATCH', '/api/custom-fields/' + encodeURIComponent(fid), { name: v }).catch(() => {});
  }
  for (const vt of ['KANBAN', 'TABLE']) {
    const row = state.viewFields[vt].find((x) => x.field_key === 'custom:' + String(fid));
    if (row && row !== r) row.label = v;
  }
}

async function onFieldDelete(r) {
  if (!r.field_key.startsWith('custom:')) return;
  const fid = r.field_key.slice(7);
  if (String(state.fieldDelArmed) !== String(r.id)) {
    state.fieldDelArmed = r.id;
    renderHead();
    return;
  }
  try {
    await api('DELETE', '/api/custom-fields/' + encodeURIComponent(fid));
    state.customFields = state.customFields.filter((f) => String(f.id) !== String(fid));
    state.fieldDelArmed = null;
    await reloadViewFields();
    renderApp();
    toast(tr('misc.field_deleted'), 'ok');
  } catch (err) {
    toast(tr('toast.delete_failed') + ': ' + err.message, 'error');
    state.fieldDelArmed = null;
    renderHead();
  }
}

/* одно закрытие панели = один PATCH /api/view-fields со всеми изменениями */
function closeFieldsPanel() {
  if (!state.fieldsOpen) return;
  state.fieldsOpen = false;
  const wasDirty = state.fieldsDirty;
  state.fieldsDirty = false;
  state.fieldDelArmed = null;
  state.fpAddOpen = false;
  renderHead();
  if (!wasDirty) return;
  const vt = state.viewType;
  const items = state.viewFields[vt]
    .filter((r) => !String(r.id).startsWith('local:'))
    .map((r, i) => {
      const it = { id: r.id, position: i, is_visible: !!r.is_visible };
      if (r.label !== r.__label0) it.label = r.label;
      return it;
    });
  if (!items.length) return;
  api('PATCH', '/api/view-fields', { items }).catch(async (err) => {
    toast(tr('toast.save_failed') + ': ' + err.message, 'error');
    try { await reloadViewFields(); renderHead(); renderBody(); } catch (_) {}
  });
}

/* ---------- Панель «Этапы» (настройка канбан-пайплайна) ---------- */

function stagesPanelHTML() {
  const list = stagesAll();
  let rowsHTML = '';
  for (const s of list) {
    const armed = String(state.stageDelArmed) === String(s.id);
    rowsHTML +=
      '<div class="vf-row st-row' + (s.is_visible ? '' : ' st-hidden') + '" draggable="true" data-sid="' + esc(s.id) + '">' +
        '<span class="vf-handle" title="' + esc(tr('fields.drag')) + '">' + ICONS.grip + '</span>' +
        '<span class="st-color-chip" data-color="' + esc(s.id) + '"><span class="dot" style="background:' + esc(stageColor(s.id)) + '"></span></span>' +
        '<span class="vf-name st-name" data-slabel="' + esc(s.id) + '">' + esc(s.label) + '</span>' +
        (s.is_done
          ? '<span class="st-done-flag" title="' + esc(tr('misc.stages_done_flag')) + '">' + esc(tr('stages.finish')) + '</span>'
          : '') +
        '<label class="vf-vis" title="' + esc(tr('misc.show_col')) + '">' +
          '<input type="checkbox" data-st-vis="' + esc(s.id) + '"' + (s.is_visible ? ' checked' : '') + '>' +
        '</label>' +
        '<button class="vf-del icon-btn' + (armed ? ' armed' : '') + '" data-st-del="' + esc(s.id) + '" title="' +
          (armed ? tr('stages.delete_warn') : tr('delete')) + '">' + ICONS.trash + '</button>' +
      '</div>';
  }
  const addForm = state.stAddOpen
    ? '<form id="st-add-form" class="fp-add-form">' +
        '<input id="st-add-name" type="text" placeholder="' + esc(tr('stages.name_placeholder')) + '" maxlength="64">' +
        '<div class="np-colors" id="st-add-colors">' +
          PALETTE.map((c, i) =>
            '<button type="button" class="np-color' + (i === 1 ? ' sel' : '') + '" data-color="' + c + '" style="background:' + c + '" title="' + c + '"></button>'
          ).join('') +
        '</div>' +
        '<label class="st-add-done"><input type="checkbox" id="st-add-isdone"> ' + esc(tr('stages.is_done_label')) + '</label>' +
        '<div class="fp-add-actions">' +
          '<button type="button" class="btn ghost" id="st-add-cancel">' + esc(tr('cancel')) + '</button>' +
          '<button type="submit" class="btn primary">' + esc(tr('misc.done')) + '</button>' +
        '</div>' +
      '</form>'
    : '<button class="fp-add" id="st-add-open">' + ICONS.plus + ' ' + esc(tr('stages.add')) + '</button>';
  return '<div class="fields-panel" id="stages-panel">' +
    '<div class="fp-head"><span class="fp-title">' + esc(tr('stages.panel')) + '</span><span class="fp-hint">' + esc(tr('stages.hint')) + '</span></div>' +
    '<div class="fp-list" id="st-list">' + rowsHTML + '</div>' +
    '<div class="fp-foot">' + addForm + '</div>' +
  '</div>';
}

function wireStagesPanel() {
  const panel = $('#stages-panel');
  if (!panel) return;

  /* Переименование по клику на имя */
  panel.querySelectorAll('.st-name').forEach((nameEl) => {
    nameEl.classList.add('editable');
    nameEl.title = tr('misc.click_rename');
    nameEl.addEventListener('click', () => {
      if (nameEl.querySelector('input')) return;
      const sid = nameEl.dataset.slabel;
      const s = stageById(sid);
      if (!s) return;
      const inp = el('<input class="vf-rename" type="text" maxlength="64">');
      inp.value = s.label;
      nameEl.innerHTML = '';
      nameEl.appendChild(inp);
      inp.focus();
      inp.select();
      let cancelled = false;
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        else if (e.key === 'Escape') { e.stopPropagation(); cancelled = true; inp.blur(); }
      });
      inp.addEventListener('blur', async () => {
        if (cancelled) { renderHead(); return; }
        const v = inp.value.trim();
        if (!v || v === s.label) { renderHead(); return; }
        try {
          await api('PATCH', '/api/stages/' + encodeURIComponent(sid), { label: v });
          s.label = v;
          renderHead();
          renderBody();
        } catch (err) {
          toast(tr('toast.rename_failed') + ': ' + err.message, 'error');
          renderHead();
        }
      });
    });
  });

  /* Видимость колонки */
  panel.querySelectorAll('input[data-st-vis]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const sid = cb.dataset.stVis;
      try {
        await api('PATCH', '/api/stages/' + encodeURIComponent(sid), { is_visible: cb.checked });
        const s = stageById(sid);
        if (s) s.is_visible = cb.checked;
        renderBody();
      } catch (err) {
        toast(tr('misc.failed_update') + ': ' + err.message, 'error');
        renderHead();
      }
    });
  });

  /* Удаление (двухшаговое, как поля) */
  panel.querySelectorAll('[data-st-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sid = btn.dataset.stDel;
      if (String(state.stageDelArmed) !== String(sid)) {
        state.stageDelArmed = sid;
        renderHead();
        return;
      }
      try {
        const out = await api('DELETE', '/api/stages/' + encodeURIComponent(sid));
        state.stageDelArmed = null;
        await reloadStages();
        renderHead();
        renderBody();
        if (out && out.reassigned_to) toast(tr('misc.stage_deleted_to') + ' «' + stageLabel(out.reassigned_to) + '»', 'ok');
      } catch (err) {
        toast(tr('toast.delete_failed') + ': ' + err.message, 'error');
        state.stageDelArmed = null;
        renderHead();
      }
    });
  });

  /* Drag-n-drop порядка этапов */
  panel.querySelectorAll('.st-row').forEach((row) => {
    row.addEventListener('dragstart', (e) => {
      if (e.target.closest('input')) { e.preventDefault(); return; }
      state.stDrag = String(row.dataset.sid);
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(row.dataset.sid)); } catch (_) {}
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      panel.querySelectorAll('.vf-line').forEach((x) => x.remove());
      state.stDrag = null;
    });
  });
  const list = $('#st-list', panel);
  if (list) {
    list.addEventListener('dragover', (e) => {
      if (!state.stDrag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rowsAll = [...list.querySelectorAll('.st-row')];
      const dragRow = rowsAll.find((r) => r.dataset.sid === state.stDrag);
      if (!dragRow) return;
      const others = rowsAll.filter((r) => r !== dragRow);
      let ref = null;
      for (const r of others) {
        const b = r.getBoundingClientRect();
        if (e.clientY < b.top + b.height / 2) { ref = r; break; }
      }
      let line = $('.vf-line', list);
      if (!line) line = el('<div class="vf-line"></div>');
      if (ref) list.insertBefore(line, ref);
      else if (others.length) others[others.length - 1].after(line);
      else list.appendChild(line);
    });
    list.addEventListener('dragleave', (e) => {
      if (list.contains(e.relatedTarget)) return;
      const line = $('.vf-line', list);
      if (line) line.remove();
    });
    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (!state.stDrag) return;
      const sid = state.stDrag;
      state.stDrag = null;
      const line = $('.vf-line', list);
      const ids = [...list.querySelectorAll('.st-row')].map((r) => r.dataset.sid);
      let idx = ids.length - 1;
      if (line) {
        let n = line.previousElementSibling;
        let count = 0;
        while (n) {
          if (n.classList && n.classList.contains('st-row') && n.dataset.sid !== sid) count++;
          n = n.previousElementSibling;
        }
        line.remove();
        idx = count;
      }
      const from = ids.indexOf(sid);
      if (from < 0) return;
      ids.splice(from, 1);
      ids.splice(Math.max(0, Math.min(idx, ids.length)), 0, sid);
      try {
        await Promise.all(ids.map((id, i) =>
          api('PATCH', '/api/stages/' + encodeURIComponent(id), { position: i + 1 })
        ));
        await reloadStages();
        renderHead();
        renderBody();
      } catch (err) {
        toast(tr('toast.save_failed') + ': ' + err.message, 'error');
        renderHead();
      }
    });
  }

  /* Добавление этапа */
  const addOpen = $('#st-add-open', panel);
  if (addOpen) {
    addOpen.addEventListener('click', () => {
      state.stAddOpen = true;
      renderHead();
      const inp = $('#st-add-name');
      if (inp) inp.focus();
    });
  }
  const addForm = $('#st-add-form', panel);
  if (addForm) {
    addForm.querySelectorAll('.np-color').forEach((b) => {
      b.addEventListener('click', () => {
        addForm.querySelectorAll('.np-color').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
      });
    });
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#st-add-name', addForm).value.trim();
      if (!name) { toast(tr('misc.enter_name_stage'), 'error'); $('#st-add-name', addForm).focus(); return; }
      const colorSel = addForm.querySelector('.np-color.sel');
      const isDone = $('#st-add-isdone', addForm).checked;
      try {
        await api('POST', '/api/stages', { label: name, color: colorSel ? colorSel.dataset.color : null, is_done: isDone });
        state.stAddOpen = false;
        await reloadStages();
        renderHead();
        renderBody();
        toast(tr('misc.stage_added') + ': ' + name, 'ok');
      } catch (err) {
        toast(tr('stages.add') + ': ' + err.message, 'error');
      }
    });
    $('#st-add-cancel', panel).addEventListener('click', () => {
      state.stAddOpen = false;
      renderHead();
    });
  }
}

/* закрытие панели этапов — просто закрыть (изменения сохраняются сразу) */
function closeStagesPanel() {
  if (!state.stagesOpen) return;
  state.stagesOpen = false;
  state.stageDelArmed = null;
  state.stAddOpen = false;
  if ($('#stages-panel')) renderHead();
}

/* ---------- Доска (канбан) ---------- */

function renderColumn(stage) {
  const tasks = visibleTasks()
    .filter((t) => t.stage === stage)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const col = el(
    '<div class="col" data-stage="' + esc(stage) + '">' +
      '<div class="col-head">' +
        '<span class="dot" style="background:' + esc(stageColor(stage)) + '"></span>' +
        '<span class="col-name">' + esc(stageLabel(stage)) + '</span>' +
        '<span class="col-count">' + tasks.length + '</span>' +
      '</div>' +
      '<div class="col-foot">' +
        '<button class="col-add">' + ICONS.plus + ' ' + esc(tr('kanban.new')) + '</button>' +
      '</div>' +
      '<div class="col-cards"></div>' +
    '</div>'
  );

  const cards = $('.col-cards', col);

  for (const t of tasks) cards.appendChild(renderCard(t));

  /* кнопка «+ Новый» → инлайн-поле, Enter создаёт */
  $('.col-add', col).addEventListener('click', () => {
    if ($('.col-add-form', col)) return;
    const form = el(
      '<form class="col-add-form">' +
        '<input type="text" placeholder="' + esc(tr('card.title_placeholder')) + '" maxlength="200">' +
      '</form>'
    );
    $('.col-foot', col).prepend(form);
    const inp = $('input', form);
    inp.focus();
    const cancel = () => { form.remove(); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = inp.value.trim();
      if (!title) { cancel(); return; }
      /* «Без проекта» — тоже место для задач; project_id: none */
      const proj = currentProject();
      const projectId = proj ? proj.id : 'none';
      try {
        const created = await api('POST', '/api/tasks', { project_id: projectId, title, stage });
        if (created && created.id) state.tasks.push(created);
        await reloadData();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); cancel(); }
    });
  });

  attachDnD(col, cards, stage);
  return col;
}

/* чип для одного поля представления (канбан-карточка) */
function chipForField(t, r) {
  const k = r.field_key;
  if (k === 'stage') {
    const dark = stageTextDark(t.stage);
    return '<span class="chip" style="background:' + esc(stageColor(t.stage)) + 'D9;color:' + (dark ? '#1b1b1f' : '#ffffff') + '">' +
      esc(stageLabel(t.stage) || t.stage) + '</span>';
  }
  if (k === 'project') {
    const p = t.project_id != null ? state.projects.find((x) => String(x.id) === String(t.project_id)) : null;
    if (!p) return '';
    if (state.view.type === 'project' && String(state.view.id) === String(p.id)) return '';
    return '<span class="chip chip-proj"><span class="dot" style="background:' + esc(p.color || '#c9c9d1') + '"></span>' + esc(p.name) + '</span>';
  }
  if (k === 'due_at') {
    if (!t.due_at) return '';
    return '<span class="chip chip-due' + (isOverdue(t.due_at) ? ' overdue' : '') + '">' + ICONS.calendar + esc(fmtDate(t.due_at)) + '</span>';
  }
  if (k === 'assignee') {
    const name = assigneeLabel(t);
    if (!name) return '';
    const m = assigneeOf(t);
    return personChipHTML(name, m ? m.color : null);
  }
  if (k === 'created_at') {
    const d = fmtDate(t.created_at);
    if (!d) return '';
    return '<span class="chip chip-proj">' + ICONS.calendar + ' ' + esc(tr('misc.created_short')) + ' ' + esc(d) + '</span>';
  }
  if (k.startsWith('custom:')) {
    const f = customFieldById(k.slice(7));
    if (!f) return '';
    const raw = taskCustomMap(t)[String(f.id)];
    if (f.type === 'CHECKBOX') {
      return isTrue(raw) ? '<span class="chip chip-check">' + ICONS.check + esc(r.label || f.name) + '</span>' : '';
    }
    if (f.type === 'DATE') {
      const d = raw ? fmtDate(raw) : null;
      return d ? '<span class="chip chip-proj">' + ICONS.calendar + esc(d) + '</span>' : '';
    }
    const v = String(raw == null ? '' : raw).trim();
    return v ? '<span class="chip chip-proj">' + esc(r.label || f.name) + ': ' + esc(v) + '</span>' : '';
  }
  return '';
}

function personChipHTML(name, color) {
  const bg = color || avatarColor(name);
  const txt = color ? colorTextOn(color) : 'rgba(27,27,31,0.72)';
  return '<span class="chip chip-person">' +
    '<span class="avatar avatar-xs" style="background:' + esc(bg) + ';color:' + txt + '">' + esc(initials(name)) + '</span>' +
    esc(name) +
  '</span>';
}

function renderCard(t) {
  let chips = '';
  for (const r of state.viewFields.KANBAN) {
    if (r.field_key === 'title') continue;          // название — всегда отдельной строкой
    if (!r.is_visible) continue;
    chips += chipForField(t, r);
  }
  const card = el(
    '<article class="card" draggable="true" data-id="' + esc(t.id) + '">' +
      '<div class="card-title">' + urgencySquareHTML(t) + '<span class="task-num">#' + esc(t.id) + '</span>' + esc(t.title) + '</div>' +
      (chips ? '<div class="card-chips">' + chips + '</div>' : '') +
    '</article>'
  );

  card.addEventListener('click', (e) => {
    if (state.dragged) return;
    openTaskModal(t.id);
  });
  card.addEventListener('dragstart', (e) => {
    state.dragged = t.id;
    card.classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', t.id); } catch (_) {}
    e.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => {
    state.dragged = null;
    card.classList.remove('dragging');
    document.querySelectorAll('.drop-ph').forEach((p) => p.remove());
    document.querySelectorAll('.col.drag-over').forEach((c) => c.classList.remove('drag-over'));
  });

  return card;
}

/* ---------- Таблица ---------- */

function tableFields() {
  return state.viewFields.TABLE.filter((r) => r.is_visible || r.field_key === 'title');
}

function sortValue(t, key) {
  if (key === 'title') return (t.title || '').toLowerCase();
  if (key === 'stage') {
    const all = stagesAll();
    const i = all.findIndex((s) => String(s.id) === String(t.stage));
    return i >= 0 ? i : all.length;
  }
  if (key === 'project') {
    const p = t.project_id != null ? state.projects.find((x) => String(x.id) === String(t.project_id)) : null;
    return p ? p.name.toLowerCase() : '';
  }
  if (key === 'due_at') {
    const d = parseDate(t.due_at);
    return d ? d.getTime() : Number.POSITIVE_INFINITY;
  }
  if (key === 'assignee') return assigneeLabel(t).toLowerCase();
  if (key === 'urgency') return { h: 0, m: 1, l: 2 }[String(t.urgency || '').toLowerCase()] ?? 3;
  if (key === 'created_at') {
    const d = parseDate(t.created_at);
    return d ? d.getTime() : 0;
  }
  if (key.startsWith('custom:')) {
    const f = customFieldById(key.slice(7));
    if (!f) return '';
    const raw = taskCustomMap(t)[String(f.id)];
    if (f.type === 'NUMBER') {
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    }
    if (f.type === 'DATE') {
      const d = parseDate(raw);
      return d ? d.getTime() : Number.POSITIVE_INFINITY;
    }
    if (f.type === 'CHECKBOX') return isTrue(raw) ? 1 : 0;
    return String(raw == null ? '' : raw).toLowerCase();
  }
  return '';
}

function sortedTableTasks() {
  const s = state.tableSort;
  return [...visibleTasks()].sort((a, b) => {
    if (s.key) {
      const va = sortValue(a, s.key);
      const vb = sortValue(b, s.key);
      let c = 0;
      if (typeof va === 'number' && typeof vb === 'number') c = va - vb;
      else c = String(va).localeCompare(String(vb), 'ru');
      if (c !== 0) return s.dir === 'asc' ? c : -c;
    }
    const all = stagesAll();
    const sa = all.findIndex((x) => String(x.id) === String(a.stage));
    const sb = all.findIndex((x) => String(x.id) === String(b.stage));
    if (sa !== sb) return (sa < 0 ? all.length : sa) - (sb < 0 ? all.length : sb);
    return (a.position ?? 0) - (b.position ?? 0);
  });
}

function toggleSort(key) {
  if (state.tableSort.key === key) {
    state.tableSort.dir = state.tableSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    state.tableSort = { key, dir: 'asc' };
  }
  renderBody();
}

function sortArrowHTML(key) {
  const active = state.tableSort.key === key;
  const cls = 'th-sort' + (active ? ' on' : '') + (active && state.tableSort.dir === 'asc' ? ' asc' : '');
  return '<span class="' + cls + '">' + ICONS.chev + '</span>';
}

function tableCellHTML(t, r) {
  const k = r.field_key;
  const ed = (kind, key) => ' data-edit="' + kind + '"' + (key ? ' data-key="' + esc(key) + '"' : '');
  if (k === 'title') {
    return '<td class="td-title"' + ed('title') + '>' + urgencySquareHTML(t) + '<span class="task-num">#' + esc(t.id) + '</span>' + esc(t.title) + '</td>';
  }
  if (k === 'urgency') {
    return '<td class="td-plain">' + urgencySquareHTML(t) + '</td>';
  }
  if (k === 'stage') {
    const dark = stageTextDark(t.stage);
    return '<td' + ed('stage') + '><span class="chip" style="background:' + esc(stageColor(t.stage)) + 'D9;color:' + (dark ? '#1b1b1f' : '#ffffff') + '">' + esc(stageLabel(t.stage) || t.stage) + '</span></td>';
  }
  if (k === 'project') {
    const p = t.project_id != null ? state.projects.find((x) => String(x.id) === String(t.project_id)) : null;
    return '<td' + ed('project') + '>' + (p
      ? '<span class="chip chip-proj"><span class="dot" style="background:' + esc(p.color || '#c9c9d1') + '"></span>' + esc(p.name) + '</span>'
      : '<span class="td-none">' + esc(tr('sidebar.no_project')) + '</span>') + '</td>';
  }
  if (k === 'due_at') {
    return '<td' + ed('date', 'due_at') + '>' + (t.due_at
      ? '<span class="td-due' + (isOverdue(t.due_at) ? ' overdue' : '') + '">' + ICONS.calendar + esc(fmtDate(t.due_at)) + '</span>'
      : '<span class="td-none">—</span>') + '</td>';
  }
  if (k === 'assignee') {
    const name = assigneeLabel(t);
    return '<td' + ed('assignee') + '>' + (name ? personChipHTML(name, assigneeOf(t) ? assigneeOf(t).color : null) : '<span class="td-none">—</span>') + '</td>';
  }
  if (k === 'created_at') {
    return '<td class="td-plain td-soft">' + esc(fmtDate(t.created_at) || '—') + '</td>';
  }
  if (k.startsWith('custom:')) {
    const fid = k.slice(7);
    const f = customFieldById(fid);
    if (!f) return '<td class="td-plain td-soft">—</td>';
    const raw = taskCustomMap(t)[String(f.id)];
    if (f.type === 'CHECKBOX') {
      return '<td class="td-check"><input type="checkbox" data-key="' + k + '"' + (isTrue(raw) ? ' checked' : '') + ' title="' + esc(tr('misc.check')) + '"></td>';
    }
    if (f.type === 'DATE') {
      return '<td' + ed('date', k) + '>' + (raw
        ? '<span class="td-due">' + ICONS.calendar + esc(fmtDate(raw)) + '</span>'
        : '<span class="td-none">—</span>') + '</td>';
    }
    if (f.type === 'NUMBER') {
      const v = raw == null ? '' : String(raw).trim();
      return '<td' + ed('number', k) + '>' + (v !== '' ? esc(v) : '<span class="td-none">—</span>') + '</td>';
    }
    const v = String(raw == null ? '' : raw).trim();
    return '<td' + ed('text', k) + '>' + (v ? esc(v) : '<span class="td-none">—</span>') + '</td>';
  }
  return '<td class="td-plain"></td>';
}

function tableRowHTML(t, fields) {
  return '<tr class="tr" data-id="' + esc(t.id) + '" title="' + esc(tr('misc.dblclick')) + '">' +
    fields.map((r) => tableCellHTML(t, r)).join('') +
  '</tr>';
}

function renderTable() {
  const fields = tableFields();
  const tasks = sortedTableTasks();
  const headHTML = fields.map((r) =>
    '<th data-k="' + esc(r.field_key) + '" title="' + esc(tr('misc.sort')) + '"><span class="th-name">' + esc(r.label || defaultFieldLabel(r.field_key)) + '</span>' + sortArrowHTML(r.field_key) + '</th>'
  ).join('');
  const bodyHTML = tasks.length
    ? tasks.map((t) => tableRowHTML(t, fields)).join('')
    : '<tr class="tr-empty"><td colspan="' + Math.max(fields.length, 1) + '">' + esc(tr('board.no_tasks')) + '</td></tr>';
  const tableFoot = '<div class="table-foot" id="table-foot">' +
    '<button class="col-add" id="table-add-btn">' + ICONS.plus + ' ' + esc(tr('board.new_task')) + '</button>' +
  '</div>';
  const tableHead = '<div class="table-head" id="table-head-row">' + tableFoot + '</div>';

  const wrap = el(
    '<div class="table-wrap">' +
      tableHead +
      '<table class="grid"><thead><tr>' + headHTML + '</tr></thead><tbody>' + bodyHTML + '</tbody></table>' +
    '</div>'
  );

  const thead = $('thead', wrap);
  const tbody = $('tbody', wrap);
  thead.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-k]');
    if (th) toggleSort(th.dataset.k);
  });
  tbody.addEventListener('click', onTableCellClick);
  tbody.addEventListener('change', onTableCellChange);
  tbody.addEventListener('dblclick', (e) => {
    const td = e.target.closest('td');
    const ed2 = td && td.querySelector('.cell-edit');
    if (ed2) { try { ed2.blur(); } catch (_) {} }
    if (e.target.closest('input,select,button')) return;
    const tr = e.target.closest('tr[data-id]');
    if (tr) openTaskModal(tr.dataset.id);
  });
  $('#table-add-btn', wrap).addEventListener('click', openTableAddForm);
  return wrap;
}

function onTableCellClick(e) {
  if (e.target.closest('input,select,button')) return;
  const td = e.target.closest('td');
  if (!td) return;
  if (td.dataset.edit) { startCellEdit(td); return; }
  const tr = td.closest('tr[data-id]');
  if (tr) openTaskModal(tr.dataset.id);
}

function onTableCellChange(e) {
  const cbox = e.target.closest('input[type="checkbox"][data-key]');
  if (!cbox) return;
  const tr = cbox.closest('tr[data-id]');
  if (!tr) return;
  patchTask(tr.dataset.id, { [cbox.dataset.key]: cbox.checked ? '1' : '0' });
}

/* inline-редактирование ячейки таблицы */
function startCellEdit(td) {
  if (td.querySelector('.cell-edit')) return;
  const tr = td.closest('tr[data-id]');
  const t = tr && taskById(tr.dataset.id);
  if (!t) return;
  const kind = td.dataset.edit;
  const key = td.dataset.key || null;
  const orig = td.innerHTML;
  let done = false;
  const restore = () => { td.innerHTML = orig; td.classList.remove('td-editing'); };
  let editor, commit;

  if (kind === 'stage') {
    editor = el('<select class="cell-edit">' +
      stagesAll().map((s) => '<option value="' + esc(s.id) + '"' + (String(s.id) === String(t.stage) ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('') +
      (stageById(t.stage) ? '' : '<option value="' + esc(t.stage) + '" selected>' + esc(stageLabel(t.stage) || t.stage) + ' ' + esc(tr('misc.stage_gone')) + '</option>') +
    '</select>');
    commit = (v) => { if (v !== t.stage) patchTask(t.id, { stage: v }); else renderBody(); };
  } else if (kind === 'project') {
    let opts = '<option value="none"' + (t.project_id == null ? ' selected' : '') + '>' + esc(tr('sidebar.no_project')) + '</option>';
    opts += state.projects.map((p) =>
      '<option value="' + esc(p.id) + '"' + (String(t.project_id) === String(p.id) ? ' selected' : '') + '>' + esc(p.name) + '</option>'
    ).join('');
    editor = el('<select class="cell-edit">' + opts + '</select>');
    commit = (v) => {
      const nv = v === 'none' ? null : v;
      if (String(nv ?? 'none') !== String(t.project_id ?? 'none')) {
        moveProj(t.id, nv, t.stage);
      } else renderBody();
    };
  } else if (kind === 'assignee') {
    let opts = '<option value=""' + (t.assignee_id == null ? ' selected' : '') + '>' + esc(tr('card.unassigned')) + '</option>';
    opts += state.members.map((m) =>
      '<option value="' + esc(m.id) + '"' + (String(t.assignee_id) === String(m.id) ? ' selected' : '') + '>' + esc(m.name) + '</option>'
    ).join('');
    const legacyName = (t.assignee_id == null && t.assignee && !state.members.some((m) => m.name === t.assignee)) ? t.assignee : null;
    if (legacyName) opts += '<option value="__keep" selected>' + esc(legacyName) + ' ' + esc(tr('misc.keep_option')) + '</option>';
    editor = el('<select class="cell-edit">' + opts + '</select>');
    commit = (v) => {
      if (v === '__keep') { renderBody(); return; }
      const nv = v || null;
      const old = t.assignee_id != null ? String(t.assignee_id) : null;
      if ((nv == null ? null : String(nv)) !== old) patchTask(t.id, { assignee_id: nv });
      else renderBody();
    };
  } else if (kind === 'date') {
    const cur = key === 'due_at'
      ? dateInputValue(t.due_at)
      : (() => { const raw = taskCustomMap(t)[key.slice(7)]; return raw ? dateInputValue(raw) : ''; })();
    editor = el('<input type="date" class="cell-edit" value="' + cur + '">');
    commit = (v) => {
      if (v !== cur) {
        if (key === 'due_at') patchTask(t.id, { due_at: v || null });
        else patchTask(t.id, { [key]: v });
      } else renderBody();
    };
  } else {
    const isNum = kind === 'number';
    const cur = kind === 'title'
      ? t.title
      : String(taskCustomMap(t)[key.slice(7)] ?? '');
    editor = el('<input type="' + (isNum ? 'number' : 'text') + '" class="cell-edit" value="' + esc(cur) + '"' +
      (isNum ? ' step="any"' : '') +
      (kind === 'title' ? ' maxlength="200"' : ' maxlength="500"') + '>');
    commit = () => {
      const v = editor.value.trim();
      if (kind === 'title') {
        if (!v) { toast(tr('misc.empty_title'), 'error'); renderBody(); return; }
        if (v !== t.title) patchTask(t.id, { title: v });
        else renderBody();
      } else {
        const f = customFieldById(key.slice(7));
        const old = String(taskCustomMap(t)[key.slice(7)] ?? '');
        if (v !== old) {
          if (f && f.type === 'NUMBER') patchTask(t.id, { [key]: v === '' ? null : v });
          else patchTask(t.id, { [key]: v });
        }
        else renderBody();
      }
    };
  }

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (!done) { done = true; restore(); }
    } else if ((kind === 'text' || kind === 'number' || kind === 'title') && e.key === 'Enter') {
      e.preventDefault();
      if (!done) { done = true; commit(); }
    }
  });
  editor.addEventListener('change', () => {
    if (kind === 'stage' || kind === 'project' || kind === 'assignee' || kind === 'date') {
      if (!done) { done = true; commit(editor.value); }
    }
  });
  editor.addEventListener('blur', () => {
    if (done) return;
    done = true;
    if (kind === 'stage' || kind === 'project' || kind === 'assignee' || kind === 'date') commit(editor.value);
    else commit();
  });

  td.classList.add('td-editing');
  td.innerHTML = '';
  td.appendChild(editor);
  editor.focus();
  if (editor.select) { try { editor.select(); } catch (_) {} }
}

/* оптимистичное сохранение задачи одним PATCH */
function applyTaskLocal(t, payload) {
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'assignee_id') {
      t.assignee_id = v;
      const m = v != null ? memberById(v) : null;
      t.assignee = m ? m.name : '';
    } else {
      t[k] = v;
    }
  }
}

async function patchTask(id, payload) {
  const t = taskById(id);
  const snapshot = t ? Object.assign({}, t) : null;
  if (t) applyTaskLocal(t, payload);
  renderBody();
  try {
    const updated = await api('PATCH', '/api/tasks/' + encodeURIComponent(id), payload);
    if (updated && updated.id) {
      const i = state.tasks.findIndex((x) => String(x.id) === String(id));
      if (i > -1) state.tasks[i] = Object.assign({}, state.tasks[i], updated);
    }
    renderBody();
  } catch (err) {
    if (snapshot) {
      const i = state.tasks.findIndex((x) => String(x.id) === String(id));
      if (i > -1) state.tasks[i] = snapshot;
    }
    renderBody();
    toast(tr('toast.save_failed') + ': ' + err.message, 'error');
  }
}

/* «+ Новая задача» в пустом месте таблицы */
function openTableAddForm() {
  const foot = $('#table-foot');
  if (!foot || $('#table-add-form')) return;
  const all = state.view.type === 'all';
  const none = state.view.type === 'none';
  if (all && !state.projects.length) { toast(tr('misc.create_project_first'), 'error'); return; }
  const form = el(
    '<form id="table-add-form" class="table-add-form">' +
      (all
        ? '<select id="ta-project">' +
            '<option value="none">' + esc(tr('sidebar.no_project')) + '</option>' +
            state.projects.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('') +
          '</select>'
        : '') +
      '<input id="ta-title" type="text" placeholder="' + esc(tr('card.title_placeholder')) + '" maxlength="200">' +
      '<button type="submit" class="btn primary">' + esc(tr('create')) + '</button>' +
    '</form>'
  );
  foot.innerHTML = '';
  foot.appendChild(form);
  const inp = $('#ta-title', form);
  inp.focus();
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); renderBody(); }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = inp.value.trim();
    if (!title) { inp.focus(); return; }
    const project_id = all
      ? $('#ta-project', form).value
      : (none ? 'none' : state.view.id);
    try {
      await api('POST', '/api/tasks', { project_id, title });
      await reloadData();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

/* ---------- Drag-n-drop ---------- */

function getCardId(node) {
  const c = node.closest && node.closest('.card');
  return c ? c.dataset.id : null;
}

function attachDnD(col, cardsEl, stage) {
  col.addEventListener('dragover', (e) => {
    if (!state.dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    col.classList.add('drag-over');

    const ph = $('.drop-ph', cardsEl);
    const after = getDropTarget(cardsEl, e.clientY);
    if (!after) {
      const last = cardsEl.lastElementChild;
      if (!(ph && ph === last)) {
        if (ph) ph.remove();
        cardsEl.appendChild(makePlaceholder());
      }
    } else if (after !== (ph && ph.nextSibling)) {
      if (ph) ph.remove();
      cardsEl.insertBefore(makePlaceholder(), after);
    }
  });

  col.addEventListener('dragleave', (e) => {
    if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over');
  });

  col.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (!state.dragged) return;
    const id = state.dragged;
    const ph = $('.drop-ph', cardsEl);

    /* целевой stage и сосед */
    let targetStage = stage;
    let beforeId = null;
    let afterId = null;
    if (ph) {
      const next = ph.nextElementSibling;
      const prev = ph.previousElementSibling;
      if (next && next.classList.contains('card')) {
        beforeId = next.dataset.id;
      } else if (prev && prev.classList.contains('card')) {
        afterId = prev.dataset.id;
      }
    }
    ph.remove();
    col.classList.remove('drag-over');

    /* оптимистичная перестановка */
    const snapshot = state.tasks.map((t) => ({ ...t }));
    moveTaskLocal(id, targetStage, beforeId, afterId);
    renderBody();

    try {
      await api('POST', '/api/tasks/' + encodeURIComponent(id) + '/move', {
        stage: targetStage,
        before_id: beforeId || undefined,
        after_id: afterId || undefined,
      });
    } catch (err) {
      state.tasks = snapshot;
      renderBody();
      toast(tr('toast.move_failed') + ': ' + err.message, 'error');
    }
  });
}

function makePlaceholder() {
  return el('<div class="drop-ph"></div>');
}

/* ближайшая карточка, перед которой встанет плейсхолдер */
function getDropTarget(cardsEl, y) {
  const list = [...cardsEl.querySelectorAll('.card:not(.dragging)')];
  for (const c of list) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) return c;
  }
  return null;
}

function taskById(id) {
  return state.tasks.find((t) => String(t.id) === String(id));
}

/* локальная перестановка (оптимистичный UI) */
function moveTaskLocal(id, stage, beforeId, afterId) {
  const t = taskById(id);
  if (!t) return;
  t.stage = stage;
  const col = state.tasks
    .filter((x) => x.stage === stage && x.id !== id)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  let pos;
  if (beforeId) {
    const b = col.findIndex((x) => x.id === beforeId);
    const prev = b > 0 ? col[b - 1].position : null;
    const next = col[b] ? col[b].position : null;
    pos = (prev != null && next != null) ? (prev + next) / 2 : (next != null ? next - 1 : (prev != null ? prev + 1 : 1));
  } else if (afterId) {
    const a = col.findIndex((x) => x.id === afterId);
    const prev = col[a] ? col[a].position : null;
    const next = a + 1 < col.length ? col[a + 1].position : null;
    pos = (prev != null && next != null) ? (prev + next) / 2 : (prev != null ? prev + 1 : (next != null ? next - 1 : 1));
  } else {
    const max = col.length ? Math.max(...col.map((x) => x.position ?? 0)) : 0;
    pos = max + 1;
  }
  t.position = pos;
}

/* ---------- Модалка задачи ---------- */

function modalCustomInput(f, t) {
  const raw = taskCustomMap(t)[String(f.id)];
  const fid = esc(f.id);
  if (f.type === 'CHECKBOX') {
    return '<label class="field"><span class="field-label">' + esc(f.name) + '</span>' +
      '<input class="mf-custom" data-fid="' + fid + '" data-type="CHECKBOX" type="checkbox"' + (isTrue(raw) ? ' checked' : '') + '></label>';
  }
  if (f.type === 'NUMBER') {
    return '<label class="field"><span class="field-label">' + esc(f.name) + '</span>' +
      '<input class="mf-custom" data-fid="' + fid + '" data-type="NUMBER" type="number" step="any" value="' + esc(raw == null ? '' : raw) + '"></label>';
  }
  if (f.type === 'DATE') {
    return '<label class="field"><span class="field-label">' + esc(f.name) + '</span>' +
      '<input class="mf-custom" data-fid="' + fid + '" data-type="DATE" type="date" value="' + (raw ? dateInputValue(raw) : '') + '"></label>';
  }
  return '<label class="field"><span class="field-label">' + esc(f.name) + '</span>' +
    '<input class="mf-custom" data-fid="' + fid + '" data-type="TEXT" type="text" maxlength="500" value="' + esc(raw == null ? '' : raw) + '"></label>';
}

function openTaskModal(id) {
  const t = taskById(id);
  if (!t) return;
  state.deleteArmed = false;
  const overlay = $('#modal-overlay');

  const customs = activeCustomFields();
  let customsHTML = '';
  for (let i = 0; i < customs.length; i += 2) {
    customsHTML += '<div class="field-row">' + customs.slice(i, i + 2).map((f) => modalCustomInput(f, t)).join('') + '</div>';
  }

  let assigneeOpts = '<option value=""' + (t.assignee_id == null ? ' selected' : '') + '>' + esc(tr('card.unassigned')) + '</option>';
  assigneeOpts += state.members.map((m) =>
    '<option value="' + esc(m.id) + '"' + (String(t.assignee_id) === String(m.id) ? ' selected' : '') + '>' + esc(m.name) + '</option>'
  ).join('');
  const legacyName = (t.assignee_id == null && t.assignee && !state.members.some((m) => m.name === t.assignee)) ? t.assignee : null;
  if (legacyName) assigneeOpts += '<option value="__keep" selected>' + esc(legacyName) + ' ' + esc(tr('misc.keep_option')) + '</option>';

  /* Проект: текущий + все остальные + «Без проекта» (пункт видим, когда нужен) */
  let projectOpts = '<option value="none"' + (t.project_id == null ? ' selected' : '') + '>' + esc(tr('sidebar.no_project')) + '</option>';
  projectOpts += state.projects.map((p) =>
    '<option value="' + esc(p.id) + '"' + (String(t.project_id) === String(p.id) ? ' selected' : '') + '>' + esc(p.name) + '</option>'
  ).join('');
  if (t.project_id != null && !state.projects.some((p) => String(p.id) === String(t.project_id))) {
    projectOpts += '<option value="__keep" selected>#' + esc(t.project_id) + ' ' + esc(tr('misc.project_gone')) + '</option>';
  }

  overlay.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-head">' +
        '<span class="modal-title">' + esc(tr('misc.task_n')) + esc(t.id) + '</span>' +
        '<button class="icon-btn" id="modal-close" title="' + esc(tr('close')) + '">' + ICONS.x + '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<label class="field"><span class="field-label">' + esc(tr('misc.name')) + '</span>' +
          '<input id="mf-title" type="text" maxlength="200" value="' + esc(t.title) + '"></label>' +
        '<div class="field-row">' +
          '<label class="field"><span class="field-label">' + esc(tr('card.stage')) + '</span>' +
            '<select id="mf-stage">' +
              stagesAll().map((s) => '<option value="' + esc(s.id) + '"' + (String(s.id) === String(t.stage) ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('') +
              (stageById(t.stage) ? '' : '<option value="' + esc(t.stage) + '" selected>' + esc(stageLabel(t.stage) || t.stage) + ' ' + esc(tr('misc.stage_gone')) + '</option>') +
            '</select></label>' +
          '<label class="field"><span class="field-label">' + esc(tr('card.project')) + '</span>' +
            '<select id="mf-project">' + projectOpts + '</select></label>' +
        '</div>' +
        '<div class="field-row">' +
          '<label class="field"><span class="field-label">' + esc(tr('card.due')) + '</span>' +
            '<input id="mf-due" type="date" value="' + dateInputValue(t.due_at) + '"></label>' +
          '<label class="field"><span class="field-label">' + esc(tr('card.assignee')) + '</span>' +
            '<select id="mf-assignee">' + assigneeOpts + '</select></label>' +
        '</div>' +
        '<div class="field-row">' +
          '<label class="field"><span class="field-label">' + esc(tr('task.urgency')) + '</span>' +
            '<select id="mf-urgency">' +
              '<option value=""' + (t.urgency ? '' : ' selected') + '>—</option>' +
              ['h', 'm', 'l'].map((u) => '<option value="' + u + '"' + (String(t.urgency).toLowerCase() === u ? ' selected' : '') + '>' + esc(tr('task.urg_' + u)) + '</option>').join('') +
            '</select></label>' +
        '</div>' +
        customsHTML +
        '<div class="field notes-field">' +
          '<div class="notes-head">' +
            '<span class="field-label">' + esc(tr('card.notes')) + '</span>' +
            '<div class="notes-tools">' +
              '<button type="button" class="btn ghost btn-sm" id="notes-toggle">' + esc(tr('misc.editor')) + '</button>' +
            '</div>' +
          '</div>' +
          '<textarea id="mf-notes" rows="8" placeholder="Markdown… (# h1, **bold**, - list)" hidden>' + esc(t.notes || '') + '</textarea>' +
          '<div id="notes-preview" class="md-preview"></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn danger" id="mf-delete">' + ICONS.trash + ' <span>' + esc(tr('delete')) + '</span></button>' +
        '<span class="spacer"></span>' +
        '<button class="btn ghost" id="mf-cancel">' + esc(tr('cancel')) + '</button>' +
        '<button class="btn primary" id="mf-save">' + esc(tr('save')) + '</button>' +
      '</div>' +
    '</div>';

  /* Модалка на мобильном перекрывает шторку — закрываем её, чтобы не мешала */
  overlay.hidden = false;
  closeMobileSide();
  $('#mf-title', overlay).focus();

  // --- Редактор заметок: превью markdown ---
  const notesTa = $('#mf-notes', overlay);
  const notesPrev = $('#notes-preview', overlay);
  const notesToggle = $('#notes-toggle', overlay);
  /* По умолчанию заметки открываются в режиме markdown-просмотра. */
  notesPrev.innerHTML = renderMarkdown(notesTa.value) || '<p class="md-empty">' + esc(tr('misc.notes_empty')) + '</p>';
  notesToggle.addEventListener('click', () => {
    const show = notesPrev.hidden;
    if (show) {
      notesPrev.innerHTML = renderMarkdown(notesTa.value) || '<p class="md-empty">' + esc(tr('misc.notes_empty')) + '</p>';
      notesPrev.hidden = false;
      notesTa.hidden = true;
      notesToggle.textContent = tr('misc.editor');
    } else {
      notesPrev.hidden = true;
      notesTa.hidden = false;
      notesToggle.textContent = tr('misc.preview');
      notesTa.focus();
    }
  });
  const close = () => {
    overlay.hidden = true; overlay.innerHTML = '';
  };
  $('#modal-close', overlay).addEventListener('click', close);
  $('#mf-cancel', overlay).addEventListener('click', close);
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) close();
  });

  const del = $('#mf-delete', overlay);
  del.addEventListener('click', async () => {
    if (!state.deleteArmed) {
      state.deleteArmed = true;
      del.classList.add('armed');
      $('span', del).textContent = tr('misc.confirm_short');
      return;
    }
    try {
      await api('DELETE', '/api/tasks/' + encodeURIComponent(id));
      close();
      await reloadData();
    } catch (err) {
      toast(tr('toast.delete_failed') + ': ' + err.message, 'error');
    }
  });

  $('#mf-save', overlay).addEventListener('click', async () => {
    const title = $('#mf-title', overlay).value.trim();
    if (!title) { toast(tr('misc.empty_title'), 'error'); return; }
    const due = $('#mf-due', overlay).value; // YYYY-MM-DD или ''
    const uv = $('#mf-urgency', overlay).value;
    const payload = {
      title,
      stage: $('#mf-stage', overlay).value,
      due_at: due || null,
      urgency: uv === '' ? null : uv,
      notes: $('#mf-notes', overlay).value,
    };
    const pv = $('#mf-project', overlay).value;
    if (pv !== '__keep') payload.project_id = pv === 'none' ? 'none' : pv;
    const av = $('#mf-assignee', overlay).value;
    if (av !== '__keep') payload.assignee_id = av || null;
    overlay.querySelectorAll('.mf-custom').forEach((inp) => {
      const ty = inp.dataset.type;
      let v;
      if (ty === 'CHECKBOX') v = inp.checked;                       // boolean
      else if (ty === 'NUMBER') v = inp.value.trim() === '' ? null : inp.value.trim(); // пусто = очистить
      else v = inp.value.trim() === '' ? null : inp.value.trim();
      payload['custom:' + inp.dataset.fid] = v;
    });
    try {
      await api('PATCH', '/api/tasks/' + encodeURIComponent(id), payload);
      close();
      await reloadData();
    } catch (err) {
      toast(tr('toast.save_failed') + ': ' + err.message, 'error');
    }
  });
}


/* ---------- Markdown-рендер заметок (без зависимостей) ---------- */

function escapeHtmlAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mdInline(s) {
  // СНАЧАЛА экранируем HTML (безопасность), потом разметка строит свои теги
  s = escapeHtmlAttr(s);
  // код (сначала, чтобы внутри не обрабатывать прочее)
  s = s.replace(/`([^`]+)`/g, (_, c) => '<code>' + c + '</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inCode = false, codeBuf = [], listMode = null, para = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + mdInline(para.join(' ')) + '</p>'); para = []; } };
  const flushList = () => { if (listMode) { out.push('</' + listMode + '>'); listMode = null; } };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (inCode) {
      if (/^```/.test(line)) { out.push('<pre><code>' + escapeHtmlAttr(codeBuf.join('\n')) + '</code></pre>'); codeBuf = []; inCode = false; }
      else codeBuf.push(raw);
      continue;
    }
    if (/^```/.test(line)) { flushPara(); flushList(); inCode = true; continue; }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flushPara(); flushList(); const n = h[1].length; out.push('<h' + n + '>' + mdInline(h[2]) + '</h' + n + '>'); continue; }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ul) { flushPara(); if (listMode !== 'ul') { flushList(); out.push('<ul>'); listMode = 'ul'; } out.push('<li>' + mdInline(ul[1]) + '</li>'); continue; }
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ol) { flushPara(); if (listMode !== 'ol') { flushList(); out.push('<ol>'); listMode = 'ol'; } out.push('<li>' + mdInline(ol[1]) + '</li>'); continue; }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) { flushPara(); flushList(); out.push('<blockquote>' + mdInline(q[1]) + '</blockquote>'); continue; }
    if (/^(---+|\*\*\*+)$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); continue; }
    flushList();
    para.push(line.trim());
  }
  if (inCode) out.push('<pre><code>' + escapeHtmlAttr(codeBuf.join('\n')) + '</code></pre>');
  flushPara(); flushList();
  return out.join('\n') || '';
}

/* ---------- Глобальные обработчики ---------- */

/* Выход из мобильной вёрстки (окно растянули) — закрыть шторку и скрим */
try {
  window.matchMedia('(max-width: 720px)').addEventListener('change', (e) => {
    if (!e.matches && state.mobileSideOpen) closeMobileSide();
  });
} catch (_) { /* старые браузеры — не критично */ }

document.addEventListener('mousedown', (e) => {
  if (state.ctxMenu && !state.ctxMenu.contains(e.target)) closeCtxMenu();
  if (state.fieldsOpen) {
    const p = $('#fields-panel');
    const b = $('#fields-btn');
    if (p && !p.contains(e.target) && !(b && b.contains(e.target))) closeFieldsPanel();
  }
  if (state.stagesOpen) {
    const p = $('#stages-panel');
    const b = $('#stages-btn');
    if (p && !p.contains(e.target) && !(b && b.contains(e.target))) closeStagesPanel();
  }
  if (state.calPop) {
    const p = $('#cal-pop');
    if (p && !p.contains(e.target)) { state.calPop = null; renderBody(); }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (state.ctxMenu) { closeCtxMenu(); return; }
  if (state.mobileSideOpen) { closeMobileSide(); return; }
  const overlay = $('#modal-overlay');
  if (overlay && !overlay.hidden) {
    overlay.hidden = true;
    overlay.innerHTML = '';
    overlay.onclick = null;
    state.newToken = null;
    state.tokenDelArmed = null;
    return;
  }
  if (state.fieldsOpen) { closeFieldsPanel(); return; }
  if (state.stagesOpen) { closeStagesPanel(); return; }
  const np = $('#np-form');
  if (np) { state.npOpen = false; renderSidebar(); return; }
  const mf = $('#mem-form');
  if (mf) { state.memFormOpen = false; renderSidebar(); return; }
  const mr = $('.mem-rename');
  if (mr) { state.memberRenameId = null; renderSidebar(); return; }
  const f = $('.col-add-form');
  if (f) { f.remove(); return; }
  const tf = $('#table-add-form');
  if (tf) renderBody();
});

/* ---------- Старт ---------- */

boot().catch((e) => {
  /* 401 → login.html уже показан сервером на «/»; при ошибке API просто
     показываем локальный экран входа (fallback). */
  if (!e || e.message !== 'AUTH_REQUIRED') console.error(e);
  showLogin();
});