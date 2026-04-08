import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';
import { load, save } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';
import { addInventoryMovement } from '../../core/movements.js';

function emptyCart() {
  return { items: [], cliente: 'Mostrador', pago: 'Efectivo', receta: '', extraLabel: '', extraAmount: 0 };
}

function getInventoryProducts() {
  return load(STORAGE_KEYS.INVENTORY, [])
    .filter(p => p.activo !== false)
    .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
}

function getFilteredProducts() {
  const q = String(state.salesQuery || '').trim().toLowerCase();
  const items = getInventoryProducts();
  if (!q) return items;
  return items.filter(p => [
    p.nombre,
    p.sku,
    p.barcode,
    p.lote,
    p.categoria,
    p.presentacion,
    p.marca,
    p.descripcion
  ].filter(Boolean).join(' ').toLowerCase().includes(q));
}

function totals() {
  const subtotal = state.cart.items.reduce((a, i) => a + i.precio * i.cantidad, 0);
  const extra = Number(state.cart.extraAmount) || 0;
  return { subtotal, extra, total: subtotal + extra };
}

function stockBadgeClass(stock, min = 0) {
  if (Number(stock || 0) <= 0) return 'danger';
  if (Number(stock || 0) <= Number(min || 0)) return 'warn';
  return 'soft-blue';
}

function ensureCartItemFresh(item) {
  const product = getInventoryProducts().find(p => p.id === item.id);
  if (!product) return null;
  return {
    ...item,
    nombre: product.nombre,
    precio: Number(product.precio || 0),
    stock: Number(product.stock || 0),
    sku: product.sku,
    barcode: product.barcode,
    lote: product.lote || ''
  };
}

function refreshCartFromInventory() {
  state.cart.items = state.cart.items
    .map(ensureCartItemFresh)
    .filter(Boolean)
    .map(item => ({
      ...item,
      cantidad: Math.max(1, Math.min(Number(item.cantidad || 1), Number(item.stock || 0)))
    }))
    .filter(item => item.stock > 0);
}

export function renderVentas() {
  refreshCartFromInventory();
  const filtered = getInventoryProducts();
  const { subtotal, extra, total } = totals();

  return `
    <div class="page">
      <section class="grid" style="grid-template-columns:1.15fr .85fr; align-items:start;">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Ventas PRO v2</h3>
              <p class="muted" style="margin:6px 0 0;">Lee productos reales desde Inventario. Busca por nombre, SKU, código, lote, categoría, presentación y marca.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newSaleBtn">Nueva venta</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="salesSearch">Buscar producto</label>
            <input id="salesSearch" placeholder="Ej. paracetamol, 75020001, lote..." value="${state.salesQuery || ''}" />
          </div>

          <div class="grid grid-3" style="gap:14px;">
            ${filtered.map(p => `
              <article class="card product-card" data-product-search="${[p.nombre,p.sku,p.barcode,p.lote,p.categoria,p.presentacion,p.marca,p.descripcion].filter(Boolean).join(' ').toLowerCase().replace(/"/g,'&quot;')}" style="padding:14px; border-radius:16px;">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:start;">
                  <div>
                    <div style="font-weight:800;">${p.nombre}</div>
                    <div class="muted" style="font-size:.88rem; margin-top:4px;">SKU: ${p.sku || '—'}</div>
                    <div class="muted" style="font-size:.88rem;">${p.categoria || 'Sin categoría'}${p.presentacion ? ' · ' + p.presentacion : ''}</div>
                    ${p.marca ? `<div class="muted" style="font-size:.82rem;">${p.marca}</div>` : ''}
                  </div>
                  <span class="status-tag ${stockBadgeClass(p.stock, p.stockMinimo)}">Stock ${Number(p.stock || 0)}</span>
                </div>
                <div class="kpi-value" style="font-size:1.4rem;">$${Number(p.precio || 0).toFixed(2)}</div>
                <button class="btn btn-primary add-product-btn" data-id="${p.id}" style="width:100%;" ${Number(p.stock || 0) <= 0 ? 'disabled' : ''}>
                  ${Number(p.stock || 0) <= 0 ? 'Sin stock' : 'Agregar'}
                </button>
              </article>
            `).join('')}
            <article class="card" id="salesEmptyState" style="display:none;"><div class="muted">No se encontraron productos del inventario. Revisa que estén activos y dados de alta.</div></article>
          </div>
        </article>

        <article class="card">
          <h3>Carrito</h3>
          <p class="muted">La venta descuenta del inventario real y registra movimiento automático.</p>

          <div class="input-group" style="margin-top:14px;">
            <label for="saleClient">Cliente</label>
            <input id="saleClient" value="${state.cart.cliente}" placeholder="Mostrador o nombre del cliente" />
          </div>

          <div class="grid grid-2" style="margin-top:12px; gap:12px;">
            <div class="input-group">
              <label for="salePayment">Forma de pago</label>
              <select id="salePayment">${['Efectivo','Tarjeta','Transferencia','Otro'].map(opt => `<option ${state.cart.pago === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>
            </div>
            <div class="input-group">
              <label for="saleRecipe">Receta / referencia</label>
              <input id="saleRecipe" value="${state.cart.receta}" placeholder="Nombre de foto o nota" />
            </div>
          </div>

          <div class="grid grid-2" style="margin-top:12px; gap:12px;">
            <div class="input-group">
              <label for="extraLabel">Extra</label>
              <input id="extraLabel" value="${state.cart.extraLabel}" placeholder="Ej. consulta" />
            </div>
            <div class="input-group">
              <label for="extraAmount">Monto extra</label>
              <input id="extraAmount" type="number" min="0" step="0.01" value="${state.cart.extraAmount || 0}" />
            </div>
          </div>

          <div class="status-list" style="margin-top:16px;">
            ${state.cart.items.length ? state.cart.items.map(item => `
              <div class="status-item" style="align-items:flex-start;">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:700;">${item.nombre}</div>
                  <div class="muted" style="font-size:.85rem;">$${Number(item.precio || 0).toFixed(2)} c/u · stock ${Number(item.stock || 0)} · ${item.sku || '—'}</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <input class="qty-input" data-id="${item.id}" type="number" min="1" max="${item.stock}" value="${item.cantidad}" style="width:76px; padding:10px 12px;" />
                  <button class="btn btn-secondary remove-item-btn" data-id="${item.id}">Quitar</button>
                </div>
              </div>
            `).join('') : `<div class="status-item"><span class="muted">Aún no hay productos en el carrito.</span></div>`}
          </div>

          <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line); display:grid; gap:8px;">
            <div style="display:flex; justify-content:space-between;"><span class="muted">Subtotal</span><b>$${subtotal.toFixed(2)}</b></div>
            <div style="display:flex; justify-content:space-between;"><span class="muted">Extra</span><b>$${extra.toFixed(2)}</b></div>
            <div style="display:flex; justify-content:space-between; font-size:1.08rem;"><span>Total</span><b>$${total.toFixed(2)}</b></div>
          </div>

          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="chargeBtn" ${state.cart.items.length ? '' : 'disabled'}>Cobrar</button>
            <button class="btn btn-secondary" id="clearCartBtn">Vaciar</button>
          </div>

          ${state.lastSale ? `<div class="hint" style="margin-top:12px;">Última venta: ${state.lastSale}</div>` : ''}
        </article>
      </section>
    </div>
  `;
}


function filterSalesCards() {
  const q = String(state.salesQuery || '').trim().toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  let visible = 0;
  cards.forEach(card => {
    const haystack = String(card.dataset.productSearch || '').toLowerCase();
    const show = !q || haystack.includes(q);
    card.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });
  const emptyState = document.getElementById('salesEmptyState');
  if (emptyState) {
    emptyState.style.display = visible ? 'none' : '';
  }
}

export function bindVentas(render) {
  const salesSearch = document.getElementById('salesSearch');
  salesSearch?.addEventListener('input', e => {
    state.salesQuery = e.target.value;
    filterSalesCards();
  });

  document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
    state.salesQuery = '';
    if (salesSearch) salesSearch.value = '';
    filterSalesCards();
    salesSearch?.focus();
  });

  document.getElementById('newSaleBtn')?.addEventListener('click', () => {
    state.cart = emptyCart();
    render();
    showToast('Venta nueva lista.');
  });

  filterSalesCards();

  document.querySelectorAll('.add-product-btn').forEach(btn => btn.addEventListener('click', () => {
    const p = getInventoryProducts().find(x => x.id === btn.dataset.id);
    if (!p) return showToast('El producto ya no existe en inventario.');
    if (Number(p.stock || 0) <= 0) return showToast('Producto sin stock.');

    const found = state.cart.items.find(i => i.id === p.id);
    if (found) {
      if (found.cantidad + 1 > Number(p.stock || 0)) return showToast('No hay suficiente stock.');
      found.cantidad += 1;
      found.stock = Number(p.stock || 0);
      found.precio = Number(p.precio || 0);
    } else {
      state.cart.items.push({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio || 0),
        cantidad: 1,
        stock: Number(p.stock || 0),
        sku: p.sku || '',
        barcode: p.barcode || '',
        lote: p.lote || ''
      });
    }
    render();
  }));

  document.querySelectorAll('.remove-item-btn').forEach(btn => btn.addEventListener('click', () => {
    state.cart.items = state.cart.items.filter(i => i.id !== btn.dataset.id);
    render();
  }));

  document.querySelectorAll('.qty-input').forEach(input => input.addEventListener('change', () => {
    const item = state.cart.items.find(i => i.id === input.dataset.id);
    if (!item) return;
    item.cantidad = Math.max(1, Math.min(Number(input.value) || 1, Number(item.stock || 0)));
    render();
  }));

  document.getElementById('saleClient')?.addEventListener('input', e => state.cart.cliente = e.target.value);
  document.getElementById('salePayment')?.addEventListener('change', e => state.cart.pago = e.target.value);
  document.getElementById('saleRecipe')?.addEventListener('input', e => state.cart.receta = e.target.value);
  document.getElementById('extraLabel')?.addEventListener('input', e => state.cart.extraLabel = e.target.value);
  document.getElementById('extraAmount')?.addEventListener('input', e => {
    state.cart.extraAmount = Number(e.target.value) || 0;
    render();
  });

  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    state.cart = emptyCart();
    render();
  });

  document.getElementById('chargeBtn')?.addEventListener('click', () => {
    if (!state.cart.items.length) return showToast('Agrega al menos un producto.');

    const inventory = load(STORAGE_KEYS.INVENTORY, []);
    const issues = [];

    for (const cartItem of state.cart.items) {
      const product = inventory.find(p => p.id === cartItem.id);
      if (!product) {
        issues.push(`${cartItem.nombre}: ya no existe en inventario`);
        continue;
      }
      if (product.activo === false) {
        issues.push(`${cartItem.nombre}: está inactivo`);
        continue;
      }
      if (Number(product.stock || 0) < Number(cartItem.cantidad || 0)) {
        issues.push(`${cartItem.nombre}: stock insuficiente`);
      }
    }

    if (issues.length) {
      showToast(issues[0]);
      return;
    }

    const updatedInventory = inventory.map(product => {
      const cartItem = state.cart.items.find(i => i.id === product.id);
      if (!cartItem) return product;
      return { ...product, stock: Math.max(0, Number(product.stock || 0) - Number(cartItem.cantidad || 0)) };
    });

    save(STORAGE_KEYS.INVENTORY, updatedInventory);

    const { subtotal, extra, total } = totals();
    const folio = 'V-' + String(Date.now()).slice(-6);
    const sales = load(STORAGE_KEYS.SALES, []);

    const saleRecord = {
      id: `sale_${Date.now()}`,
      folio,
      fecha: new Date().toISOString(),
      cliente: state.cart.cliente || 'Mostrador',
      pago: state.cart.pago,
      receta: state.cart.receta,
      extraLabel: state.cart.extraLabel,
      extraAmount: extra,
      subtotal,
      total,
      items: state.cart.items.map(i => ({
        id: i.id,
        nombre: i.nombre,
        cantidad: Number(i.cantidad || 0),
        precio: Number(i.precio || 0),
        sku: i.sku || '',
        barcode: i.barcode || '',
        lote: i.lote || ''
      }))
    };

    sales.unshift(saleRecord);
    save(STORAGE_KEYS.SALES, sales);

    state.cart.items.forEach(item => {
      addInventoryMovement({
        productoId: item.id,
        producto: item.nombre,
        sku: item.sku || '',
        lote: item.lote || '',
        tipo: 'venta',
        cantidad: Number(item.cantidad || 0),
        signo: '-',
        modulo: 'ventas',
        nota: `Venta ${folio}`
      });
    });

    state.lastSale = `${folio} · ${state.cart.cliente || 'Mostrador'} · $${total.toFixed(2)} · ${state.cart.pago}`;
    state.cart = emptyCart();
    render();
    showToast('Venta registrada y descontada del inventario.');
  });
}
