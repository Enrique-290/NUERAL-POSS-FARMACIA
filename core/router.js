export const moduleLoaders = {
  dashboard: () => import('../modules/dashboard/index.js'),
  ventas: () => import('../modules/ventas/index.js'),
  inventario: () => import('../modules/inventario/index.js'),
  bodega: () => import('../modules/bodega/index.js'),
  compras: () => import('../modules/compras/index.js'),
  clientes: () => import('../modules/clientes/index.js'),
  historial: () => import('../modules/historial/index.js'),
  reportes: () => import('../modules/reportes/index.js'),
  configuracion: () => import('../modules/configuracion/index.js'),
  mayoreo_dashboard: () => import('../modules/mayoreo/dashboard/index.js'),
  mayoreo_ventas: () => import('../modules/mayoreo/ventas/index.js'),
  mayoreo_inventario: () => import('../modules/mayoreo/inventario/index.js'),
  mayoreo_clientes: () => import('../modules/mayoreo/clientes/index.js'),
  mayoreo_historial: () => import('../modules/mayoreo/historial/index.js'),
  mayoreo_reportes: () => import('../modules/mayoreo/reportes/index.js'),
  users_admin: () => import('../modules/users/index.js')
};
