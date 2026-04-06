import { STORAGE_KEYS } from '../../core/constants.js';
import { load, save } from '../../core/storage.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

function getConfig() {
  const cfg = load(STORAGE_KEYS.CONFIG, {}) || {};
  const web = cfg.web || {};
  return {
    ...cfg,
    web: {
      storeName: web.storeName || cfg.businessName || cfg.appName || 'Neural POS Farmacia',
      heroTitle: web.heroTitle || 'Tu farmacia cerca de ti',
      heroSubtitle: web.heroSubtitle || 'Medicamentos, cuidado diario y pedidos por WhatsApp.',
      whatsapp: web.whatsapp || '525500000000',
      showCart: web.showCart !== false
    }
  };
}

function getInventory() {
  return load(STORAGE_KEYS.INVENTORY, []).map(item => ({
    ...item,
    visibleWeb: Boolean(item.visibleWeb),
    precioWeb: Number(item.precioWeb ?? item.precio ?? 0),
    categoriaWeb: item.categoriaWeb || item.categoria || 'General',
    destacadoWeb: Boolean(item.destacadoWeb)
  }));
}

function saveInventory(items) {
  save(STORAGE_KEYS.INVENTORY, items);
}

function getVisibleProducts() {
  const items = getInventory().filter(i => i.visibleWeb);
  const q = state.webQuery.trim().toLowerCase();
  const category = state.webCategory;
  return items.filter(item => {
    const matchesQ = !q || item.nombre.toLowerCase().includes(q) || item.categoriaWeb.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    const matchesCategory = !category || category === 'Todas' || item.categoriaWeb === category;
    return matchesQ && matchesCategory;
  });
}

function webStats() {
  const items = getInventory();
  return {
    visibles: items.filter(i => i.visibleWeb).length,
    destacados: items.filter(i => i.visibleWeb && i.destacadoWeb).length,
    categorias: new Set(items.filter(i => i.visibleWeb).map(i => i.categoriaWeb || 'General')).size,
    carrito: state.webCart.reduce((acc, i) => acc + i.cantidad, 0)
  };
}

function categories() {
  return ['Todas', ...new Set(getInventory().filter(i => i.visibleWeb).map(i => i.categoriaWeb || 'General'))];
}

function addWebCart(id) {
  const product = getInventory().find(i => i.id === id && i.visibleWeb);
  if (!product) return;
  const found = state.webCart.find(i => i.id === id);
  if (found) found.cantidad += 1;
  else state.webCart.push({ id: product.id, nombre: product.nombre, precio: Number(product.precioWeb || product.precio || 0), cantidad: 1 });
}

function removeWebCart(id) {
  state.webCart = state.webCart.filter(i => i.id !== id);
}

function cartTotal() {
  return state.webCart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
}

function waLink() {
  const cfg = getConfig();
  const lines = [cfg.web.storeName, 'Pedido web:'];
  state.webCart.forEach(item => lines.push(`- ${item.nombre} x${item.cantidad} = $${(item.precio * item.cantidad).toFixed(2)}`));
  lines.push(`Total: $${cartTotal().toFixed(2)}`);
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cfg.web.whatsapp}?text=${text}`;
}

export function renderWeb() {
  const cfg = getConfig();
  const inventory = getInventory();
  const visible = getVisibleProducts();
  const stats = webStats();
  const cats = categories();
  const destacados = visible.filter(i => i.destacadoWeb).slice(0, 4);
  return `
    <div class="page">
      <section class="grid grid-4">
        <article class="card"><div class="muted">Publicados</div><div class="kpi-value">${stats.visibles}</div><div class="kpi-meta">Productos visibles en la web</div></article>
        <article class="card"><div class="muted">Destacados</div><div class="kpi-value">${stats.destacados}</div><div class="kpi-meta">Productos promocionados</div></article>
        <article class="card"><div class="muted">Categorías web</div><div class="kpi-value">${stats.categorias}</div><div class="kpi-meta">Navegación del catálogo</div></article>
        <article class="card"><div class="muted">Carrito preview</div><div class="kpi-value">${stats.carrito}</div><div class="kpi-meta">Artículos en simulación</div></article>
      </section>

      <section class="grid web-grid">
        <article class="card">
          <div class="toolbar-row">
            <div>
              <h3 style="margin:0;">Control de página web v2</h3>
              <p class="muted" style="margin:6px 0 0;">Aquí decides qué productos se publican y cómo se ve el catálogo.</p>
            </div>
          </div>

          <div class="inventory-form-grid" style="margin-top:8px;">
            <div class="input-group"><label for="webStoreName">Nombre tienda</label><input id="webStoreName" value="${cfg.web.storeName}" /></div>
            <div class="input-group"><label for="webWhatsapp">WhatsApp</label><input id="webWhatsapp" value="${cfg.web.whatsapp}" placeholder="5255..." /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="webHeroTitle">Título banner</label><input id="webHeroTitle" value="${cfg.web.heroTitle}" /></div>
            <div class="input-group" style="grid-column:1 / -1;"><label for="webHeroSubtitle">Subtítulo banner</label><textarea id="webHeroSubtitle" rows="3">${cfg.web.heroSubtitle}</textarea></div>
          </div>

          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveWebConfigBtn">Guardar página web</button>
            <button class="btn btn-secondary" id="clearWebCartBtn">Vaciar carrito preview</button>
            <a class="btn btn-secondary" id="waPreviewBtn" href="${state.webCart.length ? waLink() : '#'}" target="_blank">WhatsApp preview</a>
          </div>

          <div class="input-group" style="margin-top:18px;">
            <label for="webProductsSearch">Buscar producto a publicar</label>
            <input id="webProductsSearch" value="${state.webQuery}" placeholder="Ej. paracetamol, alergias, vitaminas" />
          </div>

          <div class="table-wrap" style="margin-top:14px;">
            <table>
              <thead>
                <tr><th>Producto</th><th>Visible</th><th>Precio web</th><th>Categoría web</th><th>Destacado</th></tr>
              </thead>
              <tbody>
                ${inventory.map(item => `
                  <tr>
                    <td><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">SKU ${item.sku} · Stock ${item.stock}</div></td>
                    <td><input class="web-visible" data-id="${item.id}" type="checkbox" ${item.visibleWeb ? 'checked' : ''} /></td>
                    <td><input class="web-price" data-id="${item.id}" type="number" min="0" step="0.01" value="${Number(item.precioWeb).toFixed(2)}" /></td>
                    <td><input class="web-category" data-id="${item.id}" value="${item.categoriaWeb || ''}" /></td>
                    <td><input class="web-featured" data-id="${item.id}" type="checkbox" ${item.destacadoWeb ? 'checked' : ''} /></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </article>

        <article class="card web-preview-shell">
          <div class="web-phone">
            <div class="web-hero">
              <div class="web-badge">Catálogo web</div>
              <h3>${cfg.web.heroTitle}</h3>
              <p>${cfg.web.heroSubtitle}</p>
              <div class="web-hero-actions">
                <span class="status-tag soft-blue">${cfg.web.storeName}</span>
                <span class="status-tag soft-blue">WhatsApp ${cfg.web.whatsapp}</span>
              </div>
            </div>

            <div class="web-controls">
              <input id="webPreviewSearch" value="${state.webQuery}" placeholder="Buscar en la tienda" />
              <div class="web-categories">
                ${cats.map(cat => `<button class="web-cat-btn ${state.webCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`).join('')}
              </div>
            </div>

            ${destacados.length ? `<div class="web-section-title">Destacados</div><div class="web-products">${destacados.map(item => `
              <article class="web-card featured">
                <div class="product-thumb">${item.nombre.slice(0,2).toUpperCase()}</div>
                <div class="web-card-name">${item.nombre}</div>
                <div class="muted">${item.categoriaWeb}</div>
                <div class="web-price">$${Number(item.precioWeb).toFixed(2)}</div>
                <button class="btn btn-primary web-add-btn" data-id="${item.id}">Agregar</button>
              </article>`).join('')}</div>` : ''}

            <div class="web-section-title">Catálogo</div>
            <div class="web-products">
              ${visible.map(item => `
                <article class="web-card">
                  <div class="product-thumb">${item.nombre.slice(0,2).toUpperCase()}</div>
                  <div class="web-card-name">${item.nombre}</div>
                  <div class="muted">${item.categoriaWeb}</div>
                  <div class="web-price">$${Number(item.precioWeb).toFixed(2)}</div>
                  <button class="btn btn-primary web-add-btn" data-id="${item.id}">Agregar</button>
                </article>`).join('') || `<div class="muted">No hay productos visibles con ese filtro.</div>`}
            </div>

            ${cfg.web.showCart ? `<div class="web-cart">
              <div class="web-section-title">Carrito</div>
              <div class="status-list" style="margin-top:0;">
                ${state.webCart.length ? state.webCart.map(item => `<div class="status-item"><div><div style="font-weight:700;">${item.nombre}</div><div class="muted" style="font-size:.85rem;">${item.cantidad} x $${Number(item.precio).toFixed(2)}</div></div><button class="btn btn-danger small-btn web-remove-btn" data-id="${item.id}">Quitar</button></div>`).join('') : `<div class="status-item"><span class="muted">Tu carrito preview está vacío.</span></div>`}
              </div>
              <div class="web-total">Total: <b>$${cartTotal().toFixed(2)}</b></div>
            </div>` : ''}
          </div>
        </article>
      </section>
    </div>
  `;
}

export function bindWeb(render) {
  document.getElementById('saveWebConfigBtn')?.addEventListener('click', () => {
    const cfg = getConfig();
    const next = {
      ...cfg,
      web: {
        ...cfg.web,
        storeName: document.getElementById('webStoreName')?.value.trim() || cfg.web.storeName,
        whatsapp: document.getElementById('webWhatsapp')?.value.trim() || cfg.web.whatsapp,
        heroTitle: document.getElementById('webHeroTitle')?.value.trim() || cfg.web.heroTitle,
        heroSubtitle: document.getElementById('webHeroSubtitle')?.value.trim() || cfg.web.heroSubtitle,
        showCart: true
      }
    };
    save(STORAGE_KEYS.CONFIG, next);

    const items = getInventory().map(item => {
      const visible = document.querySelector(`.web-visible[data-id="${item.id}"]`);
      const price = document.querySelector(`.web-price[data-id="${item.id}"]`);
      const cat = document.querySelector(`.web-category[data-id="${item.id}"]`);
      const feat = document.querySelector(`.web-featured[data-id="${item.id}"]`);
      return {
        ...item,
        visibleWeb: Boolean(visible?.checked),
        precioWeb: Number(price?.value || item.precio || 0),
        categoriaWeb: cat?.value.trim() || item.categoria || 'General',
        destacadoWeb: Boolean(feat?.checked)
      };
    });
    saveInventory(items);
    showToast('Página web guardada.');
    render();
  });

  document.getElementById('webProductsSearch')?.addEventListener('input', e => {
    state.webQuery = e.target.value;
    render();
  });
  document.getElementById('webPreviewSearch')?.addEventListener('input', e => {
    state.webQuery = e.target.value;
    render();
  });
  document.querySelectorAll('.web-cat-btn').forEach(btn => btn.addEventListener('click', () => {
    state.webCategory = btn.dataset.category;
    render();
  }));
  document.querySelectorAll('.web-add-btn').forEach(btn => btn.addEventListener('click', () => {
    addWebCart(btn.dataset.id);
    render();
    showToast('Producto agregado al carrito preview.');
  }));
  document.querySelectorAll('.web-remove-btn').forEach(btn => btn.addEventListener('click', () => {
    removeWebCart(btn.dataset.id);
    render();
  }));
  document.getElementById('clearWebCartBtn')?.addEventListener('click', () => {
    state.webCart = [];
    render();
  });
}
