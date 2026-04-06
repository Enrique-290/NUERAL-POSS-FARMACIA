export const STORAGE_KEYS = {
  USERS: 'neural_pos_users',
  SESSION: 'neural_pos_session',
  CONFIG: 'neural_pos_config',
  INVENTORY: 'neural_pos_inventory'
};

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: '🏠', group: 'Operación' },
  { key: 'ventas', label: 'Ventas', icon: '💳', group: 'Operación' },
  { key: 'inventario', label: 'Inventario', icon: '📦', group: 'Operación' },
  { key: 'bodega', label: 'Bodega', icon: '🏬', group: 'Operación' },
  { key: 'clientes', label: 'Clientes', icon: '🧍', group: 'Operación' },
  { key: 'historial', label: 'Historial', icon: '🧾', group: 'Operación' },
  { key: 'reportes', label: 'Reportes', icon: '📊', group: 'Operación' },
  { key: 'configuracion', label: 'Configuración', icon: '⚙️', group: 'Operación' },
  { key: 'mayoreo_dashboard', label: 'Dashboard mayoreo', icon: '📈', group: 'Mayoreo' },
  { key: 'mayoreo_ventas', label: 'Ventas mayoreo', icon: '🛒', group: 'Mayoreo' },
  { key: 'mayoreo_inventario', label: 'Inventario mayoreo', icon: '📦', group: 'Mayoreo' },
  { key: 'mayoreo_clientes', label: 'Clientes mayoreo', icon: '👥', group: 'Mayoreo' },
  { key: 'mayoreo_historial', label: 'Historial mayoreo', icon: '📚', group: 'Mayoreo' },
  { key: 'mayoreo_reportes', label: 'Reporte mayoreo', icon: '📑', group: 'Mayoreo' },
  { key: 'users_admin', label: 'Usuarios y permisos', icon: '🔐', group: 'Administración' }
];
