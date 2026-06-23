import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import ComplaintsPage     from './pages/ComplaintsPage';
import ReviewPage         from './pages/ReviewPage';
import SuperAdminPage     from './pages/SuperAdminPage';
import { hasPermission } from './auth';

function AccessRestricted() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm px-6">
        <ShieldOff className="w-10 h-10 text-slate-400 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-slate-800 mb-1">Access restricted</h1>
        <p className="text-slate-500 text-sm">
          Your account doesn't have access to this section. Contact your Super Admin if you believe this is incorrect.
        </p>
      </div>
    </div>
  );
}

// Requires a valid login; redirects to /login otherwise
function PrivateRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
}

// Requires login AND a specific granted permission (superadmin role always
// has every permission — see hasPermission in src/auth.js)
function PermissionRoute({ permission, children }) {
  return (
    <PrivateRoute>
      {hasPermission(permission) ? children : <AccessRestricted />}
    </PrivateRoute>
  );
}

// Superadmin-only routes (Admin Controls) — not a grantable permission
function SuperAdminRoute({ children }) {
  const role = localStorage.getItem('adminRole');
  return (
    <PrivateRoute>
      {role === 'superadmin' ? children : <AccessRestricted />}
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes (no login needed) ───────────────────── */}
        <Route path="/review/:campaignId" element={<ReviewPage />} />
        <Route path="/login"             element={<LoginPage />} />

        {/* ── Protected admin routes (login + permission required) ─ */}
        <Route path="/admin" element={
          <PermissionRoute permission="dashboard"><DashboardPage /></PermissionRoute>
        }/>
        <Route path="/admin/campaigns/:id" element={
          <PermissionRoute permission="dashboard"><CampaignDetailPage /></PermissionRoute>
        }/>
        <Route path="/admin/complaints" element={
          <PermissionRoute permission="complaints"><ComplaintsPage /></PermissionRoute>
        }/>
        <Route path="/admin/superadmin" element={
          <SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>
        }/>

        {/* ── Default: redirect root to admin ───────────────────── */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
