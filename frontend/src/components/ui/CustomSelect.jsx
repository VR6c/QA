import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LuChevronDown as ChevronDown, 
  LuCheck as Check, 
  LuX as X, 
  LuSearch as Search 
} from 'react-icons/lu';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  helperText,
  error,
  disabled = false,
  isSearchable = false,
  isClearable = false,
  icon: LeftIcon,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'outline', // 'outline' | 'solid' | 'subtle' | 'ghost'
  className = '',
  dropdownClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) ||
    (value ? options.find((opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()) : null) ||
    (value ? options.find((opt) => String(opt.label).toLowerCase().includes(String(value).toLowerCase())) : null);

  const filteredOptions = isSearchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Handles click outside checking BOTH containerRef and portal dropdownRef
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Calculate position relative to viewport for Portal rendering
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < 220 && rect.top > 220 ? 'top' : 'bottom';

    setCoords({
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width: rect.width,
      placement,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (isOpen) {
      const idx = filteredOptions.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[focusedIndex]) {
        onChange(filteredOptions[focusedIndex].value);
        setIsOpen(false);
        setSearchQuery('');
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md min-h-[32px]',
    md: 'px-3.5 py-2 text-sm rounded-lg min-h-[40px]',
    lg: 'px-4 py-2.5 text-base rounded-xl min-h-[48px]',
  };

  // Variant styles
  const variantClasses = {
    outline: `bg-white border ${
      error
        ? 'border-rose-300 ring-rose-500/20'
        : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
    } shadow-2xs`,
    solid: `bg-slate-100 border border-transparent hover:bg-slate-200/80 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20`,
    subtle: `bg-blue-50/60 border border-blue-100 hover:bg-blue-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20`,
    ghost: `bg-transparent border border-transparent hover:bg-slate-100 focus-within:bg-white focus-within:border-slate-300`,
  };

  const dropdownMenuContent = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        left: `${coords.left}px`,
        width: `${Math.max(coords.width, 160)}px`,
        top: coords.placement === 'bottom' ? `${coords.top}px` : 'auto',
        bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : 'auto',
      }}
      className={`z-[9999] rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl animate-in fade-in duration-100 ${
        coords.placement === 'bottom' ? 'slide-in-from-top-1' : 'slide-in-from-bottom-1'
      } ${dropdownClassName}`}
    >
      {/* Search Box inside dropdown if enabled */}
      {isSearchable && (
        <div className="p-2 border-b border-slate-100">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
            />
          </div>
        </div>
      )}

      {/* Options List */}
      <ul className="max-h-60 overflow-y-auto py-1 text-xs sm:text-sm text-slate-700 divide-y divide-slate-50">
        {filteredOptions.length === 0 ? (
          <li className="px-4 py-3 text-center text-xs text-slate-400">
            No matching options found
          </li>
        ) : (
          filteredOptions.map((option, idx) => {
            const isSelected = option.value === value;
            const isFocused = idx === focusedIndex;

            return (
              <li
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectOption(option.value);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`flex cursor-pointer items-center justify-between px-3.5 py-2.5 transition-colors ${
                  isSelected
                    ? 'bg-blue-50/80 text-blue-700 font-semibold'
                    : isFocused
                    ? 'bg-slate-100/80 text-slate-900'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {option.colorBadge && (
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${option.colorBadge}`} />
                  )}
                  {option.icon && <span className="shrink-0 text-slate-500">{option.icon}</span>}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-[11px] text-slate-400 font-normal truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Select Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`flex w-full items-center justify-between font-medium text-slate-800 transition-all duration-150 text-left ${
          sizeClasses[size] || sizeClasses.md
        } ${variantClasses[variant] || variantClasses.outline} ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden pr-1">
          {LeftIcon && <LeftIcon className="w-4 h-4 text-slate-400 shrink-0" />}

          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              {selectedOption.colorBadge && (
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedOption.colorBadge}`} />
              )}
              <span className="truncate">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isClearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Portal Dropdown Menu */}
      {dropdownMenuContent && createPortal(dropdownMenuContent, document.body)}

      {/* Helper or Error Message */}
      {error ? (
        <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
