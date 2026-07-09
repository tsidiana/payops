const STORAGE_KEY = 'payops_services_v7';
const HISTORY_KEY = 'payops_history_v7';
const USERS_KEY = 'payops_users_v2';
const SESSION_KEY = 'payops_session_user_v1';
const LIMITS_KEY = 'payops_category_limits_v1';
const AUDIT_KEY = 'payops_audit_v1';
const SIDEBAR_COLLAPSED_KEY = 'payops_sidebar_collapsed_v1';

const $ = id => document.getElementById(id);
const uid = () => crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
const today = () => new Date(new Date().toDateString());
const parseDate = value => value ? new Date(value + 'T00:00:00') : null;
const iso = date => date.toISOString().slice(0, 10);
const fmt = value => value ? parseDate(value).toLocaleDateString('uk-UA') : '—';
const money = value => value !== '' && value !== null && value !== undefined ? Number(value).toLocaleString('uk-UA', { maximumFractionDigits: 2 }) + ' грн' : '—';
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const jsArg = value => JSON.stringify(String(value ?? '')).replace(/"/g, '&quot;');
const groupBy = (items, getKey) => items.reduce((acc, item) => ((acc[getKey(item)] ??= []).push(item), acc), {});

const roleMeta = {
  superadmin: { label: 'Суперадмін', hint: 'Повний доступ до системи', permissions: ['write', 'delete', 'import', 'export', 'superadmin', 'manageUsers'] },
  admin: { label: 'Адмін', hint: 'Може вести сервіси й оплати', permissions: ['write', 'export'] },
  pm: { label: 'PM', hint: 'Керує сервісами та відповідальними', permissions: ['write', 'export'] },
  accountant: { label: 'Бухгалтер', hint: 'Оновлює оплати та документи', permissions: ['write', 'export'] },
  viewer: { label: 'Viewer', hint: 'Тільки читання без змін', permissions: [] }
};

const categoryOrder = ['Інтернет', 'РРО', 'ПРРО', 'Домени', 'Сервера', 'VPN', 'Телефонія', 'Email', 'Ліцензії', 'Microsoft', 'Google', 'SSL', 'POS', 'Хмара', 'CRM', 'Антивірус', 'ВЧАСНО', 'Інше'];
const defaultCategoryLimits = { 'Інтернет': 4000, 'РРО': 5000, 'ПРРО': 8000, 'Домени': 3000, 'Сервера': 10000, 'VPN': 2500, 'Телефонія': 5000, 'Email': 3000, 'Ліцензії': 9000, 'Microsoft': 8000, 'Google': 8000, 'SSL': 2500, 'POS': 6000, 'Хмара': 12000, 'CRM': 9000, 'Антивірус': 3000, 'ВЧАСНО': 3000, 'Інше': 3000 };

const demo = [
  { id: uid(), owner: 'ФОП БОРОВИК НАТАЛЯ ІВАНІВНА', name: 'e!Кава', type: 'ПРРО', provider: 'Героїв АТО ПРРО', identifier: '4001371048', paidUntil: '2026-07-13', plannedAmount: 1200, schedule: 'monthly', intervalDays: 30, notes: 'Ключ дійсний до 12.03.2027 20:47' },
  { id: uid(), owner: 'ФОП ПОПТАРКІНА СНІЖАНА ВАЛЕРІЇВНА', name: 'e!Кава_2', type: 'ПРРО', provider: 'ПРРО', identifier: '4001021695, 4001164972, 4001256670', paidUntil: '2026-07-06', plannedAmount: 1800, schedule: 'monthly', intervalDays: 30, notes: 'Більше касирів ніж кас. Потрібно звірити актуальність касирів.' },
  { id: uid(), owner: 'ФОП МИКИТЕНКО АНТОН ОЛЕКСАНДРОВИЧ', name: 'e!Кава_2', type: 'ПРРО', provider: 'ПРРО', identifier: '4001330538', paidUntil: '2026-07-07', plannedAmount: 900, schedule: 'monthly', intervalDays: 30, notes: 'Ключ дійсний до 07.01.2027 11:31' },
  { id: uid(), owner: 'ФОП ВОВК СВІТЛАНА АНДРІЇВНА', name: 'Миргород Онлайн Оплата', type: 'Інтернет', provider: 'e!Кава_3 / Продаж', identifier: '485rmb1', paidUntil: '2026-07-09', plannedAmount: 650, schedule: 'monthly', intervalDays: 30, notes: 'Також e!Кава_1 Онлайн Продажа та Полтава інтернет-замовлення.' },
  { id: uid(), owner: 'ФОП ШУЛИК АЛІНА ОЛЕКСАНДРІВНА', name: 'broskododatokoplata', type: 'ПРРО', provider: 'Броско', identifier: '400190250, 4001439404, 4001347139', paidUntil: '2026-07-03', plannedAmount: 1500, schedule: 'monthly', intervalDays: 30, notes: 'Ключі ШУЛИК, KavomatBrosko та broskododatokoplata контролювати окремо.' },
  { id: uid(), owner: 'ФОП ЛИСІВЕНКО ДМИТРО МИКОЛАЙОВИЧ', name: 'PekarnyaCash', type: 'РРО', provider: 'Пекарня', identifier: '4001331559, 4001237247', paidUntil: '2026-07-18', plannedAmount: 1100, schedule: 'monthly', intervalDays: 30, notes: 'Онлайн-оплата ФОП ЛИСІВ. Окрема каса.' },
  { id: uid(), owner: 'ФОП ЛИСІВЕНКО ДМИТРО МИКОЛАЙОВИЧ', name: 'Основний домен', type: 'Домени', provider: 'Доменний реєстратор', identifier: 'example.ua', paidUntil: '2026-08-12', plannedAmount: 900, schedule: 'yearly', intervalDays: 365, notes: 'Контроль продовження домену.' },
  { id: uid(), owner: 'ФОП ВОВК СВІТЛАНА АНДРІЇВНА', name: 'VPS для замовлень', type: 'Сервера', provider: 'Хостинг / VPS', identifier: 'srv-order-01', paidUntil: '2026-07-25', plannedAmount: 2400, schedule: 'monthly', intervalDays: 30, notes: 'Сервер інтернет-замовлень.' }
];

const defaultUsers = [
  { id: uid(), name: 'Власник процесу', username: 'superadmin', password: '1234', role: 'superadmin' },
  { id: uid(), name: 'Операційний адміністратор', username: 'admin', password: '1234', role: 'admin' },
  { id: uid(), name: 'Проєктний менеджер', username: 'pm', password: '1234', role: 'pm' },
  { id: uid(), name: 'Бухгалтер', username: 'accountant', password: '1234', role: 'accountant' },
  { id: uid(), name: 'Фінансовий перегляд', username: 'viewer', password: '1234', role: 'viewer' }
];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
  } catch {
    return fallback;
  }
}

function normalizeCategory(type) {
  if (type === 'Домен') return 'Домени';
  if (type === 'Хостинг') return 'Сервера';
  return categoryOrder.includes(type) ? type : 'Інше';
}

function auditLog(serviceId, serviceName, action, before = '', after = '') {
  audit.push({
    id: uid(),
    serviceId,
    serviceName,
    action,
    before,
    after,
    user: currentUser?.name || 'Система',
    createdAt: new Date().toISOString()
  });
}

let services = load(STORAGE_KEY, null) || load('payops_services_v6', null) || load('payops_services_v5', null) || demo;
let history = load(HISTORY_KEY, null) || load('payops_history_v6', null) || load('payops_history_v5', []);
let users = load(USERS_KEY, null) || load('payops_users_v1', null) || defaultUsers;
let categoryLimits = { ...defaultCategoryLimits, ...load(LIMITS_KEY, {}) };
let audit = load(AUDIT_KEY, []);

if (!users.some(user => user.username && user.password)) users = defaultUsers;
users = users.map(user => ({
  id: user.id || uid(),
  name: user.name || user.username || 'Користувач',
  username: user.username || String(user.name || '').toLowerCase().replace(/\s+/g, '_'),
  password: user.password || '1234',
  role: roleMeta[user.role] ? user.role : 'viewer'
}));

services = services.map(service => {
  const normalized = { notes: '', schedule: 'monthly', intervalDays: 30, plannedAmount: 0, currency: 'UAH', exchangeRate: 1, vat: 0, reminders: '30,14,7,3,1', tags: '', archived: false, ...service };
  normalized.type = normalizeCategory(normalized.type);
  normalized.keys = normalizeKeys(normalized);
  normalized.identifier = normalized.identifier || normalized.keys.map(key => key.value).filter(Boolean).join(', ');
  return normalized;
});
let currentUser = users.find(user => user.username === localStorage.getItem(SESSION_KEY)) || null;
let selectedServiceCategory = '';
let selectedServiceProvider = '';

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(LIMITS_KEY, JSON.stringify(categoryLimits));
  localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
  if (currentUser) localStorage.setItem(SESSION_KEY, currentUser.username);
  else localStorage.removeItem(SESSION_KEY);
}

function can(permission) {
  return Boolean(currentUser && roleMeta[currentUser.role]?.permissions.includes(permission));
}

function requirePermission(permission) {
  if (can(permission)) return true;
  toast('Недостатньо прав для цієї дії');
  return false;
}

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 1800);
}

function daysLeft(date) {
  if (!date) return null;
  return Math.ceil((parseDate(date) - today()) / 86400000);
}

function statusOf(date) {
  const days = daysLeft(date);
  if (days === null) return ['empty', 'Без дати', 'Немає дати оплати'];
  if (days < 0) return ['overdue', `${Math.abs(days)} дн.`, `Прострочено на ${Math.abs(days)} дн.`, 'grade-overdue'];
  if (days <= 3) return ['danger', `${days} дн.`, 'Дедлайн поруч', 'grade-red'];
  if (days <= 7) return ['warning', `${days} дн.`, 'Скоро платити'];
  if (days <= 14) return ['soon', `${days} дн.`, 'На контролі'];
  return ['ok', `${days} дн.`, 'Все ок'];
}

function canViewSecrets() {
  return ['superadmin', 'admin'].includes(currentUser?.role);
}

function keyRowsFromIdentifier(value, expiresAt = '') {
  return String(value || '')
    .split(/[,;\n]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => ({ value: item, expiresAt }));
}

function normalizeKeys(service) {
  const keys = Array.isArray(service.keys) ? service.keys : keyRowsFromIdentifier(service.identifier);
  return keys
    .map(key => ({
      value: String(key?.value || '').trim(),
      expiresAt: String(key?.expiresAt || '').trim()
    }))
    .filter(key => key.value || key.expiresAt);
}

function keyStatus(expiresAt) {
  const days = daysLeft(expiresAt);
  if (days === null) return ['empty', 'Без терміну дії'];
  if (days < 0) return ['overdue', `Ключ прострочено на ${Math.abs(days)} дн.`];
  if (days <= 14) return ['warning', `Ключ закінчується через ${days} дн.`];
  return ['ok', `Ключ дійсний ще ${days} дн.`];
}

function statusDot(status, hint) {
  return `<span class="status-dot ${status}" data-tooltip="${esc(hint)}" aria-label="${esc(hint)}"></span>`;
}

function serviceStatusText(date) {
  const days = daysLeft(date);
  if (days === null) return 'Без дати';
  if (days < 0) return 'Прострочено';
  if (days === 0) return 'Сьогодні';
  return `Через ${days} дн.`;
}

function compactStatus(status, text, hint) {
  return `<span class="status-compact ${status}" data-tooltip="${esc(hint || text)}"><i></i><span>${esc(text)}</span></span>`;
}

function scheduleLabel(service) {
  return {
    monthly: 'Щомісячно',
    bimonthly: 'Раз у два місяці',
    quarterly: 'Щоквартально',
    semiannual: 'Раз у шість місяців',
    yearly: 'Щорічно',
    weeks: `Кожні ${service.intervalDays || 1} тижнів`,
    days: `Кожні ${service.intervalDays || 30} днів`,
    lastDay: 'Останній день місяця',
    firstMonday: 'Перший понеділок',
    once: 'Разово',
    custom: `Правило повторення ${service.cronRule || ''}`.trim(),
    manual: 'Вручну'
  }[service.schedule] || '—';
}

function addMonthsSafe(date, months) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

function nextBySchedule(service, from = service.paidUntil) {
  const base = parseDate(from) || today();
  if (service.schedule === 'monthly') return iso(addMonthsSafe(base, 1));
  if (service.schedule === 'bimonthly') return iso(addMonthsSafe(base, 2));
  if (service.schedule === 'quarterly') return iso(addMonthsSafe(base, 3));
  if (service.schedule === 'semiannual') return iso(addMonthsSafe(base, 6));
  if (service.schedule === 'yearly') return iso(addMonthsSafe(base, 12));
  if (service.schedule === 'weeks') {
    const next = new Date(base);
    next.setDate(next.getDate() + Number(service.intervalDays || 1) * 7);
    return iso(next);
  }
  if (service.schedule === 'days') {
    const next = new Date(base);
    next.setDate(next.getDate() + Number(service.intervalDays || 30));
    return iso(next);
  }
  if (service.schedule === 'lastDay') {
    const next = addMonthsSafe(base, 1);
    return iso(new Date(next.getFullYear(), next.getMonth() + 1, 0));
  }
  if (service.schedule === 'firstMonday') {
    const next = addMonthsSafe(base, 1);
    const first = new Date(next.getFullYear(), next.getMonth(), 1);
    const shift = (8 - first.getDay()) % 7;
    first.setDate(first.getDate() + shift);
    return iso(first);
  }
  if (service.schedule === 'once') return from || iso(today());
  return from || iso(today());
}

function serviceAmount(service) {
  if (Number(service.plannedAmount) > 0) return Number(service.plannedAmount);
  const last = [...history].reverse().find(item => item.serviceId === service.id && Number(item.amount) > 0);
  return last ? Number(last.amount) : 0;
}

function isDueWithin(service, days) {
  const left = daysLeft(service.paidUntil);
  return left !== null && left <= days;
}

function forecastByCategory(days = 30) {
  const due = services.filter(service => isDueWithin(service, days));
  const grouped = groupBy(due, service => service.type || 'Інше');
  return sortCategories(Object.entries(grouped)).map(([category, items]) => ({
    category,
    total: items.reduce((sum, service) => sum + serviceAmount(service), 0),
    count: items.length,
    limit: Number(categoryLimits[category] || 0)
  }));
}

function filtered() {
  const query = $('searchInput').value.toLowerCase().trim();
  const statusFilter = $('statusFilter').value;
  const typeFilter = $('typeFilter').value;
  const ownerFilter = $('ownerFilter')?.value || 'all';
  const sortMode = $('sortMode').value;
  const list = services
    .filter(service => !service.archived)
    .filter(service => [service.owner, service.name, service.type, service.provider, service.identifier, service.notes, ...normalizeKeys(service).map(key => key.value)].join(' ').toLowerCase().includes(query))
    .filter(service => statusFilter === 'all' || statusOf(service.paidUntil)[0] === statusFilter)
    .filter(service => typeFilter === 'all' || service.type === typeFilter)
    .filter(service => ownerFilter === 'all' || [service.pm, service.accountant, service.manager, service.owner].includes(ownerFilter));

  if (sortMode === 'ownerAsc') list.sort((a, b) => a.owner.localeCompare(b.owner, 'uk'));
  else if (sortMode === 'typeAsc') list.sort((a, b) => a.type.localeCompare(b.type, 'uk'));
  else list.sort((a, b) => (parseDate(a.paidUntil)?.getTime() ?? Infinity) - (parseDate(b.paidUntil)?.getTime() ?? Infinity));
  return list;
}

function refreshDynamicFilters() {
  const people = [...new Set(services.flatMap(service => [service.pm, service.accountant, service.manager, service.owner]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'));
  const current = $('ownerFilter')?.value || 'all';
  if ($('ownerFilter')) {
    $('ownerFilter').innerHTML = '<option value="all">Усі відповідальні</option>' + people.map(person => `<option ${person === current ? 'selected' : ''}>${esc(person)}</option>`).join('');
  }
  const bulk = $('bulkResponsible');
  if (bulk) bulk.innerHTML = '<option value="">Оновити відповідального</option>' + people.map(person => `<option>${esc(person)}</option>`).join('');
}

function renderStats(list = filtered()) {
  const count = { all: list.length, overdue: 0, danger: 0, warning: 0, soon: 0, ok: 0, empty: 0 };
  list.forEach(service => count[statusOf(service.paidUntil)[0]]++);
  const weekDue = list.filter(service => {
    const left = daysLeft(service.paidUntil);
    return left !== null && left >= 0 && left <= 7;
  }).length;
  const month = today().getMonth();
  const year = today().getFullYear();
  const planMonth = list.filter(service => {
    const date = parseDate(service.paidUntil);
    return date && date.getMonth() === month && date.getFullYear() === year;
  }).reduce((sum, service) => sum + serviceAmount(service), 0);
  const paidMonth = history.filter(item => {
    const date = new Date(item.createdAt);
    return date.getMonth() === month && date.getFullYear() === year;
  }).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const health = count.all ? Math.max(0, Math.round(((count.ok + count.soon) / count.all) * 100)) : 100;
  $('healthRing')?.style.setProperty('--health', health);
  if ($('healthValue')) $('healthValue').textContent = `${health}%`;
  if ($('healthText')) $('healthText').textContent = count.overdue + count.danger
    ? `Є ${count.overdue + count.danger} оплат, які потребують уваги цього тижня. Решта сервісів під контролем.`
    : 'Більшість сервісів оплачуються вчасно. Критичних оплат зараз немає.';
  $('sidebarHot').textContent = count.overdue + count.danger + count.empty;
  $('stats').innerHTML = [
    ['⌘', 'Активні сервіси', count.all, '+3 цього місяця', 'all'],
    ['◷', 'Оплати цього тижня', weekDue, `${weekDue} сервісів`, 'warning'],
    ['!', 'Прострочено', count.overdue, 'Потребують уваги', 'overdue'],
    ['₴', 'План витрат місяця', money(planMonth), `${list.length} сервісів`, 'soon'],
    ['✓', 'Вже оплачено', money(paidMonth), `${history.length} записів`, 'ok']
  ].map(([icon, label, value, description, cls]) => `<button class="stat ${cls}" onclick="quickStatus('${cls}')"><i>${icon}</i><b>${value}</b><span>${label}</span><small>${description}</small></button>`).join('');
}

function renderInsights() {
  if (!$('insightsPanel')) return;
  const forecast = forecastByCategory(30);
  const forecastTotal = forecast.reduce((sum, item) => sum + item.total, 0);
  const overLimit = forecast.filter(item => item.limit > 0 && item.total > item.limit);
  const due7 = services.filter(service => isDueWithin(service, 7)).length;
  const noAmount = services.filter(service => !serviceAmount(service)).length;
  const topCategory = [...forecast].sort((a, b) => b.total - a.total)[0];

  $('insightsPanel').innerHTML = [
    `<article class="insight-card">
      <span>Прогноз 30 днів</span>
      <b>${money(forecastTotal)}</b>
      <small>${forecast.reduce((sum, item) => sum + item.count, 0)} майбутніх оплат</small>
    </article>`,
    `<article class="insight-card ${due7 ? 'warn' : 'ok'}">
      <span>Нагадування</span>
      <b>${due7}</b>
      <small>оплат до 7 днів або вже прострочені</small>
    </article>`,
    `<article class="insight-card ${overLimit.length ? 'warn' : 'ok'}">
      <span>Ліміти</span>
      <b>${overLimit.length}</b>
      <small>категорій вище плану</small>
    </article>`,
    `<article class="insight-card">
      <span>Найбільша категорія</span>
      <b>${topCategory ? esc(topCategory.category) : '—'}</b>
      <small>${topCategory ? money(topCategory.total) : 'немає сум'}</small>
    </article>`,
    `<article class="insight-card ${noAmount ? 'warn' : 'ok'}">
      <span>Без планової суми</span>
      <b>${noAmount}</b>
      <small>сервісів варто доповнити</small>
    </article>`
  ].join('');
}

window.quickStatus = cls => {
  $('statusFilter').value = cls === 'all' ? 'all' : cls;
  render();
};

function serviceLine(service) {
  const [status, label, hint] = statusOf(service.paidUntil);
  const addButton = can('write') ? `<button class="btn ghost small" onclick="openPayment('${service.id}')">Оновити</button>` : '';
  return `<div class="service-line">
    <div><span class="service-name">${esc(service.name)}</span><span class="sub">${esc(service.owner)} · ${esc(service.provider || '—')} · ${money(serviceAmount(service))}</span></div>
    <span class="type-pill">${esc(service.type)}</span>
    <span><b>${fmt(service.paidUntil)}</b><span class="sub">${esc(scheduleLabel(service))}</span></span>
    ${status === 'overdue' ? statusDot(status, hint) : `<span class="badge ${status}" title="${esc(hint)}">${esc(label)}</span>`}
    ${addButton}
  </div>`;
}

function compactIdentifier(value) {
  const parts = String(value || '').split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length <= 2) return parts.join(', ');
  return `${parts.slice(0, 2).join(', ')} +${parts.length - 2}`;
}

function compactKeys(service) {
  const values = normalizeKeys(service).map(key => key.value).filter(Boolean);
  return compactIdentifier(values.join(', ') || service.identifier);
}

function daysLabel(date) {
  const days = daysLeft(date);
  if (days === null) return 'Без дати';
  const unit = Math.abs(days) === 1 ? 'день' : 'дн.';
  if (days < 0) return `прострочено ${Math.abs(days)} ${unit}`;
  if (days === 0) return 'сьогодні';
  return `${days} ${unit}`;
}

function dueStatusControl(date) {
  const [status, , hint] = statusOf(date);
  return compactStatus(status, serviceStatusText(date), hint);
}

function renderServiceKeys(service) {
  const keys = normalizeKeys(service);
  if (!keys.length) return empty('Ключі для цього сервісу не додані.', 'Інформація порожня');
  return `<div class="service-key-list">
    ${keys.map(key => {
      const [status, hint] = keyStatus(key.expiresAt);
      return `<div class="service-key-row">
        <span><b>${esc(key.value || '—')}</b><small>Ключ</small></span>
        <span><b>${fmt(key.expiresAt)}</b><small>Термін дії</small></span>
        ${statusDot(status, hint)}
      </div>`;
    }).join('')}
  </div>`;
}

function providerName(service) {
  return String(service.provider || service.name || 'Без провайдера').trim();
}

function selectedResponsible(service) {
  return service.pm || service.accountant || service.manager || service.owner || 'Не призначено';
}

function nearestDate(items) {
  return [...items].filter(item => item.paidUntil).sort((a, b) => parseDate(a.paidUntil) - parseDate(b.paidUntil))[0]?.paidUntil || '';
}

function providerHealth(items) {
  const bad = items.filter(item => ['overdue', 'danger'].includes(statusOf(item.paidUntil)[0])).length;
  if (!items.length) return 100;
  return Math.max(0, Math.round((items.length - bad) / items.length * 100));
}

function serviceDocsCount(service) {
  return history.filter(item => item.serviceId === service.id && (item.bpLink || item.docLink || item.contractLink)).length;
}

function paymentHistoryCount(service) {
  return history.filter(item => item.serviceId === service.id).length;
}

function sortCategories(entries) {
  return entries.sort(([a], [b]) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b, 'uk');
  });
}

function renderOverview() {
  const list = filtered();
  renderStats(list);
  const upcoming = [...list].filter(service => service.paidUntil).sort((a, b) => parseDate(a.paidUntil) - parseDate(b.paidUntil)).slice(0, 7);
  $('overviewGroups').innerHTML = upcoming.map(service => {
    const [status, label] = statusOf(service.paidUntil);
    const left = daysLeft(service.paidUntil);
    return `<article class="payment-row-card" onclick="openServiceDetail('${service.id}')">
      <div class="service-avatar">${esc(service.name).slice(0, 1).toUpperCase()}</div>
      <div><h3>${esc(service.name)}</h3><span>${esc(service.type)} · ${esc(service.provider || service.owner)}</span></div>
      <div class="payment-date"><b>${left < 0 ? 'прострочено' : `через ${left} дн.`}</b><span>${fmt(service.paidUntil)}</span></div>
      <span class="badge ${status}">${label}</span>
    </article>`;
  }).join('') || empty('Нічого не знайдено');

  const activeServices = services.filter(service => !service.archived);
  const hot = activeServices
    .filter(service => ['overdue', 'danger', 'warning', 'soon', 'empty'].includes(statusOf(service.paidUntil)[0]))
    .sort((a, b) => (parseDate(a.paidUntil)?.getTime() ?? -Infinity) - (parseDate(b.paidUntil)?.getTime() ?? -Infinity))
    .slice(0, 8);

  $('priorityList').innerHTML = hot.map(service => {
    const [status, label] = statusOf(service.paidUntil);
    return `<div class="priority-item"><div><strong>${esc(service.name)}</strong><span class="sub">${esc(service.type)} · ${esc(service.owner)}</span></div><span class="badge ${status}">${label}</span></div>`;
  }).join('') || empty('Термінових оплат немає.');
  renderTodayAndCalendar(activeServices);
}

function renderTodayAndCalendar(list) {
  const dueToday = list.filter(service => daysLeft(service.paidUntil) !== null && daysLeft(service.paidUntil) <= 0).slice(0, 6);
  $('todayList').innerHTML = dueToday.map(service => `<label class="todo-item"><input type="checkbox" onchange="openPayment('${service.id}')" /> <span>${esc(service.name)}</span><small>${esc(service.type)}</small></label>`).join('') || empty('На сьогодні задач немає.');
  const upcoming = [...list].filter(service => service.paidUntil).sort((a, b) => parseDate(a.paidUntil) - parseDate(b.paidUntil)).slice(0, 6);
  $('miniCalendar').innerHTML = upcoming.map(service => {
    const [status] = statusOf(service.paidUntil);
    return `<div class="priority-item"><div><strong>${fmt(service.paidUntil)}</strong><span class="sub">${esc(service.name)}</span></div><span class="badge ${status}">${esc(service.type)}</span></div>`;
  }).join('') || empty('Календар порожній.');
}

function serviceRow(service) {
  const [status, , hint] = statusOf(service.paidUntil);
  const actions = [
    `<button class="chip-btn action-view" title="Картка" aria-label="Картка" onclick="openServiceDetail('${service.id}')">Картка</button>`,
    can('write') ? `<button class="chip-btn primary-chip action-pay" title="Оплата" aria-label="Оплата" onclick="openPayment('${service.id}')">Оплата</button>` : '',
    can('write') ? `<button class="chip-btn action-edit" title="Редагувати" aria-label="Редагувати" onclick="openEdit('${service.id}')">Ред.</button>` : '',
    can('delete') ? `<button class="chip-btn delete action-archive" title="Архів" aria-label="Архів" onclick="archiveService('${service.id}')">Архів</button>` : ''
  ].filter(Boolean).join('');
  return `<div class="table-row ${status}">
    <div class="service-cell"><input type="checkbox" class="service-check" value="${service.id}" /><span class="service-avatar mini">${esc(service.name).slice(0, 1).toUpperCase()}</span><span class="service-title"><b>${esc(service.name)}</b><span class="sub">${esc(service.owner)}</span></span></div>
    <div><span class="type-pill">${esc(service.type)}</span></div>
    <div>${esc(service.provider || '—')}</div>
    <div title="${esc(normalizeKeys(service).map(key => key.value).join(', ') || service.identifier || '')}">${esc(compactKeys(service))}</div>
    <div class="date-cell"><b>${fmt(service.paidUntil)}</b><span class="sub">${scheduleLabel(service)} · ${money(serviceAmount(service))}</span></div>
    <div class="status-cell">${dueStatusControl(service.paidUntil)}</div>
    <div class="table-actions">${actions || '<span class="readonly-label">Тільки перегляд</span>'}<button class="chip-btn context-btn" title="Ще" aria-label="Ще" onclick="openServiceDetail('${service.id}')">•••</button></div>
  </div>`;
}

function renderServices() {
  const rows = filtered();
  if (!rows.length) {
    $('serviceTable').innerHTML = empty('Змініть фільтри або додайте новий сервіс.', 'Сервіси не знайдені', can('write') ? '<button class="btn primary small" onclick="openAdd()">Додати сервіс</button>' : '');
    return;
  }

  const categories = sortCategories(Object.entries(groupBy(rows, service => service.type || 'Інше'))).map(([category, items]) => ({
    category,
    items,
    providers: Object.entries(groupBy(items, providerName)).map(([provider, providerItems]) => ({ provider, items: providerItems }))
  }));

  if (!selectedServiceCategory || !categories.some(item => item.category === selectedServiceCategory)) {
    selectedServiceCategory = categories[0].category;
  }
  const selectedCategory = categories.find(item => item.category === selectedServiceCategory) || categories[0];
  if (!selectedServiceProvider || !selectedCategory.providers.some(item => item.provider === selectedServiceProvider)) {
    selectedServiceProvider = selectedCategory.providers[0]?.provider || '';
  }
  const selectedProvider = selectedCategory.providers.find(item => item.provider === selectedServiceProvider) || selectedCategory.providers[0];
  const providerItems = selectedProvider?.items || [];
  const providerTotal = providerItems.reduce((sum, service) => sum + serviceAmount(service), 0);
  const providerOverdue = providerItems.filter(service => statusOf(service.paidUntil)[0] === 'overdue').length;
  const providerNearest = nearestDate(providerItems);
  const providerHealthScore = providerHealth(providerItems);

  $('serviceTable').innerHTML = `<div class="services-hierarchy">
    <div class="services-toolbar">
      <div>
        <p class="eyebrow">Категорії → провайдери → точки / ФОПи → оплати</p>
        <h3>Сервіси / ${esc(selectedCategory.category)}${selectedProvider ? ` / ${esc(selectedProvider.provider)}` : ''}</h3>
      </div>
      <div class="hierarchy-summary">
        <span>${rows.length} сервісів</span>
        <span>${categories.length} категорій</span>
        <span>${money(rows.reduce((sum, service) => sum + serviceAmount(service), 0))} / міс</span>
      </div>
    </div>
    <div class="services-master-detail">
      <aside class="category-column">
        ${categories.map(group => {
          const overdue = group.items.filter(service => statusOf(service.paidUntil)[0] === 'overdue').length;
          const soon = group.items.filter(service => ['danger', 'warning', 'soon'].includes(statusOf(service.paidUntil)[0])).length;
          const total = group.items.reduce((sum, service) => sum + serviceAmount(service), 0);
          const health = providerHealth(group.items);
          const status = overdue ? 'overdue' : soon ? 'warning' : 'ok';
          const statusText = overdue ? 'Прострочено' : soon ? 'Скоро оплата' : 'Під контролем';
          const statusHint = overdue ? `${overdue} прострочених точок` : soon ? `${soon} оплат наближається` : 'Критичних оплат немає';
          return `<button class="category-card ${group.category === selectedServiceCategory ? 'selected' : ''}" onclick="selectServiceCategory(${jsArg(group.category)})">
            <span class="category-title">${esc(group.category)}</span>
            <b>${group.items.length} точок</b>
            ${compactStatus(status, statusText, statusHint)}
            <strong>${money(total)} / міс</strong>
            <i style="--health:${health}%"></i>
          </button>`;
        }).join('')}
      </aside>
      <aside class="provider-column">
        ${selectedCategory.providers.map(group => {
          const overdue = group.items.filter(service => statusOf(service.paidUntil)[0] === 'overdue').length;
          const total = group.items.reduce((sum, service) => sum + serviceAmount(service), 0);
          const nearest = nearestDate(group.items);
          const status = overdue ? 'overdue' : group.items.some(service => ['danger', 'warning', 'soon'].includes(statusOf(service.paidUntil)[0])) ? 'warning' : 'ok';
          const statusText = overdue ? 'Прострочено' : serviceStatusText(nearest);
          const statusHint = overdue ? `${overdue} прострочених точок` : statusOf(nearest)[2];
          return `<button class="provider-card ${group.provider === selectedServiceProvider ? 'selected' : ''}" onclick="selectServiceProvider(${jsArg(group.provider)})">
            <span class="service-avatar mini">${esc(group.provider).slice(0, 1).toUpperCase()}</span>
            <span><b>${esc(group.provider)}</b><small>${group.items.length} точок</small></span>
            ${compactStatus(status, statusText, statusHint)}
            <strong>${money(total)} / міс</strong>
          </button>`;
        }).join('') || empty('У цій категорії немає провайдерів.', 'Провайдерів не знайдено')}
      </aside>
      <section class="provider-detail">
        ${selectedProvider ? `<div class="provider-detail-head">
          <div>
            <p class="eyebrow">Сервіси / ${esc(selectedCategory.category)} / ${esc(selectedProvider.provider)}</p>
            <h3>${esc(selectedProvider.provider)}</h3>
            <p>${providerItems.length} точок · ${providerOverdue} прострочено · ${money(providerTotal)} / міс</p>
          </div>
          <div class="provider-kpis">
            <span><b>${providerItems.length}</b><small>точок</small></span>
            <span><b>${providerOverdue}</b><small>прострочено</small></span>
            <span><b>${providerHealthScore}%</b><small>health</small></span>
          </div>
        </div>
        <div class="provider-tabs"><span class="active">Точки / ФОПи</span><span>Оплати</span><span>Документи</span><span>Історія</span><span>Налаштування</span></div>
        <div class="point-list">
          ${providerItems.map(service => {
            const [status, , hint] = statusOf(service.paidUntil);
            return `<article class="point-card ${status}" onclick="openServiceDetail('${service.id}')">
              <div class="point-main">
                <input type="checkbox" class="service-check" onclick="event.stopPropagation()" value="${service.id}" />
                <span class="service-avatar mini">${esc(service.name).slice(0, 1).toUpperCase()}</span>
                <span><b>${esc(service.owner || service.name)}</b><small>${esc(service.name)} · ${esc(service.type)}</small></span>
              </div>
              <div class="point-payment">
                <span><small>Ключі</small><b title="${esc(normalizeKeys(service).map(key => key.value).join(', ') || service.identifier || '')}">${esc(compactKeys(service))}</b></span>
                <span><small>Графік</small><b>${esc(scheduleLabel(service))}</b></span>
                <span><small>Сума</small><b>${money(serviceAmount(service))}</b></span>
                <span><small>Наступна</small><b>${fmt(service.paidUntil)}</b></span>
              </div>
              <div class="point-side">
                ${dueStatusControl(service.paidUntil)}
                <small>${esc(selectedResponsible(service))}</small>
                <small>${serviceDocsCount(service)} док. · ${paymentHistoryCount(service)} оплат</small>
              </div>
              <div class="point-actions" onclick="event.stopPropagation()">
                <button class="chip-btn action-view" title="Перегляд" aria-label="Перегляд" onclick="openServiceDetail('${service.id}')">Перегляд</button>
                ${can('write') ? `<button class="chip-btn action-edit" title="Редагувати" aria-label="Редагувати" onclick="openEdit('${service.id}')">Редагувати</button>` : ''}
                ${can('delete') ? `<button class="chip-btn delete action-archive" title="Архів" aria-label="Архів" onclick="archiveService('${service.id}')">Архів</button>` : ''}
                ${can('write') ? `<button class="chip-btn primary-chip action-pay" title="Оплата" aria-label="Оплата" onclick="openPayment('${service.id}')">Оплата</button>` : ''}
                <button class="chip-btn action-docs" title="Документи" aria-label="Документи" onclick="showPage('documents')">Документи</button>
                <button class="chip-btn action-history" title="Історія" aria-label="Історія" onclick="showPage('history')">Історія</button>
                <button class="chip-btn context-btn" title="Ще" aria-label="Ще" onclick="openServiceDetail('${service.id}')">•••</button>
              </div>
            </article>`;
          }).join('')}
        </div>` : empty('Оберіть провайдера, щоб побачити точки / ФОПи та оплати.', 'Провайдер не обрано')}
      </section>
    </div>
  </div>`;
}

window.selectServiceCategory = category => {
  selectedServiceCategory = category;
  selectedServiceProvider = '';
  renderServices();
};

window.selectServiceProvider = provider => {
  selectedServiceProvider = provider;
  renderServices();
};

function renderAttention() {
  const hot = services
    .filter(service => ['overdue', 'danger', 'warning', 'soon', 'empty'].includes(statusOf(service.paidUntil)[0]))
    .sort((a, b) => (parseDate(a.paidUntil)?.getTime() ?? -Infinity) - (parseDate(b.paidUntil)?.getTime() ?? -Infinity));

  $('attentionList').innerHTML = hot.map(service => {
    const [status, label, hint] = statusOf(service.paidUntil);
    const button = can('write') ? `<button class="btn primary small" onclick="openPayment('${service.id}')">Оновити дані</button>` : '';
    return `<article class="attention-card ${status}">
      <div><b>${esc(service.type)} · ${esc(service.owner)}</b><h3>${esc(service.name)}</h3><p>${esc(service.provider || '—')} · ${esc(scheduleLabel(service))}</p></div>
      <div class="attention-date"><span class="badge ${status}">${hint}: ${label}</span><b>${fmt(service.paidUntil)}</b>${button}</div>
    </article>`;
  }).join('') || empty('Термінових оплат немає.');
}

function renderCalendar() {
  const list = [...services].sort((a, b) => (parseDate(a.paidUntil)?.getTime() ?? Infinity) - (parseDate(b.paidUntil)?.getTime() ?? Infinity));
  const grouped = groupBy(list, service => service.paidUntil ? parseDate(service.paidUntil).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }) : 'Без дати');
  $('calendarList').innerHTML = Object.entries(grouped).map(([month, items]) => `<article class="month-card"><h3>${esc(month)}</h3>${items.map(service => {
    const [status, label] = statusOf(service.paidUntil);
    return `<div class="calendar-row"><b>${fmt(service.paidUntil)}</b><span>${esc(service.type)} · ${esc(service.owner)} · ${esc(service.name)}<small class="sub">${esc(service.provider || '—')}</small></span><span class="badge ${status}">${label}</span></div>`;
  }).join('')}</article>`).join('');
}

function renderHistory() {
  const query = ($('historySearch')?.value || '').toLowerCase().trim();
  const list = history
    .filter(item => [item.owner, item.serviceName, item.author, item.bpLink, item.comment, item.amount].join(' ').toLowerCase().includes(query))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const grouped = groupBy(list, item => item.owner || 'Без власника');

  $('historyList').innerHTML = Object.entries(grouped).map(([owner, items]) => `<section class="history-group">
    <h3>${esc(owner)}</h3>
    ${Object.entries(groupBy(items, item => item.serviceName || 'Без сервісу')).map(([serviceName, rows]) => `<div class="history-service">
      <b>${esc(serviceName)}</b>
      ${rows.map(item => `<div class="history-item">
        <span><b>${fmt(item.newPaidUntil)}</b><small>було: ${fmt(item.oldPaidUntil)}</small></span>
        <span>${esc(item.comment || 'Без коментаря')}</span>
        <span>${esc(item.author || '—')}<small>${new Date(item.createdAt).toLocaleString('uk-UA')}</small></span>
        <span>${money(item.amount)}</span>
        <span>${item.bpLink ? `<a href="${esc(item.bpLink)}" target="_blank" rel="noreferrer">BP link</a>` : '—'}</span>
      </div>`).join('')}
    </div>`).join('')}
  </section>`).join('') || empty('Історія поки порожня.');
}

function renderTimeline() {
  const paymentEvents = history.map(item => ({ ...item, kind: 'payment', title: item.serviceName, date: item.createdAt, user: item.author, detail: `${money(item.amount)} · ${item.bpLink ? 'BP link' : 'без BP'}` }));
  const auditEvents = audit.map(item => ({ ...item, kind: 'audit', title: item.serviceName, date: item.createdAt, user: item.user, detail: `${item.action}: ${item.before || '—'} → ${item.after || '—'}` }));
  const rows = [...paymentEvents, ...auditEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
  const grouped = groupBy(rows, item => new Date(item.date).getFullYear());
  $('timelineList').innerHTML = Object.entries(grouped).sort((a, b) => b[0] - a[0]).map(([year, items]) => `<section class="history-group">
    <h3>${year}</h3>
    ${items.map(item => `<div class="history-item">
      <span><b>${fmt(item.newPaidUntil)}</b><small>${new Date(item.createdAt).toLocaleString('uk-UA')}</small></span>
      <span>${esc(item.serviceName)}<small>${esc(item.owner)}</small></span>
      <span>${esc(item.author || '—')}</span>
      <span>${money(item.amount)}</span>
      <span>${item.bpLink ? `<a href="${esc(item.bpLink)}" target="_blank" rel="noreferrer">BP</a>` : '—'}</span>
    </div>`).join('')}
  </section>`).join('') || empty('Timeline поки порожній.');
}

function renderArchive() {
  const rows = services.filter(service => service.archived);
  $('archiveList').innerHTML = rows.map(service => `<article class="attention-card empty">
    <div><b>${esc(service.type)} · ${esc(service.owner)}</b><h3>${esc(service.name)}</h3><p>${esc(service.provider || '—')}</p></div>
    <div class="attention-date"><span class="badge empty">Архів</span>${can('delete') ? `<button class="btn soft small" onclick="restoreService('${service.id}')">Повернути</button>` : ''}</div>
  </article>`).join('') || empty('Архів порожній.');
}

function renderUsers() {
  $('usersList').innerHTML = users.map(user => {
    const isCurrent = currentUser?.id === user.id;
    const roleSelect = can('manageUsers')
      ? `<select class="inline-role" onchange="updateUserRole('${user.id}', this.value)" ${isCurrent ? 'disabled title="Не змінюйте власну роль під час активної сесії"' : ''}>
          ${Object.entries(roleMeta).map(([role, meta]) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${meta.label}</option>`).join('')}
        </select>`
      : `<span>${roleMeta[user.role]?.label || user.role}</span>`;
    const deleteButton = can('manageUsers') && !isCurrent ? `<button class="chip-btn delete" onclick="deleteUser('${user.id}')">Видалити</button>` : '<span class="readonly-label">Активний / захищений</span>';
    return `<div class="user-row">
      <div><b>${esc(user.name)}</b><span>@${esc(user.username)}</span></div>
      <div class="user-role-cell">${roleSelect}</div>
      ${deleteButton}
    </div>`;
  }).join('');
}

window.openServiceDetail = id => {
  const service = services.find(item => item.id === id);
  if (!service) return;
  $('detailTitle').textContent = service.name;
  const serviceHistory = history.filter(item => item.serviceId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const serviceAudit = audit.filter(item => item.serviceId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  $('serviceDetailContent').innerHTML = `<div class="detail-grid">
    <section class="detail-panel"><p class="eyebrow">Основна інформація</p>
      <dl><dt>Провайдер</dt><dd>${esc(service.provider || '—')}</dd><dt>Кабінет</dt><dd>${service.cabinetLink ? `<a href="${esc(service.cabinetLink)}" target="_blank">відкрити</a>` : '—'}</dd><dt>Логін</dt><dd>${esc(service.serviceLogin || '—')}</dd><dt>Контакт</dt><dd>${esc(service.contact || '—')}</dd><dt>Категорія</dt><dd>${esc(service.type)}</dd><dt>Опис</dt><dd>${esc(service.description || service.notes || '—')}</dd></dl>
    </section>
    <section class="detail-panel"><p class="eyebrow">Інформація про сервіс</p>
      ${renderServiceKeys(service)}
    </section>
    <section class="detail-panel"><p class="eyebrow">Фінанси</p>
      <dl><dt>Сума</dt><dd>${money(service.plannedAmount)}</dd><dt>Валюта</dt><dd>${esc(service.currency || 'UAH')}</dd><dt>Курс</dt><dd>${esc(service.exchangeRate || 1)}</dd><dt>Вартість у грн</dt><dd>${money(serviceAmount(service) * Number(service.exchangeRate || 1))}</dd><dt>ПДВ</dt><dd>${esc(service.vat || 0)}%</dd></dl>
    </section>
    <section class="detail-panel"><p class="eyebrow">Графік і дати</p>
      <dl><dt>Графік</dt><dd>${esc(scheduleLabel(service))}</dd><dt>Остання оплата</dt><dd>${fmt(service.lastPaidAt || service.paidUntil)}</dd><dt>Наступна</dt><dd>${fmt(service.paidUntil)}</dd><dt>Авто-розрахунок</dt><dd>${fmt(nextBySchedule(service))}</dd><dt>Нагадування</dt><dd>${esc(service.reminders || '30,14,7,3,1')}</dd></dl>
    </section>
    <section class="detail-panel"><p class="eyebrow">Відповідальні</p>
      <dl><dt>PM</dt><dd>${esc(service.pm || '—')}</dd><dt>Бухгалтер</dt><dd>${esc(service.accountant || '—')}</dd><dt>Керівник</dt><dd>${esc(service.manager || '—')}</dd><dt>Теги</dt><dd>${esc(service.tags || '—')}</dd></dl>
    </section>
  </div>
  <section class="detail-panel"><p class="eyebrow">Історія оплат</p>${serviceHistory.map(item => `<div class="history-item"><span><b>${fmt(item.newPaidUntil)}</b><small>було: ${fmt(item.oldPaidUntil)}</small></span><span>${money(item.amount)}<small>${esc(item.comment || '')}</small></span><span>${esc(item.author || '—')}</span><span>${item.bpLink ? `<a href="${esc(item.bpLink)}" target="_blank">BP</a>` : '—'}</span><span>${item.docLink ? `<a href="${esc(item.docLink)}" target="_blank">PDF</a>` : '—'}</span></div>`).join('') || empty('Оплат ще немає.')}</section>
  <section class="detail-panel"><p class="eyebrow">Audit</p>${serviceAudit.map(item => `<div class="audit-row"><b>${new Date(item.createdAt).toLocaleString('uk-UA')}</b><span>${esc(item.user)} · ${esc(item.action)}</span><small>${esc(item.before)} → ${esc(item.after)}</small></div>`).join('') || empty('Змін ще немає.')}</section>`;
  $('serviceDetailDialog').showModal();
};

function renderLimits() {
  const forecast = forecastByCategory(30);
  const known = new Map(forecast.map(item => [item.category, item]));
  $('limitsList').innerHTML = categoryOrder.map(category => {
    const item = known.get(category) || { category, total: 0, count: 0, limit: Number(categoryLimits[category] || 0) };
    const percent = item.limit > 0 ? Math.min(100, Math.round(item.total / item.limit * 100)) : 0;
    const state = item.limit > 0 && item.total > item.limit ? 'over' : percent >= 80 ? 'near' : 'ok';
    return `<div class="limit-row ${state}">
      <div>
        <b>${esc(category)}</b>
        <span>${item.count} оплат · ${money(item.total)} з ${item.limit ? money(item.limit) : 'без ліміту'}</span>
      </div>
      <div class="limit-progress"><i style="width:${percent}%"></i></div>
    </div>`;
  }).join('');
}

function empty(text, title = 'Немає даних', action = '') {
  return `<div class="empty-state premium-empty">
    <div class="empty-orb">+</div>
    <b>${esc(title)}</b>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
}

function pct(value, max) {
  return max > 0 ? Math.max(4, Math.round(value / max * 100)) : 0;
}

function monthKey(date) {
  return date.toLocaleDateString('uk-UA', { month: 'short' });
}

function renderAnalytics() {
  if (!$('analyticsContent')) return;
  const active = services.filter(service => !service.archived);
  if (!active.length) {
    $('analyticsContent').innerHTML = empty('Додайте перші сервіси та оплати, щоб побачити статистику.', 'Аналітика поки що недоступна', can('write') ? '<button class="btn primary small" onclick="openAdd()">Додати сервіс</button>' : '');
    return;
  }
  const now = today();
  const thisMonth = active.filter(service => {
    const date = parseDate(service.paidUntil);
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const plan = thisMonth.reduce((sum, service) => sum + serviceAmount(service), 0);
  const paid = history.filter(item => {
    const date = new Date(item.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overdue = active.filter(service => statusOf(service.paidUntil)[0] === 'overdue').length;
  const paidCount = history.length;
  const catRows = Object.entries(groupBy(active, service => service.type || 'Інше')).map(([category, rows]) => ({
    category,
    total: rows.reduce((sum, service) => sum + serviceAmount(service), 0),
    count: rows.length
  })).sort((a, b) => b.total - a.total);
  const catTotal = catRows.reduce((sum, item) => sum + item.total, 0) || 1;
  let cursor = 0;
  const colors = ['#6D7CFF', '#7BB7FF', '#A092C7', '#FFD7E8', '#DDF7EF', '#FFB547'];
  const donut = catRows.map((item, index) => {
    const start = cursor;
    const end = cursor + item.total / catTotal * 100;
    cursor = end;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  }).join(', ');
  const providerRows = Object.entries(groupBy(active, service => service.provider || service.owner || 'Без провайдера')).map(([provider, rows]) => ({
    provider,
    total: rows.reduce((sum, service) => sum + serviceAmount(service), 0),
    count: rows.length
  })).sort((a, b) => b.total - a.total).slice(0, 6);
  const maxProvider = Math.max(...providerRows.map(item => item.total), 1);
  const expensive = [...active].sort((a, b) => serviceAmount(b) - serviceAmount(a)).slice(0, 6);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const total = history.filter(item => {
      const paidAt = new Date(item.createdAt);
      return paidAt.getMonth() === date.getMonth() && paidAt.getFullYear() === date.getFullYear();
    }).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { label: monthKey(date), total };
  });
  const maxMonth = Math.max(...months.map(item => item.total), plan, 1);
  const forecast30 = forecastByCategory(30).reduce((sum, item) => sum + item.total, 0);
  const forecast90 = forecastByCategory(90).reduce((sum, item) => sum + item.total, 0);
  const forecast365 = forecastByCategory(365).reduce((sum, item) => sum + item.total, 0);
  const heatmap = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() + index);
    const total = active.filter(service => service.paidUntil === iso(date)).reduce((sum, service) => sum + serviceAmount(service), 0);
    const level = total ? Math.min(4, Math.ceil(total / Math.max(plan, 1) * 12)) : 0;
    return `<span class="heat-cell level-${level}" title="${date.toLocaleDateString('uk-UA')}: ${money(total)}">${date.getDate()}</span>`;
  }).join('');

  $('analyticsContent').innerHTML = `
    <article class="panel analytics-hero">
      <p class="eyebrow">Analytics</p>
      <h2>Фінансова картина сервісів</h2>
      <div class="analytics-kpis">
        <div><b>${money(plan)}</b><span>План місяця</span></div>
        <div><b>${money(paid)}</b><span>Оплачено</span></div>
        <div><b>${overdue}</b><span>Прострочено</span></div>
        <div><b>${paidCount}</b><span>Записів оплат</span></div>
      </div>
      <div class="line-chart">${months.map(item => `<span title="${esc(item.label)}: ${money(item.total)}"><i style="height:${pct(item.total, maxMonth)}%"></i><small>${esc(item.label)}</small></span>`).join('')}</div>
    </article>
    <article class="panel donut-panel">
      <p class="eyebrow">Donut chart</p>
      <h2>Витрати по категоріях</h2>
      <div class="donut-chart" style="background: conic-gradient(${donut || '#E9D9FF 0 100%'})"><span>${money(catTotal)}</span></div>
      <div class="legend-list">${catRows.slice(0, 6).map((item, index) => `<span><i class="dot" style="background:${colors[index % colors.length]}"></i>${esc(item.category)}<b>${money(item.total)}</b></span>`).join('')}</div>
    </article>
    <article class="panel"><p class="eyebrow">Bar chart</p><h2>ТОП провайдерів</h2><div class="bar-list">${providerRows.map(item => `<span title="${esc(item.provider)}: ${money(item.total)}"><b>${esc(item.provider)}</b><i style="--w:${pct(item.total, maxProvider)}%"></i><em>${money(item.total)}</em></span>`).join('')}</div></article>
    <article class="panel"><p class="eyebrow">Forecast</p><h2>Прогноз платежів</h2><div class="forecast-grid"><div><b>${money(forecast30)}</b><span>30 днів</span></div><div><b>${money(forecast90)}</b><span>Квартал</span></div><div><b>${money(forecast365)}</b><span>Рік</span></div></div></article>
    <article class="panel analytics-wide"><p class="eyebrow">Heatmap</p><h2>Календар оплат</h2><div class="heatmap-grid">${heatmap}</div></article>
    <article class="panel analytics-wide"><p class="eyebrow">Top services</p><h2>ТОП найдорожчих сервісів</h2><div class="premium-list">${expensive.map(service => `<div><span class="service-avatar mini">${esc(service.name).slice(0, 1).toUpperCase()}</span><b>${esc(service.name)}</b><small>${esc(service.provider || service.owner)}</small><strong>${money(serviceAmount(service))}</strong></div>`).join('')}</div></article>
  `;
}

function renderNotifications() {
  if (!$('notificationsContent')) return;
  const active = services.filter(service => !service.archived);
  const overdue = active.filter(service => statusOf(service.paidUntil)[0] === 'overdue');
  const reminders = active.filter(service => {
    const left = daysLeft(service.paidUntil);
    return left !== null && left >= 0 && left <= 14;
  }).sort((a, b) => parseDate(a.paidUntil) - parseDate(b.paidUntil)).slice(0, 10);
  const system = audit.slice(-8).reverse();
  const mentions = active.filter(service => [service.pm, service.accountant, service.manager].filter(Boolean).includes(currentUser?.name)).slice(0, 6);
  const notificationList = (items, map, emptyText) => items.length ? items.map(map).join('') : empty(emptyText, 'Усе спокійно');
  $('notificationsContent').innerHTML = `
    <article class="panel setting-card"><p class="eyebrow">Overdue</p><h2>Прострочені оплати</h2><div class="notification-list">${notificationList(overdue, service => `<div><span class="badge overdue">Overdue</span><b>${esc(service.name)}</b><small>${fmt(service.paidUntil)} · ${money(serviceAmount(service))}</small>${can('write') ? `<button class="btn primary small" onclick="openPayment('${service.id}')">Оплатити</button>` : ''}</div>`, 'Прострочених оплат немає.')}</div></article>
    <article class="panel setting-card"><p class="eyebrow">Reminders</p><h2>Нагадування</h2><div class="notification-list">${notificationList(reminders, service => `<div><span class="badge ${statusOf(service.paidUntil)[0]}">${statusOf(service.paidUntil)[1]}</span><b>${esc(service.name)}</b><small>${esc(service.type)} · ${fmt(service.paidUntil)}</small></div>`, 'Немає платежів у найближчі 14 днів.')}</div></article>
    <article class="panel setting-card"><p class="eyebrow">System</p><h2>Системні повідомлення</h2><div class="notification-list">${notificationList(system, item => `<div><span class="badge soon">Audit</span><b>${esc(item.serviceName)}</b><small>${esc(item.user)} · ${esc(item.action)} · ${new Date(item.createdAt).toLocaleString('uk-UA')}</small></div>`, 'Системних подій поки немає.')}</div></article>
    <article class="panel setting-card"><p class="eyebrow">Mentions</p><h2>Згадки користувача</h2><div class="notification-list">${notificationList(mentions, service => `<div><span class="badge ok">Assigned</span><b>${esc(service.name)}</b><small>${esc(service.owner)} · ${esc(service.type)}</small></div>`, 'Для поточного користувача немає згадок.')}</div></article>
  `;
}

function renderDocuments() {
  if (!$('documentsContent')) return;
  const docs = history.flatMap(item => [
    item.docLink ? { type: 'PDF', title: `Рахунок · ${item.serviceName}`, link: item.docLink, service: item.serviceName, author: item.author, date: item.createdAt } : null,
    item.contractLink ? { type: 'DOC', title: `Договір / акт · ${item.serviceName}`, link: item.contractLink, service: item.serviceName, author: item.author, date: item.createdAt } : null,
    item.bpLink ? { type: 'BP', title: `Business Process · ${item.serviceName}`, link: item.bpLink, service: item.serviceName, author: item.author, date: item.createdAt } : null
  ].filter(Boolean));
  const query = ($('docSearch')?.value || '').toLowerCase().trim();
  const typeFilter = $('docTypeFilter')?.value || 'all';
  const visibleDocs = docs
    .filter(doc => typeFilter === 'all' || doc.type === typeFilter)
    .filter(doc => [doc.title, doc.service, doc.author, doc.type].join(' ').toLowerCase().includes(query));
  const categories = groupBy(visibleDocs, item => item.type);
  $('documentsContent').innerHTML = `
    <div class="document-tools">
      <div class="search-box"><input id="docSearch" type="search" value="${esc(query)}" placeholder="Пошук документів, сервісів, авторів..." /></div>
      <select id="docTypeFilter"><option value="all">Усі категорії</option><option value="PDF" ${typeFilter === 'PDF' ? 'selected' : ''}>PDF</option><option value="DOC" ${typeFilter === 'DOC' ? 'selected' : ''}>DOC</option><option value="BP" ${typeFilter === 'BP' ? 'selected' : ''}>BP</option></select>
    </div>
    <div class="drop-zone"><b>Drag & drop upload</b><span>Перетягніть рахунок, акт, PDF або скріншот. У цій локальній версії файли додаються як посилання в оплаті.</span>${can('write') ? '<button class="btn primary small" onclick="showPage(\'services\')">Додати через оплату</button>' : ''}</div>
    <div class="document-grid">${Object.entries(categories).map(([type, rows]) => `<article><i>${esc(type)}</i><b>${rows.length} документів</b><span>${esc(rows[0]?.service || '')}</span></article>`).join('') || `<article><i>PDF</i><b>Документів не знайдено</b><span>Змініть пошук або фільтр</span></article>`}</div>
    <div class="document-list">${visibleDocs.length ? visibleDocs.map(doc => `<a href="${esc(doc.link)}" target="_blank" rel="noreferrer"><i>${esc(doc.type)}</i><b>${esc(doc.title)}</b><span>${esc(doc.author || '—')} · ${new Date(doc.date).toLocaleDateString('uk-UA')}</span><em>Перегляд</em></a>`).join('') : empty('Коли ви додасте BP, PDF або договір в оплаті, документ з’явиться тут.', 'Документи поки не додані', can('write') ? '<button class="btn primary small" onclick="showPage(\'services\')">Перейти до сервісів</button>' : '')}</div>
  `;
}

function renderTimeline() {
  const paymentEvents = history.map(item => ({ kind: 'payment', title: item.serviceName, owner: item.owner, date: item.createdAt, user: item.author, bpLink: item.bpLink, detail: `${money(item.amount)} · оплачено до ${fmt(item.newPaidUntil)}` }));
  const auditEvents = audit.map(item => ({ kind: 'audit', title: item.serviceName, owner: item.action, date: item.createdAt, user: item.user, detail: `${item.before || '-'} → ${item.after || '-'}` }));
  const rows = [...paymentEvents, ...auditEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
  const grouped = groupBy(rows, item => new Date(item.date).getFullYear());
  $('timelineList').innerHTML = Object.entries(grouped).sort((a, b) => b[0] - a[0]).map(([year, items]) => `<section class="history-group timeline-year">
    <h3>${year}</h3>
    ${items.map(item => `<div class="history-item timeline-event ${item.kind}">
      <span><b>${item.kind === 'payment' ? 'Оплата' : 'Зміна'}</b><small>${new Date(item.date).toLocaleString('uk-UA')}</small></span>
      <span>${esc(item.title || 'Подія')}<small>${esc(item.owner || '')}</small></span>
      <span>${esc(item.user || '-')}</span>
      <span>${esc(item.detail || '')}</span>
      <span>${item.bpLink ? `<a href="${esc(item.bpLink)}" target="_blank" rel="noreferrer">BP</a>` : '-'}</span>
    </div>`).join('')}
  </section>`).join('') || empty('Створення сервісів, оплати, редагування й архівація з’являться тут після перших дій.', 'Timeline поки порожній', can('write') ? '<button class="btn primary small" onclick="openAdd()">Додати сервіс</button>' : '');
}

function renderArchive() {
  const rows = services.filter(service => service.archived);
  $('archiveList').innerHTML = rows.map(service => `<article class="attention-card empty archive-card">
    <div><b>${esc(service.type)} · ${esc(service.owner)}</b><h3>${esc(service.name)}</h3><p>${esc(service.provider || '-')}</p></div>
    <div class="archive-meta"><span class="badge empty">Архів</span><small>${service.archivedAt ? new Date(service.archivedAt).toLocaleString('uk-UA') : 'Дата не зафіксована'}</small><small>${esc(service.archiveReason || 'Закритий або неактивний сервіс')}</small>${can('delete') ? `<button class="btn soft small" onclick="restoreService('${service.id}')">Відновити</button>` : ''}</div>
  </article>`).join('') || empty('Закриті сервіси не видаляються, а зберігаються тут з історією.', 'Архів порожній');
}

function renderUsers() {
  $('usersList').innerHTML = users.map(user => {
    const isCurrent = currentUser?.id === user.id;
    const roleSelect = can('manageUsers')
      ? `<select class="inline-role" onchange="updateUserRole('${user.id}', this.value)" ${isCurrent ? 'disabled title="Не змінюйте власну роль під час активної сесії"' : ''}>
          ${Object.entries(roleMeta).map(([role, meta]) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${meta.label}</option>`).join('')}
        </select>`
      : `<span>${roleMeta[user.role]?.label || user.role}</span>`;
    const assigned = services.filter(service => [service.pm, service.accountant, service.manager, service.owner].includes(user.name)).length;
    const scope = user.role === 'superadmin' ? 'Усі сервіси, ролі, імпорт' : user.role === 'viewer' ? 'Перегляд без змін' : 'Сервіси, оплати, експорт';
    const deleteButton = can('manageUsers') && !isCurrent ? `<button class="chip-btn delete" onclick="deleteUser('${user.id}')">Видалити</button>` : '<span class="readonly-label">Активний / захищений</span>';
    return `<div class="user-row access-user-card">
      <div class="user-avatar">${esc(user.name).slice(0, 1).toUpperCase()}</div>
      <div><b>${esc(user.name)}</b><span>@${esc(user.username)} · ${assigned} сервісів</span></div>
      <div class="user-role-cell">${roleSelect}</div>
      <div><span class="badge ${isCurrent ? 'ok' : 'soon'}">${isCurrent ? 'Online' : 'Active'}</span><small>Останній вхід: ${isCurrent ? 'зараз' : 'сьогодні'}</small></div>
      <div><b>Область доступу</b><span>${esc(scope)}</span></div>
      ${deleteButton}
    </div>`;
  }).join('') || empty('Додайте користувачів і призначте їм ролі.', 'Користувачів немає');
}

function applyAuthUi() {
  document.body.classList.toggle('is-authenticated', Boolean(currentUser));
  document.body.classList.toggle('is-logged-out', !currentUser);
}

function applySidebarState() {
  const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  const toggle = $('sidebarToggle');
  if (!toggle) return;
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.setAttribute('aria-label', collapsed ? 'Розгорнути меню' : 'Згорнути меню');
}

function applyRoleUi() {
  if (!currentUser) return;
  const firstName = currentUser.name.split(' ')[0] || currentUser.name;
  $('currentUserName').textContent = currentUser.name;
  $('currentUserRole').textContent = roleMeta[currentUser.role].label;
  if (document.querySelector('#overview.page.active')) {
    $('pageTitle').textContent = `Доброго дня, ${firstName}! 👋`;
    $('pageSubtitle').textContent = 'Ось що відбувається з оплатами сервісів.';
  }
  document.body.dataset.role = currentUser.role;
  document.querySelectorAll('[data-permission]').forEach(element => {
    const permission = element.dataset.permission;
    const allowed = can(permission);
    element.hidden = !allowed;
    element.disabled = !allowed;
  });
}

function render() {
  applyAuthUi();
  applySidebarState();
  if (!currentUser) {
    save();
    return;
  }
  renderOverview();
  renderServices();
  renderAttention();
  renderCalendar();
  renderHistory();
  renderTimeline();
  renderArchive();
  renderUsers();
  renderInsights();
  renderLimits();
  renderAnalytics();
  renderNotifications();
  renderDocuments();
  applyRoleUi();
  refreshDynamicFilters();
  save();
}

function usesFiscalKeys(type = $('serviceType')?.value) {
  return ['РРО', 'ПРРО'].includes(normalizeCategory(type));
}

function renderKeysEditor(keys = [{ value: '', expiresAt: '' }]) {
  const rows = keys.length ? keys : [{ value: '', expiresAt: '' }];
  $('keysList').innerHTML = rows.map((key, index) => `<div class="key-row">
    <label>Ключ<input class="key-value" value="${esc(key.value || '')}" placeholder="400190250" /></label>
    <label>Термін дії<input class="key-expires" type="date" value="${esc(key.expiresAt || '')}" /></label>
    <button type="button" class="icon-btn remove-key" aria-label="Видалити ключ" title="Видалити ключ" onclick="removeKeyRow(${index})">×</button>
  </div>`).join('');
}

function collectKeys() {
  if (!usesFiscalKeys()) return [];
  return [...document.querySelectorAll('#keysList .key-row')]
    .map(row => ({
      value: row.querySelector('.key-value')?.value.trim() || '',
      expiresAt: row.querySelector('.key-expires')?.value || ''
    }))
    .filter(key => key.value || key.expiresAt);
}

function syncKeysSection(keys = null) {
  const visible = usesFiscalKeys();
  $('keysSection').hidden = !visible;
  if (visible && keys) renderKeysEditor(keys);
  if (visible && !$('keysList').children.length) renderKeysEditor();
}

window.removeKeyRow = index => {
  const keys = collectKeys();
  keys.splice(index, 1);
  renderKeysEditor(keys.length ? keys : [{ value: '', expiresAt: '' }]);
};

$('addKeyBtn')?.addEventListener('click', () => {
  renderKeysEditor([...collectKeys(), { value: '', expiresAt: '' }]);
});

$('serviceType')?.addEventListener('change', () => {
  syncKeysSection(collectKeys());
});

window.openAdd = (owner = '') => {
  if (!requirePermission('write')) return;
  $('serviceForm').reset();
  $('serviceModalTitle').textContent = 'Додати сервіс';
  $('serviceId').value = '';
  $('owner').value = owner;
  $('intervalDays').value = 30;
  $('servicePassword').value = '';
  $('passwordField').hidden = !canViewSecrets();
  renderKeysEditor();
  syncKeysSection();
  $('serviceDialog').showModal();
};

window.openEdit = id => {
  if (!requirePermission('write')) return;
  const service = services.find(item => item.id === id);
  if (!service) return;
  $('serviceModalTitle').textContent = 'Редагувати сервіс';
  $('serviceId').value = service.id;
  $('owner').value = service.owner || '';
  $('serviceName').value = service.name || '';
  $('serviceType').value = service.type || 'Інше';
  $('provider').value = service.provider || '';
  $('cabinetLink').value = service.cabinetLink || '';
  $('serviceLogin').value = service.serviceLogin || '';
  $('servicePassword').value = canViewSecrets() ? service.servicePassword || '' : '';
  $('passwordField').hidden = !canViewSecrets();
  $('contact').value = service.contact || '';
  $('description').value = service.description || '';
  $('paidUntil').value = service.paidUntil || '';
  $('plannedAmount').value = service.plannedAmount || '';
  $('currency').value = service.currency || 'UAH';
  $('tags').value = service.tags || '';
  $('reminders').value = service.reminders || '30,14,7,3,1';
  $('scheduleType').value = service.schedule || 'monthly';
  $('intervalDays').value = service.intervalDays || 30;
  $('cronRule').value = service.cronRule || '';
  $('notes').value = service.notes || '';
  renderKeysEditor(normalizeKeys(service));
  syncKeysSection(normalizeKeys(service));
  $('serviceDialog').showModal();
};

window.openPayment = id => {
  if (!requirePermission('write')) return;
  const service = services.find(item => item.id === id);
  if (!service) return;
  $('paymentServiceId').value = id;
  $('paymentServiceLabel').textContent = `${service.owner} → ${service.name} · ${scheduleLabel(service)}`;
  $('newPaidUntil').value = service.paidUntil || iso(today());
  $('calcHint').textContent = `Поточна дата: ${fmt(service.paidUntil)}`;
  $('amount').value = '';
  $('author').value = currentUser?.name || '';
  $('bpLink').value = '';
  $('docLink').value = '';
  $('contractLink').value = '';
  $('comment').value = '';
  $('paymentDialog').showModal();
};

window.archiveService = id => {
  if (!requirePermission('delete')) return;
  const service = services.find(item => item.id === id);
  if (!service) return;
  if (confirm(`Перенести сервіс "${service.name}" в архів?`)) {
    service.archived = true;
    service.archivedAt = new Date().toISOString();
    service.archiveReason = 'Архівовано вручну';
    auditLog(service.id, service.name, 'переніс в архів', '', 'архів');
    toast('Сервіс перенесено в архів');
    render();
  }
};

window.restoreService = id => {
  if (!requirePermission('delete')) return;
  const service = services.find(item => item.id === id);
  if (!service) return;
  service.archived = false;
  service.archivedAt = '';
  service.archiveReason = '';
  auditLog(service.id, service.name, 'повернув з архіву', 'архів', 'активний');
  toast('Сервіс повернуто');
  render();
};

window.deleteUser = id => {
  if (!requirePermission('manageUsers')) return;
  const user = users.find(item => item.id === id);
  if (!user || user.id === currentUser.id) return toast('Не можна видалити активного користувача');
  const superadminCount = users.filter(item => item.role === 'superadmin').length;
  if (user.role === 'superadmin' && superadminCount <= 1) return toast('Має залишитись хоча б один суперадмін');
  users = users.filter(item => item.id !== id);
  toast('Користувача видалено');
  render();
};

window.updateUserRole = (id, role) => {
  if (!requirePermission('manageUsers')) return;
  const user = users.find(item => item.id === id);
  if (!user || user.id === currentUser.id) return toast('Не можна змінити власну роль під час активної сесії');
  const superadminCount = users.filter(item => item.role === 'superadmin').length;
  if (user.role === 'superadmin' && role !== 'superadmin' && superadminCount <= 1) return toast('Має залишитись хоча б один суперадмін');
  user.role = role;
  toast('Роль користувача оновлено');
  render();
};

$('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = $('loginUsername').value.trim();
  const password = $('loginPassword').value;
  const user = users.find(item => item.username === username && item.password === password);
  if (!user) return toast('Невірний нік або пароль');
  currentUser = user;
  $('loginForm').reset();
  toast(`Вітаю, ${user.name}`);
  render();
});

$('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  toast('Ви вийшли з системи');
  render();
});

$('serviceForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!requirePermission('write')) return;
  const id = $('serviceId').value;
  const existing = services.find(service => service.id === id);
  const keys = collectKeys();
  const data = {
    id: id || uid(),
    owner: $('owner').value.trim(),
    name: $('serviceName').value.trim(),
    type: normalizeCategory($('serviceType').value),
    provider: $('provider').value.trim(),
    cabinetLink: $('cabinetLink').value.trim(),
    serviceLogin: $('serviceLogin').value.trim(),
    servicePassword: canViewSecrets() ? $('servicePassword').value : existing?.servicePassword || '',
    contact: $('contact').value.trim(),
    country: existing?.country || '',
    identifier: keys.map(key => key.value).filter(Boolean).join(', '),
    keys,
    description: $('description').value.trim(),
    paidUntil: $('paidUntil').value,
    plannedAmount: Number($('plannedAmount').value || 0),
    currency: $('currency').value,
    exchangeRate: Number(existing?.exchangeRate || 1),
    vat: Number(existing?.vat || 0),
    pm: existing?.pm || '',
    accountant: existing?.accountant || '',
    manager: existing?.manager || '',
    tags: $('tags').value.trim(),
    reminders: $('reminders').value.trim(),
    schedule: $('scheduleType').value,
    intervalDays: Number($('intervalDays').value || 30),
    cronRule: $('cronRule').value.trim(),
    notes: $('notes').value.trim()
  };
  if (id) {
    const before = existing;
    services = services.map(service => service.id === id ? { ...service, ...data } : service);
    ['plannedAmount', 'paidUntil', 'schedule', 'pm', 'accountant', 'manager'].forEach(field => {
      if (String(before?.[field] ?? '') !== String(data[field] ?? '')) auditLog(id, data.name, `змінив ${field}`, before?.[field] ?? '', data[field] ?? '');
    });
  } else {
    services = [...services, data];
    auditLog(data.id, data.name, 'створив сервіс', '', data.name);
  }
  $('serviceDialog').close();
  toast('Сервіс збережено');
  render();
});

$('paymentForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!requirePermission('write')) return;
  const id = $('paymentServiceId').value;
  const service = services.find(item => item.id === id);
  if (!service) return;
  const oldPaidUntil = service.paidUntil;
  const paidTo = $('newPaidUntil').value;
  service.lastPaidAt = paidTo;
  service.paidUntil = nextBySchedule(service, paidTo);
  history.push({
    id: uid(),
    serviceId: id,
    owner: service.owner,
    serviceName: service.name,
    oldPaidUntil,
    newPaidUntil: paidTo,
    nextPaidUntil: service.paidUntil,
    amount: $('amount').value,
    author: $('author').value.trim(),
    bpLink: $('bpLink').value.trim(),
    docLink: $('docLink').value.trim(),
    contractLink: $('contractLink').value.trim(),
    comment: $('comment').value.trim(),
    createdAt: new Date().toISOString()
  });
  auditLog(service.id, service.name, 'оновив оплату', oldPaidUntil, service.paidUntil);
  $('paymentDialog').close();
  toast('Оплату оновлено');
  render();
});

$('userForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!requirePermission('manageUsers')) return;
  const username = $('userUsername').value.trim();
  if (users.some(user => user.username === username)) return toast('Такий нік уже існує');
  users.push({
    id: uid(),
    name: $('userName').value.trim(),
    username,
    password: $('userPassword').value,
    role: $('userRole').value
  });
  $('userForm').reset();
  toast('Користувача додано');
  render();
});

$('limitForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!requirePermission('write')) return;
  categoryLimits[$('limitCategory').value] = Number($('limitAmount').value || 0);
  $('limitForm').reset();
  toast('Ліміт категорії оновлено');
  render();
});

$('calcNextBtn').addEventListener('click', () => {
  const service = services.find(item => item.id === $('paymentServiceId').value);
  if (service) $('newPaidUntil').value = nextBySchedule(service);
});

$('selectAllServices')?.addEventListener('change', event => {
  document.querySelectorAll('.service-check').forEach(input => input.checked = event.target.checked);
});

$('bulkApplyBtn')?.addEventListener('click', () => {
  if (!requirePermission('write')) return;
  const ids = [...document.querySelectorAll('.service-check:checked')].map(input => input.value);
  if (!ids.length) return toast('Оберіть сервіси');
  const responsible = $('bulkResponsible').value;
  const tag = $('bulkTag').value.trim();
  services.forEach(service => {
    if (!ids.includes(service.id)) return;
    if (responsible) {
      auditLog(service.id, service.name, 'масово змінив PM', service.pm || '', responsible);
      service.pm = responsible;
    }
    if (tag) {
      const tags = new Set(String(service.tags || '').split(',').map(item => item.trim()).filter(Boolean));
      tags.add(tag);
      service.tags = [...tags].join(', ');
      auditLog(service.id, service.name, 'масово додав тег', '', tag);
    }
  });
  toast('Масову дію виконано');
  render();
});

$('bulkArchiveBtn')?.addEventListener('click', () => {
  if (!requirePermission('delete')) return;
  const ids = [...document.querySelectorAll('.service-check:checked')].map(input => input.value);
  if (!ids.length) return toast('Оберіть сервіси');
  services.forEach(service => {
    if (ids.includes(service.id)) {
      service.archived = true;
      service.archivedAt = new Date().toISOString();
      service.archiveReason = 'Масова архівація';
      auditLog(service.id, service.name, 'масово переніс в архів', '', 'архів');
    }
  });
  toast('Сервіси перенесено в архів');
  render();
});

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
document.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.jump)));
$('sidebarToggle')?.addEventListener('click', () => {
  const collapsed = !document.body.classList.contains('sidebar-collapsed');
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  applySidebarState();
});

function showPage(id) {
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === id));
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === id));
  const titles = {
    overview: ['Контроль оплат провайдерам', 'Оплати згруповані по категоріях: РРО, ПРРО, Інтернет, Домени, Сервера та інше.'],
    services: ['Реєстр сервісів', 'Категорії → провайдери → точки / ФОПи → оплати.'],
    attention: ['Потребує уваги', 'Тут усе, що прострочене або наближається до дедлайну.'],
    calendar: ['Календар оплат', 'Планування платежів по місяцях.'],
    history: ['Історія оплат', 'Окрема вкладка з авторами, сумами, коментарями та посиланнями на бізнес-процеси.'],
    timeline: ['Timeline оплат', 'Річний журнал усіх оплат і бізнес-процесів.'],
    archive: ['Архів сервісів', 'Закриті сервіси зберігаються без втрати історії.'],
    access: ['Доступи користувачів', 'Ніки, паролі та ролі. Ролі може видавати тільки суперадмін.']
  };
  const fallbackTitle = document.querySelector(`[data-page="${id}"]`)?.textContent || 'PayOps';
  const title = titles[id] || [fallbackTitle, 'Premium workspace for service payments, documents, analytics and settings.'];
  $('pageTitle').textContent = title[0];
  $('pageSubtitle').textContent = title[1];
}

['searchInput', 'statusFilter', 'typeFilter', 'sortMode', 'historySearch'].forEach(id => $(id)?.addEventListener('input', render));
document.addEventListener('input', event => {
  if (event.target?.id === 'docSearch') renderDocuments();
});
document.addEventListener('change', event => {
  if (event.target?.id === 'docTypeFilter') renderDocuments();
});
$('addBtn').onclick = () => openAdd();
$('addBtn2').onclick = () => openAdd();
$('refreshBtn').onclick = () => {
  toast('Дані оновлено');
  render();
};

$('exportBtn').onclick = () => {
  if (!requirePermission('export')) return;
  const blob = new Blob([JSON.stringify({ services, history, users, categoryLimits, audit }, null, 2)], { type: 'application/json' });
  download(blob, 'payops-data.json');
};

$('csvBtn').onclick = () => {
  if (!requirePermission('export')) return;
  const rows = [['owner', 'service', 'category', 'provider', 'identifier', 'paidUntil', 'plannedAmount', 'schedule', 'notes'], ...services.map(service => [service.owner, service.name, service.type, service.provider, service.identifier, service.paidUntil, service.plannedAmount, scheduleLabel(service), service.notes])];
  download(new Blob([rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' }), 'payops-services.csv');
};

function download(blob, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function initStatusTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'payops-status-tooltip';
  document.body.appendChild(tooltip);

  const hide = () => tooltip.classList.remove('show');
  const move = event => {
    const target = event.target.closest?.('.status-dot[data-tooltip], .status-compact[data-tooltip]');
    if (!target) return hide();
    tooltip.textContent = target.dataset.tooltip || '';
    tooltip.style.left = `${Math.min(window.innerWidth - 16, event.clientX + 14)}px`;
    tooltip.style.top = `${Math.max(12, event.clientY - 42)}px`;
    tooltip.classList.add('show');
  };

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseleave', hide);
  document.addEventListener('scroll', hide, true);
}

$('importBtn').onclick = () => {
  if (!requirePermission('import')) return;
  $('importFile').click();
};

$('importFile').addEventListener('change', async event => {
  if (!requirePermission('import')) return;
  const file = event.target.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  services = (data.services || services).map(service => ({ ...service, type: normalizeCategory(service.type) }));
  history = data.history || history;
  users = data.users || users;
  audit = data.audit || audit;
  categoryLimits = { ...defaultCategoryLimits, ...(data.categoryLimits || categoryLimits) };
  toast('Дані імпортовано');
  render();
});

$('seedBtn').onclick = () => {
  if (!requirePermission('superadmin')) return;
  if (confirm('Скинути дані на демо?')) {
    services = demo.map(service => ({ ...service, id: uid() }));
    history = [];
    users = defaultUsers.map(user => ({ ...user, id: uid() }));
    categoryLimits = { ...defaultCategoryLimits };
    currentUser = users.find(user => user.username === 'superadmin');
    toast('Демо-дані повернуто');
    render();
  }
};

$('clearHistoryBtn').onclick = () => {
  if (!requirePermission('superadmin')) return;
  if (confirm('Очистити історію оплат?')) {
    history = [];
    toast('Історію очищено');
    render();
  }
};

initStatusTooltip();
render();
