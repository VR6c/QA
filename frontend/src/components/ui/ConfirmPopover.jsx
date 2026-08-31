import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Anchored ConfirmPopover Component
 * Replaces standard browser `confirm()` or centered dialogs with a modern,
 * floating popover anchored directly to the action trigger element (matches image2 layout).
 */
export default function ConfirmPopover({
  children,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onConfirm,
  title = 'Delete this request?',
  subtitle,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  disabled = false,
  align = 'auto', // 'auto' | 'left' | 'right'
  placement = 'auto', // 'auto' | 'bottom' | 'top'
}) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, transformOrigin: 'top right' });

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const handleClose = () => {
    if (isLoading) return;
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setUncontrolledIsOpen(false);
    }
  };

  const handleToggle = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      if (isControlled) {
        // Controlled mode handles open state externally
      } else {
        setUncontrolledIsOpen(true);
      }
    } else {
      handleClose();
    }
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onConfirm || isLoading) return;
    try {
      setIsLoading(true);
      await onConfirm();
      handleClose();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate anchored positions dynamically based on viewport & trigger element
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = popoverRef.current ? popoverRef.current.offsetWidth : 280;
    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 140;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = rect.bottom + 8;
    let left = rect.right - popoverWidth;
    let originY = 'top';
    let originX = 'right';

    // Vertical placement logic (auto switch to top if space below is small)
    if (placement === 'top' || (placement === 'auto' && rect.bottom + popoverHeight > viewportHeight - 16 && rect.top > popoverHeight + 16)) {
      top = rect.top - popoverHeight - 8;
      originY = 'bottom';
    }

    // Horizontal placement logic
    if (align === 'left' || (align === 'auto' && left < 16)) {
      left = Math.max(16, rect.left);
      originX = 'left';
    }

    // Ensure within viewport right bound
    if (left + popoverWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - popoverWidth - 16);
      originX = 'right';
    }

    // Ensure within viewport top/bottom bound
    if (top < 16) top = 16;

    setCoords({
      top: top + window.scrollY, // handle page scrolling context if fixed positioning isn't root
      topFixed: top,
      leftFixed: left,
      transformOrigin: `${originY} ${originX}`
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      // recalculate after render for exact DOM height
      requestAnimationFrame(updatePosition);
    }
  }, [isOpen, subtitle, title]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleOutsideClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('resize', handleScrollOrResize, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const confirmBtnStyles = {
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs focus:ring-amber-500',
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus:ring-blue-500'
  };

  // Trigger child element mutation to attach ref and onClick handler if children supplied
  const triggerElement = children ? (
    React.cloneElement(React.Children.only(children), {
      ref: (node) => {
        triggerRef.current = node;
        // Call original child ref if present
        const childRef = children.ref;
        if (typeof childRef === 'function') childRef(node);
        else if (childRef) childRef.current = node;
      },
      onClick: (e) => {
        // preserve child click if it had any specific logic, but toggle popover
        handleToggle(e);
      }
    })
  ) : null;

  return (
    <>
      {triggerElement}

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${coords.topFixed}px`,
              left: `${coords.leftFixed}px`,
              transformOrigin: coords.transformOrigin,
              zIndex: 99999
            }}
            className="w-72 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/15 animate-in fade-in zoom-in-95 duration-150 select-none text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {title}
            </h4>

            {/* Subtitle / Details */}
            {subtitle && (
              <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed break-words line-clamp-2">
                {subtitle}
              </p>
            )}

            {/* Buttons Row (Matching Image2) */}
            <div className="flex items-center justify-end gap-2.5 mt-4 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleClose}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer"
              >
                {cancelText}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer ${confirmBtnStyles[confirmVariant] || confirmBtnStyles.danger}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
