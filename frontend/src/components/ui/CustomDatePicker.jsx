import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  LuCalendar as CalendarIcon,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuClock as ClockIcon,
  LuX as XIcon,
  LuCheck as CheckIcon,
  LuArrowRight as ArrowRightIcon
} from 'react-icons/lu';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  parseISO,
  isValid
} from 'date-fns';

// Helper to safely convert string/Date to valid Date object
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isValid(val) ? val : null;
  if (typeof val === 'string') {
    const parsed = parseISO(val);
    if (isValid(parsed)) return parsed;
    const fallback = new Date(val);
    return isValid(fallback) ? fallback : null;
  }
  return null;
};

// Preset helper generators for range mode
const GET_RANGE_PRESETS = (today = new Date()) => [
  {
    label: 'Today',
    getValue: () => ({
      from: startOfDay(today),
      to: endOfDay(today)
    })
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const y = subDays(today, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
  },
  {
    label: 'This Week',
    getValue: () => {
      const mon = startOfWeek(today, { weekStartsOn: 1 });
      const sat = addDays(mon, 5);
      return {
        from: startOfDay(mon),
        to: endOfDay(sat)
      };
    }
  },
  {
    label: 'Next Week',
    getValue: () => {
      const nextW = addWeeks(today, 1);
      const mon = startOfWeek(nextW, { weekStartsOn: 1 });
      const sat = addDays(mon, 5);
      return {
        from: startOfDay(mon),
        to: endOfDay(sat)
      };
    }
  },
  {
    label: 'Last Week',
    getValue: () => {
      const prevW = subWeeks(today, 1);
      const mon = startOfWeek(prevW, { weekStartsOn: 1 });
      const sat = addDays(mon, 5);
      return {
        from: startOfDay(mon),
        to: endOfDay(sat)
      };
    }
  },
  {
    label: 'Next 7 Days',
    getValue: () => ({
      from: startOfDay(today),
      to: endOfDay(addDays(today, 6))
    })
  },
  {
    label: 'Last 7 Days',
    getValue: () => ({
      from: startOfDay(subDays(today, 6)),
      to: endOfDay(today)
    })
  },
  {
    label: 'Next 30 Days',
    getValue: () => ({
      from: startOfDay(today),
      to: endOfDay(addDays(today, 29))
    })
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      from: startOfDay(subDays(today, 29)),
      to: endOfDay(today)
    })
  },
  {
    label: 'This Month',
    getValue: () => ({
      from: startOfMonth(today),
      to: endOfMonth(today)
    })
  },
  {
    label: 'Next Month',
    getValue: () => {
      const nextM = addMonths(today, 1);
      return {
        from: startOfMonth(nextM),
        to: endOfMonth(nextM)
      };
    }
  },
  {
    label: 'Last Month',
    getValue: () => {
      const prevM = subMonths(today, 1);
      return {
        from: startOfMonth(prevM),
        to: endOfMonth(prevM)
      };
    }
  }
];

export default function CustomDatePicker({
  mode = 'single', // 'single' | 'range'
  value = null, // Single: 'YYYY-MM-DD' or Date. Range: { from: 'YYYY-MM-DD'|Date, to: 'YYYY-MM-DD'|Date }
  onChange,
  enablePresets = true,
  enableTime = false,
  timeValue = '12:00', // 'HH:mm' string format
  onTimeChange,
  placeholder = mode === 'range' ? 'Select date range' : 'Pick a date',
  direction = 'ltr', // 'ltr' | 'rtl'
  disabled = false,
  isClearable = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'outline', // 'outline' | 'solid' | 'subtle'
  align = 'auto', // 'auto' | 'left' | 'right'
  className = '',
  popoverClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [effectiveAlign, setEffectiveAlign] = useState(align === 'auto' ? 'left' : align);
  const [coords, setCoords] = useState({ top: 0, bottom: 'auto', left: 0, right: 'auto' });

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse single value
  const singleDate = useMemo(() => {
    if (mode === 'single') return toDate(value);
    return null;
  }, [mode, value]);

  // Parse range value
  const rangeDate = useMemo(() => {
    if (mode === 'range' && value && typeof value === 'object') {
      return {
        from: toDate(value.from),
        to: toDate(value.to)
      };
    }
    return { from: null, to: null };
  }, [mode, value]);

  // Active month state for calendar navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (mode === 'single' && singleDate) return singleDate;
    if (mode === 'range' && rangeDate.from) return rangeDate.from;
    return new Date();
  });

  // Time state (12-hour format for selector)
  const [selectedTime, setSelectedTime] = useState(() => {
    if (timeValue) {
      const [h, m] = timeValue.split(':');
      let hours = parseInt(h, 10) || 12;
      const minutes = m ? parseInt(m, 10) || 0 : 0;
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return { hours: String(hours).padStart(2, '0'), minutes: String(minutes).padStart(2, '0'), period };
    }
    return { hours: '12', minutes: '00', period: 'AM' };
  });

  // Position calculation relative to trigger button
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = mode === 'range' ? 420 : 360;
    const placement = spaceBelow < popoverHeight && rect.top > popoverHeight ? 'top' : 'bottom';

    const isMobile = window.innerWidth < 640;
    const popoverWidth = isMobile ? Math.min(340, window.innerWidth - 24) : (mode === 'range' && enablePresets ? 480 : 320);

    let isRight = align === 'right';
    if (align === 'auto') {
      isRight = rect.left + popoverWidth > window.innerWidth - 16;
    }

    let leftPos = isRight ? 'auto' : Math.max(8, Math.min(rect.left, window.innerWidth - popoverWidth - 8));
    let rightPos = isRight ? Math.max(8, Math.min(window.innerWidth - rect.right, window.innerWidth - popoverWidth - 8)) : 'auto';

    if (isMobile) {
      leftPos = Math.max(8, (window.innerWidth - popoverWidth) / 2);
      rightPos = 'auto';
    }

    setCoords({
      top: placement === 'bottom' ? rect.bottom + 6 : 'auto',
      bottom: placement === 'top' ? window.innerHeight - rect.top + 6 : 'auto',
      left: leftPos,
      right: rightPos,
    });
    setEffectiveAlign(isRight ? 'right' : 'left');
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Sync internal month view when value changes from outside
  useEffect(() => {
    if (mode === 'single' && singleDate) {
      setCurrentMonth(singleDate);
    } else if (mode === 'range' && rangeDate.from) {
      setCurrentMonth(rangeDate.from);
    }
  }, [singleDate, rangeDate.from, mode]);

  // Days grid generation for current month view
  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  // Single date click handler
  const handleSelectDay = (day) => {
    if (disabled) return;

    if (mode === 'single') {
      const formatted = format(day, 'yyyy-MM-dd');
      onChange && onChange(formatted, day);
      if (!enableTime) setIsOpen(false);
    } else if (mode === 'range') {
      const { from, to } = rangeDate;

      if (!from || (from && to)) {
        // Start a new range
        const newFromStr = format(day, 'yyyy-MM-dd');
        onChange && onChange({ from: newFromStr, to: null });
      } else if (from && !to) {
        if (isBefore(day, from)) {
          // If clicked date is before start date, reset start date
          const newFromStr = format(day, 'yyyy-MM-dd');
          onChange && onChange({ from: newFromStr, to: null });
        } else {
          // Complete range selection
          const fromStr = format(from, 'yyyy-MM-dd');
          const toStr = format(day, 'yyyy-MM-dd');
          onChange && onChange({ from: fromStr, to: toStr });
          setIsOpen(false);
        }
      }
    }
  };

  // Preset click handler
  const handleApplyPreset = (preset) => {
    const { from, to } = preset.getValue();
    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');
    onChange && onChange({ from: fromStr, to: toStr });
    setCurrentMonth(from);
    setIsOpen(false);
  };

  // Clear date selection
  const handleClear = (e) => {
    e.stopPropagation();
    if (mode === 'single') {
      onChange && onChange('');
    } else {
      onChange && onChange({ from: null, to: null });
    }
  };

  // Time change handler
  const handleTimeChange = (type, val) => {
    const updated = { ...selectedTime, [type]: val };
    setSelectedTime(updated);

    let h = parseInt(updated.hours, 10);
    if (updated.period === 'PM' && h < 12) h += 12;
    if (updated.period === 'AM' && h === 12) h = 0;

    const formattedTime = `${String(h).padStart(2, '0')}:${updated.minutes}`;
    onTimeChange && onTimeChange(formattedTime);
  };

  // Formatting display label for button
  const displayLabel = useMemo(() => {
    if (mode === 'single') {
      if (!singleDate) return null;
      let labelStr = format(singleDate, 'PPP'); // e.g. "Aug 29th, 2026"
      if (enableTime && selectedTime) {
        labelStr += ` at ${selectedTime.hours}:${selectedTime.minutes} ${selectedTime.period}`;
      }
      return labelStr;
    }

    if (mode === 'range') {
      const { from, to } = rangeDate;
      if (!from && !to) return null;
      if (from && !to) return `${format(from, 'MMM d, yyyy')} - ...`;
      if (from && to) return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
    }

    return null;
  }, [mode, singleDate, rangeDate, enableTime, selectedTime]);

  // Size styling maps
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md min-h-[32px]',
    md: 'px-3.5 py-2 text-sm rounded-lg min-h-[40px]',
    lg: 'px-4 py-2.5 text-base rounded-xl min-h-[48px]'
  };

  const variantClasses = {
    outline: 'bg-white border border-slate-200 hover:border-slate-300 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20',
    solid: 'bg-slate-100 border border-transparent hover:bg-slate-200/80 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20',
    subtle: 'bg-blue-50/60 border border-blue-100 hover:bg-blue-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
  };

  const presets = useMemo(() => GET_RANGE_PRESETS(new Date()), []);
  const isRTL = direction === 'rtl';

  const popoverMenuContent = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      dir={direction}
      style={{
        position: 'fixed',
        top: coords.top !== 'auto' ? `${coords.top}px` : 'auto',
        bottom: coords.bottom !== 'auto' ? `${coords.bottom}px` : 'auto',
        left: coords.left !== 'auto' ? `${coords.left}px` : 'auto',
        right: coords.right !== 'auto' ? `${coords.right}px` : 'auto',
      }}
      className={`z-[9999] bg-white backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 max-w-none overflow-hidden ${popoverClassName}`}
    >
      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 max-w-full sm:min-w-max">
        {/* Presets Sidebar (Range Mode only) */}
        {mode === 'range' && enablePresets && (
          <div className="p-3 bg-slate-50/70 w-full sm:w-44 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-100 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
            <div className="px-2 py-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Presets
            </div>
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <span>{preset.label}</span>
                  <ArrowRightIcon className={`w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Main Grid Container */}
        <div className="p-4 sm:p-5 w-[300px] shrink-0">
          {/* Header Month & Year Navigation */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <h3 className="text-sm font-bold text-slate-800 text-center flex-1">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Day Name Labels Header (Su Mo Tu We Th Fr Sa) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="w-9 h-8 flex items-center justify-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs justify-items-center">
            {daysInGrid.map((day, idx) => {
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const isTodayDay = isSameDay(day, new Date());

              // Single selection status
              const isSingleSelected = mode === 'single' && singleDate && isSameDay(day, singleDate);

              // Range selection status
              const { from, to } = rangeDate;
              const isRangeStart = from && isSameDay(day, from);
              const isRangeEnd = to && isSameDay(day, to);
              const isRangeSelected = from && to && isWithinInterval(day, { start: from, end: to });
              const isHoverRange =
                from &&
                !to &&
                hoverDate &&
                isAfter(hoverDate, from) &&
                isWithinInterval(day, { start: from, end: hoverDate });

              let dayClasses = 'w-9 h-9 flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none rounded-lg ';

              if (!isCurrentMonthDay) {
                dayClasses += 'text-slate-300 hover:bg-slate-50 ';
              } else if (isSingleSelected) {
                dayClasses += 'bg-blue-600 text-white font-bold shadow-xs scale-105 z-10 rounded-lg ';
              } else if (isRangeStart) {
                dayClasses += 'bg-blue-600 text-white font-bold shadow-xs z-10 rounded-l-lg rounded-r-none ';
              } else if (isRangeEnd) {
                dayClasses += 'bg-blue-600 text-white font-bold shadow-xs z-10 rounded-r-lg rounded-l-none ';
              } else if (isRangeSelected) {
                dayClasses += 'bg-blue-100 text-blue-900 font-semibold rounded-none w-full ';
              } else if (isHoverRange) {
                dayClasses += 'bg-blue-50 text-blue-700 rounded-none w-full ';
              } else if (isTodayDay) {
                dayClasses += 'bg-slate-100 text-blue-600 font-bold border border-blue-300/80 ';
              } else {
                dayClasses += 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 ';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  onMouseEnter={() => mode === 'range' && setHoverDate(day)}
                  onMouseLeave={() => mode === 'range' && setHoverDate(null)}
                  className={dayClasses}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Time Selector Footer (if enableTime is true) */}
          {enableTime && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <ClockIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Time</span>
              </div>

              <div className="flex items-center gap-1">
                {/* Hours Select */}
                <select
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const val = String(i + 1).padStart(2, '0');
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>

                <span className="text-slate-400 font-bold">:</span>

                {/* Minutes Select */}
                <select
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* AM/PM Select */}
                <select
                  value={selectedTime.period}
                  onChange={(e) => handleTimeChange('period', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-xs font-semibold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={containerRef}
      dir={direction}
      className={`relative inline-block w-full text-slate-800 ${className}`}
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`flex w-full items-center justify-between font-medium transition-all duration-150 text-left ${
          sizeClasses[size] || sizeClasses.md
        } ${variantClasses[variant] || variantClasses.outline} ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden pr-1">
          <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
          {displayLabel ? (
            <span className="truncate text-slate-900 font-medium">{displayLabel}</span>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isClearable && displayLabel && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <XIcon className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Popover Portal */}
      {popoverMenuContent}
    </div>
  );
}
