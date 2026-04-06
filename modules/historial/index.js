import { state } from '../../core/state.js';
import { load } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';

function getSales() {
  return load(STORAGE_KEYS.SALES, []);
}

function fmtMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso || '';
  return d.toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function filteredSales() {
  const q = state.historyQuery.trim().toLowerCase();
  const sales = getSales();
  if (!q) return sales;
  return sales.filter(sale =>
    sale.folio.toLowerCase().includes(q) ||
    (sale.cliente || '').toLowerCase().includes(q) ||
    (sale.pago || '').toLowerCase().includes(q) ||
    (sale.items || []).some(item => (item.nombre || '').toLowerCase().includes(q))
  );
}

function detailMarkup(sale) {
  if (!sale) return `<div class="status-item"><span class="muted">Todavía no hay ventas registradas.</span></div>`;
  return `
    <div class="status-list" id="historyDetailCard">
      <div class="status-item"><span>Folio</span><b>${sale.folio}</b></div>
      <div class="status-item"><span>Cliente</span><b>${sale.cliente || 'Mostrador'}</b></div>
      <div class="status-item"><span>Fecha</span><b>${fmtDate(sale.fecha)}</b></div>
      <div class="status-item"><span>Pago</span><b>${sale.pago}</b></div>
      <div class="status-item"><span>Subtotal</span><b>${fmtMoney(sale.subtotal)}</b></div>
      <div class="status-item"><span>Extra</span><b>${fmtMoney(sale.extraAmount)}</b></div>
      <div class="status-item"><span>Total</span><b>${fmtMoney(sale.total)}</b></div>
      <div class="status-item"><span>Receta</span><b>${sale.receta || 'Sin receta'}</b></div>
    </div>
    <div class="table-wrap" style="margin-top:14px;">
      <table style="min-width:100%;">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead>
        <tbody>
          ${(sale.items || []).map(item => `
            <tr>
              <td>${item.nombre}</td>
              <td>${item.cantidad}</td>
              <td>${fmtMoney(item.precio)}</td>
              <td>${fmtMoney(item.cantidad * item.precio)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderModule() {
  const sales = filteredSales();
  const totalVentas = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalTickets = sales.length;
  const totalExtras = sales.reduce((acc, s) => acc + Number(s.extraAmount || 0), 0);
  const conReceta = sales.filter(s => s.receta).length;

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Tickets</div><div class="kpi-value">${totalTickets}</div><div class="kpi-meta">Registros en historial</div></article>
        <article class="card"><div class="muted">Ventas acumuladas</div><div class="kpi-value">${fmtMoney(totalVentas)}</div><div class="kpi-meta">Total filtrado</div></article>
        <article class="card"><div class="muted">Extras</div><div class="kpi-value">${fmtMoney(totalExtras)}</div><div class="kpi-meta">Consultas o cargos extra</div></article>
        <article class="card"><div class="muted">Con receta</div><div class="kpi-value">${conReceta}</div><div class="kpi-meta">Ventas con referencia</div></article>
      </section>

      <section class="grid" style="grid-template-columns: 1.08fr .92fr; align-items:start;">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Historial v1</h3>
              <p class="muted" style="margin:6px 0 0;">Consulta por folio, cliente, producto o forma de pago.</p>
            </div>
          </div>
          <div class="input-group" style="margin-bottom:16px;">
            <label for="historySearch">Buscar en historial</label>
            <input id="historySearch" placeholder="Ej. Ana Ruiz, V-240401, tarjeta" value="${state.historyQuery}" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Receta</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                ${sales.map((sale, idx) => `
                  <tr>
                    <td>${fmtDate(sale.fecha)}</td>
                    <td>${sale.folio}</td>
                    <td>${sale.cliente || 'Mostrador'}</td>
                    <td>${sale.pago}</td>
                    <td>${fmtMoney(sale.total)}</td>
                    <td><span class="status-tag ${sale.receta ? 'soft-blue' : 'ok'}">${sale.receta ? 'Sí' : 'No'}</span></td>
                    <td><button class="btn btn-secondary small-btn history-detail-btn" data-idx="${idx}">Ver</button></td>
                  </tr>
                `).join('') || `<tr><td colspan="7" class="muted">No hay ventas que coincidan con la búsqueda.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card" id="historyDetailWrap">
          <h3>Detalle de venta</h3>
          <p class="muted">Selecciona un registro del historial para ver el desglose.</p>
          ${detailMarkup(sales[0])}
        </article>
      </section>
    </div>
  `;
}

export function bindHistorial(render) {
  document.getElementById('historySearch')?.addEventListener('input', e => {
    state.historyQuery = e.target.value;
    render();
  });

  document.querySelectorAll('.history-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sales = filteredSales();
      const sale = sales[Number(btn.dataset.idx)];
      const wrap = document.getElementById('historyDetailWrap');
      if (!wrap || !sale) return;
      wrap.innerHTML = `<h3>Detalle de venta</h3><p class="muted">Desglose del folio seleccionado.</p>${detailMarkup(sale)}`;
    });
  });
}
