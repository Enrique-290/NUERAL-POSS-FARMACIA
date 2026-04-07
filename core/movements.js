import { STORAGE_KEYS } from './constants.js';
import { load, save } from './storage.js';
import { state } from './state.js';

export function getInventoryMovements() {
  return load(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
}

export function saveInventoryMovements(items) {
  save(STORAGE_KEYS.INVENTORY_MOVEMENTS, items);
}

export function addInventoryMovement(movement) {
  const items = getInventoryMovements();
  const record = {
    id: movement.id || `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fecha: movement.fecha || new Date().toISOString(),
    productoId: movement.productoId || '',
    producto: movement.producto || '',
    sku: movement.sku || '',
    lote: movement.lote || '',
    tipo: movement.tipo || 'ajuste',
    cantidad: Number(movement.cantidad || 0),
    signo: movement.signo || (Number(movement.cantidad || 0) >= 0 ? '+' : '-'),
    usuario: movement.usuario || state.user?.username || 'sistema',
    modulo: movement.modulo || state.route || 'inventario',
    nota: movement.nota || ''
  };
  items.unshift(record);
  saveInventoryMovements(items);
  return record;
}

export function getProductMovements({ productoId = '', sku = '', lote = '' }) {
  return getInventoryMovements().filter(m => {
    if (productoId && m.productoId === productoId) return true;
    if (sku && lote) return m.sku === sku && m.lote === lote;
    if (sku) return m.sku === sku;
    return false;
  });
}
