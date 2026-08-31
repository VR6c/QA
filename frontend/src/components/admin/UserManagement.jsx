import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Key,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect, CustomPagination, PageTransition } from '../ui';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [pageDirection, setPageDirection] = useState('next');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Active target user
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailData, setUserDetailData] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Employee',
    role_id: '',
    status: 'Active'
  });

  const [tempResetPassword, setTempResetPassword] = useState('');

  // Fetch Roles
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const query = new URLSearchParams({
        page,
        limit,
        search,
        role: roleFilter,
        status: statusFilter
      });

      const res = await fetch(`/api/admin/users?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch user list');
      const resData = await res.json();
      const userList = resData.data || resData;
      const metaObj = resData.meta || resData.pagination || {};
      setUsers(Array.isArray(userList) ? userList : []);
      setTotalUsers(metaObj.total || (Array.isArray(userList) ? userList.length : 0));
      setTotalPages(metaObj.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, roleFilter, statusFilter]);

  // Create User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to create user';
        throw new Error(errorMsg);
      }

      const createdUser = data.data || data.user || {};
      toast.success(`User '${createdUser.name || formData.name}' created successfully`);
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Edit User Handler
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id || selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to update user';
        throw new Error(errorMsg);
      }

      const updatedUser = data.data || data.user || {};
      toast.success(`User '${updatedUser.name || formData.name}' updated successfully`);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Patch Status Handler (Activate/Deactivate/Lock)
  const handleStatusPatch = async (user, newStatus) => {
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${user.id || user._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to update status';
        throw new Error(errorMsg);
      }

      toast.success(`User ${user.name} is now ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delete User Handler (Soft Delete with Last Super Admin protection)
  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id || selectedUser._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to delete user';
        throw new Error(errorMsg);
      }

      toast.success(`User '${selectedUser.name}' soft-deleted`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id || selectedUser._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: formData.password })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to reset password';
        throw new Error(errorMsg);
      }

      const resData = data.data || data;
      setTempResetPassword(resData.temporary_password || data.temporary_password);
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // View User Detail Fetcher
  const openViewModal = async (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    setUserDetailData(null);
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${user.id || user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserDetailData(data.data || data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      role_id: user.role_id?.id || user.role_id?._id || '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'Employee',
      role_id: '',
      status: 'Active'
    });
    setTempResetPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>User Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage enterprise user accounts, roles, statuses, and authentication guardrails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, username, email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-40">
            <CustomSelect
              size="sm"
              placeholder="All Roles"
              value={roleFilter}
              onChange={(val) => { setRoleFilter(val); setPage(1); }}
              options={[
                { value: '', label: 'All Roles' },
                ...roles.map(r => ({ value: r.name, label: r.name }))
              ]}
            />
          </div>

          <div className="w-40">
            <CustomSelect
              size="sm"
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Active', label: 'Active', colorBadge: 'bg-emerald-500' },
                { value: 'Inactive', label: 'Inactive', colorBadge: 'bg-amber-500' },
                { value: 'Locked', label: 'Locked', colorBadge: 'bg-rose-500' }
              ]}
            />
          </div>

          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setPage(1); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold px-2 py-1 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <PageTransition
              as="tbody"
              page={page}
              direction={pageDirection}
              className="divide-y divide-slate-100"
            >
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 animate-pulse">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const uId = u.id || u._id;
                  return (
                    <tr key={uId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">@{u.username} • {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          u.role === 'Super Admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'Admin'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'Locked'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openViewModal(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="View Details & Permissions"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); resetForm(); setShowResetPasswordModal(true); }}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                          title="Soft Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </PageTransition>
          </table>
        </div>

        {/* Pagination Control */}
        <div className="p-3 border-t border-slate-100">
          <CustomPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            itemsPerPage={limit}
            onPageChange={(p, dir) => {
              setPageDirection(dir || 'next');
              setPage(p);
            }}
            onItemsPerPageChange={(l) => {
              setLimit(l);
              setPageDirection('jump');
              setPage(1);
            }}
            pageSizeOptions={[8, 16, 32, 64]}
          />
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Create New User Account</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@enterprise.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  min={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Assign Role *"
                    size="sm"
                    value={formData.role}
                    onChange={(val) => {
                      const selectedR = roles.find(r => r.name === val);
                      setFormData({
                        ...formData,
                        role: val,
                        role_id: selectedR ? selectedR.id || selectedR._id : ''
                      });
                    }}
                    options={roles.map(r => ({ value: r.name, label: r.name }))}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Account Status"
                    size="sm"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'Active', label: 'Active', colorBadge: 'bg-emerald-500' },
                      { value: 'Inactive', label: 'Inactive', colorBadge: 'bg-amber-500' },
                      { value: 'Locked', label: 'Locked', colorBadge: 'bg-rose-500' }
                    ]}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit User Account ({selectedUser.name})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Role"
                    size="sm"
                    value={formData.role}
                    onChange={(val) => {
                      const selectedR = roles.find(r => r.name === val);
                      setFormData({
                        ...formData,
                        role: val,
                        role_id: selectedR ? selectedR.id || selectedR._id : ''
                      });
                    }}
                    options={roles.map(r => ({ value: r.name, label: r.name }))}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Status"
                    size="sm"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'Active', label: 'Active', colorBadge: 'bg-emerald-500' },
                      { value: 'Inactive', label: 'Inactive', colorBadge: 'bg-amber-500' },
                      { value: 'Locked', label: 'Locked', colorBadge: 'bg-rose-500' }
                    ]}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAIL MODAL */}
      {showViewModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowViewModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>User Profile & Inherited Permissions</span>
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!userDetailData ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading profile details...</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* User Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
                    {userDetailData.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{userDetailData.user.name}</h4>
                    <p className="text-slate-500 font-mono text-[11px]">@{userDetailData.user.username} • {userDetailData.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Role: {userDetailData.user.role}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Status: {userDetailData.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inherited Permissions Box */}
                <div>
                  <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Inherited Role Permissions ({userDetailData.inherited_permissions.length})</span>
                  </h5>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5">
                    {userDetailData.inherited_permissions.length === 0 ? (
                      <span className="text-slate-400 italic">No granted permissions</span>
                    ) : (
                      userDetailData.inherited_permissions.map((perm, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-blue-700 border border-slate-200 font-semibold shadow-2xs">
                          {perm}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activity History */}
                <div>
                  <h5 className="font-bold text-slate-900 mb-2">Recent User Activity</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userDetailData.activity_history.length === 0 ? (
                      <p className="text-slate-400 text-[11px]">No activity history logged for this user.</p>
                    ) : (
                      userDetailData.activity_history.map(act => (
                        <div key={act._id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                          <div>
                            <p className="font-bold text-slate-800">{act.description}</p>
                            <p className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleString()}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white text-blue-700 border border-slate-200 font-bold">{act.action}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (SOFT DELETE & LAST SUPER ADMIN GUARDRAIL) */}
      {showDeleteModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="bg-white border border-rose-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Soft Delete Confirmation</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to soft-delete the user account <strong className="text-slate-900">"{selectedUser.name}"</strong>? This will mark the record as inactive and prevent authentication (`BR-002`, `BR-041`).
            </p>

            {selectedUser.role === 'Super Admin' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Super Admin Safeguard Rule</strong>: The backend will automatically block deletion if this is the last active Super Admin account.
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetPasswordModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowResetPasswordModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Initiate password reset for user <strong className="text-slate-900">@{selectedUser.username}</strong> ({selectedUser.email}).
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Set Custom Password (Optional)</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty to auto-generate random password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {tempResetPassword && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <p className="font-bold mb-1">New Password Generated:</p>
                  <p className="font-mono text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-emerald-300 text-slate-900 selection:bg-emerald-200 shadow-2xs">
                    {tempResetPassword}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  Generate & Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
