import { STORAGE_KEYS } from '../../core/constants.js';
import { load } from '../../core/storage.js';
import { inventoryStatus } from '../../core/utils.js';

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

export function renderModule() {
  const inventory = load(STORAGE_KEYS.MAYOREO_INVENTORY, []);
  const sales = load(STORAGE_KEYS.MAYOREO_SALES, []);
  const clients = load(STORAGE_KEYS.MAYOREO_CLIENTS, []);
  const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const stockBajo = inventory.filter(i => Number(i.stock || 0) <= Number(i.stockMinimo || 0)).length;
  const porCaducar = inventory.filter(i => inventoryStatus(i).label !== 'Vigente').length;
  const top = [...inventory].sort((a,b)=>Number(b.stock||0)-Number(a.stock||0)).slice(0,5);
  const recientes = [...sales].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,5);

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas mayoreo</div><div class="kpi-value">${money(totalVentas)}</div><div class="kpi-meta">Acumulado registrado</div></article>
        <article class="card"><div class="muted">Clientes mayoreo</div><div class="kpi-value">${clients.length}</div><div class="kpi-meta">Base comercial activa</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">${stockBajo}</div><div class="kpi-meta">Por surtir</div></article>
        <article class="card"><div class="muted">Por caducar</div><div class="kpi-value">${porCaducar}</div><div class="kpi-meta">Revisar inventario</div></article>
      </section>
      <section class="grid grid-2">
        <article class="card">
          <h3>Inventario destacado</h3>
          <p class="muted">Vista rápida del stock mayoreo.</p>
          <div class="status-list">
            ${top.map(item => `<div class="status-item"><span>${item.nombre}</span><span class="status-tag ${Number(item.stock||0) <= Number(item.stockMinimo||0) ? 'danger' : 'soft-blue'}">${item.stock} pzas</span></div>`).join('') || '<div class="status-item"><span class="muted">Sin productos cargados.</span></div>'}
          </div>
        </article>
        <article class="card">
          <h3>Movimientos recientes</h3>
          <p class="muted">Últimas ventas del bloque mayoreo.</p>
          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead><tr><th>Fecha</th><th>Folio</th><th>Cliente</th><th>Total</th></tr></thead>
              <tbody>
                ${recientes.map(sale => `<tr><td>${String(sale.fecha || '').slice(0,16).replace('T',' ')}</td><td>${sale.folio}</td><td>${sale.cliente}</td><td>${money(sale.total)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Sin ventas mayoreo.</td></tr>'}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `;
}
