/* =========================================================
   Свой CRM — мини-CRM для клиентов на Фукуоке
   - клиенты и этапы работы с ними
   - прилёты и напоминания
   - быстрое добавление: ссылка, @ник или номер → карточка
   - «Поделиться» из Telegram / Instagram / WhatsApp (Android)
   - автоматические заявки с сервера (сайт и Telegram-бот)
   - резервная копия; данные хранятся на телефоне
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Справочники ---------- */
  const TZ = 'Asia/Ho_Chi_Minh';
  const STORAGE_KEY = 'svoy-crm:v1';
  const SYNC_KEY = 'svoy-crm:sync';

  const STAGES = [
    { id: 'new',      label: 'Новый',        color: '#F26A3D' },
    { id: 'talking',  label: 'Обсуждаем',    color: '#229ED9' },
    { id: 'booked',   label: 'Подтверждено', color: '#1F8A7E' },
    { id: 'onisland', label: 'На острове',   color: '#0B3D39' },
    { id: 'done',     label: 'Завершено',    color: '#7C8886' },
    { id: 'lost',     label: 'Отказ',        color: '#B4534A' }
  ];
  const ACTIVE_STAGES = ['new', 'talking', 'booked', 'onisland'];

  const SOURCES = [
    { id: 'telegram',  label: 'Telegram',  color: '#229ED9' },
    { id: 'whatsapp',  label: 'WhatsApp',  color: '#1FA855' },
    { id: 'instagram', label: 'Instagram', color: '#D62F6B' },
    { id: 'site',      label: 'Сайт',      color: '#0F534D' },
    { id: 'other',     label: 'Другое',    color: '#4A5856' }
  ];

  const SERVICES = [
    { id: 'airport', label: 'Встреча', icon: 'plane' },
    { id: 'housing', label: 'Жильё',   icon: 'home' },
    { id: 'bike',    label: 'Байк',    icon: 'bike' },
    { id: 'help',    label: 'Помощь',  icon: 'lifebuoy' }
  ];

  const stageById = Object.fromEntries(STAGES.map((s) => [s.id, s]));
  const sourceById = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
  const serviceById = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

  /* ---------- Иконки ---------- */
  const ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    phone: '<path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    lifebuoy: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    device: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'
  };

  const icon = (name, cls = 'h-5 w-5', width = 1.8) =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const TG_PATH = 'M16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';
  const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';

  const sourceIcon = (id, cls = 'h-4 w-4') => {
    if (id === 'telegram') return `<svg class="${cls}" viewBox="4.3 5.15 14 14" fill="currentColor" aria-hidden="true"><path d="${TG_PATH}"/></svg>`;
    if (id === 'whatsapp') return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
    return icon({ instagram: 'instagram', site: 'globe' }[id] || 'message', cls);
  };

  /* ---------- Помощники ---------- */
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  const plural = (n, one, few, many) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };

  const initials = (name) => {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    const long = words.filter((word) => word.length > 1);
    const picked = (long.length ? long : words).slice(0, 2);
    return picked.map((word) => word[0].toUpperCase()).join('') || '?';
  };

  // Даты считаем по времени острова: «сегодня» — это сегодня на Фукуоке
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE = /^\d{2}:\d{2}$/;
  const isDate = (value) => DATE_RE.test(value || '') && !Number.isNaN(Date.parse(value));
  const isoDateOf = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ts));
  const isoToday = () => isoDateOf(Date.now());
  const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
  const daysBetween = (fromIso, toIso) => Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 864e5);
  const fmtDate = (iso, opts = { day: 'numeric', month: 'long' }) => (isDate(iso)
    ? new Intl.DateTimeFormat('ru-RU', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
    : '');
  const shortDate = (iso) => fmtDate(iso, { day: 'numeric', month: 'short' }).replace('.', '');
  const fmtStamp = (ts) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(ts));
  const islandTime = () => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date());
  const islandHour = () => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(new Date()));

  const relDay = (iso) => {
    if (!isDate(iso)) return '';
    const d = daysBetween(isoToday(), iso);
    if (d === 0) return 'сегодня';
    if (d === 1) return 'завтра';
    if (d === -1) return 'вчера';
    if (d > 1) return `через ${d} ${plural(d, 'день', 'дня', 'дней')}`;
    return `${-d} ${plural(-d, 'день', 'дня', 'дней')} назад`;
  };

  const greeting = () => {
    const h = islandHour();
    if (h >= 5 && h < 12) return 'Доброе утро';
    if (h >= 12 && h < 18) return 'Добрый день';
    if (h >= 18 && h < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  };

  const entry = (text) => ({ at: new Date().toISOString(), text });

  const normTelegram = (value) => {
    const v = String(value || '').trim();
    if (!v) return '';
    const link = v.match(/(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{4,32})/i);
    const handle = link ? link[1] : v.replace(/^@+/, '').replace(/\s+/g, '');
    return handle ? `@${handle}` : '';
  };

  // +7…, 8… (Россия) и 0… (местный вьетнамский формат) → международный вид
  const normPhone = (value) => {
    const raw = String(value || '').trim();
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (!raw.startsWith('+')) {
      if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
      else if (digits.length === 10 && digits.startsWith('0')) digits = `84${digits.slice(1)}`;
    }
    return `+${digits}`;
  };

  const contactLabel = (c) => c.telegram || (c.instagram ? `@${c.instagram}` : '') || c.phone || (c.tgId ? 'Telegram' : 'нет контакта');

  const guestsLabel = (c) => (c.guests ? `${c.guests} ${plural(Number(c.guests), 'гость', 'гостя', 'гостей')}` : '');

  /* ---------- Проверка данных: из памяти, файла копии и с сервера ---------- */
  const text = (value, max) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, max) : '');
  const validTs = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));

  const sanitize = (raw) => {
    const c = raw && typeof raw === 'object' ? raw : {};
    const guests = parseInt(c.guests, 10);
    const now = new Date().toISOString();
    return {
      id: /^[\w-]{1,64}$/.test(c.id || '') ? c.id : uid(),
      name: text(c.name, 80) || 'Без имени',
      source: sourceById[c.source] ? c.source : 'other',
      telegram: text(c.telegram, 40),
      phone: text(c.phone, 20),
      instagram: text(c.instagram, 40),
      tgId: /^\d{1,20}$/.test(String(c.tgId || '')) ? String(c.tgId) : '',
      stage: stageById[c.stage] ? c.stage : 'new',
      arrival: isDate(c.arrival) ? c.arrival : '',
      arrivalTime: TIME_RE.test(c.arrivalTime || '') ? c.arrivalTime : '',
      flight: text(c.flight, 20),
      departure: isDate(c.departure) ? c.departure : '',
      guests: guests > 0 && guests <= 99 ? guests : '',
      hotel: text(c.hotel, 120),
      services: Array.isArray(c.services) ? c.services.filter((s) => serviceById[s]) : [],
      price: text(c.price, 80),
      nextAction: text(c.nextAction, 200),
      nextDate: isDate(c.nextDate) ? c.nextDate : '',
      notes: text(c.notes, 3000),
      history: Array.isArray(c.history)
        ? c.history.filter((h) => h && text(h.text, 1000) && validTs(h.at)).map((h) => ({ at: h.at, text: text(h.text, 1000) }))
        : [],
      createdAt: validTs(c.createdAt) ? c.createdAt : now,
      updatedAt: validTs(c.updatedAt) ? c.updatedAt : now,
      leadId: /^[\w-]{1,64}$/.test(c.leadId || '') ? c.leadId : '',
      demo: c.demo === true
    };
  };

  /* ---------- Хранилище: данные лежат на телефоне ---------- */
  const store = {
    clients: [],

    load() {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        this.clients = Array.isArray(data) ? data.map(sanitize) : [];
      } catch {
        this.clients = [];
      }
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.clients));
      } catch {
        toast('Не удалось сохранить — память браузера недоступна');
      }
    },

    get(id) {
      return this.clients.find((c) => c.id === id);
    },

    upsert(client) {
      const clean = sanitize({ ...client, updatedAt: new Date().toISOString() });
      const i = this.clients.findIndex((c) => c.id === clean.id);
      if (i === -1) this.clients.unshift(clean);
      else this.clients[i] = clean;
      this.save();
      return clean;
    },

    remove(id) {
      this.clients = this.clients.filter((c) => c.id !== id);
      this.save();
    }
  };

  const ui = { stage: 'all', search: '', arrivals: 'upcoming', listRoute: '#/today' };
  let installPrompt = null;

  /* ---------- Распознавание: ссылка, @ник или номер → поля карточки ---------- */
  const parseContact = (raw, preferSource) => {
    const input = String(raw || '');
    const out = {};
    let m;

    if ((m = input.match(/(?:t\.me|telegram\.me)\/(?!joinchat|addstickers|share\/|c\/|s\/|\+)([A-Za-z0-9_]{4,32})/i))) {
      out.telegram = `@${m[1]}`;
      out.source = 'telegram';
    }
    if ((m = input.match(/(?:instagram\.com|instagr\.am|ig\.me\/m)\/(?!(?:p|reel|reels|stories|explore|tv)\/)([A-Za-z0-9_.]{1,30})/i))) {
      out.instagram = m[1].replace(/\.+$/, '');
      out.source = out.source || 'instagram';
    }
    if ((m = input.match(/wa\.me\/\+?(\d{7,15})/i))) {
      out.phone = `+${m[1]}`;
      out.source = out.source || 'whatsapp';
    }
    if (!out.phone && (m = input.match(/(?:^|[^\d])(\+?\d[\d\s\-()]{8,18}\d)/))) {
      const digits = m[1].replace(/\D/g, '');
      if (digits.length >= 9 && digits.length <= 15) out.phone = normPhone(m[1]);
    }
    if (!out.telegram && !out.instagram && (m = input.match(/(?:^|\s)@([A-Za-z0-9_.]{3,32})/))) {
      const handle = m[1].replace(/\.+$/, '');
      if (preferSource === 'instagram') out.instagram = handle;
      else out.telegram = `@${handle}`;
      out.source = out.source || (preferSource === 'instagram' ? 'instagram' : 'telegram');
    }
    if (!out.source && out.phone) out.source = 'whatsapp';

    // Имя — только строка из 1–3 слов из букв, чтобы не принять за имя фразу из переписки
    const nameLine = input.split(/\n/).map((s) => s.trim())
      .find((s) => /^[\p{L}][\p{L}'’-]*(?:\s[\p{L}][\p{L}'’-]*){0,2}$/u.test(s) && s.length <= 40);
    if (nameLine) out.name = nameLine;

    return out;
  };

  /* ---------- Ссылки для связи ---------- */
  const contactLinks = (c) => {
    const links = [];
    const tg = (c.telegram || '').replace(/^@/, '');
    const digits = (c.phone || '').replace(/\D/g, '');
    const tgHref = (tg && `https://t.me/${tg}`) || (c.tgId && `tg://user?id=${c.tgId}`) || (digits && `https://t.me/+${digits}`);

    if (tgHref) links.push({ label: 'Telegram', color: '#229ED9', icon: sourceIcon('telegram', 'h-[18px] w-[18px]'), href: tgHref });
    if (digits) links.push({ label: 'WhatsApp', color: '#1FA855', icon: sourceIcon('whatsapp', 'h-[18px] w-[18px]'), href: `https://wa.me/${digits}` });
    if (c.instagram) links.push({ label: 'Instagram', color: '#D62F6B', icon: sourceIcon('instagram', 'h-[18px] w-[18px]'), href: `https://ig.me/m/${encodeURIComponent(c.instagram)}` });
    if (digits) links.push({ label: 'Позвонить', color: '#10201E', icon: icon('phone', 'h-[18px] w-[18px]'), href: `tel:+${digits}`, local: true });

    return links;
  };

  /* ---------- Автоматические заявки: связь с сервером ---------- */
  const sync = {
    state: { url: '', key: '', since: '', lastSync: '', info: null, seen: [] },
    busy: false,

    load() {
      try {
        Object.assign(this.state, JSON.parse(localStorage.getItem(SYNC_KEY)) || {});
      } catch {
        // настройки подключения повреждены — работаем без сервера
      }
      if (!Array.isArray(this.state.seen)) this.state.seen = [];
    },

    save() {
      try {
        localStorage.setItem(SYNC_KEY, JSON.stringify(this.state));
      } catch {
        // без сохранения настроек синхронизация просто повторится при следующем запуске
      }
    },

    get connected() {
      return Boolean(this.state.url && this.state.key);
    },

    // text/plain — чтобы Google Apps Script принял запрос без предварительной CORS-проверки
    async call(payload) {
      const res = await fetch(this.state.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...payload, key: this.state.key })
      });
      const data = await res.json();
      if (!data || !data.ok) throw new Error((data && data.error) || 'server');
      return data;
    },

    // Код подключения: «адрес сервера#ключ» — его присылает бот на команду /connect
    async connect(code) {
      const raw = String(code || '').trim();
      const cut = raw.lastIndexOf('#');
      const url = cut > 0 ? raw.slice(0, cut) : '';
      const key = cut > 0 ? raw.slice(cut + 1) : '';
      if (!/^(https:\/\/|http:\/\/localhost[:/])\S+$/.test(url) || !/^[\w-]{16,}$/.test(key)) throw new Error('code');

      const previous = { ...this.state };
      Object.assign(this.state, { url, key });
      try {
        const data = await this.call({ action: 'ping' });
        Object.assign(this.state, { info: data.info || null, since: '', lastSync: '' });
        this.save();
      } catch (err) {
        this.state = previous;
        throw err;
      }
    },

    disconnect() {
      this.state = { url: '', key: '', since: '', lastSync: '', info: null, seen: this.state.seen };
      this.save();
    },

    async pull({ silent = true } = {}) {
      if (!this.connected || this.busy) return;
      this.busy = true;
      document.querySelectorAll('[data-sync-icon]').forEach((el) => el.classList.add('animate-spin'));
      try {
        const data = await this.call({ action: 'leads', since: this.state.since });
        const leads = Array.isArray(data.leads) ? data.leads : [];
        const { added, updated } = mergeLeads(leads);
        leads.forEach((lead) => {
          if (validTs(lead.createdAt) && lead.createdAt > (this.state.since || '')) this.state.since = lead.createdAt;
        });
        this.state.lastSync = new Date().toISOString();
        this.state.info = data.info || this.state.info;
        this.save();
        if (added) toast(`${added} ${plural(added, 'новая заявка', 'новые заявки', 'новых заявок')}`);
        else if (!silent) toast('Новых заявок нет');
        if (added || updated || !silent) renderIfIdle();
      } catch (err) {
        if (!silent) toast(err.message === 'forbidden' ? 'Ключ не подходит — подключитесь заново' : 'Сервер не ответил — проверьте интернет');
      } finally {
        this.busy = false;
        document.querySelectorAll('[data-sync-icon]').forEach((el) => el.classList.remove('animate-spin'));
      }
    }
  };

  // Заявка с сервера → новая карточка, а если человек уже есть — запись в его историю
  const mergeLeads = (leads) => {
    let added = 0;
    let updated = 0;
    const seen = new Set(sync.state.seen);

    leads.forEach((lead) => {
      if (!lead || !/^[\w-]{1,64}$/.test(lead.id || '') || seen.has(lead.id)) return;
      seen.add(lead.id);
      if (store.clients.some((c) => c.leadId === lead.id)) return;

      const at = validTs(lead.createdAt) ? lead.createdAt : new Date().toISOString();
      const telegram = normTelegram(lead.telegram);
      const phone = normPhone(lead.phone);
      const instagram = text(lead.instagram, 40).replace(/^@+/, '');
      const tgId = /^\d{1,20}$/.test(String(lead.tgId || '')) ? String(lead.tgId) : '';
      const channel = text(lead.channel, 60) || 'Заявка';
      const message = text(lead.message, 1000);
      const same = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();

      const existing = store.clients.find((c) => (tgId && c.tgId === tgId)
        || same(telegram, c.telegram) || (phone && c.phone === phone) || same(instagram, c.instagram));

      if (existing) {
        store.upsert({ ...existing, tgId: existing.tgId || tgId, history: [...existing.history, { at, text: `Новое обращение · ${channel}${message ? `: ${message}` : ''}` }] });
        updated += 1;
        return;
      }

      store.clients.unshift(sanitize({
        id: uid(),
        leadId: lead.id,
        name: lead.name,
        source: lead.source,
        telegram,
        phone,
        instagram,
        tgId,
        stage: 'new',
        arrival: lead.arrival,
        guests: lead.guests,
        services: lead.services,
        notes: message,
        createdAt: at,
        updatedAt: at,
        history: [{ at, text: `Карточка создана автоматически · ${channel}` }]
      }));
      added += 1;
    });

    if (added) store.save();
    sync.state.seen = [...seen].slice(-1000);
    return { added, updated };
  };

  /* ---------- Общие элементы интерфейса ---------- */
  const avatar = (c, size = 'h-12 w-12 text-sm') => {
    const color = (sourceById[c.source] || sourceById.other).color;
    return `<span class="grid ${size} shrink-0 place-items-center rounded-full font-semibold text-white" style="background:${color}">${esc(initials(c.name))}</span>`;
  };

  const stageBadge = (id) => {
    const s = stageById[id] || STAGES[0];
    return `<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style="background:${s.color}1A;color:${s.color}"><span class="h-1.5 w-1.5 rounded-full" style="background:${s.color}"></span>${s.label}</span>`;
  };

  const section = (title, body, extra = '') => `
    <section class="mt-8 px-5">
      <div class="mb-3 flex items-center justify-between px-1">
        <h2 class="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-soft">${title}</h2>${extra}
      </div>
      ${body}
    </section>`;

  const pageHeader = (title) => `
    <header class="sticky top-0 z-20 bg-paper/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+18px)] backdrop-blur-xl">
      <h1 class="text-[2.1rem] font-semibold leading-none tracking-tightest">${title}</h1>
    </header>`;

  const clientRow = (c) => {
    const source = sourceById[c.source] || sourceById.other;
    const arrival = c.arrival
      ? `<span class="inline-flex shrink-0 items-center gap-1">${icon('plane', 'h-3.5 w-3.5')}${shortDate(c.arrival)}</span>`
      : '';
    return `
      <a href="#/client/${c.id}" class="press flex items-center gap-3.5 rounded-[1.5rem] bg-white p-3.5 ring-1 ring-ink/[0.06]">
        ${avatar(c)}
        <span class="min-w-0 flex-1">
          <span class="flex items-center justify-between gap-2">
            <span class="truncate font-semibold">${esc(c.name)}</span>
            ${stageBadge(c.stage)}
          </span>
          <span class="mt-1 flex items-center gap-2 text-[13px] text-ink-soft">
            <span class="shrink-0" style="color:${source.color}">${sourceIcon(c.source, 'h-3.5 w-3.5')}</span>
            <span class="truncate">${esc(contactLabel(c))}</span>
            ${arrival}
          </span>
        </span>
      </a>`;
  };

  const emptyState = () => `
    <div class="mx-5 mt-8 rounded-[2rem] bg-white p-7 text-center ring-1 ring-ink/[0.06]">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lagoon-500/10 text-lagoon-700">${icon('users', 'h-7 w-7')}</span>
      <h2 class="mt-5 text-2xl font-semibold tracking-tight">Пока <span class="font-serif text-[1.15em] font-medium italic text-lagoon-700">пусто</span></h2>
      <p class="mx-auto mt-2 max-w-xs leading-relaxed text-ink-soft">Вставьте ссылку на профиль, @ник или номер — карточка заполнится сама.</p>
      <button type="button" data-action="new" class="press mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 font-semibold text-paper">${icon('plus', 'h-5 w-5', 2.2)}Добавить клиента</button>
      <button type="button" data-action="demo" class="mt-4 text-[15px] font-semibold text-lagoon-700">Посмотреть на примере</button>
    </div>`;

  /* ---------- Экран «Сегодня» ---------- */
  const arrivalTicket = (c, featured) => {
    const muted = featured ? 'text-paper/60' : 'text-ink-soft';
    return `
      <a href="#/client/${c.id}" class="press block overflow-hidden rounded-[1.5rem] ${featured ? 'bg-lagoon-900 text-paper shadow-[0_24px_50px_-24px_rgba(7,43,40,0.8)]' : 'bg-white ring-1 ring-ink/[0.06]'}">
        <span class="flex items-center justify-between px-4 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${muted}">
          <span>Прилёт · ${relDay(c.arrival)}</span><span>${esc(c.flight)}</span>
        </span>
        <span class="flex items-end gap-3 px-4 pb-4 pt-1.5">
          <span class="shrink-0">
            <span class="block text-[1.65rem] font-semibold leading-none tracking-tight">${shortDate(c.arrival)}</span>
            <span class="mt-1 block text-[12px] ${muted}">${c.arrivalTime ? esc(c.arrivalTime) : 'время не указано'}</span>
          </span>
          <span class="relative mb-[1.15rem] min-w-[2.5rem] flex-1 border-t-2 border-dashed ${featured ? 'border-white/20' : 'border-ink/15'}">
            <span class="absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${featured ? 'bg-lagoon-900 text-sunset-soft' : 'bg-white text-sunset'}">${icon('plane', 'h-4 w-4 rotate-45')}</span>
          </span>
          <span class="min-w-0 max-w-[45%] text-right">
            <span class="block truncate font-semibold">${esc(c.name)}</span>
            <span class="block truncate text-[12px] ${muted}">${esc(guestsLabel(c) || c.hotel || ' ')}</span>
          </span>
        </span>
      </a>`;
  };

  const reminderRow = (c, today) => {
    const overdue = daysBetween(today, c.nextDate) < 0;
    return `
      <div class="flex items-center gap-3 rounded-[1.5rem] bg-white p-3.5 ring-1 ${overdue ? 'ring-sunset/40' : 'ring-ink/[0.06]'}">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${overdue ? 'bg-sunset text-white' : 'bg-sunset/10 text-sunset'}">${icon('bell', 'h-[18px] w-[18px]')}</span>
        <a href="#/client/${c.id}" class="min-w-0 flex-1">
          <span class="block truncate font-medium">${esc(c.nextAction)}</span>
          <span class="block truncate text-[13px] text-ink-soft">${esc(c.name)} · ${overdue ? 'просрочено, ' : ''}${relDay(c.nextDate)}</span>
        </a>
        <button type="button" data-action="done-next" data-id="${c.id}" aria-label="Отметить выполненным"
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft ring-1 ring-ink/15 transition active:bg-lagoon-500 active:text-white">${icon('check', 'h-[18px] w-[18px]', 2.2)}</button>
      </div>`;
  };

  const stat = (n, label, color, href) => `
    <a href="${href}" class="press relative rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/[0.06]">
      <span class="absolute right-3.5 top-3.5 h-2 w-2 rounded-full" style="background:${color}"></span>
      <span class="block text-[2rem] font-semibold leading-none tracking-tight">${n}</span>
      <span class="mt-2 block text-[12px] font-medium leading-tight text-ink-soft">${label}</span>
    </a>`;

  const viewToday = () => {
    const today = isoToday();
    const all = store.clients;
    const syncButton = sync.connected
      ? `<button type="button" data-action="sync" aria-label="Проверить новые заявки"
                 class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-ink/[0.08] transition active:bg-ink/5">
           <span data-sync-icon class="${sync.busy ? 'animate-spin' : ''}">${icon('refresh', 'h-4 w-4')}</span>
         </button>`
      : '';

    const head = `
      <header class="px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <div class="flex items-center justify-between gap-3">
          <span class="inline-flex shrink-0 items-center gap-2 rounded-full bg-lagoon-800 px-3 py-1.5 text-xs font-semibold text-paper">
            <span class="live-dot"></span>На острове <span data-island-time class="tabular-nums">${islandTime()}</span>
          </span>
          <span class="flex min-w-0 items-center gap-2">
            <span class="truncate text-sm font-medium text-ink-soft first-letter:uppercase">${fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            ${syncButton}
          </span>
        </div>
        <h1 class="mt-7 text-[2.75rem] font-semibold leading-[0.95] tracking-tightest">
          ${greeting()}
          <span class="mt-1 block font-serif text-[1.12em] font-medium italic tracking-[-0.02em] text-lagoon-700">на&nbsp;острове</span>
        </h1>
      </header>`;

    if (!all.length) return `<div>${head}${emptyState()}</div>`;

    const byArrival = (a, b) => `${a.arrival}${a.arrivalTime}`.localeCompare(`${b.arrival}${b.arrivalTime}`);
    const upcoming = all
      .filter((c) => ACTIVE_STAGES.includes(c.stage) && c.arrival && c.arrival >= today)
      .sort(byArrival);
    const weekCount = upcoming.filter((c) => daysBetween(today, c.arrival) <= 7).length;
    const reminders = all
      .filter((c) => c.nextAction && c.nextDate && daysBetween(today, c.nextDate) <= 1 && !['done', 'lost'].includes(c.stage))
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const fresh = all.filter((c) => c.stage === 'new')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    const stats = `
      <div class="mt-7 grid grid-cols-3 gap-2.5 px-5">
        ${stat(all.filter((c) => c.stage === 'new').length, 'Новые<br>заявки', '#F26A3D', '#/clients?stage=new')}
        ${stat(all.filter((c) => c.stage === 'talking').length, 'В&nbsp;обсуждении', '#229ED9', '#/clients?stage=talking')}
        ${stat(weekCount, 'Прилёты<br>за 7 дней', '#1F8A7E', '#/arrivals')}
      </div>`;

    const arrivalsBlock = upcoming.length
      ? section('Ближайшие прилёты', `<div class="space-y-2.5">${upcoming.slice(0, 3).map((c, i) => arrivalTicket(c, i === 0)).join('')}</div>`,
        upcoming.length > 3 ? '<a href="#/arrivals" class="text-[13px] font-semibold text-lagoon-700">Все</a>' : '')
      : '';

    const remindersBlock = section('Напоминания',
      reminders.length
        ? `<div class="space-y-2.5">${reminders.map((c) => reminderRow(c, today)).join('')}</div>`
        : '<p class="rounded-[1.5rem] bg-white/60 px-4 py-5 text-center text-[15px] text-ink-soft ring-1 ring-ink/[0.05]">На сегодня и завтра всё сделано ✓</p>');

    const freshBlock = fresh.length
      ? section('Новые заявки', `<div class="space-y-2.5">${fresh.map(clientRow).join('')}</div>`,
        '<a href="#/clients?stage=new" class="text-[13px] font-semibold text-lagoon-700">Все</a>')
      : '';

    return `<div>${head}${stats}${arrivalsBlock}${remindersBlock}${freshBlock}</div>`;
  };

  /* ---------- Экран «Клиенты» ---------- */
  const filteredClients = () => {
    const q = ui.search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return store.clients
      .filter((c) => ui.stage === 'all' || c.stage === ui.stage)
      .filter((c) => !q
        || [c.name, c.telegram, c.instagram, c.phone, c.hotel, c.notes, c.flight].some((v) => v.toLowerCase().includes(q))
        || (qDigits.length >= 3 && c.phone.replace(/\D/g, '').includes(qDigits)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  };

  const clientListHTML = () => {
    if (!store.clients.length) return emptyState();
    const list = filteredClients();
    if (!list.length) return '<p class="py-16 text-center text-ink-soft">Никого не нашлось</p>';
    return `<div class="space-y-2.5 px-5">${list.map(clientRow).join('')}</div>`;
  };

  const viewClients = () => {
    const total = store.clients.length;
    const chip = (id, label, n) => `
      <button type="button" data-action="filter-stage" data-stage="${id}"
              class="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${ui.stage === id ? 'bg-ink text-paper' : 'bg-white text-ink-soft ring-1 ring-ink/[0.08]'}">
        ${label}<span class="ml-1.5 opacity-60">${n}</span>
      </button>`;

    return `
      <div>
        <header class="sticky top-0 z-20 bg-paper/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+18px)] backdrop-blur-xl">
          <div class="flex items-end justify-between">
            <h1 class="text-[2.1rem] font-semibold leading-none tracking-tightest">Клиенты</h1>
            <span class="pb-1 text-sm font-medium text-ink-soft">${total} ${plural(total, 'человек', 'человека', 'человек')}</span>
          </div>
          <label class="mt-4 flex items-center gap-2.5 rounded-full bg-white px-4 ring-1 ring-ink/[0.08] focus-within:ring-2 focus-within:ring-lagoon-500">
            ${icon('search', 'h-5 w-5 shrink-0 text-ink-soft')}
            <input id="search" type="search" value="${esc(ui.search)}" placeholder="Имя, ник, телефон, отель…" autocomplete="off"
                   class="w-full bg-transparent py-3 text-[16px] outline-none placeholder:text-ink-soft/60">
          </label>
          <div class="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            ${chip('all', 'Все', total)}
            ${STAGES.map((s) => chip(s.id, s.label, store.clients.filter((c) => c.stage === s.id).length)).join('')}
          </div>
        </header>
        <div id="client-list" class="pt-2">${clientListHTML()}</div>
      </div>`;
  };

  /* ---------- Экран «Прилёты» ---------- */
  const arrivalRow = (c) => `
    <a href="#/client/${c.id}" class="press flex items-center gap-4 rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/[0.06]">
      <span class="w-14 shrink-0 text-center">
        <span class="block text-lg font-semibold leading-none tracking-tight">${esc(c.arrivalTime || '—')}</span>
        <span class="mt-1.5 block truncate text-[11px] text-ink-soft">${esc(c.flight || 'рейс?')}</span>
      </span>
      <span class="h-10 w-px shrink-0 bg-ink/10"></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold">${esc(c.name)}</span>
        <span class="block truncate text-[13px] text-ink-soft">${esc([guestsLabel(c), c.hotel].filter(Boolean).join(' · ') || 'место не указано')}</span>
      </span>
      <span class="flex shrink-0 gap-1 text-lagoon-700">
        ${c.services.map((id) => `<span class="grid h-7 w-7 place-items-center rounded-full bg-lagoon-500/10">${icon(serviceById[id].icon, 'h-3.5 w-3.5')}</span>`).join('')}
      </span>
    </a>`;

  const viewArrivals = () => {
    const today = isoToday();
    const upcoming = ui.arrivals === 'upcoming';
    const list = store.clients
      .filter((c) => c.arrival && c.stage !== 'lost' && (upcoming ? c.arrival >= today : c.arrival < today))
      .sort((a, b) => {
        const k = `${a.arrival}${a.arrivalTime}`.localeCompare(`${b.arrival}${b.arrivalTime}`);
        return upcoming ? k : -k;
      });

    const groups = new Map();
    list.forEach((c) => groups.set(c.arrival, [...(groups.get(c.arrival) || []), c]));

    const seg = (id, label) => `
      <button type="button" data-action="arrivals-tab" data-tab="${id}"
              class="flex-1 rounded-full py-2 text-[13px] font-semibold transition ${ui.arrivals === id ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}">${label}</button>`;

    const body = groups.size
      ? [...groups].map(([date, items]) => {
        const near = Math.abs(daysBetween(today, date)) <= 1;
        const title = near ? relDay(date) : fmtDate(date, { day: 'numeric', month: 'long' });
        const sub = near ? fmtDate(date, { weekday: 'short', day: 'numeric', month: 'long' }) : `${fmtDate(date, { weekday: 'long' })} · ${relDay(date)}`;
        return `
          <section class="mt-6">
            <h2 class="mb-2.5 flex items-baseline gap-2 px-1">
              <span class="text-lg font-semibold first-letter:uppercase">${title}</span>
              <span class="text-sm text-ink-soft">${sub}</span>
            </h2>
            <div class="space-y-2.5">${items.map(arrivalRow).join('')}</div>
          </section>`;
      }).join('')
      : `<div class="mt-10 text-center">
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sunset/10 text-sunset">${icon('plane', 'h-7 w-7')}</span>
          <p class="mt-4 font-semibold">${upcoming ? 'Нет предстоящих прилётов' : 'Прошедших прилётов нет'}</p>
          <p class="mx-auto mt-1 max-w-xs text-[15px] text-ink-soft">Дата прилёта указывается в карточке клиента.</p>
        </div>`;

    return `
      <div>
        ${pageHeader('Прилёты')}
        <div class="px-5">
          <div class="flex rounded-full bg-ink/[0.06] p-1">${seg('upcoming', 'Предстоящие')}${seg('past', 'Прошедшие')}</div>
          ${body}
        </div>
      </div>`;
  };

  /* ---------- Экран клиента ---------- */
  const viewClient = (id) => {
    const c = store.get(id);
    if (!c) {
      return `<div class="px-5 pt-28 text-center">
        <p class="text-ink-soft">Клиент не найден</p>
        <a href="#/clients" class="mt-4 inline-block font-semibold text-lagoon-700">К списку клиентов</a>
      </div>`;
    }

    const today = isoToday();
    const source = sourceById[c.source];
    const links = contactLinks(c);

    const actions = links.length
      ? `<div class="mt-6 grid gap-2" style="grid-template-columns:repeat(${links.length},minmax(0,1fr))">
          ${links.map((a) => `
            <a href="${esc(a.href)}" ${a.local ? '' : 'target="_blank" rel="noopener"'} class="press flex flex-col items-center gap-1.5 rounded-[1.25rem] bg-white py-3 ring-1 ring-ink/[0.06]">
              <span class="grid h-10 w-10 place-items-center rounded-full text-white" style="background:${a.color}">${a.icon}</span>
              <span class="text-[11px] font-semibold">${a.label}</span>
            </a>`).join('')}
        </div>`
      : `<button type="button" data-action="edit" data-id="${c.id}" class="mt-6 w-full rounded-[1.25rem] border border-dashed border-ink/20 py-4 text-[15px] font-medium text-ink-soft">+ Добавить Telegram, телефон или Instagram</button>`;

    const stages = STAGES.map((s) => {
      const on = c.stage === s.id;
      return `<button type="button" data-action="set-stage" data-id="${c.id}" data-stage="${s.id}"
                      class="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${on ? 'text-white' : 'bg-white text-ink-soft ring-1 ring-ink/[0.08]'}"
                      ${on ? `style="background:${s.color}"` : ''}>${s.label}</button>`;
    }).join('');

    const overdue = c.nextDate && daysBetween(today, c.nextDate) < 0;
    const nextStep = c.nextAction
      ? `<div class="flex items-start gap-3 rounded-[1.5rem] p-4 ring-1 ${overdue ? 'bg-sunset/10 ring-sunset/30' : 'bg-white ring-ink/[0.06]'}">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${overdue ? 'bg-sunset text-white' : 'bg-sunset/10 text-sunset'}">${icon('bell', 'h-[18px] w-[18px]')}</span>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Следующий шаг${c.nextDate ? ` · ${overdue ? 'просрочено, ' : ''}${relDay(c.nextDate)}` : ''}</p>
            <p class="mt-1 font-medium">${esc(c.nextAction)}</p>
          </div>
          <button type="button" data-action="done-next" data-id="${c.id}" class="shrink-0 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-paper">Готово</button>
        </div>`
      : `<button type="button" data-action="edit" data-id="${c.id}" class="flex w-full items-center gap-3 rounded-[1.5rem] border border-dashed border-ink/20 p-4 text-left text-[15px] font-medium text-ink-soft">
          ${icon('bell', 'h-5 w-5')}Запланировать следующий шаг
        </button>`;

    const cell = (label, value, sub = '', wide = false) => `
      <div class="bg-white p-4 ${wide ? 'col-span-2' : ''}">
        <dt class="text-[12px] text-ink-soft">${label}</dt>
        <dd class="mt-1 font-semibold ${value ? '' : 'text-ink/30'}">${value ? esc(value) : '—'}</dd>
        ${sub ? `<dd class="text-[12px] text-ink-soft">${esc(sub)}</dd>` : ''}
      </div>`;

    const trip = `
      <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] bg-ink/[0.06] ring-1 ring-ink/[0.06]">
        ${cell('Прилёт', fmtDate(c.arrival), c.arrival ? [c.arrivalTime, relDay(c.arrival)].filter(Boolean).join(' · ') : '')}
        ${cell('Вылет', fmtDate(c.departure), relDay(c.departure))}
        ${cell('Рейс', c.flight)}
        ${cell('Гостей', c.guests ? String(c.guests) : '')}
        ${cell('Где живёт', c.hotel, '', true)}
        ${cell('Стоимость', c.price, '', true)}
      </dl>`;

    const services = SERVICES.map((s) => {
      const on = c.services.includes(s.id);
      return `<button type="button" data-action="toggle-service" data-id="${c.id}" data-service="${s.id}"
                      class="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${on ? 'bg-lagoon-800 text-paper' : 'bg-white text-ink-soft ring-1 ring-ink/[0.08]'}">
                ${icon(s.icon, 'h-4 w-4')}${s.label}
              </button>`;
    }).join('');

    const history = c.history.slice().reverse().map((h) => `
      <li class="relative pl-6">
        <span class="absolute left-0 top-[7px] h-2.5 w-2.5 rounded-full bg-sunset ring-4 ring-paper"></span>
        <p class="whitespace-pre-line text-[15px] leading-snug">${esc(h.text)}</p>
        <p class="mt-0.5 text-[12px] text-ink-soft">${fmtStamp(h.at)}</p>
      </li>`).join('');

    return `
      <div>
        <header class="sticky top-0 z-20 flex items-center justify-between bg-paper/85 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl">
          <button type="button" data-action="back" class="grid h-11 w-11 place-items-center rounded-full transition active:bg-ink/5" aria-label="Назад">${icon('back', 'h-6 w-6', 2)}</button>
          <div class="flex gap-1">
            <button type="button" data-action="edit" data-id="${c.id}" class="grid h-11 w-11 place-items-center rounded-full transition active:bg-ink/5" aria-label="Редактировать">${icon('edit', 'h-5 w-5')}</button>
            <button type="button" data-action="delete" data-id="${c.id}" class="grid h-11 w-11 place-items-center rounded-full text-[#B4534A] transition active:bg-ink/5" aria-label="Удалить">${icon('trash', 'h-5 w-5')}</button>
          </div>
        </header>

        <div class="px-5">
          <div class="flex items-center gap-4 pt-2">
            ${avatar(c, 'h-16 w-16 text-lg')}
            <div class="min-w-0">
              <h1 class="text-[1.85rem] font-semibold leading-tight tracking-tight">${esc(c.name)}</h1>
              <p class="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                <span style="color:${source.color}">${sourceIcon(c.source, 'h-4 w-4')}</span>${source.label} · с ${fmtDate(isoDateOf(c.createdAt), { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          ${actions}

          <p class="field-legend mt-7">Этап</p>
          <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">${stages}</div>

          <div class="mt-6">${nextStep}</div>

          <p class="field-legend mt-7">Поездка</p>
          ${trip}

          <p class="field-legend mt-7">Услуги</p>
          <div class="flex flex-wrap gap-2">${services}</div>

          ${c.notes ? `<p class="field-legend mt-7">Заметки</p>
          <p class="whitespace-pre-line rounded-[1.5rem] bg-white p-4 leading-relaxed ring-1 ring-ink/[0.06]">${esc(c.notes)}</p>` : ''}

          <p class="field-legend mt-7">История</p>
          <form id="note-form" data-id="${c.id}" class="flex items-center gap-2">
            <input name="note" placeholder="Добавить запись…" autocomplete="off" maxlength="1000"
                   class="min-w-0 flex-1 rounded-full bg-white px-4 py-3 text-[16px] outline-none ring-1 ring-ink/[0.08] placeholder:text-ink-soft/60 focus:ring-2 focus:ring-lagoon-500">
            <button class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-paper" aria-label="Добавить запись">${icon('plus', 'h-5 w-5', 2.2)}</button>
          </form>
          <ol class="relative mt-5 space-y-4 before:absolute before:bottom-2 before:left-[4.5px] before:top-2 before:w-px before:bg-ink/10 before:content-['']">${history}</ol>
        </div>
      </div>`;
  };

  /* ---------- Экран «Ещё» ---------- */
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  const automationCard = () => {
    const s = sync.state;
    const info = s.info || {};
    const status = (label, iconHTML, ok, note) => `
      <li class="flex items-center gap-3 py-2.5">
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10">${iconHTML}</span>
        <span class="min-w-0 flex-1 text-[15px]">${label}</span>
        <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${ok ? 'bg-lagoon-300/20 text-lagoon-300' : 'bg-white/10 text-paper/60'}">${note}</span>
      </li>`;

    if (!sync.connected) {
      return `
        <span class="grid h-12 w-12 place-items-center rounded-2xl bg-sunset text-white">${icon('zap', 'h-6 w-6')}</span>
        <h2 class="mt-4 text-xl font-semibold tracking-tight">Автоматические заявки</h2>
        <p class="mt-2 text-[15px] leading-relaxed text-paper/70">Заявки с сайта и новые клиенты из Telegram будут появляться здесь сами. Настройте сервер по инструкции, отправьте своему боту <b class="font-semibold text-paper">/connect</b> и вставьте присланный код.</p>
        <form id="connect-form" class="mt-4 flex flex-col gap-2">
          <input name="code" placeholder="Код подключения" autocomplete="off" autocapitalize="off" spellcheck="false"
                 class="w-full rounded-full bg-white/10 px-4 py-3 text-[16px] text-paper outline-none ring-1 ring-white/15 placeholder:text-paper/45 focus:ring-lagoon-300">
          <button class="press rounded-full bg-paper py-3 text-[15px] font-semibold text-ink">Подключить</button>
        </form>`;
    }

    return `
      <div class="flex items-start justify-between gap-3">
        <span class="grid h-12 w-12 place-items-center rounded-2xl bg-sunset text-white">${icon('zap', 'h-6 w-6')}</span>
        <span class="rounded-full bg-lagoon-300/20 px-3 py-1.5 text-[12px] font-semibold text-lagoon-300">Подключено</span>
      </div>
      <h2 class="mt-4 text-xl font-semibold tracking-tight">Автоматические заявки</h2>
      <p class="mt-1 text-[14px] text-paper/60">${s.lastSync ? `Проверено ${fmtStamp(s.lastSync)}` : 'Ещё не проверялось'} · обновляется само раз в минуту</p>
      <ul class="mt-3 divide-y divide-white/10">
        ${status('Форма на сайте', icon('globe', 'h-4 w-4'), true, 'принимает')}
        ${status('Telegram-бот', sourceIcon('telegram', 'h-4 w-4'), info.owner, info.owner ? 'работает' : 'отправьте /start')}
        ${status('Telegram Business', icon('zap', 'h-4 w-4'), info.business, info.business ? 'подключён' : 'не подключён')}
        ${status('Instagram', sourceIcon('instagram', 'h-4 w-4'), false, 'через бота')}
        ${status('WhatsApp', sourceIcon('whatsapp', 'h-4 w-4'), false, 'через бота')}
      </ul>
      <p class="mt-3 text-[13px] leading-relaxed text-paper/55">Instagram и WhatsApp: отправьте боту ссылку на профиль или номер — карточка появится здесь.</p>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button type="button" data-action="sync" class="press inline-flex items-center justify-center gap-2 rounded-full bg-paper py-3 text-[15px] font-semibold text-ink"><span data-sync-icon>${icon('refresh', 'h-4 w-4')}</span>Проверить</button>
        <button type="button" data-action="disconnect" class="press rounded-full py-3 text-[15px] font-semibold text-paper ring-1 ring-white/20">Отключить</button>
      </div>`;
  };

  const viewMore = () => {
    const demoCount = store.clients.filter((c) => c.demo).length;
    const card = (body, cls = 'bg-white ring-1 ring-ink/[0.06]') => `<div class="rounded-[1.75rem] p-5 ${cls}">${body}</div>`;

    const install = isStandalone() ? '' : card(`
      <div class="flex items-start gap-4">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lagoon-500/10 text-lagoon-700">${icon('device', 'h-6 w-6')}</span>
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-semibold tracking-tight">Установить на телефон</h2>
          <p class="mt-1 text-[15px] leading-relaxed text-ink-soft">
            ${installPrompt
              ? 'Приложение появится на главном экране и будет открываться без браузера.'
              : '<b class="font-semibold text-ink">iPhone:</b> Safari → «Поделиться» → «На экран „Домой“».<br><b class="font-semibold text-ink">Android:</b> меню браузера ⋮ → «Установить приложение».'}
          </p>
          ${installPrompt ? '<button type="button" data-action="install" class="press mt-4 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-paper">Установить</button>' : ''}
        </div>
      </div>`);

    const quickAdd = card(`
      <h2 class="text-lg font-semibold tracking-tight">Быстрое добавление</h2>
      <ul class="mt-3 space-y-2.5 text-[15px] leading-relaxed text-ink-soft">
        <li class="flex gap-2.5">${icon('paste', 'mt-0.5 h-5 w-5 shrink-0 text-lagoon-700')}<span>Скопируйте ссылку на профиль, @ник или номер и нажмите «Вставить» в новой карточке.</span></li>
        <li class="flex gap-2.5">${icon('share', 'mt-0.5 h-5 w-5 shrink-0 text-lagoon-700')}<span>Android: «Поделиться» → «Свой CRM» в Telegram, Instagram или WhatsApp (после установки приложения).</span></li>
      </ul>`);

    const backup = card(`
      <h2 class="text-lg font-semibold tracking-tight">Резервная копия</h2>
      <p class="mt-1 text-[15px] leading-relaxed text-ink-soft">Клиенты хранятся только на этом телефоне. Раз в неделю сохраняйте копию — например, в «Избранное» Telegram.</p>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button type="button" data-action="export" class="press inline-flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-[15px] font-semibold text-paper">${icon('download', 'h-[18px] w-[18px]')}Сохранить</button>
        <button type="button" data-action="import" class="press inline-flex items-center justify-center gap-2 rounded-full py-3 text-[15px] font-semibold ring-1 ring-ink/15">${icon('upload', 'h-[18px] w-[18px]')}Восстановить</button>
      </div>`);

    const data = card(`
      <h2 class="text-lg font-semibold tracking-tight">Данные</h2>
      <p class="mt-1 text-[15px] text-ink-soft">Клиентов в базе: ${store.clients.length}${demoCount ? `, из них примеров: ${demoCount}` : ''}</p>
      <div class="mt-4 flex flex-col gap-2">
        ${demoCount
          ? '<button type="button" data-action="remove-demo" class="press rounded-full py-3 text-[15px] font-semibold ring-1 ring-ink/15">Удалить примеры</button>'
          : '<button type="button" data-action="demo" class="press rounded-full py-3 text-[15px] font-semibold ring-1 ring-ink/15">Добавить примеры клиентов</button>'}
        ${store.clients.length ? '<button type="button" data-action="wipe" class="rounded-full py-3 text-[15px] font-semibold text-[#B4534A]">Удалить все данные</button>' : ''}
      </div>`);

    return `
      <div>
        ${pageHeader('Ещё')}
        <div class="space-y-3 px-5">
          ${install}
          ${card(automationCard(), 'relative overflow-hidden bg-lagoon-900 text-paper')}
          ${quickAdd}${backup}${data}
          <p class="pt-3 text-center text-[12px] text-ink-soft">Свой на Фукуоке · CRM 1.1</p>
        </div>
      </div>`;
  };

  /* ---------- Шторка добавления и редактирования ---------- */
  const sheet = {
    root: () => document.getElementById('sheet-root'),

    open(html) {
      const root = this.root();
      root.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
      document.body.classList.add('sheet-lock');
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-open')));
    },

    close() {
      const root = this.root();
      if (!root.innerHTML) return;
      root.classList.remove('is-open');
      document.body.classList.remove('sheet-lock');
      setTimeout(() => { if (!root.classList.contains('is-open')) root.innerHTML = ''; }, 350);
    }
  };

  const row = (label, input) => `<label class="row"><span class="row-label">${label}</span>${input}</label>`;
  const field = (name, value, attrs = '') => `<input class="row-input" name="${name}" value="${esc(value)}" ${attrs}>`;

  const choiceChips = (type, name, items, isChecked) => items.map((it) => `
    <label class="shrink-0">
      <input type="${type}" name="${name}" value="${it.id}" class="peer sr-only" ${isChecked(it.id) ? 'checked' : ''}>
      <span class="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-soft ring-1 ring-ink/[0.08] transition peer-checked:bg-ink peer-checked:text-paper peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lagoon-500">
        ${it.iconHTML || ''}${it.label}
      </span>
    </label>`).join('');

  const quickBox = (quick) => `
    <div class="relative overflow-hidden rounded-[1.5rem] bg-lagoon-900 p-4 text-paper">
      <div class="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-lagoon-500/30 blur-2xl"></div>
      <div class="relative flex items-center justify-between gap-3">
        <p class="flex items-center gap-2 text-sm font-semibold">${icon('sparkle', 'h-4 w-4 text-sunset-soft')}Быстрое добавление</p>
        <button type="button" data-action="paste" class="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[13px] font-semibold text-ink">${icon('paste', 'h-4 w-4')}Вставить</button>
      </div>
      <textarea id="quick" rows="3" placeholder="Ссылка на профиль, @ник, номер или текст из чата"
                class="relative mt-3 block w-full resize-none rounded-2xl bg-white/10 px-3.5 py-3 text-[16px] text-paper outline-none ring-1 ring-white/15 placeholder:text-paper/45 focus:ring-lagoon-300">${esc(quick)}</textarea>
      <div id="quick-result" class="relative mt-2.5 flex min-h-[1.5rem] flex-wrap gap-1.5"></div>
    </div>`;

  const blankClient = () => sanitize({ name: ' ', source: 'telegram' });

  const editorHTML = (c, isNew, quick) => `
    <form id="editor" class="flex min-h-0 flex-1 flex-col" data-id="${isNew ? '' : c.id}" novalidate>
      <div class="flex items-center justify-between px-5 pb-2 pt-2">
        <button type="button" data-action="close-sheet" class="py-2 text-[15px] font-medium text-ink-soft">Отмена</button>
        <h2 class="text-[15px] font-semibold">${isNew ? 'Новый клиент' : 'Редактирование'}</h2>
        <button type="submit" class="py-2 text-[15px] font-semibold text-lagoon-700">Готово</button>
      </div>

      <div class="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-2">
        ${isNew ? quickBox(quick) : ''}

        <fieldset>
          <legend class="field-legend">Откуда пришёл</legend>
          <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            ${choiceChips('radio', 'source', SOURCES.map((s) => ({ ...s, iconHTML: `<span style="color:${s.color}">${sourceIcon(s.id, 'h-4 w-4')}</span>` })), (id) => id === c.source)}
          </div>
        </fieldset>

        <div class="group-list">
          ${row('Имя', field('name', isNew ? '' : c.name, 'placeholder="Как зовут" autocomplete="off" maxlength="80" required'))}
          ${row('Telegram', field('telegram', c.telegram, 'placeholder="@ник" autocapitalize="off" autocomplete="off" maxlength="40"'))}
          ${row('Телефон', field('phone', c.phone, 'type="tel" placeholder="+7… (и WhatsApp)" autocomplete="off" maxlength="20"'))}
          ${row('Instagram', field('instagram', c.instagram, 'placeholder="ник" autocapitalize="off" autocomplete="off" maxlength="40"'))}
        </div>

        <fieldset>
          <legend class="field-legend">Этап</legend>
          <div class="flex flex-wrap gap-2">${choiceChips('radio', 'stage', STAGES, (id) => id === c.stage)}</div>
        </fieldset>

        <div>
          <p class="field-legend">Поездка</p>
          <div class="group-list">
            ${row('Прилёт', field('arrival', c.arrival, 'type="date"'))}
            ${row('Время', field('arrivalTime', c.arrivalTime, 'type="time"'))}
            ${row('Рейс', field('flight', c.flight, 'placeholder="Например, VJ 975" autocapitalize="characters" autocomplete="off" maxlength="20"'))}
            ${row('Вылет', field('departure', c.departure, 'type="date"'))}
            ${row('Гостей', field('guests', c.guests, 'type="number" inputmode="numeric" min="1" max="99" placeholder="2"'))}
            ${row('Где живёт', field('hotel', c.hotel, 'placeholder="Отель или вилла" autocomplete="off" maxlength="120"'))}
          </div>
        </div>

        <fieldset>
          <legend class="field-legend">Услуги</legend>
          <div class="flex flex-wrap gap-2">
            ${choiceChips('checkbox', 'services', SERVICES.map((s) => ({ ...s, iconHTML: icon(s.icon, 'h-4 w-4') })), (id) => c.services.includes(id))}
          </div>
        </fieldset>

        <div>
          <p class="field-legend">Договорённости</p>
          <div class="group-list">
            ${row('Стоимость', field('price', c.price, 'placeholder="Например, 50 $" autocomplete="off" maxlength="80"'))}
            ${row('Шаг', field('nextAction', c.nextAction, 'placeholder="Что сделать дальше" autocomplete="off" maxlength="200"'))}
            ${row('Когда', field('nextDate', c.nextDate, 'type="date"'))}
          </div>
        </div>

        <div>
          <p class="field-legend">Заметки</p>
          <textarea name="notes" rows="4" maxlength="3000" placeholder="Пожелания, детали, договорённости"
                    class="block w-full resize-none rounded-[1.25rem] bg-white px-4 py-3.5 text-[16px] outline-none ring-1 ring-ink/[0.06] placeholder:text-ink-soft/50 focus:ring-2 focus:ring-lagoon-500">${esc(c.notes)}</textarea>
        </div>

        <button type="submit" class="press w-full rounded-full bg-ink py-4 text-base font-semibold text-paper">Сохранить</button>
      </div>
    </form>`;

  const openEditor = (id, { quick = '' } = {}) => {
    const existing = id ? store.get(id) : null;
    sheet.open(editorHTML(existing || blankClient(), !existing, quick));
    if (quick) applyQuick(quick);
  };

  const applyQuick = (input) => {
    const form = document.getElementById('editor');
    const result = document.getElementById('quick-result');
    if (!form || !result) return;

    const f = form.elements;
    const parsed = parseContact(input, f.source.value);
    const found = [];

    if (parsed.telegram) { f.telegram.value = parsed.telegram; found.push(['telegram', parsed.telegram]); }
    if (parsed.instagram) { f.instagram.value = parsed.instagram; found.push(['instagram', `@${parsed.instagram}`]); }
    if (parsed.phone) { f.phone.value = parsed.phone; found.push(['whatsapp', parsed.phone]); }
    if (parsed.name && !f.name.value.trim()) { f.name.value = parsed.name; found.push(['name', parsed.name]); }
    if (parsed.source) {
      const radio = form.querySelector(`input[name="source"][value="${parsed.source}"]`);
      if (radio) radio.checked = true;
    }

    result.innerHTML = found.length
      ? found.map(([kind, value]) => `
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium">
            ${kind === 'name' ? icon('check', 'h-3.5 w-3.5', 2.4) : sourceIcon(kind, 'h-3.5 w-3.5')}${esc(value)}
          </span>`).join('')
      : (input.trim() ? '<span class="text-[12px] text-paper/50">Не нашёл ссылку, ник или номер — заполните поля вручную</span>' : '');
  };

  const pasteQuick = async () => {
    const box = document.getElementById('quick');
    try {
      const clip = await navigator.clipboard.readText();
      box.value = clip;
      applyQuick(clip);
    } catch {
      box.focus();
      toast('Вставьте текст в поле — долгое нажатие → «Вставить»');
    }
  };

  const saveEditor = (form) => {
    const f = form.elements;
    const name = f.name.value.trim();
    if (!name) {
      const nameRow = f.name.closest('.row');
      nameRow.classList.remove('shake');
      void nameRow.offsetWidth;
      nameRow.classList.add('shake');
      f.name.focus();
      toast('Укажите имя клиента');
      return;
    }

    const prev = form.dataset.id ? store.get(form.dataset.id) : null;
    const client = {
      ...(prev || { id: uid(), createdAt: new Date().toISOString(), history: [] }),
      name,
      source: f.source.value,
      telegram: normTelegram(f.telegram.value),
      phone: normPhone(f.phone.value),
      instagram: f.instagram.value.trim().replace(/^@+/, ''),
      stage: f.stage.value,
      arrival: f.arrival.value,
      arrivalTime: f.arrivalTime.value,
      flight: f.flight.value.trim().toUpperCase(),
      departure: f.departure.value,
      guests: f.guests.value,
      hotel: f.hotel.value.trim(),
      services: [...form.querySelectorAll('input[name="services"]:checked')].map((i) => i.value),
      price: f.price.value.trim(),
      nextAction: f.nextAction.value.trim(),
      nextDate: f.nextDate.value,
      notes: f.notes.value.trim()
    };

    client.history = [...client.history];
    if (!prev) client.history.push(entry(`Карточка создана · ${sourceById[client.source].label}`));
    else if (prev.stage !== client.stage) client.history.push(entry(`Этап: ${stageById[prev.stage].label} → ${stageById[client.stage].label}`));

    const saved = store.upsert(client);
    sheet.close();
    toast(prev ? 'Сохранено' : 'Клиент добавлен');
    if (prev) render();
    else location.hash = `#/client/${saved.id}`;
  };

  /* ---------- Примеры клиентов (чтобы посмотреть, как всё работает) ---------- */
  const seedDemo = () => {
    const t = isoToday();
    const now = Date.now();
    const demo = [
      { name: 'Анна и Сергей', source: 'telegram', telegram: '@anna_example', stage: 'booked', arrival: addDays(t, 2), arrivalTime: '23:40', flight: 'VJ 975', departure: addDays(t, 12), guests: 4, services: ['airport', 'housing', 'bike'], hotel: 'Вилла, Онг Ланг', price: 'Встреча + 2 байка', nextAction: 'Отправить фото виллы', nextDate: t },
      { name: 'Игорь', source: 'whatsapp', phone: '+79990000003', stage: 'booked', arrival: t, arrivalTime: '14:10', flight: 'VN 1233', guests: 3, services: ['airport'], hotel: 'Отель, Лонг Бич', nextAction: 'Подтвердить встречу', nextDate: addDays(t, -1) },
      { name: 'Дмитрий', source: 'whatsapp', phone: '+79990000001', stage: 'talking', arrival: addDays(t, 9), guests: 1, services: ['bike'], nextAction: 'Подобрать байк', nextDate: addDays(t, 1) },
      { name: 'Екатерина', source: 'instagram', instagram: 'katya.example', stage: 'new', services: ['housing'], notes: 'Ищет апартаменты у Лонг Бич на 2 недели' },
      { name: 'Михаил', source: 'site', phone: '+79990000002', stage: 'onisland', arrival: addDays(t, -3), departure: addDays(t, 5), guests: 2, services: ['airport', 'help'], hotel: 'Отель, Дуонгдонг' },
      { name: 'Ольга', source: 'telegram', telegram: '@olga_example', stage: 'done', arrival: addDays(t, -20), departure: addDays(t, -6), services: ['airport', 'housing'] }
    ].map((c, i) => {
      const at = new Date(now - (i + 1) * 36e5 * 7).toISOString();
      return sanitize({ ...c, demo: true, createdAt: at, updatedAt: at, history: [{ at, text: `Карточка создана · ${sourceById[c.source].label}` }] });
    });
    store.clients = [...demo, ...store.clients];
    store.save();
    render();
    toast('Добавлены примеры — их можно удалить в разделе «Ещё»');
  };

  /* ---------- Резервная копия ---------- */
  const exportData = async () => {
    const payload = { app: 'svoy-crm', version: 1, exportedAt: new Date().toISOString(), clients: store.clients };
    const name = `svoy-crm-${isoToday()}.json`;
    const file = new File([JSON.stringify(payload, null, 2)], name, { type: 'application/json' });

    // На телефоне — системное меню «Поделиться»: можно сразу отправить файл в Telegram
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Свой CRM — резервная копия' });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast('Копия сохранена');
  };

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const list = (Array.isArray(data) ? data : data.clients).filter((c) => c && typeof c === 'object').map(sanitize);
      const byId = new Map(store.clients.map((c) => [c.id, c]));
      list.forEach((c) => byId.set(c.id, c));
      store.clients = [...byId.values()];
      store.save();
      render();
      toast(`Восстановлено клиентов: ${list.length}`);
    } catch {
      toast('Не удалось прочитать файл копии');
    }
  });

  /* ---------- Уведомление ---------- */
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  /* ---------- Навигация ---------- */
  const parseRoute = () => {
    const [path, query = ''] = (location.hash || '#/today').slice(1).split('?');
    const [name = 'today', param] = path.split('/').filter(Boolean);
    return { name, param, query: new URLSearchParams(query) };
  };

  function render() {
    const { name, param, query } = parseRoute();
    const views = { today: viewToday, clients: viewClients, arrivals: viewArrivals, more: viewMore };

    if (name === 'clients' && query.has('stage')) ui.stage = query.get('stage');
    if (name !== 'client') ui.listRoute = location.hash || '#/today';

    document.getElementById('view').innerHTML = name === 'client' ? viewClient(param) : (views[name] || viewToday)();

    document.querySelectorAll('[data-tab]').forEach((tab) => {
      const active = tab.dataset.tab === (name === 'client' ? 'clients' : name);
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  // Фоновое обновление не перерисовывает экран, пока человек что-то печатает
  const renderIfIdle = () => {
    const active = document.activeElement;
    const typing = active && active.closest('#view') && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
    if (!typing) render();
  };

  // Анимация появления — только при переходе между экранами, а не при каждом нажатии
  const animateView = () => {
    const view = document.getElementById('view');
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
    clearTimeout(animateView.timer);
    animateView.timer = setTimeout(() => view.classList.remove('view-enter'), 450);
  };

  window.addEventListener('hashchange', () => {
    sheet.close();
    render();
    animateView();
    window.scrollTo(0, 0);
  });

  /* ---------- Действия ---------- */
  const updateClient = (id, change) => {
    const c = store.get(id);
    if (!c) return;
    const next = { ...c, services: [...c.services], history: [...c.history] };
    change(next);
    store.upsert(next);
    render();
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id } = el.dataset;

    switch (action) {
      case 'new':
        openEditor();
        break;
      case 'edit':
        openEditor(id);
        break;
      case 'close-sheet':
        sheet.close();
        break;
      case 'paste':
        pasteQuick();
        break;
      case 'back':
        location.hash = ui.listRoute;
        break;
      case 'delete': {
        const c = store.get(id);
        if (c && confirm(`Удалить «${c.name}»? Это нельзя отменить.`)) {
          store.remove(id);
          toast('Клиент удалён');
          location.hash = ui.listRoute;
        }
        break;
      }
      case 'set-stage':
        updateClient(id, (c) => {
          const to = el.dataset.stage;
          if (c.stage === to || !stageById[to]) return;
          c.history.push(entry(`Этап: ${stageById[c.stage].label} → ${stageById[to].label}`));
          c.stage = to;
        });
        break;
      case 'toggle-service':
        updateClient(id, (c) => {
          const s = el.dataset.service;
          c.services = c.services.includes(s) ? c.services.filter((x) => x !== s) : [...c.services, s];
        });
        break;
      case 'done-next':
        updateClient(id, (c) => {
          c.history.push(entry(`Выполнено: ${c.nextAction}`));
          c.nextAction = '';
          c.nextDate = '';
        });
        toast('Отмечено как выполненное');
        break;
      case 'filter-stage':
        ui.stage = el.dataset.stage;
        if (location.hash.includes('?')) location.hash = '#/clients';
        else render();
        break;
      case 'arrivals-tab':
        ui.arrivals = el.dataset.tab;
        render();
        break;
      case 'sync':
        sync.pull({ silent: false });
        break;
      case 'disconnect':
        if (confirm('Отключить автоматические заявки? Уже добавленные клиенты останутся.')) {
          sync.disconnect();
          render();
          toast('Отключено');
        }
        break;
      case 'demo':
        seedDemo();
        break;
      case 'remove-demo':
        store.clients = store.clients.filter((c) => !c.demo);
        store.save();
        render();
        toast('Примеры удалены');
        break;
      case 'export':
        exportData();
        break;
      case 'import':
        document.getElementById('import-file').click();
        break;
      case 'wipe':
        if (confirm('Удалить всех клиентов? Сначала лучше сохранить резервную копию.')) {
          store.clients = [];
          store.save();
          render();
          toast('Все данные удалены');
        }
        break;
      case 'install':
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.finally(() => { installPrompt = null; render(); });
        }
        break;
      default:
        break;
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id === 'editor') {
      e.preventDefault();
      saveEditor(form);
    }
    if (form.id === 'note-form') {
      e.preventDefault();
      const note = form.elements.note.value.trim();
      if (note) updateClient(form.dataset.id, (c) => c.history.push(entry(note)));
    }
    if (form.id === 'connect-form') {
      e.preventDefault();
      const button = form.querySelector('button');
      button.disabled = true;
      button.textContent = 'Подключаю…';
      sync.connect(form.elements.code.value)
        .then(() => {
          toast('Подключено');
          render();
          sync.pull({ silent: false });
        })
        .catch((err) => {
          const messages = {
            code: 'Это не похоже на код подключения — запросите у бота /connect',
            forbidden: 'Ключ не подходит — запросите у бота /connect ещё раз'
          };
          toast(messages[err.message] || 'Сервер не ответил — проверьте код и интернет');
          button.disabled = false;
          button.textContent = 'Подключить';
        });
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'quick') applyQuick(e.target.value);
    if (e.target.id === 'search') {
      ui.search = e.target.value;
      document.getElementById('client-list').innerHTML = clientListHTML();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sheet.close();
  });

  /* ---------- Установка как приложения ---------- */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    if (parseRoute().name === 'more') render();
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  /* ---------- Запуск ---------- */
  store.load();
  sync.load();

  // «Поделиться» из других приложений (Android): текст приходит в адресе страницы
  const params = new URLSearchParams(location.search);
  const shared = ['share_title', 'share_text', 'share_url'].map((key) => params.get(key)).filter(Boolean).join('\n');
  if (shared) history.replaceState(null, '', `${location.pathname}#/today`);

  render();
  animateView();
  if (shared) openEditor(null, { quick: shared });

  // Новые заявки: при открытии, при возврате в приложение и раз в минуту
  sync.pull();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync.pull();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') sync.pull();
  }, 60000);

  // Время на острове обновляется само
  setInterval(() => {
    document.querySelectorAll('[data-island-time]').forEach((el) => { el.textContent = islandTime(); });
  }, 15000);
})();
