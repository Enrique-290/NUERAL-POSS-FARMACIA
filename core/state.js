export const state = {
  route: 'dashboard',
  user: null,
  menuCollapsed: false,
  mobileMenu: false,
  salesQuery: '',
  inventoryQuery: '',
  bodegaQuery: '',
  clientsQuery: '',
  selectedManagedUserId: '',
  editingInventoryId: '',
  editingBodegaId: '',
  editingClientId: '',
  historyQuery: '',
  cart: { items: [], cliente: 'Mostrador', pago: 'Efectivo', receta: '', extraLabel: '', extraAmount: 0 },
  lastSale: ''
};
