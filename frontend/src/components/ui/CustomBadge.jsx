import React from 'react';
import { LuX as X } from 'react-icons/lu';

export default function CustomBadge({
  children,
  variant = 'blue', // 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'teal'
  size = 'md', // 'sm' | 'md' | 'lg'
  dot = false,
  pulse = false,
  onDismiss,
  className = '',
}) {
  const variantMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
  };

  const dotColorMap = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-500',
    teal: 'bg-teal-500',
  };

  const sizeMap = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-full',
    lg: 'text-xs sm:text-sm px-3 py-1 font-bold rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${sizeMap[size] || sizeMap.md} ${
        variantMap[variant] || variantMap.blue
      } ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dotColorMap[variant] || 'bg-blue-400'
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              dotColorMap[variant] || 'bg-blue-500'
            }`}
          />
        </span>
      )}

      <span>{children}</span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-0.5 hover:opacity-75 focus:outline-none transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
