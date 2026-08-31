import React from 'react';

export function CustomRadio({
  value,
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  color = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber' | 'rose'
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'default', // 'default' | 'card'
  className = '',
  name,
  ...props
}) {
  const outerRingMap = {
    blue: 'border-blue-600 bg-blue-600',
    emerald: 'border-emerald-600 bg-emerald-600',
    purple: 'border-purple-600 bg-purple-600',
    amber: 'border-amber-500 bg-amber-500',
    rose: 'border-rose-600 bg-rose-600',
  };

  const outerSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const innerDotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const isCard = variant === 'card';

  return (
    <label
      className={`
        inline-flex items-start select-none cursor-pointer transition-all duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${
          isCard
            ? `p-3 rounded-xl border ${
                checked
                  ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`
            : 'gap-2.5'
        }
        ${className}
      `}
    >
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange && onChange(value)}
          className="sr-only"
          {...props}
        />

        <div
          className={`
            rounded-full border transition-all duration-150 flex items-center justify-center
            ${outerSizes[size] || outerSizes.md}
            ${
              checked
                ? outerRingMap[color] || outerRingMap.blue
                : 'border-slate-300 bg-white hover:border-slate-400'
            }
          `}
        >
          {checked && (
            <div className={`rounded-full bg-white transition-transform ${innerDotSizes[size] || innerDotSizes.md}`} />
          )}
        </div>
      </div>

      {(label || description) && (
        <div className={`flex flex-col ${isCard ? 'ml-2.5' : ''}`}>
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

export function CustomRadioGroup({
  value,
  onChange,
  options = [],
  name,
  direction = 'vertical', // 'vertical' | 'horizontal'
  variant = 'default', // 'default' | 'card'
  color = 'blue',
  size = 'md',
  className = '',
  label,
  helperText,
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div
        className={`flex ${
          direction === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2.5'
        }`}
      >
        {options.map((opt) => (
          <CustomRadio
            key={opt.value}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={onChange}
            label={opt.label}
            description={opt.description}
            disabled={opt.disabled}
            color={color}
            size={size}
            variant={variant}
          />
        ))}
      </div>

      {helperText && (
        <p className="mt-1 text-[11px] text-slate-500 font-normal">{helperText}</p>
      )}
    </div>
  );
}

export default CustomRadio;
