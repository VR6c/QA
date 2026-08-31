import React, { useState, useRef } from 'react';
import { LuGripVertical as GripVertical } from 'react-icons/lu';

export function CustomDragWidget({
  id,
  title,
  subtitle,
  children,
  badgeText,
  className = '',
  headerAction,
  draggable = true,
  variant = 'default', // 'default' | 'glass' | 'gradient' | 'subtle' | 'elevated'
  theme = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'slate'
  rounded = 'rounded-2xl', // 'rounded-none' | 'rounded-lg' | 'rounded-2xl' | 'rounded-3xl'
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging = false,
  isOver = false,
}) {
  const themeStyles = {
    blue: {
      border: 'border-blue-200/80 hover:border-blue-400',
      badge: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'text-blue-600 bg-blue-50',
      subtleBg: 'bg-blue-50/40 border-blue-200/80'
    },
    emerald: {
      border: 'border-emerald-200/80 hover:border-emerald-400',
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'text-emerald-600 bg-emerald-50',
      subtleBg: 'bg-emerald-50/40 border-emerald-200/80'
    },
    purple: {
      border: 'border-purple-200/80 hover:border-purple-400',
      badge: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'text-purple-600 bg-purple-50',
      subtleBg: 'bg-purple-50/40 border-purple-200/80'
    },
    amber: {
      border: 'border-amber-200/80 hover:border-amber-400',
      badge: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'text-amber-600 bg-amber-50',
      subtleBg: 'bg-amber-50/40 border-amber-200/80'
    },
    rose: {
      border: 'border-rose-200/80 hover:border-rose-400',
      badge: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'text-rose-600 bg-rose-50',
      subtleBg: 'bg-rose-50/40 border-rose-200/80'
    },
    slate: {
      border: 'border-slate-200/80 hover:border-slate-400',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      accent: 'text-slate-600 bg-slate-100',
      subtleBg: 'bg-slate-50/60 border-slate-200/80'
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles.blue;

  const variantCardClasses = {
    default: `bg-white border ${currentTheme.border} shadow-xs`,
    glass: `bg-white/75 backdrop-blur-md border border-white/60 shadow-md text-slate-800`,
    gradient: `bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white border border-slate-700/80 shadow-xl`,
    subtle: `${currentTheme.subtleBg} shadow-2xs`,
    elevated: `bg-white border border-slate-200/80 shadow-lg hover:shadow-xl`
  };

  const isDarkGradient = variant === 'gradient';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`
        ${rounded} transition-all duration-200 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing
        ${variantCardClasses[variant] || variantCardClasses.default}
        ${isDragging ? 'opacity-40 border-dashed border-blue-500 ring-2 ring-blue-400 scale-[0.98]' : 'opacity-100'}
        ${isOver ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md bg-blue-50/20' : ''}
        ${className}
      `}
    >
      {/* Widget Header with Drag Handle */}
      <div className={`px-4 py-3 border-b flex items-center justify-between select-none group ${
        isDarkGradient 
          ? 'bg-slate-900/50 border-slate-700/60 text-white' 
          : 'bg-slate-50/70 border-slate-100 text-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded transition-colors ${
            isDarkGradient 
              ? 'text-slate-400 hover:text-white hover:bg-slate-700/60' 
              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
          }`}>
            <GripVertical className="w-4.5 h-4.5" />
          </div>

          <div>
            {title && (
              <h4 className={`text-xs sm:text-sm font-bold tracking-tight ${
                isDarkGradient ? 'text-white' : 'text-slate-800'
              }`}>
                {title}
              </h4>
            )}
            {subtitle && (
              <p className={`text-[11px] font-normal ${
                isDarkGradient ? 'text-slate-400' : 'text-slate-400'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {badgeText && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTheme.badge}`}>
              {badgeText}
            </span>
          )}
          {headerAction}
        </div>
      </div>

      {/* Widget Content Body */}
      <div className="p-4 flex-1 pointer-events-auto">{children}</div>
    </div>
  );
}

export function CustomWidgetGrid({
  widgets = [],
  onReorder,
  columns = 2, // 1 | 2 | 3 | 4
  className = '',
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const [activeDragIndex, setActiveDragIndex] = useState(null);
  const [activeOverIndex, setActiveOverIndex] = useState(null);

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setActiveDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {
      // Fallback
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragItem.current !== null && dragItem.current !== index) {
      dragOverItem.current = index;
      setActiveOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setActiveDragIndex(null);
    setActiveOverIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null) {
      handleDragEnd();
      return;
    }

    const sourceIdx = dragItem.current;
    const targetIdx = dragOverItem.current;

    if (sourceIdx !== targetIdx) {
      const updatedWidgets = [...widgets];
      const [draggedCard] = updatedWidgets.splice(sourceIdx, 1);
      updatedWidgets.splice(targetIdx, 0, draggedCard);

      if (onReorder) {
        onReorder(updatedWidgets);
      }
    }

    handleDragEnd();
  };

  return (
    <div className={`grid gap-4 ${columnClasses[columns] || columnClasses[2]} ${className}`}>
      {widgets.map((widget, index) => (
        <CustomDragWidget
          key={widget.id || index}
          id={widget.id}
          title={widget.title}
          subtitle={widget.subtitle}
          badgeText={widget.badgeText}
          variant={widget.variant || 'default'}
          theme={widget.theme || 'blue'}
          rounded={widget.rounded || 'rounded-2xl'}
          className={widget.className || ''}
          isDragging={activeDragIndex === index}
          isOver={activeOverIndex === index}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        >
          {widget.content}
        </CustomDragWidget>
      ))}
    </div>
  );
}

export default CustomWidgetGrid;
