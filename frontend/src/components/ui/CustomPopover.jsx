import React, { useState, useRef } from 'react';
import { useClickOutside } from './useClickOutside';

export default function CustomPopover({
  trigger,
  content,
  position = 'bottom-left', // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 min-w-[200px] p-4 bg-white border border-slate-200/80 rounded-2xl
            shadow-xl animate-in fade-in zoom-in-95 duration-150
            ${positionClasses[position] || positionClasses['bottom-left']}
          `}
        >
          {typeof content === 'function' ? content({ close: () => setIsOpen(false) }) : content}
        </div>
      )}
    </div>
  );
}
