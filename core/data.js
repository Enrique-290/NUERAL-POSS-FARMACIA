import { STORAGE_KEYS, MODULES } from './constants.js';
import { load, save } from './storage.js';

export function defaultPermissions(all = false) {
  return MODULES.reduce((acc, mod) => {
    acc[mod.key] = all;
    return acc;
  }, {});
}

export function seedData() {
  const users = load(STORAGE_KEYS.USERS, []);
  if (!users.length) {
    save(STORAGE_KEYS.USERS, [
      { id: 'usr_admin', nombre: 'Administrador General', username: 'admin', password: '1234', role: 'Administrador', active: true, permissions: defaultPermissions(true) },
      { id: 'usr_caja', nombre: 'Caja Mostrador', username: 'caja', password: '1234', role: 'Caja', active: true, permissions: { ...defaultPermissions(false), dashboard: true, ventas: true, clientes: true, historial: true } }
    ]);
  }
  else {
    const migrated = users.map(u => ({
      ...u,
      permissions: { ...defaultPermissions(u.role === "Administrador"), ...(u.permissions || {}) }
    }));
    save(STORAGE_KEYS.USERS, migrated);
  }


  if (!load(STORAGE_KEYS.CONFIG, null)) {
    save(STORAGE_KEYS.CONFIG, { appName: 'Neural POS Farmacia', footerText: 'Hecho por Neural Apps', web: { storeName: 'Neural POS Farmacia', heroTitle: 'Tu farmacia cerca de ti', heroSubtitle: 'Medicamentos, cuidado diario y pedidos por WhatsApp.', whatsapp: '525500000000', showCart: true } });
  }

  if (!load(STORAGE_KEYS.INVENTORY, null)) {
    save(STORAGE_KEYS.INVENTORY, [
      { id: 'inv1', sku: '75020001', barcode: '75020001', nombre: 'Paracetamol 500 mg', categoria: 'Genérico', tipo: 'Genérico', costo: 22, precio: 38, stock: 22, stockMinimo: 8, lote: 'PAR-2401', caducidad: '2026-11-20', visibleWeb: true, precioWeb: 40, categoriaWeb: 'Dolor y fiebre', destacadoWeb: true },
      { id: 'inv2', sku: '75020002', barcode: '75020002', nombre: 'Omeprazol 20 mg', categoria: 'Original', tipo: 'Original', costo: 46, precio: 74, stock: 9, stockMinimo: 10, lote: 'OME-2405', caducidad: '2026-05-15', visibleWeb: true, precioWeb: 76, categoriaWeb: 'Estómago', destacadoWeb: false },
      { id: 'inv3', sku: '75020003', barcode: '75020003', nombre: 'Jarabe infantil', categoria: 'Pediatría', tipo: 'Original', costo: 58, precio: 96, stock: 12, stockMinimo: 6, lote: 'JAR-2402', caducidad: '2026-04-20', visibleWeb: true, precioWeb: 99, categoriaWeb: 'Infantil', destacadoWeb: true },
      { id: 'inv4', sku: '75020004', barcode: '75020004', nombre: 'Loratadina 10 mg', categoria: 'Genérico', tipo: 'Genérico', costo: 31, precio: 49, stock: 25, stockMinimo: 9, lote: 'LOR-2407', caducidad: '2027-01-08', visibleWeb: false, precioWeb: 49, categoriaWeb: 'Alergias', destacadoWeb: false },
      { id: 'inv5', sku: '75020005', barcode: '75020005', nombre: 'Vitamina C 1 g', categoria: 'Vitaminas', tipo: 'Original', costo: 61, precio: 89, stock: 14, stockMinimo: 7, lote: 'VIT-2409', caducidad: '2026-03-22', visibleWeb: true, precioWeb: 92, categoriaWeb: 'Vitaminas', destacadoWeb: false }
    ]);
  }
  else {
    const migratedInventory = load(STORAGE_KEYS.INVENTORY, []).map(item => ({
      ...item,
      visibleWeb: Boolean(item.visibleWeb),
      precioWeb: Number(item.precioWeb ?? item.precio ?? 0),
      categoriaWeb: item.categoriaWeb || item.categoria || 'General',
      destacadoWeb: Boolean(item.destacadoWeb)
    }));
    save(STORAGE_KEYS.INVENTORY, migratedInventory);
  }


  if (!load(STORAGE_KEYS.BODEGA, null)) {
    save(STORAGE_KEYS.BODEGA, [
      { id: 'bod1', sku: '75020001', nombre: 'Paracetamol 500 mg', categoria: 'Genérico', stock: 120, stockMinimo: 40, lote: 'PAR-B2401', caducidad: '2026-12-10' },
      { id: 'bod2', sku: '75020002', nombre: 'Omeprazol 20 mg', categoria: 'Original', stock: 60, stockMinimo: 25, lote: 'OME-B2405', caducidad: '2026-09-15' },
      { id: 'bod3', sku: '75020003', nombre: 'Jarabe infantil', categoria: 'Pediatría', stock: 30, stockMinimo: 12, lote: 'JAR-B2402', caducidad: '2026-07-20' }
    ]);
  }


  if (!load(STORAGE_KEYS.CLIENTS, null)) {
    save(STORAGE_KEYS.CLIENTS, [
      { id: 'cli1', nombre: 'Ana Ruiz', telefono: '5512345678', email: 'ana@correo.com', tipoCliente: 'Frecuente', fechaAlta: '2026-03-18', activo: true, direccion: 'Col. Centro', notas: 'Prefiere aviso por WhatsApp.' },
      { id: 'cli2', nombre: 'Clínica San Pedro', telefono: '5587654321', email: 'compras@sanpedro.mx', tipoCliente: 'Mayoreo', fechaAlta: '2026-02-10', activo: true, direccion: 'Av. Reforma 120', notas: 'Compra cajas completas cada quincena.' },
      { id: 'cli3', nombre: 'Jorge Martínez', telefono: '5544400011', email: '', tipoCliente: 'Mostrador', fechaAlta: '2026-04-01', activo: true, direccion: '', notas: 'Cliente nuevo.' }
    ]);
  }


  if (!load(STORAGE_KEYS.PURCHASES, null)) {
    save(STORAGE_KEYS.PURCHASES, [
      { id: 'comp1', fecha: '2026-04-06', proveedor: 'Distribuidora Alfa', referencia: 'FAC-1001', destino: 'inventario', nombre: 'Paracetamol 500 mg', categoria: 'Genérico', tipo: 'Genérico', sku: '75020001', barcode: '75020001', lote: 'PAR-C2406', costo: 21, precio: 38, cantidad: 12, stockMinimo: 8, caducidad: '2026-12-15', pago: 'Transferencia', notas: 'Compra semanal de reposición', total: 252 },
      { id: 'comp2', fecha: '2026-04-07', proveedor: 'Medicinas del Centro', referencia: 'FAC-1002', destino: 'bodega', nombre: 'Omeprazol 20 mg', categoria: 'Original', tipo: 'Original', sku: '75020002', barcode: '75020002', lote: 'OME-C2407', costo: 44, precio: 74, cantidad: 20, stockMinimo: 10, caducidad: '2026-09-10', pago: 'Crédito', notas: 'Se guarda como reserva en bodega', total: 880 }
    ]);
  }


  if (!load(STORAGE_KEYS.MAYOREO_INVENTORY, null)) {
    save(STORAGE_KEYS.MAYOREO_INVENTORY, [
      { id: 'm_inv1', sku: 'M75030001', barcode: 'M75030001', nombre: 'Paracetamol 500 mg Caja', categoria: 'Genérico', tipo: 'Genérico', costo: 320, precio: 410, stock: 28, stockMinimo: 12, lote: 'MPAR-2401', caducidad: '2026-10-12' },
      { id: 'm_inv2', sku: 'M75030002', barcode: 'M75030002', nombre: 'Omeprazol 20 mg Caja', categoria: 'Original', tipo: 'Original', costo: 610, precio: 760, stock: 11, stockMinimo: 10, lote: 'MOME-2405', caducidad: '2026-06-08' },
      { id: 'm_inv3', sku: 'M75030003', barcode: 'M75030003', nombre: 'Vitamina C 1 g Caja', categoria: 'Vitaminas', tipo: 'Original', costo: 700, precio: 920, stock: 17, stockMinimo: 8, lote: 'MVIT-2407', caducidad: '2026-04-22' },
      { id: 'm_inv4', sku: 'M75030004', barcode: 'M75030004', nombre: 'Loratadina 10 mg Caja', categoria: 'Genérico', tipo: 'Genérico', costo: 390, precio: 540, stock: 35, stockMinimo: 15, lote: 'MLOR-2408', caducidad: '2027-01-15' }
    ]);
  }

  if (!load(STORAGE_KEYS.MAYOREO_CLIENTS, null)) {
    save(STORAGE_KEYS.MAYOREO_CLIENTS, [
      { id: 'm_cli1', nombre: 'Clínica San Pedro', telefono: '5587654321', email: 'compras@sanpedro.mx', tipoCliente: 'Mayoreo', fechaAlta: '2026-02-10', activo: true, direccion: 'Av. Reforma 120', notas: 'Compra cajas completas cada quincena.' },
      { id: 'm_cli2', nombre: 'Farmacia del Valle', telefono: '5511122233', email: 'pedidos@fdelvalle.mx', tipoCliente: 'Mayoreo', fechaAlta: '2026-03-01', activo: true, direccion: 'Insurgentes Sur 340', notas: 'Maneja pedido semanal.' },
      { id: 'm_cli3', nombre: 'Consultorio Buenavista', telefono: '5599988877', email: '', tipoCliente: 'Mayoreo', fechaAlta: '2026-03-15', activo: true, direccion: 'Buenavista 45', notas: 'Pide solo vitaminos y analgésicos.' }
    ]);
  }

  if (!load(STORAGE_KEYS.MAYOREO_SALES, null)) {
    save(STORAGE_KEYS.MAYOREO_SALES, [
      { id: 'm_sale1', folio: 'M-240401', fecha: '2026-04-04T10:15:00', cliente: 'Clínica San Pedro', pago: 'Transferencia', extraAmount: 0, subtotal: 1640, total: 1640, items: [{ nombre: 'Paracetamol 500 mg Caja', cantidad: 4, precio: 410 }] },
      { id: 'm_sale2', folio: 'M-240402', fecha: '2026-04-05T12:40:00', cliente: 'Farmacia del Valle', pago: 'Efectivo', extraAmount: 60, subtotal: 2280, total: 2340, items: [{ nombre: 'Omeprazol 20 mg Caja', cantidad: 3, precio: 760 }] },
      { id: 'm_sale3', folio: 'M-240403', fecha: '2026-04-06T09:20:00', cliente: 'Consultorio Buenavista', pago: 'Tarjeta', extraAmount: 0, subtotal: 1840, total: 1840, items: [{ nombre: 'Vitamina C 1 g Caja', cantidad: 2, precio: 920 }] }
    ]);
  }

  if (!load(STORAGE_KEYS.SALES, null)) {
    save(STORAGE_KEYS.SALES, [
      { id: 'sale1', folio: 'V-240401', fecha: '2026-04-05T09:12:00', cliente: 'Mostrador', pago: 'Efectivo', receta: '', extraLabel: '', extraAmount: 0, subtotal: 180, total: 180, items: [{ nombre: 'Paracetamol 500 mg', cantidad: 2, precio: 38 }, { nombre: 'Jarabe infantil', cantidad: 1, precio: 104 }] },
      { id: 'sale2', folio: 'V-240402', fecha: '2026-04-05T10:24:00', cliente: 'Ana Ruiz', pago: 'Tarjeta', receta: 'receta_ana.jpg', extraLabel: 'Consulta', extraAmount: 80, subtotal: 380, total: 460, items: [{ nombre: 'Omeprazol 20 mg', cantidad: 2, precio: 74 }, { nombre: 'Vitamina C 1 g', cantidad: 2, precio: 89 }] },
      { id: 'sale3', folio: 'V-240403', fecha: '2026-04-06T08:40:00', cliente: 'Jorge Martínez', pago: 'Transferencia', receta: '', extraLabel: '', extraAmount: 0, subtotal: 92, total: 92, items: [{ nombre: 'Loratadina 10 mg', cantidad: 1, precio: 49 }, { nombre: 'Ibuprofeno 400 mg', cantidad: 1, precio: 43 }] }
    ]);
  }

}
