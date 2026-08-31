import React, { useMemo, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useTasks } from './hooks/useTasks';
import { useOwners } from './hooks/useOwners';
import useUIStore from './stores/uiStore';
import useAuthStore from './stores/authStore';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import DataTable from './components/DataTable';
import KPIDashboard from './components/KPIDashboard';
import AuditLogViewer from './components/admin/AuditLogViewer';
import TaskModal from './components/TaskModal';
import OwnerManagementModal from './components/OwnerManagementModal';
import LoginModal from './components/LoginModal';
import CreateUserModal from './components/CreateUserModal';
import ProfileModal from './components/ProfileModal';
import SuperAdminShell from './components/admin/SuperAdminShell';

import Footer from './components/Footer';
import ViewSkeleton, { MetricCardsSkeleton, FilterBarSkeleton } from './components/ViewSkeleton';
import { getTaskKpiCategory, isUserOwnerMatch } from './lib/kpiConstants';




const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function ControlCenterApp() {
  const { tasks, isLoading, isFetching, error, refetch, createTask, updateTask, deleteTask, updateStatus } = useTasks();
  const showSkeleton = isLoading || isFetching;
  const { owners, createOwner, updateOwner, deleteOwner } = useOwners();

  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user);

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const {
    view,
    setView,
    selectedMonth,
    filters,
    hiddenWidgets,
    isModalOpen,
    editingTask,
    openModal,
    closeModal,
    isOwnerModalOpen,
    openOwnerModal,
    closeOwnerModal
  } = useUIStore();

  // 1. Initial URL Hydration for IMP Tab State
  useEffect(() => {
    if (view === 'kanban') {
      setView('board');
    }
    const urlParams = new URLSearchParams(window.location.search);
    const urlTab = urlParams.get('tab');
    const validTabs = ['board', 'kanban', 'table', 'dashboard', 'activity', 'admin'];
    if (urlTab && validTabs.includes(urlTab)) {
      const targetView = urlTab === 'kanban' ? 'board' : urlTab;
      if (targetView !== view) {
        setView(targetView);
      }
    }
  }, []);

  // 2. Sync URL Search Params on active tab switch
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== view) {
      url.searchParams.set('tab', view);
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, [view]);

  // Filter tasks based on active FilterBar & selectedMonth
  const filteredTasks = useMemo(() => {
    const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';

    return tasks.filter(task => {

      // 0. Data Isolation Rule for Regular Users: View assigned, created, or unassigned tasks
      if (!isSuperAdmin && currentUser?.name) {
        const isOwner = isUserOwnerMatch(task.owner, currentUser.name);
        const isCreator = isUserOwnerMatch(task.user, currentUser.name);
        const isUnassigned = isUserOwnerMatch(task.owner, 'Unassigned');
        if (!isOwner && !isCreator && !isUnassigned) return false;
      }

      // 1. Search Query Filter (title, reason, remark)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const titleMatch = (task.title || '').toLowerCase().includes(query);
        const reasonMatch = (task.reason || '').toLowerCase().includes(query);
        const remarkMatch = (task.remark || '').toLowerCase().includes(query);
        if (!titleMatch && !reasonMatch && !remarkMatch) return false;
      }

      // 2. Status Filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // 3. Environment Filter
      if (filters.environment !== 'all' && task.pushTo !== filters.environment) {
        return false;
      }

      // 4. Task Owner Filter
      if (filters.owner && filters.owner !== 'all') {
        if (filters.owner === 'my_tasks') {
          if (!currentUser?.name || !isUserOwnerMatch(task.owner, currentUser.name)) return false;
        } else {
          if (!isUserOwnerMatch(task.owner, filters.owner)) return false;
        }
      }


      // 5. KPI Category Filter
      if (filters.kpiCategory && filters.kpiCategory !== 'all') {
        const taskCategory = getTaskKpiCategory(task);
        if (taskCategory !== filters.kpiCategory) return false;
      }

      // 6. Date Range Filter
      const isCustomDateRange = (filters.dateStart && filters.dateStart !== '2025-07-01') || (filters.dateEnd && filters.dateEnd !== '2026-12-31');
      if (filters.dateStart && task.date && task.date < filters.dateStart) return false;
      if (filters.dateEnd && task.date && task.date > filters.dateEnd) return false;

      // 7. Quick Date Pill Filter
      if (filters.quickDate && task.date !== filters.quickDate) return false;

      // 8. Selected Month Filter
      if (!isCustomDateRange && selectedMonth && selectedMonth !== 'all' && task.date) {
        if (!task.date.startsWith(selectedMonth)) return false;
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
  }, [tasks, filters, selectedMonth]);

  // CSV Data Export
  const handleExportCSV = () => {
    if (!tasks || tasks.length === 0) {
      toast.error('No tasks available to export');
      return;
    }

    const headers = ['Date', 'Title', 'Owner', 'Status', 'Push To', 'Flow Type', 'Flow Value', 'Reason', 'Timeline', 'Remark'];
    const rows = tasks.map(t => [
      `"${(t.date || '').replace(/"/g, '""')}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.owner || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(t.status || '').replace(/"/g, '""')}"`,
      `"${(t.pushTo || '').replace(/"/g, '""')}"`,
      `"${(t.flowType || 'none').replace(/"/g, '""')}"`,
      `"${(t.flowValue || '').replace(/"/g, '""')}"`,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      `"${(t.timeline || '').replace(/"/g, '""')}"`,
      `"${(t.remark || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qa-control-center-${selectedMonth || '2026-08'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${tasks.length} tasks to CSV`);
  };

  const handleSyncData = async () => {
    await refetch();
    toast.success('Tasks refreshed from MongoDB');
  };

  const handleSaveTask = async (formData) => {
    if (editingTask) {
      await updateTask({ id: editingTask.id, data: formData });
    } else {
      await createTask(formData);
    }
    closeModal();
  };

  const handleDeleteTask = async (id) => {
    await deleteTask(id);
    closeModal();
  };

  // If Super Admin view is selected and user is strictly a Super Admin, render full-screen Super Admin Panel
  if (view === 'admin' && currentUser?.role === 'Super Admin') {
    return (
      <>
        <SuperAdminShell onBackToApp={() => useUIStore.getState().setView('board')} currentUser={currentUser} />
        <LoginModal />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">

      {/* Global Header */}
      <Header
        tasks={tasks}
        onExportCSV={handleExportCSV}
        onSync={handleSyncData}
        onOpenCreateUserModal={() => setIsCreateUserModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full space-y-5">

        {/* Top Metric Cards (only for task views) */}
        {view !== 'activity' && !hiddenWidgets.includes('metrics') && (
          showSkeleton ? <MetricCardsSkeleton /> : <MetricCards tasks={filteredTasks} />
        )}

        {/* Advanced Filter Bar (only for task views) */}
        {view !== 'activity' && (
          showSkeleton ? (
            <FilterBarSkeleton />
          ) : (
            <FilterBar
              owners={owners}
              onOpenOwnerManager={openOwnerModal}
              filteredCount={filteredTasks.length}
              totalCount={tasks.length}
              onExportCSV={handleExportCSV}
            />
          )
        )}

        {/* Skeleton Loading Placeholders */}
        {showSkeleton && (
          <ViewSkeleton view={view} />
        )}


        {/* Error State */}
        {error && view !== 'activity' && (
          <div className="py-12 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 space-y-2 p-6">
            <p className="font-bold text-sm">Failed to connect to backend server</p>
            <p className="text-xs text-rose-600">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer mt-2"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Active View Display */}
        {!showSkeleton && (
          <div key={view} className="pt-1 animate-fade-in-up">
            {(view === 'board' || view === 'kanban') && (
              <KanbanBoard
                tasks={filteredTasks}
                onStatusChange={updateStatus}
                onEdit={openModal}
                onDelete={handleDeleteTask}
              />
            )}

            {view === 'table' && (
              <DataTable
                tasks={filteredTasks}
                owners={owners}
                onEdit={openModal}
                onUpdateTask={(id, data) => updateTask({ id, data })}
                onStatusChange={updateStatus}
              />
            )}

            {view === 'dashboard' && (
              <KPIDashboard tasks={filteredTasks} owners={owners} />
            )}

            {view === 'activity' && (
              <AuditLogViewer />
            )}
          </div>
        )}

      </main>

      {/* Sticky Footer */}
      <Footer />

      {/* Task CRUD Modal */}
      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        tasks={tasks}
        owners={owners}
        onClose={closeModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onOpenOwnerManager={openOwnerModal}
      />

      {/* Owner Management Modal */}
      <OwnerManagementModal
        isOpen={isOwnerModalOpen}
        onClose={closeOwnerModal}
        owners={owners}
        onCreateOwner={createOwner}
        onUpdateOwner={updateOwner}
        onDeleteOwner={deleteOwner}
      />

      {/* Global Auth Login Modal */}
      <LoginModal />

      {/* User Profile & Avatar Modal */}
      <ProfileModal />

      {/* Super Admin Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
      />


      {/* Sonner Toast Container */}
      <Toaster position="bottom-right" richColors />

    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ControlCenterApp />
    </QueryClientProvider>
  );
}
