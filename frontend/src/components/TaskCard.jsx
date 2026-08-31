import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LuGripVertical as GripVertical,
  LuSquarePen as Edit2,
  LuTrash2 as Trash2,
  LuCalendar as Calendar,
  LuTag as Tag,
  LuAward as Award,
  LuUser as User
} from 'react-icons/lu';
import { format, parseISO } from 'date-fns';
import { getAllKpis, getTaskKpiCategory } from '../lib/kpiConstants';
import useKPIStore from '../stores/kpiStore';
import { ConfirmPopover } from './ui';

const envStyles = {
  Development: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
  Production: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
  TestFlight: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
  UAT: 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
};

const envDotColors = {
  Development: 'bg-amber-600',
  Production: 'bg-emerald-600',
  TestFlight: 'bg-blue-600',
  UAT: 'bg-purple-600'
};

const statusBorderColors = {
  feedback: 'border-l-rose-500 hover:border-l-rose-600 shadow-rose-500/5',
  progress: 'border-l-amber-500 hover:border-l-amber-600 shadow-amber-500/5',
  testing: 'border-l-blue-500 hover:border-l-blue-600 shadow-blue-500/5',
  success: 'border-l-purple-500 hover:border-l-purple-600 shadow-purple-500/5',
  done: 'border-l-emerald-500 hover:border-l-emerald-600 shadow-emerald-500/5',
  done_production: 'border-l-teal-500 hover:border-l-teal-600 shadow-teal-500/5',
  backlog: 'border-l-sky-500 hover:border-l-sky-600 shadow-sky-500/5'
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const taskId = String(task.id || task._id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.02 : 1,
    touchAction: 'none'
  };

  const formattedDate = (() => {
    try {
      return task.date ? format(parseISO(task.date), 'MMM dd, yyyy') : '';
    } catch (e) {
      return task.date || '';
    }
  })();

  const customKpiDefinitions = useKPIStore((state) => state.customKpiDefinitions);
  const resolvedKpiKey = getTaskKpiCategory(task);
  const kpiMeta = getAllKpis(customKpiDefinitions).find(k => k.id === resolvedKpiKey);

  const cardBorderClass = statusBorderColors[task.status] || 'border-l-sky-500 hover:border-l-sky-600';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative cursor-grab active:cursor-grabbing border-l-[5px] ${cardBorderClass}`}
    >
      <div className="flex items-start justify-between gap-2">

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">

          {/* Metadata Row (Date, Owner, Push To Environment & IMP Flow & KPI Badge) */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            {formattedDate && (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3 text-slate-500" />
                {formattedDate}
              </span>
            )}

            {/* Developer Dateline Badge */}
            {task.datelineDeveloper && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200" title={`DateLine From Developer: ${task.datelineDeveloper}`}>
                <Calendar className="w-2.5 h-2.5 text-amber-600" />
                <span>Dev: {task.datelineDeveloper}</span>
              </span>
            )}

            {/* Testing Dateline Badge */}
            {task.datelineTesting && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-800 border border-blue-200" title={`DateLine Testing: ${task.datelineTesting}`}>
                <Calendar className="w-2.5 h-2.5 text-blue-600" />
                <span>Testing: {task.datelineTesting}</span>
              </span>
            )}

            {/* Task Owner Title Badge */}
            {task.owner && task.owner !== 'Unassigned' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-200" title={`Owner Title: ${task.owner}${task.user ? ` (Logged by ${task.user})` : ''}`}>
                <User className="w-2.5 h-2.5 opacity-90 text-blue-700" />
                <span>{task.owner}</span>
              </span>
            )}

            {/* Optional Task User Badge (Reporter if different) */}
            {task.user && task.user !== 'Unassigned' && task.user !== task.owner && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200" title={`Task Logger / Reporter: ${task.user}`}>
                <span>by {task.user}</span>
              </span>
            )}

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${envStyles[task.pushTo] || 'bg-slate-100 text-slate-800'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${envDotColors[task.pushTo] || 'bg-slate-500'}`} />
              {task.pushTo}
            </span>

            {/* KPI Category Badge */}
            {kpiMeta && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold border text-[10px] ${kpiMeta.badgeBg}`}>
                <Award className="w-2.5 h-2.5" />
                {kpiMeta.shortName}
              </span>
            )}

            {task.flowType && task.flowType !== 'none' && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${task.flowType === 'monthly' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                  task.flowType === 'weekly' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                    'bg-purple-100 text-purple-800 border-purple-200'
                }`}>
                <Tag className="w-2.5 h-2.5 opacity-80" />
                {task.flowType === 'monthly' && 'Monthly'}
                {task.flowType === 'weekly' && 'Weekly'}
                {task.flowType === 'yearly' && 'Yearly'}
                {task.flowValue && <span className="opacity-90 font-semibold">: {task.flowValue}</span>}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
            {task.title}
          </h4>

          {/* Reason / Notes Snippet */}
          {task.reason && (
            <p className="text-[11px] text-slate-700 font-normal line-clamp-2 leading-relaxed bg-slate-50/90 p-2 rounded-lg border border-slate-200/80">
              {task.reason}
            </p>
          )}

          {/* Remark Line (Italic) */}
          {task.remark && (
            <p className="text-[11px] text-slate-500 font-medium italic truncate pt-0.5">
              {task.remark}
            </p>
          )}

        </div>

        {/* Action Controls & Drag Handle */}
        <div className="flex flex-col items-center justify-between gap-2.5 pl-1">
          {/* Drag Handle Icon */}
          <div
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Drag to reorder/change swimlane"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Quick Actions (Hover visible) */}
          <div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <ConfirmPopover
              title="Delete this task?"
              subtitle={`${task.owner || task.user || 'Unassigned'}${formattedDate ? ` · ${formattedDate}` : ''}`}
              confirmText="Delete"
              onConfirm={() => onDelete(taskId)}
            >
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </ConfirmPopover>
          </div>
        </div>

      </div>
    </div>
  );
}
