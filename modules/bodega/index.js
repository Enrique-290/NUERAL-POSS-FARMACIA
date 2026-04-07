import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, showToast } from '../../core/utils.js';
import { addInventoryMovement } from '../../core/movements.js';

function getBodega() { return load(STORAGE_KEYS.BODEGA, []); }
function saveBodega(items) { save(STORAGE_KEYS.BODEGA, items); }
function getInventory() { return load(STORAGE_KEYS.INVENTORY, []); }
function saveInventory(items) { save(STORAGE_KEYS.INVENTORY, items); }
function editing() { return getBodega().find(i => i.id === state.editingBodegaId) || null; }
function stats(items) {
  const bajos = items.filter(i => i.stock <= i.stockMinimo).length;
  const proximos = items.filter(i => inventoryStatus(i).label === 'Próximo').length;
  return { total: items.length, bajos, proximos, piezas: items.reduce((a, i) => a + Number(i.stock || 0), 0) };
}

export function renderBodega() {
  const items = getBodega();
  const q = state.bodegaQuery.trim().toLowerCase();
  const filtered = !q ? items : items.filter(item => item.nombre.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.lote.toLowerCase().includes(q));
  const s = stats(items);
  const item = editing();
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos en bodega</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Reserva separada del piso</div></article>
        <article class="card"><div class="muted">Piezas totales</div><div class="kpi-value">${s.piezas}</div><div class="kpi-meta">Existencia global de respaldo</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">Por debajo del mínimo</div></article>
        <article class="card"><div class="muted">Próximos a caducar</div><div class="kpi-value">${s.proximos}</div><div class="kpi-meta">Revisar surtido</div></article>
      </section>
      <section class="bodega-grid">
        <article class="card">
          <div class="toolbar-row"><div><h3 style="margin:0;">Bodega v1</h3><p class="muted" style="margin:6px 0 0;">Reserva separada y surtido manual hacia inventario.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearBodegaSearchBtn">Limpiar</button><button class="btn btn-primary" id="newBodegaBtn">Nuevo en bodega</button></div></div>
          <div class="input-group" style="margin-bottom:16px;"><label for="bodegaSearch">Buscar producto</label><input id="bodegaSearch" placeholder="Ej. omeprazol, lote" value="${state.bodegaQuery}" /></div>
          <div class="table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Mínimo</th><th>Lote</th><th>Caducidad</th><th>Estado</th><th>Surtir</th><th>Acciones</th></tr></thead><tbody>
            ${filtered.map(i => { const cad = inventoryStatus(i); const stk = stockStatus(i); return `<tr><td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${i.nombre.slice(0,2).toUpperCase()}</div><div><div style="font-weight:700;">${i.nombre}</div><div class="muted" style="font-size:.85rem;">${i.categoria}</div></div></div></td><td>${i.sku}</td><td><span class="status-tag ${stk.className}">${i.stock}</span></td><td>${i.stockMinimo}</td><td>${i.lote}</td><td>${i.caducidad}</td><td><span class="status-tag ${cad.className}">${cad.label}</span></td><td><div style="display:flex; gap:8px; align-items:center;"><input class="surte-qty" data-id="${i.id}" type="number" min="1" max="${i.stock}" value="1" style="width:74px; padding:9px 10px;" /><button class="btn btn-primary small-btn surte-btn" data-id="${i.id}">Mover</button></div></td><td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-bodega-btn" data-id="${i.id}">Editar</button><button class="btn btn-danger small-btn delete-bodega-btn" data-id="${i.id}">Borrar</button></div></td></tr>`; }).join('') || `<tr><td colspan="9" class="muted">No se encontraron productos.</td></tr>`}
          </tbody></table></div>
        </article>
        <article class="card">
          <h3>${item ? 'Editar bodega' : 'Alta en bodega'}</h3>
          <p class="muted">Este módulo mantiene reserva separada y no vende directo desde bodega.</p>
          <form class="bodega-form-grid" id="bodegaForm" style="margin-top:14px;">
            <input type="hidden" id="bodegaId" value="${item?.id || ''}" />
            <div class="input-group"><label for="bodNombre">Nombre</label><input id="bodNombre" value="${item?.nombre || ''}" required /></div>
            <div class="input-group"><label for="bodCategoria">Categoría</label><input id="bodCategoria" value="${item?.categoria || ''}" required /></div>
            <div class="input-group"><label for="bodSku">SKU</label><input id="bodSku" value="${item?.sku || ''}" required /></div>
            <div class="input-group"><label for="bodLote">Lote</label><input id="bodLote" value="${item?.lote || ''}" required /></div>
            <div class="input-group"><label for="bodStock">Stock</label><input id="bodStock" type="number" min="0" value="${item?.stock ?? ''}" required /></div>
            <div class="input-group"><label for="bodStockMin">Stock mínimo</label><input id="bodStockMin" type="number" min="0" value="${item?.stockMinimo ?? ''}" required /></div>
            <div class="input-group"><label for="bodCaducidad">Caducidad</label><input id="bodCaducidad" type="date" value="${item?.caducidad || ''}" required /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveBodegaBtn">${item ? 'Guardar cambios' : 'Guardar en bodega'}</button><button class="btn btn-secondary" id="resetBodegaBtn">Limpiar formulario</button></div>
          <div class="status-list" style="margin-top:18px;"><div class="status-item"><span>Función clave</span><span class="status-tag soft-blue">Surtir a inventario</span></div><div class="status-item"><span>Regla</span><span class="status-tag warn">No vende directo</span></div><div class="status-item"><span>Control</span><span class="status-tag ok">Reserva separada</span></div></div>
        </article>
      </section>
    </div>
  `;
}

export function bindBodega(render) {
  document.getElementById('bodegaSearch')?.addEventListener('input', e => { state.bodegaQuery = e.target.value; render(); });
  document.getElementById('clearBodegaSearchBtn')?.addEventListener('click', () => { state.bodegaQuery = ''; render(); });
  document.getElementById('newBodegaBtn')?.addEventListener('click', () => { state.editingBodegaId = ''; render(); });
  document.getElementById('resetBodegaBtn')?.addEventListener('click', () => { state.editingBodegaId = ''; render(); });
  document.querySelectorAll('.edit-bodega-btn').forEach(btn => btn.addEventListener('click', () => { state.editingBodegaId = btn.dataset.id; render(); }));
  document.querySelectorAll('.delete-bodega-btn').forEach(btn => btn.addEventListener('click', () => { saveBodega(getBodega().filter(i => i.id !== btn.dataset.id)); if (state.editingBodegaId === btn.dataset.id) state.editingBodegaId = ''; render(); showToast('Producto eliminado de bodega.'); }));
  document.getElementById('saveBodegaBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('bodegaId').value || `bod_${Date.now()}`,
      nombre: document.getElementById('bodNombre').value.trim(),
      categoria: document.getElementById('bodCategoria').value.trim(),
      sku: document.getElementById('bodSku').value.trim(),
      lote: document.getElementById('bodLote').value.trim(),
      stock: Number(document.getElementById('bodStock').value || 0),
      stockMinimo: Number(document.getElementById('bodStockMin').value || 0),
      caducidad: document.getElementById('bodCaducidad').value
    };
    if (!payload.nombre || !payload.categoria || !payload.sku || !payload.lote || !payload.caducidad) return showToast('Completa todos los campos de bodega.');
    const items = getBodega();
    const exists = items.some(i => i.id === payload.id);
    saveBodega(exists ? items.map(i => i.id === payload.id ? payload : i) : [...items, payload]);
    state.editingBodegaId = '';
    render();
    showToast(exists ? 'Producto de bodega actualizado.' : 'Producto agregado a bodega.');
  });
  document.querySelectorAll('.surte-btn').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const qtyInput = document.querySelector(`.surte-qty[data-id="${id}"]`);
    const qty = Math.max(1, Number(qtyInput?.value || 1));
    const bodega = getBodega();
    const item = bodega.find(i => i.id === id);
    if (!item) return;
    if (qty > item.stock) return showToast('La cantidad supera el stock en bodega.');
    const inventory = getInventory();
    const invIndex = inventory.findIndex(i => i.sku === item.sku || i.nombre === item.nombre);
    if (invIndex >= 0) {
      inventory[invIndex] = { ...inventory[invIndex], stock: Number(inventory[invIndex].stock) + qty };
    } else {
      inventory.push({ id: `inv_${Date.now()}`, sku: item.sku, barcode: item.sku, nombre: item.nombre, categoria: item.categoria, tipo: 'Genérico', costo: 0, precio: 0, stock: qty, stockMinimo: item.stockMinimo, lote: item.lote, caducidad: item.caducidad });
    }
    saveInventory(inventory);
    saveBodega(bodega.map(x => x.id === id ? { ...x, stock: x.stock - qty } : x));
    const target = inventory.find(x => x.sku === item.sku || x.nombre === item.nombre);
    addInventoryMovement({
      productoId: target?.id || '',
      producto: item.nombre,
      sku: item.sku,
      lote: item.lote,
      tipo: 'surtido',
      cantidad: qty,
      signo: '+',
      modulo: 'bodega',
      nota: 'Surtido desde bodega'
    });
    render();
    showToast(`Se movieron ${qty} piezas a inventario.`);
  }));
}
