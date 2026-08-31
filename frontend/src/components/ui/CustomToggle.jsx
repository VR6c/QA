import React from 'react';

export default function CustomToggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  color = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber' | 'rose'
  iconChecked: IconChecked,
  iconUnchecked: IconUnchecked,
  className = '',
}) {
  const colorMap = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    purple: 'bg-purple-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
  };

  const trackSizes = {
    sm: 'w-8 h-4.5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7.5',
  };

  const thumbSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const thumbCheckedPositions = {
    sm: 'translate-x-4',
    md: 'translate-x-5.5',
    lg: 'translate-x-7.5',
  };

  const thumbUncheckedPositions = {
    sm: 'translate-x-0.5',
    md: 'translate-x-0.5',
    lg: 'translate-x-0.5',
  };

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div
      onClick={handleToggleClick}
      className={`inline-flex items-start gap-3 select-none cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggleClick}
        className="relative inline-flex items-center shrink-0 mt-0.5 focus:outline-none cursor-pointer"
      >
        <div
          className={`rounded-full transition-colors duration-200 ${
            checked ? (colorMap[color] || colorMap.blue) : 'bg-slate-300'
          } ${trackSizes[size] || trackSizes.md}`}
        />
        <div
          className={`absolute rounded-full bg-white shadow-md transition-transform duration-200 ease-out flex items-center justify-center ${
            thumbSizes[size] || thumbSizes.md
          } ${checked ? thumbCheckedPositions[size] : thumbUncheckedPositions[size]}`}
        >
          {checked && IconChecked && <IconChecked className="w-3 h-3 text-slate-700" />}
          {!checked && IconUnchecked && <IconUnchecked className="w-3 h-3 text-slate-400" />}
        </div>
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs sm:text-sm font-semibold text-slate-800">{label}</span>}
          {description && (
            <span className="text-[11px] text-slate-500 font-normal">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
