import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    </AdminLayout>
  );

  const statCards = stats ? [
    { label: 'Total Reviews',     value: stats.totalReviews,      icon: '⭐', color: 'blue'   },
    { label: 'Sent to Google',    value: stats.googleRedirects,   icon: '✅', color: 'green'  },
    { label: 'Total Complaints',  value: stats.totalComplaints,   icon: '⚠️', color: 'orange' },
    { label: 'Pending Action',    value: stats.pendingComplaints, icon: '🕐', color: 'red'    },
  ] : [];

  const colorMap = {
    blue:   'border-blue-200 bg-blue-50',
    green:  'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50',
    red:    'border-red-200 bg-red-50',
  };

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your review campaigns</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
          >
            + New Campaign
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border-2 p-5 ${colorMap[card.color]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-3xl font-black text-gray-800">{card.value}</span>
              </div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Campaigns table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-lg">All Campaigns</h2>
            <span className="text-sm text-gray-400">{campaigns.length} total</span>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-400 font-medium">No campaigns yet</p>
              <p className="text-gray-300 text-sm mt-1">Create your first campaign to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Campaign Name', 'Location', 'Total Reviews', 'Google Reviews', 'Complaints', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/admin/campaigns/${c._id}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800">{c.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{c.location}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{c.totalReviews}</td>
                      <td className="px-6 py-4 text-green-600 font-semibold">{c.googleRedirects}</td>
                      <td className="px-6 py-4 text-orange-600 font-semibold">{c.totalComplaints}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          c.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleToggle(c._id, e)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Create New Campaign</h2>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Campaign Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. General OPD Feedback 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Department / Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Cardiology OPD, 2nd Floor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-gray-300 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  rows={3}
                  placeholder="Brief description of this campaign..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(''); }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
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