import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LuCalendar as Calendar,
  LuFileText as FileText,
  LuFileSpreadsheet as FileSpreadsheet,
  LuLock as Lock,
  LuAward as Award,
  LuCircleCheck as CheckCircle2,
  LuTriangleAlert as AlertTriangle,
  LuSlidersHorizontal as Sliders,
  LuSave as Save,
  LuUser as UserIcon,
  LuClock as Clock,
  LuChevronDown as ChevronDown
} from 'react-icons/lu';
import { api } from '../../lib/api';
import { useReports } from '../../hooks/useReports';
import { reportExportService } from '../../lib/reportExportService';
import { CustomButton, CustomCard, CustomSelect } from '../ui';
import { toast } from 'sonner';

// Custom Month Picker Popover Component
function CustomMonthPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const [yearStr, monthStr] = (value || '2026-08').split('-');
  const [selectedYear, setSelectedYear] = useState(parseInt(yearStr, 10) || 2026);

  const months = [
    { num: '01', name: 'Jan' },
    { num: '02', name: 'Feb' },
    { num: '03', name: 'Mar' },
    { num: '04', name: 'Apr' },
    { num: '05', name: 'May' },
    { num: '06', name: 'Jun' },
    { num: '07', name: 'Jul' },
    { num: '08', name: 'Aug' },
    { num: '09', name: 'Sep' },
    { num: '10', name: 'Oct' },
    { num: '11', name: 'Nov' },
    { num: '12', name: 'Dec' }
  ];

  const fullMonthNames = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMonth = (mNum) => {
    onChange(`${selectedYear}-${mNum}`);
    setIsOpen(false);
  };

  const formattedLabel = `${fullMonthNames[monthStr] || 'August'} ${selectedYear}`;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
      >
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span>{formattedLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <button
              type="button"
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="px-2 py-0.5 hover:bg-slate-100 rounded-lg text-slate-700 font-extrabold cursor-pointer"
            >
              ‹
            </button>
            <span className="text-xs font-extrabold text-slate-900">{selectedYear}</span>
            <button
              type="button"
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="px-2 py-0.5 hover:bg-slate-100 rounded-lg text-slate-700 font-extrabold cursor-pointer"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {months.map(m => {
              const isSelected = value === `${selectedYear}-${m.num}`;
              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => handleSelectMonth(m.num)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonthlyKpiReportView({ owners = [], onFinalize }) {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [targetMonth, setTargetMonth] = useState(currentMonthStr);
  const [selectedOwner, setSelectedOwner] = useState('All');

  // Dynamic KPI Targets modal state
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const { kpiTargets, updateKpiTargets } = useReports();
  const [localTargets, setLocalTargets] = useState(null);

  // Challenges & Success Stories
  const [challenges, setChallenges] = useState('Encountered minor environment delays during TestFlight push; resolved via hotfix.');
  const [successStories, setSuccessStories] = useState('Exceeded quick testing and error finding target milestones for active releases.');

  // Fetch Monthly Preview
  const { data: previewData, isLoading, refetch } = useQuery({
    queryKey: ['monthlyReportPreview', targetMonth, selectedOwner],
    queryFn: async () => {
      const res = await api.getMonthlyPreview(targetMonth, selectedOwner);
      return res.data;
    }
  });

  const handleOpenTargetsModal = () => {
    setLocalTargets(kpiTargets || previewData?.kpiTargets || {});
    setIsTargetsModalOpen(true);
  };

  const handleSaveDynamicTargets = async () => {
    try {
      await updateKpiTargets(localTargets);
      setIsTargetsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to update targets: ' + err.message);
    }
  };

  const handleExportPdf = () => {
    if (!previewData) return;
    try {
      reportExportService.exportMonthlyPdf({
        targetMonth,
        owner: selectedOwner,
        kpiTargets: previewData.kpiTargets,
        counts: previewData.counts,
        performanceTiers: previewData.performanceTiers,
        timelinessSummary: previewData.timelinessSummary,
        challengesSuccess: { challenges, successStories }
      });
      toast.success('Executive PDF report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export PDF: ' + err.message);
    }
  };

  const handleExportXlsx = () => {
    if (!previewData) return;
    const items = (previewData.timelinessSummary?.onTimeItems || []).concat(previewData.timelinessSummary?.overDeadlineItems || []);
    reportExportService.exportToXlsx({
      filename: `Monthly_KPI_Report_${selectedOwner}_${targetMonth}`,
      sheets: [
        { name: 'Milestone Tasks', data: items }
      ]
    });
    toast.success('Excel workbook exported successfully!');
  };

  const handleFinalizeAndLock = () => {
    if (!previewData) return;
    const allTaskIds = (previewData.timelinessSummary?.onTimeItems || [])
      .concat(previewData.timelinessSummary?.overDeadlineItems || [])
      .map(t => t.id || t._id);

    const reportData = {
      title: `Monthly Individual KPI Report (${selectedOwner} - ${targetMonth})`,
      type: 'monthly',
      period: targetMonth,
      startDate: `${targetMonth}-01`,
      endDate: `${targetMonth}-31`,
      owner: selectedOwner,
      task_ids: allTaskIds,
      metrics: previewData.counts,
      kpi_targets: previewData.kpiTargets,
      performance_tier: previewData.performanceTiers,
      challenges_success_stories: { challenges, successStories }
    };
    if (onFinalize) onFinalize(reportData);
  };

  const activeTargets = kpiTargets || previewData?.kpiTargets || {};

  return (
    <div className="space-y-6">

      {/* Top Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
        
        {/* Left Title & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Monthly Individual KPI Performance Report
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                REQ-REP-M1:M4
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal truncate">
              Dynamic target thresholds, tier auto-assignment &amp; PDF report generator
            </p>
          </div>
        </div>

        {/* Right Controls & Action Buttons Row (Inline single flex row!) */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 w-full lg:w-auto">
          
          {/* Month Picker Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-slate-500 hidden xl:inline">Month:</span>
            <CustomMonthPicker
              value={targetMonth}
              onChange={(val) => setTargetMonth(val)}
            />
          </div>

          {/* Dynamic Targets Button */}
          <CustomButton variant="outline" size="sm" iconLeft={Sliders} onClick={handleOpenTargetsModal}>
            Dynamic Targets
          </CustomButton>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 shrink-0">
            <CustomButton variant="outline" size="sm" iconLeft={FileSpreadsheet} onClick={handleExportXlsx}>
              XLSX
            </CustomButton>
            <CustomButton variant="primary" size="sm" iconLeft={FileText} onClick={handleExportPdf}>
              Export PDF
            </CustomButton>
            <CustomButton variant="solid" size="sm" iconLeft={Lock} onClick={handleFinalizeAndLock} className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
              Finalize & Lock
            </CustomButton>
          </div>

        </div>

      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-500 text-xs font-semibold animate-pulse bg-white/60 rounded-3xl border border-slate-200/80">
          Evaluating monthly task milestones against dynamic KPI targets...
        </div>
      ) : (
        <>
          {/* Overall Tier Banner */}
          {(() => {
            const overallTier = previewData?.performanceTiers?.overall || 'Good';
            const isExcellence = overallTier === 'Excellence';
            const isGood = overallTier === 'Good' || overallTier === 'Good Tier';

            const bannerBg = isExcellence
              ? 'bg-gradient-to-br from-slate-950 via-amber-950/80 to-slate-950 border-amber-500/40'
              : isGood
                ? 'bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-950 border-emerald-500/40'
                : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-slate-800';

            const badgeStyle = isExcellence
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-amber-500/20'
              : isGood
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 border-slate-600';

            return (
              <div className={`${bannerBg} text-white p-6 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all`}>
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 border border-white/15 backdrop-blur-md">
                      REQ-REP-M2: Tier Auto-Assignment
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Target Month: {targetMonth}</span>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Zero-duplication lock active
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Assigned Tier:</span>
                    <span className={isExcellence ? 'text-amber-400' : isGood ? 'text-emerald-400' : 'text-slate-200'}>
                      {overallTier}
                    </span>
                  </h3>

                  <p className="text-xs text-slate-300/90 leading-relaxed">
                    Evaluated from {previewData?.totalEligibleTasks || 0} completed terminal tasks for {selectedOwner}.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 shrink-0">
                  <span className={`px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg border flex items-center gap-2 tracking-wide uppercase ${badgeStyle}`}>
                    <Award className="w-4 h-4" />
                    {overallTier}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Section I: 5 Core IMP KPI Evaluation Cards (REQ-REP-M1) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Section I: Evaluation Against Dynamic KPI Targets
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">

              {/* 1. Quick Test on TestFlight */}
              {(() => {
                const count = previewData?.counts?.quick_test || 0;
                const tier = previewData?.performanceTiers?.quick_test || 'Needs Improvement';
                const goodTarget = activeTargets?.quick_test?.good || 3;
                const excTarget = activeTargets?.quick_test?.excellence || 4;
                const progressPct = Math.min(100, Math.round((count / goodTarget) * 100));

                return (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Quick Test on TestFlight</p>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{count}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          tier === 'Excellence' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          tier === 'Good' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tier}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier === 'Excellence' ? 'bg-amber-500' : tier === 'Good' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Good ≥ {goodTarget}, Exc ≥ {excTarget}</p>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Finding Product Error */}
              {(() => {
                const count = previewData?.counts?.finding_error || 0;
                const tier = previewData?.performanceTiers?.finding_error || 'Needs Improvement';
                const goodTarget = activeTargets?.finding_error?.good || 4;
                const excTarget = activeTargets?.finding_error?.excellence || 6;
                const progressPct = Math.min(100, Math.round((count / goodTarget) * 100));

                return (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Finding Product Error</p>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{count}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          tier === 'Excellence' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          tier === 'Good' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tier}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier === 'Excellence' ? 'bg-amber-500' : tier === 'Good' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Good ≥ {goodTarget}, Exc ≥ {excTarget}</p>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Conduct Testing New Feature */}
              {(() => {
                const count = previewData?.counts?.conduct_testing || 0;
                const tier = previewData?.performanceTiers?.conduct_testing || 'Needs Improvement';
                const goodTarget = activeTargets?.conduct_testing?.good || 4;
                const excTarget = activeTargets?.conduct_testing?.excellence || 6;
                const progressPct = Math.min(100, Math.round((count / goodTarget) * 100));

                return (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Conduct Testing Feature</p>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{count}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          tier === 'Excellence' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          tier === 'Good' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tier}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier === 'Excellence' ? 'bg-amber-500' : tier === 'Good' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Good ≥ {goodTarget}, Exc ≥ {excTarget}</p>
                    </div>
                  </div>
                );
              })()}

              {/* 4. New Idea Propose */}
              {(() => {
                const count = previewData?.counts?.new_idea || 0;
                const tier = previewData?.performanceTiers?.new_idea || 'Needs Improvement';
                const goodTarget = activeTargets?.new_idea?.good || 1;
                const excTarget = activeTargets?.new_idea?.excellence || 3;
                const progressPct = Math.min(100, Math.round((count / goodTarget) * 100));

                return (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">New Idea Propose</p>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{count}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          tier === 'Excellence' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          tier === 'Good' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tier}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier === 'Excellence' ? 'bg-amber-500' : tier === 'Good' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Good ≥ {goodTarget}, Exc ≥ {excTarget}</p>
                    </div>
                  </div>
                );
              })()}

              {/* 5. Research Testing Template */}
              {(() => {
                const count = previewData?.counts?.research_doc || 0;
                const tier = previewData?.performanceTiers?.research_doc || 'Needs Improvement';
                const goodTarget = activeTargets?.research_doc?.good || 1;
                const excTarget = activeTargets?.research_doc?.excellence || 2;
                const progressPct = Math.min(100, Math.round((count / goodTarget) * 100));

                return (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Research Testing Doc</p>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{count}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          tier === 'Excellence' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          tier === 'Good' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tier}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier === 'Excellence' ? 'bg-amber-500' : tier === 'Good' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Good ≥ {goodTarget}, Exc ≥ {excTarget}</p>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Section II: Timeliness & Deadline Auditing (REQ-REP-M3) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  REQ-REP-M3: Timeliness & Deadline Auditing Breakdown
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  On Time: {previewData?.timelinessSummary?.onTimeCount || 0}
                </span>
                <span className="text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
                  Overdeadline: {previewData?.timelinessSummary?.overDeadlineCount || 0}
                </span>
              </div>
            </div>

            {previewData?.timelinessSummary?.overDeadlineItems?.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-rose-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-rose-50/80 text-rose-900 font-bold border-b border-rose-200 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Overdeadline Task Title</th>
                      <th className="p-3">Completion Date</th>
                      <th className="p-3">Target Date</th>
                      <th className="p-3">Mandatory Delay Reason Logging</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100/60 bg-white">
                    {previewData.timelinessSummary.overDeadlineItems.map(item => (
                      <tr key={item.id || item._id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">{item.title}</td>
                        <td className="p-3 text-slate-700 font-medium whitespace-nowrap">{item.date}</td>
                        <td className="p-3 text-rose-600 font-bold whitespace-nowrap">{item.due_date || item.timeline || item.date}</td>
                        <td className="p-3 text-slate-600 italic font-medium">{item.delayReason || 'No delay reason logged'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs text-emerald-800 font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All tasks for this period were completed on or before target timeline dates. Zero deadline delays logged.</span>
              </div>
            )}
          </div>

          {/* Section III: Challenges & Success Stories */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Section III: Monthly Challenges & Success Highlights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-rose-50/30 rounded-2xl border border-rose-100">
                <label className="block text-xs font-bold text-slate-800">Monthly Challenges Encountered</label>
                <textarea
                  rows={3}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                  placeholder="Describe challenges..."
                />
              </div>

              <div className="space-y-2 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                <label className="block text-xs font-bold text-slate-800">Success Stories & Key Highlights</label>
                <textarea
                  rows={3}
                  value={successStories}
                  onChange={(e) => setSuccessStories(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                  placeholder="Describe accomplishments..."
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dynamic KPI Targets Customization Modal */}
      {isTargetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Dynamic KPI Target Thresholds Configuration</h3>
              </div>
              <button onClick={() => setIsTargetsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-600">
                Customize Good vs. Excellence threshold targets dynamically. The reporting engine will evaluate monthly volumes against these settings.
              </p>

              {localTargets && Object.keys(localTargets).map(key => {
                const item = localTargets[key];
                return (
                  <div key={key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Unit: {item.unit || 'month'}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-700">Good ≥</span>
                        <input
                          type="number"
                          value={item.good}
                          onChange={(e) => setLocalTargets({
                            ...localTargets,
                            [key]: { ...item, good: Number(e.target.value) }
                          })}
                          className="w-16 p-1 bg-white border border-slate-300 rounded-md text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-amber-700">Excellence ≥</span>
                        <input
                          type="number"
                          value={item.excellence}
                          onChange={(e) => setLocalTargets({
                            ...localTargets,
                            [key]: { ...item, excellence: Number(e.target.value) }
                          })}
                          className="w-16 p-1 bg-white border border-slate-300 rounded-md text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <CustomButton variant="outline" size="sm" onClick={() => setIsTargetsModalOpen(false)}>
                Cancel
              </CustomButton>
              <CustomButton variant="solid" size="sm" onClick={handleSaveDynamicTargets} className="bg-emerald-600 text-white">
                Save Dynamic Targets
              </CustomButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
