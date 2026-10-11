/* =========================================================
   Никита — портфолио. Интеракция.
   ========================================================= */
(function () {
  'use strict';

  /* ---- Тема ---- */
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f1ea' : '#0b0b0d');
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  toggle.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  /* ---- Шапка: блюр при скролле ---- */
  var header = document.getElementById('header');
  var onScrollHeader = function () {
    header.classList.toggle('header--scrolled', window.scrollY > 24);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---- Мобильное меню ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('.nav__link')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---- Появление элементов при скролле ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Подсветка активного пункта меню ---- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav__link'));
  var sections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  });

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link, i) {
          link.classList.toggle('is-active', sections[i] === entry.target);
        });
      });
    }, { threshold: 0.4, rootMargin: '-74px 0px -40% 0px' });

    sections.forEach(function (sec) { if (sec) sectionObserver.observe(sec); });
  }

  /* ---- Кастомный курсор ---- */
  var ring = document.querySelector('.cursor__ring');
  var dot = document.querySelector('.cursor__dot');

  if (ring && dot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var ringPos = { x: mouse.x, y: mouse.y };
    var dotPos = { x: mouse.x, y: mouse.y };
    var raf = null;

    var loop = function () {
      ringPos.x += (mouse.x - ringPos.x) * 0.16;
      ringPos.y += (mouse.y - ringPos.y) * 0.16;
      dotPos.x += (mouse.x - dotPos.x) * 0.35;
      dotPos.y += (mouse.y - dotPos.y) * 0.35;

      ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px) translate(-50%,-50%)';
      dot.style.transform = 'translate(' + dotPos.x + 'px,' + dotPos.y + 'px) translate(-50%,-50%)';

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });

    document.addEventListener('mouseleave', function () { document.body.classList.add('cursor--hidden'); });
    document.addEventListener('mouseenter', function () { document.body.classList.remove('cursor--hidden'); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-cursor]'), function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor--hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor--hover'); });
    });
  }

  /* ---- Год в подвале ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- Форма заявок ---- */
  var form = document.getElementById('form');
  if (form) {
    var ENDPOINT = 'https://formsubmit.co/ajax/nikitayakut115@gmail.com';
    var status = document.getElementById('formStatus');
    var submitBtn = document.getElementById('formSubmit');
    var btnLabel = submitBtn.querySelector('.form__label-text');
    var busy = false;

    function showStatus(kind, text) {
      status.textContent = text || '';
      status.className = 'form__status' + (kind ? ' form__status--' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;

      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });

      /* Honeypot: боты заполнят скрытое поле — молча делаем вид, что всё прошло */
      if (payload._honey) {
        form.reset();
        showStatus('ok', 'Заявка отправлена. Спасибо!');
        return;
      }

      busy = true;
      submitBtn.disabled = true;
      btnLabel.textContent = 'Отправляю…';
      showStatus('', '');

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          message: payload.message,
          _subject: payload._subject,
          _template: payload._template
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (res) {
          if (res && (res.success === 'true' || res.success === true)) {
            form.reset();
            /* FormSubmit при первой заявке просит подтвердить адрес по почте */
            var needsConfirm = res.message && /confirm|activat/i.test(res.message);
            showStatus('ok', needsConfirm
              ? 'Почти готово: сервис прислал письмо на nikitayakut115@gmail.com — откройте его и нажмите «Activate Form», после этого заявки начнут доходить.'
              : 'Заявка улетела. Отвечу в течение дня.');
            btnLabel.textContent = 'Отправлено ✓';
            setTimeout(function () { btnLabel.textContent = 'Отправить заявку'; }, 4000);
          } else {
            var msg = (res && res.message) || '';

            /* Страницу открыли как файл (file://) — FormSubmit такое не принимает */
            if (/HTML files|web server/i.test(msg)) {
              showStatus('err', 'Сайт открыт как локальный файл, а сервис заявок требует веб-сервер. Откройте через http://localhost:8099 или задеплойте сайт на хостинг.');
              return;
            }

            /* Форма ещё не активирована — нужно письмо с ссылкой активации */
            if (/activation|activate/i.test(msg)) {
              showStatus('ok', 'Заявка принята, но форма ещё не активирована. На nikitayakut115@gmail.com пришло письмо — откройте его и нажмите «Activate Form». Проверьте папку «Спам».');
              form.reset();
              btnLabel.textContent = 'Отправлено ✓';
              setTimeout(function () { btnLabel.textContent = 'Отправить заявку'; }, 4000);
              return;
            }

            showStatus('err', 'Что-то пошло не так. Напишите напрямую в Telegram — слева.');
          }
        })
        .catch(function () {
          showStatus('err', 'Не удалось отправить. Напишите напрямую в Telegram — слева.');
        })
        .finally(function () {
          busy = false;
          submitBtn.disabled = false;
        });
    });
  }
})();
