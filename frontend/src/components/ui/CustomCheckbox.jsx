import React, { useEffect, useRef } from 'react';
import { LuCheck as Check, LuMinus as Minus } from 'react-icons/lu';

export default function CustomCheckbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  color = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber' | 'rose'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const colorMap = {
    blue: 'bg-blue-600 border-blue-600 focus:ring-blue-500/30',
    emerald: 'bg-emerald-600 border-emerald-600 focus:ring-emerald-500/30',
    purple: 'bg-purple-600 border-purple-600 focus:ring-purple-500/30',
    amber: 'bg-amber-500 border-amber-500 focus:ring-amber-500/30',
    rose: 'bg-rose-600 border-rose-600 focus:ring-rose-500/30',
  };

  const boxSizes = {
    sm: 'w-3.5 h-3.5 rounded',
    md: 'w-4 h-4 rounded-md',
    lg: 'w-5 h-5 rounded-md',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  const isCheckedOrIndeterminate = checked || indeterminate;

  return (
    <label
      className={`inline-flex items-start gap-2.5 select-none cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          className={`
            border transition-all duration-150 flex items-center justify-center text-white shadow-xs
            ${boxSizes[size] || boxSizes.md}
            ${
              isCheckedOrIndeterminate
                ? colorMap[color] || colorMap.blue
                : 'bg-white border-slate-300 hover:border-slate-400'
            }
          `}
        >
          {indeterminate ? (
            <Minus className={`${iconSizes[size] || iconSizes.md} stroke-[3]`} />
          ) : checked ? (
            <Check className={`${iconSizes[size] || iconSizes.md} stroke-[3]`} />
          ) : null}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-slate-500 font-normal mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
