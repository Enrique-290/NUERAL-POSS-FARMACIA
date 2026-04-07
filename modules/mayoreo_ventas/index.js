import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getInventory() { return load(STORAGE_KEYS.MAYOREO_INVENTORY, []); }
function saveInventory(items) { save(STORAGE_KEYS.MAYOREO_INVENTORY, items); }
function getClients() { return load(STORAGE_KEYS.MAYOREO_CLIENTS, []); }
function getSales() { return load(STORAGE_KEYS.MAYOREO_SALES, []); }
function saveSales(items) { save(STORAGE_KEYS.MAYOREO_SALES, items); }
function money(n) { return `$${Number(n || 0).toFixed(2)}`; }
function addToCart(product) {
  const found = state.mayoreoCart.items.find(i => i.id === product.id);
  if (found) {
    if (found.cantidad + 1 > product.stock) return showToast('No hay suficiente stock mayoreo.');
    found.cantidad += 1;
  } else {
    if (product.stock <= 0) return showToast('Producto sin stock mayoreo.');
    state.mayoreoCart.items.push({ id: product.id, nombre: product.nombre, precio: product.precio, cantidad: 1, stock: product.stock });
  }
}
function totals() {
  const subtotal = state.mayoreoCart.items.reduce((a, i) => a + Number(i.precio || 0) * Number(i.cantidad || 0), 0);
  const descuento = Number(state.mayoreoCart.descuento || 0);
  return { subtotal, descuento, total: Math.max(0, subtotal - descuento) };
}
export function renderModule() {
  const inventory = getInventory();
  const clients = getClients();
  const q = (state.mayoreoQuery || '').trim().toLowerCase();
  const filtered = !q ? inventory : inventory.filter(item => [item.nombre,item.sku,item.barcode].some(v => String(v||'').toLowerCase().includes(q)));
  const { subtotal, descuento, total } = totals();
  return `
    <div class="page">
      <section class="grid" style="grid-template-columns:1.15fr .85fr; align-items:start;">
        <article class="card">
          <div class="toolbar-row"><div><h3 style="margin:0;">Ventas mayoreo</h3><p class="muted" style="margin:6px 0 0;">Usa solo el inventario mayoreo.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearMayoreoSearchBtn">Limpiar</button><button class="btn btn-primary" id="newMayoreoSaleBtn">Nueva venta</button></div></div>
          <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoSearch">Buscar producto mayoreo</label><input id="mayoreoSearch" value="${state.mayoreoQuery || ''}" placeholder="Nombre, SKU, código" /></div>
          <div class="grid grid-3" style="gap:14px;">${filtered.map(p => `<article class="card" style="padding:14px; border-radius:16px;"><div style="display:flex; justify-content:space-between; gap:10px; align-items:start;"><div><div style="font-weight:800;">${p.nombre}</div><div class="muted" style="font-size:.88rem; margin-top:4px;">SKU: ${p.sku}</div><div class="muted" style="font-size:.88rem;">${p.categoria}</div></div><span class="status-tag ${Number(p.stock||0) <= Number(p.stockMinimo||0) ? 'danger' : 'soft-blue'}">Stock ${p.stock}</span></div><div class="kpi-value" style="font-size:1.4rem;">${money(p.precio)}</div><button class="btn btn-primary add-mayoreo-product-btn" data-id="${p.id}" style="width:100%;">Agregar</button></article>`).join('') || '<article class="card"><div class="muted">No se encontraron productos.</div></article>'}</div>
        </article>
        <article class="card">
          <h3>Pedido mayoreo</h3>
          <p class="muted">Con cliente, pago, descuento y observaciones.</p>
          <div class="input-group" style="margin-top:14px;"><label for="mayoreoClient">Cliente mayoreo</label><select id="mayoreoClient"><option value="">Selecciona cliente</option>${clients.map(c => `<option value="${c.nombre}" ${state.mayoreoCart.cliente === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select></div>
          <div class="grid grid-2" style="margin-top:12px; gap:12px;"><div class="input-group"><label for="mayoreoPayment">Forma de pago</label><select id="mayoreoPayment">${['Transferencia','Efectivo','Tarjeta','Otro'].map(opt => `<option ${state.mayoreoCart.pago === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select></div><div class="input-group"><label for="mayoreoDiscount">Descuento</label><input id="mayoreoDiscount" type="number" min="0" step="0.01" value="${state.mayoreoCart.descuento || 0}" /></div></div>
          <div class="input-group" style="margin-top:12px;"><label for="mayoreoObs">Observaciones</label><input id="mayoreoObs" value="${state.mayoreoCart.observaciones || ''}" placeholder="Entrega, nota, crédito, etc." /></div>
          <div class="status-list" style="margin-top:16px;">${state.mayoreoCart.items.length ? state.mayoreoCart.items.map(item => `<div class="status-item" style="align-items:flex-start;"><div style="min-width:0; flex:1;"><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">${money(item.precio)} c/u · stock ${item.stock}</div></div><div style="display:flex; gap:8px; align-items:center;"><input class="mayoreo-qty-input" data-id="${item.id}" type="number" min="1" max="${item.stock}" value="${item.cantidad}" style="width:76px; padding:10px 12px;" /><button class="btn btn-secondary remove-mayoreo-item-btn" data-id="${item.id}">Quitar</button></div></div>`).join('') : '<div class="status-item"><span class="muted">Aún no hay productos en el carrito mayoreo.</span></div>'}</div>
          <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line); display:grid; gap:8px;"><div style="display:flex; justify-content:space-between;"><span class="muted">Subtotal</span><b>${money(subtotal)}</b></div><div style="display:flex; justify-content:space-between;"><span class="muted">Descuento</span><b>${money(descuento)}</b></div><div style="display:flex; justify-content:space-between; font-size:1.08rem;"><span>Total</span><b>${money(total)}</b></div></div>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="chargeMayoreoBtn" ${state.mayoreoCart.items.length ? '' : 'disabled'}>Registrar venta</button><button class="btn btn-secondary" id="clearMayoreoCartBtn">Vaciar</button></div>
          ${state.lastMayoreoSale ? `<div class="hint" style="margin-top:12px;">Última venta: ${state.lastMayoreoSale}</div>` : ''}
        </article>
      </section>
    </div>`;
}
export function bindMayoreoVentas(render) {
  document.getElementById('mayoreoSearch')?.addEventListener('input', e => { state.mayoreoQuery = e.target.value; render(); });
  document.getElementById('clearMayoreoSearchBtn')?.addEventListener('click', () => { state.mayoreoQuery = ''; render(); });
  document.getElementById('newMayoreoSaleBtn')?.addEventListener('click', () => { state.mayoreoCart = { items: [], cliente: '', pago: 'Transferencia', descuento: 0, observaciones: '' }; render(); showToast('Venta mayoreo nueva lista.'); });
  document.querySelectorAll('.add-mayoreo-product-btn').forEach(btn => btn.addEventListener('click', () => { const p = getInventory().find(x => x.id === btn.dataset.id); if (p) { addToCart(p); render(); } }));
  document.querySelectorAll('.remove-mayoreo-item-btn').forEach(btn => btn.addEventListener('click', () => { state.mayoreoCart.items = state.mayoreoCart.items.filter(i => i.id !== btn.dataset.id); render(); }));
  document.querySelectorAll('.mayoreo-qty-input').forEach(input => input.addEventListener('change', () => { const item = state.mayoreoCart.items.find(i => i.id === input.dataset.id); if (item) { item.cantidad = Math.max(1, Math.min(Number(input.value)||1, item.stock)); render(); } }));
  document.getElementById('mayoreoClient')?.addEventListener('change', e => { state.mayoreoCart.cliente = e.target.value; });
  document.getElementById('mayoreoPayment')?.addEventListener('change', e => { state.mayoreoCart.pago = e.target.value; });
  document.getElementById('mayoreoDiscount')?.addEventListener('input', e => { state.mayoreoCart.descuento = Number(e.target.value) || 0; render(); });
  document.getElementById('mayoreoObs')?.addEventListener('input', e => { state.mayoreoCart.observaciones = e.target.value; });
  document.getElementById('clearMayoreoCartBtn')?.addEventListener('click', () => { state.mayoreoCart = { items: [], cliente: '', pago: 'Transferencia', descuento: 0, observaciones: '' }; render(); });
  document.getElementById('chargeMayoreoBtn')?.addEventListener('click', () => {
    const { subtotal, descuento, total } = totals();
    if (!state.mayoreoCart.items.length) return showToast('Agrega productos mayoreo.');
    if (!state.mayoreoCart.cliente) return showToast('Selecciona cliente mayoreo.');
    const sales = getSales();
    const folio = `M-${String(Date.now()).slice(-6)}`;
    const payload = { id: `msale_${Date.now()}`, folio, fecha: new Date().toISOString(), cliente: state.mayoreoCart.cliente, pago: state.mayoreoCart.pago, descuento, observaciones: state.mayoreoCart.observaciones, subtotal, total, items: state.mayoreoCart.items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })) };
    saveSales([payload, ...sales]);
    const updatedInv = getInventory().map(item => {
      const sold = state.mayoreoCart.items.find(i => i.id === item.id);
      return sold ? { ...item, stock: Math.max(0, Number(item.stock || 0) - Number(sold.cantidad || 0)) } : item;
    });
    saveInventory(updatedInv);
    state.lastMayoreoSale = `${folio} · ${payload.cliente} · ${money(total)} · ${payload.pago}`;
    state.mayoreoCart = { items: [], cliente: '', pago: 'Transferencia', descuento: 0, observaciones: '' };
    render();
    showToast('Venta mayoreo registrada.');
  });
}
