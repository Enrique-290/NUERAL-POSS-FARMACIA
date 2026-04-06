import { STORAGE_KEYS } from './constants.js';
import { load, save } from './storage.js';

export function defaultPermissions(modules, all = false) {
  return modules.reduce((acc, mod) => {
    acc[mod.key] = all;
    return acc;
  }, {});
}

export function seedData(modules) {
  const users = load(STORAGE_KEYS.USERS, []);
  if (!users.length) {
    save(STORAGE_KEYS.USERS, [
      {
        id: 'usr_admin', nombre: 'Administrador General', username: 'admin', password: '1234',
        role: 'Administrador', active: true, permissions: defaultPermissions(modules, true)
      },
      {
        id: 'usr_caja', nombre: 'Caja Mostrador', username: 'caja', password: '1234',
        role: 'Caja', active: true,
        permissions: { ...defaultPermissions(modules, false), dashboard: true, ventas: true, clientes: true, historial: true }
      }
    ]);
  }

  if (!load(STORAGE_KEYS.CONFIG, null)) {
    save(STORAGE_KEYS.CONFIG, { appName: 'Neural POS Farmacia', footerText: 'Hecho por Neural Apps' });
  }

  if (!load(STORAGE_KEYS.INVENTORY, null)) {
    save(STORAGE_KEYS.INVENTORY, [
      { id: 'inv1', sku: '75020001', barcode: '75020001', nombre: 'Paracetamol 500 mg', categoria: 'Genérico', tipo: 'Genérico', costo: 22, precio: 38, stock: 22, stockMinimo: 8, lote: 'PAR-2401', caducidad: '2026-11-20' },
      { id: 'inv2', sku: '75020002', barcode: '75020002', nombre: 'Omeprazol 20 mg', categoria: 'Original', tipo: 'Original', costo: 46, precio: 74, stock: 9, stockMinimo: 10, lote: 'OME-2405', caducidad: '2026-05-15' },
      { id: 'inv3', sku: '75020003', barcode: '75020003', nombre: 'Jarabe infantil', categoria: 'Pediatría', tipo: 'Original', costo: 58, precio: 96, stock: 12, stockMinimo: 6, lote: 'JAR-2402', caducidad: '2026-04-20' },
      { id: 'inv4', sku: '75020004', barcode: '75020004', nombre: 'Loratadina 10 mg', categoria: 'Genérico', tipo: 'Genérico', costo: 31, precio: 49, stock: 25, stockMinimo: 9, lote: 'LOR-2407', caducidad: '2027-01-08' },
      { id: 'inv5', sku: '75020005', barcode: '75020005', nombre: 'Vitamina C 1 g', categoria: 'Vitaminas', tipo: 'Original', costo: 61, precio: 89, stock: 14, stockMinimo: 7, lote: 'VIT-2409', caducidad: '2026-03-22' }
    ]);
  }
}
