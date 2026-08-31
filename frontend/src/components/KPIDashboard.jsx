import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  LuTrendingUp as TrendingUp, 
  LuCircleCheck as CheckCircle2, 
  LuOctagonAlert as AlertOctagon, 
  LuTestTube as TestTube,
  LuSlidersHorizontal as SlidersHorizontal,
  LuMinimize2 as Minimize2
} from 'react-icons/lu';
import ImpKpiTracker from './ImpKpiTracker';
import { CustomWidgetGrid, CustomButton } from './ui';
import useUIStore from '../stores/uiStore';

const statusColors = {
  feedback: '#EF4444',
  progress: '#F59E0B',
  testing: '#3B82F6',
  success: '#8B5CF6',
  done: '#10B981',
  done_production: '#0D9488',
  backlog: '#64748B'
};

export default function KPIDashboard({ tasks = [], owners = [] }) {
  const {
    dashboardDensity,
    dashboardColumns,
    hiddenWidgets,
    widgetOrder,
    widgetStyles,
    setWidgetOrder,
    openCustomizer
  } = useUIStore();

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const doneProduction = tasks.filter(t => t.status === 'done_production').length;
  const success = tasks.filter(t => t.status === 'success').length;
  const testing = tasks.filter(t => t.status === 'testing').length;
  const feedback = tasks.filter(t => t.status === 'feedback').length;
  const progress = tasks.filter(t => t.status === 'progress').length;
  const backlog = tasks.filter(t => t.status === 'backlog').length;

  const doneRate = total > 0 ? Math.round(((done + doneProduction) / total) * 100) : 0;
  const activeThroughput = done + doneProduction + success;
  const inQAPipeline = testing + success;

  const isCompact = dashboardDensity === 'compact';
  const chartHeightClass = isCompact ? 'h-48' : 'h-64';

  const kpiTiles = [
    {
      title: 'Active Throughput',
      value: activeThroughput,
      subtitle: `${done} deployed + ${success} QA passed`,
      icon: TrendingUp,
      iconColor: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Done / Deployed %',
      value: `${doneRate}%`,
      subtitle: `${done} of ${total} total tasks`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'Blockers / Issues',
      value: feedback,
      subtitle: 'Requiring immediate triage',
      icon: AlertOctagon,
      iconColor: 'text-rose-600 bg-rose-50'
    },
    {
      title: 'In QA Pipeline',
      value: inQAPipeline,
      subtitle: `${testing} testing + ${success} success`,
      icon: TestTube,
      iconColor: 'text-purple-600 bg-purple-50'
    }
  ];

  // Donut chart dataset
  const donutData = [
    { name: 'Feedback & Issue', value: feedback, color: statusColors.feedback },
    { name: 'In Progress', value: progress, color: statusColors.progress },
    { name: 'Testing / QA', value: testing, color: statusColors.testing },
    { name: 'QA Success', value: success, color: statusColors.success },
    { name: 'Done / Deployed', value: done, color: statusColors.done },
    { name: 'Done Production', value: doneProduction, color: statusColors.done_production },
    { name: 'Backlog / Pending', value: backlog, color: statusColors.backlog }
  ].filter(d => d.value > 0);

  // Environment breakdown dataset
  const envCounts = { Development: 0, Production: 0, TestFlight: 0, UAT: 0 };
  tasks.forEach(t => {
    if (envCounts[t.pushTo] !== undefined) {
      envCounts[t.pushTo]++;
    }
  });
  const envData = Object.entries(envCounts).map(([name, count]) => ({ name, count }));

  // Task Activity Over Time dataset
  const dateMap = {};
  tasks.forEach(t => {
    if (t.date) {
      dateMap[t.date] = (dateMap[t.date] || 0) + 1;
    }
  });
  const activityData = Object.entries(dateMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  // Swimlane capacity bar chart dataset
  const columnCapacityData = [
    { name: 'Feedback', count: feedback, fill: statusColors.feedback },
    { name: 'Progress', count: progress, fill: statusColors.progress },
    { name: 'Testing', count: testing, fill: statusColors.testing },
    { name: 'Success', count: success, fill: statusColors.success },
    { name: 'Done', count: done, fill: statusColors.done },
    { name: 'Done Prod', count: doneProduction, fill: statusColors.done_production },
    { name: 'Backlog', count: backlog, fill: statusColors.backlog }
  ];

  // Helper to extract style for a specific widget ID
  const getWidgetStyle = (id) => widgetStyles?.[id] || { variant: 'default', theme: 'blue', rounded: 'rounded-2xl' };

  // Map all dashboard widget cards for draggable dashboard grid
  const chartWidgets = React.useMemo(() => {
    const map = {
      metrics: {
        id: 'metrics',
        title: 'Executive Summary Cards',
        subtitle: 'Key Quality & Throughput Indicators',
        badgeText: 'Summary',
        className: 'col-span-full',
        variant: getWidgetStyle('metrics').variant,
        theme: getWidgetStyle('metrics').theme,
        rounded: getWidgetStyle('metrics').rounded,
        content: (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${isCompact ? 'gap-2.5' : 'gap-4'}`}>
            {kpiTiles.map((tile) => (
              <div key={tile.title} className={`bg-slate-50/70 rounded-xl border border-slate-200/70 ${isCompact ? 'p-2.5' : 'p-3.5'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {tile.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${tile.iconColor}`}>
                    <tile.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className={`${isCompact ? 'text-xl' : 'text-2xl'} font-extrabold text-slate-900 tracking-tight`}>
                  {tile.value}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {tile.subtitle}
                </p>
              </div>
            ))}
          </div>
        )
      },
      tracker: {
        id: 'tracker',
        title: 'IMP 2026 Goal Target Tracker',
        subtitle: 'Executive Milestone Category Progress',
        badgeText: 'Goals 2026',
        className: 'col-span-full',
        variant: getWidgetStyle('tracker').variant,
        theme: getWidgetStyle('tracker').theme,
        rounded: getWidgetStyle('tracker').rounded,
        content: <ImpKpiTracker tasks={tasks} owners={owners} />
      },
      status: {
        id: 'status',
        title: 'Status Distribution',
        subtitle: `Total: ${total} tasks`,
        badgeText: 'Donut Chart',
        variant: getWidgetStyle('status').variant,
        theme: getWidgetStyle('status').theme,
        rounded: getWidgetStyle('status').rounded,
        content: (
          <div className={chartHeightClass}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={isCompact ? 40 : 55} outerRadius={isCompact ? 65 : 80} paddingAngle={3} dataKey="value">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} tasks`, name]} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                {!isCompact && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      },
      env: {
        id: 'env',
        title: 'Environment Breakdown ("Push To")',
        subtitle: 'Target Deployment Environment',
        badgeText: 'Bar Chart',
        variant: getWidgetStyle('env').variant,
        theme: getWidgetStyle('env').theme,
        rounded: getWidgetStyle('env').rounded,
        content: (
          <div className={chartHeightClass}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      },
      activity: {
        id: 'activity',
        title: 'Task Volume Activity Over Time',
        subtitle: 'Created/Updated Timeline Trend',
        badgeText: 'Area Chart',
        variant: getWidgetStyle('activity').variant,
        theme: getWidgetStyle('activity').theme,
        rounded: getWidgetStyle('activity').rounded,
        content: (
          <div className={chartHeightClass}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      },
      capacity: {
        id: 'capacity',
        title: 'Column Capacity & Workload',
        subtitle: 'Kanban Column Task Allocation',
        badgeText: 'Capacity',
        variant: getWidgetStyle('capacity').variant,
        theme: getWidgetStyle('capacity').theme,
        rounded: getWidgetStyle('capacity').rounded,
        content: (
          <div className={chartHeightClass}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={columnCapacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {columnCapacityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      }
    };

    return widgetOrder
      .filter(id => !hiddenWidgets.includes(id))
      .map(id => map[id])
      .filter(Boolean);
  }, [widgetOrder, hiddenWidgets, widgetStyles, donutData, envData, activityData, columnCapacityData, total, isCompact, chartHeightClass, kpiTiles, tasks]);

  return (
    <div className={isCompact ? 'space-y-3' : 'space-y-5'}>
      
      {/* Control Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Interactive Dashboard ({dashboardColumns} Columns)
          </h3>
        </div>
      </div>

      {/* Fully Customizable & Reorderable Drag-and-Drop Widget Grid */}
      <CustomWidgetGrid
        columns={dashboardColumns}
        widgets={chartWidgets}
        onReorder={(newWidgets) => setWidgetOrder(newWidgets.map(w => w.id))}
      />

    </div>
  );
}
