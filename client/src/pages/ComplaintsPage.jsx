import { useState, useEffect } from 'react';
import { Star, CheckCircle2, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const STATUS_STYLES = {
  'pending':     'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'resolved':    'bg-green-100 text-green-700 border-green-200'
};

const STAR_LABEL = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average'
};

function StarRating({ rating, size = 'text-lg' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={size === 'text-xl' ? 'w-4.5 h-4.5' : 'w-4 h-4'}
          strokeWidth={1.5}
          fill={s <= rating ? '#FBBF24' : '#E5E7EB'}
          stroke={s <= rating ? '#FBBF24' : '#E5E7EB'}
        />
      ))}
    </div>
  );
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
            <h1 className="text-xl font-semibold text-slate-900">
              Complaints
            </h1>

            <p className="text-slate-500 text-sm mt-1">
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                filter === f.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-500 font-medium">
                No complaints found
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
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
                      className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Visitor */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800 text-sm">
                        {c.visitorName}
                      </p>

                      {c.phone && (
                        <p className="text-xs text-slate-400">
                          {c.phone}
                        </p>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">
                      <StarRating rating={c.rating} />
                      <p className="text-xs text-slate-400 mt-0.5">
                        {STAR_LABEL[c.rating]}
                      </p>
                    </td>

                    {/* Campaign */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {c.campaign?.name || '—'}
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {c.department || '—'}
                    </td>

                    {/* Assigned To */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {c.assignedTo?.name || '—'}
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xs">
                      <p className="truncate">
                        {c.description}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
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
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white rounded-t-xl">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {selected.visitorName}
                </h2>

                <p className="text-slate-500 text-sm mt-0.5">
                  {selected.phone || 'No phone provided'}
                  &nbsp;·&nbsp;
                  {selected.department || 'No department'}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 ml-4"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Rating */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Rating Given
                </p>

                <div className="flex items-center gap-2">
                  <StarRating rating={selected.rating} size="text-xl" />
                  <span className="text-sm text-slate-500">
                    {STAR_LABEL[selected.rating]}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Visitor's Description
                </p>

                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              </div>

              {/* Campaign */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Campaign
                </p>

                <p className="text-sm text-slate-700">
                  {selected.campaign?.name} - {selected.campaign?.location}
                </p>
              </div>

              {/* Current Status */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Internal Notes (visible to admin only)
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors text-sm resize-none"
                  rows={3}
                  placeholder="Add notes about this complaint, what action was taken..."
                />
              </div>

              {/* Assign To */}
              {adminRole === 'superadmin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Assign To Staff Member
                  </label>

                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm bg-white"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
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
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
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
