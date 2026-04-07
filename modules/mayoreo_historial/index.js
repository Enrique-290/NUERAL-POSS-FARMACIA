import { STORAGE_KEYS } from '../../core/constants.js';
import { load } from '../../core/storage.js';
import { state } from '../../core/state.js';

function getSales() { return load(STORAGE_KEYS.MAYOREO_SALES, []); }
function money(n) { return `$${Number(n || 0).toFixed(2)}`; }
function fmtDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? (iso || '') : d.toLocaleString('es-MX', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}
export function renderModule() {
  const sales = getSales();
  const q = (state.mayoreoHistoryQuery || '').trim().toLowerCase();
  const filtered = !q ? sales : sales.filter(s => [s.folio, s.cliente, s.pago, ...(s.items||[]).map(i=>i.nombre)].some(v => String(v||'').toLowerCase().includes(q)));
  const selected = sales.find(s => s.id === state.selectedMayoreoSaleId) || filtered[0] || null;
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas registradas</div><div class="kpi-value">${sales.length}</div><div class="kpi-meta">Historial mayoreo</div></article>
        <article class="card"><div class="muted">Total vendido</div><div class="kpi-value">${money(sales.reduce((a,s)=>a+Number(s.total||0),0))}</div><div class="kpi-meta">Suma acumulada</div></article>
        <article class="card"><div class="muted">Con descuento</div><div class="kpi-value">${sales.filter(s => Number(s.descuento||0) > 0).length}</div><div class="kpi-meta">Operaciones con ajuste</div></article>
        <article class="card"><div class="muted">Clientes únicos</div><div class="kpi-value">${new Set(sales.map(s => s.cliente)).size}</div><div class="kpi-meta">Base atendida</div></article>
      </section>
      <section class="grid grid-2" style="align-items:start;">
        <article class="card">
          <div class="toolbar-row"><div><h3 style="margin:0;">Historial mayoreo</h3><p class="muted" style="margin:6px 0 0;">Búsqueda por folio, cliente, producto o pago.</p></div></div>
          <div class="input-group" style="margin-bottom:16px;"><label for="mayoreoHistorySearch">Buscar</label><input id="mayoreoHistorySearch" value="${state.mayoreoHistoryQuery || ''}" placeholder="Folio, cliente, producto" /></div>
          <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Folio</th><th>Cliente</th><th>Pago</th><th>Total</th><th>Acción</th></tr></thead><tbody>${filtered.map(sale => `<tr><td>${fmtDate(sale.fecha)}</td><td>${sale.folio}</td><td>${sale.cliente}</td><td>${sale.pago}</td><td>${money(sale.total)}</td><td><button class="btn btn-secondary small-btn view-mayoreo-sale-btn" data-id="${sale.id}">Ver</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No hay ventas mayoreo.</td></tr>'}</tbody></table></div>
        </article>
        <article class="card">
          <h3>Detalle</h3>
          ${selected ? `<p class="muted">${selected.folio} · ${selected.cliente}</p><div class="status-list">${selected.items.map(item => `<div class="status-item"><span>${item.nombre}</span><span class="status-tag soft-blue">${item.cantidad} × ${money(item.precio)}</span></div>`).join('')}</div><div style="margin-top:18px; display:grid; gap:8px;"><div style="display:flex; justify-content:space-between;"><span class="muted">Pago</span><b>${selected.pago}</b></div><div style="display:flex; justify-content:space-between;"><span class="muted">Descuento</span><b>${money(selected.descuento)}</b></div><div style="display:flex; justify-content:space-between;"><span class="muted">Subtotal</span><b>${money(selected.subtotal)}</b></div><div style="display:flex; justify-content:space-between; font-size:1.08rem;"><span>Total</span><b>${money(selected.total)}</b></div>${selected.observaciones ? `<div class="status-item"><span>Observaciones</span><span class="muted">${selected.observaciones}</span></div>` : ''}</div>` : '<p class="muted">Selecciona una venta para ver el detalle.</p>'}
        </article>
      </section>
    </div>`;
}
export function bindMayoreoHistorial(render) {
  document.getElementById('mayoreoHistorySearch')?.addEventListener('input', e => { state.mayoreoHistoryQuery = e.target.value; render(); });
  document.querySelectorAll('.view-mayoreo-sale-btn').forEach(btn => btn.addEventListener('click', () => { state.selectedMayoreoSaleId = btn.dataset.id; render(); }));
}
