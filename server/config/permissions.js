// Grantable staff permissions — controls which nav items/pages a staff member
// can see. Super Admin Controls (departments, users, passwords) is intentionally
// NOT in this list: it's always superadmin-only, never delegable.
const PERMISSIONS = ['dashboard', 'complaints'];

module.exports = { PERMISSIONS };
