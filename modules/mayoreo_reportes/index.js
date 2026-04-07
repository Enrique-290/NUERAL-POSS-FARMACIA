import { STORAGE_KEYS } from '../../core/constants.js';
import { load } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { inventoryStatus } from '../../core/utils.js';

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }
function dateOnly(iso) { const d = new Date(iso); return isNaN(d) ? '' : d.toISOString().slice(0,10); }
function filteredSales() {
  const sales = load(STORAGE_KEYS.MAYOREO_SALES, []);
  const q = (state.mayoreoReportQuery || '').trim().toLowerCase();
  const from = state.mayoreoReportFrom || '';
  const to = state.mayoreoReportTo || '';
  const pay = state.mayoreoReportPayment || '';
  return sales.filter(sale => {
    const saleDate = dateOnly(sale.fecha);
    const matchesQuery = !q || [sale.folio, sale.cliente, sale.pago, ...(sale.items||[]).map(i=>i.nombre)].some(v => String(v||'').toLowerCase().includes(q));
    const matchesFrom = !from || saleDate >= from;
    const matchesTo = !to || saleDate <= to;
    const matchesPay = !pay || sale.pago === pay;
    return matchesQuery && matchesFrom && matchesTo && matchesPay;
  });
}
function productTotals(sales) {
  const map = new Map();
  sales.forEach(sale => (sale.items||[]).forEach(item => { const prev = map.get(item.nombre) || { nombre: item.nombre, cantidad: 0, ventas: 0 }; prev.cantidad += Number(item.cantidad||0); prev.ventas += Number(item.cantidad||0)*Number(item.precio||0); map.set(item.nombre, prev); }));
  return [...map.values()].sort((a,b)=>b.ventas-a.ventas);
}
export function renderModule() {
  const sales = filteredSales();
  const inventory = load(STORAGE_KEYS.MAYOREO_INVENTORY, []);
  const top = productTotals(sales).slice(0,8);
  const totalVentas = sales.reduce((a,s)=>a+Number(s.total||0),0);
  const totalTickets = sales.length;
  const promedio = totalTickets ? totalVentas / totalTickets : 0;
  const descuentos = sales.reduce((a,s)=>a+Number(s.descuento||0),0);
  const lowStock = inventory.filter(i => Number(i.stock||0) <= Number(i.stockMinimo||0)).length;
  const caducar = inventory.filter(i => inventoryStatus(i).label !== 'Vigente').length;
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas mayoreo</div><div class="kpi-value">${money(totalVentas)}</div><div class="kpi-meta">Con filtros aplicados</div></article>
        <article class="card"><div class="muted">Tickets</div><div class="kpi-value">${totalTickets}</div><div class="kpi-meta">Operaciones encontradas</div></article>
        <article class="card"><div class="muted">Promedio ticket</div><div class="kpi-value">${money(promedio)}</div><div class="kpi-meta">Valor por operación</div></article>
        <article class="card"><div class="muted">Descuentos</div><div class="kpi-value">${money(descuentos)}</div><div class="kpi-meta">Aplicados a mayoreo</div></article>
      </section>
      <section class="grid grid-2" style="align-items:start;">
        <article class="card">
          <h3>Filtros reporte mayoreo</h3>
          <div class="grid grid-2" style="gap:12px; margin-top:14px;"><div class="input-group"><label for="mayoreoReportQuery">Buscar</label><input id="mayoreoReportQuery" value="${state.mayoreoReportQuery || ''}" placeholder="Cliente, folio, producto" /></div><div class="input-group"><label for="mayoreoReportPayment">Pago</label><select id="mayoreoReportPayment"><option value="">Todos</option>${['Efectivo','Tarjeta','Transferencia','Otro'].map(opt => `<option value="${opt}" ${(state.mayoreoReportPayment||'')===opt ? 'selected' : ''}>${opt}</option>`).join('')}</select></div><div class="input-group"><label for="mayoreoReportFrom">Desde</label><input id="mayoreoReportFrom" type="date" value="${state.mayoreoReportFrom || ''}" /></div><div class="input-group"><label for="mayoreoReportTo">Hasta</label><input id="mayoreoReportTo" type="date" value="${state.mayoreoReportTo || ''}" /></div></div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;"><button class="btn btn-secondary" id="mayoreoReportClearBtn">Limpiar filtros</button></div>
          <div class="status-list" style="margin-top:18px;"><div class="status-item"><span>Stock bajo mayoreo</span><span class="status-tag danger">${lowStock}</span></div><div class="status-item"><span>Por caducar</span><span class="status-tag warn">${caducar}</span></div><div class="status-item"><span>Clientes únicos</span><span class="status-tag soft-blue">${new Set(sales.map(s=>s.cliente)).size}</span></div></div>
        </article>
        <article class="card">
          <h3>Top productos mayoreo</h3>
          <div class="table-wrap" style="margin-top:14px;"><table><thead><tr><th>Producto</th><th>Piezas</th><th>Ventas</th></tr></thead><tbody>${top.map(item => `<tr><td>${item.nombre}</td><td>${item.cantidad}</td><td>${money(item.ventas)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sin datos para el filtro.</td></tr>'}</tbody></table></div>
        </article>
      </section>
      <section class="card">
        <h3>Detalle de ventas mayoreo</h3>
        <div class="table-wrap" style="margin-top:14px;"><table><thead><tr><th>Fecha</th><th>Folio</th><th>Cliente</th><th>Pago</th><th>Descuento</th><th>Total</th></tr></thead><tbody>${sales.map(sale => `<tr><td>${dateOnly(sale.fecha)}</td><td>${sale.folio}</td><td>${sale.cliente}</td><td>${sale.pago}</td><td>${money(sale.descuento)}</td><td>${money(sale.total)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No hay ventas mayoreo.</td></tr>'}</tbody></table></div>
      </section>
    </div>`;
}
export function bindMayoreoReportes(render) {
  document.getElementById('mayoreoReportQuery')?.addEventListener('input', e => { state.mayoreoReportQuery = e.target.value; render(); });
  document.getElementById('mayoreoReportPayment')?.addEventListener('change', e => { state.mayoreoReportPayment = e.target.value; render(); });
  document.getElementById('mayoreoReportFrom')?.addEventListener('change', e => { state.mayoreoReportFrom = e.target.value; render(); });
  document.getElementById('mayoreoReportTo')?.addEventListener('change', e => { state.mayoreoReportTo = e.target.value; render(); });
  document.getElementById('mayoreoReportClearBtn')?.addEventListener('click', () => { state.mayoreoReportQuery=''; state.mayoreoReportPayment=''; state.mayoreoReportFrom=''; state.mayoreoReportTo=''; render(); });
}
