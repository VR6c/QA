import React, { useState, useMemo } from 'react';
import {
  LuRocket as Rocket,
  LuBug as Bug,
  LuTestTube as TestTube,
  LuLightbulb as Lightbulb,
  LuFileText as FileText,
  LuTrophy as Trophy,
  LuCircleCheck as CheckCircle2,
  LuClock as Clock,
  LuTarget as Target,
  LuSparkles as Sparkles,
  LuAward as Award,
  LuSlidersHorizontal as SlidersHorizontal,
  LuUser as User,
  LuUsers as Users,
  LuGitPullRequest as FlowIcon,
  LuCheck as Check,
  LuMinus as Minus
} from 'react-icons/lu';
import { getAllKpis, getTaskKpiCategory, isUserOwnerMatch } from '../lib/kpiConstants';
import useKPIStore from '../stores/kpiStore';
import useAuthStore from '../stores/authStore';
import CustomKpiModal from './CustomKpiModal';
import { CustomSelect } from './ui';

const iconMap = {
  Rocket,
  Bug,
  TestTube,
  Lightbulb,
  FileText,
  Target
};

export default function ImpKpiTracker({ tasks = [], owners = [] }) {
  const {
    personTargets,
    customKpiDefinitions,
    disabledKpiIds = [],
    selectedPersonKpiFilter,
    setSelectedPersonKpiFilter,
    getResolvedTarget
  } = useKPIStore();

  const [isCustomKpiModalOpen, setIsCustomKpiModalOpen] = useState(false);
  const [viewMode, setViewModeState] = useState(() => {
    return localStorage.getItem('imp_kpi_tracker_view_mode') || 'cards';
  }); // 'cards' | 'team_matrix' | 'flow_kpis'

  const setViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem('imp_kpi_tracker_view_mode', mode);
  };

  const allKpiDefs = useMemo(() => {
    return getAllKpis(customKpiDefinitions).filter(k => !disabledKpiIds.includes(k.id));
  }, [customKpiDefinitions, disabledKpiIds]);

  // List of team owner names
  const ownerNames = useMemo(() => {
    if (owners.length > 0) {
      return owners.map(o => o.name);
    }
    // Fallback owner list from task dataset if owners prop empty
    const set = new Set();
    tasks.forEach(t => {
      if (t.owner) set.add(t.owner);
    });
    return Array.from(set).length > 0 ? Array.from(set) : ['Unassigned'];
  }, [owners, tasks]);

  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';

  // Automatically lock KPI view filter for non-admin users to their own profile
  React.useEffect(() => {
    if (!isSuperAdmin && currentUser?.name) {
      if (selectedPersonKpiFilter !== currentUser.name) {
        setSelectedPersonKpiFilter(currentUser.name);
      }
    }
  }, [isSuperAdmin, currentUser, selectedPersonKpiFilter, setSelectedPersonKpiFilter]);

  const personSelectOptions = useMemo(() => {
    if (!isSuperAdmin && currentUser?.name) {
      const isCustomized = !!personTargets[currentUser.name.trim()];
      return [{
        value: currentUser.name,
        label: `${currentUser.name} (Your Profile)${isCustomized ? ' • (Custom)' : ''}`,
        icon: <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      }];
    }

    const opts = [
      {
        value: 'all',
        label: `All Team Members (${tasks.length} tasks)`,
        icon: <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      }
    ];

    ownerNames.forEach(name => {
      const isCustomized = !!personTargets[name.trim()];
      opts.push({
        value: name,
        label: `${name}${isCustomized ? ' (Customized)' : ''}`,
        icon: <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      });
    });

    return opts;
  }, [tasks.length, ownerNames, personTargets, currentUser, isSuperAdmin]);

  const activePerson = !isSuperAdmin && currentUser?.name ? currentUser.name : selectedPersonKpiFilter;

  // Filter tasks based on selected owner title for tracking
  const activeTasks = useMemo(() => {
    if (!activePerson || activePerson === 'all') {
      return tasks;
    }
    return tasks.filter(t => isUserOwnerMatch(t.owner, activePerson));
  }, [tasks, activePerson]);

  // Compute KPI stats for active person/team
  const kpiStats = useMemo(() => {
    return allKpiDefs.map((kpi, index) => {
      const matchingTasks = activeTasks.filter(t => getTaskKpiCategory(t) === kpi.id);
      const count = matchingTasks.length;

      // Get resolved targets (person-specific override or global default)
      const targetInfo = getResolvedTarget(activePerson, kpi.id, kpi.goodTarget, kpi.excellenceTarget);
      const goodTarget = targetInfo.goodTarget;
      const excellenceTarget = targetInfo.excellenceTarget;

      const isExcellence = count >= excellenceTarget && excellenceTarget > 0;
      const isGood = !isExcellence && count >= goodTarget && goodTarget > 0;
      const isInProgress = !isGood && count > 0;

      const progressPercent = excellenceTarget > 0 ? Math.min(100, Math.round((count / excellenceTarget) * 100)) : 0;

      return {
        ...kpi,
        number: index + 1,
        goodTarget,
        excellenceTarget,
        isCustomized: targetInfo.isCustomized,
        count,
        matchingTasks,
        isExcellence,
        isGood,
        isInProgress,
        progressPercent
      };
    });
  }, [allKpiDefs, activeTasks, activePerson, getResolvedTarget]);

  // Compute Team-wide Matrix data for all owner titles
  const teamMatrixData = useMemo(() => {
    return ownerNames.map(ownerName => {
      const ownerTasks = tasks.filter(t => isUserOwnerMatch(t.owner, ownerName));


      const kpisMap = {};
      allKpiDefs.forEach(kpi => {
        const matching = ownerTasks.filter(t => getTaskKpiCategory(t) === kpi.id);
        const count = matching.length;
        const targetInfo = getResolvedTarget(ownerName, kpi.id, kpi.goodTarget, kpi.excellenceTarget);

        const isExcellence = count >= targetInfo.excellenceTarget && targetInfo.excellenceTarget > 0;
        const isGood = !isExcellence && count >= targetInfo.goodTarget && targetInfo.goodTarget > 0;

        kpisMap[kpi.id] = {
          count,
          goodTarget: targetInfo.goodTarget,
          excellenceTarget: targetInfo.excellenceTarget,
          isExcellence,
          isGood,
          isCustomized: targetInfo.isCustomized
        };
      });

      return {
        ownerName,
        taskCount: ownerTasks.length,
        kpisMap
      };
    });
  }, [ownerNames, tasks, allKpiDefs, getResolvedTarget]);

  // Compute Flow KPI contributions (Tasks tagged with Flow Type or Flow Value)
  const flowKpiStats = useMemo(() => {
    const flowTasks = activeTasks.filter(t => t.flowType && t.flowType !== 'none');

    const byFlowType = {
      weekly: flowTasks.filter(t => t.flowType === 'weekly'),
      monthly: flowTasks.filter(t => t.flowType === 'monthly'),
      yearly: flowTasks.filter(t => t.flowType === 'yearly')
    };

    return {
      totalFlowTasks: flowTasks.length,
      byFlowType
    };
  }, [activeTasks]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">

      {/* Header section with 2026 Goals branding & Custom KPI controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-md relative overflow-hidden">
        {/* Glow effect overlay */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                2026 Goals
              </span>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>KPI Target Tracker</span>
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              </h2>
            </div>

          </div>
        </div>

        {/* Action controls: Person Filter & Custom KPI Button */}
        <div className="relative z-10 flex items-center gap-2.5 flex-wrap self-start lg:self-auto">


          {/* Customize KPI Targets Button */}
          <button
            onClick={() => setIsCustomKpiModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer border border-purple-400/30 active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-200" />
            <span>Custom KPI per Person</span>
          </button>
        </div>
      </div>

      {/* Control Bar: View tab & Executive Summary Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 font-extrabold ${viewMode === 'cards'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/90 scale-[1.02]'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
          >
            <Target className="w-4 h-4 text-indigo-600" />
            <span>KPI Metric Cards</span>
          </button>


        </div>

        {/* Executive summary pill */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs">
          <Award className="w-4 h-4 text-purple-600" />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-lg border border-purple-200/60 font-extrabold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
              {kpiStats.filter(k => k.isExcellence).length} Excellence
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 font-extrabold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {kpiStats.filter(k => k.isGood).length} Good Met
            </span>
          </div>
        </div>
      </div>



      {/* VIEW MODE 1: KPI METRIC CARDS */}
      {viewMode === 'cards' && (
        kpiStats.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl space-y-3 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-2xs">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Custom KPIs Configured</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You haven't defined any custom KPI categories yet. Click below to add custom KPI metrics or import standard 2026 KPIs.
              </p>
            </div>
            <button
              onClick={() => setIsCustomKpiModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-indigo-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Configure Custom KPIs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiStats.map((kpi, idx) => {
            const IconComponent = iconMap[kpi.iconName] || Target;

            return (
              <div
                key={kpi.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`animate-fade-in-up rounded-xl border ${kpi.borderLight} ${kpi.bgLight} p-4 shadow-2xs hover:shadow-md transition-all duration-300 transform-gpu hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between space-y-3 group`}
              >
                <div>
                  {/* Header Row: # Number, Icon, Title */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        {kpi.number}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-indigo-900 transition-colors">
                          {kpi.title}
                        </h3>
                        {kpi.isCustomized && (
                          <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100 border border-purple-200 rounded px-1 py-0.2">
                            Custom Target for {activePerson}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`p-1.5 rounded-lg bg-white/80 border border-slate-200 ${kpi.textColor} shrink-0 group-hover:rotate-6 transition-transform duration-300`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-500 font-normal line-clamp-2 mb-3">
                    {kpi.description}
                  </p>

                  {/* Target Milestones Row */}
                  <div className="grid grid-cols-2 gap-2 bg-white/70 backdrop-blur-xs rounded-lg border border-slate-200/80 p-2 text-center text-xs mb-3 group-hover:bg-white/90 transition-colors">
                    <div className="border-r border-slate-200 pr-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target: GOOD</span>
                      <span className="font-extrabold text-slate-800">{kpi.goodTarget} <span className="text-[10px] font-semibold text-slate-500">/{kpi.period === 'weekly' ? 'Wk' : 'Mo'}</span></span>
                    </div>
                    <div className="pl-1">
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">EXCELLENCE</span>
                      <span className="font-extrabold text-purple-900">{kpi.excellenceTarget} <span className="text-[10px] font-semibold text-purple-600">/{kpi.period === 'weekly' ? 'Wk' : 'Mo'}</span></span>
                    </div>
                  </div>

                  {/* Current Actual Count & Status Badge */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tight transition-transform group-hover:scale-105 inline-block">
                        {kpi.count}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {kpi.unit} logged
                      </span>
                    </div>

                    {/* Status Badge */}
                    {kpi.isExcellence && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white shadow-2xs animate-pulse-glow">
                        <Trophy className="w-3 h-3 text-amber-300" /> Excellence
                      </span>
                    )}
                    {kpi.isGood && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                        <CheckCircle2 className="w-3 h-3" /> Good Met
                      </span>
                    )}
                    {kpi.isInProgress && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    )}
                    {!kpi.isExcellence && !kpi.isGood && !kpi.isInProgress && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Progress Bar towards Excellence Target */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full ${kpi.barColor} transition-all duration-700 ease-out rounded-full`}
                        style={{ width: `${kpi.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                      <span>0</span>
                      <span>Good: {kpi.goodTarget}</span>
                      <span>Excellence: {kpi.excellenceTarget}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW MODE 2: TEAM PERSON MATRIX */}
      {viewMode === 'team_matrix' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs animate-fade-in-up">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Team Person-by-Person KPI Performance Matrix</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Individual person targets comparison</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white font-bold border-b border-blue-700">
                  <th className="py-2.5 px-4 border-r border-blue-500 min-w-[160px]">TEAM MEMBER / PERSON</th>
                  <th className="py-2.5 px-3 text-center border-r border-blue-500 w-24">TASKS</th>
                  {allKpiDefs.map(kpi => (
                    <th key={kpi.id} className="py-2.5 px-3 text-center border-r border-blue-500 min-w-[140px]">
                      <div className="font-extrabold">{kpi.shortName}</div>
                      <div className="text-[9px] text-blue-100 font-normal capitalize">{kpi.period}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                {teamMatrixData.map(person => (
                  <tr key={person.ownerName} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-200 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[11px] flex items-center justify-center">
                          {person.ownerName.charAt(0).toUpperCase()}
                        </span>
                        <span>{person.ownerName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center border-r border-slate-200 font-bold text-slate-600">
                      {person.taskCount}
                    </td>

                    {allKpiDefs.map(kpi => {
                      const stat = person.kpisMap[kpi.id] || { count: 0, goodTarget: kpi.goodTarget, excellenceTarget: kpi.excellenceTarget };
                      return (
                        <td key={kpi.id} className="py-3 px-3 text-center border-r border-slate-200">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {stat.count} <span className="text-[10px] text-slate-400 font-normal">/ {stat.goodTarget} G / {stat.excellenceTarget} E</span>
                            </span>

                            {stat.isExcellence && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 mt-1">
                                <Trophy className="w-2.5 h-2.5 text-amber-500" /> Excellence
                              </span>
                            )}
                            {stat.isGood && !stat.isExcellence && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 mt-1">
                                <Check className="w-2.5 h-2.5 text-emerald-600" /> Good
                              </span>
                            )}
                            {!stat.isGood && stat.count > 0 && (
                              <span className="text-[9px] text-amber-600 font-semibold mt-0.5">
                                In Progress
                              </span>
                            )}
                            {stat.count === 0 && (
                              <span className="text-[10px] text-slate-300 mt-0.5">-</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: FLOW KPI CONTRIBUTION */}
      {viewMode === 'flow_kpis' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <FlowIcon className="w-4 h-4 text-blue-600" />
                <span>Recurring Flow KPI Alignment ({activePerson === 'all' ? 'All Team' : activePerson})</span>
              </h3>
              <p className="text-xs text-blue-700 font-medium">
                Recurring QA flow tasks mapped to frequency schedules (Daily, Weekly, Monthly, Quarterly)
              </p>
            </div>
            <div className="px-3 py-1 bg-blue-600 text-white rounded-lg font-extrabold text-xs">
              {flowKpiStats.totalFlowTasks} Flow Tasks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {['daily', 'weekly', 'monthly', 'quarterly'].map(flowType => {
              const items = flowKpiStats.byFlowType[flowType] || [];
              return (
                <div key={flowType} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-900 text-xs capitalize">
                      {flowType} Flow
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md text-[10px] font-bold">
                      {items.length} tasks
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2 text-center">No tasks assigned</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px]">
                      {items.map(t => (
                        <div key={t.id || t.title} className="p-2 bg-white border border-slate-200 rounded-lg space-y-1 shadow-2xs hover:border-blue-300 transition-colors">
                          <div className="font-bold text-slate-800 leading-tight">{t.title}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-purple-700 bg-purple-50 px-1 rounded">{t.flowValue || 'IMP Flow'}</span>
                            <span>{t.owner || 'Unassigned'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official KPI Table */}
      {viewMode === 'cards' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs animate-fade-in-up">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
              <span>2026 Goals Official KPI Matrix Table</span>
              {activePerson !== 'all' && (
                <span className="text-purple-300 font-bold">({activePerson})</span>
              )}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Live sync from task database</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white font-bold border-b border-blue-700">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-blue-500">#</th>
                  <th className="py-2.5 px-4 border-r border-blue-500">ITEM KPIs</th>
                  <th className="py-2.5 px-4 text-center border-r border-blue-500 w-32">GOOD TARGET</th>
                  <th className="py-2.5 px-4 text-center border-r border-blue-500 w-36">EXCELLENCE TARGET</th>
                  <th className="py-2.5 px-4 text-center w-36">ACTUAL ACHIEVED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                {kpiStats.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                      {kpi.number}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{kpi.title}</div>
                      {kpi.id === 'finding_product_error' && (
                        <span className="text-[11px] italic text-slate-500 block">(Both App/portal)</span>
                      )}
                      {kpi.id === 'conduct_testing' && (
                        <span className="text-[11px] italic text-slate-500 block">(Milestone task)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-800 border-r border-slate-200 bg-slate-50/50">
                      {kpi.goodTarget}/{kpi.period === 'weekly' ? 'Week' : 'month'}
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-purple-700 border-r border-slate-200 bg-purple-50/30">
                      {kpi.excellenceTarget}/{kpi.period === 'weekly' ? 'Week' : 'month'}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        <span className="text-sm font-black">{kpi.count}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">/{kpi.period === 'weekly' ? 'Wk' : 'Mo'}</span>
                        {kpi.isExcellence && <Trophy className="w-3.5 h-3.5 text-purple-600 ml-1" />}
                        {kpi.isGood && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Render Custom KPI Modal */}
      <CustomKpiModal
        isOpen={isCustomKpiModalOpen}
        onClose={() => setIsCustomKpiModalOpen(false)}
        owners={owners}
        tasks={tasks}
      />

    </div>
  );
}
