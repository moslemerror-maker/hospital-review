import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const STATUS_STYLES = {
  'pending':     'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'resolved':    'bg-green-100 text-green-700 border-green-200'
};

const STAR_LABEL = {
  1: '😞 Very Poor',
  2: '😕 Poor',
  3: '😐 Average'
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // NEW
  const [staffList, setStaffList] = useState([]);
  const [assignTo, setAssignTo] = useState('');

  const adminRole = localStorage.getItem('adminRole');

  useEffect(() => {
    loadComplaints();

    if (adminRole === 'superadmin') {
      API.get('/auth/users')
        .then((r) => {
          setStaffList(
            r.data.filter((u) => u.role === 'staff')
          );
        })
        .catch((err) => console.error(err));
    }
  }, [filter]);

  const loadComplaints = async () => {
    setLoading(true);

    try {
      const url = filter
        ? `/complaints?status=${filter}`
        : '/complaints';

      const res = await API.get(url);

      setComplaints(res.data.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openComplaint = (c) => {
    setSelected(c);
    setNotes(c.adminNotes || '');
    setAssignTo(c.assignedTo?._id || '');
  };

  const updateStatus = async (newStatus) => {
    setSaving(true);

    try {
      const payload = {
        status: newStatus,
        adminNotes: notes
      };

      if (adminRole === 'superadmin' && assignTo !== undefined) {
        payload.assignedTo = assignTo || null;
      }

      await API.patch(`/complaints/${selected._id}`, payload);

      setSelected(null);
      loadComplaints();

    } catch {
      alert('Failed to update complaint.');
    } finally {
      setSaving(false);
    }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Complaints
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Feedback from visitors who rated 3 stars or below
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors border-2 ${
                filter === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-400 font-medium">
                No complaints found
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    'Visitor',
                    'Rating',
                    'Campaign',
                    'Department',
                    'Assigned To',
                    'Description',
                    'Date',
                    'Status',
                    ''
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Visitor */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 text-sm">
                        {c.visitorName}
                      </p>

                      {c.phone && (
                        <p className="text-xs text-gray-400">
                          {c.phone}
                        </p>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            className={`text-lg ${
                              s <= c.rating
                                ? 'text-yellow-400'
                                : 'text-gray-100'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {STAR_LABEL[c.rating]}
                      </p>
                    </td>

                    {/* Campaign */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {c.campaign?.name || '—'}
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {c.department || '—'}
                    </td>

                    {/* Assigned To */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {c.assignedTo?.name || '—'}
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-xs">
                      <p className="truncate">
                        {c.description}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(c.submittedAt).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Manage */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openComplaint(c)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selected.visitorName}
                </h2>

                <p className="text-gray-400 text-sm mt-0.5">
                  {selected.phone || 'No phone provided'}
                  &nbsp;·&nbsp;
                  {selected.department || 'No department'}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-500 text-2xl font-light ml-4"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Rating */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Rating Given
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`text-xl ${
                          s <= selected.rating
                            ? 'text-yellow-400'
                            : 'text-gray-100'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <span className="text-sm text-gray-500">
                    {STAR_LABEL[selected.rating]}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Visitor's Description
                </p>

                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              </div>

              {/* Campaign */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Campaign
                </p>

                <p className="text-sm text-gray-700">
                  {selected.campaign?.name} - {selected.campaign?.location}
                </p>
              </div>

              {/* Current Status */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Current Status
                </p>

                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[selected.status]}`}
                >
                  {selected.status}
                </span>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Internal Notes (visible to admin only)
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
                  rows={3}
                  placeholder="Add notes about this complaint, what action was taken..."
                />
              </div>

              {/* Assign To */}
              {adminRole === 'superadmin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Assign To Staff Member
                  </label>

                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm bg-white"
                  >
                    <option value="">
                      — Unassigned —
                    </option>

                    {staffList.map((s) => (
                      <option
                        key={s._id}
                        value={s._id}
                      >
                        {s.name} ({s.department?.name || 'No dept'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">

                {selected.status !== 'in-progress' && (
                  <button
                    onClick={() => updateStatus('in-progress')}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Mark In Progress'}
                  </button>
                )}

                {selected.status !== 'resolved' && (
                  <button
                    onClick={() => updateStatus('resolved')}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Mark Resolved'}
                  </button>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}