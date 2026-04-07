import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getClients() {
  return load(STORAGE_KEYS.CLIENTS, []);
}

function saveClients(items) {
  save(STORAGE_KEYS.CLIENTS, items);
}

function getEditingClient() {
  return getClients().find(c => c.id === state.editingClientId) || null;
}

function clientBadge(client) {
  return (client.nombre || 'CL').split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() || 'CL';
}

function clientStats(items) {
  const activos = items.filter(c => c.activo !== false).length;
  const mayoreo = items.filter(c => (c.tipoCliente || '').toLowerCase().includes('mayoreo')).length;
  const recientes = items.filter(c => {
    const date = new Date(`${c.fechaAlta}T00:00:00`);
    const diff = Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 30;
  }).length;
  return { total: items.length, activos, mayoreo, recientes };
}

export function renderClientes() {
  const clients = getClients();
  const q = (state.clientsQuery || '').trim().toLowerCase();
  const filtered = !q ? clients : clients.filter(c =>
    (c.nombre || '').toLowerCase().includes(q) ||
    (c.telefono || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.notas || '').toLowerCase().includes(q)
  );
  const stats = clientStats(clients);
  const editing = getEditingClient();

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Clientes</div><div class="kpi-value">${stats.total}</div><div class="kpi-meta">Base registrada</div></article>
        <article class="card"><div class="muted">Activos</div><div class="kpi-value">${stats.activos}</div><div class="kpi-meta">Disponibles para venta</div></article>
        <article class="card"><div class="muted">Mayoreo</div><div class="kpi-value">${stats.mayoreo}</div><div class="kpi-meta">Clientes con compra a volumen</div></article>
        <article class="card"><div class="muted">Nuevos 30 días</div><div class="kpi-value">${stats.recientes}</div><div class="kpi-meta">Altas recientes</div></article>
      </section>

      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Clientes v1</h3>
              <p class="muted" style="margin:6px 0 0;">Alta, edición, búsqueda y notas rápidas de seguimiento.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearClientsSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newClientBtn">Nuevo cliente</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="clientsSearch">Buscar cliente</label>
            <input id="clientsSearch" placeholder="Ej. Ana, 5512345678, correo" value="${state.clientsQuery || ''}" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Alta</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(client => `
                  <tr>
                    <td>
                      <div style="display:flex; gap:12px; align-items:center;">
                        <div class="product-thumb">${clientBadge(client)}</div>
                        <div>
                          <div style="font-weight:700;">${client.nombre}</div>
                          <div class="muted" style="font-size:.85rem;">${client.email || 'Sin correo'}${client.direccion ? ' · ' + client.direccion : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>${client.telefono || '-'}</td>
                    <td><span class="status-tag ${client.tipoCliente === 'Mayoreo' ? 'soft-blue' : 'ok'}">${client.tipoCliente || 'Mostrador'}</span></td>
                    <td>${client.fechaAlta || '-'}</td>
                    <td>${client.notas ? client.notas.slice(0, 40) : '-'}</td>
                    <td><span class="status-tag ${client.activo !== false ? 'ok' : 'danger'}">${client.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-secondary small-btn edit-client-btn" data-id="${client.id}">Editar</button>
                        <button class="btn btn-danger small-btn delete-client-btn" data-id="${client.id}">Borrar</button>
                      </div>
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="7" class="muted">No se encontraron clientes.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${editing ? 'Editar cliente' : 'Alta de cliente'}</h3>
          <p class="muted">Queda listo para crecer luego a historial, promociones y seguimiento.</p>
          <form id="clientForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="clientId" value="${editing?.id || ''}" />
            <div class="input-group"><label for="clientNombre">Nombre</label><input id="clientNombre" value="${editing?.nombre || ''}" required /></div>
            <div class="input-group"><label for="clientTelefono">Teléfono</label><input id="clientTelefono" value="${editing?.telefono || ''}" /></div>
            <div class="input-group"><label for="clientEmail">Correo</label><input id="clientEmail" value="${editing?.email || ''}" /></div>
            <div class="input-group"><label for="clientTipo">Tipo cliente</label><select id="clientTipo"><option ${editing?.tipoCliente === 'Mostrador' ? 'selected' : ''}>Mostrador</option><option ${editing?.tipoCliente === 'Frecuente' ? 'selected' : ''}>Frecuente</option><option ${editing?.tipoCliente === 'Mayoreo' ? 'selected' : ''}>Mayoreo</option></select></div>
            <div class="input-group"><label for="clientFechaAlta">Fecha alta</label><input id="clientFechaAlta" type="date" value="${editing?.fechaAlta || new Date().toISOString().slice(0,10)}" required /></div>
            <div class="input-group"><label for="clientActivo">Estado</label><select id="clientActivo"><option value="true" ${(editing?.activo !== false) ? 'selected' : ''}>Activo</option><option value="false" ${(editing?.activo === false) ? 'selected' : ''}>Inactivo</option></select></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="clientDireccion">Dirección</label><input id="clientDireccion" value="${editing?.direccion || ''}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="clientNotas">Notas</label><textarea id="clientNotas" rows="4" placeholder="Cliente frecuente, prefiere WhatsApp, recordatorios, etc.">${editing?.notas || ''}</textarea></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveClientBtn">${editing ? 'Guardar cambios' : 'Guardar cliente'}</button>
            <button class="btn btn-secondary" id="resetClientBtn">Limpiar formulario</button>
          </div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Mostrador / frecuente</span><span class="status-tag ok">Cliente regular</span></div>
            <div class="status-item"><span>Mayoreo</span><span class="status-tag soft-blue">Compra a volumen</span></div>
            <div class="status-item"><span>Inactivo</span><span class="status-tag danger">Sin operar</span></div>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindClientes(render) {
  document.getElementById('clientsSearch')?.addEventListener('input', e => { state.clientsQuery = e.target.value; render(); });
  document.getElementById('clearClientsSearchBtn')?.addEventListener('click', () => { state.clientsQuery = ''; render(); });
  document.getElementById('newClientBtn')?.addEventListener('click', () => { state.editingClientId = ''; render(); });
  document.getElementById('resetClientBtn')?.addEventListener('click', () => { state.editingClientId = ''; render(); });

  document.querySelectorAll('.edit-client-btn').forEach(btn => btn.addEventListener('click', () => {
    state.editingClientId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.delete-client-btn').forEach(btn => btn.addEventListener('click', () => {
    const items = getClients().filter(c => c.id !== btn.dataset.id);
    saveClients(items);
    if (state.editingClientId === btn.dataset.id) state.editingClientId = '';
    render();
    showToast('Cliente eliminado.');
  }));

  document.getElementById('saveClientBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('clientId').value || `cli_${Date.now()}`,
      nombre: document.getElementById('clientNombre').value.trim(),
      telefono: document.getElementById('clientTelefono').value.trim(),
      email: document.getElementById('clientEmail').value.trim(),
      tipoCliente: document.getElementById('clientTipo').value,
      fechaAlta: document.getElementById('clientFechaAlta').value,
      activo: document.getElementById('clientActivo').value === 'true',
      direccion: document.getElementById('clientDireccion').value.trim(),
      notas: document.getElementById('clientNotas').value.trim()
    };

    if (!payload.nombre || !payload.fechaAlta) {
      showToast('Completa nombre y fecha de alta.');
      return;
    }

    const items = getClients();
    const exists = items.some(c => c.id === payload.id);
    const next = exists ? items.map(c => c.id === payload.id ? payload : c) : [...items, payload];
    saveClients(next);
    state.editingClientId = '';
    render();
    showToast(exists ? 'Cliente actualizado.' : 'Cliente guardado.');
  });
}
