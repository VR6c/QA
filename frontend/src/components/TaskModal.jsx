import React, { useState, useEffect } from 'react';
import {
  LuX as X,
  LuCheck as Check,
  LuTrash2 as Trash2,
  LuCalendar as Calendar,
  LuTag as Tag,
  LuCircleAlert as AlertCircle,
  LuAward as Award,
  LuUser as User,
  LuPlus as Plus
} from 'react-icons/lu';
import { getAllKpis } from '../lib/kpiConstants';
import { CustomSelect, CustomDatePicker, CustomInput, CustomTextarea, CustomButton, ConfirmPopover } from './ui';
import useAuthStore from '../stores/authStore';
import useKPIStore from '../stores/kpiStore';
import TestingTimerBadge from './TestingTimerBadge';

const statusOptions = [
  { value: 'feedback', label: 'Feedback & Issue', color: 'bg-rose-500 text-white' },
  { value: 'progress', label: 'In Progress', color: 'bg-amber-500 text-white' },
  { value: 'testing', label: 'Testing / QA', color: 'bg-blue-500 text-white' },
  { value: 'success', label: 'QA Success', color: 'bg-purple-500 text-white' },
  { value: 'done', label: 'Done / Deployed', color: 'bg-emerald-500 text-white' },
  { value: 'done_production', label: 'Done Production', color: 'bg-teal-600 text-white' },
  { value: 'backlog', label: 'Backlog / Pending', color: 'bg-slate-500 text-white' }
];

const envSelectOptions = [
  { value: 'Development', label: 'Development' },
  { value: 'Production', label: 'Production' },
  { value: 'TestFlight', label: 'TestFlight' },
  { value: 'UAT', label: 'UAT' }
];

const weeklyFlowOptions = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const yearlyFlowOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const flowFrequencyOptions = [
  { value: 'none', label: 'None' },
  { value: 'monthly', label: 'Monthly (01-28, 01-30, 01-31)' },
  { value: 'weekly', label: 'Weekly (Monday - Saturday)' },
  { value: 'yearly', label: 'Yearly (January - December)' },
];

const monthlyFlowValueOptions = [
  { value: '01-28', label: '01-28 (Feb)' },
  { value: '01-30', label: '01-30 (30-day month)' },
  { value: '01-31', label: '01-31 (31-day month)' },
  ...Array.from({ length: 31 }, (_, i) => {
    const val = String(i + 1).padStart(2, '0');
    return { value: val, label: `Day ${val}` };
  })
];

const weeklyFlowValueOptions = weeklyFlowOptions.map(day => ({ value: day, label: day }));
const yearlyFlowValueOptions = yearlyFlowOptions.map(m => ({ value: m, label: m }));

export default function TaskModal({ isOpen, task, tasks = [], owners = [], onClose, onSave, onDelete, onOpenOwnerManager }) {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';
  const customKpiDefinitions = useKPIStore((state) => state.customKpiDefinitions);

  const kpiCategoryOptions = React.useMemo(() => {
    const kpis = getAllKpis(customKpiDefinitions);
    const opts = [{ value: 'none', label: 'None' }];
    kpis.forEach(k => {
      opts.push({ value: k.id, label: k.title });
    });
    return opts;
  }, [customKpiDefinitions]);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    date: getTodayString(),
    datelineDeveloper: '',
    datelineTesting: '',
    status: 'backlog',
    pushTo: 'Development',
    user: currentUser?.name || 'Unassigned',
    owner: 'Unassigned',
    reason: '',
    timeline: '',
    remark: '',
    flowType: 'none',
    flowValue: '',
    kpiCategory: 'none'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Live client-side duplicate title check
  const isDuplicateTitle = React.useMemo(() => {
    const trimmed = formData.title.trim().toLowerCase();
    if (!trimmed) return false;
    return tasks.some(t => t.id !== task?.id && (t.title || '').trim().toLowerCase() === trimmed);
  }, [formData.title, tasks, task]);

  // Format user select options (Logged By / Reporter)
  const userSelectOptions = React.useMemo(() => {
    const list = [
      { name: currentUser?.name || 'Vireak', role: currentUser?.role || 'QA Lead' },
      { name: 'Vireak', role: 'QA Lead' },
      { name: 'QA Tester', role: 'QA Tester' },
      { name: 'Dev Team', role: 'Developer' },
      { name: 'Product Manager', role: 'Product Owner' }
    ];

    const map = new Map();
    list.forEach(item => {
      if (item.name && !map.has(item.name)) {
        map.set(item.name, item.role);
      }
    });

    return Array.from(map.entries()).map(([name, role]) => ({
      value: name,
      label: role ? `${name} (${role})` : name
    }));
  }, [currentUser]);

  // Format owner select options (Assignee / Task Owner)
  const ownerSelectOptions = React.useMemo(() => {
    const list = owners && owners.length > 0 ? owners : [
      { name: 'Unassigned', role: 'General' },
      { name: 'Vireak', role: 'QA Lead' },
      { name: 'QA Team', role: 'QA Tester' },
      { name: 'Dev Team', role: 'Developer' },
      { name: 'Product Manager', role: 'Product Owner' }
    ];
    return list.map(o => ({
      value: o.name,
      label: o.role ? `${o.name} (${o.role})` : o.name
    }));
  }, [owners]);

  const [isMultipleRemark, setIsMultipleRemark] = useState(false);
  const [remarksList, setRemarksList] = useState([]);
  const [newRemarkText, setNewRemarkText] = useState('');

  useEffect(() => {
    setServerError('');
    setNewRemarkText('');
    const today = getTodayString();
    const currentRemark = task?.remark || '';
    const lines = currentRemark
      .split('\n')
      .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    if (lines.length > 1) {
      setIsMultipleRemark(true);
      setRemarksList(lines);
    } else {
      setIsMultipleRemark(false);
      setRemarksList(lines.length === 1 ? lines : []);
    }

    if (task) {
      setFormData({
        title: task.title || '',
        date: task.date || today,
        datelineDeveloper: task.datelineDeveloper || '',
        datelineTesting: task.datelineTesting || '',
        status: task.status || 'backlog',
        pushTo: task.pushTo || 'Development',
        user: task.user || currentUser?.name || 'Unassigned',
        owner: task.owner || currentUser?.name || 'Unassigned',
        reason: task.reason || '',
        timeline: task.timeline || '',
        remark: task.remark || '',
        flowType: task.flowType || 'none',
        flowValue: task.flowValue || '',
        kpiCategory: task.kpiCategory || 'none'
      });
    } else {
      setFormData({
        title: '',
        date: today,
        datelineDeveloper: '',
        datelineTesting: '',
        status: 'backlog',
        pushTo: 'Development',
        user: currentUser?.name || 'Unassigned',
        owner: currentUser?.name || 'Unassigned',
        reason: '',
        timeline: '',
        remark: '',
        flowType: 'none',
        flowValue: '',
        kpiCategory: 'none'
      });
    }
  }, [task, isOpen, currentUser?.name]);

  const handleToggleRemarkMode = (multiple) => {
    setIsMultipleRemark(multiple);
    if (multiple) {
      let list = remarksList;
      if (list.length === 0 && formData.remark.trim()) {
        list = formData.remark
          .split('\n')
          .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
          .filter(Boolean);
        if (list.length === 0) list = [formData.remark.trim()];
        setRemarksList(list);
      }
      const formatted = list.map(r => `• ${r}`).join('\n');
      setFormData(prev => ({ ...prev, remark: formatted }));
    } else {
      const combined = remarksList.join(' • ') || formData.remark.replace(/^[•\-\*]\s*/g, '').split('\n').join(' • ');
      setFormData(prev => ({ ...prev, remark: combined }));
    }
  };

  const handleAddRemarkItem = (e) => {
    if (e) e.preventDefault();
    const trimmed = newRemarkText.trim();
    if (!trimmed) return;
    const updated = [...remarksList, trimmed];
    setRemarksList(updated);
    setNewRemarkText('');
    const formatted = updated.map(r => `• ${r}`).join('\n');
    setFormData(prev => ({ ...prev, remark: formatted }));
  };

  const handleRemoveRemarkItem = (index) => {
    const updated = remarksList.filter((_, i) => i !== index);
    setRemarksList(updated);
    const formatted = updated.length > 0 ? updated.map(r => `• ${r}`).join('\n') : '';
    setFormData(prev => ({ ...prev, remark: formatted }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || isDuplicateTitle) return;

    setServerError('');
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (e) {
      console.error(e);
      setServerError(e.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatusObj = statusOptions.find(s => s.value === formData.status) || statusOptions[5];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-xl w-full max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {task ? 'Edit Task Record' : 'Create New QA Task'}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${currentStatusObj.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                {currentStatusObj.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {formData.pushTo}
              </span>
              {formData.owner && formData.owner !== 'Unassigned' && (
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {formData.owner}
                </span>
              )}
            </div>
            {task && (
              <div className="mt-2">
                <TestingTimerBadge task={task} variant="card" />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* Title */}
          <div>
            <CustomInput
              label="Task Title"
              required
              maxLength={500}
              value={formData.title}
              onChange={(e) => {
                setServerError('');
                setFormData({ ...formData, title: e.target.value });
              }}
              onClear={() => setFormData({ ...formData, title: '' })}
              placeholder="e.g. Fix payment gateway auth flow"
              error={isDuplicateTitle ? 'A task with this title already exists. Duplicate titles not allowed.' : serverError}
              size="md"
            />
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Task Date
              </label>
              <CustomDatePicker
                mode="single"
                value={formData.date}
                onChange={(val) => setFormData({ ...formData, date: val })}
                size="sm"
                variant="solid"
                placeholder="Pick task date"
              />
            </div>

            <div>
              <CustomSelect
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                size="sm"
                variant="solid"
              />
            </div>
          </div>

          {/* DateLine From Developer & DateLine Testing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>DateLine From Developer</span>
              </label>
              <CustomDatePicker
                mode="single"
                enableTime={true}
                value={formData.datelineDeveloper}
                onChange={(val) => setFormData({ ...formData, datelineDeveloper: val })}
                size="sm"
                variant="solid"
                placeholder="Pick dev dateline date & time"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>DateLine Testing</span>
              </label>
              <CustomDatePicker
                mode="single"
                enableTime={true}
                value={formData.datelineTesting}
                onChange={(val) => setFormData({ ...formData, datelineTesting: val })}
                size="sm"
                variant="solid"
                placeholder="Pick testing dateline date & time"
              />
            </div>
          </div>

          {/* Owner (Name Tag) & Push To Environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Task Owner
                </label>
                {isSuperAdmin && onOpenOwnerManager && (
                  <button
                    type="button"
                    onClick={onOpenOwnerManager}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Manage
                  </button>
                )}
              </div>
              <CustomSelect
                options={ownerSelectOptions}
                value={formData.owner || 'Unassigned'}
                onChange={(val) => setFormData({ ...formData, owner: val })}
                size="sm"
                variant="solid"
                icon={User}
              />
            </div>

            <div>
              <CustomSelect
                label="Push To Environment"
                options={envSelectOptions}
                value={formData.pushTo}
                onChange={(val) => setFormData({ ...formData, pushTo: val })}
                size="sm"
                variant="solid"
              />
            </div>
          </div>

          {/* KPI Category (2026 Goals) Selection */}
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
            <CustomSelect
              label="KPI Category (2026 Goals)"
              options={kpiCategoryOptions}
              value={formData.kpiCategory || 'none'}
              onChange={(val) => setFormData({ ...formData, kpiCategory: val })}
              size="sm"
              variant="subtle"
              icon={Award}
            />
            <p className="text-[10px] text-purple-600 font-medium">
              Categorizing this task directly tracks your progress against 2026 Goal targets.
            </p>
          </div>

          {/* Reason / Notes */}
          <div>
            <CustomTextarea
              label="Reason / Notes Snippet"
              rows={3}
              maxLength={2000}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe cause, context, or reproduction steps..."
            />
          </div>

          {/* Timeline & Remark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CustomInput
                label="Timeline / Sprint Target"
                maxLength={200}
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="e.g. Sprint 34 (Aug 15)"
                size="sm"
              />
            </div>

            <div className={isMultipleRemark ? "md:col-span-2" : ""}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Remark / Highlight
                </label>
                {/* Toggle Switch Single / Multiple */}
                <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleToggleRemarkMode(false)}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      !isMultipleRemark
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleRemarkMode(true)}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      isMultipleRemark
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Multiple
                  </button>
                </div>
              </div>

              {isMultipleRemark ? (
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2.5">
                  {/* Current items list */}
                  {remarksList.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {remarksList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="text-slate-800 font-medium truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRemarkItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                            title="Remove remark item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic text-center py-1">
                      No remarks added yet. Add items below.
                    </p>
                  )}

                  {/* Input row to add new item */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRemarkText}
                      onChange={(e) => setNewRemarkText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRemarkItem();
                        }
                      }}
                      placeholder="Type a remark item and press Enter..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddRemarkItem}
                      disabled={!newRemarkText.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <CustomInput
                  placeholder="e.g. High priority blocker"
                  maxLength={500}
                  value={formData.remark}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, remark: val });
                    setRemarksList(val.trim() ? [val.trim()] : []);
                  }}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 mt-2">
            <div>
              {task && (
                <ConfirmPopover
                  title="Delete this task?"
                  subtitle={`${task.owner || 'Unassigned'} · ${task.title}`}
                  confirmText="Delete"
                  onConfirm={() => onDelete(task.id)}
                >
                  <CustomButton
                    variant="danger"
                    size="sm"
                    iconLeft={Trash2}
                  >
                    Delete Task
                  </CustomButton>
                </ConfirmPopover>
              )}
            </div>

            <div className="flex items-center gap-2">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={!formData.title.trim() || isDuplicateTitle}
                iconLeft={Check}
              >
                {task ? 'Update Record' : 'Save Task'}
              </CustomButton>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
