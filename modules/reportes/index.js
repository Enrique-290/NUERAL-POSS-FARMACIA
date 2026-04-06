import { state } from '../../core/state.js';
import { load } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';

function getSales() {
  return load(STORAGE_KEYS.SALES, []);
}

function getInventory() {
  return load(STORAGE_KEYS.INVENTORY, []);
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function dateOnly(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso || '';
  return d.toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function inventoryStatus(item) {
  const today = new Date();
  const target = new Date(`${item.caducidad}T00:00:00`);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Vencido';
  if (diffDays <= 60) return 'Próximo';
  return 'Vigente';
}

function filteredSales() {
  const sales = getSales();
  const q = (state.reportQuery || '').trim().toLowerCase();
  const from = state.reportFrom || '';
  const to = state.reportTo || '';
  const pay = state.reportPayment || '';

  return sales.filter(sale => {
    const saleDate = dateOnly(sale.fecha);
    const matchesQuery = !q ||
      (sale.folio || '').toLowerCase().includes(q) ||
      (sale.cliente || '').toLowerCase().includes(q) ||
      (sale.pago || '').toLowerCase().includes(q) ||
      (sale.items || []).some(item => (item.nombre || '').toLowerCase().includes(q));

    const matchesFrom = !from || saleDate >= from;
    const matchesTo = !to || saleDate <= to;
    const matchesPay = !pay || sale.pago === pay;

    return matchesQuery && matchesFrom && matchesTo && matchesPay;
  });
}

function buildProductTotals(sales) {
  const map = new Map();
  sales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const key = item.nombre || 'Producto';
      const prev = map.get(key) || { nombre: key, cantidad: 0, ventas: 0 };
      prev.cantidad += Number(item.cantidad || 0);
      prev.ventas += Number(item.cantidad || 0) * Number(item.precio || 0);
      map.set(key, prev);
    });
  });
  return [...map.values()].sort((a, b) => b.ventas - a.ventas);
}

function buildPaymentTotals(sales) {
  const base = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, Otro: 0 };
  sales.forEach(sale => {
    const key = sale.pago || 'Otro';
    base[key] = (base[key] || 0) + Number(sale.total || 0);
  });
  return base;
}

function buildDailyTotals(sales) {
  const map = new Map();
  sales.forEach(sale => {
    const key = dateOnly(sale.fecha);
    const prev = map.get(key) || { fecha: key, total: 0, tickets: 0 };
    prev.total += Number(sale.total || 0);
    prev.tickets += 1;
    map.set(key, prev);
  });
  return [...map.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function renderModule() {
  const sales = filteredSales();
  const inventory = getInventory();
  const productTotals = buildProductTotals(sales).slice(0, 8);
  const paymentTotals = buildPaymentTotals(sales);
  const dailyTotals = buildDailyTotals(sales);

  const totalVentas = sales.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
  const totalTickets = sales.length;
  const totalPromedio = totalTickets ? totalVentas / totalTickets : 0;
  const totalExtras = sales.reduce((acc, sale) => acc + Number(sale.extraAmount || 0), 0);
  const lowStock = inventory.filter(item => Number(item.stock || 0) <= Number(item.stockMinimo || 0)).length;
  const caducar = inventory.filter(item => inventoryStatus(item) !== 'Vigente').length;

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas filtradas</div><div class="kpi-value">${money(totalVentas)}</div><div class="kpi-meta">Suma del periodo</div></article>
        <article class="card"><div class="muted">Tickets</div><div class="kpi-value">${totalTickets}</div><div class="kpi-meta">Registros encontrados</div></article>
        <article class="card"><div class="muted">Promedio ticket</div><div class="kpi-value">${money(totalPromedio)}</div><div class="kpi-meta">Promedio por venta</div></article>
        <article class="card"><div class="muted">Extras</div><div class="kpi-value">${money(totalExtras)}</div><div class="kpi-meta">Cargos adicionales</div></article>
      </section>

      <section class="grid grid-2" style="align-items:start;">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Reportes v1</h3>
              <p class="muted" style="margin:6px 0 0;">Filtro por texto, fechas y forma de pago.</p>
            </div>
          </div>
          <div class="grid grid-2" style="gap:12px;">
            <div class="input-group">
              <label for="reportQuery">Buscar</label>
              <input id="reportQuery" placeholder="Cliente, folio, producto" value="${state.reportQuery || ''}" />
            </div>
            <div class="input-group">
              <label for="reportPayment">Pago</label>
              <select id="reportPayment">
                <option value="">Todos</option>
                ${['Efectivo','Tarjeta','Transferencia','Otro'].map(opt => `<option value="${opt}" ${(state.reportPayment || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label for="reportFrom">Desde</label>
              <input id="reportFrom" type="date" value="${state.reportFrom || ''}" />
            </div>
            <div class="input-group">
              <label for="reportTo">Hasta</label>
              <input id="reportTo" type="date" value="${state.reportTo || ''}" />
            </div>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <button class="btn btn-secondary" id="reportClearBtn">Limpiar filtros</button>
          </div>

          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Stock bajo</span><span class="status-tag danger">${lowStock}</span></div>
            <div class="status-item"><span>Productos por caducar/vencidos</span><span class="status-tag warn">${caducar}</span></div>
            <div class="status-item"><span>Ventas en efectivo</span><span class="status-tag soft-blue">${money(paymentTotals.Efectivo)}</span></div>
            <div class="status-item"><span>Ventas con tarjeta</span><span class="status-tag soft-blue">${money(paymentTotals.Tarjeta)}</span></div>
            <div class="status-item"><span>Transferencias</span><span class="status-tag soft-blue">${money(paymentTotals.Transferencia)}</span></div>
          </div>
        </article>

        <article class="card">
          <h3>Ventas por día</h3>
          <p class="muted">Resumen rápido del periodo filtrado.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Fecha</th><th>Tickets</th><th>Total</th></tr></thead>
              <tbody>
                ${dailyTotals.map(row => `
                  <tr>
                    <td>${row.fecha}</td>
                    <td>${row.tickets}</td>
                    <td>${money(row.total)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="3" class="muted">Sin ventas para el filtro actual.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grid grid-2" style="align-items:start;">
        <article class="card">
          <h3>Productos más vendidos</h3>
          <p class="muted">Top por importe vendido.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Producto</th><th>Piezas</th><th>Ventas</th></tr></thead>
              <tbody>
                ${productTotals.map(item => `
                  <tr>
                    <td>${item.nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>${money(item.ventas)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="3" class="muted">Todavía no hay productos para mostrar.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>Detalle de ventas</h3>
          <p class="muted">Vista rápida para revisar cliente, pago y total.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Fecha</th><th>Folio</th><th>Cliente</th><th>Pago</th><th>Total</th></tr></thead>
              <tbody>
                ${sales.map(sale => `
                  <tr>
                    <td>${fmtDate(sale.fecha)}</td>
                    <td>${sale.folio}</td>
                    <td>${sale.cliente || 'Mostrador'}</td>
                    <td>${sale.pago}</td>
                    <td>${money(sale.total)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="5" class="muted">No hay ventas con este filtro.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindReportes(render) {
  document.getElementById('reportQuery')?.addEventListener('input', e => {
    state.reportQuery = e.target.value;
    render();
  });

  document.getElementById('reportPayment')?.addEventListener('change', e => {
    state.reportPayment = e.target.value;
    render();
  });

  document.getElementById('reportFrom')?.addEventListener('change', e => {
    state.reportFrom = e.target.value;
    render();
  });

  document.getElementById('reportTo')?.addEventListener('change', e => {
    state.reportTo = e.target.value;
    render();
  });

  document.getElementById('reportClearBtn')?.addEventListener('click', () => {
    state.reportQuery = '';
    state.reportPayment = '';
    state.reportFrom = '';
    state.reportTo = '';
    render();
  });
}
