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

  /**
   * Заглушка отправки заявки. Замените тело функции на один из вариантов:
   *
   * 1) Formspree (проще всего, без своего сервера):
   *    зарегистрируйтесь на formspree.io, создайте форму и подставьте её адрес:
   *    return fetch('https://formspree.io/f/ВАШ_ID', {
   *      method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
   *      body: JSON.stringify(data)
   *    }).then(function (r) { if (!r.ok) throw new Error('send failed'); });
   *
   * 2) Telegram-бот: НЕ вставляйте токен бота в этот файл — его увидит любой посетитель.
   *    Сделайте маленький серверный обработчик (например, облачная функция Яндекс Облака),
   *    который принимает POST с данными формы и вызывает
   *    https://api.telegram.org/bot<TOKEN>/sendMessage с вашим chat_id.
   *    Здесь останется только fetch('https://ваш-обработчик', { method: 'POST', body: JSON.stringify(data) }).
   */
  function sendLead(data) {
    return new Promise(function (resolve) { setTimeout(resolve, 600); });
  }

  var status = document.getElementById('form-status');
  var submit = form.querySelector('[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) {
      status.className = 'form__status is-error';
      status.textContent = 'Проверьте поля, отмеченные красным.';
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var data = {
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      type: typeSelect.value,
      comment: form.elements.comment.value.trim()
    };
    submit.disabled = true;
    status.className = 'form__status';
    status.textContent = 'Отправляю…';
    sendLead(data).then(function () {
      form.reset();
      status.className = 'form__status is-ok';
      status.textContent = 'Спасибо! Заявка отправлена, отвечу в течение рабочего дня.';
    }).catch(function () {
      status.className = 'form__status is-error';
      status.textContent = 'Не получилось отправить. Напишите мне в Telegram или WhatsApp — ссылки выше.';
    }).then(function () { submit.disabled = false; });
  });
})();
