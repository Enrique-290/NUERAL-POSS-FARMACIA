import { MODULES, STORAGE_KEYS } from './constants.js';
import { state } from './state.js';
import { seedData } from './data.js';
import { load } from './storage.js';
import { login, logout, restoreSession } from './auth.js';
import { initials, showToast } from './utils.js';
import { renderDashboard } from '../modules/dashboard/index.js';
import { renderVentas, bindVentas } from '../modules/ventas/index.js';
import { renderInventario, bindInventario } from '../modules/inventario/index.js';
import { renderBodega, bindBodega } from '../modules/bodega/index.js';
import { renderCompras, bindCompras } from '../modules/compras/index.js';
import { renderUsers, bindUsers } from '../modules/users/index.js';
import { renderClientes, bindClientes } from '../modules/clientes/index.js';
import { renderModule as renderHistorial, bindHistorial } from '../modules/historial/index.js';
import { renderModule as renderReportes, bindReportes } from '../modules/reportes/index.js';
import { renderModule as renderConfiguracion, bindConfiguracion } from '../modules/configuracion/index.js';
import { renderModule as renderMayoreoDashboard } from '../modules/mayoreo_dashboard/index.js';
import { renderModule as renderMayoreoVentas, bindMayoreoVentas } from '../modules/mayoreo_ventas/index.js';
import { renderModule as renderMayoreoInventario, bindMayoreoInventario } from '../modules/mayoreo_inventario/index.js';
import { renderModule as renderMayoreoClientes, bindMayoreoClientes } from '../modules/mayoreo_clientes/index.js';
import { renderModule as renderMayoreoHistorial, bindMayoreoHistorial } from '../modules/mayoreo_historial/index.js';
import { renderModule as renderMayoreoReportes, bindMayoreoReportes } from '../modules/mayoreo_reportes/index.js';
import { renderWeb, bindWeb } from '../modules/web/index.js';

const root = document.getElementById('root');

function canAccess(moduleKey) {
  return !!state.user?.permissions?.[moduleKey];
}

function allowedModules() {
  return MODULES.filter(m => canAccess(m.key));
}

function pageContent() {
  switch (state.route) {
    case 'dashboard': return renderDashboard();
    case 'ventas': return renderVentas();
    case 'inventario': return renderInventario();
    case 'bodega': return renderBodega();
    case 'compras': return renderCompras();
    case 'users_admin': return renderUsers();
    case 'clientes': return renderClientes();
    case 'historial': return renderHistorial();
    case 'reportes': return renderReportes();
    case 'configuracion': return renderConfiguracion();
    case 'pagina_web': return renderWeb();
    case 'mayoreo_dashboard': return renderMayoreoDashboard();
    case 'mayoreo_ventas': return renderMayoreoVentas();
    case 'mayoreo_inventario': return renderMayoreoInventario();
    case 'mayoreo_clientes': return renderMayoreoClientes();
    case 'mayoreo_historial': return renderMayoreoHistorial();
    case 'mayoreo_reportes': return renderMayoreoReportes();
    default: return renderDashboard();
  }
}

function renderLogin() {
  return `
    <div class="login-shell">
      <div class="login-card">
        <section class="login-hero">
          <div class="brand-logo">NP</div>
          <h1>Neural POS Farmacia</h1>
          <p>Base modular por carpetas con login, permisos, ventas, inventario, bodega, clientes e historial v1.</p>
          <div class="login-list">
            <div>🔐 Acceso por usuario y contraseña</div>
            <div>🧩 Permisos por módulo controlados por admin</div>
            <div>📦 Inventario y bodega separados</div>
            <div>🧠 Hecho por Neural Apps</div>
          </div>
        </section>
        <section class="login-form">
          <div><h2 style="margin:0 0 6px;">Acceso al sistema</h2><div class="muted">Entra con uno de los usuarios de prueba.</div></div>
          <div class="error" id="loginError">Usuario o contraseña incorrectos.</div>
          <div class="input-group"><label for="username">Usuario</label><input id="username" placeholder="Ej. admin" autocomplete="username" /></div>
          <div class="input-group"><label for="password">Contraseña</label><input id="password" type="password" placeholder="••••" autocomplete="current-password" /></div>
          <button class="btn btn-primary" id="loginBtn">Entrar</button>
          <div class="hint">Admin: <b>admin / 1234</b><br>Caja: <b>caja / 1234</b></div>
        </section>
      </div>
      <div class="login-footer">Hecho por Neural Apps</div>
    </div>
  `;
}

function sidebarMarkup() {
  const modules = allowedModules();
  const groups = [...new Set(modules.map(m => m.group))];
  return `
    <aside class="sidebar ${state.mobileMenu ? 'open' : ''}">
      <div class="brand"><div class="brand-logo">NP</div><div class="brand-copy"><h1>Neural POS Farmacia</h1><p>Panel principal</p></div></div>
      <button class="menu-toggle" id="menuToggle">☰ <span class="label">Menú compacto</span></button>
      <div class="user-card"><div class="avatar">${initials(state.user.nombre)}</div><div class="meta"><b>${state.user.nombre}</b><small>${state.user.role}</small></div></div>
      ${groups.map(group => `<div class="menu-group"><div class="menu-group-title">${group}</div>${modules.filter(m => m.group === group).map(mod => `<button class="menu-item ${state.route === mod.key ? 'active' : ''}" data-route="${mod.key}"><span class="icon">${mod.icon}</span><span class="label">${mod.label}</span></button>`).join('')}</div>`).join('')}
      <div class="sidebar-footer">Hecho por Neural Apps</div>
    </aside>
  `;
}

function appShell() {
  const config = load(STORAGE_KEYS.CONFIG, { appName: 'Neural POS Farmacia', footerText: 'Hecho por Neural Apps' });
  const currentModule = MODULES.find(m => m.key === state.route);
  return `
    <div class="app ${state.menuCollapsed ? 'menu-collapsed' : ''}">
      ${sidebarMarkup()}
      <div class="main">
        <header class="topbar">
          <div><h2>${currentModule?.label || config.appName}</h2><p>${config.appName}</p></div>
          <div class="top-actions"><div class="pill">${state.user.username}</div><button class="btn btn-secondary" id="mobileOpen">☰</button><button class="btn btn-primary" id="logoutBtn">Salir</button></div>
        </header>
        ${pageContent()}
        <footer class="app-footer">${config.footerText}</footer>
      </div>
    </div>
  `;
}

function bindLoginEvents() {
  const btn = document.getElementById('loginBtn');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const error = document.getElementById('loginError');
  const submit = () => {
    const user = login(userInput.value.trim(), passInput.value);
    if (!user) { error.style.display = 'block'; return; }
    state.user = user;
    state.route = canAccess('dashboard') ? 'dashboard' : allowedModules()[0]?.key || 'dashboard';
    render();
  };
  btn?.addEventListener('click', submit);
  [userInput, passInput].forEach(el => el?.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
}

function openRoute(route) {
  if (!canAccess(route)) return showToast('No tienes permiso para entrar a este módulo.');
  state.route = route;
  state.mobileMenu = false;
  if (route !== 'inventario') state.editingInventoryId = '';
  if (route !== 'bodega') state.editingBodegaId = '';
  if (route !== 'compras') state.editingCompraId = '';
  if (route !== 'clientes') state.editingClientId = '';
  if (route !== 'mayoreo_inventario') state.editingMayoreoInventoryId = '';
  if (route !== 'mayoreo_clientes') state.editingMayoreoClientId = '';
  render();
}

function bindAppEvents() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => { logout(); state.user = null; render(); });
  document.getElementById('menuToggle')?.addEventListener('click', () => { state.menuCollapsed = !state.menuCollapsed; render(); });
  document.getElementById('mobileOpen')?.addEventListener('click', () => { state.mobileMenu = !state.mobileMenu; render(); });
  document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => openRoute(btn.dataset.route)));
  if (state.route === 'ventas') bindVentas(render);
  if (state.route === 'inventario') bindInventario(render);
  if (state.route === 'bodega') bindBodega(render);
  if (state.route === 'compras') bindCompras(render);
  if (state.route === 'clientes') bindClientes(render);
  if (state.route === 'historial') bindHistorial(render);
  if (state.route === 'reportes') bindReportes(render);
  if (state.route === 'users_admin') bindUsers(render);
  if (state.route === 'configuracion') bindConfiguracion(render);
  if (state.route === 'pagina_web') bindWeb(render);
  if (state.route === 'mayoreo_ventas') bindMayoreoVentas(render);
  if (state.route === 'mayoreo_inventario') bindMayoreoInventario(render);
  if (state.route === 'mayoreo_clientes') bindMayoreoClientes(render);
  if (state.route === 'mayoreo_historial') bindMayoreoHistorial(render);
  if (state.route === 'mayoreo_reportes') bindMayoreoReportes(render);
}

function render() {
  if (!state.user) {
    root.innerHTML = renderLogin();
    bindLoginEvents();
    return;
  }
  root.innerHTML = appShell();
  bindAppEvents();
}

seedData();
state.user = restoreSession();
if (state.user) state.route = canAccess('dashboard') ? 'dashboard' : allowedModules()[0]?.key || 'dashboard';
render();


if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('SW registrado');
    } catch (error) {
      console.warn('No se pudo registrar el service worker', error);
    }
  });
}
