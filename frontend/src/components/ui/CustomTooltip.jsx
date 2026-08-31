import React, { useState } from 'react';

export default function CustomTooltip({
  children,
  content,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  delay = 150,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId = null;

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && content && (
        <div
          className={`absolute z-50 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-xs rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-all duration-150 animate-in fade-in ${
            positionClasses[position] || positionClasses.top
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
