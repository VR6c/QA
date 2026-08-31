import React, { useMemo, useState } from 'react';
import {
  LuSearch as Search,
  LuX as X,
  LuRotateCcw as RotateCcw,
  LuCalendar as Calendar,
  LuAward as Award,
  LuUser as User,
  LuUsers as Users,
  LuLayers as Layers,
  LuActivity as Activity,
  LuSlidersHorizontal as SlidersHorizontal,
  LuFilter as Filter,
  LuBookmark as Bookmark,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuCheck as Check
} from 'react-icons/lu';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import useUIStore from '../stores/uiStore';
import useAuthStore from '../stores/authStore';
import useKPIStore from '../stores/kpiStore';
import { getAllKpis } from '../lib/kpiConstants';
import { CustomSelect, CustomDatePicker, CustomModal, CustomInput, CustomButton, ConfirmPopover } from './ui';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'feedback', label: 'Feedback & Issue', colorBadge: 'bg-rose-500' },
  { value: 'progress', label: 'In Progress', colorBadge: 'bg-amber-500' },
  { value: 'testing', label: 'Testing / QA', colorBadge: 'bg-blue-500' },
  { value: 'success', label: 'QA Success', colorBadge: 'bg-emerald-500' },
  { value: 'done', label: 'Done / Deployed', colorBadge: 'bg-purple-500' },
  { value: 'done_production', label: 'Done Production', colorBadge: 'bg-indigo-500' },
  { value: 'backlog', label: 'Backlog / Pending', colorBadge: 'bg-slate-400' }
];

const envOptions = [
  { value: 'all', label: 'All Environments' },
  { value: 'Development', label: 'Development' },
  { value: 'Production', label: 'Production' },
  { value: 'TestFlight', label: 'TestFlight' },
  { value: 'UAT', label: 'UAT' }
];

export default function FilterBar({
  owners = [],
  onOpenOwnerManager,
  filteredCount,
  totalCount,
  onExportCSV
}) {
  const user = useAuthStore((state) => state.user);
  const {
    filters,
    setFilters,
    resetFilters,
    setSelectedMonth,
    savedViews,
    activeSavedViewId,
    applySavedView,
    saveCurrentView,
    deleteSavedView
  } = useUIStore();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isSavedViewsMenuOpen, setIsSavedViewsMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'QA Lead' || user?.role === 'Admin';

  const customKpiDefinitions = useKPIStore((state) => state.customKpiDefinitions);

  const kpiFilterOptions = useMemo(() => {
    const kpis = getAllKpis(customKpiDefinitions);
    const opts = [{ value: 'all', label: 'KPIs' }];
    kpis.forEach(k => {
      opts.push({ value: k.id, label: k.title });
    });
    return opts;
  }, [customKpiDefinitions]);


  const ownerFilterOptions = useMemo(() => {
    const list = owners && owners.length > 0 ? owners : [
      { name: 'Unassigned' },
      { name: 'Vireak' },
      { name: 'QA Team' },
      { name: 'Dev Team' },
      { name: 'Product Manager' }
    ];
    return [
      { value: 'all', label: 'All Owners' },
      ...list.map(o => ({ value: o.name, label: o.name }))
    ];
  }, [owners]);

  // Check which filters are actively set
  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.search) {
      active.push({ key: 'search', label: `Search: "${filters.search}"`, clear: () => setFilters({ search: '' }) });
    }
    if (filters.status && filters.status !== 'all') {
      const label = statusOptions.find(s => s.value === filters.status)?.label || filters.status;
      active.push({ key: 'status', label: `Status: ${label}`, clear: () => setFilters({ status: 'all' }) });
    }
    if (filters.owner && filters.owner !== 'all') {
      active.push({ key: 'owner', label: `Owner: ${filters.owner}`, clear: () => setFilters({ owner: 'all' }) });
    }
    if (filters.environment && filters.environment !== 'all') {
      active.push({ key: 'environment', label: `Env: ${filters.environment}`, clear: () => setFilters({ environment: 'all' }) });
    }
    if (filters.kpiCategory && filters.kpiCategory !== 'all') {
      const label = kpiFilterOptions.find(k => k.value === filters.kpiCategory)?.label || filters.kpiCategory;
      active.push({ key: 'kpiCategory', label: `KPI: ${label}`, clear: () => setFilters({ kpiCategory: 'all' }) });
    }
    if (filters.dateStart && filters.dateEnd && (filters.dateStart !== '2025-07-01' || filters.dateEnd !== '2026-12-31')) {
      active.push({
        key: 'dateRange',
        label: `${filters.dateStart} → ${filters.dateEnd}`,
        clear: () => setFilters({ dateStart: '2025-07-01', dateEnd: '2026-12-31' })
      });
    }
    return active;
  }, [filters, setFilters]);

  const hasActiveFilters = activeFilters.length > 0;

  const handleSaveViewSubmit = (e) => {
    e.preventDefault();
    if (newViewName.trim()) {
      saveCurrentView(newViewName.trim());
      setNewViewName('');
      setIsSaveModalOpen(false);
    }
  };

  // Quick Date Chips Handlers
  const handleQuickDateChip = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      const d = format(today, 'yyyy-MM-dd');
      setFilters({ dateStart: d, dateEnd: d });
    } else if (preset === 'week') {
      const start = format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      setFilters({ dateStart: start, dateEnd: end });
    } else if (preset === 'month') {
      const start = format(startOfMonth(today), 'yyyy-MM-dd');
      const end = format(endOfMonth(today), 'yyyy-MM-dd');
      setFilters({ dateStart: start, dateEnd: end });
    } else if (preset === '30days') {
      const start = format(subDays(today, 29), 'yyyy-MM-dd');
      const end = format(today, 'yyyy-MM-dd');
      setFilters({ dateStart: start, dateEnd: end });
    }
  };

  return (
    <div className="relative z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3.5 transition-all">

      {/* Top Row: Search, Result Counter, Saved Views & Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Search Input Box & Live Result Count */}
        <div className="flex-1 min-w-[260px] max-w-xl flex items-center gap-2.5">
          <div className="flex-1">
            <CustomInput
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              onClear={() => setFilters({ search: '' })}
              placeholder="Search by title, reason, or remark..."
              iconLeft={Search}
              size="sm"
            />
          </div>

          {/* Live Result Count Label */}
          {filteredCount !== undefined && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 rounded-xl shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{filteredCount} {filteredCount === 1 ? 'task' : 'tasks'}</span>
              {totalCount && totalCount !== filteredCount && (
                <span className="text-slate-400 font-normal text-[11px]">(of {totalCount})</span>
              )}
            </span>
          )}
        </div>

        {/* Action Controls & Saved Views */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">

          {/* Saved Views Dropdown Menu (Super Admin only) */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => setIsSavedViewsMenuOpen(!isSavedViewsMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                title="Saved Filter Views"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {activeSavedViewId
                    ? savedViews.find(v => v.id === activeSavedViewId)?.name || 'Saved Views'
                    : 'Saved Views'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isSavedViewsMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-60 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={() => setIsSavedViewsMenuOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Saved Views
                  </div>
                  <div className="space-y-0.5 max-h-56 overflow-y-auto my-1">
                    {savedViews.map((view) => (
                      <div
                        key={view.id}
                        onClick={() => applySavedView(view)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${activeSavedViewId === view.id
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <span className="truncate">{view.name}</span>
                        {activeSavedViewId === view.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        {!['all', 'issues', 'testing', 'production', 'flows'].includes(view.id) && (
                          <ConfirmPopover
                            title="Delete saved view?"
                            subtitle={`View: "${view.name}"`}
                            confirmText="Delete"
                            onConfirm={() => deleteSavedView(view.id)}
                          >
                            <button
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors ml-1"
                              title="Delete view"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </ConfirmPopover>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsSavedViewsMenuOpen(false);
                        setIsSaveModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Current View</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manage Owners Button (Super Admin only) */}
          {isSuperAdmin && onOpenOwnerManager && (
            <button
              onClick={onOpenOwnerManager}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
              title="Manage QA Task Owners"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Manage Owners</span>
            </button>
          )}

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters {hasActiveFilters && `(${activeFilters.length})`}</span>
          </button>

          {/* Reset Filters Button */}
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters && !filters.search}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border shadow-2xs cursor-pointer ${hasActiveFilters || filters.search
              ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 active:scale-[0.98]'
              : 'text-slate-400 bg-slate-50 border-slate-200/50 cursor-not-allowed opacity-60'
              }`}
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips / Removable Tags Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filtered by:
          </span>
          {activeFilters.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors group"
            >
              <span>{chip.label}</span>
              <button
                onClick={chip.clear}
                className="p-0.5 text-slate-400 group-hover:text-slate-700 hover:bg-slate-300/60 rounded transition-colors cursor-pointer"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={resetFilters}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Options Grid (Mobile / Tablet / Laptop / Desktop) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 w-full ${isMobileFilterOpen ? 'block' : 'hidden sm:grid'}`}>

        {/* Status Dropdown */}
        <div className="w-full">
          <CustomSelect
            options={statusOptions}
            value={filters.status}
            onChange={(val) => setFilters({ status: val })}
            size="sm"
            variant={filters.status !== 'all' ? 'subtle' : 'solid'}
            icon={Activity}
            className={filters.status !== 'all' ? 'ring-1 ring-blue-500/30 rounded-md' : ''}
          />
        </div>

        {/* Owner Dropdown */}
        <div className="w-full">
          <CustomSelect
            options={ownerFilterOptions}
            value={filters.owner || 'all'}
            onChange={(val) => setFilters({ owner: val })}
            size="sm"
            variant={filters.owner && filters.owner !== 'all' ? 'subtle' : 'solid'}
            icon={User}
            className={filters.owner && filters.owner !== 'all' ? 'ring-1 ring-blue-500/30 rounded-md' : ''}
          />
        </div>

        {/* Environment Dropdown */}
        <div className="w-full">
          <CustomSelect
            options={envOptions}
            value={filters.environment}
            onChange={(val) => setFilters({ environment: val })}
            size="sm"
            variant={filters.environment !== 'all' ? 'subtle' : 'solid'}
            icon={Layers}
            className={filters.environment !== 'all' ? 'ring-1 ring-blue-500/30 rounded-md' : ''}
          />
        </div>

        {/* KPI Dropdown */}
        <div className="w-full">
          <CustomSelect
            options={kpiFilterOptions}
            value={filters.kpiCategory || 'all'}
            onChange={(val) => setFilters({ kpiCategory: val })}
            size="sm"
            variant={filters.kpiCategory && filters.kpiCategory !== 'all' ? 'subtle' : 'solid'}
            icon={Award}
            className={filters.kpiCategory && filters.kpiCategory !== 'all' ? 'ring-1 ring-blue-500/30 rounded-md' : ''}
          />
        </div>

        {/* Date Range Picker */}
        <div className="w-full">
          <CustomDatePicker
            mode="range"
            align="right"
            value={
              filters.dateStart && filters.dateEnd && (filters.dateStart !== '2025-07-01' || filters.dateEnd !== '2026-12-31')
                ? { from: filters.dateStart, to: filters.dateEnd }
                : null
            }
            onChange={(val) => {
              if (!val || (!val.from && !val.to)) {
                setFilters({ dateStart: '2025-07-01', dateEnd: '2026-12-31' });
              } else {
                setFilters({ dateStart: val.from || '2025-07-01', dateEnd: val.to || '2026-12-31' });
                setSelectedMonth('all');
              }
            }}
            enablePresets={true}
            size="sm"
            variant={filters.dateStart && filters.dateEnd && (filters.dateStart !== '2025-07-01' || filters.dateEnd !== '2026-12-31') ? 'subtle' : 'solid'}
            placeholder="Filter Date Range"
          />
        </div>
      </div>

      {/* One-Tap Quick Date Range Chips */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100/80 text-xs overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Quick Date:</span>
        <button
          onClick={() => handleQuickDateChip('today')}
          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          Today
        </button>
        <button
          onClick={() => handleQuickDateChip('week')}
          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          This Week
        </button>
        <button
          onClick={() => handleQuickDateChip('month')}
          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          This Month
        </button>
        <button
          onClick={() => handleQuickDateChip('30days')}
          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          Last 30 Days
        </button>
      </div>

      {/* Save View Modal */}
      <CustomModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Current Filter View"
        size="sm"
      >
        <form onSubmit={handleSaveViewSubmit} className="space-y-4 pt-1">
          <div>
            <CustomInput
              label="View Name"
              required
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. My Failed Tasks This Month"
              size="sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <CustomButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSaveModalOpen(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              variant="primary"
              size="sm"
            >
              Save View
            </CustomButton>
          </div>
        </form>
      </CustomModal>

    </div>
  );
}


