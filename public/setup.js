/* setup.js — first-run wizard: creates the administrator account.
 * Served at / by the server while the users table is empty. On success the
 * server responds with a session cookie → redirect to / (the app).
 */
'use strict';

(function () {
  var I18N = {
    en: {
      brand: 'Kanban', title: 'Welcome to Kanban',
      desc: 'Create the administrator account to finish setting up. You can add more users later in Settings.',
      username: 'Username', usernameHint: '2–32 characters: latin letters, digits, dot, dash, underscore',
      displayName: 'Display name (optional)', displayNameHint: 'Shown on the board; defaults to the username',
      password: 'Password', passwordHint: 'At least 8 characters',
      confirm: 'Confirm password', mismatch: 'Passwords do not match',
      token: 'Setup token (if configured)',
      submit: 'Create account and start',
      unavailable: 'Server unreachable',
      already: 'Setup is already completed — sign in instead.',
      engine: 'Storage',
    },
    ru: {
      brand: 'Kanban', title: 'Добро пожаловать в Kanban',
      desc: 'Создайте учётную запись администратора, чтобы завершить настройку. Пользователей можно добавлять позже в настройках.',
      username: 'Логин', usernameHint: '2–32 символа: латиница, цифры, точка, дефис, подчёркивание',
      displayName: 'Отображаемое имя (необязательно)', displayNameHint: 'Показывается на доске; по умолчанию — логин',
      password: 'Пароль', passwordHint: 'Минимум 8 символов',
      confirm: 'Повторите пароль', mismatch: 'Пароли не совпадают',
      token: 'Токен настройки (если задан)',
      submit: 'Создать учётную запись и начать',
      unavailable: 'Сервер недоступен',
      already: 'Настройка уже завершена — войдите.',
      engine: 'Хранилище',
    },
    zh: {
      brand: '看板', title: '欢迎使用看板',
      desc: '创建管理员帐户以完成设置。之后可以在设置中添加更多用户。',
      username: '用户名', usernameHint: '2–32 个字符：字母、数字、点、连字符、下划线',
      displayName: '显示名称（可选）', displayNameHint: '显示在版面上；默认为用户名',
      password: '密码', passwordHint: '至少 8 个字符',
      confirm: '确认密码', mismatch: '两次输入的密码不一致',
      token: '设置令牌（如已配置）',
      submit: '创建帐户并开始',
      unavailable: '服务器无法连接',
      already: '设置已完成 — 请直接登录。',
      engine: '存储',
    },
  };
  var NAMES = { en: 'English', ru: 'Русский', zh: '中文' };
  var ENGINE_NAMES = { sqlite: 'SQLite (built-in)', postgres: 'PostgreSQL' };
  var lang = (function () {
    try {
      var s = localStorage.getItem('kanban.lang');
      if (s && I18N[s]) return s;
    } catch (e) {}
    var nav = navigator.language || 'en';
    return /^ru/i.test(nav) ? 'ru' : (/^zh/i.test(nav) ? 'zh' : 'en');
  })();

  function t(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }
  function locTag() { return lang === 'ru' ? 'ru-RU' : (lang === 'zh' ? 'zh-CN' : 'en-US'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var status = { engine: 'sqlite', tokenRequired: false };

  function render(errMsg) {
    var root = document.getElementById('root');
    root.innerHTML =
      '<div class="login-wrap">' +
        '<form class="login-card setup-card" id="setup-form">' +
          '<div class="login-logo">K</div>' +
          '<h1>' + esc(t('title')) + '</h1>' +
          '<p class="login-sub">' + esc(t('desc')) + '</p>' +
          '<div class="setup-engine">' + esc(t('engine')) + ': <code>' + esc(ENGINE_NAMES[status.engine] || status.engine) + '</code></div>' +
          '<input id="su-user" type="text" placeholder="' + esc(t('username')) + '" autocomplete="username" required>' +
          '<p class="setup-hint">' + esc(t('usernameHint')) + '</p>' +
          '<input id="su-display" type="text" placeholder="' + esc(t('displayName')) + '" autocomplete="name">' +
          '<p class="setup-hint">' + esc(t('displayNameHint')) + '</p>' +
          '<input id="su-pass" type="password" placeholder="' + esc(t('password')) + '" autocomplete="new-password" required>' +
          '<p class="setup-hint">' + esc(t('passwordHint')) + '</p>' +
          '<input id="su-pass2" type="password" placeholder="' + esc(t('confirm')) + '" autocomplete="new-password" required>' +
          (status.tokenRequired
            ? '<input id="su-token" type="password" placeholder="' + esc(t('token')) + '" autocomplete="off">'
            : '') +
          '<p class="login-error" id="setup-error"' + (errMsg ? '' : ' hidden') + '>' + esc(errMsg || '') + '</p>' +
          '<button class="login-submit" type="submit">' + esc(t('submit')) + '</button>' +
          '<div class="login-lang">' + langSwitcher() + '</div>' +
        '</form>' +
      '</div>';
    document.documentElement.lang = locTag();

    Array.prototype.forEach.call(root.querySelectorAll('.lang-opt'), function (b) {
      b.addEventListener('click', function () {
        lang = b.getAttribute('data-lang');
        try { localStorage.setItem('kanban.lang', lang); } catch (e) {}
        render();
      });
    });

    var form = document.getElementById('setup-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('setup-error');
      var pass = document.getElementById('su-pass').value;
      var pass2 = document.getElementById('su-pass2').value;
      if (pass !== pass2) { errEl.textContent = t('mismatch'); errEl.hidden = false; return; }
      var btn = form.querySelector('.login-submit');
      btn.disabled = true;
      errEl.hidden = true;
      var payload = {
        username: document.getElementById('su-user').value,
        password: pass,
        display_name: document.getElementById('su-display').value || null,
      };
      if (status.tokenRequired) payload.setup_token = document.getElementById('su-token').value;
      fetch('/api/setup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(function (res) {
        if (res.ok) { location.replace('/'); return; }
        return res.json().catch(function () { return null; }).then(function (data) {
          if (res.status === 403 && data && /already/i.test(data.error || '')) {
            /* Настройка уже завершена — на страницу входа. */
            location.replace('/login.html');
            return;
          }
          errEl.textContent = (data && data.error) || t('unavailable');
          errEl.hidden = false;
        });
      }).catch(function () {
        errEl.textContent = t('unavailable');
        errEl.hidden = false;
      }).finally(function () {
        btn.disabled = false;
      });
    });
    document.getElementById('su-user').focus();
  }

  function langSwitcher() {
    return '<div class="lang-switch">' + Object.keys(I18N).map(function (l) {
      return '<button type="button" class="lang-opt' + (lang === l ? ' on' : '') + '" data-lang="' + l + '">' + NAMES[l] + '</button>';
    }).join('') + '</div>';
  }

  /* Требуется ли вообще настройка? (на случай прямого захода на /setup.html) */
  fetch('/api/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (me) {
      if (!me || !me.setup_required) { location.replace('/login.html'); return; }
      status.engine = me.engine || 'sqlite';
      status.tokenRequired = !!me.setup_token_required;
      render();
    })
    .catch(function () { render(t('unavailable')); });
})();