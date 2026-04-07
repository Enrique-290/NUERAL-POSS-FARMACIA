import { STORAGE_KEYS } from '../../core/constants.js';
import { load } from '../../core/storage.js';

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function dateOnly(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function inventoryStatus(item) {
  const today = new Date();
  const target = new Date(`${item.caducidad}T00:00:00`);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Vencido';
  if (diffDays <= 60) return 'Próximo';
  return 'Vigente';
}

function getSales() {
  return load(STORAGE_KEYS.MAYOREO_SALES, []);
}

function getInventory() {
  return load(STORAGE_KEYS.MAYOREO_INVENTORY, []);
}

function getClients() {
  return load(STORAGE_KEYS.MAYOREO_CLIENTS, []);
}

function buildTopProducts(sales) {
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
  return [...map.values()].sort((a,b) => b.ventas - a.ventas).slice(0, 5);
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
  return [...map.values()].sort((a,b) => a.fecha.localeCompare(b.fecha));
}

function recentSales(sales) {
  return [...sales].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
}

export function renderModule() {
  const sales = getSales();
  const inventory = getInventory();
  const clients = getClients();
  const totalVentas = sales.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
  const totalTickets = sales.length;
  const promedio = totalTickets ? totalVentas / totalTickets : 0;
  const activeClients = clients.filter(c => c.activo !== false).length;
  const lowStock = inventory.filter(item => Number(item.stock || 0) <= Number(item.stockMinimo || 0)).length;
  const caducar = inventory.filter(item => inventoryStatus(item) !== 'Vigente').length;
  const topProducts = buildTopProducts(sales);
  const days = buildDailyTotals(sales);
  const last = recentSales(sales);

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas mayoreo</div><div class="kpi-value">${money(totalVentas)}</div><div class="kpi-meta">Total registrado</div></article>
        <article class="card"><div class="muted">Tickets mayoreo</div><div class="kpi-value">${totalTickets}</div><div class="kpi-meta">Operaciones capturadas</div></article>
        <article class="card"><div class="muted">Clientes activos</div><div class="kpi-value">${activeClients}</div><div class="kpi-meta">Base mayoreo actual</div></article>
        <article class="card"><div class="muted">Promedio ticket</div><div class="kpi-value">${money(promedio)}</div><div class="kpi-meta">Promedio por venta</div></article>
      </section>

      <section class="grid grid-2">
        <article class="card">
          <h3>Dashboard mayoreo v1</h3>
          <p class="muted">Vista inicial del bloque mayoreo con sus propios datos separados del flujo normal.</p>
          <div class="status-list">
            <div class="status-item"><span>Inventario mayoreo</span><span class="status-tag soft-blue">${inventory.length} productos</span></div>
            <div class="status-item"><span>Stock bajo</span><span class="status-tag danger">${lowStock}</span></div>
            <div class="status-item"><span>Próximos o vencidos</span><span class="status-tag warn">${caducar}</span></div>
            <div class="status-item"><span>Clientes mayoreo</span><span class="status-tag soft-blue">${clients.length}</span></div>
          </div>
        </article>

        <article class="card">
          <h3>Últimas ventas mayoreo</h3>
          <p class="muted">Resumen rápido para revisar movimiento reciente.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Fecha</th><th>Folio</th><th>Cliente</th><th>Pago</th><th>Total</th></tr></thead>
              <tbody>
                ${last.map(sale => `
                  <tr>
                    <td>${dateOnly(sale.fecha)}</td>
                    <td>${sale.folio}</td>
                    <td>${sale.cliente || 'Mayoreo'}</td>
                    <td>${sale.pago || 'Otro'}</td>
                    <td>${money(sale.total)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="5" class="muted">Aún no hay ventas mayoreo.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grid grid-2">
        <article class="card">
          <h3>Top productos mayoreo</h3>
          <p class="muted">Ordenados por importe vendido.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Producto</th><th>Piezas</th><th>Ventas</th></tr></thead>
              <tbody>
                ${topProducts.map(item => `
                  <tr>
                    <td>${item.nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>${money(item.ventas)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="3" class="muted">Sin datos aún.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>Ventas por día</h3>
          <p class="muted">Movimiento resumido del bloque mayoreo.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Fecha</th><th>Tickets</th><th>Total</th></tr></thead>
              <tbody>
                ${days.map(row => `
                  <tr>
                    <td>${row.fecha}</td>
                    <td>${row.tickets}</td>
                    <td>${money(row.total)}</td>
                  </tr>
                `).join('') || `<tr><td colspan="3" class="muted">Sin movimiento todavía.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `;
}
