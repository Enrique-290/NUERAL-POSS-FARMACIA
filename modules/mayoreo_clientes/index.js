import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getItems(){ return load(STORAGE_KEYS.MAYOREO_CLIENTS, []); }
function saveItems(items){ save(STORAGE_KEYS.MAYOREO_CLIENTS, items); }
function editing(){ return getItems().find(i=>i.id===state.editingMayoreoClientId) || null; }
function badge(name=''){ return name.split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()||'MC'; }

export function renderModule(){
  const items=getItems();
  const q=(state.mayoreoClientsQuery||'').trim().toLowerCase();
  const filtered=!q?items:items.filter(i => [i.nombre,i.telefono,i.email,i.tipoCliente,i.direccion].some(v => String(v||'').toLowerCase().includes(q)));
  const item=editing();
  const activos=items.filter(i=>i.activo).length;
  return `
  <div class="page">
    <section class="grid grid-4">
      <article class="card"><div class="muted">Clientes mayoreo</div><div class="kpi-value">${items.length}</div><div class="kpi-meta">Base separada</div></article>
      <article class="card"><div class="muted">Activos</div><div class="kpi-value">${activos}</div><div class="kpi-meta">Listos para vender</div></article>
      <article class="card"><div class="muted">Tipos</div><div class="kpi-value">${new Set(items.map(i=>i.tipoCliente)).size}</div><div class="kpi-meta">Clínica, farmacia, distribuidor</div></article>
      <article class="card"><div class="muted">Búsqueda</div><div class="kpi-value">${filtered.length}</div><div class="kpi-meta">Resultados actuales</div></article>
    </section>
    <section class="grid" style="grid-template-columns:1.05fr .95fr; align-items:start;">
      <article class="card">
        <div class="toolbar-row"><div><h3 style="margin:0;">Clientes mayoreo</h3><p class="muted" style="margin:6px 0 0;">Control de clientes para compras por volumen.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearMayoreoClientsSearchBtn">Limpiar</button><button class="btn btn-primary" id="newMayoreoClientBtn">Nuevo cliente</button></div></div>
        <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoClientsSearch">Buscar cliente</label><input id="mayoreoClientsSearch" placeholder="Nombre, teléfono, tipo" value="${state.mayoreoClientsQuery||''}" /></div>
        <div class="grid grid-2">${filtered.map(c => `<article class="card" style="padding:14px;"><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${badge(c.nombre)}</div><div><div style="font-weight:800;">${c.nombre}</div><div class="muted" style="font-size:.85rem;">${c.tipoCliente}</div></div></div><div class="status-list"><div class="status-item"><span>Teléfono</span><b>${c.telefono||'-'}</b></div><div class="status-item"><span>Correo</span><b>${c.email||'-'}</b></div><div class="status-item"><span>Estado</span><span class="status-tag ${c.activo?'ok':'warn'}">${c.activo?'Activo':'Inactivo'}</span></div></div><div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;"><button class="btn btn-secondary small-btn edit-mayoreo-client-btn" data-id="${c.id}">Editar</button><button class="btn btn-danger small-btn delete-mayoreo-client-btn" data-id="${c.id}">Borrar</button></div></article>`).join('') || '<article class="card"><div class="muted">No se encontraron clientes.</div></article>'}</div>
      </article>
      <article class="card">
        <h3>${item?'Editar cliente mayoreo':'Alta de cliente mayoreo'}</h3>
        <div class="inventory-form-grid" style="margin-top:14px;">
          <input type="hidden" id="mayoreoClientId" value="${item?.id||''}" />
          <div class="input-group"><label for="mCliNombre">Nombre / razón social</label><input id="mCliNombre" value="${item?.nombre||''}" /></div>
          <div class="input-group"><label for="mCliTipo">Tipo</label><input id="mCliTipo" value="${item?.tipoCliente||''}" placeholder="Farmacia, clínica..." /></div>
          <div class="input-group"><label for="mCliTelefono">Teléfono</label><input id="mCliTelefono" value="${item?.telefono||''}" /></div>
          <div class="input-group"><label for="mCliEmail">Correo</label><input id="mCliEmail" value="${item?.email||''}" /></div>
          <div class="input-group"><label for="mCliFecha">Fecha alta</label><input id="mCliFecha" type="date" value="${item?.fechaAlta||''}" /></div>
          <div class="input-group"><label for="mCliActivo">Estado</label><select id="mCliActivo"><option value="true" ${item?.activo!==false?'selected':''}>Activo</option><option value="false" ${item?.activo===false?'selected':''}>Inactivo</option></select></div>
          <div class="input-group" style="grid-column:1 / -1;"><label for="mCliDireccion">Dirección</label><input id="mCliDireccion" value="${item?.direccion||''}" /></div>
          <div class="input-group" style="grid-column:1 / -1;"><label for="mCliNotas">Notas</label><textarea id="mCliNotas" rows="4">${item?.notas||''}</textarea></div>
        </div>
        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveMayoreoClientBtn">${item?'Guardar cambios':'Guardar cliente'}</button><button class="btn btn-secondary" id="resetMayoreoClientBtn">Limpiar formulario</button></div>
      </article>
    </section>
  </div>`;
}

export function bindMayoreoClientes(render){
  document.getElementById('mayoreoClientsSearch')?.addEventListener('input', e=>{ state.mayoreoClientsQuery=e.target.value; render(); });
  document.getElementById('clearMayoreoClientsSearchBtn')?.addEventListener('click', ()=>{ state.mayoreoClientsQuery=''; render(); });
  document.getElementById('newMayoreoClientBtn')?.addEventListener('click', ()=>{ state.editingMayoreoClientId=''; render(); });
  document.getElementById('resetMayoreoClientBtn')?.addEventListener('click', ()=>{ state.editingMayoreoClientId=''; render(); });
  document.querySelectorAll('.edit-mayoreo-client-btn').forEach(btn => btn.addEventListener('click', ()=>{ state.editingMayoreoClientId=btn.dataset.id; render(); }));
  document.querySelectorAll('.delete-mayoreo-client-btn').forEach(btn => btn.addEventListener('click', ()=>{ saveItems(getItems().filter(i=>i.id!==btn.dataset.id)); if(state.editingMayoreoClientId===btn.dataset.id) state.editingMayoreoClientId=''; render(); showToast('Cliente mayoreo eliminado.'); }));
  document.getElementById('saveMayoreoClientBtn')?.addEventListener('click', ()=>{
    const payload={ id: document.getElementById('mayoreoClientId').value || `mcli_${Date.now()}`, nombre: document.getElementById('mCliNombre').value.trim(), tipoCliente: document.getElementById('mCliTipo').value.trim(), telefono: document.getElementById('mCliTelefono').value.trim(), email: document.getElementById('mCliEmail').value.trim(), fechaAlta: document.getElementById('mCliFecha').value, activo: document.getElementById('mCliActivo').value==='true', direccion: document.getElementById('mCliDireccion').value.trim(), notas: document.getElementById('mCliNotas').value.trim() };
    if(!payload.nombre || !payload.tipoCliente) return showToast('Completa nombre y tipo del cliente mayoreo.');
    const items=getItems(); const exists=items.some(i=>i.id===payload.id); saveItems(exists?items.map(i=>i.id===payload.id?payload:i):[...items,payload]); state.editingMayoreoClientId=''; render(); showToast(exists?'Cliente mayoreo actualizado.':'Cliente mayoreo guardado.');
  });
}
