import { state, emptyCart } from '../../core/state.js';
import { showToast } from '../../core/ui.js';

const sampleProducts = [
  { id: 'p1', sku: '75010001', barcode: '75010001', nombre: 'Paracetamol 500 mg', precio: 38, stock: 22, categoria: 'Genérico' },
  { id: 'p2', sku: '75010002', barcode: '75010002', nombre: 'Ibuprofeno 400 mg', precio: 55, stock: 18, categoria: 'Genérico' },
  { id: 'p3', sku: '75010003', barcode: '75010003', nombre: 'Omeprazol 20 mg', precio: 74, stock: 9, categoria: 'Original' },
  { id: 'p4', sku: '75010004', barcode: '75010004', nombre: 'Jarabe infantil', precio: 96, stock: 12, categoria: 'Pediatría' },
  { id: 'p5', sku: '75010005', barcode: '75010005', nombre: 'Loratadina 10 mg', precio: 49, stock: 25, categoria: 'Genérico' },
  { id: 'p6', sku: '75010006', barcode: '75010006', nombre: 'Vitamina C 1 g', precio: 89, stock: 14, categoria: 'Vitaminas' }
];

function totals() {
  const subtotal = state.cart.items.reduce((a, i) => a + (i.precio * i.cantidad), 0);
  const extra = Number(state.cart.extraAmount) || 0;
  return { subtotal, extra, total: subtotal + extra };
}

function addToCart(product, rerender) {
  const found = state.cart.items.find(i => i.id === product.id);
  if (found) {
    if (found.cantidad + 1 > product.stock) return showToast('No hay suficiente stock.');
    found.cantidad += 1;
  } else {
    if (product.stock <= 0) return showToast('Producto sin stock.');
    state.cart.items.push({ id: product.id, nombre: product.nombre, precio: product.precio, cantidad: 1, stock: product.stock, sku: product.sku, barcode: product.barcode });
  }
  rerender();
}

export function render() {
  const q = state.salesQuery.trim().toLowerCase();
  const filtered = !q ? sampleProducts : sampleProducts.filter(p => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q));
  const { subtotal, extra, total } = totals();
  return `
    <div class="page">
      <section class="ventas-grid">
        <article class="card">
          <div class="toolbar-row">
            <div><h3 style="margin:0;">Ventas</h3><p class="muted" style="margin:6px 0 0;">Buscador rápido por nombre, SKU o código de barras.</p></div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearSearchBtn">Limpiar</button><button class="btn btn-primary" id="newSaleBtn">Nueva venta</button></div>
          </div>
          <div class="input-group" style="margin-bottom:16px;"><label for="salesSearch">Buscar producto</label><input id="salesSearch" placeholder="Ej. paracetamol, 75010001" value="${state.salesQuery}" /></div>
          <div class="grid grid-3" style="gap:14px;">
            ${filtered.map(p => `
              <article class="card" style="padding:14px; border-radius:16px;">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:start;">
                  <div><div style="font-weight:800;">${p.nombre}</div><div class="muted" style="font-size:.88rem; margin-top:4px;">SKU: ${p.sku}</div><div class="muted" style="font-size:.88rem;">${p.categoria}</div></div>
                  <span class="status-tag ${p.stock <= 5 ? 'danger' : p.stock <= 10 ? 'warn' : 'soft-blue'}">Stock ${p.stock}</span>
                </div>
                <div class="kpi-value" style="font-size:1.4rem;">$${p.precio.toFixed(2)}</div>
                <button class="btn btn-primary add-product-btn" data-id="${p.id}" style="width:100%;">Agregar</button>
              </article>`).join('') || `<article class="card"><div class="muted">No se encontraron productos.</div></article>`}
          </div>
        </article>
        <article class="card">
          <h3>Carrito</h3>
          <p class="muted">Flujo base de venta con cliente, pago, receta y extras.</p>
          <div class="input-group" style="margin-top:14px;"><label for="saleClient">Cliente</label><input id="saleClient" value="${state.cart.cliente}" placeholder="Mostrador o nombre del cliente" /></div>
          <div class="grid grid-2" style="margin-top:12px; gap:12px;"><div class="input-group"><label for="salePayment">Forma de pago</label><select id="salePayment">${['Efectivo','Tarjeta','Transferencia','Otro'].map(opt => `<option ${state.cart.pago === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select></div><div class="input-group"><label for="saleRecipe">Receta / referencia</label><input id="saleRecipe" value="${state.cart.receta}" placeholder="Nombre de foto o nota" /></div></div>
          <div class="grid grid-2" style="margin-top:12px; gap:12px;"><div class="input-group"><label for="extraLabel">Extra</label><input id="extraLabel" value="${state.cart.extraLabel}" placeholder="Ej. consulta" /></div><div class="input-group"><label for="extraAmount">Monto extra</label><input id="extraAmount" type="number" min="0" step="0.01" value="${state.cart.extraAmount || 0}" /></div></div>
          <div class="status-list" style="margin-top:16px;">
            ${state.cart.items.length ? state.cart.items.map(item => `
              <div class="status-item" style="align-items:flex-start;">
                <div style="min-width:0; flex:1;"><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">$${item.precio.toFixed(2)} c/u · stock ${item.stock}</div></div>
                <div style="display:flex; gap:8px; align-items:center;"><input class="qty-input" data-id="${item.id}" type="number" min="1" max="${item.stock}" value="${item.cantidad}" style="width:76px; padding:10px 12px;" /><button class="btn btn-secondary remove-item-btn" data-id="${item.id}">Quitar</button></div>
              </div>`).join('') : `<div class="status-item"><span class="muted">Aún no hay productos en el carrito.</span></div>`}
          </div>
          <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line); display:grid; gap:8px;"><div style="display:flex; justify-content:space-between;"><span class="muted">Subtotal</span><b>$${subtotal.toFixed(2)}</b></div><div style="display:flex; justify-content:space-between;"><span class="muted">Extra</span><b>$${extra.toFixed(2)}</b></div><div style="display:flex; justify-content:space-between; font-size:1.08rem;"><span>Total</span><b>$${total.toFixed(2)}</b></div></div>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="chargeBtn" ${state.cart.items.length ? '' : 'disabled'}>Cobrar</button><button class="btn btn-secondary" id="clearCartBtn">Vaciar</button></div>
          ${state.lastSale ? `<div class="hint" style="margin-top:12px;">Última venta: ${state.lastSale}</div>` : ''}
        </article>
      </section>
    </div>`;
}

export function bind({ rerender }) {
  document.getElementById('salesSearch')?.addEventListener('input', e => { state.salesQuery = e.target.value; rerender(); });
  document.getElementById('clearSearchBtn')?.addEventListener('click', () => { state.salesQuery = ''; rerender(); });
  document.getElementById('newSaleBtn')?.addEventListener('click', () => { state.cart = emptyCart(); rerender(); showToast('Venta nueva lista.'); });
  document.querySelectorAll('.add-product-btn').forEach(btn => btn.addEventListener('click', () => { const p = sampleProducts.find(x => x.id === btn.dataset.id); if (p) addToCart(p, rerender); }));
  document.querySelectorAll('.remove-item-btn').forEach(btn => btn.addEventListener('click', () => { state.cart.items = state.cart.items.filter(i => i.id !== btn.dataset.id); rerender(); }));
  document.querySelectorAll('.qty-input').forEach(input => input.addEventListener('change', () => { const item = state.cart.items.find(i => i.id === input.dataset.id); if (!item) return; item.cantidad = Math.max(1, Math.min(Number(input.value) || 1, item.stock)); rerender(); }));
  document.getElementById('saleClient')?.addEventListener('input', e => { state.cart.cliente = e.target.value; });
  document.getElementById('salePayment')?.addEventListener('change', e => { state.cart.pago = e.target.value; });
  document.getElementById('saleRecipe')?.addEventListener('input', e => { state.cart.receta = e.target.value; });
  document.getElementById('extraLabel')?.addEventListener('input', e => { state.cart.extraLabel = e.target.value; });
  document.getElementById('extraAmount')?.addEventListener('input', e => { state.cart.extraAmount = Number(e.target.value) || 0; rerender(); });
  document.getElementById('clearCartBtn')?.addEventListener('click', () => { state.cart = emptyCart(); rerender(); });
  document.getElementById('chargeBtn')?.addEventListener('click', () => {
    const subtotal = state.cart.items.reduce((a, i) => a + (i.precio * i.cantidad), 0);
    const total = subtotal + (Number(state.cart.extraAmount) || 0);
    if (!state.cart.items.length) return showToast('Agrega al menos un producto.');
    const folio = 'V-' + String(Date.now()).slice(-6);
    state.lastSale = `${folio} · ${state.cart.cliente || 'Mostrador'} · $${total.toFixed(2)} · ${state.cart.pago}`;
    state.cart = emptyCart();
    rerender();
    showToast('Venta registrada.');
  });
}
