import { getUsers, saveUsers } from '../../core/auth.js';
import { MODULES } from '../../core/constants.js';
import { state } from '../../core/state.js';
import { showToast } from '../../core/ui.js';

export function render() {
  const users = getUsers();
  const editableUsers = users.filter(u => u.id !== state.user.id);
  const selectedId = state.selectedManagedUserId || editableUsers[0]?.id || users[0]?.id || '';
  state.selectedManagedUserId = selectedId;
  const selected = users.find(u => u.id === selectedId) || users[0];
  return `<div class="page"><section class="grid grid-2"><article class="card"><h3>Usuarios y permisos</h3><p class="muted">El administrador decide qué módulos puede ver cada login.</p><div class="input-group" style="margin-top:14px;"><label for="selectedUser">Elegir usuario</label><select id="selectedUser">${editableUsers.map(u => `<option value="${u.id}" ${selectedId === u.id ? 'selected' : ''}>${u.nombre} · ${u.username}</option>`).join('')}</select></div><div class="permissions-grid">${MODULES.map(m => `<label><input type="checkbox" data-permission="${m.key}" ${selected?.permissions?.[m.key] ? 'checked' : ''} /><span>${m.label}</span></label>`).join('')}</div><div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;"><button class="btn btn-primary" id="savePermissionsBtn">Guardar permisos</button><button class="btn btn-secondary" id="toggleUserBtn">${selected?.active ? 'Desactivar usuario' : 'Activar usuario'}</button></div></article><article class="card"><h3>Usuarios de prueba</h3><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th></tr></thead><tbody>${users.map(u => `<tr><td>${u.nombre}</td><td>${u.username}</td><td>${u.role}</td><td>${u.active ? 'Activo' : 'Inactivo'}</td></tr>`).join('')}</tbody></table></div></article></section></div>`;
}

export function bind({ rerender }) {
  document.getElementById('selectedUser')?.addEventListener('change', e => { state.selectedManagedUserId = e.target.value; rerender(); });
  document.getElementById('savePermissionsBtn')?.addEventListener('click', () => {
    const userId = state.selectedManagedUserId;
    if (!userId) return;
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const permissions = { ...user.permissions };
    document.querySelectorAll('[data-permission]').forEach(input => { permissions[input.dataset.permission] = input.checked; });
    saveUsers(users.map(u => u.id === userId ? { ...u, permissions } : u));
    showToast('Permisos guardados.');
  });
  document.getElementById('toggleUserBtn')?.addEventListener('click', () => {
    const userId = state.selectedManagedUserId;
    if (!userId) return;
    saveUsers(getUsers().map(u => u.id === userId ? { ...u, active: !u.active } : u));
    rerender();
    showToast('Estado del usuario actualizado.');
  });
}
