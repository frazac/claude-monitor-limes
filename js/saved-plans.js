// pagina "tutti i salvataggi": legge i piani nominati salvati in localStorage
// (stessa chiave usata da js/app.js) e li mostra in una tabella con dettaglio
// ad accordion per riga, con cancellazione singola o totale (con conferma).
// Pagina a sé stante, nessun poll/stato live.
const LANG_KEY = 'claude-monitor-lang';
function detectLocale() {
  return (navigator.language || 'en').toLowerCase().startsWith('it') ? 'it' : 'en';
}
const LOCALE = localStorage.getItem(LANG_KEY) || detectLocale();
const T = window.I18N[LOCALE];

const THEME_KEY = 'claude-monitor-theme';
function applyTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) document.documentElement.setAttribute('data-theme', stored);
}

// stessa logica di js/app.js: la demo ha i suoi piani, separati da quelli veri
const DEMO = new URLSearchParams(location.search).has('demo') || location.hostname.endsWith('github.io');
const NAMED_PLANS_KEY = (DEMO ? 'claude-monitor-demo' : 'claude-monitor') + '-named-plans';

function loadNamedPlans() {
  try {
    return JSON.parse(localStorage.getItem(NAMED_PLANS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

// stesso formato duplicato da js/app.js: i piani salvati prima dell'introduzione
// di savedAt sono lo snapshot "nudo", quelli nuovi sono {snapshot, savedAt}.
function planEntrySnapshot(entry) {
  return entry && typeof entry === 'object' && entry.snapshot ? entry.snapshot : entry;
}
function planEntrySavedAt(entry) {
  return entry && typeof entry === 'object' && entry.savedAt ? entry.savedAt : null;
}

// ordine delle fasce nel dettaglio: preset di default per nome, altrimenti
// numerico — non dipende dalla configurazione slot ATTUALE (che potrebbe non
// coincidere più con quella con cui il piano era stato salvato).
const DEFAULT_ORDER = ['mattina', 'pomeriggio', 'sera'];
function slotSortRank(key) {
  const idx = DEFAULT_ORDER.indexOf(key);
  if (idx !== -1) return idx;
  const n = Number(key);
  return Number.isNaN(n) ? 99 : n;
}
function slotLabel(key) {
  const n = Number(key);
  if (!Number.isNaN(n) && String(n) === key) return T.slotLabelPrefix + (n + 1);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function formatSavedAt(iso) {
  if (!iso) return T.savedPlansUnknownDate;
  const d = new Date(iso);
  return d.toLocaleString(T.localeCode, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// giorni della settimana in ordine lun..dom (Date.getDay(): 0=dom..6=sab); il
// piano vero e proprio non ha un ordine settimanale fisso (dipende dalla data
// di reset con cui era stato costruito), quindi qui usiamo il consueto ordine
// lun..dom come riepilogo leggibile, non una ricostruzione esatta del calendario.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function buildDetailHTML(entry) {
  const snapshot = planEntrySnapshot(entry) || {};
  const byDay = {};
  Object.keys(snapshot).forEach(k => {
    if (!snapshot[k]) return;
    const sep = k.indexOf(':');
    if (sep === -1) return;
    const weekdayNum = Number(k.slice(0, sep));
    const slotKey = k.slice(sep + 1);
    if (!byDay[weekdayNum]) byDay[weekdayNum] = [];
    byDay[weekdayNum].push(slotKey);
  });
  const rows = WEEK_ORDER.map(w => {
    const active = (byDay[w] || []).slice().sort((a, b) => slotSortRank(a) - slotSortRank(b));
    const label = active.length ? active.map(slotLabel).join(', ') : T.savedPlansNoActive;
    return '<div class="detail-day"><span class="detail-dow">' + T.dow[w] + '</span><span class="detail-slots">' + label + '</span></div>';
  }).join('');
  return '<div class="detail-days">' + rows + '</div>';
}

const TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

function saveNamedPlans(named) {
  localStorage.setItem(NAMED_PLANS_KEY, JSON.stringify(named));
}

function deletePlan(name) {
  if (!confirm(T.savedPlansDeleteConfirm.replace('{name}', name))) return;
  const named = loadNamedPlans();
  delete named[name];
  saveNamedPlans(named);
  renderTable();
}

function deleteAllPlans() {
  const count = Object.keys(loadNamedPlans()).length;
  if (!confirm(T.savedPlansDeleteAllConfirm.replace('{count}', count))) return;
  localStorage.removeItem(NAMED_PLANS_KEY);
  renderTable();
}

function init() {
  applyTheme();
  document.documentElement.lang = LOCALE;
  document.title = T.savedPlansTitle;
  document.getElementById('title').textContent = T.savedPlansTitle;
  document.getElementById('tagline').textContent = T.savedPlansTagline;
  document.getElementById('col-name').textContent = T.savedPlansColName;
  document.getElementById('col-saved-at').textContent = T.savedPlansColSavedAt;
  const deleteAll = document.getElementById('delete-all');
  deleteAll.textContent = T.savedPlansDeleteAll;
  deleteAll.addEventListener('click', deleteAllPlans);
  renderTable();
}

function renderTable() {
  const named = loadNamedPlans();
  const names = Object.keys(named);
  const tbody = document.getElementById('plans-tbody');
  const empty = document.getElementById('plans-empty');
  tbody.innerHTML = '';
  empty.textContent = T.savedPlansEmpty;
  empty.hidden = names.length > 0;
  document.getElementById('delete-all').hidden = names.length === 0;
  document.querySelector('table').hidden = names.length === 0;
  if (!names.length) return;

  // più recenti prima; i piani legacy senza data di salvataggio vanno in coda, per nome
  names.sort((a, b) => {
    const ta = planEntrySavedAt(named[a]);
    const tb = planEntrySavedAt(named[b]);
    if (ta && tb) return new Date(tb) - new Date(ta);
    if (ta) return -1;
    if (tb) return 1;
    return a.localeCompare(b);
  });
  const lastName = names.find(n => planEntrySavedAt(named[n])) || null;

  names.forEach(name => {
    const entry = named[name];
    const savedAt = planEntrySavedAt(entry);
    const row = document.createElement('tr');
    row.className = 'plan-row';
    row.innerHTML = '<td>' + escapeHTML(name) + (name === lastName ? ' <span class="badge">' + T.savedPlansLastBadge + '</span>' : '') + '</td>' +
      '<td>' + formatSavedAt(savedAt) + '</td>' +
      '<td class="col-actions"><button type="button" class="delete-btn" title="' + escapeHTML(T.savedPlansDelete) +
      '" aria-label="' + escapeHTML(T.savedPlansDelete + ': ' + name) + '">' + TRASH_ICON + '</button></td>';
    row.querySelector('.delete-btn').addEventListener('click', e => {
      e.stopPropagation(); // non aprire l'accordion della riga
      deletePlan(name);
    });
    tbody.appendChild(row);

    const detailRow = document.createElement('tr');
    detailRow.className = 'plan-detail-row';
    detailRow.hidden = true;
    const detailCell = document.createElement('td');
    detailCell.colSpan = 3;
    detailCell.innerHTML = buildDetailHTML(entry);
    detailRow.appendChild(detailCell);
    tbody.appendChild(detailRow);

    row.addEventListener('click', () => {
      detailRow.hidden = !detailRow.hidden;
      row.classList.toggle('open', !detailRow.hidden);
    });
  });
}

init();
