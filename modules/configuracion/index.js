
import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { showToast } from '../../core/utils.js';

const DEFAULT_CONFIG = {
  appName: 'Neural POS Farmacia',
  footerText: 'Hecho por Neural Apps',
  businessName: 'Neural POS Farmacia',
  phone: '',
  address: '',
  ticketNote: 'Gracias por tu compra 💊',
  categories: ['Genérico', 'Original', 'Controlado', 'Pediatría', 'Vitaminas'],
  paymentMethods: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']
};

function getConfig() {
  return { ...DEFAULT_CONFIG, ...(load(STORAGE_KEYS.CONFIG, {}) || {}) };
}

function getStats() {
  const cfg = getConfig();
  return {
    categories: Array.isArray(cfg.categories) ? cfg.categories.length : 0,
    methods: Array.isArray(cfg.paymentMethods) ? cfg.paymentMethods.length : 0,
    hasPhone: cfg.phone ? 'Sí' : 'No',
    hasAddress: cfg.address ? 'Sí' : 'No'
  };
}

export function renderModule() {
  const cfg = getConfig();
  const stats = getStats();
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Nombre app</div><div class="kpi-value" style="font-size:1.2rem;">${cfg.appName}</div><div class="kpi-meta">Branding principal</div></article>
        <article class="card"><div class="muted">Categorías</div><div class="kpi-value">${stats.categories}</div><div class="kpi-meta">Editables desde este módulo</div></article>
        <article class="card"><div class="muted">Métodos de pago</div><div class="kpi-value">${stats.methods}</div><div class="kpi-meta">Configuración de ventas</div></article>
        <article class="card"><div class="muted">Datos negocio</div><div class="kpi-value" style="font-size:1.2rem;">Tel ${stats.hasPhone} · Dir ${stats.hasAddress}</div><div class="kpi-meta">Ticket y encabezado</div></article>
      </section>

      <section class="grid grid-2">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Configuración general</h3>
              <p class="muted" style="margin:6px 0 0;">Datos del negocio, branding, ticket, categorías y métodos de pago.</p>
            </div>
          </div>

          <div class="inventory-form-grid" style="margin-top:8px;">
            <div class="input-group"><label for="cfgAppName">Nombre de la app</label><input id="cfgAppName" value="${cfg.appName}" /></div>
            <div class="input-group"><label for="cfgFooterText">Texto pie</label><input id="cfgFooterText" value="${cfg.footerText}" /></div>
            <div class="input-group"><label for="cfgBusinessName">Nombre del negocio</label><input id="cfgBusinessName" value="${cfg.businessName || ''}" /></div>
            <div class="input-group"><label for="cfgPhone">Teléfono</label><input id="cfgPhone" value="${cfg.phone || ''}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="cfgAddress">Dirección</label><input id="cfgAddress" value="${cfg.address || ''}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="cfgTicketNote">Nota de ticket</label><textarea id="cfgTicketNote" rows="3">${cfg.ticketNote || ''}</textarea></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="cfgCategories">Categorías (separadas por coma)</label><textarea id="cfgCategories" rows="3">${(cfg.categories || []).join(', ')}</textarea></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="cfgPayments">Métodos de pago (separados por coma)</label><textarea id="cfgPayments" rows="2">${(cfg.paymentMethods || []).join(', ')}</textarea></div>
          </div>

          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveConfigBtn">Guardar configuración</button>
            <button class="btn btn-secondary" id="resetConfigBtn">Restaurar valores base</button>
          </div>
        </article>

        <article class="card">
          <h3>Respaldo y restauración</h3>
          <p class="muted">Exporta todo el sistema a JSON o restaura desde un archivo de respaldo.</p>

          <div class="status-list" style="margin-top:14px;">
            <div class="status-item"><span>Logo</span><span class="status-tag soft-blue">Pendiente v2</span></div>
            <div class="status-item"><span>PWA</span><span class="status-tag soft-blue">Pendiente v2</span></div>
            <div class="status-item"><span>Impresora</span><span class="status-tag soft-blue">Pendiente v2</span></div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
            <button class="btn btn-primary" id="exportBackupBtn">Exportar respaldo JSON</button>
            <label class="btn btn-secondary" for="importBackupInput" style="display:inline-flex; align-items:center;">Importar respaldo</label>
            <input id="importBackupInput" type="file" accept="application/json" style="display:none;" />
          </div>

          <div class="hint" style="margin-top:14px;">El respaldo incluye configuración, usuarios, inventario, bodega, clientes y ventas.</div>
        </article>
      </section>
    </div>
  `;
}

export function bindConfiguracion(render) {
  document.getElementById('saveConfigBtn')?.addEventListener('click', () => {
    const categories = (document.getElementById('cfgCategories')?.value || '').split(',').map(v => v.trim()).filter(Boolean);
    const paymentMethods = (document.getElementById('cfgPayments')?.value || '').split(',').map(v => v.trim()).filter(Boolean);
    const next = {
      ...getConfig(),
      appName: document.getElementById('cfgAppName')?.value.trim() || DEFAULT_CONFIG.appName,
      footerText: document.getElementById('cfgFooterText')?.value.trim() || DEFAULT_CONFIG.footerText,
      businessName: document.getElementById('cfgBusinessName')?.value.trim() || DEFAULT_CONFIG.businessName,
      phone: document.getElementById('cfgPhone')?.value.trim() || '',
      address: document.getElementById('cfgAddress')?.value.trim() || '',
      ticketNote: document.getElementById('cfgTicketNote')?.value.trim() || DEFAULT_CONFIG.ticketNote,
      categories: categories.length ? categories : DEFAULT_CONFIG.categories,
      paymentMethods: paymentMethods.length ? paymentMethods : DEFAULT_CONFIG.paymentMethods
    };
    save(STORAGE_KEYS.CONFIG, next);
    showToast('Configuración guardada.');
    render();
  });

  document.getElementById('resetConfigBtn')?.addEventListener('click', () => {
    save(STORAGE_KEYS.CONFIG, { ...DEFAULT_CONFIG });
    showToast('Configuración restaurada.');
    render();
  });

  document.getElementById('exportBackupBtn')?.addEventListener('click', () => {
    const payload = {
      config: load(STORAGE_KEYS.CONFIG, {}),
      users: load(STORAGE_KEYS.USERS, []),
      inventory: load(STORAGE_KEYS.INVENTORY, []),
      bodega: load(STORAGE_KEYS.BODEGA, []),
      clients: load(STORAGE_KEYS.CLIENTS, []),
      sales: load(STORAGE_KEYS.SALES, []),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neural_pos_farmacia_respaldo.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Respaldo exportado.');
  });

  document.getElementById('importBackupInput')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.config) save(STORAGE_KEYS.CONFIG, data.config);
      if (data.users) save(STORAGE_KEYS.USERS, data.users);
      if (data.inventory) save(STORAGE_KEYS.INVENTORY, data.inventory);
      if (data.bodega) save(STORAGE_KEYS.BODEGA, data.bodega);
      if (data.clients) save(STORAGE_KEYS.CLIENTS, data.clients);
      if (data.sales) save(STORAGE_KEYS.SALES, data.sales);
      showToast('Respaldo importado.');
      render();
    } catch {
      showToast('No se pudo importar el archivo.');
    } finally {
      e.target.value = '';
    }
  });
}
