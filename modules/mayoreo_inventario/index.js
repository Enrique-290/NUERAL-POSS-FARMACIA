import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, showToast } from '../../core/utils.js';

function getItems() { return load(STORAGE_KEYS.MAYOREO_INVENTORY, []); }
function saveItems(items) { save(STORAGE_KEYS.MAYOREO_INVENTORY, items); }
function getEditing() { return getItems().find(i => i.id === state.editingMayoreoInventoryId) || null; }
function stats(items) {
  return {
    total: items.length,
    bajos: items.filter(i => Number(i.stock||0) <= Number(i.stockMinimo||0)).length,
    proximos: items.filter(i => inventoryStatus(i).label === 'Próximo').length,
    vencidos: items.filter(i => inventoryStatus(i).label === 'Vencido').length
  };
}
export function renderModule() {
  const items = getItems();
  const q = (state.mayoreoInventoryQuery || '').trim().toLowerCase();
  const filtered = !q ? items : items.filter(item =>
    (item.nombre || '').toLowerCase().includes(q) ||
    (item.sku || '').toLowerCase().includes(q) ||
    (item.barcode || '').toLowerCase().includes(q) ||
    (item.lote || '').toLowerCase().includes(q)
  );
  const s = stats(items);
  const editing = getEditing();
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos mayoreo</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Inventario separado</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">No toca el normal</div></article>
        <article class="card"><div class="muted">Próximos</div><div class="kpi-value">${s.proximos}</div><div class="kpi-meta">Color amarillo</div></article>
        <article class="card"><div class="muted">Vencidos</div><div class="kpi-value">${s.vencidos}</div><div class="kpi-meta">Color rojo</div></article>
      </section>
      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div><h3 style="margin:0;">Inventario mayoreo</h3><p class="muted" style="margin:6px 0 0;">CRUD separado del inventario público.</p></div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearMayoreoInventorySearchBtn">Limpiar</button><button class="btn btn-primary" id="newMayoreoInventoryBtn">Nuevo producto</button></div>
          </div>
          <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoInventorySearch">Buscar producto</label><input id="mayoreoInventorySearch" value="${state.mayoreoInventoryQuery || ''}" placeholder="Nombre, SKU, lote" /></div>
          <div class="table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Tipo</th><th>Stock</th><th>Mínimo</th><th>Lote</th><th>Caducidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          ${filtered.map(item => { const cad = inventoryStatus(item); const stk = stockStatus(item); return `<tr><td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${item.nombre.slice(0,2).toUpperCase()}</div><div><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">$${Number(item.precio).toFixed(2)} · ${item.categoria}</div></div></div></td><td>${item.sku}</td><td>${item.tipo}</td><td><span class="status-tag ${stk.className}">${item.stock}</span></td><td>${item.stockMinimo}</td><td>${item.lote}</td><td>${item.caducidad}</td><td><span class="status-tag ${cad.className}">${cad.label}</span></td><td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-mayoreo-inventory-btn" data-id="${item.id}">Editar</button><button class="btn btn-danger small-btn delete-mayoreo-inventory-btn" data-id="${item.id}">Borrar</button></div></td></tr>`; }).join('') || '<tr><td colspan="9" class="muted">No hay productos.</td></tr>'}
          </tbody></table></div>
        </article>
        <article class="card">
          <h3>${editing ? 'Editar producto mayoreo' : 'Alta producto mayoreo'}</h3>
          <p class="muted">Manejo de cajas, paquetes o piezas por volumen.</p>
          <form class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="mayoreoInvId" value="${editing?.id || ''}" />
            <div class="input-group"><label for="mayoreoInvNombre">Nombre</label><input id="mayoreoInvNombre" value="${editing?.nombre || ''}" /></div>
            <div class="input-group"><label for="mayoreoInvCategoria">Categoría</label><input id="mayoreoInvCategoria" value="${editing?.categoria || ''}" /></div>
            <div class="input-group"><label for="mayoreoInvTipo">Tipo</label><select id="mayoreoInvTipo"><option ${editing?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${editing?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${editing?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="mayoreoInvSku">SKU</label><input id="mayoreoInvSku" value="${editing?.sku || ''}" /></div>
            <div class="input-group"><label for="mayoreoInvBarcode">Código barras</label><input id="mayoreoInvBarcode" value="${editing?.barcode || ''}" /></div>
            <div class="input-group"><label for="mayoreoInvLote">Lote</label><input id="mayoreoInvLote" value="${editing?.lote || ''}" /></div>
            <div class="input-group"><label for="mayoreoInvCosto">Costo</label><input id="mayoreoInvCosto" type="number" min="0" step="0.01" value="${editing?.costo ?? ''}" /></div>
            <div class="input-group"><label for="mayoreoInvPrecio">Precio mayoreo</label><input id="mayoreoInvPrecio" type="number" min="0" step="0.01" value="${editing?.precio ?? ''}" /></div>
            <div class="input-group"><label for="mayoreoInvStock">Stock</label><input id="mayoreoInvStock" type="number" min="0" value="${editing?.stock ?? ''}" /></div>
            <div class="input-group"><label for="mayoreoInvStockMin">Stock mínimo</label><input id="mayoreoInvStockMin" type="number" min="0" value="${editing?.stockMinimo ?? ''}" /></div>
            <div class="input-group"><label for="mayoreoInvCaducidad">Caducidad</label><input id="mayoreoInvCaducidad" type="date" value="${editing?.caducidad || ''}" /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveMayoreoInventoryBtn">${editing ? 'Guardar cambios' : 'Guardar producto'}</button><button class="btn btn-secondary" id="resetMayoreoInventoryBtn">Limpiar formulario</button></div>
        </article>
      </section>
    </div>`;
}
export function bindMayoreoInventario(render) {
  document.getElementById('mayoreoInventorySearch')?.addEventListener('input', e => { state.mayoreoInventoryQuery = e.target.value; render(); });
  document.getElementById('clearMayoreoInventorySearchBtn')?.addEventListener('click', () => { state.mayoreoInventoryQuery = ''; render(); });
  document.getElementById('newMayoreoInventoryBtn')?.addEventListener('click', () => { state.editingMayoreoInventoryId = ''; render(); });
  document.getElementById('resetMayoreoInventoryBtn')?.addEventListener('click', () => { state.editingMayoreoInventoryId = ''; render(); });
  document.querySelectorAll('.edit-mayoreo-inventory-btn').forEach(btn => btn.addEventListener('click', () => { state.editingMayoreoInventoryId = btn.dataset.id; render(); }));
  document.querySelectorAll('.delete-mayoreo-inventory-btn').forEach(btn => btn.addEventListener('click', () => { saveItems(getItems().filter(i => i.id !== btn.dataset.id)); if (state.editingMayoreoInventoryId === btn.dataset.id) state.editingMayoreoInventoryId=''; render(); showToast('Producto mayoreo eliminado.'); }));
  document.getElementById('saveMayoreoInventoryBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('mayoreoInvId').value || `miv_${Date.now()}`,
      nombre: document.getElementById('mayoreoInvNombre').value.trim(),
      categoria: document.getElementById('mayoreoInvCategoria').value.trim(),
      tipo: document.getElementById('mayoreoInvTipo').value,
      sku: document.getElementById('mayoreoInvSku').value.trim(),
      barcode: document.getElementById('mayoreoInvBarcode').value.trim(),
      lote: document.getElementById('mayoreoInvLote').value.trim(),
      costo: Number(document.getElementById('mayoreoInvCosto').value || 0),
      precio: Number(document.getElementById('mayoreoInvPrecio').value || 0),
      stock: Number(document.getElementById('mayoreoInvStock').value || 0),
      stockMinimo: Number(document.getElementById('mayoreoInvStockMin').value || 0),
      caducidad: document.getElementById('mayoreoInvCaducidad').value
    };
    if (!payload.nombre || !payload.sku || !payload.lote || !payload.caducidad) return showToast('Completa nombre, SKU, lote y caducidad.');
    const items = getItems();
    const exists = items.some(i => i.id === payload.id);
    saveItems(exists ? items.map(i => i.id === payload.id ? payload : i) : [...items, payload]);
    state.editingMayoreoInventoryId = '';
    render();
    showToast(exists ? 'Producto mayoreo actualizado.' : 'Producto mayoreo guardado.');
  });
}
