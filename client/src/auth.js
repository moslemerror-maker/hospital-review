// Reads the logged-in admin's role/permissions out of localStorage.
// Used by AdminLayout (to filter nav links) and App.jsx (to guard routes).
export function getSession() {
  const role = localStorage.getItem('adminRole') || 'staff';
  let permissions = [];
  try {
    permissions = JSON.parse(localStorage.getItem('adminPermissions') || '[]');
  } catch {
    permissions = [];
  }
  return { role, permissions };
}

export function hasPermission(permission) {
  const { role, permissions } = getSession();
  return role === 'superadmin' || permissions.includes(permission);
}
