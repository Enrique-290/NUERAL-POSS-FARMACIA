import { state } from '../../core/state.js';
import { load } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';

function getSales() {
  return load(STORAGE_KEYS.MAYOREO_SALES, []);
}

function getInventory() {
  return load(STORAGE_KEYS.MAYOREO_INVENTORY, []);
}

function getClients() {
  return load(STORAGE_KEYS.MAYOREO_CLIENTS, []);
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
  const q = String(state.mayoreoReportQuery || '').trim().toLowerCase();
  const from = state.mayoreoReportFrom || '';
  const to = state.mayoreoReportTo || '';
  const pay = state.mayoreoReportPayment || '';

  return sales.filter(sale => {
    const saleDate = dateOnly(sale.fecha);
    const matchesQuery = !q ||
      String(sale.folio || '').toLowerCase().includes(q) ||
      String(sale.cliente || '').toLowerCase().includes(q) ||
      String(sale.pago || '').toLowerCase().includes(q) ||
      String(sale.nota || '').toLowerCase().includes(q) ||
      (sale.items || []).some(item => String(item.nombre || '').toLowerCase().includes(q));

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

function buildClientTotals(sales) {
  const map = new Map();
  sales.forEach(sale => {
    const key = sale.cliente || 'Sin cliente';
    const prev = map.get(key) || { nombre: key, tickets: 0, total: 0 };
    prev.tickets += 1;
    prev.total += Number(sale.total || 0);
    map.set(key, prev);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function buildPaymentTotals(sales) {
  const base = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, Crédito: 0, Otro: 0 };
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
  const clients = getClients();
  const productTotals = buildProductTotals(sales).slice(0, 8);
  const clientTotals = buildClientTotals(sales).slice(0, 8);
  const paymentTotals = buildPaymentTotals(sales);
  const dailyTotals = buildDailyTotals(sales);

  const totalVentas = sales.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
  const totalTickets = sales.length;
  const totalPromedio = totalTickets ? totalVentas / totalTickets : 0;
  const totalExtras = sales.reduce((acc, sale) => acc + Number(sale.extraAmount || 0), 0);
  const lowStock = inventory.filter(item => Number(item.stock || 0) <= Number(item.stockMinimo || 0)).length;
  const caducar = inventory.filter(item => inventoryStatus(item) !== 'Vigente').length;
  const activos = clients.filter(item => item.activo !== false).length;

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas mayoreo</div><div class="kpi-value">${money(totalVentas)}</div><div class="kpi-meta">Suma del periodo</div></article>
        <article class="card"><div class="muted">Tickets mayoreo</div><div class="kpi-value">${totalTickets}</div><div class="kpi-meta">Registros filtrados</div></article>
        <article class="card"><div class="muted">Promedio ticket</div><div class="kpi-value">${money(totalPromedio)}</div><div class="kpi-meta">Promedio por venta</div></article>
        <article class="card"><div class="muted">Clientes activos</div><div class="kpi-value">${activos}</div><div class="kpi-meta">Base comercial activa</div></article>
      </section>

      <section class="grid grid-2" style="align-items:start;">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Reporte mayoreo v1</h3>
              <p class="muted" style="margin:6px 0 0;">Ventas, clientes y stock del bloque mayoreo, separado del flujo normal.</p>
            </div>
          </div>
          <div class="grid grid-2" style="gap:12px;">
            <div class="input-group">
              <label for="mayoreoReportQuery">Buscar</label>
              <input id="mayoreoReportQuery" placeholder="Cliente, folio, producto, nota" value="${state.mayoreoReportQuery || ''}" />
            </div>
            <div class="input-group">
              <label for="mayoreoReportPayment">Pago</label>
              <select id="mayoreoReportPayment">
                <option value="">Todos</option>
                ${['Efectivo','Tarjeta','Transferencia','Crédito','Otro'].map(opt => `<option value="${opt}" ${(state.mayoreoReportPayment || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label for="mayoreoReportFrom">Desde</label>
              <input id="mayoreoReportFrom" type="date" value="${state.mayoreoReportFrom || ''}" />
            </div>
            <div class="input-group">
              <label for="mayoreoReportTo">Hasta</label>
              <input id="mayoreoReportTo" type="date" value="${state.mayoreoReportTo || ''}" />
            </div>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <button class="btn btn-secondary" id="mayoreoReportClearBtn">Limpiar filtros</button>
          </div>

          <div class="status-list" style="margin-top:18px;">
            <div class="status-item"><span>Stock bajo mayoreo</span><span class="status-tag danger">${lowStock}</span></div>
            <div class="status-item"><span>Productos por caducar/vencidos</span><span class="status-tag warn">${caducar}</span></div>
            <div class="status-item"><span>Extras</span><span class="status-tag soft-blue">${money(totalExtras)}</span></div>
            <div class="status-item"><span>Transferencias</span><span class="status-tag soft-blue">${money(paymentTotals.Transferencia)}</span></div>
            <div class="status-item"><span>Crédito</span><span class="status-tag soft-blue">${money(paymentTotals.Crédito)}</span></div>
          </div>
        </article>

        <article class="card">
          <h3>Ventas por día</h3>
          <p class="muted">Resumen del bloque mayoreo en el periodo filtrado.</p>
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
                `).join('') || `<tr><td colspan="3" class="muted">Sin ventas mayoreo para el filtro actual.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grid grid-2" style="align-items:start;">
        <article class="card">
          <h3>Productos más vendidos</h3>
          <p class="muted">Top por importe vendido en mayoreo.</p>
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
                `).join('') || `<tr><td colspan="3" class="muted">Todavía no hay productos mayoreo para mostrar.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>Clientes con más compra</h3>
          <p class="muted">Top por importe de compra mayoreo.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Cliente</th><th>Tickets</th><th>Total</th></tr></thead>
              <tbody>
                ${clientTotals.map(item => `
                  <tr>
                    <td>${item.nombre}</td>
                    <td>${item.tickets}</td>
                    <td>${money(item.total)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="3" class="muted">Todavía no hay clientes mayoreo con compras.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grid grid-1" style="align-items:start;">
        <article class="card">
          <h3>Detalle de ventas mayoreo</h3>
          <p class="muted">Vista rápida para revisar cliente, forma de pago, nota y total.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Fecha</th><th>Folio</th><th>Cliente</th><th>Pago</th><th>Nota</th><th>Total</th></tr></thead>
              <tbody>
                ${sales.map(sale => `
                  <tr>
                    <td>${fmtDate(sale.fecha)}</td>
                    <td>${sale.folio || '-'}</td>
                    <td>${sale.cliente || 'Sin cliente'}</td>
                    <td>${sale.pago || '-'}</td>
                    <td>${sale.nota || '-'}</td>
                    <td>${money(sale.total)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="muted">No hay ventas mayoreo con este filtro.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindMayoreoReportes(render) {
  document.getElementById('mayoreoReportQuery')?.addEventListener('input', e => {
    state.mayoreoReportQuery = e.target.value;
    render();
  });

  document.getElementById('mayoreoReportPayment')?.addEventListener('change', e => {
    state.mayoreoReportPayment = e.target.value;
    render();
  });

  document.getElementById('mayoreoReportFrom')?.addEventListener('change', e => {
    state.mayoreoReportFrom = e.target.value;
    render();
  });

  document.getElementById('mayoreoReportTo')?.addEventListener('change', e => {
    state.mayoreoReportTo = e.target.value;
    render();
  });

  document.getElementById('mayoreoReportClearBtn')?.addEventListener('click', () => {
    state.mayoreoReportQuery = '';
    state.mayoreoReportPayment = '';
    state.mayoreoReportFrom = '';
    state.mayoreoReportTo = '';
    render();
  });
}
