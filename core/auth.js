import { STORAGE_KEYS } from './constants.js';
import { load, save, remove } from './storage.js';

export function getUsers() {
  return load(STORAGE_KEYS.USERS, []);
}

export function saveUsers(users) {
  save(STORAGE_KEYS.USERS, users);
}

export function login(username, password) {
  const user = getUsers().find(u => u.active && u.username === username && u.password === password);
  if (!user) return null;
  save(STORAGE_KEYS.SESSION, { userId: user.id, at: new Date().toISOString() });
  return user;
}

export function restoreSession() {
  const session = load(STORAGE_KEYS.SESSION, null);
  if (!session) return null;
  return getUsers().find(u => u.id === session.userId && u.active) || null;
}

export function logout() {
  remove(STORAGE_KEYS.SESSION);
}
