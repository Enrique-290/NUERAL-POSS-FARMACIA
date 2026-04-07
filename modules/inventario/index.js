import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, showToast } from '../../core/utils.js';

function getInventory() { return load(STORAGE_KEYS.INVENTORY, []); }
function saveInventory(items) { save(STORAGE_KEYS.INVENTORY, items); }
function stats(items) {
  const vencidos = items.filter(i => inventoryStatus(i).label === 'Vencido').length;
  const proximos = items.filter(i => inventoryStatus(i).label === 'Próximo').length;
  const bajos = items.filter(i => i.stock <= i.stockMinimo).length;
  return { total: items.length, vencidos, proximos, bajos };
}
function editing() { return getInventory().find(i => i.id === state.editingInventoryId) || null; }

export function renderInventario() {
  const inventory = getInventory();
  const q = state.inventoryQuery.trim().toLowerCase();
  const filtered = !q ? inventory : inventory.filter(item => item.nombre.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.barcode.toLowerCase().includes(q) || item.lote.toLowerCase().includes(q));
  const s = stats(inventory);
  const item = editing();
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Alta, edición y control</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">Comparado contra mínimo</div></article>
        <article class="card"><div class="muted">Próximos a caducar</div><div class="kpi-value">${s.proximos}</div><div class="kpi-meta">Color amarillo</div></article>
        <article class="card"><div class="muted">Vencidos</div><div class="kpi-value">${s.vencidos}</div><div class="kpi-meta">Color rojo</div></article>
      </section>
      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row"><div><h3 style="margin:0;">Inventario v1</h3><p class="muted" style="margin:6px 0 0;">Con lote, caducidad, stock mínimo y colores visuales.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearInventorySearchBtn">Limpiar</button><button class="btn btn-primary" id="newInventoryBtn">Nuevo producto</button></div></div>
          <div class="input-group" style="margin-bottom:16px;"><label for="inventorySearch">Buscar producto</label><input id="inventorySearch" placeholder="Ej. paracetamol, 75020001, lote" value="${state.inventoryQuery}" /></div>
          <div class="table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Tipo</th><th>Stock</th><th>Mínimo</th><th>Lote</th><th>Caducidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            ${filtered.map(i => { const cad = inventoryStatus(i); const stk = stockStatus(i); return `<tr><td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${i.nombre.slice(0,2).toUpperCase()}</div><div><div style="font-weight:700;">${i.nombre}</div><div class="muted" style="font-size:.85rem;">$${Number(i.precio).toFixed(2)} · ${i.categoria}</div></div></div></td><td>${i.sku}</td><td>${i.tipo}</td><td><span class="status-tag ${stk.className}">${i.stock}</span></td><td>${i.stockMinimo}</td><td>${i.lote}</td><td>${i.caducidad}</td><td><span class="status-tag ${cad.className}">${cad.label}</span></td><td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-inventory-btn" data-id="${i.id}">Editar</button><button class="btn btn-danger small-btn delete-inventory-btn" data-id="${i.id}">Borrar</button></div></td></tr>`; }).join('') || `<tr><td colspan="9" class="muted">No se encontraron productos.</td></tr>`}
          </tbody></table></div>
        </article>
        <article class="card">
          <h3>${item ? 'Editar producto' : 'Alta de producto'}</h3>
          <p class="muted">Formulario base de inventario para farmacia.</p>
          <form id="inventoryForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="inventoryId" value="${item?.id || ''}" />
            <div class="input-group"><label for="invNombre">Nombre</label><input id="invNombre" value="${item?.nombre || ''}" required /></div>
            <div class="input-group"><label for="invCategoria">Categoría</label><input id="invCategoria" value="${item?.categoria || ''}" required /></div>
            <div class="input-group"><label for="invTipo">Tipo</label><select id="invTipo"><option ${item?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${item?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${item?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="invSku">SKU</label><input id="invSku" value="${item?.sku || ''}" required /></div>
            <div class="input-group"><label for="invBarcode">Código barras</label><input id="invBarcode" value="${item?.barcode || ''}" required /></div>
            <div class="input-group"><label for="invLote">Lote</label><input id="invLote" value="${item?.lote || ''}" required /></div>
            <div class="input-group"><label for="invCosto">Costo</label><input id="invCosto" type="number" min="0" step="0.01" value="${item?.costo ?? ''}" required /></div>
            <div class="input-group"><label for="invPrecio">Precio</label><input id="invPrecio" type="number" min="0" step="0.01" value="${item?.precio ?? ''}" required /></div>
            <div class="input-group"><label for="invStock">Stock</label><input id="invStock" type="number" min="0" value="${item?.stock ?? ''}" required /></div>
            <div class="input-group"><label for="invStockMin">Stock mínimo</label><input id="invStockMin" type="number" min="0" value="${item?.stockMinimo ?? ''}" required /></div>
            <div class="input-group"><label for="invCaducidad">Caducidad</label><input id="invCaducidad" type="date" value="${item?.caducidad || ''}" required /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveInventoryBtn">${item ? 'Guardar cambios' : 'Guardar producto'}</button><button class="btn btn-secondary" id="resetInventoryBtn">Limpiar formulario</button></div>
          <div class="status-list" style="margin-top:18px;"><div class="status-item"><span>Verde</span><span class="status-tag ok">Vigente</span></div><div class="status-item"><span>Amarillo</span><span class="status-tag warn">Próximo a caducar</span></div><div class="status-item"><span>Rojo</span><span class="status-tag danger">Vencido o stock bajo</span></div></div>
        </article>
      </section>
    </div>
  `;
}

export function bindInventario(render) {
  document.getElementById('inventorySearch')?.addEventListener('input', e => { state.inventoryQuery = e.target.value; render(); });
  document.getElementById('clearInventorySearchBtn')?.addEventListener('click', () => { state.inventoryQuery = ''; render(); });
  document.getElementById('newInventoryBtn')?.addEventListener('click', () => { state.editingInventoryId = ''; render(); });
  document.getElementById('resetInventoryBtn')?.addEventListener('click', () => { state.editingInventoryId = ''; render(); });
  document.querySelectorAll('.edit-inventory-btn').forEach(btn => btn.addEventListener('click', () => { state.editingInventoryId = btn.dataset.id; render(); }));
  document.querySelectorAll('.delete-inventory-btn').forEach(btn => btn.addEventListener('click', () => { saveInventory(getInventory().filter(i => i.id !== btn.dataset.id)); if (state.editingInventoryId === btn.dataset.id) state.editingInventoryId = ''; render(); showToast('Producto eliminado.'); }));
  document.getElementById('saveInventoryBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('inventoryId').value || `inv_${Date.now()}`,
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
    render();
    showToast(exists ? 'Producto actualizado.' : 'Producto guardado.');
  });
}
