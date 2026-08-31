import React, { useState, useEffect, useMemo } from 'react';
import {
  LuX as X,
  LuUserCheck as UserCheck,
  LuSlidersHorizontal as Sliders,
  LuPlus as Plus,
  LuRotateCcw as RotateCcw,
  LuCheck as Check,
  LuTrash2 as Trash2,
  LuSquarePen as Edit2,
  LuSparkles as Sparkles,
  LuTarget as Target,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuUser as User,
  LuShieldAlert as ShieldAlert,
  LuZap as Zap,
  LuAward as Award
} from 'react-icons/lu';
import useKPIStore from '../stores/kpiStore';
import useAuthStore from '../stores/authStore';
import { IMP_KPIS, getAllKpis, isUserOwnerMatch } from '../lib/kpiConstants';
import { CustomInput, CustomButton, CustomSelect, ConfirmPopover } from './ui';

export default function CustomKpiModal({ isOpen, onClose, owners = [], tasks = [] }) {
  const {
    personTargets,
    customKpiDefinitions,
    disabledKpiIds,
    setPersonTarget,
    deletePersonKpiTarget,
    resetPersonTargets,
    addCustomKpiDefinition,
    importStandardKpis,
    updateCustomKpiDefinition,
    deleteCustomKpiDefinition,
    toggleDisableKpi
  } = useKPIStore();

  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';

  const [activeTab, setActiveTab] = useState('person_targets'); // 'person_targets' | 'manage_kpis'

  // Person target customization state
  const ownerList = useMemo(() => {
    if (owners.length > 0) return owners.map(o => o.name);
    return ['QA Lead', 'Team Member 1', 'Team Member 2'];
  }, [owners]);

  const [selectedPerson, setSelectedPerson] = useState('');

  // Set initial selected person prioritizing current logged in user profile
  useEffect(() => {
    if (isOpen) {
      if (currentUser?.name && ownerList.some(name => isUserOwnerMatch(name, currentUser.name))) {
        const match = ownerList.find(name => isUserOwnerMatch(name, currentUser.name));
        setSelectedPerson(match || currentUser.name);
      } else if (!selectedPerson && ownerList.length > 0) {
        setSelectedPerson(ownerList[0]);
      }
    }
  }, [isOpen, ownerList, currentUser?.name]);

  const modalPersonOptions = useMemo(() => {
    return ownerList.map((name) => {
      const isCustomized = !!personTargets[name.trim()];
      const isSelf = currentUser?.name && isUserOwnerMatch(name, currentUser.name);
      return {
        value: name,
        label: `${name} ${isSelf ? '(You)' : ''} ${isCustomized ? '• (Custom Targets)' : '• (Standard 2026)'}`
      };
    });
  }, [ownerList, personTargets, currentUser?.name]);

  // Draft targets for the selected person: { [kpiId]: { goodTarget, excellenceTarget } }
  const [draftTargets, setDraftTargets] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Custom KPI definition CRUD state
  const [editingKpiId, setEditingKpiId] = useState(null);
  const [newKpi, setNewKpi] = useState({
    title: '',
    shortName: '',
    badgeText: '',
    period: 'monthly',
    goodTarget: 2,
    excellenceTarget: 4,
    unit: 'tasks',
    description: '',
    color: 'indigo'
  });

  const userTaskCount = useMemo(() => {
    if (!selectedPerson) return 0;
    return tasks.filter(t => isUserOwnerMatch(t.owner, selectedPerson)).length;
  }, [tasks, selectedPerson]);


  const allKpis = getAllKpis(customKpiDefinitions);

  // Sync draft targets whenever selectedPerson or modal opens
  useEffect(() => {
    if (selectedPerson) {
      const currentPersonCustomObj = personTargets[selectedPerson.trim()] || {};
      const initialMap = {};
      allKpis.forEach((kpi) => {
        const customObj = currentPersonCustomObj[kpi.id];
        initialMap[kpi.id] = {
          goodTarget: customObj?.goodTarget !== undefined ? customObj.goodTarget : '',
          excellenceTarget: customObj?.excellenceTarget !== undefined ? customObj.excellenceTarget : ''
        };
      });
      setDraftTargets(initialMap);
    }
  }, [selectedPerson, personTargets, customKpiDefinitions, isOpen]);

  if (!isOpen) return null;

  const handleTargetChange = (kpiId, field, value) => {
    const val = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setDraftTargets((prev) => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [field]: val
      }
    }));
  };

  // CREATE / UPDATE Person Targets
  const handleSavePersonTargets = () => {
    if (!selectedPerson) return;
    Object.entries(draftTargets).forEach(([kpiId, targetObj]) => {
      const good = targetObj.goodTarget;
      const excellence = targetObj.excellenceTarget;
      // Only save if the user has explicitly entered at least one value
      if (good !== '' || excellence !== '') {
        setPersonTarget(selectedPerson, kpiId, good !== '' ? good : undefined, excellence !== '' ? excellence : undefined);
      }
      // If both empty, do not persist anything (leaves user with no override)
    });
    setSuccessMsg(`Successfully saved custom KPI targets for ${selectedPerson}!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // DELETE Single Person KPI Override
  const handleRemoveSingleOverride = (kpiId, kpiTitle) => {
    if (!selectedPerson) return;
    deletePersonKpiTarget(selectedPerson, kpiId);
    setSuccessMsg(`Reset "${kpiTitle}" targets to default for ${selectedPerson}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // RESET ALL Person Targets
  const handleResetPersonTargets = () => {
    if (!selectedPerson) return;
    resetPersonTargets(selectedPerson);
    setSuccessMsg(`Reset all targets for ${selectedPerson} to defaults.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // CREATE or UPDATE Custom KPI Definition
  const handleSaveKpiDefinition = (e) => {
    e.preventDefault();
    if (!newKpi.title.trim()) return;

    let bgLight = 'bg-indigo-50';
    let borderLight = 'border-indigo-200';
    let textColor = 'text-indigo-700';
    let barColor = 'bg-indigo-600';
    let badgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';

    if (newKpi.color === 'emerald') {
      bgLight = 'bg-emerald-50'; borderLight = 'border-emerald-200'; textColor = 'text-emerald-700'; barColor = 'bg-emerald-600'; badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (newKpi.color === 'amber') {
      bgLight = 'bg-amber-50'; borderLight = 'border-amber-200'; textColor = 'text-amber-700'; barColor = 'bg-amber-600'; badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (newKpi.color === 'rose') {
      bgLight = 'bg-rose-50'; borderLight = 'border-rose-200'; textColor = 'text-rose-700'; barColor = 'bg-rose-600'; badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
    } else if (newKpi.color === 'purple') {
      bgLight = 'bg-purple-50'; borderLight = 'border-purple-200'; textColor = 'text-purple-700'; barColor = 'bg-purple-600'; badgeBg = 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (newKpi.color === 'blue') {
      bgLight = 'bg-blue-50'; borderLight = 'border-blue-200'; textColor = 'text-blue-700'; barColor = 'bg-blue-600'; badgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
    }

    if (editingKpiId) {
      updateCustomKpiDefinition(editingKpiId, {
        ...newKpi,
        bgLight,
        borderLight,
        textColor,
        barColor,
        badgeBg
      });
      setSuccessMsg(`Updated KPI Category "${newKpi.title}"!`);
    } else {
      addCustomKpiDefinition({
        ...newKpi,
        bgLight,
        borderLight,
        textColor,
        barColor,
        badgeBg
      });
      setSuccessMsg(`Created new Custom KPI Category "${newKpi.title}"!`);
    }

    handleCancelKpiEdit();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStartKpiEdit = (kpi) => {
    setEditingKpiId(kpi.id);
    setNewKpi({
      title: kpi.title,
      shortName: kpi.shortName || kpi.title,
      badgeText: kpi.badgeText || kpi.shortName || kpi.title,
      period: kpi.period || 'monthly',
      goodTarget: kpi.goodTarget,
      excellenceTarget: kpi.excellenceTarget,
      unit: kpi.unit || 'tasks',
      description: kpi.description || '',
      color: 'indigo'
    });
  };

  const handleCancelKpiEdit = () => {
    setEditingKpiId(null);
    setNewKpi({
      title: '',
      shortName: '',
      badgeText: '',
      period: 'monthly',
      goodTarget: 2,
      excellenceTarget: 4,
      unit: 'tasks',
      description: '',
      color: 'indigo'
    });
  };

  const hasCustomized = selectedPerson && personTargets[selectedPerson.trim()];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl shadow-slate-950/20 max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Sleek Dark Gradient Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between relative overflow-hidden shadow-md">
          {/* Subtle Background Glow Accent */}
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/20 border border-purple-400/30 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black tracking-tight text-white">
                  Custom KPI Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-xs">
                  {isSuperAdmin ? 'Admin Control' : 'User Personal Targets'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {isSuperAdmin
                  ? 'Configure individual user target milestones & manage custom KPI categories'
                  : `Customizing personal performance targets for ${currentUser?.name || 'Dev Team'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar - Segmented Floating Control */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs">

          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl border border-slate-300/60">
            <button
              onClick={() => setActiveTab('person_targets')}
              className={`py-1.5 px-4 rounded-lg transition-all cursor-pointer font-extrabold flex items-center gap-2 ${activeTab === 'person_targets'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>1. Self Set Personal Targets</span>
            </button>

            <button
              onClick={() => setActiveTab('manage_kpis')}
              className={`py-1.5 px-4 rounded-lg transition-all cursor-pointer font-extrabold flex items-center gap-2 ${activeTab === 'manage_kpis'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>2. Self Create KPI Categories</span>
            </button>
          </div>

          {/* User Profile Pill Indicator */}
          {currentUser?.name && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs font-semibold text-slate-700">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-900 font-bold">{currentUser.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold border border-purple-200">
                {currentUser.role || 'Member'}
              </span>
            </div>
          )}

        </div>

        {/* Animated Toast Notification Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2.5 text-xs font-bold text-emerald-800 animate-in slide-in-from-top-2 duration-150">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-slate-50/50">

          {/* TAB 1: PERSON / USER KPI TARGETS */}
          {activeTab === 'person_targets' && (
            <div className="space-y-5">

              {/* Target Person Selector Card */}
              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Target Profile / Personal Owner:</span>
                  </label>
                  <div className="w-72">
                    <CustomSelect
                      options={modalPersonOptions}
                      value={selectedPerson}
                      onChange={(val) => setSelectedPerson(val)}
                      size="sm"
                      variant="outline"
                      className="font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {currentUser?.name && isUserOwnerMatch(selectedPerson, currentUser.name) && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" /> Your Personal Profile
                    </span>
                  )}
                  {hasCustomized ? (
                    <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" /> Self Targets Active
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs">
                      Standard 2026 Defaults
                    </span>
                  )}
                </div>
              </div>

              {/* Targets Breakdown Matrix Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-4 py-3 flex items-center justify-between font-bold">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>KPI Targets Breakdown for "{selectedPerson}"</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300">Configure Good & Excellence Target Values</span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="py-3 px-4">KPI CATEGORY METRIC</th>
                      <th className="py-3 px-3 text-center w-24">PERIOD</th>
                      <th className="py-3 px-4 text-center w-40">GOOD TARGET</th>
                      <th className="py-3 px-4 text-center w-44">EXCELLENCE TARGET</th>
                      <th className="py-3 px-3 text-center w-20">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {allKpis.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium space-y-2">
                          <p className="text-xs text-slate-500">No custom KPI metric categories defined yet.</p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('custom_definitions')}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            + Add Custom KPI Category in Tab 2
                          </button>
                        </td>
                      </tr>
                    ) : (
                      allKpis.map((kpi) => {
                      const targets = draftTargets[kpi.id] || { goodTarget: '', excellenceTarget: '' };
                      const isRowOverride = personTargets[selectedPerson?.trim()]?.[kpi.id] !== undefined;

                      return (
                        <tr key={kpi.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{kpi.title}</span>
                              {kpi.isCustom ? (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-extrabold border border-indigo-200">Custom</span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-extrabold border border-slate-200">Standard</span>
                              )}
                              {isRowOverride && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-extrabold border border-purple-200">Override</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5 line-clamp-1">{kpi.description}</span>
                          </td>

                          <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] capitalize font-extrabold">
                              {kpi.period}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center bg-slate-50/50">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={targets.goodTarget !== undefined ? targets.goodTarget : ''}
                                onChange={(e) => handleTargetChange(kpi.id, 'goodTarget', e.target.value)}
                                className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-2xs text-xs"
                              />
                              <span className="text-[10px] text-slate-500 font-extrabold">/{kpi.unit}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center bg-purple-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={targets.excellenceTarget !== undefined ? targets.excellenceTarget : ''}
                                onChange={(e) => handleTargetChange(kpi.id, 'excellenceTarget', e.target.value)}
                                className="w-16 px-2.5 py-1.5 border border-purple-300 rounded-lg text-center font-black text-purple-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-2xs text-xs"
                              />
                              <span className="text-[10px] text-purple-700 font-extrabold">/{kpi.unit}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {isRowOverride ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveSingleOverride(kpi.id, kpi.title)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Remove target override for this item"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Control Bar */}
              <div className="flex items-center justify-between pt-2">
                <ConfirmPopover
                  title={`Reset targets for ${selectedPerson}?`}
                  subtitle="Reset back to standard 2026 IMP defaults"
                  confirmText="Reset"
                  confirmVariant="warning"
                  disabled={!hasCustomized}
                  onConfirm={handleResetPersonTargets}
                >
                  <button
                    type="button"
                    disabled={!hasCustomized}
                    className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-slate-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset {selectedPerson} to Defaults</span>
                  </button>
                </ConfirmPopover>

                <button
                  type="button"
                  onClick={handleSavePersonTargets}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Save Person Targets for {selectedPerson}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: MANAGE & EDIT KPI DEFINITIONS */}
          {activeTab === 'manage_kpis' && (
            <div className="space-y-6">

              {/* Create / Edit Custom KPI Form */}
              <form onSubmit={handleSaveKpiDefinition} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 font-bold">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                      {editingKpiId ? `Edit KPI Definition: ${newKpi.title}` : 'Add New Custom KPI Category'}
                    </span>
                  </div>
                  {editingKpiId && (
                    <button
                      type="button"
                      onClick={handleCancelKpiEdit}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CustomInput
                    label="KPI Title"
                    required
                    value={newKpi.title}
                    onChange={(e) => setNewKpi({ ...newKpi, title: e.target.value })}
                    placeholder="e.g. Automation Test Pass Rate"
                    size="sm"
                  />

                  <CustomInput
                    label="Short Name / Badge Text"
                    value={newKpi.shortName}
                    onChange={(e) => setNewKpi({ ...newKpi, shortName: e.target.value, badgeText: e.target.value })}
                    placeholder="e.g. Auto Pass"
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <CustomSelect
                    label="Period Frequency"
                    options={[
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'weekly', label: 'Weekly' }
                    ]}
                    value={newKpi.period}
                    onChange={(val) => setNewKpi({ ...newKpi, period: val })}
                    size="sm"
                    variant="outline"
                  />

                  <CustomInput
                    label="Unit Metric Name"
                    value={newKpi.unit}
                    onChange={(e) => setNewKpi({ ...newKpi, unit: e.target.value })}
                    placeholder="e.g. tests, scripts, pass"
                    size="sm"
                  />

                  <CustomInput
                    label="Default Good Target"
                    type="number"
                    value={newKpi.goodTarget}
                    onChange={(e) => setNewKpi({ ...newKpi, goodTarget: e.target.value })}
                    size="sm"
                  />

                  <CustomInput
                    label="Default Excellence Target"
                    type="number"
                    value={newKpi.excellenceTarget}
                    onChange={(e) => setNewKpi({ ...newKpi, excellenceTarget: e.target.value })}
                    size="sm"
                  />
                </div>

                <CustomInput
                  label="Description / Objective"
                  value={newKpi.description}
                  onChange={(e) => setNewKpi({ ...newKpi, description: e.target.value })}
                  placeholder="e.g. Track automated regression coverage across build pipeline"
                  size="sm"
                />

                <div className="flex justify-end gap-2 pt-1">
                  {editingKpiId && (
                    <CustomButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelKpiEdit}
                    >
                      Cancel
                    </CustomButton>
                  )}
                  <CustomButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newKpi.title.trim()}
                    iconLeft={editingKpiId ? Check : Plus}
                  >
                    {editingKpiId ? 'Update KPI Category' : 'Add Custom KPI Category'}
                  </CustomButton>
                </div>
              </form>

              {/* List of User-Created Custom KPI Categories Only */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    Your Custom KPI Definitions ({customKpiDefinitions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={importStandardKpis}
                    className="text-purple-600 hover:text-purple-800 font-bold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Import Standard IMP 2026 KPIs</span>
                  </button>
                </div>

                {customKpiDefinitions.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-center bg-slate-50/60">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-extrabold text-slate-600">No Custom KPI Categories Yet</p>
                    <p className="text-[11px] text-slate-400 font-medium">Use the form above to add your first custom KPI metric category, or click <strong>Import Standard IMP 2026 KPIs</strong> to start with defaults.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customKpiDefinitions.map((kpi) => {
                      const isDisabled = disabledKpiIds.includes(kpi.id);

                      return (
                        <div
                          key={kpi.id}
                          className={`p-3.5 border rounded-2xl flex items-center justify-between transition-all ${isDisabled
                            ? 'bg-slate-100/60 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:shadow-xs'
                            }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-xs">{kpi.title}</span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[10px]">
                                Custom • {kpi.period} • {kpi.unit}
                              </span>
                              {isDisabled && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold">Disabled</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{kpi.description}</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Disable / Enable Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleDisableKpi(kpi.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title={isDisabled ? 'Enable KPI' : 'Disable/Hide KPI'}
                            >
                              {isDisabled ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartKpiEdit(kpi)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit KPI Definition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <ConfirmPopover
                              title="Delete custom KPI definition?"
                              subtitle={`KPI: "${kpi.title}" (${kpi.shortName})`}
                              confirmText="Delete"
                              onConfirm={() => deleteCustomKpiDefinition(kpi.id)}
                            >
                              <button
                                type="button"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Custom KPI Definition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </ConfirmPopover>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
