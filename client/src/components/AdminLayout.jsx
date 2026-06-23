import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, ClipboardList, Settings, ShieldCheck, UserCircle2, LogOut } from 'lucide-react';
import { hasPermission } from '../auth';

export default function AdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminRole = localStorage.getItem('adminRole') || 'staff';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Nav items are filtered by assigned permissions — anything not granted is
  // hidden entirely, not just disabled.
  const navLinks = [
    hasPermission('dashboard')  && { path: '/admin',            label: 'Dashboard',      Icon: LayoutDashboard },
    hasPermission('complaints') && { path: '/admin/complaints', label: 'Complaints',     Icon: ClipboardList },
    adminRole === 'superadmin'  && { path: '/admin/superadmin', label: 'Admin Controls', Icon: Settings },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">

        {/* Hospital branding */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4.5 h-4.5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm leading-tight truncate">Marwari Hospital</p>
              <p className="text-xs text-slate-400 truncate">HIMS · Review Module</p>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="mx-3 mt-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2.5">
          <UserCircle2 className="w-7 h-7 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{adminName}</p>
            <p className={`text-xs mt-0.5 font-medium flex items-center gap-1 ${adminRole === 'superadmin' ? 'text-purple-600' : 'text-blue-600'}`}>
              {adminRole === 'superadmin' && <ShieldCheck className="w-3 h-3" strokeWidth={2} />}
              {adminRole === 'superadmin' ? 'Super Admin' : 'Staff'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 mt-2 space-y-0.5">
          {navLinks.map(({ path, label, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}>
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        <div className="p-3 border-t border-slate-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" strokeWidth={1.75} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
