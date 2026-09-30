(function () {
  'use strict';

  // Появление блоков при прокрутке
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Год в футере
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var form = document.getElementById('lead-form');
  if (!form) return;
  var typeSelect = form.elements.type;

  // Кнопка «Заказать …» в карточке тарифа сразу выбирает тип сайта в форме
  document.querySelectorAll('[data-plan]').forEach(function (btn) {
    btn.addEventListener('click', function () { typeSelect.value = btn.getAttribute('data-plan'); });
  });

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var TG = /^@[A-Za-z0-9_]{5,32}$/;

  function isPhone(v) {
    var digits = v.replace(/\D/g, '');
    return /^[+\d][\d\s()-]+$/.test(v) && digits.length >= 10 && digits.length <= 15;
  }

  var rules = {
    name: function (v) {
      if (!v) return 'Напишите, как к вам обращаться';
      if (v.length < 2) return 'Имя слишком короткое — минимум 2 символа';
      return '';
    },
    contact: function (v) {
      if (!v) return 'Оставьте телефон, e-mail или @ник в Telegram — иначе я не смогу ответить';
      if (EMAIL.test(v) || TG.test(v) || isPhone(v)) return '';
      return 'Проверьте контакт: например +7 900 123-45-67, name@mail.ru или @username';
    },
    type: function (v) { return v ? '' : 'Выберите тип сайта или вариант «Пока не знаю»'; },
    agree: function (_, el) { return el.checked ? '' : 'Без согласия я не смогу связаться с вами'; }
  };

  function check(name) {
    var el = form.elements[name];
    var msg = rules[name](el.value.trim(), el);
    var err = document.getElementById(el.getAttribute('aria-describedby'));
    err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    // Ошибку показываем после ухода с поля, а убираем сразу, как только значение стало верным
    el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') check(name); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(name); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') check(name); });
  });

  /*
   * Заявка уходит без сервера и сторонних сервисов: сайт собирает текст и открывает
   * мессенджер или почту посетителя с уже готовым сообщением. Отправляет его сам посетитель.
   * Контакты получателя меняются здесь.
   */
  var CHANNELS = {
    tg: {
      name: 'Telegram',
      url: function (text) { return 'https://t.me/nickitaev?text=' + encodeURIComponent(text); },
      fallback: 'в Telegram: @nickitaev'
    },
    wa: {
      name: 'WhatsApp',
      url: function (text) { return 'https://wa.me/79051190974?text=' + encodeURIComponent(text); },
      fallback: 'в WhatsApp: +7 905 119-09-74'
    },
    mail: {
      name: 'почту',
      url: function (text) {
        return 'mailto:nickitaevs@yandex.ru?subject=' + encodeURIComponent('Заявка с сайта «Ясный сайт»') +
          '&body=' + encodeURIComponent(text);
      },
      fallback: 'на nickitaevs@yandex.ru'
    }
  };

  function buildMessage() {
    var lines = [
      'Здравствуйте! Заявка с сайта «Ясный сайт».',
      'Имя: ' + form.elements.name.value.trim(),
      'Контакт: ' + form.elements.contact.value.trim(),
      'Нужен: ' + typeSelect.value
    ];
    var comment = form.elements.comment.value.trim();
    if (comment) lines.push('Комментарий: ' + comment);
    return lines.join('\n');
  }

  var status = document.getElementById('form-status');
  // Какой кнопкой отправляют форму; Enter в поле — как первая кнопка (Telegram)
  var via = 'tg';
  form.querySelectorAll('button[data-via]').forEach(function (btn) {
    btn.addEventListener('click', function () { via = btn.getAttribute('data-via'); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var channel = CHANNELS[via] || CHANNELS.tg;
    via = 'tg';
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) {
      status.className = 'form__status is-error';
      status.textContent = 'Проверьте поля, отмеченные красным.';
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var url = channel.url(buildMessage());
    if (url.indexOf('mailto:') === 0) {
      window.location.href = url;
    } else {
      var win = window.open(url, '_blank');
      if (win) win.opener = null; else window.location.href = url;
    }
    status.className = 'form__status is-ok';
    status.textContent = 'Открываю ' + channel.name + ' с готовым сообщением — осталось нажать «Отправить». ' +
      'Не открылось? Напишите мне ' + channel.fallback + '.';
  });
})();
