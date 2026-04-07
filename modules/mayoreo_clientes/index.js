import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getClients() { return load(STORAGE_KEYS.MAYOREO_CLIENTS, []); }
function saveClients(items) { save(STORAGE_KEYS.MAYOREO_CLIENTS, items); }
function editing() { return getClients().find(c => c.id === state.editingMayoreoClientId) || null; }
function badge(name='') { return name.split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase() || 'MC'; }
export function renderModule() {
  const clients = getClients();
  const q = (state.mayoreoClientsQuery || '').trim().toLowerCase();
  const filtered = !q ? clients : clients.filter(c => [c.nombre,c.telefono,c.email,c.direccion,c.notas].some(v => String(v||'').toLowerCase().includes(q)));
  const ed = editing();
  const activos = clients.filter(c => c.activo !== false).length;
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Clientes mayoreo</div><div class="kpi-value">${clients.length}</div><div class="kpi-meta">Base comercial</div></article>
        <article class="card"><div class="muted">Activos</div><div class="kpi-value">${activos}</div><div class="kpi-meta">Operando</div></article>
        <article class="card"><div class="muted">Inactivos</div><div class="kpi-value">${clients.length - activos}</div><div class="kpi-meta">Sin operación</div></article>
        <article class="card"><div class="muted">Seguimiento</div><div class="kpi-value">${clients.filter(c => c.notas).length}</div><div class="kpi-meta">Con notas comerciales</div></article>
      </section>
      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row"><div><h3 style="margin:0;">Clientes mayoreo</h3><p class="muted" style="margin:6px 0 0;">Contactos y razón comercial del bloque mayoreo.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearMayoreoClientsSearchBtn">Limpiar</button><button class="btn btn-primary" id="newMayoreoClientBtn">Nuevo cliente</button></div></div>
          <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoClientsSearch">Buscar cliente</label><input id="mayoreoClientsSearch" value="${state.mayoreoClientsQuery || ''}" placeholder="Nombre, teléfono, correo" /></div>
          <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Correo</th><th>Alta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            ${filtered.map(client => `<tr><td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${badge(client.nombre)}</div><div><div style="font-weight:700;">${client.nombre}</div><div class="muted" style="font-size:.85rem;">${client.direccion || 'Sin dirección'}</div></div></div></td><td>${client.telefono || '-'}</td><td>${client.email || '-'}</td><td>${client.fechaAlta || '-'}</td><td><span class="status-tag ${client.activo !== false ? 'ok' : 'danger'}">${client.activo !== false ? 'Activo' : 'Inactivo'}</span></td><td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-mayoreo-client-btn" data-id="${client.id}">Editar</button><button class="btn btn-danger small-btn delete-mayoreo-client-btn" data-id="${client.id}">Borrar</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No hay clientes.</td></tr>'}
          </tbody></table></div>
        </article>
        <article class="card">
          <h3>${ed ? 'Editar cliente mayoreo' : 'Alta de cliente mayoreo'}</h3>
          <form class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="mayoreoClientId" value="${ed?.id || ''}" />
            <div class="input-group"><label for="mayoreoClientNombre">Nombre / razón social</label><input id="mayoreoClientNombre" value="${ed?.nombre || ''}" /></div>
            <div class="input-group"><label for="mayoreoClientTelefono">Teléfono</label><input id="mayoreoClientTelefono" value="${ed?.telefono || ''}" /></div>
            <div class="input-group"><label for="mayoreoClientEmail">Correo</label><input id="mayoreoClientEmail" value="${ed?.email || ''}" /></div>
            <div class="input-group"><label for="mayoreoClientFechaAlta">Fecha alta</label><input id="mayoreoClientFechaAlta" type="date" value="${ed?.fechaAlta || new Date().toISOString().slice(0,10)}" /></div>
            <div class="input-group"><label for="mayoreoClientActivo">Estado</label><select id="mayoreoClientActivo"><option value="true" ${(ed?.activo !== false) ? 'selected' : ''}>Activo</option><option value="false" ${(ed?.activo === false) ? 'selected' : ''}>Inactivo</option></select></div>
            <div class="input-group"><label for="mayoreoClientTipo">Tipo</label><input id="mayoreoClientTipo" value="${ed?.tipoCliente || 'Mayoreo'}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="mayoreoClientDireccion">Dirección</label><input id="mayoreoClientDireccion" value="${ed?.direccion || ''}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="mayoreoClientNotas">Notas</label><textarea id="mayoreoClientNotas" rows="4">${ed?.notas || ''}</textarea></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveMayoreoClientBtn">${ed ? 'Guardar cambios' : 'Guardar cliente'}</button><button class="btn btn-secondary" id="resetMayoreoClientBtn">Limpiar formulario</button></div>
        </article>
      </section>
    </div>`;
}
export function bindMayoreoClientes(render) {
  document.getElementById('mayoreoClientsSearch')?.addEventListener('input', e => { state.mayoreoClientsQuery = e.target.value; render(); });
  document.getElementById('clearMayoreoClientsSearchBtn')?.addEventListener('click', () => { state.mayoreoClientsQuery = ''; render(); });
  document.getElementById('newMayoreoClientBtn')?.addEventListener('click', () => { state.editingMayoreoClientId = ''; render(); });
  document.getElementById('resetMayoreoClientBtn')?.addEventListener('click', () => { state.editingMayoreoClientId = ''; render(); });
  document.querySelectorAll('.edit-mayoreo-client-btn').forEach(btn => btn.addEventListener('click', () => { state.editingMayoreoClientId = btn.dataset.id; render(); }));
  document.querySelectorAll('.delete-mayoreo-client-btn').forEach(btn => btn.addEventListener('click', () => { saveClients(getClients().filter(c => c.id !== btn.dataset.id)); if (state.editingMayoreoClientId === btn.dataset.id) state.editingMayoreoClientId=''; render(); showToast('Cliente mayoreo eliminado.'); }));
  document.getElementById('saveMayoreoClientBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('mayoreoClientId').value || `mcli_${Date.now()}`,
      nombre: document.getElementById('mayoreoClientNombre').value.trim(),
      telefono: document.getElementById('mayoreoClientTelefono').value.trim(),
      email: document.getElementById('mayoreoClientEmail').value.trim(),
      fechaAlta: document.getElementById('mayoreoClientFechaAlta').value,
      activo: document.getElementById('mayoreoClientActivo').value === 'true',
      tipoCliente: document.getElementById('mayoreoClientTipo').value.trim() || 'Mayoreo',
      direccion: document.getElementById('mayoreoClientDireccion').value.trim(),
      notas: document.getElementById('mayoreoClientNotas').value.trim()
    };
    if (!payload.nombre) return showToast('Escribe el nombre o razón social.');
    const items = getClients(); const exists = items.some(c => c.id === payload.id);
    saveClients(exists ? items.map(c => c.id === payload.id ? payload : c) : [...items, payload]);
    state.editingMayoreoClientId = '';
    render();
    showToast(exists ? 'Cliente mayoreo actualizado.' : 'Cliente mayoreo guardado.');
  });
}
