import React from 'react';

export function CustomCard({
  children,
  variant = 'border', // 'flat' | 'border' | 'shadow' | 'hover' | 'glass'
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) {
  const variantClasses = {
    flat: 'bg-slate-50 border-none',
    border: 'bg-white border border-slate-200/80 shadow-xs',
    shadow: 'bg-white border border-slate-200/50 shadow-md',
    hover: 'bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200',
    glass: 'bg-white/80 backdrop-blur-md border border-white/40 shadow-sm',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6 sm:p-7',
  };

  return (
    <div
      className={`rounded-2xl transition-all ${variantClasses[variant] || variantClasses.border} ${
        paddingClasses[padding] || paddingClasses.md
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col space-y-1 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base font-bold text-slate-900 tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-slate-500 font-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`flex items-center justify-between pt-4 border-t border-slate-100 mt-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default CustomCard;
