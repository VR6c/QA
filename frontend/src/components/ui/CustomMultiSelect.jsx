import React, { useState, useRef } from 'react';
import { 
  LuChevronDown as ChevronDown, 
  LuCheck as Check, 
  LuX as X, 
  LuSearch as Search, 
  LuSquareCheck as CheckSquare, 
  LuSquare as Square 
} from 'react-icons/lu';
import { useClickOutside } from './useClickOutside';

export default function CustomMultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select multiple...',
  label,
  helperText,
  disabled = false,
  isSearchable = true,
  maxTagCount = 3,
  size = 'md',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useClickOutside(() => {
    setIsOpen(false);
    setSearchQuery('');
  });

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  const filteredOptions = searchQuery
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleToggle = (optionValue) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const handleRemoveTag = (e, optionValue) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== optionValue));
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Main Trigger Container */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between min-h-[40px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs cursor-pointer hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 pr-1">
          {selectedOptions.length === 0 ? (
            <span className="text-xs text-slate-400 font-normal">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxTagCount).map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md shrink-0"
                >
                  <span className="truncate max-w-[100px]">{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(e, opt.value)}
                    className="text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedOptions.length > maxTagCount && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                  +{selectedOptions.length - maxTagCount} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Clear all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-2">
          {/* Search Box */}
          {isSearchable && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Select All Row */}
          <div
            onClick={handleSelectAll}
            className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <span className="flex items-center gap-2">
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              Select All
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedValues.length} / {options.length}
            </span>
          </div>

          {/* List Options */}
          <ul className="max-h-60 overflow-y-auto py-1 text-xs sm:text-sm">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-xs text-slate-400">
                No matching options
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <li
                    key={option.value}
                    onClick={() => handleToggle(option.value)}
                    className={`flex cursor-pointer items-center justify-between px-3.5 py-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 text-blue-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </div>
                    {option.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                        {option.badge}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {helperText && <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}
