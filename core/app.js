import { MODULES } from './constants.js';
import { seedData } from './data.js';
import { state } from './state.js';
import { login, restoreSession, logout } from './auth.js';
import { canAccess } from './guards.js';
import { renderLogin, renderShell } from './layout.js';
import { moduleLoaders } from './router.js';
import { showToast } from './ui.js';

const root = document.getElementById('root');

function firstAllowedRoute() {
  return MODULES.find(m => canAccess(state.user, m.key))?.key || 'dashboard';
}

async function bindGlobalEvents() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logout();
    state.user = null;
    render();
  });
  document.getElementById('menuToggle')?.addEventListener('click', () => { state.menuCollapsed = !state.menuCollapsed; render(); });
  document.getElementById('mobileOpen')?.addEventListener('click', () => { state.mobileMenu = !state.mobileMenu; render(); });
  document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));
}

async function navigate(route) {
  if (!canAccess(state.user, route)) return showToast('No tienes permiso para entrar a este módulo.');
  state.route = route;
  state.mobileMenu = false;
  state.editingInventoryId = '';
  await render();
}

function bindLoginEvents() {
  const btn = document.getElementById('loginBtn');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const error = document.getElementById('loginError');
  const submit = async () => {
    const user = login(userInput.value.trim(), passInput.value);
    if (!user) { error.style.display = 'block'; return; }
    state.user = user;
    state.route = firstAllowedRoute();
    await render();
  };
  btn?.addEventListener('click', submit);
  [userInput, passInput].forEach(el => el?.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
}

async function render() {
  if (!state.user) {
    root.innerHTML = renderLogin();
    bindLoginEvents();
    return;
  }
  const loader = moduleLoaders[state.route] || moduleLoaders.dashboard;
  const mod = await loader();
  const pageHtml = mod.render();
  root.innerHTML = renderShell(state, pageHtml);
  await bindGlobalEvents();
  if (typeof mod.bind === 'function') mod.bind({ rerender: render, navigate });
}

seedData(MODULES);
state.user = restoreSession();
if (state.user) state.route = firstAllowedRoute();
render();
