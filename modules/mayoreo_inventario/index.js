import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus, stockStatus, showToast } from '../../core/utils.js';

function getItems(){ return load(STORAGE_KEYS.MAYOREO_INVENTORY, []); }
function saveItems(items){ save(STORAGE_KEYS.MAYOREO_INVENTORY, items); }
function stats(items){
  return {
    total: items.length,
    bajos: items.filter(i=>Number(i.stock||0)<=Number(i.stockMinimo||0)).length,
    proximos: items.filter(i=>inventoryStatus(i).label==='Próximo').length,
    vencidos: items.filter(i=>inventoryStatus(i).label==='Vencido').length
  };
}
function editing(){ return getItems().find(i=>i.id===state.editingMayoreoInventoryId) || null; }

export function renderModule(){
  const items=getItems();
  const q=(state.mayoreoInventoryQuery||'').trim().toLowerCase();
  const filtered=!q?items:items.filter(i => [i.nombre,i.sku,i.barcode,i.lote].some(v => String(v||'').toLowerCase().includes(q)));
  const s=stats(items); const item=editing();
  return `
  <div class="page">
    <section class="grid grid-4">
      <article class="card"><div class="muted">Productos mayoreo</div><div class="kpi-value">${s.total}</div><div class="kpi-meta">Inventario separado</div></article>
      <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${s.bajos}</div><div class="kpi-meta">Comparado con mínimo</div></article>
      <article class="card"><div class="muted">Próximos a caducar</div><div class="kpi-value">${s.proximos}</div><div class="kpi-meta">Amarillo</div></article>
      <article class="card"><div class="muted">Vencidos</div><div class="kpi-value">${s.vencidos}</div><div class="kpi-meta">Rojo</div></article>
    </section>
    <section class="inventory-grid">
      <article class="card">
        <div class="toolbar-row"><div><h3 style="margin:0;">Inventario mayoreo</h3><p class="muted" style="margin:6px 0 0;">No comparte stock con el inventario normal.</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn btn-secondary" id="clearMayoreoInventorySearchBtn">Limpiar</button><button class="btn btn-primary" id="newMayoreoInventoryBtn">Nuevo producto</button></div></div>
        <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoInventorySearch">Buscar</label><input id="mayoreoInventorySearch" placeholder="Nombre, SKU, código, lote" value="${state.mayoreoInventoryQuery||''}" /></div>
        <div class="table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Tipo</th><th>Stock</th><th>Mínimo</th><th>Lote</th><th>Caducidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        ${filtered.map(i=>{ const cad=inventoryStatus(i), stk=stockStatus(i); return `<tr><td><div style="display:flex; gap:12px; align-items:center;"><div class="product-thumb">${i.nombre.slice(0,2).toUpperCase()}</div><div><div style="font-weight:700;">${i.nombre}</div><div class="muted" style="font-size:.85rem;">$${Number(i.precio).toFixed(2)} · ${i.categoria}</div></div></div></td><td>${i.sku}</td><td>${i.tipo}</td><td><span class="status-tag ${stk.className}">${i.stock}</span></td><td>${i.stockMinimo}</td><td>${i.lote}</td><td>${i.caducidad}</td><td><span class="status-tag ${cad.className}">${cad.label}</span></td><td><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-secondary small-btn edit-mayoreo-inventory-btn" data-id="${i.id}">Editar</button><button class="btn btn-danger small-btn delete-mayoreo-inventory-btn" data-id="${i.id}">Borrar</button></div></td></tr>`;}).join('') || `<tr><td colspan="9" class="muted">No se encontraron productos.</td></tr>`}
        </tbody></table></div>
      </article>
      <article class="card">
        <h3>${item?'Editar producto mayoreo':'Alta de producto mayoreo'}</h3>
        <p class="muted">Base separada para piezas por volumen.</p>
        <form class="inventory-form-grid" style="margin-top:14px;">
          <input type="hidden" id="mayoreoInventoryId" value="${item?.id||''}" />
          <div class="input-group"><label for="mInvNombre">Nombre</label><input id="mInvNombre" value="${item?.nombre||''}" /></div>
          <div class="input-group"><label for="mInvCategoria">Categoría</label><input id="mInvCategoria" value="${item?.categoria||''}" /></div>
          <div class="input-group"><label for="mInvTipo">Tipo</label><select id="mInvTipo"><option ${item?.tipo==='Genérico'?'selected':''}>Genérico</option><option ${item?.tipo==='Original'?'selected':''}>Original</option><option ${item?.tipo==='Controlado'?'selected':''}>Controlado</option></select></div>
          <div class="input-group"><label for="mInvSku">SKU</label><input id="mInvSku" value="${item?.sku||''}" /></div>
          <div class="input-group"><label for="mInvBarcode">Código barras</label><input id="mInvBarcode" value="${item?.barcode||''}" /></div>
          <div class="input-group"><label for="mInvLote">Lote</label><input id="mInvLote" value="${item?.lote||''}" /></div>
          <div class="input-group"><label for="mInvCosto">Costo</label><input id="mInvCosto" type="number" min="0" step="0.01" value="${item?.costo ?? ''}" /></div>
          <div class="input-group"><label for="mInvPrecio">Precio mayoreo</label><input id="mInvPrecio" type="number" min="0" step="0.01" value="${item?.precio ?? ''}" /></div>
          <div class="input-group"><label for="mInvStock">Stock</label><input id="mInvStock" type="number" min="0" value="${item?.stock ?? ''}" /></div>
          <div class="input-group"><label for="mInvStockMin">Stock mínimo</label><input id="mInvStockMin" type="number" min="0" value="${item?.stockMinimo ?? ''}" /></div>
          <div class="input-group"><label for="mInvCaducidad">Caducidad</label><input id="mInvCaducidad" type="date" value="${item?.caducidad||''}" /></div>
        </form>
        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="saveMayoreoInventoryBtn">${item?'Guardar cambios':'Guardar producto'}</button><button class="btn btn-secondary" id="resetMayoreoInventoryBtn">Limpiar formulario</button></div>
      </article>
    </section>
  </div>`;
}

export function bindMayoreoInventario(render){
  document.getElementById('mayoreoInventorySearch')?.addEventListener('input', e=>{ state.mayoreoInventoryQuery=e.target.value; render(); });
  document.getElementById('clearMayoreoInventorySearchBtn')?.addEventListener('click', ()=>{ state.mayoreoInventoryQuery=''; render(); });
  document.getElementById('newMayoreoInventoryBtn')?.addEventListener('click', ()=>{ state.editingMayoreoInventoryId=''; render(); });
  document.getElementById('resetMayoreoInventoryBtn')?.addEventListener('click', ()=>{ state.editingMayoreoInventoryId=''; render(); });
  document.querySelectorAll('.edit-mayoreo-inventory-btn').forEach(btn => btn.addEventListener('click', ()=>{ state.editingMayoreoInventoryId=btn.dataset.id; render(); }));
  document.querySelectorAll('.delete-mayoreo-inventory-btn').forEach(btn => btn.addEventListener('click', ()=>{ saveItems(getItems().filter(i=>i.id!==btn.dataset.id)); if(state.editingMayoreoInventoryId===btn.dataset.id) state.editingMayoreoInventoryId=''; render(); showToast('Producto mayoreo eliminado.'); }));
  document.getElementById('saveMayoreoInventoryBtn')?.addEventListener('click', ()=>{
    const payload={ id: document.getElementById('mayoreoInventoryId').value || `mInv_${Date.now()}`,
      nombre: document.getElementById('mInvNombre').value.trim(), categoria: document.getElementById('mInvCategoria').value.trim(), tipo: document.getElementById('mInvTipo').value,
      sku: document.getElementById('mInvSku').value.trim(), barcode: document.getElementById('mInvBarcode').value.trim(), lote: document.getElementById('mInvLote').value.trim(),
      costo: Number(document.getElementById('mInvCosto').value||0), precio: Number(document.getElementById('mInvPrecio').value||0), stock: Number(document.getElementById('mInvStock').value||0), stockMinimo: Number(document.getElementById('mInvStockMin').value||0), caducidad: document.getElementById('mInvCaducidad').value };
    if(!payload.nombre || !payload.categoria || !payload.sku || !payload.barcode || !payload.lote || !payload.caducidad) return showToast('Completa todos los campos del producto mayoreo.');
    const items=getItems(); const exists=items.some(i=>i.id===payload.id); saveItems(exists?items.map(i=>i.id===payload.id?payload:i):[...items,payload]); state.editingMayoreoInventoryId=''; render(); showToast(exists?'Producto mayoreo actualizado.':'Producto mayoreo guardado.');
  });
}
