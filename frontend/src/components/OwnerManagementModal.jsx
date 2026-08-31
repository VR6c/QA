import React, { useState } from 'react';
import { 
  LuX as X, 
  LuPlus as Plus, 
  LuSquarePen as Edit2, 
  LuTrash2 as Trash2, 
  LuCheck as Check, 
  LuUserCheck as UserCheck,
  LuShieldAlert as ShieldAlert,
  LuLock as Lock
} from 'react-icons/lu';
import { CustomInput, CustomButton, ConfirmPopover } from './ui';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';

const colorOptions = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-500', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'slate', label: 'Slate', bg: 'bg-slate-500', badge: 'bg-slate-100 text-slate-800 border-slate-200' }
];

export function getOwnerColorStyle(colorName) {
  const matched = colorOptions.find(c => c.value === colorName);
  return matched ? matched.badge : 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getOwnerDotColor(colorName) {
  const matched = colorOptions.find(c => c.value === colorName);
  return matched ? matched.bg : 'bg-slate-400';
}

export default function OwnerManagementModal({ isOpen, onClose, owners = [], onCreateOwner, onUpdateOwner, onDeleteOwner }) {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';

  const [editingOwner, setEditingOwner] = useState(null); // null means creating new
  const [formData, setFormData] = useState({ name: '', role: 'Team Member', color: 'blue' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingOwner(null);
    setFormData({ name: '', role: 'Team Member', color: 'blue' });
    setErrorMsg('');
  };

  const handleStartEdit = (owner) => {
    if (!isSuperAdmin) return;
    setEditingOwner(owner);
    setFormData({ name: owner.name, role: owner.role || 'Team Member', color: owner.color || 'blue' });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMsg('Only Super Admin can create or edit QA Task Owners.');
      return;
    }
    if (!formData.name.trim()) return;

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const ownerId = editingOwner?.id || editingOwner?._id;
      if (editingOwner) {
        if (!ownerId) {
          setErrorMsg('Unable to identify target owner ID for update.');
          return;
        }
        await onUpdateOwner({ id: ownerId, data: formData });
      } else {
        await onCreateOwner(formData);
      }
      handleStartCreate();
    } catch (err) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (owner) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete QA Task Owners.');
      return;
    }
    if (owner.name === 'Unassigned') return;
    const targetId = owner?.id || owner?._id;
    if (!targetId) {
      toast.error('Unable to delete owner: missing ID.');
      return;
    }
    try {
      await onDeleteOwner(targetId);
      if ((editingOwner?.id || editingOwner?._id) === targetId) {
        handleStartCreate();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete owner');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Manage QA Task Owners
                {!isSuperAdmin && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Read-Only
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {isSuperAdmin ? 'Create, edit, or remove owner options for QA assignments' : 'View available task owner options for QA assignments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Non-Super Admin Banner or Create/Edit Form Box */}
          {!isSuperAdmin ? (
            <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-3 text-amber-900 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">Creation & Editing Restricted</span>
                  <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                    Super Admin Only
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Only <strong>Super Admin</strong> can create, edit, or delete QA Task Owners. Other user roles can view and select from existing owners.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  {editingOwner ? <Edit2 className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-blue-600" />}
                  {editingOwner ? `Edit Owner: ${editingOwner.name}` : 'Add New Owner'}
                </span>
                {editingOwner && (
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Switch to Add New
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <CustomInput
                    label="Owner Name"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe, QA Lead"
                    size="sm"
                  />
                </div>

                <div>
                  <CustomInput
                    label="Role / Title"
                    maxLength={100}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. QA Tester, Developer"
                    size="sm"
                  />
                </div>
              </div>

              {/* Color Badge Picker */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Badge Color Theme
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                        formData.color === c.value
                          ? `${c.badge} ring-2 ring-blue-500 shadow-2xs`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save / Cancel controls */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <CustomButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={!formData.name.trim()}
                  iconLeft={Check}
                >
                  {editingOwner ? 'Update Owner' : 'Create Owner'}
                </CustomButton>
              </div>
            </form>
          )}

          {/* List of Existing Owners */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Existing Owners ({owners.length})</span>
              {!isSuperAdmin && (
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  Available for assignment & filtering
                </span>
              )}
            </h3>
            
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {owners.map((owner) => {
                const colorStyle = getOwnerColorStyle(owner.color);
                const dotColor = getOwnerDotColor(owner.color);
                const isUnassigned = owner.name === 'Unassigned';

                return (
                  <div key={owner.id || owner._id || owner.name} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {owner.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${colorStyle}`}>
                            {owner.role || 'Team Member'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(owner)}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                          title="Edit Owner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isUnassigned && (
                          <ConfirmPopover
                            title="Delete this owner?"
                            subtitle={`${owner.name} · Any assigned tasks will be set to Unassigned`}
                            confirmText="Delete"
                            onConfirm={() => handleDelete(owner)}
                          >
                            <button
                              type="button"
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                              title="Delete Owner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </ConfirmPopover>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

