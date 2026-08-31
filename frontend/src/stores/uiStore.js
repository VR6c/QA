import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const getCurrentMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const defaultFilters = {
  search: '',
  status: 'all',
  environment: 'all',
  owner: 'all',
  kpiCategory: 'all',
  dateStart: '2025-07-01',
  dateEnd: '2026-12-31',
  quickDate: null,
  flowType: 'all',
  flowValue: 'all'
};

const initialSavedViews = [
  { id: 'all', name: 'All Tasks', filters: defaultFilters },
  { id: 'issues', name: 'Blockers & Issues', filters: { ...defaultFilters, status: 'feedback' } },
  { id: 'testing', name: 'Testing / QA Pipeline', filters: { ...defaultFilters, status: 'testing' } },
  { id: 'production', name: 'Production Tasks', filters: { ...defaultFilters, environment: 'Production' } },
  { id: 'flows', name: 'Recurring Flows', filters: { ...defaultFilters, flowType: 'monthly' } }
];

export const defaultWidgetStyles = {
  metrics: { variant: 'default', theme: 'blue', rounded: 'rounded-2xl' },
  tracker: { variant: 'default', theme: 'emerald', rounded: 'rounded-2xl' },
  status: { variant: 'default', theme: 'purple', rounded: 'rounded-2xl' },
  env: { variant: 'default', theme: 'blue', rounded: 'rounded-2xl' },
  activity: { variant: 'default', theme: 'purple', rounded: 'rounded-2xl' },
  capacity: { variant: 'default', theme: 'amber', rounded: 'rounded-2xl' }
};

export const defaultDashboardLayout = {
  density: 'compact', // 'compact' | 'comfortable'
  columns: 2, // 1 | 2 | 3 | 4
  hiddenWidgets: [],
  widgetOrder: ['metrics', 'tracker', 'status', 'env', 'activity', 'capacity']
};

const useUIStore = create(
  persist(
    (set, get) => ({
      view: 'board', // 'board' | 'table' | 'dashboard' | 'admin'
      selectedMonth: getCurrentMonth(),
      filters: defaultFilters,
      savedViews: initialSavedViews,
      activeSavedViewId: 'all',
      isModalOpen: false,
      editingTask: null,
      isOwnerModalOpen: false,

      // Dashboard & UI Customization State
      dashboardDensity: 'compact', // 'compact' (compact free space) or 'comfortable'
      dashboardColumns: 2, // 1 | 2 | 3 | 4
      hiddenWidgets: [],
      widgetOrder: ['metrics', 'tracker', 'status', 'env', 'activity', 'capacity'],
      widgetStyles: defaultWidgetStyles,
      isCustomizerOpen: false,

      setView: (view) => set({ view }),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        activeSavedViewId: null
      })),

      resetFilters: () => set({ 
        filters: defaultFilters, 
        selectedMonth: getCurrentMonth(),
        activeSavedViewId: 'all'
      }),

      applySavedView: (viewObj) => set({
        filters: { ...defaultFilters, ...viewObj.filters },
        activeSavedViewId: viewObj.id
      }),

      saveCurrentView: (name) => {
        const newView = {
          id: `custom_${Date.now()}`,
          name,
          filters: { ...get().filters }
        };
        set((state) => ({
          savedViews: [...state.savedViews, newView],
          activeSavedViewId: newView.id
        }));
      },

      deleteSavedView: (id) => {
        set((state) => ({
          savedViews: state.savedViews.filter(v => v.id !== id),
          activeSavedViewId: state.activeSavedViewId === id ? null : state.activeSavedViewId
        }));
      },

      openModal: (task = null) => set({ isModalOpen: true, editingTask: task }),
      closeModal: () => set({ isModalOpen: false, editingTask: null }),

      openOwnerModal: () => set({ isOwnerModalOpen: true }),
      closeOwnerModal: () => set({ isOwnerModalOpen: false }),

      // Customization Actions
      setDashboardDensity: (density) => set({ dashboardDensity: density }),
      setDashboardColumns: (columns) => set({ dashboardColumns: columns }),
      toggleWidgetVisibility: (widgetId) => set((state) => {
        const isHidden = state.hiddenWidgets.includes(widgetId);
        return {
          hiddenWidgets: isHidden
            ? state.hiddenWidgets.filter(id => id !== widgetId)
            : [...state.hiddenWidgets, widgetId]
        };
      }),
      setWidgetOrder: (order) => set({ widgetOrder: order }),
      setWidgetStyle: (widgetId, styleObj) => set((state) => ({
        widgetStyles: {
          ...state.widgetStyles,
          [widgetId]: {
            ...(state.widgetStyles[widgetId] || defaultWidgetStyles.metrics),
            ...styleObj
          }
        }
      })),
      resetDashboardLayout: () => set({
        dashboardDensity: 'compact',
        dashboardColumns: 2,
        hiddenWidgets: [],
        widgetOrder: ['metrics', 'tracker', 'status', 'env', 'activity', 'capacity'],
        widgetStyles: defaultWidgetStyles
      }),

      openCustomizer: () => set({ isCustomizerOpen: true }),
      closeCustomizer: () => set({ isCustomizerOpen: false })
    }),
    {
      name: 'qa-control-ui-store',
      partialize: (state) => ({
        view: state.view,
        selectedMonth: state.selectedMonth,
        activeSavedViewId: state.activeSavedViewId,
        dashboardDensity: state.dashboardDensity,
        dashboardColumns: state.dashboardColumns,
        hiddenWidgets: state.hiddenWidgets,
        widgetOrder: state.widgetOrder,
        widgetStyles: state.widgetStyles
      })
    }
  )
);

export default useUIStore;

