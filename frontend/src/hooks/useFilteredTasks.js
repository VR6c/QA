import { useMemo } from 'react';
import { getTaskKpiCategory, isUserOwnerMatch } from '../lib/kpiConstants';

/**
 * Custom hook to encapsulate high-performance task filtering logic.
 *
 * @param {Array} tasks - List of task objects
 * @param {Object} filters - Current UI filter state
 * @param {string} selectedMonth - Selected year-month string (e.g., '2026-08' or 'all')
 * @param {Object} currentUser - Current authenticated user
 * @param {string} view - Current active view ('board', 'kanban', 'table', etc.)
 * @returns {Array} Filtered list of tasks
 */
export function useFilteredTasks(tasks = [], filters = {}, selectedMonth = '', currentUser = null, view = 'board') {
  return useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';
    const isBoardView = view === 'board' || view === 'kanban';

    return tasks.filter((task) => {
      if (!task) return false;

      // 0. Data Isolation Rule for Regular Users: Task created by or assigned to User
      if (!isSuperAdmin && currentUser?.name) {
        const isCreator = isUserOwnerMatch(task.user, currentUser.name);
        const isOwner = isUserOwnerMatch(task.owner, currentUser.name);
        if (!isCreator && !isOwner) return false;
      }

      // 1. Search Query Filter (title, reason, remark)
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const titleMatch = (task.title || '').toLowerCase().includes(query);
        const reasonMatch = (task.reason || '').toLowerCase().includes(query);
        const remarkMatch = (task.remark || '').toLowerCase().includes(query);
        if (!titleMatch && !reasonMatch && !remarkMatch) return false;
      }

      // 2. Status Filter
      if (filters.status && filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // 3. Environment Filter
      if (filters.environment && filters.environment !== 'all' && task.pushTo !== filters.environment) {
        return false;
      }

      // 4. Task Owner Filter
      if (filters.owner && filters.owner !== 'all') {
        if (filters.owner === 'my_tasks') {
          if (
            !currentUser?.name ||
            (!isUserOwnerMatch(task.owner, currentUser.name) && !isUserOwnerMatch(task.user, currentUser.name))
          ) {
            return false;
          }
        } else {
          if (!isUserOwnerMatch(task.owner, filters.owner)) return false;
        }
      }

      // 5. KPI Category Filter
      if (filters.kpiCategory && filters.kpiCategory !== 'all') {
        const taskCategory = getTaskKpiCategory(task);
        if (taskCategory !== filters.kpiCategory) return false;
      }

      // 6. Date Range, Quick Date, & Selected Month Filters
      const isImpFlow = Boolean(task.flowType && task.flowType !== 'none');
      const isBacklogPending = task.status === 'backlog';
      const isExcludedFromDateFilter = isBoardView && (isImpFlow || isBacklogPending);

      if (!isExcludedFromDateFilter) {
        const isCustomDateRange =
          (filters.dateStart && filters.dateStart !== '2025-07-01') ||
          (filters.dateEnd && filters.dateEnd !== '2026-12-31');

        if (filters.dateStart && task.date && task.date < filters.dateStart) return false;
        if (filters.dateEnd && task.date && task.date > filters.dateEnd) return false;

        // 7. Quick Date Pill Filter
        if (filters.quickDate && task.date !== filters.quickDate) return false;

        // 8. Selected Month Filter
        if (!isCustomDateRange && selectedMonth && selectedMonth !== 'all' && task.date) {
          if (!task.date.startsWith(selectedMonth)) return false;
        }
      }

      // 9. IMP Flow Type Filter
      if (filters.flowType && filters.flowType !== 'all') {
        const taskFlowType = task.flowType || 'none';
        if (taskFlowType !== filters.flowType) return false;
      }

      // 10. IMP Flow Value Filter
      if (filters.flowValue && filters.flowValue !== 'all') {
        const taskFlowValue = task.flowValue || '';
        if (taskFlowValue !== filters.flowValue) return false;
      }

      return true;
    });
  }, [tasks, filters, selectedMonth, currentUser, view]);
}
