import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const TABS = ['Departments', 'Users & Staff', 'Change Passwords'];

export default function SuperAdminPage() {
  const [activeTab,    setActiveTab]    = useState(0);
  const [departments,  setDepartments]  = useState([]);
  const [users,        setUsers]        = useState([]);

  // Department form
  const [deptName,     setDeptName]     = useState('');
  const [deptDesc,     setDeptDesc]     = useState('');
  const [deptError,    setDeptError]    = useState('');
  const [deptSuccess,  setDeptSuccess]  = useState('');

  // User form
  const [userForm,     setUserForm]     = useState({ name:'', email:'', password:'', role:'staff', department:'' });
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

  useEffect(() => { loadDepts(); loadUsers(); }, []);

  const loadDepts = async () => {
    try { const r = await API.get('/departments'); setDepartments(r.data); } catch {}
  };

  const loadUsers = async () => {
    try { const r = await API.get('/auth/users'); setUsers(r.data); } catch {}
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
      setUserForm({ name:'', email:'', password:'', role:'staff', department:'' });
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
          <h1 className="text-2xl font-bold text-gray-800">Super Admin Controls</h1>
          <p className="text-gray-400 text-sm mt-1">Manage departments, staff accounts, and passwords</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-8 w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === i
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-800 mb-4">Create New Department</h2>
              {deptError   && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">{deptError}</div>}
              {deptSuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 text-sm mb-4">{deptSuccess}</div>}
              <form onSubmit={createDept} className="flex gap-3">
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Department name e.g. Cardiology"
                  required
                />
                <input
                  type="text"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Description (optional)"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
                >
                  + Create
                </button>
              </form>
            </div>

            {/* Department list */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">All Departments ({departments.length})</h2>
              </div>
              {departments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No departments yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Description</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {departments.map((d) => (
                      <tr key={d._id}>
                        <td className="px-6 py-4 font-semibold text-gray-800">{d.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{d.description || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteDept(d._id)}
                            className="text-red-400 hover:text-red-600 text-sm"
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-800 mb-4">Create New User / Staff</h2>
              {userError   && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">{userError}</div>}
              {userSuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 text-sm mb-4">{userSuccess}</div>}
              <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <input type="text" value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Full name" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input type="email" value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="email@hospital.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                  <input type="password" value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Min 6 characters" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
                  <select value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm bg-white">
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <select value={userForm.department}
                    onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm bg-white">
                    <option value="">— No department —</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <button type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Create User
                  </button>
                </div>
              </form>
            </div>

            {/* Users list */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">All Users ({users.length})</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Department</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="px-6 py-4 font-semibold text-gray-800 text-sm">{u.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'superadmin' ? '👑 Super Admin' : '👤 Staff'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.department?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, department: u.department?._id || '', isActive: u.isActive }); }}
                          className="text-blue-500 hover:text-blue-700 text-sm font-semibold">
                          Edit
                        </button>
                        <button onClick={() => toggleUserActive(u)}
                          className={`text-sm font-semibold ${u.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md">
            <h2 className="font-bold text-gray-800 mb-4">Change a User's Password</h2>
            {pwError   && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">{pwError}</div>}
            {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 text-sm mb-4">{pwSuccess}</div>}
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select User</label>
                <select value={pwTarget} onChange={(e) => setPwTarget(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm bg-white" required>
                  <option value="">— Select a user —</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Min 6 characters" required />
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors">
                Change Password
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Edit User Modal ─────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Edit User — {editUser.name}</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="staff">Staff</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                <select value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="">— None —</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditUser(null)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveEditUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
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