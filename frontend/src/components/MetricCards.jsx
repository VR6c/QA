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
      iconBg: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      ringColor: 'border-blue-200/80 hover:border-blue-300'
    },
    {
      label: 'Done Rate',
      value: `${doneRate}%`,
      hint: `${done} of ${total} tasks completed`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
      ringColor: 'border-emerald-200/80 hover:border-emerald-300',
      progress: doneRate
    },
    {
      label: 'In Progress',
      value: inProgress,
      hint: 'Active engineering work',
      icon: Clock,
      iconBg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      ringColor: 'border-amber-200/80 hover:border-amber-300'
    },
    {
      label: 'Feedback / Issues',
      value: feedback,
      hint: 'Blockers & bug reports',
      icon: AlertOctagon,
      iconBg: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
      ringColor: 'border-rose-200/80 hover:border-rose-300'
    },
    {
      label: 'Testing / QA',
      value: qaPipeline,
      hint: 'Under validation & passed',
      icon: TestTube,
      iconBg: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
      ringColor: 'border-violet-200/80 hover:border-violet-300'
    }
  ];

  return (
    <div className={`grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 ${isCompact ? 'gap-2.5' : 'gap-3.5'}`}>
      {metrics.map((m) => (
        <div 
          key={m.label}
          className={`glass-card rounded-2xl border ${m.ringColor} card-hover-transition flex flex-col justify-between ${
            isCompact ? 'p-3' : 'p-4'
          }`}
        >
          <div>
            <div className={`flex items-center justify-between ${isCompact ? 'mb-1.5' : 'mb-2.5'}`}>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {m.label}
              </span>
              <div className={`rounded-xl ${m.iconBg} ${isCompact ? 'p-1.5' : 'p-2.5'}`}>
                <m.icon className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </div>
            </div>
            <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-slate-900 tracking-tight`}>
              {m.value}
            </div>
          </div>

          <div className={`${isCompact ? 'mt-2 pt-2' : 'mt-3 pt-2.5'} border-t border-slate-100/80`}>
            {m.progress !== undefined ? (
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
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
