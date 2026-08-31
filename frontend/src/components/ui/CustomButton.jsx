import React from 'react';
import { LuLoader as Loader2 } from 'react-icons/lu';

export default function CustomButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'subtle'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm focus:ring-blue-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-sm focus:ring-slate-500/30',
    outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 focus:ring-slate-400/20',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 focus:ring-slate-400/20',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm focus:ring-rose-500/30',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm focus:ring-emerald-500/30',
    subtle: 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200/60 focus:ring-blue-500/20',
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-[11px] font-semibold rounded-md gap-1',
    sm: 'px-2.5 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg gap-2',
    lg: 'px-4 py-2.5 text-sm sm:text-base font-bold rounded-xl gap-2.5',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const isBtnDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isBtnDisabled}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-150 select-none
        focus:outline-none focus:ring-4 cursor-pointer
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${isBtnDisabled ? 'opacity-60 cursor-not-allowed shadow-none active:transform-none' : 'hover:-translate-y-0.5 active:translate-y-0'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`animate-spin ${iconSizes[size] || iconSizes.md}`} />
      ) : IconLeft ? (
        typeof IconLeft === 'function' ? <IconLeft className={iconSizes[size] || iconSizes.md} /> : IconLeft
      ) : null}

      <span>{children}</span>

      {!isLoading && IconRight && (
        typeof IconRight === 'function' ? <IconRight className={iconSizes[size] || iconSizes.md} /> : IconRight
      )}
    </button>
  );
}
