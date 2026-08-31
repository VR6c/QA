import React, { useState } from 'react';
import {
  LuHistory as History,
  LuLock as Lock,
  LuLockOpen as Unlock,
  LuFileText as FileText,
  LuPresentation as Presentation,
  LuShieldAlert as ShieldAlert,
  LuUser as UserIcon,
  LuCircleCheck as CheckCircle2,
  LuCalendar as Calendar
} from 'react-icons/lu';
import { useReports } from '../../hooks/useReports';
import useAuthStore from '../../stores/authStore';
import { CustomButton } from '../ui';

export default function ReportHistoryView() {
  const { reportsHistory, isLoadingHistory, unlockTask } = useReports();
  const currentUser = useAuthStore(state => state.user);
  const isSuperAdminOrLead = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';

  const [selectedReport, setSelectedReport] = useState(null);
  const [unlockingTaskId, setUnlockingTaskId] = useState(null);

  const handleUnlockTask = async (taskId) => {
    try {
      setUnlockingTaskId(taskId);
      await unlockTask(taskId);
      setUnlockingTaskId(null);
    } catch (err) {
      setUnlockingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Finalized Reports & State Lock Audit</h2>
            <p className="text-xs text-slate-500">REQ-REP-D2 & D4: Zero-duplication report archive & admin release mechanism</p>
          </div>
        </div>

        {isSuperAdminOrLead && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            Admin Task Unlock Authority Active
          </span>
        )}
      </div>

      {isLoadingHistory ? (
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading report history archive...
        </div>
      ) : reportsHistory.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No finalized reports logged yet. Create and save a Weekly Standup or Monthly KPI report to archive here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* List of Reports */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Report Archive ({reportsHistory.length})</h3>
            <div className="space-y-2">
              {reportsHistory.map(r => (
                <div
                  key={r.id || r._id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedReport?.id === r.id || selectedReport?._id === r._id
                      ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.type === 'weekly' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {r.type === 'weekly' ? 'Weekly Standup' : 'Monthly KPI'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{r.period}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2 truncate">{r.title}</h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> {r.owner || 'All'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Lock className="w-3 h-3 text-slate-400" /> {r.task_ids?.length || 0} tasks claimed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Report Detail & Task Unlock Panel */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      FINALIZED REPORT ARCHIVE
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{selectedReport.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Period: {selectedReport.period}  |  Created by: {selectedReport.created_by || 'System'} on {new Date(selectedReport.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Metrics Summary */}
                {selectedReport.metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">Quick Test</p>
                      <p className="text-base font-bold text-slate-900">{selectedReport.metrics.quick_test || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">Finding Error</p>
                      <p className="text-base font-bold text-slate-900">{selectedReport.metrics.finding_error || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">Conduct Testing</p>
                      <p className="text-base font-bold text-slate-900">{selectedReport.metrics.conduct_testing || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">New Idea / Research</p>
                      <p className="text-base font-bold text-slate-900">{(selectedReport.metrics.new_idea || 0) + (selectedReport.metrics.research_doc || 0)}</p>
                    </div>
                  </div>
                )}

                {/* Claimed Tasks & Unlock Mechanism (REQ-REP-D4) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Claimed Task Records ({selectedReport.task_ids?.length || 0})
                    </h4>
                    {isSuperAdminOrLead && (
                      <span className="text-[10px] text-slate-500">Super Admins / Leads can release task locks below</span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {Array.isArray(selectedReport.task_ids) && selectedReport.task_ids.length > 0 ? (
                      selectedReport.task_ids.map(t => {
                        const taskId = typeof t === 'object' ? (t.id || t._id) : t;
                        const taskTitle = typeof t === 'object' ? t.title : `Task ID: ${t}`;
                        const taskOwner = typeof t === 'object' ? t.owner : 'N/A';
                        const isClaimed = typeof t === 'object' ? Boolean(t.kpi_claimed_month) : true;

                        return (
                          <div key={taskId} className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50">
                            <div>
                              <p className="font-semibold text-slate-900">{taskTitle}</p>
                              <p className="text-[10px] text-slate-500">Owner: {taskOwner} | Locked in {selectedReport.period}</p>
                            </div>

                            {isSuperAdminOrLead && (
                              <CustomButton
                                variant="outline"
                                size="sm"
                                iconLeft={Unlock}
                                disabled={unlockingTaskId === taskId || !isClaimed}
                                onClick={() => handleUnlockTask(taskId)}
                                className="text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                              >
                                {unlockingTaskId === taskId ? 'Unlocking...' : 'Unlock Task'}
                              </CustomButton>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No itemized task IDs associated with this weekly report archive.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Select a report from the archive on the left to view detailed metadata and claim lock state.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
