import React from 'react';
import {
  today,
  getLocalTimeZone,
  isSameDay
} from '@internationalized/date';
import {
  LuPlus as Plus,
  LuCircleCheck as CheckCircle,
  LuClock as Clock,
  LuCircleAlert as AlertCircle,
  LuUser as User,
  LuTag as Tag,
  LuLayers as Layers
} from 'react-icons/lu';

const STATUS_SECTIONS = [
  { id: 'in_progress', label: 'In Progress', color: 'blue', icon: Clock },
  { id: 'testing', label: 'Testing / QA', color: 'amber', icon: AlertCircle },
  { id: 'success', label: 'QA Success', color: 'purple', icon: CheckCircle },
  { id: 'done', label: 'Completed', color: 'emerald', icon: CheckCircle },
  { id: 'done_production', label: 'Done Production', color: 'teal', icon: CheckCircle },
  { id: 'backlog', label: 'Backlog / Open', color: 'slate', icon: Layers },
  { id: 'feedback', label: 'Feedback / Issue', color: 'rose', icon: AlertCircle }
];

export function CalendarDayView({ value, tasks = [], onSelectTask, onAddTaskOnDate }) {
  const localTimeZone = getLocalTimeZone();
  const currentToday = today(localTimeZone);
  const dateStr = value.toString();
  const isCurrentDay = isSameDay(value, currentToday);

  // Filter tasks for this exact date
  const dayTasks = React.useMemo(() => {
    return tasks.filter(t => t.date && t.date.substring(0, 10) === dateStr);
  }, [tasks, dateStr]);

  return (
    <div className="w-full space-y-6">
      {/* Day Overview Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {isCurrentDay ? 'Today' : 'Selected Date'}
            </span>
            <span className="text-xs text-slate-400 font-mono">{dateStr}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {value.toDate(localTimeZone).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {dayTasks.length === 0
              ? 'No tasks scheduled for this day.'
              : `${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'} scheduled for this date.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddTaskOnDate && onAddTaskOnDate(dateStr)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Task for {dateStr}
        </button>
      </div>

      {/* Categorized Task Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUS_SECTIONS.map(({ id: statusKey, label, color, icon: Icon }) => {
          const sectionTasks = dayTasks.filter(t => {
            if (statusKey === 'in_progress') return t.status === 'in_progress' || t.status === 'progress';
            return t.status === statusKey;
          });

          return (
            <div key={statusKey} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                  <h3 className="text-xs font-bold text-slate-800">{label}</h3>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {sectionTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[380px] no-scrollbar">
                {sectionTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">None</p>
                ) : (
                  sectionTasks.map((task) => (
                    <div
                      key={task.id || task._id}
                      onClick={() => onSelectTask && onSelectTask(task)}
                      className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left space-y-2 cursor-pointer"
                    >
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>

                      {task.reason && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">{task.reason}</p>
                      )}

                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-600">{task.owner || 'Unassigned'}</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600">
                          {task.pushTo || 'General'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
