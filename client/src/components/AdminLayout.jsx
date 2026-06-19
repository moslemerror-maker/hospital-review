import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminRole = localStorage.getItem('adminRole') || 'staff';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Base nav — all roles see these
  const navLinks = [
    { path: '/admin',            label: 'Dashboard',  icon: '📊' },
    { path: '/admin/complaints', label: 'Complaints', icon: '📋' },
  ];

  // Super admin only nav item
  if (adminRole === 'superadmin') {
    navLinks.push({ path: '/admin/superadmin', label: 'Admin Controls', icon: '⚙️' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-gray-100 shadow-sm flex flex-col flex-shrink-0">

        {/* Hospital branding */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-lg">🏥</span>
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800 text-sm leading-tight truncate">Marwari Hospital</p>
              <p className="text-xs text-gray-400 truncate">Review System</p>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="mx-3 mt-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 truncate">{adminName}</p>
          <p className={`text-xs mt-0.5 font-medium ${adminRole === 'superadmin' ? 'text-purple-500' : 'text-blue-500'}`}>
            {adminRole === 'superadmin' ? '👑 Super Admin' : '👤 Staff'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 mt-2 space-y-0.5">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}