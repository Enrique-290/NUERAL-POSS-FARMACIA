import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getInventory(){ return load(STORAGE_KEYS.MAYOREO_INVENTORY, []); }
function saveInventory(items){ save(STORAGE_KEYS.MAYOREO_INVENTORY, items); }
function getClients(){ return load(STORAGE_KEYS.MAYOREO_CLIENTS, []); }
function getSales(){ return load(STORAGE_KEYS.MAYOREO_SALES, []); }
function saveSales(items){ save(STORAGE_KEYS.MAYOREO_SALES, items); }
function money(n){ return `$${Number(n||0).toFixed(2)}`; }
function cart(){ return state.mayoreoCart || (state.mayoreoCart={ items: [], cliente:'', pago:'Efectivo', extraLabel:'', extraAmount:0 }); }
function emptyCart(){ state.mayoreoCart={ items: [], cliente:'', pago:'Efectivo', extraLabel:'', extraAmount:0 }; }
function totals(){ const c=cart(); const subtotal=c.items.reduce((a,i)=>a+Number(i.precio||0)*Number(i.cantidad||0),0); const extra=Number(c.extraAmount||0); return { subtotal, extra, total: subtotal+extra }; }
function addToCart(product){ const c=cart(); const found=c.items.find(i=>i.id===product.id); if(found){ if(found.cantidad+1>product.stock) return showToast('No hay suficiente stock mayoreo.'); found.cantidad+=1; } else { if(Number(product.stock||0)<=0) return showToast('Producto mayoreo sin stock.'); c.items.push({ id:product.id, nombre:product.nombre, precio:Number(product.precio||0), cantidad:1, stock:Number(product.stock||0) }); } }

export function renderModule(){
  const items=getInventory(); const clients=getClients().filter(c=>c.activo!==false);
  const q=(state.salesQueryMayoreo||'').trim().toLowerCase();
  const filtered=!q?items:items.filter(i => [i.nombre,i.sku,i.barcode].some(v => String(v||'').toLowerCase().includes(q)));
  const c=cart(); const t=totals();
  return `
  <div class="page">
    <section class="grid" style="grid-template-columns:1.15fr .85fr; align-items:start;">
      <article class="card">
        <div class="toolbar-row"><div><h3 style="margin:0;">Ventas mayoreo</h3><p class="muted" style="margin:6px 0 0;">Descuenta solo del inventario mayoreo.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearMayoreoSalesSearchBtn">Limpiar</button><button class="btn btn-primary" id="newMayoreoSaleBtn">Nueva venta</button></div></div>
        <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoSalesSearch">Buscar producto</label><input id="mayoreoSalesSearch" placeholder="Nombre, SKU o código" value="${state.salesQueryMayoreo||''}" /></div>
        <div class="grid grid-3" style="gap:14px;">${filtered.map(p=>`<article class="card" style="padding:14px; border-radius:16px;"><div style="display:flex; justify-content:space-between; gap:10px; align-items:start;"><div><div style="font-weight:800;">${p.nombre}</div><div class="muted" style="font-size:.88rem; margin-top:4px;">SKU: ${p.sku}</div><div class="muted" style="font-size:.88rem;">${p.categoria}</div></div><span class="status-tag ${Number(p.stock||0)<=Number(p.stockMinimo||0)?'danger':'soft-blue'}">Stock ${p.stock}</span></div><div class="kpi-value" style="font-size:1.4rem;">${money(p.precio)}</div><button class="btn btn-primary add-mayoreo-product-btn" data-id="${p.id}" style="width:100%;">Agregar</button></article>`).join('') || '<article class="card"><div class="muted">No se encontraron productos mayoreo.</div></article>'}</div>
      </article>
      <article class="card">
        <h3>Carrito mayoreo</h3>
        <p class="muted">Cliente, pago y total por volumen.</p>
        <div class="input-group" style="margin-top:14px;"><label for="mayoreoSaleClient">Cliente mayoreo</label><select id="mayoreoSaleClient"><option value="">Selecciona cliente</option>${clients.map(cli=>`<option value="${cli.nombre}" ${c.cliente===cli.nombre?'selected':''}>${cli.nombre}</option>`).join('')}</select></div>
        <div class="grid grid-2" style="margin-top:12px; gap:12px;"><div class="input-group"><label for="mayoreoSalePayment">Forma de pago</label><select id="mayoreoSalePayment">${['Efectivo','Tarjeta','Transferencia','Otro'].map(opt=>`<option ${c.pago===opt?'selected':''}>${opt}</option>`).join('')}</select></div><div class="input-group"><label for="mayoreoExtraLabel">Extra</label><input id="mayoreoExtraLabel" value="${c.extraLabel||''}" placeholder="Ej. flete" /></div></div>
        <div class="input-group" style="margin-top:12px;"><label for="mayoreoExtraAmount">Monto extra</label><input id="mayoreoExtraAmount" type="number" min="0" step="0.01" value="${c.extraAmount||0}" /></div>
        <div class="status-list" style="margin-top:16px;">${c.items.length?c.items.map(item=>`<div class="status-item" style="align-items:flex-start;"><div style="min-width:0; flex:1;"><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">${money(item.precio)} c/u · stock ${item.stock}</div></div><div style="display:flex; gap:8px; align-items:center;"><input class="qty-mayoreo-input" data-id="${item.id}" type="number" min="1" max="${item.stock}" value="${item.cantidad}" style="width:76px; padding:10px 12px;" /><button class="btn btn-secondary remove-mayoreo-item-btn" data-id="${item.id}">Quitar</button></div></div>`).join(''):'<div class="status-item"><span class="muted">Aún no hay productos en el carrito.</span></div>'}</div>
        <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line); display:grid; gap:8px;"><div style="display:flex; justify-content:space-between;"><span class="muted">Subtotal</span><b>${money(t.subtotal)}</b></div><div style="display:flex; justify-content:space-between;"><span class="muted">Extra</span><b>${money(t.extra)}</b></div><div style="display:flex; justify-content:space-between; font-size:1.08rem;"><span>Total</span><b>${money(t.total)}</b></div></div>
        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="chargeMayoreoBtn" ${c.items.length?'':'disabled'}>Cobrar</button><button class="btn btn-secondary" id="clearMayoreoCartBtn">Vaciar</button></div>
        ${state.mayoreoLastSale ? `<div class="hint" style="margin-top:12px;">Última venta: ${state.mayoreoLastSale}</div>`:''}
      </article>
    </section>
  </div>`;
}

export function bindMayoreoVentas(render){
  document.getElementById('mayoreoSalesSearch')?.addEventListener('input', e=>{ state.salesQueryMayoreo=e.target.value; render(); });
  document.getElementById('clearMayoreoSalesSearchBtn')?.addEventListener('click', ()=>{ state.salesQueryMayoreo=''; render(); });
  document.getElementById('newMayoreoSaleBtn')?.addEventListener('click', ()=>{ emptyCart(); render(); showToast('Venta mayoreo nueva lista.'); });
  document.querySelectorAll('.add-mayoreo-product-btn').forEach(btn => btn.addEventListener('click', ()=>{ const p=getInventory().find(x=>x.id===btn.dataset.id); if(p){ addToCart(p); render(); } }));
  document.querySelectorAll('.remove-mayoreo-item-btn').forEach(btn => btn.addEventListener('click', ()=>{ const c=cart(); c.items=c.items.filter(i=>i.id!==btn.dataset.id); render(); }));
  document.querySelectorAll('.qty-mayoreo-input').forEach(input => input.addEventListener('change', ()=>{ const item=cart().items.find(i=>i.id===input.dataset.id); if(!item) return; item.cantidad=Math.max(1, Math.min(Number(input.value)||1, item.stock)); render(); }));
  document.getElementById('mayoreoSaleClient')?.addEventListener('change', e=>{ cart().cliente=e.target.value; });
  document.getElementById('mayoreoSalePayment')?.addEventListener('change', e=>{ cart().pago=e.target.value; });
  document.getElementById('mayoreoExtraLabel')?.addEventListener('input', e=>{ cart().extraLabel=e.target.value; });
  document.getElementById('mayoreoExtraAmount')?.addEventListener('input', e=>{ cart().extraAmount=Number(e.target.value)||0; render(); });
  document.getElementById('clearMayoreoCartBtn')?.addEventListener('click', ()=>{ emptyCart(); render(); });
  document.getElementById('chargeMayoreoBtn')?.addEventListener('click', ()=>{
    const c=cart(); const t=totals(); if(!c.items.length) return showToast('Agrega productos mayoreo.'); if(!c.cliente) return showToast('Selecciona un cliente mayoreo.');
    const inv=getInventory().map(prod=>{ const line=c.items.find(i=>i.id===prod.id); return line ? { ...prod, stock: Number(prod.stock||0)-Number(line.cantidad||0) } : prod; });
    saveInventory(inv);
    const folio='MV-'+String(Date.now()).slice(-6);
    const sale={ id:`msale_${Date.now()}`, folio, fecha:new Date().toISOString(), cliente:c.cliente, pago:c.pago, extraLabel:c.extraLabel||'', extraAmount:Number(c.extraAmount||0), subtotal:t.subtotal, total:t.total, items:c.items.map(i=>({ nombre:i.nombre, cantidad:i.cantidad, precio:i.precio })) };
    saveSales([sale, ...getSales()]);
    state.mayoreoLastSale=`${folio} · ${c.cliente} · ${money(t.total)} · ${c.pago}`; emptyCart(); render(); showToast('Venta mayoreo registrada.');
  });
}
