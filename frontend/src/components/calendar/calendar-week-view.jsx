import React from 'react';
import {
  today,
  getLocalTimeZone,
  isSameDay,
  startOfWeek,
  endOfWeek
} from '@internationalized/date';
import { LuPlus as Plus, LuCircleCheck as CheckCircle, LuClock as Clock, LuUser as User } from 'react-icons/lu';

const STATUS_BADGES = {
  done: { label: 'Done', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  testing: { label: 'Testing', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  backlog: { label: 'Backlog', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  feedback: { label: 'Feedback', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
};

export function CalendarWeekView({ value, onChange, tasks = [], onSelectTask, onAddTaskOnDate }) {
  const localTimeZone = getLocalTimeZone();
  const currentToday = today(localTimeZone);
  const locale = 'en-US';

  const weekStart = startOfWeek(value, locale);
  const weekEnd = endOfWeek(value, locale);

  const days = [];
  let curr = weekStart;
  while (curr.compare(weekEnd) <= 0) {
    days.push(curr);
    curr = curr.add({ days: 1 });
  }

  const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const tasksByDate = React.useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.date) return;
      const dStr = t.date.substring(0, 10);
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div className="w-full space-y-4">
      {/* 7-Day Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((dateObj, idx) => {
          const dateStr = dateObj.toString();
          const dayTasks = tasksByDate[dateStr] || [];
          const isSelected = isSameDay(dateObj, value);
          const isCurrentDay = isSameDay(dateObj, currentToday);

          return (
            <div
              key={dateStr}
              onClick={() => onChange(dateObj)}
              className={`rounded-2xl border p-3 flex flex-col min-h-[220px] transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-400/20'
                  : isCurrentDay
                  ? 'bg-amber-50/30 border-amber-300'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs'
              }`}
            >
              {/* Header for Day Column */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {weekDayNames[idx]}
                  </p>
                  <p className={`text-base font-extrabold ${isCurrentDay ? 'text-blue-600' : 'text-slate-800'}`}>
                    {dateObj.month}/{dateObj.day}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(dateObj);
                    if (onAddTaskOnDate) onAddTaskOnDate(dateStr);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title={`Add task on ${dateStr}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards in Day Column */}
              <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar max-h-[380px]">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-6">
                    <p className="text-xs text-slate-300 font-medium italic">No tasks</p>
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const badge = STATUS_BADGES[task.status] || STATUS_BADGES.backlog;
                    return (
                      <div
                        key={task.id || task._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTask) onSelectTask(task);
                        }}
                        className="bg-white p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-sm transition-all text-left space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {task.pushTo && (
                            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[60px]">
                              {task.pushTo}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                          {task.title}
                        </p>

                        {task.owner && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{task.owner}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
