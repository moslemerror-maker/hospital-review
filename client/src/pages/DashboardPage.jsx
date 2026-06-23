import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, AlertTriangle, Clock, Plus, X, ClipboardList } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

export default function DashboardPage() {
  const [stats,       setStats]       = useState(null);
  const [campaigns,   setCampaigns]   = useState([]);
  const [showModal,   setShowModal]   = useState(false);
  const [formData,    setFormData]    = useState({ name: '', location: '', description: '' });
  const [formError,   setFormError]   = useState('');
  const [loading,     setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/campaigns')
      ]);
      setStats(statsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.location.trim()) {
      setFormError('Campaign name and location are required.');
      return;
    }

    try {
      await API.post('/campaigns', formData);
      setShowModal(false);
      setFormData({ name: '', location: '', description: '' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create campaign.');
    }
  };

  const handleToggle = async (id, e) => {
    e.stopPropagation();
    try {
      await API.patch(`/campaigns/${id}/toggle`);
      loadData();
    } catch {
      alert('Failed to update campaign status.');
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    </AdminLayout>
  );

  const statCards = stats ? [
    { label: 'Total Reviews',     value: stats.totalReviews,      Icon: Star,          color: 'blue'   },
    { label: 'Sent to Google',    value: stats.googleRedirects,   Icon: CheckCircle2,  color: 'green'  },
    { label: 'Total Complaints',  value: stats.totalComplaints,   Icon: AlertTriangle, color: 'orange' },
    { label: 'Pending Action',    value: stats.pendingComplaints, Icon: Clock,         color: 'red'    },
  ] : [];

  const colorMap = {
    blue:   { border: 'border-slate-200', icon: 'text-blue-600 bg-blue-50' },
    green:  { border: 'border-slate-200', icon: 'text-green-600 bg-green-50' },
    orange: { border: 'border-slate-200', icon: 'text-orange-600 bg-orange-50' },
    red:    { border: 'border-slate-200', icon: 'text-red-600 bg-red-50' },
  };

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your review campaigns</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2} /> New Campaign
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, Icon, color }) => (
            <div key={label} className={`rounded-xl border ${colorMap[color].border} bg-white p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color].icon}`}>
                  <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
                </span>
                <span className="text-2xl font-semibold text-slate-900">{value}</span>
              </div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Campaigns table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">All Campaigns</h2>
            <span className="text-sm text-slate-400">{campaigns.length} total</span>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-500 font-medium">No campaigns yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first campaign to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Campaign Name', 'Location', 'Total Reviews', 'Google Reviews', 'Complaints', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/admin/campaigns/${c._id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800 text-sm">{c.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{c.location}</td>
                      <td className="px-6 py-4 text-slate-700 text-sm font-medium">{c.totalReviews}</td>
                      <td className="px-6 py-4 text-green-600 text-sm font-medium">{c.googleRedirects}</td>
                      <td className="px-6 py-4 text-orange-600 text-sm font-medium">{c.totalComplaints}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleToggle(c._id, e)}
                          className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── Create Campaign Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Create New Campaign</h2>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors text-sm"
                  placeholder="e.g. General OPD Feedback 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Department / Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors text-sm"
                  placeholder="e.g. Cardiology OPD, 2nd Floor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors resize-none text-sm"
                  rows={3}
                  placeholder="Brief description of this campaign..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(''); }}
                  className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
