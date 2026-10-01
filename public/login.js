/* login.js — public sign-in page (served instead of index.html when the
 * visitor has no session). Mirrors the login screen styles already present
 * in style.css; texts via I18N (EN/RU/ZH) with a language switcher.
 * After a successful sign-in → redirect to / (the app itself).
 */
'use strict';

(function () {
  /* --- mini i18n (subset needed here; kept in sync with app.js) --- */
  var I18N = {
    en: {
      title: 'Kanban', subtitle: 'Sign in to your workspace',
      username: 'Username', password: 'Password', submit: 'Sign in',
      invalid: 'Invalid username or password',
      rate: 'Too many attempts. Wait a minute.',
      failed: 'Sign-in failed', unavailable: 'Server unreachable',
      goToSetup: 'Initial setup has not been completed yet — open the setup wizard',
    },
    ru: {
      title: 'Kanban', subtitle: 'Войдите в своё рабочее пространство',
      username: 'Логин', password: 'Пароль', submit: 'Войти',
      invalid: 'Неверный логин или пароль',
      rate: 'Слишком много попыток. Подождите минуту.',
      failed: 'Ошибка входа', unavailable: 'Сервер недоступен',
      goToSetup: 'Первичная настройка ещё не завершена — открыть мастер настройки',
    },
    zh: {
      title: '看板', subtitle: '登录到您的工作区',
      username: '用户名', password: '密码', submit: '登录',
      invalid: '用户名或密码错误',
      rate: '尝试次数过多，请稍后再试。',
      failed: '登录失败', unavailable: '服务器无法连接',
      goToSetup: '初始设置尚未完成 — 打开设置向导',
    },
  };
  var NAMES = { en: 'English', ru: 'Русский', zh: '中文' };
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

  function render(mode) {
    /* mode: 'login' | 'setup-required' */
    var root = document.getElementById('root');
    var setupNote = mode === 'setup-required'
      ? '<p class="login-error" id="setup-note" style="color:var(--accent)">' + esc(t('goToSetup')) + '</p>'
      : '';
    root.innerHTML =
      '<div class="login-wrap">' +
        '<form class="login-card" id="login-form">' +
          '<div class="login-logo">K</div>' +
          '<h1>' + esc(t('title')) + '</h1>' +
          '<p class="login-sub">' + esc(t('subtitle')) + '</p>' +
          setupNote +
          '<input id="login-user" type="text" placeholder="' + esc(t('username')) + '" autocomplete="username" required>' +
          '<input id="login-pass" type="password" placeholder="' + esc(t('password')) + '" autocomplete="current-password" required>' +
          '<p class="login-error" id="login-error" hidden></p>' +
          '<button class="login-submit" type="submit">' + esc(t('submit')) + '</button>' +
          '<div class="login-lang">' + langSwitcher() + '</div>' +
        '</form>' +
      '</div>';

    document.documentElement.lang = locTag();

    Array.prototype.forEach.call(root.querySelectorAll('.lang-opt'), function (b) {
      b.addEventListener('click', function () {
        lang = b.getAttribute('data-lang');
        try { localStorage.setItem('kanban.lang', lang); } catch (e) {}
        render(mode);
      });
    });

    var form = document.getElementById('login-form');
    var errEl = document.getElementById('login-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.hidden = true;
      var btn = form.querySelector('.login-submit');
      btn.disabled = true;
      fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('login-user').value,
          password: document.getElementById('login-pass').value,
        }),
      }).then(function (res) {
        if (res.ok) { location.replace('/'); return; }
        return res.json().catch(function () { return null; }).then(function (data) {
          if (res.status === 401) errEl.textContent = t('invalid');
          else if (res.status === 429) errEl.textContent = t('rate');
          else if (data && data.error === 'Setup is already completed') errEl.textContent = t('invalid');
          else errEl.textContent = (data && data.error) || (t('failed') + ' (' + res.status + ')');
          errEl.hidden = false;
        });
      }).catch(function () {
        errEl.textContent = t('unavailable');
        errEl.hidden = false;
      }).finally(function () {
        btn.disabled = false;
        document.getElementById('login-pass').focus();
      });
    });
    document.getElementById('login-user').focus();
  }

  function langSwitcher() {
    return '<div class="lang-switch">' + Object.keys(I18N).map(function (l) {
      return '<button type="button" class="lang-opt' + (lang === l ? ' on' : '') + '" data-lang="' + l + '">' + NAMES[l] + '</button>';
    }).join('') + '</div>';
  }

  /* Решаем, что показать: если инстанс ещё не настроен — намекаем на мастер. */
  fetch('/api/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (me) {
      if (me && me.setup_required) { location.replace('/'); return; } // сервер сам отдаст setup.html
      render('login');
    })
    .catch(function () { render('login'); });
})();