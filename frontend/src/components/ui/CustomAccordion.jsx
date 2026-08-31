import React, { useState } from 'react';
import { LuChevronDown as ChevronDown } from 'react-icons/lu';

export default function CustomAccordion({
  items = [],
  allowMultiple = false,
  className = '',
}) {
  const [openIndexes, setOpenIndexes] = useState([0]);

  const toggleItem = (index) => {
    if (allowMultiple) {
      if (openIndexes.includes(index)) {
        setOpenIndexes(openIndexes.filter((i) => i !== index));
      } else {
        setOpenIndexes([...openIndexes, index]);
      }
    } else {
      setOpenIndexes(openIndexes.includes(index) ? [] : [index]);
    }
  };

  return (
    <div className={`divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        const Icon = item.icon;

        return (
          <div key={item.id || index} className="transition-colors">
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {Icon && <Icon className="w-4 h-4 text-blue-600 shrink-0" />}
                <span>{item.title}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 bg-slate-50/40 border-t border-slate-100 animate-in fade-in duration-150">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
