import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import ComplaintsPage     from './pages/ComplaintsPage';
import ReviewPage         from './pages/ReviewPage';
import SuperAdminPage     from './pages/SuperAdminPage';

// This wrapper checks if the admin is logged in
// If not, it sends them to the login page
function PrivateRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes (no login needed) ───────────────────── */}
        <Route path="/review/:campaignId" element={<ReviewPage />} />
        <Route path="/login"             element={<LoginPage />} />

        {/* ── Protected admin routes (login required) ───────────── */}
        <Route path="/admin" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        }/>
        <Route path="/admin/campaigns/:id" element={
          <PrivateRoute><CampaignDetailPage /></PrivateRoute>
        }/>
        <Route path="/admin/complaints" element={
          <PrivateRoute><ComplaintsPage /></PrivateRoute>
        }/>
        <Route path="/admin/superadmin" element={
          <PrivateRoute><SuperAdminPage /></PrivateRoute>
        }/>

        {/* ── Default: redirect root to admin ───────────────────── */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

      </Routes>
    </BrowserRouter>
  );
}