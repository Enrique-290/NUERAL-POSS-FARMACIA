import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getClients() {
  return load(STORAGE_KEYS.MAYOREO_CLIENTS, []);
}

function saveClients(items) {
  save(STORAGE_KEYS.MAYOREO_CLIENTS, items);
}

function getEditingClient() {
  return getClients().find(c => c.id === state.editingMayoreoClientId) || null;
}

function clientBadge(client) {
  return (client.nombre || 'MY').split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() || 'MY';
}

function clientStats(items) {
  const activos = items.filter(c => c.activo !== false).length;
  const recientes = items.filter(c => {
    const date = new Date(`${c.fechaAlta}T00:00:00`);
    const diff = Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 30;
  }).length;
  const conCorreo = items.filter(c => Boolean((c.email || '').trim())).length;
  return { total: items.length, activos, recientes, conCorreo };
}

export function renderModule() {
  const clients = getClients();
  const q = (state.mayoreoClientsQuery || '').trim().toLowerCase();
  const filtered = !q ? clients : clients.filter(c =>
    (c.nombre || '').toLowerCase().includes(q) ||
    (c.telefono || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.notas || '').toLowerCase().includes(q) ||
    (c.direccion || '').toLowerCase().includes(q)
  );
  const stats = clientStats(clients);
  const editing = getEditingClient();

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Clientes mayoreo</div><div class="kpi-value">${stats.total}</div><div class="kpi-meta">Base comercial</div></article>
        <article class="card"><div class="muted">Activos</div><div class="kpi-value">${stats.activos}</div><div class="kpi-meta">Disponibles para pedidos</div></article>
        <article class="card"><div class="muted">Con correo</div><div class="kpi-value">${stats.conCorreo}</div><div class="kpi-meta">Seguimiento y cotización</div></article>
        <article class="card"><div class="muted">Altas 30 días</div><div class="kpi-value">${stats.recientes}</div><div class="kpi-meta">Clientes nuevos</div></article>
      </section>

      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Clientes mayoreo v1</h3>
              <p class="muted" style="margin:6px 0 0;">Alta, edición y control comercial para clientes de volumen.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearMayoreoClientsSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newMayoreoClientBtn">Nuevo cliente</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="mayoreoClientsSearch">Buscar cliente mayoreo</label>
            <input id="mayoreoClientsSearch" placeholder="Ej. clínica, farmacia, teléfono" value="${state.mayoreoClientsQuery || ''}" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Alta</th>
                  <th>Estado</th>
                  <th>Notas</th>
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
                          <div class="muted" style="font-size:.85rem;">${client.direccion || 'Sin dirección'}</div>
                        </div>
                      </div>
                    </td>
                    <td>${client.telefono || '-'}</td>
                    <td>${client.email || '-'}</td>
                    <td>${client.fechaAlta || '-'}</td>
                    <td><span class="status-tag ${client.activo !== false ? 'ok' : 'danger'}">${client.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                    <td>${client.notas ? client.notas.slice(0, 48) : '-'}</td>
                    <td>
                      <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-secondary small-btn edit-mayoreo-client-btn" data-id="${client.id}">Editar</button>
                        <button class="btn btn-danger small-btn delete-mayoreo-client-btn" data-id="${client.id}">Borrar</button>
                      </div>
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="7" class="muted">No se encontraron clientes mayoreo.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${editing ? 'Editar cliente mayoreo' : 'Alta de cliente mayoreo'}</h3>
          <p class="muted">Pensado para clínicas, consultorios, farmacias y cuentas de volumen.</p>
          <form class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="mayoreoClientId" value="${editing?.id || ''}" />
            <div class="input-group"><label for="mayoreoClientNombre">Nombre</label><input id="mayoreoClientNombre" value="${editing?.nombre || ''}" required /></div>
            <div class="input-group"><label for="mayoreoClientTelefono">Teléfono</label><input id="mayoreoClientTelefono" value="${editing?.telefono || ''}" /></div>
            <div class="input-group"><label for="mayoreoClientEmail">Correo</label><input id="mayoreoClientEmail" value="${editing?.email || ''}" /></div>
            <div class="input-group"><label for="mayoreoClientFechaAlta">Fecha alta</label><input id="mayoreoClientFechaAlta" type="date" value="${editing?.fechaAlta || new Date().toISOString().slice(0,10)}" required /></div>
            <div class="input-group"><label for="mayoreoClientEstado">Estado</label><select id="mayoreoClientEstado"><option value="true" ${editing?.activo !== false ? 'selected' : ''}>Activo</option><option value="false" ${editing?.activo === false ? 'selected' : ''}>Inactivo</option></select></div>
            <div class="input-group"><label for="mayoreoClientContacto">Tipo</label><input id="mayoreoClientContacto" value="${editing?.tipoCliente || 'Mayoreo'}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="mayoreoClientDireccion">Dirección</label><input id="mayoreoClientDireccion" value="${editing?.direccion || ''}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="mayoreoClientNotas">Notas</label><textarea id="mayoreoClientNotas" rows="4" placeholder="Días de pedido, condiciones, contacto de compras, etc.">${editing?.notas || ''}</textarea></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveMayoreoClientBtn">${editing ? 'Guardar cambios' : 'Guardar cliente'}</button>
            <button class="btn btn-secondary" id="resetMayoreoClientBtn">Limpiar formulario</button>
          </div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Cliente activo</span><span class="status-tag ok">Operando</span></div>
            <div class="status-item"><span>Seguimiento</span><span class="status-tag soft-blue">Cotizaciones</span></div>
            <div class="status-item"><span>Cliente inactivo</span><span class="status-tag danger">Sin pedidos</span></div>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindMayoreoClientes(render) {
  document.getElementById('mayoreoClientsSearch')?.addEventListener('input', e => {
    state.mayoreoClientsQuery = e.target.value;
    render();
  });

  document.getElementById('clearMayoreoClientsSearchBtn')?.addEventListener('click', () => {
    state.mayoreoClientsQuery = '';
    render();
  });

  document.getElementById('newMayoreoClientBtn')?.addEventListener('click', () => {
    state.editingMayoreoClientId = '';
    render();
  });

  document.getElementById('resetMayoreoClientBtn')?.addEventListener('click', () => {
    state.editingMayoreoClientId = '';
    render();
  });

  document.querySelectorAll('.edit-mayoreo-client-btn').forEach(btn => btn.addEventListener('click', () => {
    state.editingMayoreoClientId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.delete-mayoreo-client-btn').forEach(btn => btn.addEventListener('click', () => {
    const items = getClients().filter(c => c.id !== btn.dataset.id);
    saveClients(items);
    if (state.editingMayoreoClientId === btn.dataset.id) state.editingMayoreoClientId = '';
    render();
    showToast('Cliente mayoreo eliminado.');
  }));

  document.getElementById('saveMayoreoClientBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('mayoreoClientId').value || `m_cli_${Date.now()}`,
      nombre: document.getElementById('mayoreoClientNombre').value.trim(),
      telefono: document.getElementById('mayoreoClientTelefono').value.trim(),
      email: document.getElementById('mayoreoClientEmail').value.trim(),
      tipoCliente: document.getElementById('mayoreoClientContacto').value.trim() || 'Mayoreo',
      fechaAlta: document.getElementById('mayoreoClientFechaAlta').value,
      activo: document.getElementById('mayoreoClientEstado').value === 'true',
      direccion: document.getElementById('mayoreoClientDireccion').value.trim(),
      notas: document.getElementById('mayoreoClientNotas').value.trim()
    };

    if (!payload.nombre || !payload.fechaAlta) {
      showToast('Completa nombre y fecha de alta.');
      return;
    }

    const items = getClients();
    const exists = items.some(c => c.id === payload.id);
    const next = exists ? items.map(c => c.id === payload.id ? payload : c) : [...items, payload];
    saveClients(next);
    state.editingMayoreoClientId = '';
    render();
    showToast(exists ? 'Cliente mayoreo actualizado.' : 'Cliente mayoreo guardado.');
  });
}
