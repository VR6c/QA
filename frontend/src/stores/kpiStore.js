import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IMP_KPIS, isUserOwnerMatch } from '../lib/kpiConstants';

export const useKPIStore = create(
  persist(
    (set, get) => ({
      // Object mapping owner/person name -> { [kpiId]: { goodTarget: number, excellenceTarget: number } }
      personTargets: {},

      // Array of custom user-defined KPI categories
      customKpiDefinitions: [],

      // Array of disabled/hidden KPI IDs (both standard & custom)
      disabledKpiIds: [],

      // Active person filter for KPI view ('all' or person/owner name)
      selectedPersonKpiFilter: 'all',

      setSelectedPersonKpiFilter: (personName) => set({ selectedPersonKpiFilter: personName }),

      // CREATE or UPDATE custom target for a specific person & KPI category
      setPersonTarget: (personName, kpiId, goodTarget, excellenceTarget) => {
        if (!personName) return;
        const normalizedName = personName.trim();
        const goodNum = goodTarget !== undefined && goodTarget !== '' ? Number(goodTarget) : undefined;
        const excNum = excellenceTarget !== undefined && excellenceTarget !== '' ? Number(excellenceTarget) : undefined;
        // Don't store NaN values
        if ((goodNum !== undefined && isNaN(goodNum)) || (excNum !== undefined && isNaN(excNum))) return;
        // Only store if at least one value is valid
        if (goodNum === undefined && excNum === undefined) return;
        set((state) => {
          const currentPersonObj = state.personTargets[normalizedName] || {};
          return {
            personTargets: {
              ...state.personTargets,
              [normalizedName]: {
                ...currentPersonObj,
                [kpiId]: {
                  ...(goodNum !== undefined ? { goodTarget: goodNum } : {}),
                  ...(excNum !== undefined ? { excellenceTarget: excNum } : {})
                }
              }
            }
          };
        });
      },

      // DELETE specific single KPI target override for a person
      deletePersonKpiTarget: (personName, kpiId) => {
        if (!personName) return;
        const normalizedName = personName.trim();
        set((state) => {
          const currentPersonObj = { ...(state.personTargets[normalizedName] || {}) };
          delete currentPersonObj[kpiId];
          const updatedPersonTargets = { ...state.personTargets };
          if (Object.keys(currentPersonObj).length === 0) {
            delete updatedPersonTargets[normalizedName];
          } else {
            updatedPersonTargets[normalizedName] = currentPersonObj;
          }
          return { personTargets: updatedPersonTargets };
        });
      },

      // RESET all custom targets for a specific person back to defaults
      resetPersonTargets: (personName) => {
        if (!personName) return;
        const normalizedName = personName.trim();
        set((state) => {
          const updated = { ...state.personTargets };
          delete updated[normalizedName];
          return { personTargets: updated };
        });
      },

      // RESET targets for ALL persons
      resetAllPersonTargets: () => set({ personTargets: {} }),

      // GET resolved targets for a specific person & KPI ID
      getResolvedTarget: (personName, kpiId, defaultGood, defaultExcellence) => {
        if (!personName || personName === 'all') {
          return { goodTarget: defaultGood, excellenceTarget: defaultExcellence, isCustomized: false };
        }
        const targetsMap = get().personTargets;
        const normalizedName = personName.trim();

        // Find direct key match or fuzzy user owner match
        let personObj = targetsMap[normalizedName];
        if (!personObj) {
          const matchedKey = Object.keys(targetsMap).find(key => isUserOwnerMatch(key, normalizedName));
          if (matchedKey) {
            personObj = targetsMap[matchedKey];
          }
        }

        if (personObj && personObj[kpiId]) {
          const storedGood = personObj[kpiId].goodTarget;
          const storedExc = personObj[kpiId].excellenceTarget;
          const resolvedGood = (storedGood !== undefined && !isNaN(storedGood)) ? storedGood : defaultGood;
          const resolvedExc = (storedExc !== undefined && !isNaN(storedExc)) ? storedExc : defaultExcellence;
          return {
            goodTarget: resolvedGood,
            excellenceTarget: resolvedExc,
            isCustomized: true
          };
        }
        return { goodTarget: defaultGood, excellenceTarget: defaultExcellence, isCustomized: false };
      },


      // CREATE a new custom KPI category definition
      addCustomKpiDefinition: (newKpi) => {
        const id = `custom_${Date.now()}`;
        const kpiWithDefaults = {
          id,
          key: id,
          title: newKpi.title,
          shortName: newKpi.shortName || newKpi.title,
          badgeText: newKpi.badgeText || newKpi.shortName || newKpi.title,
          period: newKpi.period || 'monthly',
          periodLabel: newKpi.period === 'weekly' ? 'Per Week' : 'Per Month',
          goodTarget: Number(newKpi.goodTarget || 1),
          excellenceTarget: Number(newKpi.excellenceTarget || 3),
          unit: newKpi.unit || 'tasks',
          iconName: newKpi.iconName || 'Target',
          bgLight: newKpi.bgLight || 'bg-indigo-50',
          borderLight: newKpi.borderLight || 'border-indigo-200',
          textColor: newKpi.textColor || 'text-indigo-700',
          badgeBg: newKpi.badgeBg || 'bg-indigo-100 text-indigo-800 border-indigo-200',
          barColor: newKpi.barColor || 'bg-indigo-600',
          description: newKpi.description || 'Custom defined KPI metric',
          isCustom: true
        };

        set((state) => ({
          customKpiDefinitions: [...state.customKpiDefinitions, kpiWithDefaults]
        }));
      },

      // IMPORT standard 2026 KPIs into custom list
      importStandardKpis: () => {
        const standardList = IMP_KPIS.map(k => ({ ...k, isCustom: true }));
        set((state) => {
          const existingIds = new Set(state.customKpiDefinitions.map(k => k.id));
          const toAdd = standardList.filter(k => !existingIds.has(k.id));
          return {
            customKpiDefinitions: [...state.customKpiDefinitions, ...toAdd]
          };
        });
      },

      // UPDATE existing custom KPI definition
      updateCustomKpiDefinition: (id, updatedData) => {
        set((state) => ({
          customKpiDefinitions: state.customKpiDefinitions.map(k => {
            if (k.id === id) {
              return {
                ...k,
                ...updatedData,
                goodTarget: Number(updatedData.goodTarget ?? k.goodTarget),
                excellenceTarget: Number(updatedData.excellenceTarget ?? k.excellenceTarget)
              };
            }
            return k;
          })
        }));
      },

      // DELETE custom KPI definition
      deleteCustomKpiDefinition: (id) => {
        set((state) => ({
          customKpiDefinitions: state.customKpiDefinitions.filter(k => k.id !== id)
        }));
      },

      // TOGGLE Disable / Enable any KPI definition
      toggleDisableKpi: (id) => {
        set((state) => {
          const isDisabled = state.disabledKpiIds.includes(id);
          return {
            disabledKpiIds: isDisabled
              ? state.disabledKpiIds.filter(kId => kId !== id)
              : [...state.disabledKpiIds, id]
          };
        });
      }
    }),
    {
      name: 'qa-control-kpi-store'
    }
  )
);

export default useKPIStore;
