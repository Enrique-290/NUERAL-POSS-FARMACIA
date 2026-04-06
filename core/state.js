export const state = {
  route: 'dashboard',
  user: null,
  menuCollapsed: false,
  mobileMenu: false,
  selectedManagedUserId: '',
  salesQuery: '',
  inventoryQuery: '',
  editingInventoryId: '',
  lastSale: '',
  cart: {
    items: [],
    cliente: 'Mostrador',
    pago: 'Efectivo',
    receta: '',
    extraLabel: '',
    extraAmount: 0
  }
};

export function emptyCart() {
  return {
    items: [],
    cliente: 'Mostrador',
    pago: 'Efectivo',
    receta: '',
    extraLabel: '',
    extraAmount: 0
  };
}
