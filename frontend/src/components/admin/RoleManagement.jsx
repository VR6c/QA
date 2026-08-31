import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  X,
  Lock,
  Check,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import CustomSelect from '../ui/CustomSelect';

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form State
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
    permissions: []
  });

  // Default Available System Permissions grouped by module
  const ALL_SYSTEM_PERMISSIONS = [
    { code: 'user.view', name: 'View Users', module: 'User Management', action: 'view' },
    { code: 'user.create', name: 'Create Users', module: 'User Management', action: 'create' },
    { code: 'user.edit', name: 'Edit Users', module: 'User Management', action: 'edit' },
    { code: 'user.delete', name: 'Delete Users', module: 'User Management', action: 'delete' },
    { code: 'user.status', name: 'Toggle User Status', module: 'User Management', action: 'status' },
    { code: 'user.reset_password', name: 'Reset User Passwords', module: 'User Management', action: 'reset_password' },

    { code: 'role.view', name: 'View Roles', module: 'Role Management', action: 'view' },
    { code: 'role.create', name: 'Create Roles', module: 'Role Management', action: 'create' },
    { code: 'role.edit', name: 'Edit Roles', module: 'Role Management', action: 'edit' },
    { code: 'role.delete', name: 'Delete Roles', module: 'Role Management', action: 'delete' },
    { code: 'role.permission', name: 'Manage RBAC Matrix', module: 'Role Management', action: 'permission' },

    { code: 'setting.view', name: 'View System Settings', module: 'System Settings', action: 'view' },
    { code: 'setting.edit', name: 'Edit Setting Values', module: 'System Settings', action: 'edit' },
    { code: 'setting.toggle', name: 'Toggle Feature Settings', module: 'System Settings', action: 'toggle' },

    { code: 'activity.view', name: 'View Activity Audit Logs', module: 'Activity Log', action: 'view' }
  ];

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load roles');
      const data = await res.json();
      setRoles(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load system roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(roleForm)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to create role';
        throw new Error(errorMsg);
      }

      const createdRole = data.data || data.role || {};
      toast.success(`Role '${createdRole.name || roleForm.name}' created successfully`);
      setShowCreateModal(false);
      resetRoleForm();
      fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/roles/${selectedRole.id || selectedRole._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(roleForm)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to update role';
        throw new Error(errorMsg);
      }

      const updatedRole = data.data || data.role || {};
      toast.success(`Role '${updatedRole.name || roleForm.name}' updated successfully`);
      setShowEditModal(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRoleStatusToggle = async (role, newStatus) => {
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/roles/${role.id || role._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to patch role status';
        throw new Error(errorMsg);
      }

      toast.success(`Role '${role.name}' is now ${newStatus}`);
      fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteRole = async () => {
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/roles/${selectedRole.id || selectedRole._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to delete role';
        throw new Error(errorMsg);
      }

      toast.success(`Role '${selectedRole.name}' deleted`);
      setShowDeleteModal(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    resetRoleForm();
    setShowCreateModal(true);
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description || '',
      status: role.status,
      permissions: role.permissions || []
    });
    setShowEditModal(true);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      code: '',
      description: '',
      status: 'Active',
      permissions: []
    });
  };

  const togglePermissionCode = (permCode) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(permCode);
      const updated = exists
        ? prev.permissions.filter(p => p !== permCode)
        : [...prev.permissions, permCode];
      return { ...prev, permissions: updated };
    });
  };

  const selectAllPermissions = () => {
    const allCodes = ALL_SYSTEM_PERMISSIONS.map(p => p.code);
    setRoleForm(prev => ({ ...prev, permissions: allCodes }));
  };

  const clearAllPermissions = () => {
    setRoleForm(prev => ({ ...prev, permissions: [] }));
  };

  // Group permissions by module for the matrix UI
  const groupedPermissions = ALL_SYSTEM_PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>Role & Permission Management (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure system access roles, permission matrices, and user privilege scoping.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading system roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No system roles configured.
          </div>
        ) : (
          roles.map((role) => {
            const roleId = role.id || role._id;
            return (
              <div
                key={roleId}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition shadow-xs hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{role.name}</h3>
                        {role.is_system_role && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-50 text-purple-700 border border-purple-200 uppercase font-bold">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">code: {role.code}</p>
                    </div>

                    <button
                      onClick={() => handleRoleStatusToggle(role, role.status === 'Active' ? 'Inactive' : 'Active')}
                      disabled={role.is_system_role && role.name === 'Super Admin'}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                        role.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {role.status}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    {role.description || 'No description set for this role.'}
                  </p>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold">{role.user_count ?? 0} Assigned Users</span>
                    </div>
                    <div className="text-[11px] text-purple-700 font-mono font-bold">
                      {role.permissions?.length || 0} Permissions
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {new Date(role.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(role)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Matrix</span>
                    </button>

                    {!role.is_system_role && (
                      <button
                        onClick={() => { setSelectedRole(role); setShowDeleteModal(true); }}
                        className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE ROLE MODAL */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span>Create New Custom Role & Assign Permissions</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. QA Auditor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Role Status"
                    size="sm"
                    value={roleForm.status}
                    onChange={(val) => setRoleForm({ ...roleForm, status: val })}
                    options={[
                      { value: 'Active', label: 'Active', colorBadge: 'bg-emerald-500' },
                      { value: 'Inactive', label: 'Inactive', colorBadge: 'bg-amber-500' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows="2"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Describe responsibility and access scope for this role..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              {/* PERMISSION MATRIX GRID */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-900 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <span>Permission Matrix Assignment ({roleForm.permissions.length} Selected)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={selectAllPermissions} className="text-xs text-purple-600 font-bold hover:underline cursor-pointer">Select All</button>
                    <span className="text-slate-300">•</span>
                    <button type="button" onClick={clearAllPermissions} className="text-xs text-rose-600 font-bold hover:underline cursor-pointer">Clear</button>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                    <div key={moduleName} className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                      <h4 className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{moduleName}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {perms.map((p) => {
                          const isChecked = roleForm.permissions.includes(p.code);
                          return (
                            <label key={p.code} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition text-[11px] ${
                              isChecked
                                ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermissionCode(p.code)}
                                className="rounded border-slate-300 text-purple-600 focus:ring-0 bg-white"
                              />
                              <span className="font-medium">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {showEditModal && selectedRole && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                <span>Edit Role Matrix ({selectedRole.name})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    disabled={selectedRole.is_system_role && selectedRole.name === 'Super Admin'}
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Status"
                    size="sm"
                    value={roleForm.status}
                    onChange={(val) => setRoleForm({ ...roleForm, status: val })}
                    options={[
                      { value: 'Active', label: 'Active', colorBadge: 'bg-emerald-500' },
                      { value: 'Inactive', label: 'Inactive', colorBadge: 'bg-amber-500' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows="2"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              {/* PERMISSION MATRIX GRID */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-900 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <span>Granted Permissions Matrix ({roleForm.permissions.length} Selected)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={selectAllPermissions} className="text-xs text-purple-600 font-bold hover:underline cursor-pointer">Select All</button>
                    <span className="text-slate-300">•</span>
                    <button type="button" onClick={clearAllPermissions} className="text-xs text-rose-600 font-bold hover:underline cursor-pointer">Clear</button>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                    <div key={moduleName} className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                      <h4 className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{moduleName}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {perms.map((p) => {
                          const isChecked = roleForm.permissions.includes(p.code);
                          return (
                            <label key={p.code} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition text-[11px] ${
                              isChecked
                                ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermissionCode(p.code)}
                                className="rounded border-slate-300 text-purple-600 focus:ring-0 bg-white"
                              />
                              <span className="font-medium">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ROLE CONFIRMATION MODAL */}
      {showDeleteModal && selectedRole && (
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
              <h3 className="text-base font-bold text-slate-900">Delete Role Confirmation</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the role <strong className="text-slate-900">"{selectedRole.name}"</strong>?
            </p>

            {selectedRole.user_count > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>BR-004 Safeguard</strong>: This role is currently assigned to <strong className="underline">{selectedRole.user_count} user(s)</strong>. The backend will block deletion until all users are reassigned to another role.
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
                onClick={handleDeleteRole}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
