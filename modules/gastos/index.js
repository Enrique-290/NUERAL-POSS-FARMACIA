import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getExpenses() {
  return load(STORAGE_KEYS.EXPENSES, []);
}

function saveExpenses(items) {
  save(STORAGE_KEYS.EXPENSES, items);
}

function getEditingExpense() {
  return getExpenses().find(item => item.id === state.editingGastoId) || null;
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function dateOnly(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function expenseStats(items) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekMin = weekAgo.toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const total = items.reduce((acc, item) => acc + Number(item.monto || 0), 0);
  const hoy = items.filter(item => dateOnly(item.fecha) === today).reduce((acc, item) => acc + Number(item.monto || 0), 0);
  const semana = items.filter(item => {
    const d = dateOnly(item.fecha);
    return d >= weekMin && d <= today;
  }).reduce((acc, item) => acc + Number(item.monto || 0), 0);
  const mes = items.filter(item => dateOnly(item.fecha).startsWith(monthPrefix)).reduce((acc, item) => acc + Number(item.monto || 0), 0);

  return { total, hoy, semana, mes };
}

function categoryTotals(items) {
  const map = new Map();
  items.forEach(item => {
    const key = item.categoria || 'Otros';
    map.set(key, (map.get(key) || 0) + Number(item.monto || 0));
  });
  return [...map.entries()].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

export function renderGastos() {
  const items = getExpenses();
  const q = (state.gastosQuery || '').trim().toLowerCase();
  const filtered = !q ? items : items.filter(item =>
    (item.concepto || '').toLowerCase().includes(q) ||
    (item.categoria || '').toLowerCase().includes(q) ||
    (item.notas || '').toLowerCase().includes(q) ||
    (item.responsable || '').toLowerCase().includes(q) ||
    (item.pago || '').toLowerCase().includes(q)
  );
  const stats = expenseStats(items);
  const editing = getEditingExpense();
  const topCategories = categoryTotals(filtered).slice(0, 5);

  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Gasto total</div><div class="kpi-value">${money(stats.total)}</div><div class="kpi-meta">Acumulado registrado</div></article>
        <article class="card"><div class="muted">Hoy</div><div class="kpi-value">${money(stats.hoy)}</div><div class="kpi-meta">Salidas del día</div></article>
        <article class="card"><div class="muted">Semana</div><div class="kpi-value">${money(stats.semana)}</div><div class="kpi-meta">Últimos 7 días</div></article>
        <article class="card"><div class="muted">Mes</div><div class="kpi-value">${money(stats.mes)}</div><div class="kpi-meta">Mes actual</div></article>
      </section>

      <section class="inventory-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Gastos v1</h3>
              <p class="muted" style="margin:6px 0 0;">Registro de salidas como renta, luz, agua, gasolina, sueldos y mantenimiento.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-secondary" id="clearGastosSearchBtn">Limpiar</button>
              <button class="btn btn-primary" id="newGastoBtn">Nuevo gasto</button>
            </div>
          </div>

          <div class="input-group" style="margin-bottom:16px;">
            <label for="gastosSearch">Buscar gasto</label>
            <input id="gastosSearch" placeholder="Concepto, categoría, notas, responsable" value="${state.gastosQuery || ''}" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Pago</th>
                  <th>Responsable</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(item => `
                  <tr>
                    <td>${dateOnly(item.fecha)}</td>
                    <td>
                      <div style="font-weight:700;">${item.concepto}</div>
                      <div class="muted" style="font-size:.85rem;">${item.notas ? item.notas.slice(0, 55) : 'Sin notas'}</div>
                    </td>
                    <td><span class="status-tag soft-blue">${item.categoria || 'Otros'}</span></td>
                    <td>${item.pago || 'Efectivo'}</td>
                    <td>${item.responsable || '-'}</td>
                    <td><span class="status-tag danger">${money(item.monto)}</span></td>
                    <td>
                      <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-secondary small-btn edit-gasto-btn" data-id="${item.id}">Editar</button>
                        <button class="btn btn-danger small-btn delete-gasto-btn" data-id="${item.id}">Borrar</button>
                      </div>
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="7" class="muted">No se encontraron gastos.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card">
          <h3>${editing ? 'Editar gasto' : 'Alta de gasto'}</h3>
          <p class="muted">Este módulo alimenta reportes de utilidad real más adelante.</p>
          <form id="gastoForm" class="inventory-form-grid" style="margin-top:14px;">
            <input type="hidden" id="gastoId" value="${editing?.id || ''}" />
            <div class="input-group"><label for="gastoConcepto">Concepto</label><input id="gastoConcepto" value="${editing?.concepto || ''}" required /></div>
            <div class="input-group"><label for="gastoCategoria">Categoría</label><select id="gastoCategoria">
              ${['Renta','Luz','Agua','Internet','Gasolina','Sueldos','Mantenimiento','Papelería','Limpieza','Otros'].map(opt => `<option ${editing?.categoria === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select></div>
            <div class="input-group"><label for="gastoMonto">Monto</label><input id="gastoMonto" type="number" min="0" step="0.01" value="${editing?.monto ?? ''}" required /></div>
            <div class="input-group"><label for="gastoFecha">Fecha</label><input id="gastoFecha" type="date" value="${dateOnly(editing?.fecha) || new Date().toISOString().slice(0,10)}" required /></div>
            <div class="input-group"><label for="gastoPago">Forma de pago</label><select id="gastoPago">
              ${['Efectivo','Tarjeta','Transferencia','Crédito','Otro'].map(opt => `<option ${editing?.pago === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select></div>
            <div class="input-group"><label for="gastoResponsable">Responsable</label><input id="gastoResponsable" value="${editing?.responsable || ''}" placeholder="Ej. Enrique" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="gastoNotas">Notas</label><textarea id="gastoNotas" rows="4" placeholder="Detalle del gasto, referencia, observaciones">${editing?.notas || ''}</textarea></div>
          </form>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveGastoBtn">${editing ? 'Guardar cambios' : 'Guardar gasto'}</button>
            <button class="btn btn-secondary" id="resetGastoBtn">Limpiar formulario</button>
          </div>

          <div class="status-list" style="margin-top:18px;">
            ${topCategories.length ? topCategories.map(row => `<div class="status-item"><span>${row.categoria}</span><span class="status-tag soft-blue">${money(row.total)}</span></div>`).join('') : `<div class="status-item"><span class="muted">Todavía no hay categorías con gasto.</span></div>`}
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindGastos(render) {
  document.getElementById('gastosSearch')?.addEventListener('input', e => { state.gastosQuery = e.target.value; render(); });
  document.getElementById('clearGastosSearchBtn')?.addEventListener('click', () => { state.gastosQuery = ''; render(); });
  document.getElementById('newGastoBtn')?.addEventListener('click', () => { state.editingGastoId = ''; render(); });
  document.getElementById('resetGastoBtn')?.addEventListener('click', () => { state.editingGastoId = ''; render(); });

  document.querySelectorAll('.edit-gasto-btn').forEach(btn => btn.addEventListener('click', () => {
    state.editingGastoId = btn.dataset.id;
    render();
  }));

  document.querySelectorAll('.delete-gasto-btn').forEach(btn => btn.addEventListener('click', () => {
    const items = getExpenses().filter(item => item.id !== btn.dataset.id);
    saveExpenses(items);
    if (state.editingGastoId === btn.dataset.id) state.editingGastoId = '';
    render();
    showToast('Gasto eliminado.');
  }));

  document.getElementById('saveGastoBtn')?.addEventListener('click', () => {
    const payload = {
      id: document.getElementById('gastoId').value || `gas_${Date.now()}`,
      concepto: document.getElementById('gastoConcepto').value.trim(),
      categoria: document.getElementById('gastoCategoria').value,
      monto: Number(document.getElementById('gastoMonto').value || 0),
      fecha: document.getElementById('gastoFecha').value,
      pago: document.getElementById('gastoPago').value,
      responsable: document.getElementById('gastoResponsable').value.trim(),
      notas: document.getElementById('gastoNotas').value.trim()
    };

    if (!payload.concepto || !payload.fecha || payload.monto <= 0) {
      return showToast('Completa concepto, fecha y monto del gasto.');
    }

    const items = getExpenses();
    const exists = items.some(item => item.id === payload.id);
    const next = exists ? items.map(item => item.id === payload.id ? payload : item) : [...items, payload];
    saveExpenses(next);
    state.editingGastoId = '';
    render();
    showToast(exists ? 'Gasto actualizado.' : 'Gasto guardado.');
  });
}
