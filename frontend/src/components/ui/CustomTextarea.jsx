import React from 'react';
import { LuCircleAlert as AlertCircle } from 'react-icons/lu';

export default function CustomTextarea({
  value = '',
  onChange,
  placeholder = '',
  label,
  error,
  helperText,
  rows = 3,
  maxLength,
  disabled = false,
  readOnly = false,
  required = false,
  resizable = false,
  className = '',
  textareaClassName = '',
  fullWidth = true,
  ...props
}) {
  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2 bg-slate-50 border font-medium text-slate-900 placeholder-slate-400
            text-xs sm:text-sm rounded-lg transition-all duration-200 focus:outline-none focus:bg-white
            ${
              error
                ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }
            ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''}
            ${resizable ? 'resize-y' : 'resize-none'}
            ${textareaClassName}
          `}
          {...props}
        />
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
