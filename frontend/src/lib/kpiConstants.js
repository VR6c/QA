// 2026 Goals & KPIs Constants & Definitions

export const IMP_KPIS = [
  {
    id: 'quick_test',
    key: 'quick_test',
    title: 'Quick Test on TestFlight',
    shortName: 'Quick Test',
    badgeText: 'Quick Test',
    period: 'monthly',
    periodLabel: 'Per Month',
    goodTarget: 3,
    excellenceTarget: 4,
    unit: 'tests',
    iconName: 'Rocket',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    barColor: 'bg-blue-600',
    description: 'Rapid sanity & smoke testing on TestFlight builds'
  },
  {
    id: 'finding_product_error',
    key: 'finding_product_error',
    title: 'Finding Product Error (Both App/Portal)',
    shortName: 'Finding Product Error',
    badgeText: 'Product Error',
    period: 'weekly',
    periodLabel: 'Per Week',
    goodTarget: 1,
    excellenceTarget: 3,
    unit: 'errors',
    iconName: 'Bug',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    barColor: 'bg-rose-600',
    description: 'Reporting bugs and defects across Mobile App & Web Portal'
  },
  {
    id: 'conduct_testing',
    key: 'conduct_testing',
    title: 'Conduct Testing New Feature (Milestone Task)',
    shortName: 'Conduct Testing',
    badgeText: 'Conduct Testing',
    period: 'monthly',
    periodLabel: 'Per Month',
    goodTarget: 4,
    excellenceTarget: 6,
    unit: 'features',
    iconName: 'TestTube',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    barColor: 'bg-purple-600',
    description: 'Executing test passes for major feature milestone tasks'
  },
  {
    id: 'new_idea',
    key: 'new_idea',
    title: 'New Idea Propose',
    shortName: 'New Idea Propose',
    badgeText: 'New Idea',
    period: 'monthly',
    periodLabel: 'Per Month',
    goodTarget: 1,
    excellenceTarget: 3,
    unit: 'ideas',
    iconName: 'Lightbulb',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    barColor: 'bg-amber-600',
    description: 'Proposing process enhancements and innovative feature ideas'
  },
  {
    id: 'research_template',
    key: 'research_template',
    title: 'Research Testing Template & Document',
    shortName: 'Research & Doc',
    badgeText: 'Research & Doc',
    period: 'monthly',
    periodLabel: 'Per Month',
    goodTarget: 1,
    excellenceTarget: 2,
    unit: 'docs',
    iconName: 'FileText',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    barColor: 'bg-emerald-600',
    description: 'Standardizing test plan templates and QA documentation'
  }
];

export const KPI_CATEGORY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'quick_test', label: 'Quick Test on TestFlight' },
  { value: 'finding_product_error', label: 'Finding Product Error (App/Portal)' },
  { value: 'conduct_testing', label: 'Conduct Testing New Feature' },
  { value: 'new_idea', label: 'New Idea Propose' },
  { value: 'research_template', label: 'Research Testing Template & Document' }
];

export function getAllKpis(customKpiDefinitions = []) {
  return Array.isArray(customKpiDefinitions) ? customKpiDefinitions : [];
}

/**
 * Helper to match user names / owner names flexibly and case-insensitively.
 * E.g., matches "Dev Team" with "Dev Team (Developer)" or "Vireak" with "Vireak (QA Lead)".
 */
export function isUserOwnerMatch(ownerA, ownerB) {
  if (!ownerA || !ownerB) return false;
  const a = String(ownerA).toLowerCase().trim();
  const b = String(ownerB).toLowerCase().trim();
  if (a === b) return true;
  // Clean off parenthetical roles like "(Developer)" or "(QA Lead)"
  const cleanA = a.replace(/\s*\([^)]*\)/g, '').trim();
  const cleanB = b.replace(/\s*\([^)]*\)/g, '').trim();
  if (cleanA && cleanB && (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA))) {
    return true;
  }
  return false;
}

/**
 * Returns the resolved KPI category for a task.
 * Requires explicit task.kpiCategory assignment; standard tasks without explicit KPI tag return 'none'.
 */
export function getTaskKpiCategory(task) {
  if (!task) return 'none';

  // Return explicit kpiCategory if present and not 'none'
  if (task.kpiCategory && task.kpiCategory !== 'none') {
    return task.kpiCategory;
  }

  return 'none';
}


