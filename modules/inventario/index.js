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

function editing() {
  return getInventory().find(i => i.id === state.editingInventoryId) || null;
}

function adjustmentItem() {
  const id = state.inventoryAdjustmentId || state.editingInventoryId;
  return getInventory().find(i => i.id === id) || null;
}

function matchesQuery(item, q) {
  const text = [
    item.nombre,
    item.sku,
    item.barcode,
    item.lote,
    item.categoria,
    item.presentacion,
    item.marca,
    item.descripcion
  ].join(' ').toLowerCase();
  return text.includes(q);
}

function activeBadge(item) {
  return item.activo === false
    ? '<span class="status-tag danger">Inactivo</span>'
    : '<span class="status-tag ok">Activo</span>';
}

function filterInventory(items) {
  const q = state.inventoryQuery.trim().toLowerCase();
  return items.filter(item => {
    if (q && !matchesQuery(item, q)) return false;

    if (state.inventoryStockFilter === 'bajo' && !(item.stock <= item.stockMinimo)) return false;
    if (state.inventoryStockFilter === 'agotado' && !(item.stock <= 0)) return false;
    if (state.inventoryStockFilter === 'ok' && item.stock <= item.stockMinimo) return false;

    const cad = inventoryStatus(item).label;
    if (state.inventoryCaducidadFilter === 'vencido' && cad !== 'Vencido') return false;
    if (state.inventoryCaducidadFilter === 'proximo' && cad !== 'Próximo') return false;
    if (state.inventoryCaducidadFilter === 'vigente' && cad !== 'Vigente') return false;

    return true;
  });
}

function inventoryRowsMarkup(items) {
  return items.map(i => {
    const cad = inventoryStatus(i);
    const stk = stockStatus(i);
    return `
      <tr>
        <td>
          <div style="display:flex; gap:12px; align-items:center;">
            <div class="product-thumb">${i.nombre.slice(0,2).toUpperCase()}</div>
            <div>
              <div style="font-weight:700;">${i.nombre}</div>
              <div class="muted" style="font-size:.85rem;">$${Number(i.precio).toFixed(2)} · ${i.categoria}</div>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">${activeBadge(i)}</div>
            </div>
          </div>
        </td>
        <td>${i.sku}</td>
        <td>${i.presentacion || '—'}</td>
        <td>${i.marca || '—'}</td>
        <td><span class="status-tag ${stk.className}">${i.stock}</span></td>
        <td>${i.stockMinimo}</td>
        <td>${i.lote}</td>
        <td>${i.caducidad}</td>
        <td><span class="status-tag ${cad.className}">${cad.label}</span></td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-secondary small-btn edit-inventory-btn" data-id="${i.id}">Editar</button>
            <button class="btn btn-secondary small-btn adjust-inventory-btn" data-id="${i.id}">Ajustar</button>
            <button class="btn btn-danger small-btn delete-inventory-btn" data-id="${i.id}">Borrar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="10" class="muted">No se encontraron productos.</td></tr>`;
}

function renderAdjustmentCard(item) {
  if (!item) {
    return `
      <div class="status-item" style="margin-top:12px;">
        <span class="muted">Selecciona un producto para hacer ajuste manual de stock.</span>
      </div>
    `;
  }

  return `
    <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--line);">
      <h3 style="margin:0 0 6px;">Ajuste manual de stock</h3>
      <p class="muted" style="margin:0 0 12px;">Producto: <b>${item.nombre}</b> · stock actual <b>${item.stock}</b></p>
      <div class="inventory-form-grid">
        <div class="input-group">
          <label for="adjMode">Tipo de ajuste</label>
          <select id="adjMode">
            <option value="sumar">Sumar stock</option>
            <option value="restar">Restar stock</option>
            <option value="fijar">Fijar stock exacto</option>
          </select>
        </div>
        <div class="input-group">
          <label for="adjQty">Cantidad</label>
          <input id="adjQty" type="number" min="0" value="0" />
        </div>
        <div class="input-group" style="grid-column:1 / -1;">
          <label for="adjReason">Motivo</label>
          <select id="adjReason">
            <option>Ajuste</option>
            <option>Merma</option>
            <option>Error de captura</option>
            <option>Corrección de conteo</option>
            <option>Otro</option>
          </select>
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
        <button class="btn btn-primary" id="applyInventoryAdjustBtn">Aplicar ajuste</button>
        <button class="btn btn-secondary" id="cancelInventoryAdjustBtn">Cancelar</button>
      </div>
    </div>
  `;
}

export function renderInventario() {
  const inventory = getInventory();
  const filtered = filterInventory(inventory);
  const s = stats(inventory);
  const item = editing();
  const adjust = adjustmentItem();

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
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Inventario v2 · Etapa 2</h3>
              <p class="muted" style="margin:6px 0 0;">Filtros de stock/caducidad y ajuste manual de existencias.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearInventorySearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newInventoryBtn">Nuevo producto</button>
            </div>
          </div>

          <div class="inventory-form-grid" style="margin-bottom:16px;">
            <div class="input-group" style="grid-column:1 / -1;">
              <label for="inventorySearch">Buscar producto</label>
              <input id="inventorySearch" placeholder="Nombre, SKU, código, lote, categoría, marca..." value="${state.inventoryQuery}" />
            </div>
            <div class="input-group">
              <label for="inventoryStockFilter">Filtro stock</label>
              <select id="inventoryStockFilter">
                <option value="todos" ${state.inventoryStockFilter === 'todos' ? 'selected' : ''}>Todos</option>
                <option value="bajo" ${state.inventoryStockFilter === 'bajo' ? 'selected' : ''}>Solo stock bajo</option>
                <option value="agotado" ${state.inventoryStockFilter === 'agotado' ? 'selected' : ''}>Solo agotados</option>
                <option value="ok" ${state.inventoryStockFilter === 'ok' ? 'selected' : ''}>Solo stock ok</option>
              </select>
            </div>
            <div class="input-group">
              <label for="inventoryCaducidadFilter">Filtro caducidad</label>
              <select id="inventoryCaducidadFilter">
                <option value="todos" ${state.inventoryCaducidadFilter === 'todos' ? 'selected' : ''}>Todos</option>
                <option value="vigente" ${state.inventoryCaducidadFilter === 'vigente' ? 'selected' : ''}>Solo vigentes</option>
                <option value="proximo" ${state.inventoryCaducidadFilter === 'proximo' ? 'selected' : ''}>Próximos a caducar</option>
                <option value="vencido" ${state.inventoryCaducidadFilter === 'vencido' ? 'selected' : ''}>Vencidos</option>
              </select>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Presentación</th>
                  <th>Marca</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Lote</th>
                  <th>Caducidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="inventoryRows">
                ${inventoryRowsMarkup(filtered)}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${item ? 'Editar producto' : 'Alta de producto'}</h3>
          <p class="muted">Etapa 2: filtros avanzados y ajuste manual de stock.</p>
          <form id="inventoryForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="inventoryId" value="${item?.id || ''}" />
            <div class="input-group"><label for="invNombre">Nombre</label><input id="invNombre" value="${item?.nombre || ''}" required /></div>
            <div class="input-group"><label for="invCategoria">Categoría</label><input id="invCategoria" value="${item?.categoria || ''}" required /></div>
            <div class="input-group"><label for="invTipo">Tipo</label><select id="invTipo"><option ${item?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${item?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${item?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="invSku">SKU</label><input id="invSku" value="${item?.sku || ''}" required /></div>
            <div class="input-group"><label for="invBarcode">Código barras</label><input id="invBarcode" value="${item?.barcode || ''}" required /></div>
            <div class="input-group"><label for="invLote">Lote</label><input id="invLote" value="${item?.lote || ''}" required /></div>
            <div class="input-group"><label for="invPresentacion">Presentación</label><input id="invPresentacion" value="${item?.presentacion || ''}" placeholder="Caja, frasco, tableta..." /></div>
            <div class="input-group"><label for="invMarca">Marca / laboratorio</label><input id="invMarca" value="${item?.marca || ''}" placeholder="Marca o laboratorio" /></div>
            <div class="input-group" style="grid-column: 1 / -1;"><label for="invDescripcion">Descripción</label><input id="invDescripcion" value="${item?.descripcion || ''}" placeholder="Descripción corta del producto" /></div>
            <div class="input-group"><label for="invCosto">Costo</label><input id="invCosto" type="number" min="0" step="0.01" value="${item?.costo ?? ''}" required /></div>
            <div class="input-group"><label for="invPrecio">Precio</label><input id="invPrecio" type="number" min="0" step="0.01" value="${item?.precio ?? ''}" required /></div>
            <div class="input-group"><label for="invStock">Stock</label><input id="invStock" type="number" min="0" value="${item?.stock ?? ''}" required /></div>
            <div class="input-group"><label for="invStockMin">Stock mínimo</label><input id="invStockMin" type="number" min="0" value="${item?.stockMinimo ?? ''}" required /></div>
            <div class="input-group"><label for="invCaducidad">Caducidad</label><input id="invCaducidad" type="date" value="${item?.caducidad || ''}" required /></div>
            <div class="input-group"><label for="invActivo">Estado</label><select id="invActivo"><option value="true" ${item?.activo !== false ? 'selected' : ''}>Activo</option><option value="false" ${item?.activo === false ? 'selected' : ''}>Inactivo</option></select></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveInventoryBtn">${item ? 'Guardar cambios' : 'Guardar producto'}</button>
            <button class="btn btn-secondary" id="resetInventoryBtn">Limpiar formulario</button>
          </div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Verde</span><span class="status-tag ok">Vigente</span></div>
            <div class="status-item"><span>Amarillo</span><span class="status-tag warn">Próximo a caducar</span></div>
            <div class="status-item"><span>Rojo</span><span class="status-tag danger">Vencido / stock bajo</span></div>
          </div>
          ${renderAdjustmentCard(adjust)}
        </article>
      </section>
    </div>
  `;
}

function validatePayload(payload, items) {
  if (!payload.nombre || !payload.categoria || !payload.sku || !payload.barcode || !payload.lote || !payload.caducidad) {
    return 'Completa todos los campos obligatorios del producto.';
  }
  if (payload.stock < 0) return 'El stock no puede ser negativo.';
  if (payload.stockMinimo < 0) return 'El stock mínimo no puede ser negativo.';
  if (payload.costo < 0 || payload.precio < 0) return 'Costo y precio deben ser mayores o iguales a cero.';
  if (payload.precio < payload.costo) return 'El precio no puede ser menor al costo.';

  const repeatedSku = items.find(i => i.sku === payload.sku && i.id !== payload.id);
  if (repeatedSku) return 'Ya existe otro producto con ese SKU.';
  const repeatedBarcode = items.find(i => i.barcode === payload.barcode && i.id !== payload.id);
  if (repeatedBarcode) return 'Ya existe otro producto con ese código de barras.';
  return '';
}

function refreshInventoryTableOnly(render) {
  const rows = document.getElementById('inventoryRows');
  if (!rows) return;
  rows.innerHTML = inventoryRowsMarkup(filterInventory(getInventory()));
  bindInventoryRowButtons(render);
}

function bindInventoryRowButtons(render) {
  document.querySelectorAll('.edit-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    state.editingInventoryId = btn.dataset.id;
    state.inventoryAdjustmentId = '';
    render();
  }));

  document.querySelectorAll('.adjust-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    state.inventoryAdjustmentId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.delete-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    saveInventory(getInventory().filter(i => i.id !== btn.dataset.id));
    if (state.editingInventoryId === btn.dataset.id) state.editingInventoryId = '';
    if (state.inventoryAdjustmentId === btn.dataset.id) state.inventoryAdjustmentId = '';
    render();
    showToast('Producto eliminado.');
  }));
}

export function bindInventario(render) {
  document.getElementById('inventorySearch')?.addEventListener('input', e => {
    state.inventoryQuery = e.target.value;
    refreshInventoryTableOnly(render);
  });

  document.getElementById('inventoryStockFilter')?.addEventListener('change', e => {
    state.inventoryStockFilter = e.target.value;
    refreshInventoryTableOnly(render);
  });

  document.getElementById('inventoryCaducidadFilter')?.addEventListener('change', e => {
    state.inventoryCaducidadFilter = e.target.value;
    refreshInventoryTableOnly(render);
  });

  document.getElementById('clearInventorySearchBtn')?.addEventListener('click', () => {
    state.inventoryQuery = '';
    state.inventoryStockFilter = 'todos';
    state.inventoryCaducidadFilter = 'todos';
    render();
  });

  document.getElementById('newInventoryBtn')?.addEventListener('click', () => {
    state.editingInventoryId = '';
    state.inventoryAdjustmentId = '';
    render();
  });

  document.getElementById('resetInventoryBtn')?.addEventListener('click', () => {
    state.editingInventoryId = '';
    render();
  });

  bindInventoryRowButtons(render);

  document.getElementById('cancelInventoryAdjustBtn')?.addEventListener('click', () => {
    state.inventoryAdjustmentId = '';
    render();
  });

  document.getElementById('applyInventoryAdjustBtn')?.addEventListener('click', () => {
    const item = adjustmentItem();
    if (!item) return showToast('Selecciona un producto para ajustar.');
    const qty = Number(document.getElementById('adjQty')?.value || 0);
    const mode = document.getElementById('adjMode')?.value || 'sumar';
    const reason = document.getElementById('adjReason')?.value || 'Ajuste';
    if (qty < 0) return showToast('La cantidad no puede ser negativa.');

    let nextStock = item.stock;
    if (mode === 'sumar') nextStock = item.stock + qty;
    if (mode === 'restar') nextStock = item.stock - qty;
    if (mode === 'fijar') nextStock = qty;

    if (nextStock < 0) return showToast('El ajuste dejaría stock negativo.');

    saveInventory(getInventory().map(i => i.id === item.id ? { ...i, stock: nextStock } : i));
    state.inventoryAdjustmentId = item.id;
    render();
    showToast(`Ajuste aplicado: ${reason}. Nuevo stock ${nextStock}.`);
  });

  document.getElementById('saveInventoryBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('inventoryId').value || `inv_${Date.now()}`,
      nombre: document.getElementById('invNombre').value.trim(),
      categoria: document.getElementById('invCategoria').value.trim(),
      tipo: document.getElementById('invTipo').value,
      sku: document.getElementById('invSku').value.trim(),
      barcode: document.getElementById('invBarcode').value.trim(),
      lote: document.getElementById('invLote').value.trim(),
      presentacion: document.getElementById('invPresentacion').value.trim(),
      marca: document.getElementById('invMarca').value.trim(),
      descripcion: document.getElementById('invDescripcion').value.trim(),
      costo: Number(document.getElementById('invCosto').value || 0),
      precio: Number(document.getElementById('invPrecio').value || 0),
      stock: Number(document.getElementById('invStock').value || 0),
      stockMinimo: Number(document.getElementById('invStockMin').value || 0),
      caducidad: document.getElementById('invCaducidad').value,
      activo: document.getElementById('invActivo').value === 'true'
    };

    const items = getInventory();
    const error = validatePayload(payload, items);
    if (error) return showToast(error);

    const exists = items.some(i => i.id === payload.id);
    const previous = exists ? items.find(i => i.id === payload.id) : null;
    const mergedPayload = previous ? {
      ...previous,
      ...payload,
      visibleWeb: previous.visibleWeb,
      precioWeb: previous.precioWeb,
      categoriaWeb: previous.categoriaWeb,
      destacadoWeb: previous.destacadoWeb
    } : {
      ...payload,
      visibleWeb: false,
      precioWeb: payload.precio,
      categoriaWeb: payload.categoria,
      destacadoWeb: false
    };

    saveInventory(exists ? items.map(i => i.id === payload.id ? mergedPayload : i) : [...items, mergedPayload]);
    state.editingInventoryId = '';
    render();
    showToast(exists ? 'Producto actualizado.' : 'Producto guardado.');
  });
}
