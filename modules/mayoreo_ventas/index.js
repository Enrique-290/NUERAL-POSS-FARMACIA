import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';
import { load, save } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';

function emptyMayoreoCart() {
  return { items: [], cliente: '', pago: 'Transferencia', nota: '', extraLabel: '', extraAmount: 0 };
}

function ensureCart() {
  if (!state.mayoreoCart || !Array.isArray(state.mayoreoCart.items)) {
    state.mayoreoCart = emptyMayoreoCart();
  }
}

function getInventory() {
  return load(STORAGE_KEYS.MAYOREO_INVENTORY, []);
}

function getClients() {
  return load(STORAGE_KEYS.MAYOREO_CLIENTS, []);
}

function totals() {
  ensureCart();
  const subtotal = state.mayoreoCart.items.reduce((acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
  const extra = Number(state.mayoreoCart.extraAmount || 0);
  return { subtotal, extra, total: subtotal + extra };
}

function addToCart(product) {
  ensureCart();
  const found = state.mayoreoCart.items.find(item => item.id === product.id);
  if (found) {
    if (found.cantidad + 1 > Number(product.stock || 0)) {
      showToast('No hay suficiente stock mayoreo.');
      return false;
    }
    found.cantidad += 1;
    return true;
  }
  if (Number(product.stock || 0) <= 0) {
    showToast('Producto mayoreo sin stock.');
    return false;
  }
  state.mayoreoCart.items.push({
    id: product.id,
    nombre: product.nombre,
    precio: Number(product.precio || 0),
    cantidad: 1,
    stock: Number(product.stock || 0),
    sku: product.sku,
    barcode: product.barcode,
    lote: product.lote || ''
  });
  return true;
}

export function renderModule() {
  ensureCart();
  const inventory = getInventory();
  const clients = getClients().filter(client => client.activo !== false);
  const query = String(state.mayoreoSalesQuery || '').trim().toLowerCase();
  const filtered = !query ? inventory : inventory.filter(item =>
    String(item.nombre || '').toLowerCase().includes(query) ||
    String(item.sku || '').toLowerCase().includes(query) ||
    String(item.barcode || '').toLowerCase().includes(query) ||
    String(item.lote || '').toLowerCase().includes(query)
  );
  const { subtotal, extra, total } = totals();

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Productos mayoreo</div><div class="kpi-value">${inventory.length}</div><div class="kpi-meta">Inventario separado</div></article>
        <article class="card"><div class="muted">Clientes mayoreo</div><div class="kpi-value">${clients.length}</div><div class="kpi-meta">Base activa</div></article>
        <article class="card"><div class="muted">Items en carrito</div><div class="kpi-value">${state.mayoreoCart.items.reduce((a, i) => a + Number(i.cantidad || 0), 0)}</div><div class="kpi-meta">Piezas seleccionadas</div></article>
        <article class="card"><div class="muted">Total actual</div><div class="kpi-value">$${total.toFixed(2)}</div><div class="kpi-meta">Venta mayoreo</div></article>
      </section>

      <section class="grid" style="grid-template-columns:1.15fr .85fr; align-items:start;">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Ventas mayoreo v1</h3>
              <p class="muted" style="margin:6px 0 0;">Busca por nombre, SKU, código o lote. Este flujo solo usa inventario mayoreo.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearMayoreoSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newMayoreoSaleBtn">Nueva venta</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="mayoreoSalesSearch">Buscar producto mayoreo</label>
            <input id="mayoreoSalesSearch" placeholder="Ej. paracetamol caja, M75030001" value="${state.mayoreoSalesQuery || ''}" />
          </div>

          <div class="grid grid-3" style="gap:14px;">
            ${filtered.map(item => `
              <article class="card" style="padding:14px; border-radius:16px;">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:start;">
                  <div>
                    <div style="font-weight:800;">${item.nombre}</div>
                    <div class="muted" style="font-size:.88rem; margin-top:4px;">SKU: ${item.sku}</div>
                    <div class="muted" style="font-size:.88rem;">Lote: ${item.lote || 'N/D'}</div>
                  </div>
                  <span class="status-tag ${Number(item.stock || 0) <= Number(item.stockMinimo || 0) ? 'danger' : Number(item.stock || 0) <= Number(item.stockMinimo || 0) + 4 ? 'warn' : 'soft-blue'}">Stock ${item.stock}</span>
                </div>
                <div class="kpi-value" style="font-size:1.4rem;">$${Number(item.precio || 0).toFixed(2)}</div>
                <div class="muted" style="font-size:.86rem; margin:6px 0 12px;">${item.categoria || 'General'} · ${item.tipo || 'Mayoreo'}</div>
                <button class="btn btn-primary add-mayoreo-product-btn" data-id="${item.id}" style="width:100%;">Agregar</button>
              </article>
            `).join('') || `<article class="card"><div class="muted">No se encontraron productos mayoreo.</div></article>`}
          </div>
        </article>

        <article class="card">
          <h3>Carrito mayoreo</h3>
          <p class="muted">Cliente, forma de pago y nota comercial. La venta descuenta solo stock mayoreo.</p>

          <div class="input-group" style="margin-top:14px;">
            <label for="mayoreoClientSelect">Cliente mayoreo</label>
            <select id="mayoreoClientSelect">
              <option value="">Selecciona cliente</option>
              ${clients.map(client => `<option value="${client.nombre}" ${state.mayoreoCart.cliente === client.nombre ? 'selected' : ''}>${client.nombre}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-2" style="margin-top:12px; gap:12px;">
            <div class="input-group">
              <label for="mayoreoPayment">Forma de pago</label>
              <select id="mayoreoPayment">
                ${['Transferencia','Efectivo','Tarjeta','Crédito'].map(opt => `<option ${state.mayoreoCart.pago === opt ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label for="mayoreoNote">Nota / referencia</label>
              <input id="mayoreoNote" value="${state.mayoreoCart.nota || ''}" placeholder="Pedido semanal, remisión, etc." />
            </div>
          </div>

          <div class="grid grid-2" style="margin-top:12px; gap:12px;">
            <div class="input-group">
              <label for="mayoreoExtraLabel">Extra</label>
              <input id="mayoreoExtraLabel" value="${state.mayoreoCart.extraLabel || ''}" placeholder="Flete, maniobra..." />
            </div>
            <div class="input-group">
              <label for="mayoreoExtraAmount">Monto extra</label>
              <input id="mayoreoExtraAmount" type="number" min="0" step="0.01" value="${state.mayoreoCart.extraAmount || 0}" />
            </div>
          </div>

          <div class="status-list" style="margin-top:16px;">
            ${state.mayoreoCart.items.length ? state.mayoreoCart.items.map(item => `
              <div class="status-item" style="align-items:flex-start;">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:700;">${item.nombre}</div>
                  <div class="muted" style="font-size:.85rem;">$${Number(item.precio).toFixed(2)} c/u · stock ${item.stock}</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <input class="mayoreo-qty-input" data-id="${item.id}" type="number" min="1" max="${item.stock}" value="${item.cantidad}" style="width:76px; padding:10px 12px;" />
                  <button class="btn btn-secondary remove-mayoreo-item-btn" data-id="${item.id}">Quitar</button>
                </div>
              </div>
            `).join('') : `<div class="status-item"><span class="muted">Aún no hay productos en el carrito mayoreo.</span></div>`}
          </div>

          <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line); display:grid; gap:8px;">
            <div style="display:flex; justify-content:space-between;"><span class="muted">Subtotal</span><b>$${subtotal.toFixed(2)}</b></div>
            <div style="display:flex; justify-content:space-between;"><span class="muted">Extra</span><b>$${extra.toFixed(2)}</b></div>
            <div style="display:flex; justify-content:space-between; font-size:1.08rem;"><span>Total</span><b>$${total.toFixed(2)}</b></div>
          </div>

          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="chargeMayoreoBtn" ${state.mayoreoCart.items.length ? '' : 'disabled'}>Cobrar mayoreo</button>
            <button class="btn btn-secondary" id="clearMayoreoCartBtn">Vaciar</button>
          </div>

          ${state.mayoreoLastSale ? `<div class="hint" style="margin-top:12px;">Última venta mayoreo: ${state.mayoreoLastSale}</div>` : ''}
        </article>
      </section>
    </div>
  `;
}

export function bindMayoreoVentas(render) {
  ensureCart();

  document.getElementById('mayoreoSalesSearch')?.addEventListener('input', (e) => {
    state.mayoreoSalesQuery = e.target.value;
    render();
  });

  document.getElementById('clearMayoreoSearchBtn')?.addEventListener('click', () => {
    state.mayoreoSalesQuery = '';
    render();
  });

  document.getElementById('newMayoreoSaleBtn')?.addEventListener('click', () => {
    state.mayoreoCart = emptyMayoreoCart();
    render();
    showToast('Venta mayoreo nueva lista.');
  });

  document.querySelectorAll('.add-mayoreo-product-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = getInventory().find(item => item.id === btn.dataset.id);
      if (!product) return;
      if (addToCart(product)) render();
    });
  });

  document.querySelectorAll('.remove-mayoreo-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mayoreoCart.items = state.mayoreoCart.items.filter(item => item.id !== btn.dataset.id);
      render();
    });
  });

  document.querySelectorAll('.mayoreo-qty-input').forEach((input) => {
    input.addEventListener('change', () => {
      const item = state.mayoreoCart.items.find(row => row.id === input.dataset.id);
      if (!item) return;
      item.cantidad = Math.max(1, Math.min(Number(input.value) || 1, Number(item.stock || 0)));
      render();
    });
  });

  document.getElementById('mayoreoClientSelect')?.addEventListener('change', (e) => {
    state.mayoreoCart.cliente = e.target.value;
  });

  document.getElementById('mayoreoPayment')?.addEventListener('change', (e) => {
    state.mayoreoCart.pago = e.target.value;
  });

  document.getElementById('mayoreoNote')?.addEventListener('input', (e) => {
    state.mayoreoCart.nota = e.target.value;
  });

  document.getElementById('mayoreoExtraLabel')?.addEventListener('input', (e) => {
    state.mayoreoCart.extraLabel = e.target.value;
  });

  document.getElementById('mayoreoExtraAmount')?.addEventListener('input', (e) => {
    state.mayoreoCart.extraAmount = Number(e.target.value) || 0;
    render();
  });

  document.getElementById('clearMayoreoCartBtn')?.addEventListener('click', () => {
    state.mayoreoCart = emptyMayoreoCart();
    render();
  });

  document.getElementById('chargeMayoreoBtn')?.addEventListener('click', () => {
    ensureCart();
    if (!state.mayoreoCart.items.length) return showToast('Agrega al menos un producto mayoreo.');
    if (!state.mayoreoCart.cliente) return showToast('Selecciona un cliente mayoreo.');

    const { subtotal, extra, total } = totals();
    const folio = 'M-' + String(Date.now()).slice(-6);
    const sales = load(STORAGE_KEYS.MAYOREO_SALES, []);
    sales.unshift({
      id: `m_sale_${Date.now()}`,
      folio,
      fecha: new Date().toISOString(),
      cliente: state.mayoreoCart.cliente,
      pago: state.mayoreoCart.pago,
      nota: state.mayoreoCart.nota,
      extraLabel: state.mayoreoCart.extraLabel,
      extraAmount: extra,
      subtotal,
      total,
      items: state.mayoreoCart.items.map(item => ({ nombre: item.nombre, cantidad: item.cantidad, precio: item.precio }))
    });
    save(STORAGE_KEYS.MAYOREO_SALES, sales);

    const inventory = getInventory().map(product => {
      const sold = state.mayoreoCart.items.find(item => item.id === product.id);
      if (!sold) return product;
      return { ...product, stock: Math.max(0, Number(product.stock || 0) - Number(sold.cantidad || 0)) };
    });
    save(STORAGE_KEYS.MAYOREO_INVENTORY, inventory);

    state.mayoreoLastSale = `${folio} · ${state.mayoreoCart.cliente} · $${total.toFixed(2)} · ${state.mayoreoCart.pago}`;
    state.mayoreoCart = emptyMayoreoCart();
    render();
    showToast('Venta mayoreo registrada.');
  });
}
