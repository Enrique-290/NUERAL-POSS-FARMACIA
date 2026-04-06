import { MODULES, STORAGE_KEYS } from './constants.js';
import { load } from './storage.js';
import { state } from './state.js';
import { seedData } from './seed.js';
import { login, logout, restoreSession } from './auth.js';
import { renderDashboard } from '../modules/dashboard/index.js';
import { renderVentas, bindVentas } from '../modules/ventas/index.js';
import { renderInventario, bindInventario } from '../modules/inventario/index.js';
import { renderBodega, bindBodega } from '../modules/bodega/index.js';
import { renderClientes, bindClientes } from '../modules/clientes/index.js';
import { renderHistorial, bindHistorial } from '../modules/historial/index.js';
import { renderReportes } from '../modules/reportes/index.js';
import { renderConfiguracion, bindConfiguracion } from '../modules/configuracion/index.js';
import { renderPaginaWeb, bindPaginaWeb } from '../modules/pagina_web/index.js';
import { renderMayoreoDashboard } from '../modules/mayoreo_dashboard/index.js';
import { renderMayoreoVentas, bindMayoreoVentas } from '../modules/mayoreo_ventas/index.js';
import { renderMayoreoInventario, bindMayoreoInventario } from '../modules/mayoreo_inventario/index.js';
import { renderMayoreoClientes, bindMayoreoClientes } from '../modules/mayoreo_clientes/index.js';
import { renderMayoreoHistorial, bindMayoreoHistorial } from '../modules/mayoreo_historial/index.js';
import { renderMayoreoReportes } from '../modules/mayoreo_reportes/index.js';
import { renderUsers, bindUsers } from '../modules/users/index.js';

const app = document.getElementById('app');
const routeRender = {
  dashboard: renderDashboard,
  ventas: renderVentas,
  inventario: renderInventario,
  bodega: renderBodega,
  clientes: renderClientes,
  historial: renderHistorial,
  reportes: renderReportes,
  configuracion: renderConfiguracion,
  pagina_web: renderPaginaWeb,
  mayoreo_dashboard: renderMayoreoDashboard,
  mayoreo_ventas: renderMayoreoVentas,
  mayoreo_inventario: renderMayoreoInventario,
  mayoreo_clientes: renderMayoreoClientes,
  mayoreo_historial: renderMayoreoHistorial,
  mayoreo_reportes: renderMayoreoReportes,
  users: renderUsers,
};
function toast(msg){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);}el.textContent=msg;el.style.display='block';clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.style.display='none',2200);} 
function canAccess(key){return !!state.user?.permissions?.[key];}
function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'NA';}
function renderLogin(){return `<div class="login-shell"><div class="login-card"><section class="login-hero"><div class="brand-logo">NP</div><h1>Neural POS Farmacia</h1><p>Versión modular A con mayoreo integrado y permisos por módulo.</p><div class="login-list"><div>🔐 Login</div><div>🧩 Permisos por módulo</div><div>🛒 Mayoreo separado</div><div>🧠 Hecho por Neural Apps</div></div></section><section class="login-form"><div><h2 style="margin:0 0 6px">Acceso al sistema</h2><div class="muted">Usuarios de prueba.</div></div><div class="error" id="loginError">Usuario o contraseña incorrectos.</div><div class="input-group"><label>Usuario</label><input id="username" placeholder="admin"></div><div class="input-group"><label>Contraseña</label><input id="password" type="password" placeholder="1234"></div><button class="btn btn-primary" id="loginBtn">Entrar</button><div class="muted">admin / 1234<br>caja / 1234</div></section></div><div class="login-footer">Hecho por Neural Apps</div></div>`;}
function sidebar(){const mods=MODULES.filter(m=>canAccess(m.key));const groups=[...new Set(mods.map(m=>m.group))];return `<aside class="sidebar"><div class="brand"><div class="brand-logo">NP</div><div><h1>Neural POS Farmacia</h1><p>Panel principal</p></div></div><div class="user-card"><div class="avatar">${initials(state.user.nombre)}</div><div><b>${state.user.nombre}</b><div class="muted">${state.user.role}</div></div></div>${groups.map(g=>`<div class="menu-group"><div class="menu-group-title">${g}</div>${mods.filter(m=>m.group===g).map(m=>`<button class="menu-item ${state.route===m.key?'active':''}" data-route="${m.key}"><span>${m.icon}</span><span>${m.label}</span></button>`).join('')}</div>`).join('')}<div class="app-footer">Hecho por Neural Apps</div></aside>`;}
function shell(){const cfg=load(STORAGE_KEYS.CONFIG,{appName:'Neural POS Farmacia',footerText:'Hecho por Neural Apps'});const current=MODULES.find(m=>m.key===state.route);return `<div class="app">${sidebar()}<div class="main"><header class="topbar"><div><h2>${current?.label||cfg.appName}</h2><p>${cfg.appName}</p></div><div class="top-actions"><div class="pill">${state.user.username}</div><button class="btn btn-primary" id="logoutBtn">Salir</button></div></header>${routeRender[state.route]?routeRender[state.route]():''}<footer class="app-footer">${cfg.footerText}</footer></div></div>`;}
function bindShell(){document.querySelectorAll('[data-route]').forEach(btn=>btn.addEventListener('click',()=>{const route=btn.dataset.route;if(!canAccess(route))return toast('No tienes permiso.');state.route=route;render();}));document.getElementById('logoutBtn')?.addEventListener('click',()=>{logout();state.user=null;render();});
  if(state.route==='ventas') bindVentas(render,toast);
  if(state.route==='inventario') bindInventario(render,toast);
  if(state.route==='bodega') bindBodega(render,toast);
  if(state.route==='clientes') bindClientes(render,toast);
  if(state.route==='historial') bindHistorial(render);
  if(state.route==='configuracion') bindConfiguracion(toast);
  if(state.route==='pagina_web') bindPaginaWeb(toast);
  if(state.route==='mayoreo_ventas') bindMayoreoVentas(render,toast);
  if(state.route==='mayoreo_inventario') bindMayoreoInventario(render,toast);
  if(state.route==='mayoreo_clientes') bindMayoreoClientes(render,toast);
  if(state.route==='mayoreo_historial') bindMayoreoHistorial(render);
  if(state.route==='users') bindUsers(toast);
}
function bindLogin(){const submit=()=>{const u=login(document.getElementById('username').value.trim(),document.getElementById('password').value);if(!u){document.getElementById('loginError').style.display='block';return;}state.user=u;state.route=canAccess('dashboard')?'dashboard':MODULES.find(m=>canAccess(m.key))?.key||'dashboard';render();};document.getElementById('loginBtn')?.addEventListener('click',submit);['username','password'].forEach(id=>document.getElementById(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')submit();}));}
function render(){if(!state.user){app.innerHTML=renderLogin();bindLogin();return;}app.innerHTML=shell();bindShell();}
seedData();state.user=restoreSession();if(state.user) state.route=canAccess('dashboard')?'dashboard':MODULES.find(m=>canAccess(m.key))?.key||'dashboard';render();
