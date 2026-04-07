export function renderDashboard() {
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Ventas hoy</div><div class="kpi-value">$12,480</div><div class="kpi-meta">+8.2% contra ayer</div></article>
        <article class="card"><div class="muted">Tickets</div><div class="kpi-value">87</div><div class="kpi-meta">Promedio $143.44</div></article>
        <article class="card"><div class="muted">Productos por caducar</div><div class="kpi-value">14</div><div class="kpi-meta">Revisar hoy</div></article>
        <article class="card"><div class="muted">Stock bajo</div><div class="kpi-value">22</div><div class="kpi-meta">Surtir desde bodega</div></article>
      </section>
      <section class="grid grid-2">
        <article class="card">
          <h3>Dashboard general</h3>
          <p class="muted">Aquí entran ventas del día, stock bajo, próximos a caducar y resumen de pagos.</p>
          <div class="status-list">
            <div class="status-item"><span>Paracetamol 500 mg</span><span class="status-tag ok">Vigente</span></div>
            <div class="status-item"><span>Omeprazol 20 mg</span><span class="status-tag warn">Próximo</span></div>
            <div class="status-item"><span>Jarabe Infantil A</span><span class="status-tag danger">Vencido</span></div>
          </div>
        </article>
        <article class="card">
          <h3>Resumen rápido</h3>
          <p class="muted">Vista base modular para seguir creciendo el sistema.</p>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Hora</th><th>Folio</th><th>Cliente</th><th>Total</th><th>Pago</th></tr></thead>
              <tbody>
                <tr><td>09:12</td><td>V-00124</td><td>Mostrador</td><td>$180.00</td><td>Efectivo</td></tr>
                <tr><td>09:24</td><td>V-00125</td><td>Ana Ruiz</td><td>$460.00</td><td>Tarjeta</td></tr>
                <tr><td>09:40</td><td>V-00126</td><td>Mostrador</td><td>$92.00</td><td>Transferencia</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `;
}
