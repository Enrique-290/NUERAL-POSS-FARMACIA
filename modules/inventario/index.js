import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, inventoryStats } from '../../core/helpers.js';
import { showToast } from '../../core/ui.js';

function getInventory() {
  return load(STORAGE_KEYS.INVENTORY, []);
}

function saveInventory(items) {
  save(STORAGE_KEYS.INVENTORY, items);
}

function editingItem() {
  return getInventory().find(i => i.id === state.editingInventoryId) || null;
}

export function render() {
  const inventory = getInventory();
  const q = state.inventoryQuery.trim().toLowerCase();
  const filtered = !q ? inventory : inventory.filter(item => item.nombre.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.barcode.toLowerCase().includes(q) || item.lote.toLowerCase().includes(q));
  const stats = inventoryStats(inventory);
  const editing = editingItem();
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos</div><div class="kpi-value">${stats.total}</div><div class="kpi-meta">Alta, edición y control</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${stats.bajos}</div><div class="kpi-meta">Comparado contra mínimo</div></article>
        <article class="card"><div class="muted">Próximos a caducar</div><div class="kpi-value">${stats.proximos}</div><div class="kpi-meta">Color amarillo</div></article>
        <article class="card"><div class="muted">Vencidos</div><div class="kpi-value">${stats.vencidos}</div><div class="kpi-meta">Color rojo</div></article>
      </section>
      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div><h3 style="margin:0;">Inventario v1</h3><p class="muted" style="margin:6px 0 0;">Con lote, caducidad, stock mínimo y colores visuales.</p></div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearInventorySearchBtn">Limpiar</button><button class="btn btn-primary" id="newInventoryBtn">Nuevo producto</button></div>
          </div>
          <div class="input-group" style="margin-bottom:16px;"><label for="inventorySearch">Buscar producto</label><input id="inventorySearch" placeholder="Ej. paracetamol, 75020001, lote" value="${state.inventoryQuery}" /></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>SKU</th><th>Tipo</th><th>Stock</th><th>Mínimo</th><th>Lote</th><th>Caducidad</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
              ${filtered.map(item => { const cad = inventoryStatus(item); const stk = stockStatus(item); return `
                <tr>
                  <td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${item.nombre.slice(0,2).toUpperCase()}</div><div><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">$${Number(item.precio).toFixed(2)} · ${item.categoria}</div></div></div></td>
                  <td>${item.sku}</td><td>${item.tipo}</td><td><span class="status-tag ${stk.className}">${item.stock}</span></td><td>${item.stockMinimo}</td><td>${item.lote}</td><td>${item.caducidad}</td><td><span class="status-tag ${cad.className}">${cad.label}</span></td>
                  <td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-inventory-btn" data-id="${item.id}">Editar</button><button class="btn btn-secondary small-btn delete-inventory-btn" data-id="${item.id}">Borrar</button></div></td>
                </tr>`; }).join('') || `<tr><td colspan="9" class="muted">No se encontraron productos.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
        <article class="card">
          <h3>${editing ? 'Editar producto' : 'Alta de producto'}</h3>
          <p class="muted">Formulario listo para seguir creciendo sin romper la estructura.</p>
          <form id="inventoryForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="inventoryId" value="${editing?.id || ''}" />
            <div class="input-group"><label for="invNombre">Nombre</label><input id="invNombre" value="${editing?.nombre || ''}" required /></div>
            <div class="input-group"><label for="invCategoria">Categoría</label><input id="invCategoria" value="${editing?.categoria || ''}" placeholder="Genérico, Pediatría..." required /></div>
            <div class="input-group"><label for="invTipo">Tipo</label><select id="invTipo"><option ${editing?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${editing?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${editing?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="invSku">SKU</label><input id="invSku" value="${editing?.sku || ''}" required /></div>
            <div class="input-group"><label for="invBarcode">Código barras</label><input id="invBarcode" value="${editing?.barcode || ''}" required /></div>
            <div class="input-group"><label for="invLote">Lote</label><input id="invLote" value="${editing?.lote || ''}" required /></div>
            <div class="input-group"><label for="invCosto">Costo</label><input id="invCosto" type="number" min="0" step="0.01" value="${editing?.costo ?? ''}" required /></div>
            <div class="input-group"><label for="invPrecio">Precio</label><input id="invPrecio" type="number" min="0" step="0.01" value="${editing?.precio ?? ''}" required /></div>
            <div class="input-group"><label for="invStock">Stock</label><input id="invStock" type="number" min="0" value="${editing?.stock ?? ''}" required /></div>
            <div class="input-group"><label for="invStockMin">Stock mínimo</label><input id="invStockMin" type="number" min="0" value="${editing?.stockMinimo ?? ''}" required /></div>
            <div class="input-group"><label for="invCaducidad">Caducidad</label><input id="invCaducidad" type="date" value="${editing?.caducidad || ''}" required /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveInventoryBtn">${editing ? 'Guardar cambios' : 'Guardar producto'}</button><button class="btn btn-secondary" id="resetInventoryBtn">Limpiar formulario</button></div>
          <div class="status-list" style="margin-top:18px;"><div class="status-item"><span>Verde</span><span class="status-tag ok">Vigente</span></div><div class="status-item"><span>Amarillo</span><span class="status-tag warn">Próximo a caducar</span></div><div class="status-item"><span>Rojo</span><span class="status-tag danger">Vencido o stock bajo</span></div></div>
        </article>
      </section>
    </div>`;
}

export function bind({ rerender }) {
  document.getElementById('inventorySearch')?.addEventListener('input', e => { state.inventoryQuery = e.target.value; rerender(); });
  document.getElementById('clearInventorySearchBtn')?.addEventListener('click', () => { state.inventoryQuery = ''; rerender(); });
  document.getElementById('newInventoryBtn')?.addEventListener('click', () => { state.editingInventoryId = ''; rerender(); });
  document.getElementById('resetInventoryBtn')?.addEventListener('click', () => { state.editingInventoryId = ''; rerender(); });
  document.querySelectorAll('.edit-inventory-btn').forEach(btn => btn.addEventListener('click', () => { state.editingInventoryId = btn.dataset.id; rerender(); }));
  document.querySelectorAll('.delete-inventory-btn').forEach(btn => btn.addEventListener('click', () => { const items = getInventory().filter(i => i.id !== btn.dataset.id); saveInventory(items); if (state.editingInventoryId === btn.dataset.id) state.editingInventoryId = ''; rerender(); showToast('Producto eliminado.'); }));
  document.getElementById('saveInventoryBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('inventoryId').value || 'inv_' + Date.now(),
      nombre: document.getElementById('invNombre').value.trim(),
      categoria: document.getElementById('invCategoria').value.trim(),
      tipo: document.getElementById('invTipo').value,
      sku: document.getElementById('invSku').value.trim(),
      barcode: document.getElementById('invBarcode').value.trim(),
      lote: document.getElementById('invLote').value.trim(),
      costo: Number(document.getElementById('invCosto').value || 0),
      precio: Number(document.getElementById('invPrecio').value || 0),
      stock: Number(document.getElementById('invStock').value || 0),
      stockMinimo: Number(document.getElementById('invStockMin').value || 0),
      caducidad: document.getElementById('invCaducidad').value
    };
    if (!payload.nombre || !payload.categoria || !payload.sku || !payload.barcode || !payload.lote || !payload.caducidad) return showToast('Completa todos los campos del producto.');
    const items = getInventory();
    const exists = items.some(i => i.id === payload.id);
    saveInventory(exists ? items.map(i => i.id === payload.id ? payload : i) : [...items, payload]);
    state.editingInventoryId = '';
    rerender();
    showToast(exists ? 'Producto actualizado.' : 'Producto guardado.');
  });
}
