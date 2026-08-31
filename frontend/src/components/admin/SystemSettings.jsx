import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldAlert,
  Bell,
  UserCheck,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
  X,
  Lock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  // Confirmation Modal for High Impact Settings (FR-SETTING-030 ~ 032)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);

  // Custom Edit Setting Value Modal (Replaces browser prompt)
  const [showEditValueModal, setShowEditValueModal] = useState(false);
  const [editSettingTarget, setEditSettingTarget] = useState(null);
  const [editSettingInputValue, setEditSettingInputValue] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load system settings');
      const data = await res.json();
      setCategories(data.data?.categories || data.categories || {});
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleClick = (setting, newStatus) => {
    // High-impact confirmation required
    setPendingChange({
      setting,
      type: 'status',
      currentValue: setting.status,
      newValue: newStatus
    });
    setShowConfirmModal(true);
  };

  const handleValueChangeClick = (setting, newValue) => {
    setPendingChange({
      setting,
      type: 'value',
      currentValue: setting.value,
      newValue
    });
    setShowConfirmModal(true);
  };

  const executePendingChange = async () => {
    if (!pendingChange) return;
    const { setting, type, newValue } = pendingChange;

    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const payload = type === 'status' ? { status: newValue } : { value: newValue };

      const res = await fetch(`/api/admin/settings/${setting.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to update setting';
        throw new Error(errorMsg);
      }

      toast.success(`Setting '${setting.name}' updated`);
      setShowConfirmModal(false);
      setPendingChange(null);
      fetchSettings();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'General': return Globe;
      case 'User': return UserCheck;
      case 'Security': return Lock;
      case 'Notification': return Bell;
      case 'Feature': return Zap;
      default: return Sliders;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>Centralized System Settings & Feature Toggles</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure global defaults, security thresholds, module toggles, and user privileges (`BR-011`, `BR-012`).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Reload Settings</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          Loading system setting categories...
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categories).map(([categoryName, settingsList]) => {
            const CategoryIcon = getCategoryIcon(categoryName);
            return (
              <div key={categoryName} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{categoryName} Settings</h3>
                    <p className="text-[11px] text-slate-400">{settingsList.length} Configuration Items</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settingsList.map((st) => (
                    <div
                      key={st.key}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h4 className="font-bold text-slate-900 text-xs">{st.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{st.key}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                          {st.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <div className="text-xs">
                          {st.value_type === 'boolean' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">Status:</span>
                              <span className={`font-mono text-xs font-bold ${st.status === 'Enabled' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {st.status}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">Value:</span>
                              <span className="font-mono text-xs font-bold text-blue-700">
                                {String(st.value)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Control Actions */}
                        <div>
                          {st.value_type === 'boolean' ? (
                            <button
                              onClick={() => handleToggleClick(st, st.status === 'Enabled' ? 'Disabled' : 'Enabled')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                st.status === 'Enabled' ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                  st.status === 'Enabled' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditSettingTarget(st);
                                setEditSettingInputValue(String(st.value));
                                setShowEditValueModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition cursor-pointer"
                            >
                              Edit Value
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HIGH IMPACT SETTING CONFIRMATION MODAL (FR-SETTING-030 ~ 032) */}
      {showConfirmModal && pendingChange && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { setShowConfirmModal(false); setPendingChange(null); }}
        >
          <div 
            className="bg-white border border-emerald-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-emerald-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirm Setting Configuration Change</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are modifying the system configuration <strong className="text-slate-900">"{pendingChange.setting.name}"</strong> (`FR-SETTING-030`).
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-500">
                <span>Setting Key:</span>
                <span className="text-slate-900 font-bold">{pendingChange.setting.key}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-rose-600 font-bold">
                <span>Current Value:</span>
                <span>{String(pendingChange.currentValue)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-emerald-600 font-bold">
                <span>New Target Value:</span>
                <span>{String(pendingChange.newValue)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * This operation will record an immutable entry in the Activity Audit Log with Before & After diff snapshots (`FR-SETTING-032`).
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3 text-xs">
              <button
                onClick={() => { setShowConfirmModal(false); setPendingChange(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={executePendingChange}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM EDIT SETTING VALUE MODAL */}
      {showEditValueModal && editSettingTarget && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { setShowEditValueModal(false); setEditSettingTarget(null); }}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>Edit Setting Value ({editSettingTarget.name})</span>
              </h3>
              <button
                onClick={() => { setShowEditValueModal(false); setEditSettingTarget(null); }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowEditValueModal(false);
                const finalValue = editSettingTarget.value_type === 'number' ? Number(editSettingInputValue) : editSettingInputValue;
                handleValueChangeClick(editSettingTarget, finalValue);
              }}
              className="space-y-4 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-mono text-slate-500">Setting Key: <span className="text-slate-900 font-bold">{editSettingTarget.key}</span></p>
                <p className="text-slate-600 text-xs">{editSettingTarget.description || 'Global system configuration parameter.'}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Configure Value ({editSettingTarget.value_type}) *
                </label>
                <input
                  type={editSettingTarget.value_type === 'number' ? 'number' : 'text'}
                  required
                  value={editSettingInputValue}
                  onChange={(e) => setEditSettingInputValue(e.target.value)}
                  placeholder={`Enter new ${editSettingTarget.name} value...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditValueModal(false); setEditSettingTarget(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Review & Apply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
