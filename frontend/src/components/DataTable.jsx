import React, { useState } from 'react';
import {
  LuArrowUpDown as ArrowUpDown,
  LuChevronUp as ChevronUp,
  LuChevronDown as ChevronDown,
  LuSquarePen as Edit2,
  LuAward as Award
} from 'react-icons/lu';
import { getAllKpis, getTaskKpiCategory } from '../lib/kpiConstants';
import { CustomSelect, CustomPagination, PageTransition } from './ui';
import useUIStore from '../stores/uiStore';
import useKPIStore from '../stores/kpiStore';
import TestingTimerBadge from './TestingTimerBadge';
import { useTasks } from '../hooks/useTasks';

const statusBadgeStyles = {
  feedback: 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200 focus:ring-2 focus:ring-rose-400 font-bold',
  progress: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 focus:ring-2 focus:ring-amber-400 font-bold',
  testing: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 focus:ring-2 focus:ring-blue-400 font-bold',
  success: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 focus:ring-2 focus:ring-purple-400 font-bold',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 focus:ring-2 focus:ring-emerald-400 font-bold',
  done_production: 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200 focus:ring-2 focus:ring-teal-400 font-bold',
  backlog: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 font-bold'
};

const statusOptions = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'success', label: 'QA Success' },
  { value: 'done', label: 'Done' },
  { value: 'done_production', label: 'Done Production' },
  { value: 'backlog', label: 'Backlog' }
];

const envBadgeStyles = {
  Development: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 focus:ring-2 focus:ring-amber-400 font-bold',
  Production: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-400 font-bold',
  TestFlight: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 font-bold',
  UAT: 'bg-violet-50 text-violet-700 border-violet-300 hover:bg-violet-100 focus:ring-2 focus:ring-violet-400 font-bold'
};

const envOptions = [
  'Development',
  'Production',
  'TestFlight',
  'UAT'
];

export default function DataTable({ tasks = [], owners = [], onEdit, onUpdateTask, onStatusChange, onStartTesting, onPauseTesting }) {
  const { startTesting: startTestingApi, pauseTesting: pauseTestingApi } = useTasks();
  const handleStartTesting = onStartTesting || ((id) => startTestingApi({ id }));
  const handlePauseTesting = onPauseTesting || ((id, nextStatus) => pauseTestingApi({ id, nextStatus }));

  const { dashboardDensity } = useUIStore();
  const isCompact = dashboardDensity === 'compact';
  const cellPaddingClass = isCompact ? 'px-3 py-1.5' : 'px-4 py-3';

  const customKpiDefinitions = useKPIStore((state) => state.customKpiDefinitions);

  const kpiCategoryOptions = React.useMemo(() => {
    const kpis = getAllKpis(customKpiDefinitions);
    const opts = [{ value: 'none', label: 'None' }];
    kpis.forEach(k => {
      opts.push({ value: k.id, label: k.title });
    });
    return opts;
  }, [customKpiDefinitions]);

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageDirection, setPageDirection] = useState('next');

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks];
  if (sortField) {
    sortedTasks.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalItems = sortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTasks = sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const ownerOptions = React.useMemo(() => {
    const list = owners && owners.length > 0 ? owners : [
      { name: 'Unassigned' },
      { name: 'Vireak' },
      { name: 'QA Team' },
      { name: 'Dev Team' },
      { name: 'Product Manager' }
    ];
    return list.map(o => o.name);
  }, [owners]);

  const formattedOwnerOptions = React.useMemo(() => {
    return ownerOptions.map(o => ({ value: o, label: o }));
  }, [ownerOptions]);

  const formattedEnvOptions = React.useMemo(() => {
    return envOptions.map(e => ({ value: e, label: e }));
  }, []);

  const columns = [
    { key: 'title', label: 'Task Title', width: 'w-64 min-w-[200px]' },
    { key: 'owner', label: 'Owner', width: 'w-36 min-w-[130px]' },
    { key: 'kpiCategory', label: 'KPI Category', width: 'w-48 min-w-[180px]' },
    { key: 'date', label: 'Date', width: 'w-28 min-w-[100px]' },
    { key: 'datelineDeveloper', label: 'DateLine Dev', width: 'w-32 min-w-[110px]' },
    { key: 'datelineTesting', label: 'DateLine Testing', width: 'w-32 min-w-[110px]' },
    { key: 'status', label: 'Status', width: 'w-36 min-w-[130px]' },
    { key: 'testingTimer', label: 'Testing Time', width: 'w-40 min-w-[140px]' },
    { key: 'pushTo', label: 'Push To', width: 'w-36 min-w-[130px]' },
    { key: 'reason', label: 'Reason / Notes', width: 'w-48 min-w-[160px]' },
    { key: 'timeline', label: 'Timeline', width: 'w-36 min-w-[120px]' },
    { key: 'remark', label: 'Remark', width: 'w-36 min-w-[120px]' },
    { key: 'actions', label: '', width: 'w-16 min-w-[60px]' }
  ];

  const handleStatusSelectChange = (taskId, newStatus) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    } else if (onUpdateTask) {
      onUpdateTask(taskId, { status: newStatus });
    }
  };

  const handlePushToSelectChange = (taskId, newPushTo) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { pushTo: newPushTo });
    }
  };

  const handleKpiCategoryChange = (taskId, newCategory) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { kpiCategory: newCategory });
    }
  };

  const handleOwnerSelectChange = (taskId, newOwner) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { owner: newOwner });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3">

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">

          {/* Header */}
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`${cellPaddingClass} ${col.width}`}
                >
                  {col.key !== 'actions' ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors font-bold cursor-pointer select-none"
                    >
                      <span>{col.label}</span>
                      {sortField === col.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <PageTransition
            as="tbody"
            page={currentPage}
            direction={pageDirection}
            className="divide-y divide-slate-100"
          >
            {paginatedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onEdit(task)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* 1. Title */}
                <td className={`${cellPaddingClass} font-semibold text-slate-900`}>
                  <div className="line-clamp-2">{task.title}</div>
                </td>



                {/* 3. Owner (Assignee) */}
                <td className={`${cellPaddingClass} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                  <div className="w-36">
                    <CustomSelect
                      options={formattedOwnerOptions}
                      value={task.owner || 'Unassigned'}
                      onChange={(val) => handleOwnerSelectChange(task.id, val)}
                      size="sm"
                      variant="solid"
                    />
                  </div>
                </td>

                {/* 3. KPI Category */}
                <td className={`${cellPaddingClass} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                  <div className="w-44">
                    <CustomSelect
                      options={kpiCategoryOptions}
                      value={task.kpiCategory || getTaskKpiCategory(task)}
                      onChange={(val) => handleKpiCategoryChange(task.id, val)}
                      size="sm"
                      variant="subtle"
                    />
                  </div>
                </td>

                {/* 4. Date */}
                <td className={`${cellPaddingClass} text-slate-600 font-medium whitespace-nowrap`}>
                  {task.date || '-'}
                </td>

                {/* 4b. DateLine Developer */}
                <td className={`${cellPaddingClass} font-semibold whitespace-nowrap text-amber-700`}>
                  {task.datelineDeveloper || '-'}
                </td>

                {/* 4c. DateLine Testing */}
                <td className={`${cellPaddingClass} font-semibold whitespace-nowrap text-blue-700`}>
                  {task.datelineTesting || '-'}
                </td>

                {/* 5. Status */}
                <td className={`${cellPaddingClass} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                  <div className="w-36">
                    <CustomSelect
                      options={statusOptions}
                      value={task.status || 'backlog'}
                      onChange={(val) => handleStatusSelectChange(task.id, val)}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </td>

                {/* 5b. Testing Time / Live Timer */}
                <td className={`${cellPaddingClass} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                  <TestingTimerBadge
                    task={task}
                    onStartTesting={handleStartTesting}
                    onPauseTesting={handlePauseTesting}
                    variant="table"
                  />
                </td>

                {/* 6. Push To */}
                <td className={`${cellPaddingClass} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                  <div className="w-36">
                    <CustomSelect
                      options={formattedEnvOptions}
                      value={task.pushTo || 'Development'}
                      onChange={(val) => handlePushToSelectChange(task.id, val)}
                      size="sm"
                      variant="solid"
                    />
                  </div>
                </td>

                {/* 7. Reason */}
                <td className={`${cellPaddingClass} text-slate-600`}>
                  <div className="line-clamp-2 max-w-xs">{task.reason || '-'}</div>
                </td>

                {/* 8. Timeline */}
                <td className={`${cellPaddingClass} text-slate-600 font-medium`}>
                  <div className="truncate max-w-xs">{task.timeline || '-'}</div>
                </td>

                {/* 9. Remark */}
                <td className={`${cellPaddingClass} text-slate-500 italic`}>
                  <div className="truncate max-w-xs" title={task.remark || ''}>
                    {task.remark ? task.remark.split('\n').map(r => r.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean).join(' • ') : '-'}
                  </div>
                </td>

                {/* 10. Actions */}
                <td className={`${cellPaddingClass} text-right whitespace-nowrap`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </PageTransition>

        </table>
      </div>

      {sortedTasks.length === 0 && (
        <div className="py-12 text-center text-slate-400 font-medium text-xs">
          No matching tasks found in current filter criteria.
        </div>
      )}

      {/* Pagination Control */}
      {sortedTasks.length > 0 && (
        <div className="p-3 border-t border-slate-100">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={(p, dir) => {
              setPageDirection(dir || 'next');
              setCurrentPage(p);
            }}
            onItemsPerPageChange={(s) => {
              setPageSize(s);
              setPageDirection('jump');
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

    </div>
  );
}
