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
      // 1. My Tasks Only Filter: Matches tasks created by current user OR assigned to current user
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
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial ${
                viewMode === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Month
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial ${
                viewMode === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Week
            </button>

            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial ${
                viewMode === 'day' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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

            {/* Quick Toggle: My Tasks Only */}
            <button
              onClick={() => setMyTasksOnly(!myTasksOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                myTasksOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              My Tasks Only
            </button>
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
        <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col">
          {/* Agenda Header */}
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Agenda</span>
              <span className="text-xs font-mono text-slate-400">{selectedDateStr}</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {selectedDate.toDate(localTimeZone).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {agendaTasks.length} task{agendaTasks.length === 1 ? '' : 's'} scheduled
            </p>
          </div>

          {/* Add Task Button for Selected Date */}
          <button
            onClick={() => handleAddTaskOnDate(selectedDateStr)}
            className="w-full py-2 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Add Task on {selectedDateStr}
          </button>

          {/* Agenda Task List */}
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[480px] no-scrollbar">
            {agendaTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium">No tasks scheduled on this date.</p>
                <p className="text-[11px] text-slate-400">Click above to schedule a new task.</p>
              </div>
            ) : (
              agendaTasks.map((t) => (
                <div
                  key={t.id || t._id}
                  onClick={() => handleSelectTask(t)}
                  className="p-3 bg-slate-50/80 hover:bg-blue-50/60 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer text-left space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                        t.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : t.status === 'testing'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">
                      {t.pushTo || 'General'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{t.title}</h4>

                  {t.owner && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {t.owner}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
