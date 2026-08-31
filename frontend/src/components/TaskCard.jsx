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
  Development: 'bg-amber-50 text-amber-700 border-amber-200/80',
  Production: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  TestFlight: 'bg-blue-50 text-blue-700 border-blue-200/80',
  UAT: 'bg-violet-50 text-violet-700 border-violet-200/80'
};

const envDotColors = {
  Development: 'bg-amber-500',
  Production: 'bg-emerald-500',
  TestFlight: 'bg-blue-500',
  UAT: 'bg-violet-500'
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? 1.02 : 1
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-xs transition-all group relative cursor-default border-l-4 border-l-slate-300 hover:border-l-blue-500"
    >
      <div className="flex items-start justify-between gap-2">

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">

          {/* Metadata Row (Date, Owner, Push To Environment & IMP Flow & KPI Badge) */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>

            {/* Task Owner Title Badge */}
            {task.owner && task.owner !== 'Unassigned' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200/80" title={`Owner Title: ${task.owner}${task.user ? ` (Logged by ${task.user})` : ''}`}>
                <User className="w-2.5 h-2.5 opacity-80 text-blue-600" />
                <span>{task.owner}</span>
              </span>
            )}

            {/* Optional Task User Badge (Reporter if different) */}
            {task.user && task.user !== 'Unassigned' && task.user !== task.owner && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-[10px] bg-slate-100 text-slate-600 border border-slate-200" title={`Task Logger / Reporter: ${task.user}`}>
                <span>by {task.user}</span>
              </span>
            )}

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border text-[10px] ${envStyles[task.pushTo] || 'bg-slate-100 text-slate-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${envDotColors[task.pushTo] || 'bg-slate-400'}`} />
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
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${task.flowType === 'monthly' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  task.flowType === 'weekly' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                <Tag className="w-2.5 h-2.5 opacity-70" />
                {task.flowType === 'monthly' && 'Monthly'}
                {task.flowType === 'weekly' && 'Weekly'}
                {task.flowType === 'yearly' && 'Yearly'}
                {task.flowValue && <span className="opacity-80 font-medium">: {task.flowValue}</span>}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
            {task.title}
          </h4>

          {/* Reason / Notes Snippet */}
          {task.reason && (
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/80 p-1.5 rounded-md border border-slate-100">
              {task.reason}
            </p>
          )}

          {/* Remark Line (Italic) */}
          {task.remark && (
            <p className="text-[11px] text-slate-400 italic truncate pt-0.5">
              {task.remark}
            </p>
          )}

        </div>

        {/* Action Controls & Drag Handle */}
        <div className="flex flex-col items-center justify-between gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 text-slate-300 hover:text-slate-600 rounded cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder/change swimlane"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Quick Actions (Hover visible) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <ConfirmPopover
              title="Delete this task?"
              subtitle={`${task.owner || task.user || 'Unassigned'}${formattedDate ? ` · ${formattedDate}` : ''}`}
              confirmText="Delete"
              onConfirm={() => onDelete(task.id)}
            >
              <button
                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
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
