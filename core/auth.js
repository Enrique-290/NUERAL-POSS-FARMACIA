import { STORAGE_KEYS } from './constants.js';
import { load, save, remove } from './storage.js';
export function login(username,password){const users=load(STORAGE_KEYS.USERS,[]);const u=users.find(x=>x.active&&x.username===username&&x.password===password);if(!u)return null;save(STORAGE_KEYS.SESSION,{userId:u.id,at:new Date().toISOString()});return u;}
export function restoreSession(){const s=load(STORAGE_KEYS.SESSION,null);if(!s)return null;const users=load(STORAGE_KEYS.USERS,[]);return users.find(u=>u.id===s.userId&&u.active)||null;}
export function logout(){remove(STORAGE_KEYS.SESSION);}
