export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'NA';
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.style.display = 'none';
  }, 2200);
}

export function inventoryStatus(item) {
  const today = new Date();
  const target = new Date(`${item.caducidad}T00:00:00`);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { label: 'Vencido', className: 'danger' };
  if (diffDays <= 60) return { label: 'Próximo', className: 'warn' };
  return { label: 'Vigente', className: 'ok' };
}

export function stockStatus(item) {
  return item.stock <= item.stockMinimo ? { label: 'Stock bajo', className: 'danger' } : { label: 'Stock ok', className: 'soft-blue' };
}
