import React from 'react';
import {
  today,
  getLocalTimeZone,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek
} from '@internationalized/date';
import { LuPlus as Plus, LuCircleCheck as CheckCircle, LuClock as Clock } from 'react-icons/lu';

const STATUS_COLORS = {
  done: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  testing: { bg: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  in_progress: { bg: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  backlog: { bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
  feedback: { bg: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' }
};

export function CalendarMonthView({ value, onChange, tasks = [], onSelectTask, onAddTaskOnDate }) {
  const localTimeZone = getLocalTimeZone();
  const currentToday = today(localTimeZone);
  const locale = 'en-US';

  // Build grid of dates for active month
  const monthStart = startOfMonth(value);
  const monthEnd = endOfMonth(value);
  const calendarStart = startOfWeek(monthStart, locale);
  const calendarEnd = endOfWeek(monthEnd, locale);

  const days = [];
  let curr = calendarStart;
  while (curr.compare(calendarEnd) <= 0) {
    days.push(curr);
    curr = curr.add({ days: 1 });
  }

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map tasks by date string YYYY-MM-DD
  const tasksByDate = React.useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.date) return;
      // Normalizing date to YYYY-MM-DD string
      const dStr = t.date.substring(0, 10);
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div className="w-full space-y-3">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-200 pb-2">
        {weekDayNames.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider py-0.5 ${
              idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="hidden sm:inline">{dayName}</span>
            <span className="sm:hidden">{dayName[0]}</span>
          </div>
        ))}
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
        {days.map((dateObj) => {
          const dateStr = dateObj.toString();
          const dayTasks = tasksByDate[dateStr] || [];
          const isSelected = isSameDay(dateObj, value);
          const isCurrentDay = isSameDay(dateObj, currentToday);
          const isCurrentMonth = isSameMonth(dateObj, value);

          return (
            <div
              key={dateStr}
              onClick={() => onChange(dateObj)}
              className={`min-h-[58px] sm:min-h-[115px] p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all duration-150 flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-400/30'
                  : isCurrentDay
                  ? 'bg-amber-50/40 border-amber-300'
                  : isCurrentMonth
                  ? 'bg-white hover:bg-slate-50 border-slate-200'
                  : 'bg-slate-50/60 border-slate-100 opacity-50'
              }`}
            >
              {/* Day Card Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                    isCurrentDay
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : isSelected
                      ? 'bg-blue-100 text-blue-800'
                      : isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {dateObj.day}
                </span>

                <div className="flex items-center gap-1">
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {dayTasks.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(dateObj);
                      if (onAddTaskOnDate) onAddTaskOnDate(dateStr);
                    }}
                    className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 text-blue-600 rounded-md transition-opacity cursor-pointer"
                    title={`Add task on ${dateStr}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Task Items / Pills */}
              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {/* Desktop/Tablet View: Full task pills with title */}
                <div className="hidden sm:block space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const style = STATUS_COLORS[task.status] || STATUS_COLORS.backlog;
                    return (
                      <div
                        key={task.id || task._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTask) onSelectTask(task);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 truncate hover:shadow-xs transition-shadow ${style.bg}`}
                        title={`${task.title} (${task.status})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] font-medium text-slate-500 hover:text-blue-600 pl-0.5">
                      +{dayTasks.length - 3} more
                    </p>
                  )}
                </div>

                {/* Mobile View (<640px): Compact task status dots */}
                <div className="sm:hidden flex flex-wrap gap-1 items-center pt-0.5">
                  {dayTasks.slice(0, 4).map((task) => {
                    const style = STATUS_COLORS[task.status] || STATUS_COLORS.backlog;
                    return (
                      <span
                        key={task.id || task._id}
                        className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}
                        title={task.title}
                      />
                    );
                  })}
                  {dayTasks.length > 4 && (
                    <span className="text-[8px] font-bold text-slate-400">
                      +{dayTasks.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
