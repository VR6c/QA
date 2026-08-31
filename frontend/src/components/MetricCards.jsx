import React from 'react';
import { 
  LuClipboardList as ClipboardList, 
  LuCircleCheck as CheckCircle2, 
  LuClock as Clock, 
  LuOctagonAlert as AlertOctagon, 
  LuTestTube as TestTube 
} from 'react-icons/lu';
import useUIStore from '../stores/uiStore';

export default function MetricCards({ tasks = [] }) {
  const { dashboardDensity } = useUIStore();
  const isCompact = dashboardDensity === 'compact';

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done' || t.status === 'done_production').length;
  const inProgress = tasks.filter(t => t.status === 'progress').length;
  const feedback = tasks.filter(t => t.status === 'feedback').length;
  const qaPipeline = tasks.filter(t => t.status === 'testing' || t.status === 'success').length;
  
  const doneRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const metrics = [
    {
      label: 'Total Tasks',
      value: total,
      hint: 'In active filter set',
      icon: ClipboardList,
      iconBg: 'bg-blue-50 text-blue-600',
      ringColor: 'border-blue-200'
    },
    {
      label: 'Done Rate',
      value: `${doneRate}%`,
      hint: `${done} of ${total} tasks completed`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      ringColor: 'border-emerald-200',
      progress: doneRate
    },
    {
      label: 'In Progress',
      value: inProgress,
      hint: 'Active engineering work',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      ringColor: 'border-amber-200'
    },
    {
      label: 'Feedback / Issues',
      value: feedback,
      hint: 'Blockers & bug reports',
      icon: AlertOctagon,
      iconBg: 'bg-rose-50 text-rose-600',
      ringColor: 'border-rose-200'
    },
    {
      label: 'Testing / QA',
      value: qaPipeline,
      hint: 'Under validation & passed',
      icon: TestTube,
      iconBg: 'bg-violet-50 text-violet-600',
      ringColor: 'border-violet-200'
    }
  ];

  return (
    <div className={`grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 ${isCompact ? 'gap-2.5' : 'gap-3.5'}`}>
      {metrics.map((m) => (
        <div 
          key={m.label}
          className={`bg-white rounded-xl border ${m.ringColor} shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
            isCompact ? 'p-2.5' : 'p-4'
          }`}
        >
          <div>
            <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-2'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {m.label}
              </span>
              <div className={`rounded-lg ${m.iconBg} ${isCompact ? 'p-1.5' : 'p-2'}`}>
                <m.icon className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </div>
            </div>
            <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-slate-900 tracking-tight`}>
              {m.value}
            </div>
          </div>

          <div className={`${isCompact ? 'mt-2 pt-1.5' : 'mt-3 pt-2'} border-t border-slate-100`}>
            {m.progress !== undefined ? (
              <div className="space-y-1">
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">{m.hint}</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 font-medium leading-tight">{m.hint}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
