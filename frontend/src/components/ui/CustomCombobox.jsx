import React, { useState, useRef, useEffect } from 'react';
import { 
  LuSearch as Search, 
  LuCheck as Check, 
  LuPlus as Plus, 
  LuX as X 
} from 'react-icons/lu';
import { useClickOutside } from './useClickOutside';

export default function CustomCombobox({
  options = [],
  value,
  onChange,
  placeholder = 'Search or enter custom value...',
  label,
  allowCustom = true,
  helperText,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const inputRef = useRef(null);

  const containerRef = useClickOutside(() => {
    setIsOpen(false);
  });

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const filteredOptions = query
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase()) ||
        opt.value.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const exactMatch = options.some(
    (opt) => opt.value.toLowerCase() === query.toLowerCase() || opt.label.toLowerCase() === query.toLowerCase()
  );

  const handleSelect = (val) => {
    onChange(val);
    setQuery(val);
    setIsOpen(false);
  };

  const handleCreateCustom = () => {
    if (!query.trim()) return;
    onChange(query.trim());
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onFocus={() => !disabled && setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium transition-all shadow-2xs ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
          }`}
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-2">
          <ul className="max-h-60 overflow-y-auto py-1 text-xs sm:text-sm text-slate-700">
            {filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex cursor-pointer items-center justify-between px-3.5 py-2 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </li>
              );
            })}

            {allowCustom && query.trim() && !exactMatch && (
              <li
                onClick={handleCreateCustom}
                className="flex cursor-pointer items-center gap-2 px-3.5 py-2.5 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold border-t border-slate-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Use "{query}"</span>
              </li>
            )}

            {filteredOptions.length === 0 && (!allowCustom || !query.trim()) && (
              <li className="px-4 py-3 text-center text-xs text-slate-400">
                No matching results
              </li>
            )}
          </ul>
        </div>
      )}

      {helperText && <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}
