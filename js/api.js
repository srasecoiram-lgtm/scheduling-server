// ── Configuração ──────────────────────────────────────────────
// Ajuste para a URL onde o seu backend FastAPI está rodando
const API = 'http://localhost:8000';

// ── Utilitários ───────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function duration(start, end) {
  const m = Math.round((new Date(end) - new Date(start)) / 60000);
  return m >= 60 ? (Math.round(m / 60 * 10) / 10) + 'h' : m + 'min';
}

function toLocalDT(d) {
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + (ok ? 'ok' : 'err');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = '', 3000);
}

// ── Métricas ──────────────────────────────────────────────────
function updateMetrics(data) {
  document.getElementById('m-total').textContent = data.length;
  document.getElementById('m-resources').textContent = new Set(data.map(s => s.resource_id)).size;
  document.getElementById('m-owners').textContent = new Set(data.map(s => s.owner)).size;
}

// ── Agendamentos — buscar ─────────────────────────────────────
async function fetchSchedules(resourceId, owner) {
  let url = API + '/schedules?';
  if (resourceId) url += 'resource_id=' + encodeURIComponent(resourceId) + '&';
  if (owner)      url += 'owner='       + encodeURIComponent(owner)      + '&';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ' + res.status);
  return res.json();
}

// ── Agendamentos — criar ──────────────────────────────────────
async function postSchedule(payload) {
  const res = await fetch(API + '/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erro ' + res.status);
  return res.json();
}

// ── Agendamentos — cancelar ───────────────────────────────────
async function deleteSchedule(id) {
  const res = await fetch(API + '/schedules/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ' + res.status);
  return res.json();
}

// ── Notificações — buscar ─────────────────────────────────────
async function fetchNotifications(userId) {
  const res = await fetch(API + '/notifications/' + encodeURIComponent(userId));
  if (!res.ok) throw new Error('Erro ' + res.status);
  return res.json();
}

// ── WebSocket ─────────────────────────────────────────────────
function connectWS() {
  const wsUrl = API.replace(/^http/, 'ws') + '/ws';
  const dot   = document.getElementById('ws-dot');
  const label = document.getElementById('ws-label');

  function connect() {
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen  = () => { dot.className = 'ws-dot live'; label.textContent = 'ao vivo'; };
      ws.onclose = () => { dot.className = 'ws-dot'; label.textContent = 'reconectando...'; setTimeout(connect, 3000); };
      ws.onerror = () => { dot.className = 'ws-dot'; label.textContent = 'desconectado'; };
    } catch (e) { /* silencioso */ }
  }

  connect();
}
