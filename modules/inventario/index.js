import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, showToast } from '../../core/utils.js';
import { addInventoryMovement, getProductMovements } from '../../core/movements.js';

function getInventory() { return load(STORAGE_KEYS.INVENTORY, []); }
function saveInventory(items) { save(STORAGE_KEYS.INVENTORY, items); }

function stats(items) {
  const vencidos = items.filter(i => inventoryStatus(i).label === 'Vencido').length;
  const proximos = items.filter(i => inventoryStatus(i).label === 'Próximo').length;
  const bajos = items.filter(i => i.stock <= i.stockMinimo).length;
  const web = items.filter(i => i.visibleWeb).length;
  return { total: items.length, vencidos, proximos, bajos, web };
}

function editing() {
  return getInventory().find(i => i.id === state.editingInventoryId) || null;
}

function selectedMovementItem() {
  const id = state.inventoryMovementProductId || state.inventoryAdjustmentId || state.editingInventoryId;
  return getInventory().find(i => i.id === id) || null;
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
    item.descripcion,
    item.categoriaWeb
  ].join(' ').toLowerCase();
  return text.includes(q);
}

function activeBadge(item) {
  return item.activo === false
    ? '<span class="status-tag danger">Inactivo</span>'
    : '<span class="status-tag ok">Activo</span>';
}

function webBadge(item) {
  return item.visibleWeb
    ? `<span class="status-tag soft-blue">Web${item.destacadoWeb ? ' ★' : ''}</span>`
    : '<span class="status-tag">Oculto web</span>';
}

function filterInventory(items) {
  const q = (state.inventoryQuery || '').trim().toLowerCase();
  return items.filter(item => {
    if (q && !matchesQuery(item, q)) return false;
    if (state.inventoryStockFilter === 'bajo' && !(item.stock <= item.stockMinimo)) return false;
    if (state.inventoryStockFilter === 'agotado' && !(item.stock <= 0)) return false;
    if (state.inventoryStockFilter === 'ok' && item.stock <= item.stockMinimo) return false;
    const cad = inventoryStatus(item).label;
    if (state.inventoryCaducidadFilter === 'vencido' && cad !== 'Vencido') return false;
    if (state.inventoryCaducidadFilter === 'proximo' && cad !== 'Próximo') return false;
    if (state.inventoryCaducidadFilter === 'vigente' && cad !== 'Vigente') return false;
    if (state.inventoryWebFilter === 'publicados' && !item.visibleWeb) return false;
    if (state.inventoryWebFilter === 'ocultos' && item.visibleWeb) return false;
    if (state.inventoryWebFilter === 'destacados' && !item.destacadoWeb) return false;
    if (state.inventoryActiveFilter === 'activos' && item.activo === false) return false;
    if (state.inventoryActiveFilter === 'inactivos' && item.activo !== false) return false;
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
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">${activeBadge(i)} ${webBadge(i)}</div>
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
          <details class="inv-actions" style="position:relative;">
            <summary style="list-style:none; cursor:pointer; width:34px; height:34px; border:1px solid var(--line); border-radius:10px; display:grid; place-items:center; background:#fff; font-size:20px; color:var(--text);">⋮</summary>
            <div style="position:absolute; right:0; top:40px; min-width:180px; background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:var(--shadow); padding:8px; z-index:20; display:grid; gap:6px;">
              <button class="btn btn-secondary small-btn edit-inventory-btn" data-id="${i.id}" style="text-align:left; justify-content:flex-start;">Editar</button>
              <button class="btn btn-secondary small-btn adjust-inventory-btn" data-id="${i.id}" style="text-align:left; justify-content:flex-start;">Ajustar stock</button>
              <button class="btn btn-secondary small-btn moves-inventory-btn" data-id="${i.id}" style="text-align:left; justify-content:flex-start;">Ver movimientos</button>
              <button class="btn btn-secondary small-btn web-toggle-btn" data-id="${i.id}" style="text-align:left; justify-content:flex-start;">${i.visibleWeb ? 'Ocultar web' : 'Publicar web'}</button>
              <button class="btn btn-secondary small-btn active-toggle-btn" data-id="${i.id}" style="text-align:left; justify-content:flex-start;">${i.activo === false ? 'Activar' : 'Inactivar'}</button>
              <button class="btn small-btn delete-inventory-btn" data-id="${i.id}" style="text-align:left; justify-content:flex-start; background:#fff1f1; color:#d84a4a; border:1px solid #f3c3c3;">Borrar</button>
            </div>
          </details>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="10" class="muted">No se encontraron productos.</td></tr>`;
}

function renderAdjustmentCard(item) {
  if (!item) {
    return `<div class="status-item" style="margin-top:12px;"><span class="muted">Selecciona un producto para hacer ajuste manual de stock.</span></div>`;
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

function renderMovementsCard(item) {
  if (!item) {
    return `<div class="status-item" style="margin-top:12px;"><span class="muted">Selecciona un producto y toca “Movs” para ver su historial.</span></div>`;
  }
  const moves = getProductMovements({ productoId: item.id, sku: item.sku, lote: item.lote }).slice(0, 12);
  return `
    <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--line);">
      <h3 style="margin:0 0 6px;">Historial de movimientos</h3>
      <p class="muted" style="margin:0 0 12px;">Producto: <b>${item.nombre}</b> · SKU <b>${item.sku}</b></p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Usuario</th>
              <th>Módulo</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            ${moves.map(m => `
              <tr>
                <td>${String(m.fecha || '').replace('T', ' ').slice(0, 16)}</td>
                <td><span class="status-tag ${m.tipo === 'venta' || m.tipo === 'merma' || m.tipo === 'baja' ? 'danger' : m.tipo === 'ajuste' ? 'warn' : 'ok'}">${m.tipo}</span></td>
                <td><b>${m.signo}${Math.abs(Number(m.cantidad || 0))}</b></td>
                <td>${m.usuario || 'sistema'}</td>
                <td>${m.modulo || 'inventario'}</td>
                <td>${m.nota || '—'}</td>
              </tr>
            `).join('') || `<tr><td colspan="6" class="muted">Aún no hay movimientos para este producto.</td></tr>`}
          </tbody>
        </table>
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
  const movementItem = selectedMovementItem();

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Alta, edición y control</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">Comparado contra mínimo</div></article>
        <article class="card"><div class="muted">Próximos a caducar</div><div class="kpi-value">${s.proximos}</div><div class="kpi-meta">Color amarillo</div></article>
        <article class="card"><div class="muted">Publicados web</div><div class="kpi-value">${s.web}</div><div class="kpi-meta">Integración web activa</div></article>
      </section>

      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Inventario v2 · Etapa 4</h3>
              <p class="muted" style="margin:6px 0 0;">Acciones rápidas, integración web y exportación/importación del inventario.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="exportInventoryJsonBtn">Exportar JSON</button>
              <button class="btn btn-secondary" id="exportInventoryCsvBtn">Exportar CSV</button>
              <button class="btn btn-secondary" id="importInventoryBtn">Importar JSON</button>
              <input type="file" id="importInventoryFile" accept="application/json" style="display:none;" />
              <button class="btn btn-secondary" id="clearInventorySearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newInventoryBtn">Nuevo producto</button>
            </div>
          </div>

          <div class="inventory-form-grid" style="margin-bottom:16px;">
            <div class="input-group" style="grid-column:1 / -1;">
              <label for="inventorySearch">Buscar producto</label>
              <input id="inventorySearch" placeholder="Nombre, SKU, código, lote, categoría, marca..." value="${state.inventoryQuery || ''}" />
            </div>
            <div class="input-group">
              <label for="inventoryStockFilter">Filtro stock</label>
              <select id="inventoryStockFilter">
                <option value="todos" ${state.inventoryStockFilter === 'todos' ? 'selected' : ''}>Todos</option>
                <option value="bajo" ${state.inventoryStockFilter === 'bajo' ? 'selected' : ''}>Solo stock bajo</option>
                <option value="agotado" ${state.inventoryStockFilter === 'agotado' ? 'selected' : ''}>Solo agotados</option>
                <option value="ok" ${state.inventoryStockFilter === 'ok' ? 'selected' : ''}>Stock ok</option>
              </select>
            </div>
            <div class="input-group">
              <label for="inventoryCaducidadFilter">Filtro caducidad</label>
              <select id="inventoryCaducidadFilter">
                <option value="todos" ${state.inventoryCaducidadFilter === 'todos' ? 'selected' : ''}>Todos</option>
                <option value="vigente" ${state.inventoryCaducidadFilter === 'vigente' ? 'selected' : ''}>Vigentes</option>
                <option value="proximo" ${state.inventoryCaducidadFilter === 'proximo' ? 'selected' : ''}>Próximos</option>
                <option value="vencido" ${state.inventoryCaducidadFilter === 'vencido' ? 'selected' : ''}>Vencidos</option>
              </select>
            </div>
            <div class="input-group">
              <label for="inventoryWebFilter">Filtro web</label>
              <select id="inventoryWebFilter">
                <option value="todos" ${state.inventoryWebFilter === 'todos' ? 'selected' : ''}>Todos</option>
                <option value="publicados" ${state.inventoryWebFilter === 'publicados' ? 'selected' : ''}>Publicados</option>
                <option value="ocultos" ${state.inventoryWebFilter === 'ocultos' ? 'selected' : ''}>Ocultos</option>
                <option value="destacados" ${state.inventoryWebFilter === 'destacados' ? 'selected' : ''}>Destacados</option>
              </select>
            </div>
            <div class="input-group">
              <label for="inventoryActiveFilter">Filtro estado</label>
              <select id="inventoryActiveFilter">
                <option value="todos" ${state.inventoryActiveFilter === 'todos' ? 'selected' : ''}>Todos</option>
                <option value="activos" ${state.inventoryActiveFilter === 'activos' ? 'selected' : ''}>Activos</option>
                <option value="inactivos" ${state.inventoryActiveFilter === 'inactivos' ? 'selected' : ''}>Inactivos</option>
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
                  <th>Mín.</th>
                  <th>Lote</th>
                  <th>Caducidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>${inventoryRowsMarkup(filtered)}</tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${item ? 'Editar producto' : 'Alta de producto'}</h3>
          <p class="muted">Etapa 4: web, acciones rápidas y respaldo/importación desde este mismo módulo.</p>
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
            <div class="input-group"><label for="invVisibleWeb">Visible web</label><select id="invVisibleWeb"><option value="true" ${item?.visibleWeb ? 'selected' : ''}>Sí</option><option value="false" ${!item?.visibleWeb ? 'selected' : ''}>No</option></select></div>
            <div class="input-group"><label for="invPrecioWeb">Precio web</label><input id="invPrecioWeb" type="number" min="0" step="0.01" value="${item?.precioWeb ?? item?.precio ?? ''}" /></div>
            <div class="input-group"><label for="invCategoriaWeb">Categoría web</label><input id="invCategoriaWeb" value="${item?.categoriaWeb || item?.categoria || ''}" /></div>
            <div class="input-group"><label for="invDestacadoWeb">Destacado web</label><select id="invDestacadoWeb"><option value="false" ${!item?.destacadoWeb ? 'selected' : ''}>No</option><option value="true" ${item?.destacadoWeb ? 'selected' : ''}>Sí</option></select></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveInventoryBtn">${item ? 'Guardar cambios' : 'Guardar producto'}</button>
            <button class="btn btn-secondary" id="resetInventoryBtn">Limpiar formulario</button>
          </div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Verde</span><span class="status-tag ok">Vigente</span></div>
            <div class="status-item"><span>Amarillo</span><span class="status-tag warn">Próximo a caducar</span></div>
            <div class="status-item"><span>Rojo</span><span class="status-tag danger">Vencido / stock bajo</span></div>
            <div class="status-item"><span>Azul</span><span class="status-tag soft-blue">Publicado en web</span></div>
          </div>
          ${renderAdjustmentCard(adjust)}
          ${renderMovementsCard(movementItem)}
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
  if (payload.precioWeb < 0) return 'El precio web no puede ser negativo.';
  const repeatedSku = items.find(i => i.sku === payload.sku && i.id !== payload.id);
  if (repeatedSku) return 'Ya existe otro producto con ese SKU.';
  const repeatedBarcode = items.find(i => i.barcode === payload.barcode && i.id !== payload.id);
  if (repeatedBarcode) return 'Ya existe otro producto con ese código de barras.';
  return '';
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportInventoryJson() {
  downloadFile('inventario_neural_pos_farmacia.json', JSON.stringify(getInventory(), null, 2), 'application/json');
}

function exportInventoryCsv() {
  const items = getInventory();
  const headers = ['id','nombre','sku','barcode','categoria','tipo','presentacion','marca','descripcion','costo','precio','stock','stockMinimo','lote','caducidad','activo','visibleWeb','precioWeb','categoriaWeb','destacadoWeb'];
  const rows = items.map(item => headers.map(h => {
    const value = item[h] ?? '';
    return `"${String(value).replaceAll('"', '""')}"`;
  }).join(','));
  downloadFile('inventario_neural_pos_farmacia.csv', [headers.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8;');
}

function normalizeImportedItem(raw) {
  return {
    id: raw.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    nombre: String(raw.nombre || '').trim(),
    categoria: String(raw.categoria || 'General').trim(),
    tipo: String(raw.tipo || 'Genérico').trim(),
    sku: String(raw.sku || '').trim(),
    barcode: String(raw.barcode || raw.codigo || '').trim(),
    lote: String(raw.lote || '').trim(),
    presentacion: String(raw.presentacion || '').trim(),
    marca: String(raw.marca || '').trim(),
    descripcion: String(raw.descripcion || '').trim(),
    costo: Number(raw.costo || 0),
    precio: Number(raw.precio || 0),
    stock: Number(raw.stock || 0),
    stockMinimo: Number(raw.stockMinimo || raw.stock_minimo || 0),
    caducidad: String(raw.caducidad || '').trim(),
    activo: raw.activo !== false,
    visibleWeb: Boolean(raw.visibleWeb),
    precioWeb: Number(raw.precioWeb ?? raw.precio ?? 0),
    categoriaWeb: String(raw.categoriaWeb || raw.categoria || 'General').trim(),
    destacadoWeb: Boolean(raw.destacadoWeb)
  };
}

function bindInventoryRowButtons(render) {
  document.querySelectorAll('.edit-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    state.editingInventoryId = btn.dataset.id;
    state.inventoryAdjustmentId = '';
    state.inventoryMovementProductId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.adjust-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    state.inventoryAdjustmentId = btn.dataset.id;
    state.inventoryMovementProductId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.moves-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    state.inventoryMovementProductId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.web-toggle-btn').forEach(btn => btn.addEventListener('click', () => {
    const items = getInventory();
    const product = items.find(i => i.id === btn.dataset.id);
    if (!product) return;
    const nextVisible = !product.visibleWeb;
    saveInventory(items.map(i => i.id === product.id ? { ...i, visibleWeb: nextVisible } : i));
    addInventoryMovement({ productoId: product.id, producto: product.nombre, sku: product.sku, lote: product.lote, tipo: 'ajuste', cantidad: 0, signo: '+', modulo: 'inventario', nota: nextVisible ? 'Producto publicado en web' : 'Producto ocultado de web' });
    render();
    showToast(nextVisible ? 'Producto publicado en web.' : 'Producto ocultado de web.');
  }));

  document.querySelectorAll('.active-toggle-btn').forEach(btn => btn.addEventListener('click', () => {
    const items = getInventory();
    const product = items.find(i => i.id === btn.dataset.id);
    if (!product) return;
    const nextActive = product.activo === false;
    saveInventory(items.map(i => i.id === product.id ? { ...i, activo: nextActive } : i));
    addInventoryMovement({ productoId: product.id, producto: product.nombre, sku: product.sku, lote: product.lote, tipo: 'ajuste', cantidad: 0, signo: '+', modulo: 'inventario', nota: nextActive ? 'Producto activado' : 'Producto inactivado' });
    render();
    showToast(nextActive ? 'Producto activado.' : 'Producto inactivado.');
  }));

  document.querySelectorAll('.delete-inventory-btn').forEach(btn => btn.addEventListener('click', () => {
    const deleted = getInventory().find(i => i.id === btn.dataset.id);
    saveInventory(getInventory().filter(i => i.id !== btn.dataset.id));
    if (state.editingInventoryId === btn.dataset.id) state.editingInventoryId = '';
    if (state.inventoryAdjustmentId === btn.dataset.id) state.inventoryAdjustmentId = '';
    if (state.inventoryMovementProductId === btn.dataset.id) state.inventoryMovementProductId = '';
    if (deleted) {
      addInventoryMovement({ productoId: deleted.id, producto: deleted.nombre, sku: deleted.sku, lote: deleted.lote, tipo: 'baja', cantidad: deleted.stock, signo: '-', modulo: 'inventario', nota: 'Producto eliminado del inventario' });
    }
    render();
    showToast('Producto eliminado.');
  }));
}

export function bindInventario(render) {
  document.getElementById('inventorySearch')?.addEventListener('input', e => { state.inventoryQuery = e.target.value; render(); });
  document.getElementById('inventoryStockFilter')?.addEventListener('change', e => { state.inventoryStockFilter = e.target.value; render(); });
  document.getElementById('inventoryCaducidadFilter')?.addEventListener('change', e => { state.inventoryCaducidadFilter = e.target.value; render(); });
  document.getElementById('inventoryWebFilter')?.addEventListener('change', e => { state.inventoryWebFilter = e.target.value; render(); });
  document.getElementById('inventoryActiveFilter')?.addEventListener('change', e => { state.inventoryActiveFilter = e.target.value; render(); });

  document.getElementById('clearInventorySearchBtn')?.addEventListener('click', () => {
    state.inventoryQuery = '';
    state.inventoryStockFilter = 'todos';
    state.inventoryCaducidadFilter = 'todos';
    state.inventoryWebFilter = 'todos';
    state.inventoryActiveFilter = 'todos';
    render();
  });

  document.getElementById('newInventoryBtn')?.addEventListener('click', () => {
    state.editingInventoryId = '';
    state.inventoryAdjustmentId = '';
    state.inventoryMovementProductId = '';
    render();
  });

  document.getElementById('resetInventoryBtn')?.addEventListener('click', () => {
    state.editingInventoryId = '';
    render();
  });

  document.getElementById('exportInventoryJsonBtn')?.addEventListener('click', exportInventoryJson);
  document.getElementById('exportInventoryCsvBtn')?.addEventListener('click', exportInventoryCsv);
  document.getElementById('importInventoryBtn')?.addEventListener('click', () => document.getElementById('importInventoryFile')?.click());
  document.getElementById('importInventoryFile')?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido');
      const imported = parsed.map(normalizeImportedItem);
      const existing = getInventory();
      const merged = [...existing];
      imported.forEach(item => {
        const idx = merged.findIndex(x => x.id === item.id || x.sku === item.sku);
        if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
        else merged.push(item);
      });
      saveInventory(merged);
      imported.forEach(item => addInventoryMovement({ productoId: item.id, producto: item.nombre, sku: item.sku, lote: item.lote, tipo: 'compra', cantidad: item.stock, signo: '+', modulo: 'inventario', nota: 'Importación JSON de inventario' }));
      e.target.value = '';
      render();
      showToast('Inventario importado correctamente.');
    } catch {
      showToast('No se pudo importar el archivo JSON.');
    }
  });

  bindInventoryRowButtons(render);

  document.getElementById('cancelInventoryAdjustBtn')?.addEventListener('click', () => { state.inventoryAdjustmentId = ''; render(); });

  document.getElementById('applyInventoryAdjustBtn')?.addEventListener('click', () => {
    const item = adjustmentItem();
    if (!item) return showToast('Selecciona un producto para ajustar.');
    const qty = Number(document.getElementById('adjQty')?.value || 0);
    const mode = document.getElementById('adjMode')?.value || 'sumar';
    const reason = document.getElementById('adjReason')?.value || 'Ajuste';
    if (qty < 0) return showToast('La cantidad no puede ser negativa.');

    let nextStock = item.stock;
    let delta = 0;
    if (mode === 'sumar') { nextStock = item.stock + qty; delta = qty; }
    if (mode === 'restar') { nextStock = item.stock - qty; delta = -qty; }
    if (mode === 'fijar') { nextStock = qty; delta = qty - item.stock; }
    if (nextStock < 0) return showToast('El ajuste dejaría stock negativo.');

    saveInventory(getInventory().map(i => i.id === item.id ? { ...i, stock: nextStock } : i));
    addInventoryMovement({ productoId: item.id, producto: item.nombre, sku: item.sku, lote: item.lote, tipo: reason === 'Merma' ? 'merma' : 'ajuste', cantidad: Math.abs(delta), signo: delta >= 0 ? '+' : '-', modulo: 'inventario', nota: `${reason} · modo ${mode} · stock ${item.stock} → ${nextStock}` });
    state.inventoryAdjustmentId = item.id;
    state.inventoryMovementProductId = item.id;
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
      activo: document.getElementById('invActivo').value === 'true',
      visibleWeb: document.getElementById('invVisibleWeb').value === 'true',
      precioWeb: Number(document.getElementById('invPrecioWeb').value || 0),
      categoriaWeb: document.getElementById('invCategoriaWeb').value.trim(),
      destacadoWeb: document.getElementById('invDestacadoWeb').value === 'true'
    };

    const items = getInventory();
    const error = validatePayload(payload, items);
    if (error) return showToast(error);

    const exists = items.some(i => i.id === payload.id);
    const previous = exists ? items.find(i => i.id === payload.id) : null;
    const mergedPayload = previous ? { ...previous, ...payload } : payload;

    saveInventory(exists ? items.map(i => i.id === payload.id ? mergedPayload : i) : [...items, mergedPayload]);
    if (!exists) {
      addInventoryMovement({ productoId: mergedPayload.id, producto: mergedPayload.nombre, sku: mergedPayload.sku, lote: mergedPayload.lote, tipo: 'alta', cantidad: mergedPayload.stock, signo: '+', modulo: 'inventario', nota: 'Alta inicial de producto' });
    } else {
      addInventoryMovement({ productoId: mergedPayload.id, producto: mergedPayload.nombre, sku: mergedPayload.sku, lote: mergedPayload.lote, tipo: 'ajuste', cantidad: 0, signo: '+', modulo: 'inventario', nota: 'Edición de datos generales / web del producto' });
    }
    state.editingInventoryId = '';
    state.inventoryMovementProductId = mergedPayload.id;
    render();
    showToast(exists ? 'Producto actualizado.' : 'Producto guardado.');
  });
}
