import React, { useState } from 'react';
import {
  LuPresentation as Presentation,
  LuAward as Award,
  LuHistory as History,
  LuSparkles as Sparkles
} from 'react-icons/lu';
import WeeklyReportView from './WeeklyReportView';
import MonthlyKpiReportView from './MonthlyKpiReportView';
import ReportHistoryView from './ReportHistoryView';
import { useReports } from '../../hooks/useReports';

export default function ReportsDashboard({ owners = [] }) {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'monthly' | 'history'
  const { finalizeReport } = useReports();

  const handleFinalize = async (reportData) => {
    try {
      await finalizeReport(reportData);
      setActiveTab('history');
    } catch (err) {
      // toast handled in hook
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* Main Feature Header & Tab Switcher */}
      <div className="bg-slate-950 border border-slate-800/80 text-white p-6 sm:p-7 rounded-3xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              PECC Automated Report Engine v2.1
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Automated Reporting & Analytics Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
            Eliminate manual slide assembly & KPI report generation. Direct database task aggregation with atomic state locking and multi-format exports (.pptx, .pdf, .xlsx).
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="relative z-10 flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto no-scrollbar scroll-smooth shrink-0 w-full lg:w-auto max-w-full">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Presentation className="w-4 h-4 text-blue-300 shrink-0" />
            <span>Weekly Standup</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
              activeTab === 'monthly'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Monthly Individual KPI</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4 text-purple-300 shrink-0" />
            <span>History &amp; Lock Audit</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'weekly' && <WeeklyReportView onFinalize={handleFinalize} />}
      {activeTab === 'monthly' && <MonthlyKpiReportView owners={owners} onFinalize={handleFinalize} />}
      {activeTab === 'history' && <ReportHistoryView />}

    </div>
  );
}
