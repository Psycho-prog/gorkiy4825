/* ============================================================
   ЗЕРНО — Авторская кофейня | script.js
   ============================================================ */

'use strict';

/* ── ХЕЛПЕРЫ ──────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ── ШАПКА: фон при скролле ───────────────────────────────── */
(function initHeader() {
  const header = $('#header');
  if (!header) return;

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // инициализация при загрузке
})();


/* ── БУРГЕР-МЕНЮ ──────────────────────────────────────────── */
(function initBurger() {
  const burger  = $('#burger');
  const navList = $('#navList');
  if (!burger || !navList) return;

  function toggle(force) {
    const open = typeof force === 'boolean' ? force : !burger.classList.contains('open');
    burger.classList.toggle('open', open);
    navList.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', () => toggle());

  // Закрыть при клике по ссылке
  navList.addEventListener('click', e => {
    if (e.target.matches('a')) toggle(false);
  });

  // Закрыть при нажатии Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggle(false);
  });

  // Закрыть при клике вне меню
  document.addEventListener('click', e => {
    if (!navList.contains(e.target) && !burger.contains(e.target)) {
      toggle(false);
    }
  });
})();


/* ── ПЛАВНЫЙ СКРОЛЛ ───────────────────────────────────────── */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const target = $(targetId);
    if (!target) return;

    e.preventDefault();
    const headerH = $('#header')?.offsetHeight ?? 72;
    const y = target.getBoundingClientRect().top + window.scrollY - headerH;

    window.scrollTo({ top: y, behavior: 'smooth' });
  });
})();


/* ── АНИМАЦИЯ СЕКЦИЙ (Intersection Observer) ─────────────── */
(function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(el => observer.observe(el));
})();


/* ── ТАБЫ МЕНЮ ────────────────────────────────────────────── */
(function initMenuTabs() {
  const tabs = $$('.tab');
  const cards = $$('.card');
  if (!tabs.length || !cards.length) return;

  function showTab(tabEl) {
    const cat = tabEl.dataset.tab;

    // Переключить активный таб
    tabs.forEach(t => {
      t.classList.toggle('tab--active', t === tabEl);
      t.setAttribute('aria-selected', t === tabEl ? 'true' : 'false');
    });

    // Показать/скрыть карточки с микро-анимацией
    cards.forEach(card => {
      const match = card.dataset.cat === cat;
      if (match) {
        card.hidden = false;
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.style.transition = 'opacity .35s ease, transform .35s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        });
      } else {
        card.hidden = true;
        card.style.opacity = '';
        card.style.transform = '';
        card.style.transition = '';
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => showTab(tab));
  });

  // Показать первый таб по умолчанию
  showTab(tabs[0]);
})();


/* ── СЛАЙДЕР ОТЗЫВОВ ─────────────────────────────────────── */
(function initSlider() {
  const track  = $('#sliderTrack');
  const dotsWrap = $('#sliderDots');
  const btnPrev  = $('#sliderPrev');
  const btnNext  = $('#sliderNext');

  if (!track || !dotsWrap) return;

  const slides = $$('.review', track);
  if (slides.length < 2) return;

  let current = 0;
  let autoTimer = null;

  // Определить кол-во видимых слайдов по ширине
  function visibleCount() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  // Максимальный индекс
  function maxIndex() {
    return Math.max(0, slides.length - visibleCount());
  }

  // Создать точки
  function buildDots() {
    dotsWrap.innerHTML = '';
    const total = maxIndex() + 1;
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'slider__dot' + (i === current ? ' slider__dot--active' : '');
      dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    $$('.slider__dot', dotsWrap).forEach((dot, i) => {
      dot.classList.toggle('slider__dot--active', i === current);
    });
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex()));

    // Ширина одного слайда + gap (24px)
    const slideWidth = slides[0].offsetWidth + 24;
    track.style.transform = `translateX(-${current * slideWidth}px)`;

    updateDots();
  }

  function prev() { goTo(current === 0 ? maxIndex() : current - 1); }
  function next() { goTo(current === maxIndex() ? 0 : current + 1); }

  btnPrev?.addEventListener('click', () => { prev(); resetAuto(); });
  btnNext?.addEventListener('click', () => { next(); resetAuto(); });

  // Автопрокрутка
  function startAuto() {
    autoTimer = setInterval(next, 5000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // Свайп на тач-устройствах
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
      resetAuto();
    }
  });

  // Пауза при наведении
  const sliderEl = $('#slider');
  sliderEl?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  sliderEl?.addEventListener('mouseleave', () => startAuto());

  // Перестроить при изменении размера
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (current > maxIndex()) current = maxIndex();
      buildDots();
      goTo(current);
    }, 200);
  });

  // Инициализация
  buildDots();
  goTo(0);
  startAuto();
})();


/* ── ФОРМА БРОНИРОВАНИЯ ───────────────────────────────────── */
(function initForm() {
  const form       = $('#bookingForm');
  const successMsg = $('#formSuccess');
  const submitBtn  = $('#submitBtn');
  if (!form) return;

  /* Валидация одного поля */
  function validateField(id, errorId, rules) {
    const input  = $(`#${id}`, form);
    const errEl  = $(`#${errorId}`, form);
    if (!input || !errEl) return true;

    const val = input.value.trim();
    let msg = '';

    for (const { test, message } of rules) {
      if (!test(val)) { msg = message; break; }
    }

    errEl.textContent = msg;
    input.classList.toggle('error', !!msg);
    return !msg;
  }

  

  // Валидация в реальном времени (при потере фокуса)
  fieldRules.forEach(({ id, errorId, rules }) => {
    const input = $(`#${id}`, form);
    input?.addEventListener('blur', () => validateField(id, errorId, rules));
    input?.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateField(id, errorId, rules);
      }
    });
  });

  /* Отправка формы */
  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Валидировать все поля
    const valid = fieldRules
      .map(({ id, errorId, rules }) => validateField(id, errorId, rules))
      .every(Boolean);

    if (!valid) {
      // Скролл к первой ошибке
      const firstError = form.querySelector('.error');
      firstError?.focus();
      return;
    }

    // Имитация отправки
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector('.btn__text');
    if (btnText) btnText.textContent = 'Отправляем...';

    await new Promise(resolve => setTimeout(resolve, 1200));

    form.reset();
    submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Отправить заявку';

    if (successMsg) {
      successMsg.hidden = false;
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => { successMsg.hidden = true; }, 6000);
    }
  });
})();


/* ── АКТИВНАЯ ССЫЛКА В НАВИГАЦИИ ─────────────────────────── */
(function initActiveNav() {
  const sections = $$('section[id]');
  const links    = $$('.nav__link');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(link => {
            const match = link.getAttribute('href') === `#${id}`;
            link.style.color = match ? 'var(--c-latte)' : '';
          });
        }
      });
    },
    { rootMargin: '-40% 0px -40% 0px' }
  );

  sections.forEach(sec => observer.observe(sec));
})();
