/* =========================================================
   Свой на Фукуоке — скрипты лендинга
   - плавный скролл к якорям с учётом фиксированной шапки
   - мобильное меню
   - шапка и плавающая кнопка Telegram при прокрутке
   - появление блоков при скролле
   - местное время на острове
   - подсветка карточек за курсором
   ========================================================= */
(() => {
  const header = document.getElementById('site-header');
  const menu = document.getElementById('mobile-menu');
  const menuToggle = document.getElementById('menu-toggle');
  const hero = document.getElementById('top');
  const fab = document.getElementById('fab-telegram');
  const footer = document.getElementById('contacts');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Мобильное меню ---------- */
  const setMenu = (open) => {
    menu.classList.toggle('hidden', !open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menuToggle.querySelector('.icon-open').classList.toggle('hidden', open);
    menuToggle.querySelector('.icon-close').classList.toggle('hidden', !open);
  };

  menuToggle.addEventListener('click', () => setMenu(menu.classList.contains('hidden')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Плавный скролл к якорям ---------- */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    setMenu(false); // закрываем меню до расчёта, чтобы высота шапки была верной

    const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${id}`);
  });

  /* ---------- Шапка и плавающая кнопка при прокрутке ---------- */
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);

    // Кнопка видна после hero и прячется в футере, где уже есть своя кнопка Telegram
    const pastHero = y > hero.offsetHeight * 0.7;
    const inFooter = footer.getBoundingClientRect().top < window.innerHeight - 120;
    fab.classList.toggle('is-visible', pastHero && !inFooter);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Появление блоков при скролле ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Местное время на острове ---------- */
  const timeEls = document.querySelectorAll('[data-island-time]');
  const islandTime = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  });

  const updateTime = () => {
    const now = islandTime.format(new Date());
    timeEls.forEach((el) => { el.textContent = now; });
  };

  updateTime();
  setInterval(updateTime, 15000);

  /* ---------- Подсветка карточек за курсором ---------- */
  document.querySelectorAll('.spotlight').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });

  /* ---------- Форма отзыва: отправка в Telegram или WhatsApp ---------- */
  const reviewForm = document.getElementById('review-form');
  const reviewStatus = document.getElementById('review-status');

  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(reviewForm);
    const rating = Number(data.get('rating')) || 5;
    const name = data.get('name').trim();
    const city = data.get('city').trim();
    const message = data.get('message').trim();

    const text = [
      'Отзыв для сайта «Свой на Фукуоке»',
      '★'.repeat(rating) + '☆'.repeat(5 - rating),
      city ? `${name}, ${city}` : name,
      '',
      message
    ].join('\n');

    const viaWhatsApp = e.submitter && e.submitter.value === 'wa';
    const url = viaWhatsApp
      ? `https://wa.me/${reviewForm.dataset.whatsapp}?text=${encodeURIComponent(text)}`
      : `https://t.me/${reviewForm.dataset.telegram}?text=${encodeURIComponent(text)}`;

    // Копируем текст на случай, если мессенджер не подставит его сам
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    window.open(url, '_blank', 'noopener');

    reviewStatus.textContent = 'Спасибо за отзыв! Открываю чат — если текст не подставился сам, просто вставьте его: он уже скопирован.';
    reviewStatus.classList.remove('hidden');
  });

  /* ---------- Заявка на поездку: на сервер, а если он недоступен — в Telegram ---------- */
  const leadForm = document.getElementById('lead-form');
  const leadStatus = document.getElementById('lead-status');
  const leadShownAt = Date.now();
  const servicesRu = { airport: 'встреча в аэропорту', housing: 'жильё', bike: 'байк', help: 'помощь на месте' };
  const channelsRu = { telegram: 'Telegram', whatsapp: 'WhatsApp', phone: 'звонок' };

  const showLeadStatus = (html, ok) => {
    leadStatus.innerHTML = html;
    leadStatus.className = `rounded-2xl px-4 py-3 text-sm ${ok ? 'bg-lagoon-50 text-lagoon-700' : 'bg-sunset/10 text-ink'}`;
  };

  leadForm.elements.channel.addEventListener('change', (e) => {
    leadForm.elements.contact.placeholder = e.target.value === 'telegram' ? '@ник или номер' : '+7 900 000-00-00';
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(leadForm);
    const lead = {
      action: 'lead',
      name: data.get('name').trim(),
      channel: data.get('channel'),
      contact: data.get('contact').trim(),
      arrival: data.get('arrival'),
      guests: data.get('guests'),
      services: data.getAll('services'),
      message: data.get('message').trim(),
      website: data.get('website'),
      elapsed: Date.now() - leadShownAt
    };

    const text = [
      'Заявка на поездку на Фукуок',
      `Имя: ${lead.name}`,
      `Связь: ${lead.contact} (${channelsRu[lead.channel]})`,
      lead.arrival && `Прилёт: ${lead.arrival.split('-').reverse().join('.')}`,
      lead.guests && `Гостей: ${lead.guests}`,
      lead.services.length && `Нужно: ${lead.services.map((s) => servicesRu[s]).join(', ')}`,
      lead.message
    ].filter(Boolean).join('\n');
    const telegramUrl = `https://t.me/${leadForm.dataset.telegram}?text=${encodeURIComponent(text)}`;

    // Сервер ещё не подключён — сразу открываем Telegram с готовым текстом
    if (!leadForm.dataset.endpoint) {
      window.open(telegramUrl, '_blank', 'noopener');
      showLeadStatus('Открываю Telegram с готовой заявкой — осталось нажать «Отправить».', true);
      return;
    }

    const button = leadForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      // text/plain — чтобы Google Apps Script принял запрос без предварительной CORS-проверки
      const res = await fetch(leadForm.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead)
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      leadForm.reset();
      showLeadStatus('Спасибо! Заявка отправлена — скоро свяжусь с вами.', true);
    } catch (err) {
      showLeadStatus(`Не получилось отправить заявку. <a class="font-semibold underline" href="${telegramUrl}" target="_blank" rel="noopener">Отправьте её в Telegram</a> — текст уже готов.`, false);
    } finally {
      button.disabled = false;
    }
  });

  /* ---------- Текущий год в футере ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
