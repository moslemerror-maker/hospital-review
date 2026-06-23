import { useState, useEffect } from 'react';
import { ShieldCheck, UserCircle2, X, Pencil } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const TABS = ['Departments', 'Users & Staff', 'Change Passwords'];

const PERMISSION_LABELS = {
  dashboard:  'Dashboard',
  complaints: 'Complaints',
};

function PermissionCheckboxes({ allPermissions, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {allPermissions.map((key) => (
        <label key={key} className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={value.includes(key)}
            onChange={(e) => {
              onChange(e.target.checked ? [...value, key] : value.filter((p) => p !== key));
            }}
            className="accent-slate-900"
          />
          {PERMISSION_LABELS[key] || key}
        </label>
      ))}
    </div>
  );
}

export default function SuperAdminPage() {
  const [activeTab,    setActiveTab]    = useState(0);
  const [departments,  setDepartments]  = useState([]);
  const [users,        setUsers]        = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  // Department form
  const [deptName,     setDeptName]     = useState('');
  const [deptDesc,     setDeptDesc]     = useState('');
  const [deptError,    setDeptError]    = useState('');
  const [deptSuccess,  setDeptSuccess]  = useState('');

  // User form
  const [userForm,     setUserForm]     = useState({ name:'', username:'', email:'', password:'', role:'staff', department:'', permissions:[] });
  const [userError,    setUserError]    = useState('');
  const [userSuccess,  setUserSuccess]  = useState('');

  // Password change
  const [pwTarget,     setPwTarget]     = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [pwError,      setPwError]      = useState('');
  const [pwSuccess,    setPwSuccess]    = useState('');

  // Edit user modal
  const [editUser,     setEditUser]     = useState(null);
  const [editForm,     setEditForm]     = useState({});

  useEffect(() => { loadDepts(); loadUsers(); loadPermissions(); }, []);

  const loadDepts = async () => {
    try { const r = await API.get('/departments'); setDepartments(r.data); } catch {}
  };

  const loadUsers = async () => {
    try { const r = await API.get('/auth/users'); setUsers(r.data); } catch {}
  };

  const loadPermissions = async () => {
    try { const r = await API.get('/auth/permissions'); setAllPermissions(r.data); } catch {}
  };

  const createDept = async (e) => {
    e.preventDefault();
    setDeptError(''); setDeptSuccess('');
    try {
      await API.post('/departments', { name: deptName, description: deptDesc });
      setDeptName(''); setDeptDesc('');
      setDeptSuccess('Department created successfully!');
      loadDepts();
    } catch (err) {
      setDeptError(err.response?.data?.message || 'Failed to create department');
    }
  };

  const deleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await API.delete(`/departments/${id}`); loadDepts(); } catch {}
  };

  const createUser = async (e) => {
    e.preventDefault();
    setUserError(''); setUserSuccess('');
    try {
      await API.post('/auth/users', userForm);
      setUserForm({ name:'', username:'', email:'', password:'', role:'staff', department:'', permissions:[] });
      setUserSuccess('User created successfully!');
      loadUsers();
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (!pwTarget) { setPwError('Select a user first'); return; }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    try {
      await API.patch(`/auth/users/${pwTarget}/password`, { newPassword: newPw });
      setPwTarget(''); setNewPw('');
      setPwSuccess('Password changed successfully!');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const saveEditUser = async () => {
    try {
      await API.patch(`/auth/users/${editUser._id}`, editForm);
      setEditUser(null);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const toggleUserActive = async (user) => {
    try {
      await API.patch(`/auth/users/${user._id}`, { isActive: !user.isActive });
      loadUsers();
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900">Super Admin Controls</h1>
          <p className="text-slate-500 text-sm mt-1">Manage departments, staff accounts, and access</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB 0: Departments ─────────────────────────────────────────── */}
        {activeTab === 0 && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Create New Department</h2>
              {deptError   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{deptError}</div>}
              {deptSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">{deptSuccess}</div>}
              <form onSubmit={createDept} className="flex gap-3">
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                  placeholder="Department name e.g. Cardiology"
                  required
                />
                <input
                  type="text"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                  placeholder="Description (optional)"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                >
                  Create
                </button>
              </form>
            </div>

            {/* Department list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">All Departments ({departments.length})</h2>
              </div>
              {departments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No departments yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Description</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {departments.map((d) => (
                      <tr key={d._id}>
                        <td className="px-6 py-4 font-medium text-slate-800 text-sm">{d.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{d.description || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            d.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteDept(d._id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 1: Users ──────────────────────────────────────────────── */}
        {activeTab === 1 && (
          <div className="space-y-6">
            {/* Create user form */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Create New User / Staff</h2>
              {userError   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{userError}</div>}
              {userSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">{userSuccess}</div>}
              <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <input type="text" value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                    placeholder="Full name" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Username *</label>
                  <input type="text" value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                    placeholder="Used to log in" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email <span className="text-slate-400">(optional, contact only)</span></label>
                  <input type="email" value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                    placeholder="email@hospital.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
                  <input type="password" value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                    placeholder="Min 6 characters" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role *</label>
                  <select value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm bg-white">
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                  <select value={userForm.department}
                    onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm bg-white">
                    <option value="">— No department —</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {userForm.role === 'staff' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Permissions — which sections this user can see
                    </label>
                    <PermissionCheckboxes
                      allPermissions={allPermissions}
                      value={userForm.permissions}
                      onChange={(permissions) => setUserForm({ ...userForm, permissions })}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <button type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    Create User
                  </button>
                </div>
              </form>
            </div>

            {/* Users list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">All Users ({users.length})</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Username</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Permissions</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Department</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="px-6 py-4 font-medium text-slate-800 text-sm">{u.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'superadmin' && <ShieldCheck className="w-3 h-3" strokeWidth={2} />}
                          {u.role === 'superadmin' ? 'Super Admin' : 'Staff'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {u.role === 'superadmin' ? 'All' : (u.permissions?.map((p) => PERMISSION_LABELS[p] || p).join(', ') || '—')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {u.department?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button onClick={() => { setEditUser(u); setEditForm({ name: u.name, username: u.username, email: u.email || '', role: u.role, department: u.department?._id || '', isActive: u.isActive, permissions: u.permissions || [] }); }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} /> Edit
                        </button>
                        <button onClick={() => toggleUserActive(u)}
                          className={`text-sm font-medium ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: Change Passwords ────────────────────────────────────── */}
        {activeTab === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
            <h2 className="font-semibold text-slate-900 mb-4">Change a User's Password</h2>
            {pwError   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{pwError}</div>}
            {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">{pwSuccess}</div>}
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select User</label>
                <select value={pwTarget} onChange={(e) => setPwTarget(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm bg-white" required>
                  <option value="">— Select a user —</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm"
                  placeholder="Min 6 characters" required />
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                Change Password
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Edit User Modal ─────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-slate-400" strokeWidth={1.5} /> Edit User — {editUser.name}
              </h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                <input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email <span className="text-slate-400">(optional, contact only)</span></label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm bg-white">
                  <option value="staff">Staff</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                <select value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm bg-white">
                  <option value="">— None —</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {editForm.role === 'staff' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Permissions — which sections this user can see
                  </label>
                  <PermissionCheckboxes
                    allPermissions={allPermissions}
                    value={editForm.permissions || []}
                    onChange={(permissions) => setEditForm({ ...editForm, permissions })}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditUser(null)}
                  className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={saveEditUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
