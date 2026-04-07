import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, showToast } from '../../core/utils.js';
import { addInventoryMovement, getInventoryMovements } from '../../core/movements.js';

function getBodega() { return load(STORAGE_KEYS.BODEGA, []); }
function saveBodega(items) { save(STORAGE_KEYS.BODEGA, items); }
function getInventory() { return load(STORAGE_KEYS.INVENTORY, []); }
function saveInventory(items) { save(STORAGE_KEYS.INVENTORY, items); }
function editing() { return getBodega().find(i => i.id === state.editingBodegaId) || null; }

function normalizeBodega(item = {}) {
  return {
    id: item.id || `bod_${Date.now()}`,
    nombre: item.nombre || '',
    categoria: item.categoria || '',
    tipo: item.tipo || 'Genérico',
    sku: item.sku || '',
    barcode: item.barcode || item.sku || '',
    presentacion: item.presentacion || '',
    marca: item.marca || '',
    descripcion: item.descripcion || '',
    costo: Number(item.costo || 0),
    precio: Number(item.precio || 0),
    stock: Number(item.stock || 0),
    stockMinimo: Number(item.stockMinimo || 0),
    lote: item.lote || '',
    caducidad: item.caducidad || '',
    activo: item.activo !== false
  };
}

function allBodega() {
  const items = getBodega().map(normalizeBodega);
  const migrated = JSON.stringify(items) !== JSON.stringify(getBodega());
  if (migrated) saveBodega(items);
  return items;
}

function stats(items) {
  const bajos = items.filter(i => i.stock <= i.stockMinimo).length;
  const proximos = items.filter(i => inventoryStatus(i).label === 'Próximo').length;
  const vencidos = items.filter(i => inventoryStatus(i).label === 'Vencido').length;
  return {
    total: items.length,
    bajos,
    proximos,
    vencidos,
    piezas: items.reduce((a, i) => a + Number(i.stock || 0), 0)
  };
}

function applyFilters(items) {
  const q = (state.bodegaQuery || '').trim().toLowerCase();
  let out = !q ? items : items.filter(item => [item.nombre, item.sku, item.barcode, item.lote, item.categoria, item.presentacion, item.marca].join(' ').toLowerCase().includes(q));
  if (state.bodegaStockFilter === 'bajo') out = out.filter(i => i.stock <= i.stockMinimo && i.stock > 0);
  if (state.bodegaStockFilter === 'agotado') out = out.filter(i => i.stock <= 0);
  if (state.bodegaStockFilter === 'ok') out = out.filter(i => i.stock > i.stockMinimo);
  if (state.bodegaCaducidadFilter === 'vigente') out = out.filter(i => inventoryStatus(i).label === 'Vigente');
  if (state.bodegaCaducidadFilter === 'proximo') out = out.filter(i => inventoryStatus(i).label === 'Próximo');
  if (state.bodegaCaducidadFilter === 'vencido') out = out.filter(i => inventoryStatus(i).label === 'Vencido');
  return out;
}

function getBodegaMovements(sku = '') {
  return getInventoryMovements().filter(m => m.modulo === 'bodega' || m.tipo === 'surtido').filter(m => !sku || m.sku === sku).slice(0, 20);
}

export function renderBodega() {
  const items = allBodega();
  const filtered = applyFilters(items);
  const s = stats(items);
  const item = editing();
  const movementSku = state.bodegaMovementSku || item?.sku || filtered[0]?.sku || items[0]?.sku || '';
  const movements = getBodegaMovements(movementSku);

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos en bodega</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Reserva separada del piso</div></article>
        <article class="card"><div class="muted">Piezas totales</div><div class="kpi-value">${s.piezas}</div><div class="kpi-meta">Existencia global de respaldo</div></article>
        <article class="card"><div class="muted">Stock bajo / agotado</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">Requieren reposición o revisión</div></article>
        <article class="card"><div class="muted">Próximos / vencidos</div><div class="kpi-value">${s.proximos + s.vencidos}</div><div class="kpi-meta">Próximos ${s.proximos} · vencidos ${s.vencidos}</div></article>
      </section>

      <section class="bodega-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Bodega PRO v2</h3>
              <p class="muted" style="margin:6px 0 0;">Reserva separada, surtido a inventario y control de trazabilidad.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearBodegaSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newBodegaBtn">Nuevo en bodega</button>
            </div>
          </div>

          <div class="grid grid-3" style="margin-bottom:16px; gap:12px;">
            <div class="input-group"><label for="bodegaSearch">Buscar</label><input id="bodegaSearch" placeholder="Nombre, SKU, código, lote, marca" value="${state.bodegaQuery || ''}" /></div>
            <div class="input-group"><label for="bodegaStockFilter">Filtro stock</label><select id="bodegaStockFilter"><option value="todos" ${state.bodegaStockFilter === 'todos' ? 'selected' : ''}>Todos</option><option value="bajo" ${state.bodegaStockFilter === 'bajo' ? 'selected' : ''}>Stock bajo</option><option value="agotado" ${state.bodegaStockFilter === 'agotado' ? 'selected' : ''}>Agotados</option><option value="ok" ${state.bodegaStockFilter === 'ok' ? 'selected' : ''}>Stock ok</option></select></div>
            <div class="input-group"><label for="bodegaCaducidadFilter">Filtro caducidad</label><select id="bodegaCaducidadFilter"><option value="todos" ${state.bodegaCaducidadFilter === 'todos' ? 'selected' : ''}>Todos</option><option value="vigente" ${state.bodegaCaducidadFilter === 'vigente' ? 'selected' : ''}>Vigentes</option><option value="proximo" ${state.bodegaCaducidadFilter === 'proximo' ? 'selected' : ''}>Próximos</option><option value="vencido" ${state.bodegaCaducidadFilter === 'vencido' ? 'selected' : ''}>Vencidos</option></select></div>
          </div>

          <div class="table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Mínimo</th><th>Lote</th><th>Caducidad</th><th>Estado</th><th>Surtir</th><th>Acciones</th></tr></thead><tbody>
            ${filtered.map(i => {
              const cad = inventoryStatus(i); const stk = stockStatus(i);
              return `<tr>
                <td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${i.nombre.slice(0,2).toUpperCase()}</div><div><div style="font-weight:700;">${i.nombre}</div><div class="muted" style="font-size:.85rem;">${i.categoria}${i.marca ? ` · ${i.marca}` : ''}</div></div></div></td>
                <td>${i.sku}</td>
                <td><span class="status-tag ${stk.className}">${i.stock}</span></td>
                <td>${i.stockMinimo}</td>
                <td>${i.lote}</td>
                <td>${i.caducidad}</td>
                <td><span class="status-tag ${cad.className}">${cad.label}</span></td>
                <td><div style="display:flex; gap:8px; align-items:center;"><input class="surte-qty" data-id="${i.id}" type="number" min="1" max="${i.stock}" value="1" style="width:74px; padding:9px 10px;" /><button class="btn btn-primary small-btn surte-btn" data-id="${i.id}">Mover</button></div></td>
                <td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-bodega-btn" data-id="${i.id}">Editar</button><button class="btn btn-secondary small-btn movs-bodega-btn" data-sku="${i.sku}">Movs</button><button class="btn btn-danger small-btn delete-bodega-btn" data-id="${i.id}">Borrar</button></div></td>
              </tr>`;
            }).join('') || `<tr><td colspan="9" class="muted">No se encontraron productos.</td></tr>`}
          </tbody></table></div>
        </article>

        <article class="card">
          <h3>${item ? 'Editar bodega' : 'Alta en bodega'}</h3>
          <p class="muted">Bodega no vende directo. Solo recibe compra y surte hacia inventario.</p>
          <form class="bodega-form-grid" id="bodegaForm" style="margin-top:14px;">
            <input type="hidden" id="bodegaId" value="${item?.id || ''}" />
            <div class="input-group"><label for="bodNombre">Nombre</label><input id="bodNombre" value="${item?.nombre || ''}" required /></div>
            <div class="input-group"><label for="bodCategoria">Categoría</label><input id="bodCategoria" value="${item?.categoria || ''}" required /></div>
            <div class="input-group"><label for="bodTipo">Tipo</label><select id="bodTipo"><option ${item?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${item?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${item?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="bodSku">SKU</label><input id="bodSku" value="${item?.sku || ''}" required /></div>
            <div class="input-group"><label for="bodBarcode">Código barras</label><input id="bodBarcode" value="${item?.barcode || item?.sku || ''}" /></div>
            <div class="input-group"><label for="bodLote">Lote</label><input id="bodLote" value="${item?.lote || ''}" required /></div>
            <div class="input-group"><label for="bodPresentacion">Presentación</label><input id="bodPresentacion" value="${item?.presentacion || ''}" /></div>
            <div class="input-group"><label for="bodMarca">Marca / laboratorio</label><input id="bodMarca" value="${item?.marca || ''}" /></div>
            <div class="input-group"><label for="bodCosto">Costo</label><input id="bodCosto" type="number" min="0" step="0.01" value="${item?.costo ?? ''}" /></div>
            <div class="input-group"><label for="bodPrecio">Precio</label><input id="bodPrecio" type="number" min="0" step="0.01" value="${item?.precio ?? ''}" /></div>
            <div class="input-group"><label for="bodStock">Stock</label><input id="bodStock" type="number" min="0" value="${item?.stock ?? ''}" required /></div>
            <div class="input-group"><label for="bodStockMin">Stock mínimo</label><input id="bodStockMin" type="number" min="0" value="${item?.stockMinimo ?? ''}" required /></div>
            <div class="input-group"><label for="bodCaducidad">Caducidad</label><input id="bodCaducidad" type="date" value="${item?.caducidad || ''}" required /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="bodDescripcion">Descripción</label><input id="bodDescripcion" value="${item?.descripcion || ''}" placeholder="Notas del producto o empaque" /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveBodegaBtn">${item ? 'Guardar cambios' : 'Guardar en bodega'}</button><button class="btn btn-secondary" id="resetBodegaBtn">Limpiar formulario</button></div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Función clave</span><span class="status-tag soft-blue">Surtir a inventario</span></div>
            <div class="status-item"><span>Regla</span><span class="status-tag warn">No vende directo</span></div>
            <div class="status-item"><span>Control</span><span class="status-tag ok">Historial de movimientos</span></div>
          </div>

          <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:10px;"><h3 style="margin:0;">Movimientos de bodega</h3><div class="pill" style="padding:8px 12px;">${movementSku || 'Sin producto seleccionado'}</div></div>
            <div class="status-list">
              ${movements.length ? movements.map(m => `<div class="status-item"><div><div style="font-weight:700;">${m.producto || 'Producto'}</div><div class="muted" style="font-size:.85rem;">${new Date(m.fecha).toLocaleString('es-MX')} · ${m.tipo} · ${m.modulo}</div></div><div style="text-align:right;"><div class="status-tag ${m.signo === '-' ? 'danger' : 'soft-blue'}">${m.signo}${m.cantidad}</div><div class="muted" style="font-size:.82rem; margin-top:4px;">${m.nota || ''}</div></div></div>`).join('') : `<div class="status-item"><span class="muted">Aún no hay movimientos para este producto.</span></div>`}
            </div>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindBodega(render) {
  document.getElementById('bodegaSearch')?.addEventListener('input', e => { state.bodegaQuery = e.target.value; render(); });
  document.getElementById('bodegaStockFilter')?.addEventListener('change', e => { state.bodegaStockFilter = e.target.value; render(); });
  document.getElementById('bodegaCaducidadFilter')?.addEventListener('change', e => { state.bodegaCaducidadFilter = e.target.value; render(); });
  document.getElementById('clearBodegaSearchBtn')?.addEventListener('click', () => { state.bodegaQuery = ''; state.bodegaStockFilter = 'todos'; state.bodegaCaducidadFilter = 'todos'; render(); });
  document.getElementById('newBodegaBtn')?.addEventListener('click', () => { state.editingBodegaId = ''; render(); });
  document.getElementById('resetBodegaBtn')?.addEventListener('click', () => { state.editingBodegaId = ''; render(); });
  document.querySelectorAll('.edit-bodega-btn').forEach(btn => btn.addEventListener('click', () => { state.editingBodegaId = btn.dataset.id; render(); }));
  document.querySelectorAll('.movs-bodega-btn').forEach(btn => btn.addEventListener('click', () => { state.bodegaMovementSku = btn.dataset.sku; render(); }));
  document.querySelectorAll('.delete-bodega-btn').forEach(btn => btn.addEventListener('click', () => {
    saveBodega(allBodega().filter(i => i.id !== btn.dataset.id));
    if (state.editingBodegaId === btn.dataset.id) state.editingBodegaId = '';
    render();
    showToast('Producto eliminado de bodega.');
  }));

  document.getElementById('saveBodegaBtn')?.addEventListener('click', () => {
    const payload = normalizeBodega({
      id: document.getElementById('bodegaId').value || `bod_${Date.now()}`,
      nombre: document.getElementById('bodNombre').value.trim(),
      categoria: document.getElementById('bodCategoria').value.trim(),
      tipo: document.getElementById('bodTipo').value,
      sku: document.getElementById('bodSku').value.trim(),
      barcode: document.getElementById('bodBarcode').value.trim(),
      lote: document.getElementById('bodLote').value.trim(),
      presentacion: document.getElementById('bodPresentacion').value.trim(),
      marca: document.getElementById('bodMarca').value.trim(),
      descripcion: document.getElementById('bodDescripcion').value.trim(),
      costo: document.getElementById('bodCosto').value,
      precio: document.getElementById('bodPrecio').value,
      stock: document.getElementById('bodStock').value,
      stockMinimo: document.getElementById('bodStockMin').value,
      caducidad: document.getElementById('bodCaducidad').value
    });

    if (!payload.nombre || !payload.categoria || !payload.sku || !payload.lote || !payload.caducidad) return showToast('Completa todos los campos obligatorios de bodega.');
    if (payload.stock < 0 || payload.stockMinimo < 0) return showToast('Stock y stock mínimo no pueden ser negativos.');
    if (payload.precio < payload.costo) return showToast('El precio no debe ser menor al costo.');

    const items = allBodega();
    const duplicateSku = items.some(i => i.id !== payload.id && i.sku === payload.sku && i.lote === payload.lote);
    if (duplicateSku) return showToast('Ya existe un producto con ese SKU y lote en bodega.');

    const exists = items.some(i => i.id === payload.id);
    saveBodega(exists ? items.map(i => i.id === payload.id ? payload : i) : [...items, payload]);
    if (!exists) {
      addInventoryMovement({ productoId: payload.id, producto: payload.nombre, sku: payload.sku, lote: payload.lote, tipo: 'alta_bodega', cantidad: payload.stock, signo: '+', modulo: 'bodega', nota: 'Alta inicial en bodega' });
    }
    state.editingBodegaId = '';
    state.bodegaMovementSku = payload.sku;
    render();
    showToast(exists ? 'Producto de bodega actualizado.' : 'Producto agregado a bodega.');
  });

  document.querySelectorAll('.surte-btn').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const qtyInput = document.querySelector(`.surte-qty[data-id="${id}"]`);
    const qty = Math.max(1, Number(qtyInput?.value || 1));
    const bodega = allBodega();
    const item = bodega.find(i => i.id === id);
    if (!item) return;
    if (qty > item.stock) return showToast('La cantidad supera el stock en bodega.');

    const inventory = load(STORAGE_KEYS.INVENTORY, []).map(i => ({ ...i }));
    const invIndex = inventory.findIndex(i => i.sku === item.sku && i.lote === item.lote);
    if (invIndex >= 0) {
      inventory[invIndex] = { ...inventory[invIndex], stock: Number(inventory[invIndex].stock) + qty };
    } else {
      inventory.push({
        id: `inv_${Date.now()}`,
        sku: item.sku,
        barcode: item.barcode || item.sku,
        nombre: item.nombre,
        categoria: item.categoria,
        tipo: item.tipo || 'Genérico',
        presentacion: item.presentacion || '',
        marca: item.marca || '',
        descripcion: item.descripcion || '',
        activo: true,
        costo: item.costo || 0,
        precio: item.precio || 0,
        stock: qty,
        stockMinimo: item.stockMinimo,
        lote: item.lote,
        caducidad: item.caducidad,
        visibleWeb: false,
        precioWeb: item.precio || 0,
        categoriaWeb: item.categoria || 'General',
        destacadoWeb: false
      });
    }
    saveInventory(inventory);
    saveBodega(bodega.map(x => x.id === id ? { ...x, stock: Math.max(0, Number(x.stock) - qty) } : x));
    const target = inventory.find(x => x.sku === item.sku && x.lote === item.lote) || inventory.find(x => x.sku === item.sku);
    addInventoryMovement({ productoId: target?.id || '', producto: item.nombre, sku: item.sku, lote: item.lote, tipo: 'surtido', cantidad: qty, signo: '+', modulo: 'bodega', nota: 'Surtido desde bodega' });
    state.bodegaMovementSku = item.sku;
    render();
    showToast(`Se movieron ${qty} piezas a inventario.`);
  }));
}
