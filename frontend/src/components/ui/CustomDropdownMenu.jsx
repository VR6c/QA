import React, { useState } from 'react';
import { useClickOutside } from './useClickOutside';

export default function CustomDropdownMenu({
  trigger,
  items = [],
  align = 'right', // 'left' | 'right'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useClickOutside(() => setIsOpen(false));

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Menu dropdown */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`divider-${index}`} className="my-1 border-t border-slate-100" />;
            }

            if (item.type === 'header') {
              return (
                <div
                  key={`header-${index}`}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {item.label}
                </div>
              );
            }

            const Icon = item.icon;
            const isDanger = item.danger;

            return (
              <button
                key={item.key || index}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  isDanger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {Icon && <Icon className={`w-4 h-4 shrink-0 ${isDanger ? 'text-rose-500' : 'text-slate-400'}`} />}
                  <span className="truncate">{item.label}</span>
                </div>

                {item.shortcut && (
                  <kbd className="ml-3 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
