import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, showToast } from '../../core/utils.js';

function getPurchases() { return load(STORAGE_KEYS.PURCHASES, []); }
function savePurchases(items) { save(STORAGE_KEYS.PURCHASES, items); }
function getInventory() { return load(STORAGE_KEYS.INVENTORY, []); }
function saveInventory(items) { save(STORAGE_KEYS.INVENTORY, items); }
function getBodega() { return load(STORAGE_KEYS.BODEGA, []); }
function saveBodega(items) { save(STORAGE_KEYS.BODEGA, items); }
function editing() { return getPurchases().find(i => i.id === state.editingCompraId) || null; }

function stats(items) {
  const total = items.reduce((acc, i) => acc + Number(i.total || 0), 0);
  const hoy = new Date().toISOString().slice(0, 10);
  const comprasHoy = items.filter(i => i.fecha === hoy).reduce((acc, i) => acc + Number(i.total || 0), 0);
  const aBodega = items.filter(i => i.destino === 'bodega').length;
  const aInventario = items.filter(i => i.destino === 'inventario').length;
  return { totalCompras: items.length, totalInvertido: total, comprasHoy, aBodega, aInventario };
}

function applyPurchaseToDestination(payload, previous = null) {
  const destinationKey = payload.destino === 'bodega' ? STORAGE_KEYS.BODEGA : STORAGE_KEYS.INVENTORY;
  const loadTarget = destinationKey === STORAGE_KEYS.BODEGA ? getBodega : getInventory;
  const saveTarget = destinationKey === STORAGE_KEYS.BODEGA ? saveBodega : saveInventory;

  const targetItems = loadTarget();
  const targetIndex = targetItems.findIndex(i => i.sku === payload.sku && i.lote === payload.lote);

  const makeTargetRecord = quantity => ({
    id: destinationKey === STORAGE_KEYS.BODEGA ? `bod_${Date.now()}` : `inv_${Date.now()}`,
    nombre: payload.nombre,
    categoria: payload.categoria,
    tipo: payload.tipo,
    sku: payload.sku,
    barcode: payload.barcode,
    lote: payload.lote,
    costo: Number(payload.costo || 0),
    precio: Number(payload.precio || 0),
    stock: Number(quantity || 0),
    stockMinimo: Number(payload.stockMinimo || 0),
    caducidad: payload.caducidad
  });

  if (previous) {
    // reverse previous effect
    const oldKey = previous.destino === 'bodega' ? STORAGE_KEYS.BODEGA : STORAGE_KEYS.INVENTORY;
    const oldLoad = oldKey === STORAGE_KEYS.BODEGA ? getBodega : getInventory;
    const oldSave = oldKey === STORAGE_KEYS.BODEGA ? saveBodega : saveInventory;
    const oldItems = oldLoad();
    const oldIndex = oldItems.findIndex(i => i.sku === previous.sku && i.lote === previous.lote);
    if (oldIndex >= 0) {
      const nextQty = Number(oldItems[oldIndex].stock || 0) - Number(previous.cantidad || 0);
      if (nextQty <= 0) oldItems.splice(oldIndex, 1);
      else oldItems[oldIndex] = { ...oldItems[oldIndex], stock: nextQty };
      oldSave(oldItems);
    }
  }

  if (targetIndex >= 0) {
    targetItems[targetIndex] = {
      ...targetItems[targetIndex],
      nombre: payload.nombre,
      categoria: payload.categoria,
      tipo: payload.tipo,
      barcode: payload.barcode,
      costo: Number(payload.costo || 0),
      precio: Number(payload.precio || 0),
      stock: Number(targetItems[targetIndex].stock || 0) + Number(payload.cantidad || 0),
      stockMinimo: Number(payload.stockMinimo || 0),
      caducidad: payload.caducidad
    };
  } else {
    targetItems.push(makeTargetRecord(payload.cantidad));
  }
  saveTarget(targetItems);
}

export function renderCompras() {
  const purchases = getPurchases().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const q = state.comprasQuery.trim().toLowerCase();
  const filtered = !q ? purchases : purchases.filter(item =>
    item.proveedor.toLowerCase().includes(q) ||
    item.nombre.toLowerCase().includes(q) ||
    item.sku.toLowerCase().includes(q) ||
    item.referencia.toLowerCase().includes(q) ||
    item.lote.toLowerCase().includes(q)
  );
  const s = stats(purchases);
  const item = editing();

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Compras registradas</div><div class="kpi-value">${s.totalCompras}</div><div class="kpi-meta">Entradas por proveedor</div></article>
        <article class="card"><div class="muted">Invertido</div><div class="kpi-value">$${s.totalInvertido.toFixed(2)}</div><div class="kpi-meta">Total acumulado</div></article>
        <article class="card"><div class="muted">A inventario</div><div class="kpi-value">${s.aInventario}</div><div class="kpi-meta">Reposición de piso</div></article>
        <article class="card"><div class="muted">A bodega</div><div class="kpi-value">${s.aBodega}</div><div class="kpi-meta">Reserva separada</div></article>
      </section>

      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Compras v1</h3>
              <p class="muted" style="margin:6px 0 0;">Registra compras y manda existencias a inventario o bodega.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearComprasSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newCompraBtn">Nueva compra</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="comprasSearch">Buscar compra</label>
            <input id="comprasSearch" placeholder="Proveedor, producto, SKU, referencia, lote" value="${state.comprasQuery}" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Producto</th>
                  <th>Destino</th>
                  <th>Cantidad</th>
                  <th>Costo</th>
                  <th>Total</th>
                  <th>Caducidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(i => {
                  const cad = inventoryStatus(i);
                  return `<tr>
                    <td>${i.fecha}</td>
                    <td><div style="font-weight:700;">${i.proveedor}</div><div class="muted" style="font-size:.85rem;">${i.referencia || 'Sin referencia'}</div></td>
                    <td><div style="font-weight:700;">${i.nombre}</div><div class="muted" style="font-size:.85rem;">${i.sku} · lote ${i.lote}</div></td>
                    <td><span class="status-tag ${i.destino === 'bodega' ? 'soft-blue' : 'ok'}">${i.destino}</span></td>
                    <td>${i.cantidad}</td>
                    <td>$${Number(i.costo).toFixed(2)}</td>
                    <td>$${Number(i.total).toFixed(2)}</td>
                    <td><span class="status-tag ${cad.className}">${i.caducidad}</span></td>
                    <td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-compra-btn" data-id="${i.id}">Editar</button><button class="btn btn-danger small-btn delete-compra-btn" data-id="${i.id}">Borrar</button></div></td>
                  </tr>`;
                }).join('') || `<tr><td colspan="9" class="muted">No se encontraron compras.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${item ? 'Editar compra' : 'Registrar compra'}</h3>
          <p class="muted">Al guardar, el sistema aumenta existencias en el destino elegido.</p>
          <form id="comprasForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="compraId" value="${item?.id || ''}" />
            <div class="input-group"><label for="compraFecha">Fecha</label><input id="compraFecha" type="date" value="${item?.fecha || new Date().toISOString().slice(0,10)}" required /></div>
            <div class="input-group"><label for="compraProveedor">Proveedor</label><input id="compraProveedor" value="${item?.proveedor || ''}" required /></div>
            <div class="input-group"><label for="compraReferencia">Referencia / folio</label><input id="compraReferencia" value="${item?.referencia || ''}" /></div>
            <div class="input-group"><label for="compraDestino">Destino</label><select id="compraDestino"><option value="inventario" ${item?.destino === 'inventario' ? 'selected' : ''}>inventario</option><option value="bodega" ${item?.destino === 'bodega' ? 'selected' : ''}>bodega</option></select></div>
            <div class="input-group"><label for="compraNombre">Producto</label><input id="compraNombre" value="${item?.nombre || ''}" required /></div>
            <div class="input-group"><label for="compraCategoria">Categoría</label><input id="compraCategoria" value="${item?.categoria || ''}" required /></div>
            <div class="input-group"><label for="compraTipo">Tipo</label><select id="compraTipo"><option ${item?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${item?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${item?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="compraSku">SKU</label><input id="compraSku" value="${item?.sku || ''}" required /></div>
            <div class="input-group"><label for="compraBarcode">Código barras</label><input id="compraBarcode" value="${item?.barcode || item?.sku || ''}" required /></div>
            <div class="input-group"><label for="compraLote">Lote</label><input id="compraLote" value="${item?.lote || ''}" required /></div>
            <div class="input-group"><label for="compraCosto">Costo unitario</label><input id="compraCosto" type="number" min="0" step="0.01" value="${item?.costo ?? ''}" required /></div>
            <div class="input-group"><label for="compraPrecio">Precio venta</label><input id="compraPrecio" type="number" min="0" step="0.01" value="${item?.precio ?? ''}" required /></div>
            <div class="input-group"><label for="compraCantidad">Cantidad</label><input id="compraCantidad" type="number" min="1" value="${item?.cantidad ?? 1}" required /></div>
            <div class="input-group"><label for="compraStockMin">Stock mínimo</label><input id="compraStockMin" type="number" min="0" value="${item?.stockMinimo ?? 0}" required /></div>
            <div class="input-group"><label for="compraCaducidad">Caducidad</label><input id="compraCaducidad" type="date" value="${item?.caducidad || ''}" required /></div>
            <div class="input-group"><label for="compraPago">Forma de pago</label><select id="compraPago"><option ${item?.pago === 'Efectivo' ? 'selected' : ''}>Efectivo</option><option ${item?.pago === 'Tarjeta' ? 'selected' : ''}>Tarjeta</option><option ${item?.pago === 'Transferencia' ? 'selected' : ''}>Transferencia</option><option ${item?.pago === 'Crédito' ? 'selected' : ''}>Crédito</option></select></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="compraNotas">Notas</label><input id="compraNotas" value="${item?.notas || ''}" placeholder="Observaciones de la compra" /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveCompraBtn">${item ? 'Guardar cambios' : 'Guardar compra'}</button>
            <button class="btn btn-secondary" id="resetCompraBtn">Limpiar formulario</button>
          </div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Destino</span><span class="status-tag ok">Inventario</span></div>
            <div class="status-item"><span>Destino</span><span class="status-tag soft-blue">Bodega</span></div>
            <div class="status-item"><span>Regla</span><span class="status-tag warn">Suma existencias</span></div>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindCompras(render) {
  document.getElementById('comprasSearch')?.addEventListener('input', e => { state.comprasQuery = e.target.value; render(); });
  document.getElementById('clearComprasSearchBtn')?.addEventListener('click', () => { state.comprasQuery = ''; render(); });
  document.getElementById('newCompraBtn')?.addEventListener('click', () => { state.editingCompraId = ''; render(); });
  document.getElementById('resetCompraBtn')?.addEventListener('click', () => { state.editingCompraId = ''; render(); });

  document.querySelectorAll('.edit-compra-btn').forEach(btn => btn.addEventListener('click', () => {
    state.editingCompraId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.delete-compra-btn').forEach(btn => btn.addEventListener('click', () => {
    const purchases = getPurchases();
    const current = purchases.find(i => i.id === btn.dataset.id);
    if (!current) return;
    applyPurchaseToDestination({ ...current, cantidad: 0 }, current); // reverse previous only
    savePurchases(purchases.filter(i => i.id !== btn.dataset.id));
    if (state.editingCompraId === btn.dataset.id) state.editingCompraId = '';
    render();
    showToast('Compra eliminada.');
  }));

  document.getElementById('saveCompraBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('compraId').value || `comp_${Date.now()}`,
      fecha: document.getElementById('compraFecha').value,
      proveedor: document.getElementById('compraProveedor').value.trim(),
      referencia: document.getElementById('compraReferencia').value.trim(),
      destino: document.getElementById('compraDestino').value,
      nombre: document.getElementById('compraNombre').value.trim(),
      categoria: document.getElementById('compraCategoria').value.trim(),
      tipo: document.getElementById('compraTipo').value,
      sku: document.getElementById('compraSku').value.trim(),
      barcode: document.getElementById('compraBarcode').value.trim(),
      lote: document.getElementById('compraLote').value.trim(),
      costo: Number(document.getElementById('compraCosto').value || 0),
      precio: Number(document.getElementById('compraPrecio').value || 0),
      cantidad: Number(document.getElementById('compraCantidad').value || 0),
      stockMinimo: Number(document.getElementById('compraStockMin').value || 0),
      caducidad: document.getElementById('compraCaducidad').value,
      pago: document.getElementById('compraPago').value,
      notas: document.getElementById('compraNotas').value.trim()
    };
    payload.total = Number(payload.costo) * Number(payload.cantidad);

    if (!payload.fecha || !payload.proveedor || !payload.nombre || !payload.categoria || !payload.sku || !payload.barcode || !payload.lote || !payload.caducidad || payload.cantidad <= 0) {
      return showToast('Completa todos los campos obligatorios de compra.');
    }

    const purchases = getPurchases();
    const previous = purchases.find(i => i.id === payload.id) || null;
    applyPurchaseToDestination(payload, previous);
    const exists = Boolean(previous);
    const next = exists ? purchases.map(i => i.id === payload.id ? payload : i) : [...purchases, payload];
    savePurchases(next);
    state.editingCompraId = '';
    render();
    showToast(exists ? 'Compra actualizada.' : 'Compra guardada y existencias actualizadas.');
  });
}
