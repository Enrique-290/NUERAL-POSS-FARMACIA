import { state } from '../../core/state.js';
import { showToast, inventoryStatus, stockStatus } from '../../core/utils.js';
import { load, save } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';

function getMayoreoInventory() {
  return load(STORAGE_KEYS.MAYOREO_INVENTORY, []);
}

function saveMayoreoInventory(items) {
  save(STORAGE_KEYS.MAYOREO_INVENTORY, items);
}

function stats(items) {
  const vencidos = items.filter(item => inventoryStatus(item).label === 'Vencido').length;
  const proximos = items.filter(item => inventoryStatus(item).label === 'Próximo').length;
  const bajos = items.filter(item => Number(item.stock || 0) <= Number(item.stockMinimo || 0)).length;
  return { total: items.length, vencidos, proximos, bajos };
}

function editing() {
  return getMayoreoInventory().find(item => item.id === state.editingMayoreoInventoryId) || null;
}

export function renderModule() {
  const inventory = getMayoreoInventory();
  const q = String(state.mayoreoInventoryQuery || '').trim().toLowerCase();
  const filtered = !q ? inventory : inventory.filter(item =>
    String(item.nombre || '').toLowerCase().includes(q) ||
    String(item.sku || '').toLowerCase().includes(q) ||
    String(item.barcode || '').toLowerCase().includes(q) ||
    String(item.lote || '').toLowerCase().includes(q)
  );
  const s = stats(inventory);
  const item = editing();

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos mayoreo</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Inventario separado del público</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">Comparado contra mínimo</div></article>
        <article class="card"><div class="muted">Próximos a caducar</div><div class="kpi-value">${s.proximos}</div><div class="kpi-meta">Color amarillo</div></article>
        <article class="card"><div class="muted">Vencidos</div><div class="kpi-value">${s.vencidos}</div><div class="kpi-meta">Color rojo</div></article>
      </section>

      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Inventario mayoreo v1</h3>
              <p class="muted" style="margin:6px 0 0;">Con lote, caducidad, stock mínimo y precios independientes del flujo normal.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearMayoreoInventorySearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newMayoreoInventoryBtn">Nuevo producto</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="mayoreoInventorySearch">Buscar producto mayoreo</label>
            <input id="mayoreoInventorySearch" placeholder="Ej. caja, M75030001, lote" value="${state.mayoreoInventoryQuery || ''}" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Tipo</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Lote</th>
                  <th>Caducidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(i => {
                  const cad = inventoryStatus(i);
                  const stk = stockStatus(i);
                  return `
                    <tr>
                      <td>
                        <div style="display:flex; gap:12px; align-items:center;">
                          <div class="product-thumb">${String(i.nombre || '').slice(0,2).toUpperCase()}</div>
                          <div>
                            <div style="font-weight:700;">${i.nombre}</div>
                            <div class="muted" style="font-size:.85rem;">$${Number(i.precio || 0).toFixed(2)} · ${i.categoria || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td>${i.sku || ''}</td>
                      <td>${i.tipo || 'Mayoreo'}</td>
                      <td><span class="status-tag ${stk.className}">${Number(i.stock || 0)}</span></td>
                      <td>${Number(i.stockMinimo || 0)}</td>
                      <td>${i.lote || ''}</td>
                      <td>${i.caducidad || ''}</td>
                      <td><span class="status-tag ${cad.className}">${cad.label}</span></td>
                      <td>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                          <button class="btn btn-secondary small-btn edit-mayoreo-inventory-btn" data-id="${i.id}">Editar</button>
                          <button class="btn btn-danger small-btn delete-mayoreo-inventory-btn" data-id="${i.id}">Borrar</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') || `<tr><td colspan="9" class="muted">No se encontraron productos mayoreo.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${item ? 'Editar producto mayoreo' : 'Alta de producto mayoreo'}</h3>
          <p class="muted">Este formulario mantiene separado el inventario de mayoreo del inventario normal.</p>
          <form id="mayoreoInventoryForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="mayoreoInventoryId" value="${item?.id || ''}" />
            <div class="input-group"><label for="mInvNombre">Nombre</label><input id="mInvNombre" value="${item?.nombre || ''}" required /></div>
            <div class="input-group"><label for="mInvCategoria">Categoría</label><input id="mInvCategoria" value="${item?.categoria || ''}" required /></div>
            <div class="input-group"><label for="mInvTipo">Tipo</label><select id="mInvTipo"><option ${item?.tipo === 'Genérico' ? 'selected' : ''}>Genérico</option><option ${item?.tipo === 'Original' ? 'selected' : ''}>Original</option><option ${item?.tipo === 'Controlado' ? 'selected' : ''}>Controlado</option></select></div>
            <div class="input-group"><label for="mInvSku">SKU</label><input id="mInvSku" value="${item?.sku || ''}" required /></div>
            <div class="input-group"><label for="mInvBarcode">Código barras</label><input id="mInvBarcode" value="${item?.barcode || ''}" required /></div>
            <div class="input-group"><label for="mInvLote">Lote</label><input id="mInvLote" value="${item?.lote || ''}" required /></div>
            <div class="input-group"><label for="mInvCosto">Costo</label><input id="mInvCosto" type="number" min="0" step="0.01" value="${item?.costo ?? ''}" required /></div>
            <div class="input-group"><label for="mInvPrecio">Precio mayoreo</label><input id="mInvPrecio" type="number" min="0" step="0.01" value="${item?.precio ?? ''}" required /></div>
            <div class="input-group"><label for="mInvStock">Stock</label><input id="mInvStock" type="number" min="0" value="${item?.stock ?? ''}" required /></div>
            <div class="input-group"><label for="mInvStockMin">Stock mínimo</label><input id="mInvStockMin" type="number" min="0" value="${item?.stockMinimo ?? ''}" required /></div>
            <div class="input-group"><label for="mInvCaducidad">Caducidad</label><input id="mInvCaducidad" type="date" value="${item?.caducidad || ''}" required /></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveMayoreoInventoryBtn">${item ? 'Guardar cambios' : 'Guardar producto'}</button>
            <button class="btn btn-secondary" id="resetMayoreoInventoryBtn">Limpiar formulario</button>
          </div>
          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Verde</span><span class="status-tag ok">Vigente</span></div>
            <div class="status-item"><span>Amarillo</span><span class="status-tag warn">Próximo a caducar</span></div>
            <div class="status-item"><span>Rojo</span><span class="status-tag danger">Vencido o stock bajo</span></div>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindMayoreoInventario(render) {
  document.getElementById('mayoreoInventorySearch')?.addEventListener('input', (e) => {
    state.mayoreoInventoryQuery = e.target.value;
    render();
  });

  document.getElementById('clearMayoreoInventorySearchBtn')?.addEventListener('click', () => {
    state.mayoreoInventoryQuery = '';
    render();
  });

  document.getElementById('newMayoreoInventoryBtn')?.addEventListener('click', () => {
    state.editingMayoreoInventoryId = '';
    render();
  });

  document.getElementById('resetMayoreoInventoryBtn')?.addEventListener('click', () => {
    state.editingMayoreoInventoryId = '';
    render();
  });

  document.querySelectorAll('.edit-mayoreo-inventory-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.editingMayoreoInventoryId = btn.dataset.id;
      render();
    });
  });

  document.querySelectorAll('.delete-mayoreo-inventory-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = getMayoreoInventory().filter(item => item.id !== btn.dataset.id);
      saveMayoreoInventory(next);
      if (state.editingMayoreoInventoryId === btn.dataset.id) state.editingMayoreoInventoryId = '';
      render();
      showToast('Producto mayoreo eliminado.');
    });
  });

  document.getElementById('saveMayoreoInventoryBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('mayoreoInventoryId').value || `m_inv_${Date.now()}`,
      nombre: document.getElementById('mInvNombre').value.trim(),
      categoria: document.getElementById('mInvCategoria').value.trim(),
      tipo: document.getElementById('mInvTipo').value,
      sku: document.getElementById('mInvSku').value.trim(),
      barcode: document.getElementById('mInvBarcode').value.trim(),
      lote: document.getElementById('mInvLote').value.trim(),
      costo: Number(document.getElementById('mInvCosto').value || 0),
      precio: Number(document.getElementById('mInvPrecio').value || 0),
      stock: Number(document.getElementById('mInvStock').value || 0),
      stockMinimo: Number(document.getElementById('mInvStockMin').value || 0),
      caducidad: document.getElementById('mInvCaducidad').value
    };

    if (!payload.nombre || !payload.categoria || !payload.sku || !payload.barcode || !payload.lote || !payload.caducidad) {
      showToast('Completa todos los campos del producto mayoreo.');
      return;
    }

    const items = getMayoreoInventory();
    const exists = items.some(item => item.id === payload.id);
    saveMayoreoInventory(exists ? items.map(item => item.id === payload.id ? payload : item) : [...items, payload]);
    state.editingMayoreoInventoryId = '';
    render();
    showToast(exists ? 'Producto mayoreo actualizado.' : 'Producto mayoreo guardado.');
  });
}
