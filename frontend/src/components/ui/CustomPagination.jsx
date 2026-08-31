import React, { useState } from 'react';
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronsLeft as ChevronsLeft,
  LuChevronsRight as ChevronsRight,
  LuCornerDownLeft as CornerDownLeft
} from 'react-icons/lu';
import CustomSelect from './CustomSelect';

export default function CustomPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  showJumpToPage = true,
}) {
  const [jumpInputValue, setJumpInputValue] = useState('');
  const [showJumpForm, setShowJumpForm] = useState(false);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageSelectOptions = pageSizeOptions.map((size) => ({
    value: size,
    label: `${size} per page`,
  }));

  // Handle page click with direction detection
  const handlePageClick = (targetPage) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) return;

    let dir = 'next';
    if (targetPage < currentPage) {
      dir = 'prev';
    } else if (Math.abs(targetPage - currentPage) > 1) {
      dir = 'jump';
    }

    if (onPageChange) {
      onPageChange(targetPage, dir);
    }
  };

  // Direct page jump handler
  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageClick(pageNum);
      setJumpInputValue('');
      setShowJumpForm(false);
    }
  };

  // Smart Ellipsis Page Generation Logic
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const showLeftEllipsis = currentPage > 4;
    const showRightEllipsis = currentPage < totalPages - 3;

    if (!showLeftEllipsis && showRightEllipsis) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (showLeftEllipsis && !showRightEllipsis) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else if (showLeftEllipsis && showRightEllipsis) {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border border-slate-200/80 rounded-xl text-xs shadow-2xs ${className}`}>
      {/* Left Info & Page Size */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-600 font-medium">
          Showing <span className="font-bold text-slate-900">{startItem}</span> to{' '}
          <span className="font-bold text-slate-900">{endItem}</span> of{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> results
        </span>

        {onItemsPerPageChange && (
          <div className="w-36">
            <CustomSelect
              options={pageSelectOptions}
              value={itemsPerPage}
              onChange={(val) => onItemsPerPageChange(Number(val))}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Right Controls & Page Navigation */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Quick Page Jump Input */}
        {showJumpToPage && totalPages > 5 && (
          <div className="relative mr-1">
            {!showJumpForm ? (
              <button
                type="button"
                onClick={() => setShowJumpForm(true)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 text-[11px] font-semibold transition cursor-pointer"
                title="Jump to specific page"
              >
                Go to page
              </button>
            ) : (
              <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-blue-400 shadow-xs">
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpInputValue}
                  onChange={(e) => setJumpInputValue(e.target.value)}
                  placeholder={`1-${totalPages}`}
                  autoFocus
                  className="w-14 px-1.5 py-0.5 text-xs text-slate-900 bg-white border border-slate-200 rounded text-center focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 text-white bg-blue-600 hover:bg-blue-700 rounded transition cursor-pointer"
                  title="Submit Jump"
                >
                  <CornerDownLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowJumpForm(false)}
                  className="px-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        )}

        {/* First Page */}
        <button
          type="button"
          onClick={() => handlePageClick(1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Buttons with Ellipsis */}
        {getPageNumbers().map((pg, idx) => {
          if (pg === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold select-none"
              >
                •••
              </span>
            );
          }

          const isActive = pg === currentPage;

          return (
            <button
              key={pg}
              type="button"
              onClick={() => handlePageClick(pg)}
              className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs scale-105 animate-page-pill'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {pg}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
