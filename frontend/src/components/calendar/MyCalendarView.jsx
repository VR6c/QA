import React, { useState, useMemo } from 'react';
import {
  today,
  getLocalTimeZone,
  CalendarDate,
  parseDate,
  startOfMonth
} from '@internationalized/date';
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuCalendar as CalendarIcon,
  LuPlus as Plus,
  LuFilter as Filter,
  LuUser as User,
  LuCircleCheck as CheckCircle,
  LuClock as Clock,
  LuCircleAlert as AlertCircle,
  LuLayoutGrid as Grid,
  LuKanban as Columns,
  LuList as ListFilter,
  LuSparkles as Sparkles
} from 'react-icons/lu';
import { CalendarMonthView } from './calendar-month-view';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarDayView } from './calendar-day-view';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';
import { CustomSelect } from '../ui';
import { isUserOwnerMatch } from '../../lib/kpiConstants';

const STATUS_CONFIG = {
  done: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  testing: { label: 'Testing / QA', bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  backlog: { label: 'Backlog', bg: 'bg-slate-100 text-slate-700 border-slate-200/80', dot: 'bg-slate-400', bar: 'bg-slate-400' },
  feedback: { label: 'Feedback / Issue', bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500', bar: 'bg-rose-500' }
};

export default function MyCalendarView({ tasks = [], owners = [] }) {
  const localTimeZone = getLocalTimeZone();
  const currentUser = useAuthStore((state) => state.user);
  const { openModal } = useUIStore();

  // Initialize selectedDate with today's date using @internationalized/date
  const [selectedDate, setSelectedDate] = useState(() => today(localTimeZone));
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const selectedDateStr = selectedDate.toString();

  const ownerOptions = useMemo(() => [
    { value: 'all', label: 'All Owners' },
    ...owners.map((o) => ({ value: o.name, label: o.name }))
  ], [owners]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Statuses' },
    { value: 'in_progress', label: 'In Progress', colorBadge: 'bg-blue-500' },
    { value: 'testing', label: 'Testing / QA', colorBadge: 'bg-amber-500' },
    { value: 'done', label: 'Completed', colorBadge: 'bg-emerald-500' },
    { value: 'backlog', label: 'Backlog', colorBadge: 'bg-slate-400' },
    { value: 'feedback', label: 'Feedback / Issue', colorBadge: 'bg-rose-500' }
  ], []);

  // Filter tasks based on calendar toolbar controls
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. My Tasks Only Filter: Matches tasks created by or assigned to current user
      if (myTasksOnly && currentUser?.name) {
        const isCreator = isUserOwnerMatch(t.user, currentUser.name);
        const isOwner = isUserOwnerMatch(t.owner, currentUser.name);
        if (!isCreator && !isOwner) return false;
      }

      // 2. Owner Filter
      if (filterOwner !== 'all') {
        const isOwnerMatch = isUserOwnerMatch(t.owner, filterOwner);
        const isCreatorMatch = isUserOwnerMatch(t.user, filterOwner);
        if (!isOwnerMatch && !isCreatorMatch) return false;
      }

      // 3. Status Filter
      if (filterStatus !== 'all') {
        if (t.status !== filterStatus) return false;
      }

      return true;
    });
  }, [tasks, myTasksOnly, currentUser, filterOwner, filterStatus]);

  // Agenda tasks for selected date
  const agendaTasks = useMemo(() => {
    return filteredTasks.filter(
      (t) => t.date && t.date.substring(0, 10) === selectedDateStr
    );
  }, [filteredTasks, selectedDateStr]);

  // Handle Prev / Next navigation depending on current view mode
  const handlePrev = () => {
    if (viewMode === 'month') {
      setSelectedDate(selectedDate.subtract({ months: 1 }));
    } else if (viewMode === 'week') {
      setSelectedDate(selectedDate.subtract({ weeks: 1 }));
    } else {
      setSelectedDate(selectedDate.subtract({ days: 1 }));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setSelectedDate(selectedDate.add({ months: 1 }));
    } else if (viewMode === 'week') {
      setSelectedDate(selectedDate.add({ weeks: 1 }));
    } else {
      setSelectedDate(selectedDate.add({ days: 1 }));
    }
  };

  const handleToday = () => {
    setSelectedDate(today(localTimeZone));
  };

  const handleAddTaskOnDate = (dateString) => {
    openModal({ date: dateString || selectedDateStr });
  };

  const handleSelectTask = (task) => {
    openModal(task);
  };

  // Title display string for calendar header
  const headerDateLabel = useMemo(() => {
    const jsDate = selectedDate.toDate(localTimeZone);
    if (viewMode === 'month') {
      return jsDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      return `Week of ${jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return jsDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  }, [selectedDate, viewMode, localTimeZone]);

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Toolbar Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shadow-2xs shrink-0">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">My Calendar</h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
              Schedule, track date deadlines, and manage release events
            </p>
          </div>
        </div>

        {/* Middle Date Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto gap-2 bg-slate-50/80 sm:bg-transparent p-1.5 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-1.5 sm:p-2 rounded-xl bg-white sm:bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border sm:border-0 border-slate-200 shadow-2xs"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white sm:bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer border sm:border-0 border-slate-200 shadow-2xs"
            >
              Today
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 sm:p-2 rounded-xl bg-white sm:bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border sm:border-0 border-slate-200 shadow-2xs"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs sm:text-sm font-extrabold text-slate-800 text-right sm:text-center font-sans sm:min-w-[150px]">
            {headerDateLabel}
          </span>
        </div>

        {/* Right View Switcher & Add Task Button */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
          {/* View Mode Selector (Month / Week / Day) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex-1 sm:flex-initial justify-between sm:justify-start">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Month
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Week
            </button>

            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Day
            </button>
          </div>

          <button
            onClick={() => handleAddTaskOnDate(selectedDateStr)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            {/* Filter Icon */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Filters:
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Filter by Owner */}
            <div className="w-full sm:w-44">
              <CustomSelect
                value={filterOwner}
                onChange={setFilterOwner}
                options={ownerOptions}
                size="sm"
              />
            </div>

            {/* Filter by Status */}
            <div className="w-full sm:w-48">
              <CustomSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={statusOptions}
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium text-right sm:text-left pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
          Showing <span className="font-bold text-slate-800">{filteredTasks.length}</span> tasks in calendar
        </div>
      </div>

      {/* Main Calendar View Area + Agenda Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View Component (Month, Week, or Day) */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          {viewMode === 'month' && (
            <CalendarMonthView
              value={selectedDate}
              onChange={setSelectedDate}
              tasks={filteredTasks}
              onSelectTask={handleSelectTask}
              onAddTaskOnDate={handleAddTaskOnDate}
            />
          )}

          {viewMode === 'week' && (
            <CalendarWeekView
              value={selectedDate}
              onChange={setSelectedDate}
              tasks={filteredTasks}
              onSelectTask={handleSelectTask}
              onAddTaskOnDate={handleAddTaskOnDate}
            />
          )}

          {viewMode === 'day' && (
            <CalendarDayView
              value={selectedDate}
              tasks={filteredTasks}
              onSelectTask={handleSelectTask}
              onAddTaskOnDate={handleAddTaskOnDate}
            />
          )}
        </div>

        {/* Selected Date Agenda Sidebar */}
        <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col h-full min-h-[500px] overflow-hidden transition-all">
          {/* Premium Agenda Header Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 text-white shadow-sm">
            {/* Ambient Background Decorative Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-blue-300" />
                  Agenda
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  {selectedDateStr}
                </span>
              </div>

              <div className="pt-1">
                <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                  {selectedDate.toDate(localTimeZone).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </h3>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-300">
                  <span>Scheduled Tasks</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded-full bg-blue-600/80 text-[11px] border border-blue-400/40">
                    {agendaTasks.length} {agendaTasks.length === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action: Add Task for Selected Date */}
          <button
            onClick={() => handleAddTaskOnDate(selectedDateStr)}
            className="w-full py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md active:scale-[0.99] cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
            <span>Add Task on {selectedDateStr}</span>
          </button>

          {/* Agenda Tasks List Container (Fits up to 10 cards before scrolling) */}
          <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5 max-h-[720px] custom-scrollbar">
            {agendaTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">No Tasks Scheduled</p>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-[180px]">
                    No task deadline or schedule set for this date.
                  </p>
                </div>
                <button
                  onClick={() => handleAddTaskOnDate(selectedDateStr)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  + Create Task
                </button>
              </div>
            ) : (
              agendaTasks.map((t) => {
                const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.backlog;
                return (
                  <div
                    key={t.id || t._id}
                    onClick={() => handleSelectTask(t)}
                    className="group relative p-2.5 bg-white hover:bg-blue-50/40 rounded-xl border border-slate-200/80 hover:border-blue-400/80 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer text-left space-y-1.5 overflow-hidden shrink-0"
                  >
                    {/* Status Accent Bar on Left */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${statusInfo.bar}`} />

                    {/* Card Top Row: Status Badge & PushTo Environment */}
                    <div className="flex items-center justify-between gap-2 pl-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${statusInfo.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>

                      {t.pushTo && (
                        <span className="text-[10px] font-semibold font-mono text-slate-500 bg-slate-100 group-hover:bg-blue-100/60 group-hover:text-blue-700 px-2 py-0.5 rounded-md transition-colors truncate max-w-[90px]">
                          {t.pushTo}
                        </span>
                      )}
                    </div>

                    {/* Card Title */}
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 pl-1.5">
                      {t.title}
                    </h4>

                    {/* Card Footer: Owner Tag & Dev Deadline if present */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80 pl-1.5">
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <div className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 flex items-center justify-center font-bold text-[9px]">
                          {(t.owner || 'U')[0].toUpperCase()}
                        </div>
                        <span className="truncate max-w-[100px]">{t.owner || 'Unassigned'}</span>
                      </div>

                      {t.dateLineDev && (
                        <span className="flex items-center gap-1 font-mono text-[9.5px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          <Clock className="w-2.5 h-2.5 text-amber-500" />
                          {t.dateLineDev.substring(5, 16)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
