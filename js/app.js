// ── Renderização — lista de agendamentos ─────────────────────
function renderSchedules(data) {
  const el = document.getElementById('sched-list');

  if (!data.length) {
    el.innerHTML = '<div class="empty"><i class="ti ti-calendar-off"></i>Nenhum agendamento encontrado</div>';
    return;
  }

  el.innerHTML = data.map(s => `
    <div class="sched-item" id="sched-${s.id}">
      <div>
        <div class="sched-title">${esc(s.title)}</div>
        <div class="sched-meta">
          <i class="ti ti-building" aria-hidden="true"></i>${esc(s.resource_id)}
          <span class="sched-sep">·</span>
          <i class="ti ti-user" aria-hidden="true"></i>${esc(s.owner)}
        </div>
        <div class="sched-meta">
          <i class="ti ti-clock" aria-hidden="true"></i>
          ${fmt(s.start)} → ${fmt(s.end)}
          <span class="sched-sep">(${duration(s.start, s.end)})</span>
        </div>
        ${s.description ? `<div class="sched-desc">${esc(s.description)}</div>` : ''}
        <div class="sched-actions">
          <button class="btn-danger" onclick="cancelSchedule(${s.id}, '${esc(s.title)}')">
            <i class="ti ti-trash" aria-hidden="true"></i> Cancelar
          </button>
        </div>
      </div>
      <span class="sched-badge">#${s.id}</span>
    </div>
  `).join('');
}

// ── Renderização — notificações ───────────────────────────────
function renderNotifications(data, user) {
  const el = document.getElementById('notif-list');

  if (!data.length) {
    el.innerHTML = `<div class="empty"><i class="ti ti-inbox"></i>Sem notificações para <strong>${esc(user)}</strong></div>`;
    return;
  }

  el.innerHTML = data.map(n => `
    <div class="notif-item ${n.type === 'schedule_cancelled' ? 'cancelled' : ''}">
      <div class="notif-msg">${esc(n.message)}</div>
      <div class="notif-time">${fmt(n.created_at)}</div>
    </div>
  `).join('');
}

// ── Ações ─────────────────────────────────────────────────────
async function loadSchedules() {
  const resourceId = document.getElementById('f-resource').value.trim();
  const owner      = document.getElementById('f-owner').value.trim();
  const el         = document.getElementById('sched-list');

  el.innerHTML = '<div class="loading-row">Carregando...</div>';

  try {
    const data = await fetchSchedules(resourceId, owner);
    updateMetrics(data);
    renderSchedules(data);
  } catch (e) {
    el.innerHTML = `
      <div class="empty">
        <i class="ti ti-wifi-off"></i>
        Erro ao conectar com o backend.<br>
        Verifique se está rodando em <code>${API}</code>
      </div>`;
  }
}

async function cancelSchedule(id, title) {
  if (!confirm(`Cancelar o agendamento "${title}"?`)) return;

  try {
    const data = await deleteSchedule(id);
    if (data.ok) {
      toast('Agendamento cancelado');
      document.getElementById('sched-' + id)?.remove();
      loadSchedules();
      const user = document.getElementById('notif-user').value.trim();
      if (user) loadNotifs();
    } else {
      toast('Erro ao cancelar', false);
    }
  } catch (e) {
    toast('Erro de conexão', false);
  }
}

async function createSchedule() {
  const btn    = document.getElementById('btn-create');
  const banner = document.getElementById('conflict-banner');
  banner.style.display = 'none';

  const resource_id = document.getElementById('n-resource').value.trim();
  const owner       = document.getElementById('n-owner').value.trim();
  const title       = document.getElementById('n-title').value.trim();
  const start       = document.getElementById('n-start').value;
  const end         = document.getElementById('n-end').value;
  const description = document.getElementById('n-desc').value.trim();

  if (!resource_id || !owner || !title || !start || !end) {
    toast('Preencha todos os campos obrigatórios', false);
    return;
  }
  if (new Date(end) <= new Date(start)) {
    toast('Fim deve ser depois do início', false);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Criando...';

  try {
    const data = await postSchedule({
      resource_id, owner, title,
      start: new Date(start).toISOString(),
      end:   new Date(end).toISOString(),
      description: description || undefined
    });

    if (data.ok) {
      toast('Agendamento criado! #' + data.id);
      ['n-resource', 'n-owner', 'n-title', 'n-desc'].forEach(id => document.getElementById(id).value = '');
      initDefaultTimes();
      loadSchedules();
      document.getElementById('notif-user').value = owner;
      loadNotifs();
    } else {
      banner.style.display = 'flex';
      toast(data.message || 'Erro ao criar', false);
    }
  } catch (e) {
    toast('Erro de conexão', false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-plus"></i> Criar agendamento';
  }
}

async function loadNotifs() {
  const user = document.getElementById('notif-user').value.trim();
  if (!user) return;

  const el = document.getElementById('notif-list');
  el.innerHTML = '<div class="loading-row">Carregando...</div>';

  try {
    const data = await fetchNotifications(user);
    renderNotifications(data, user);
  } catch (e) {
    el.innerHTML = '<div class="empty">Erro ao buscar notificações</div>';
  }
}

// ── Inicialização ─────────────────────────────────────────────
function initDefaultTimes() {
  const now = new Date();
  now.setSeconds(0, 0);
  const later = new Date(now.getTime() + 60 * 60000);
  document.getElementById('n-start').value = toLocalDT(now);
  document.getElementById('n-end').value   = toLocalDT(later);
}

function setupFilters() {
  ['f-resource', 'f-owner'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      clearTimeout(window._filterTimer);
      window._filterTimer = setTimeout(loadSchedules, 400);
    });
  });
  document.getElementById('notif-user').addEventListener('keydown', e => {
    if (e.key === 'Enter') loadNotifs();
  });
}

// ── Boot ──────────────────────────────────────────────────────
initDefaultTimes();
setupFilters();
loadSchedules();
connectWS();
