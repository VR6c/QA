import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

export default function CustomTabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'segment', // 'segment' | 'pill' | 'underline'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  buttonClassName = '',
  labelClassName = '',
}) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const containerRef = useRef(null);
  const tabRefs = useRef({});

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-sm sm:text-base px-4 py-2 gap-2.5',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  const updateIndicator = () => {
    const activeEl = tabRefs.current[activeTab];
    const containerEl = containerRef.current;
    if (activeEl && containerEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeTab, tabs]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab, tabs]);

  if (variant === 'segment') {
    return (
      <div
        ref={containerRef}
        className={`relative inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 select-none ${className}`}
      >
        {/* Animated Sliding White Pill Indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-xs border border-slate-200/50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[tab.id] = el)}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`relative z-10 flex items-center justify-center font-semibold rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap active:scale-95 ${
                sizeClasses[size]
              } ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
              title={tab.label}
            >
              {Icon && (
                <Icon
                  className={`${iconSizeClasses[size]} shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-blue-600' : 'text-slate-500'
                  }`}
                />
              )}
              <span className={labelClassName}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div
        ref={containerRef}
        className={`relative flex items-center border-b border-slate-200 gap-1 sm:gap-4 select-none ${className}`}
      >
        {/* Animated Sliding Underline Indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[tab.id] = el)}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`relative z-10 flex items-center gap-2 py-2.5 px-2 text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer active:scale-95 ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
              title={tab.label}
            >
              {Icon && (
                <Icon
                  className={`${iconSizeClasses[size]} shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-blue-600' : 'text-slate-400'
                  }`}
                />
              )}
              <span className={labelClassName}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'pill' variant
  return (
    <div
      ref={containerRef}
      className={`relative flex flex-wrap items-center gap-1.5 select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center font-medium rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
              sizeClasses[size]
            } ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs font-semibold scale-[1.02]'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
            title={tab.label}
          >
            {Icon && (
              <Icon
                className={`${iconSizeClasses[size]} shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
              />
            )}
            <span className={labelClassName}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

