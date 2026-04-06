export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'NA';
}

export function inventoryStatus(item) {
  const today = new Date();
  const target = new Date(item.caducidad + 'T00:00:00');
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { label: 'Vencido', className: 'danger' };
  if (diffDays <= 60) return { label: 'Próximo', className: 'warn' };
  return { label: 'Vigente', className: 'ok' };
}

export function stockStatus(item) {
  return item.stock <= item.stockMinimo
    ? { label: 'Stock bajo', className: 'danger' }
    : { label: 'Stock ok', className: 'soft-blue' };
}

export function inventoryStats(items) {
  const vencidos = items.filter(i => inventoryStatus(i).label === 'Vencido').length;
  const proximos = items.filter(i => inventoryStatus(i).label === 'Próximo').length;
  const bajos = items.filter(i => i.stock <= i.stockMinimo).length;
  return { total: items.length, vencidos, proximos, bajos };
}
