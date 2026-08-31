import React from 'react';
import { LuX as X, LuCircleAlert as AlertCircle } from 'react-icons/lu';

export default function CustomInput({
  type = 'text',
  value = '',
  onChange,
  onClear,
  placeholder = '',
  label,
  error,
  helperText,
  disabled = false,
  readOnly = false,
  required = false,
  maxLength,
  size = 'md', // 'sm' | 'md' | 'lg'
  iconLeft: IconLeft,
  iconRight: IconRight,
  className = '',
  inputClassName = '',
  fullWidth = true,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md',
    md: 'px-3 py-2 text-xs sm:text-sm rounded-lg',
    lg: 'px-4 py-2.5 text-sm rounded-xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const leftPadding = IconLeft
    ? size === 'sm'
      ? 'pl-8'
      : size === 'lg'
      ? 'pl-11'
      : 'pl-9'
    : '';

  const rightPadding = (IconRight || (onClear && value))
    ? size === 'sm'
      ? 'pr-8'
      : size === 'lg'
      ? 'pr-11'
      : 'pr-9'
    : '';

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {IconLeft && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {typeof IconLeft === 'function' ? <IconLeft className={iconSizes[size] || iconSizes.md} /> : IconLeft}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={`
            w-full bg-slate-50 border font-medium text-slate-900 placeholder-slate-400
            transition-all duration-200 focus:outline-none focus:bg-white
            ${
              error
                ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }
            ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''}
            ${sizeClasses[size] || sizeClasses.md}
            ${leftPadding}
            ${rightPadding}
            ${inputClassName}
          `}
          {...props}
        />

        {onClear && value && !disabled && !readOnly && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {!onClear && IconRight && (
          <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {typeof IconRight === 'function' ? <IconRight className={iconSizes[size] || iconSizes.md} /> : IconRight}
          </div>
        )}
      </div>

      {(error || helperText || maxLength) && (
        <div className="mt-1 flex items-center justify-between text-[11px]">
          {error ? (
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {error}
            </span>
          ) : helperText ? (
            <span className="text-slate-500 font-normal">{helperText}</span>
          ) : <span />}

          {maxLength && (
            <span className="text-slate-400 text-[10px] ml-auto">
              {String(value).length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
