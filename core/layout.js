import { MODULES, STORAGE_KEYS } from './constants.js';
import { load } from './storage.js';
import { initials } from './helpers.js';
import { canAccess } from './guards.js';

export function allowedModules(user) {
  return MODULES.filter(m => canAccess(user, m.key));
}

export function renderLogin() {
  return `
    <div class="login-shell">
      <div class="login-card">
        <section class="login-hero">
          <div class="brand-logo">NP</div>
          <h1>Neural POS Farmacia</h1>
          <p>Versión rearmada en estructura A: index principal, core separado y módulos por carpeta.</p>
          <div class="login-list">
            <div>🔐 Acceso por usuario y contraseña</div>
            <div>🧩 Permisos por módulo controlados por admin</div>
            <div>📦 Ventas e inventario v1 separados por módulo</div>
            <div>🧠 Firma fija al pie: Hecho por Neural Apps</div>
          </div>
        </section>
        <section class="login-form">
          <div>
            <h2 style="margin:0 0 6px;">Acceso al sistema</h2>
            <div class="muted">Entra con uno de los usuarios de prueba.</div>
          </div>
          <div class="error" id="loginError">Usuario o contraseña incorrectos.</div>
          <div class="input-group"><label for="username">Usuario</label><input id="username" placeholder="Ej. admin" autocomplete="username" /></div>
          <div class="input-group"><label for="password">Contraseña</label><input id="password" type="password" placeholder="••••" autocomplete="current-password" /></div>
          <button class="btn btn-primary" id="loginBtn">Entrar</button>
          <div class="hint">Admin: <b>admin / 1234</b><br>Caja: <b>caja / 1234</b></div>
        </section>
      </div>
      <div class="login-footer">Hecho por Neural Apps</div>
    </div>`;
}

export function renderShell(state, pageHtml) {
  const config = load(STORAGE_KEYS.CONFIG, { appName: 'Neural POS Farmacia', footerText: 'Hecho por Neural Apps' });
  const currentModule = MODULES.find(m => m.key === state.route);
  const modules = allowedModules(state.user);
  const groups = [...new Set(modules.map(m => m.group))];

  const sidebar = `
    <aside class="sidebar ${state.mobileMenu ? 'open' : ''}">
      <div class="brand">
        <div class="brand-logo">NP</div>
        <div class="brand-copy"><h1>Neural POS Farmacia</h1><p>Panel principal</p></div>
      </div>
      <button class="menu-toggle" id="menuToggle">☰ <span class="label">Menú compacto</span></button>
      <div class="user-card">
        <div class="avatar">${initials(state.user.nombre)}</div>
        <div class="meta"><b>${state.user.nombre}</b><small>${state.user.role}</small></div>
      </div>
      ${groups.map(group => `
        <div class="menu-group">
          <div class="menu-group-title">${group}</div>
          ${modules.filter(m => m.group === group).map(mod => `<button class="menu-item ${state.route === mod.key ? 'active' : ''}" data-route="${mod.key}"><span class="icon">${mod.icon}</span><span class="label">${mod.label}</span></button>`).join('')}
        </div>
      `).join('')}
      <div class="sidebar-footer">Hecho por Neural Apps</div>
    </aside>`;

  return `
    <div class="app ${state.menuCollapsed ? 'menu-collapsed' : ''}">
      ${sidebar}
      <div class="main">
        <header class="topbar">
          <div><h2>${currentModule?.label || config.appName}</h2><p>${config.appName}</p></div>
          <div class="top-actions">
            <div class="pill">${state.user.username}</div>
            <button class="btn btn-secondary" id="mobileOpen">☰</button>
            <button class="btn btn-primary" id="logoutBtn">Salir</button>
          </div>
        </header>
        ${pageHtml}
        <footer class="app-footer">${config.footerText}</footer>
      </div>
    </div>`;
}
