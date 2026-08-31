import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LuCalendar as Calendar,
  LuFileSpreadsheet as FileSpreadsheet,
  LuPresentation as Presentation,
  LuCircleCheck as CheckCircle2,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuTriangleAlert as AlertTriangle,
  LuSparkles as Sparkles,
  LuClock as Clock,
  LuUser as UserIcon,
  LuSave as Save
} from 'react-icons/lu';
import { api } from '../../lib/api';
import { reportExportService } from '../../lib/reportExportService';
import { CustomButton, CustomCard, CustomDatePicker } from '../ui';
import { toast } from 'sonner';

// Helper: Calculate default Monday to Saturday dates
function getDefaultWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  const formatDate = (d) => d.toISOString().split('T')[0];
  return {
    startDate: formatDate(monday),
    endDate: formatDate(saturday)
  };
}

export default function WeeklyReportView({ onFinalize }) {
  const defaultRange = getDefaultWeekRange();
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  // GCIN Form State
  const [gcinGood, setGcinGood] = useState(['Completed QA verification for primary features on TestFlight.']);
  const [gcinChallenge, setGcinChallenge] = useState([]);
  const [gcinImprovement, setGcinImprovement] = useState(['Streamline feedback loop for blocked items.']);
  const [gcinNextAction, setGcinNextAction] = useState(['Conduct end-to-end regression testing before production build.']);

  const [goodInput, setGoodInput] = useState('');
  const [challengeInput, setChallengeInput] = useState('');
  const [improvementInput, setImprovementInput] = useState('');
  const [nextActionInput, setNextActionInput] = useState('');

  // Fetch Weekly Preview
  const { data: previewData, isLoading, refetch } = useQuery({
    queryKey: ['weeklyReportPreview', startDate, endDate],
    queryFn: async () => {
      const res = await api.getWeeklyPreview(startDate, endDate);
      const data = res.data;
      if (data?.gcinAutoSuggestions?.challenge?.length > 0 && gcinChallenge.length === 0) {
        setGcinChallenge(data.gcinAutoSuggestions.challenge);
      }
      return data;
    }
  });

  const handleAddItem = (type) => {
    if (type === 'good' && goodInput.trim()) {
      setGcinGood([...gcinGood, goodInput.trim()]);
      setGoodInput('');
    } else if (type === 'challenge' && challengeInput.trim()) {
      setGcinChallenge([...gcinChallenge, challengeInput.trim()]);
      setChallengeInput('');
    } else if (type === 'improvement' && improvementInput.trim()) {
      setGcinImprovement([...gcinImprovement, improvementInput.trim()]);
      setImprovementInput('');
    } else if (type === 'nextAction' && nextActionInput.trim()) {
      setGcinNextAction([...gcinNextAction, nextActionInput.trim()]);
      setNextActionInput('');
    }
  };

  const removeItem = (type, index) => {
    if (type === 'good') setGcinGood(gcinGood.filter((_, i) => i !== index));
    if (type === 'challenge') setGcinChallenge(gcinChallenge.filter((_, i) => i !== index));
    if (type === 'improvement') setGcinImprovement(gcinImprovement.filter((_, i) => i !== index));
    if (type === 'nextAction') setGcinNextAction(gcinNextAction.filter((_, i) => i !== index));
  };

  const handleExportPptx = async () => {
    if (!previewData) return;
    try {
      await reportExportService.exportWeeklyPptx({
        startDate,
        endDate,
        days: previewData.days || {},
        sections: previewData.sections || {},
        gcin: {
          good: gcinGood,
          challenge: gcinChallenge,
          improvement: gcinImprovement,
          nextAction: gcinNextAction
        }
      });
      toast.success('PowerPoint presentation downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export PPTX: ' + err.message);
    }
  };

  const handleExportXlsx = () => {
    if (!previewData) return;
    const achievements = previewData.sections?.lastWeekAchievement || [];
    const plans = previewData.sections?.thisWeekPlan || [];
    reportExportService.exportToXlsx({
      filename: `Weekly_QA_Standup_${startDate}_to_${endDate}`,
      sheets: [
        { name: 'Last Week Achievement', data: achievements },
        { name: 'This Week Plan', data: plans }
      ]
    });
    toast.success('Excel workbook exported successfully!');
  };

  const handleFinalizeReport = () => {
    if (!previewData) return;
    const reportData = {
      title: `Weekly QA Operational Standup (${startDate} - ${endDate})`,
      type: 'weekly',
      period: `${startDate}_${endDate}`,
      startDate,
      endDate,
      owner: 'All',
      gcin: {
        good: gcinGood,
        challenge: gcinChallenge,
        improvement: gcinImprovement,
        nextAction: gcinNextAction
      },
      task_ids: [
        ...(previewData.sections?.lastWeekAchievement || []).map(t => t.id || t._id),
        ...(previewData.sections?.thisWeekPlan || []).map(t => t.id || t._id)
      ],
      metrics: {
        total: previewData.totalTasks || 0,
        achievements: previewData.sections?.lastWeekAchievement?.length || 0,
        plan: previewData.sections?.thisWeekPlan?.length || 0
      }
    };
    if (onFinalize) onFinalize(reportData);
  };

  return (
    <div className="space-y-6">

      {/* Top Action Bar & Date Picker */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
        
        {/* Left Title & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Weekly QA Operational Standup
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
                REQ-REP-W1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal truncate">
              Mon–Sat operational task aggregation &amp; 3-slide PPTX builder
            </p>
          </div>
        </div>

        {/* Right Controls & Action Buttons Row (Inline single flex row!) */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 w-full lg:w-auto">
          
          {/* Cycle Range DatePicker Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 hidden xl:inline">Cycle Range:</span>
            <CustomDatePicker
              mode="range"
              size="sm"
              value={{ from: startDate, to: endDate }}
              onChange={(val) => {
                if (val && typeof val === 'object') {
                  const fromVal = val.from ? (val.from instanceof Date ? val.from.toISOString().split('T')[0] : String(val.from)) : startDate;
                  const toVal = val.to ? (val.to instanceof Date ? val.to.toISOString().split('T')[0] : String(val.to)) : endDate;
                  setStartDate(fromVal);
                  setEndDate(toVal);
                }
              }}
              enablePresets={true}
              placeholder="Select cycle range"
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 shrink-0">
            <CustomButton variant="outline" size="sm" iconLeft={FileSpreadsheet} onClick={handleExportXlsx}>
              XLSX
            </CustomButton>
            <CustomButton variant="primary" size="sm" iconLeft={Presentation} onClick={handleExportPptx}>
              Export PPTX
            </CustomButton>
            <CustomButton variant="solid" size="sm" iconLeft={Save} onClick={handleFinalizeReport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              Save Report
            </CustomButton>
          </div>

        </div>

      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading weekly standup data &amp; auto-detecting &gt;48h feedback blockers...
        </div>
      ) : (
        <>
          {/* Section Partitioning Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CustomCard variant="white" className="p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1. Last Week Achievement</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{previewData?.sections?.lastWeekAchievement?.length || 0}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Tasks with status Done or QA Success resolved during cycle</p>
            </CustomCard>

            <CustomCard variant="white" className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">2. This Week Plan</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{previewData?.sections?.thisWeekPlan?.length || 0}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Active tasks scheduled in testing, progress, backlog</p>
            </CustomCard>

            <CustomCard variant="white" className="p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">3. Tracking Owner Deployment</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{previewData?.sections?.trackingOwnerDeployment?.length || 0}</p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Assigned team members actively executing items</p>
            </CustomCard>
          </div>

          {/* GCIN Management Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">REQ-REP-W3: GCIN Matrix Management</h3>
              </div>
              {previewData?.gcinAutoSuggestions?.challenge?.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Auto-detected {previewData.gcinAutoSuggestions.challenge.length} blocker(s) &gt;48h
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* GOOD Card */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Good (Wins & Accomplishments)</h4>
                  <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">{gcinGood.length}</span>
                </div>
                <div className="space-y-2">
                  {gcinGood.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 text-xs text-slate-700">
                      <span>• {item}</span>
                      <button onClick={() => removeItem('good', idx)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add good accomplishment..."
                    value={goodInput}
                    onChange={(e) => setGoodInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('good')}
                    className="flex-1 bg-white px-3 py-1.5 border border-emerald-200 rounded-lg text-xs focus:outline-hidden"
                  />
                  <CustomButton variant="outline" size="sm" onClick={() => handleAddItem('good')} className="bg-white">
                    <Plus className="w-3.5 h-3.5" />
                  </CustomButton>
                </div>
              </div>

              {/* CHALLENGE Card */}
              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Challenge (Blockers & &gt;48h Feedback)</h4>
                  <span className="text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold">{gcinChallenge.length}</span>
                </div>
                <div className="space-y-2">
                  {gcinChallenge.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-rose-100 text-xs text-slate-700">
                      <span>• {item}</span>
                      <button onClick={() => removeItem('challenge', idx)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add challenge or blocker..."
                    value={challengeInput}
                    onChange={(e) => setChallengeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('challenge')}
                    className="flex-1 bg-white px-3 py-1.5 border border-rose-200 rounded-lg text-xs focus:outline-hidden"
                  />
                  <CustomButton variant="outline" size="sm" onClick={() => handleAddItem('challenge')} className="bg-white">
                    <Plus className="w-3.5 h-3.5" />
                  </CustomButton>
                </div>
              </div>

              {/* IMPROVEMENT Card */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Improvement (Steps to Take)</h4>
                  <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">{gcinImprovement.length}</span>
                </div>
                <div className="space-y-2">
                  {gcinImprovement.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 text-xs text-slate-700">
                      <span>• {item}</span>
                      <button onClick={() => removeItem('improvement', idx)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add improvement item..."
                    value={improvementInput}
                    onChange={(e) => setImprovementInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('improvement')}
                    className="flex-1 bg-white px-3 py-1.5 border border-blue-200 rounded-lg text-xs focus:outline-hidden"
                  />
                  <CustomButton variant="outline" size="sm" onClick={() => handleAddItem('improvement')} className="bg-white">
                    <Plus className="w-3.5 h-3.5" />
                  </CustomButton>
                </div>
              </div>

              {/* NEXT ACTION Card */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider">Next Action (Target Deliverables)</h4>
                  <span className="text-xs bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">{gcinNextAction.length}</span>
                </div>
                <div className="space-y-2">
                  {gcinNextAction.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-purple-100 text-xs text-slate-700">
                      <span>• {item}</span>
                      <button onClick={() => removeItem('nextAction', idx)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add next action item..."
                    value={nextActionInput}
                    onChange={(e) => setNextActionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('nextAction')}
                    className="flex-1 bg-white px-3 py-1.5 border border-purple-200 rounded-lg text-xs focus:outline-hidden"
                  />
                  <CustomButton variant="outline" size="sm" onClick={() => handleAddItem('nextAction')} className="bg-white">
                    <Plus className="w-3.5 h-3.5" />
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Table Breakdown Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">REQ-REP-W1: Daily Chronological Breakdown Table</h3>
              <span className="text-xs text-slate-500">Grouped Mon–Sat</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-28">Day</th>
                    <th className="p-3">Task Title</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Push-To Env</th>
                    <th className="p-3">Owner & Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].flatMap(day => {
                    const items = previewData?.days?.[day] || [];
                    if (items.length === 0) return [];
                    return items.map(t => (
                      <tr key={t.id || t._id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-semibold text-slate-800">{day}</td>
                        <td className="p-3 font-medium text-slate-900">{t.title}</td>
                        <td className="p-3">
                          {['success', 'done', 'done_production'].includes(t.status) ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Achievement
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Active Plan
                            </span>
                          )}
                        </td>
                        <td className="p-3 uppercase text-[10px] font-bold text-slate-600">{t.status}</td>
                        <td className="p-3 text-slate-700 font-medium">{t.pushTo || 'Development'}</td>
                        <td className="p-3 text-slate-500">
                          <span className="font-semibold text-slate-700">{t.owner || 'Unassigned'}</span>
                          {t.remark ? ` - ${t.remark}` : ''}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
