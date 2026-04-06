export function canAccess(user, moduleKey) {
  return !!user?.permissions?.[moduleKey];
}
