import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const columnConfigs = {
  feedback: {
    title: 'Feedback & Issue',
    badgeBg: 'bg-rose-100 text-rose-700 border-rose-200',
    headerBg: 'bg-rose-50 border-rose-200',
    accentBar: 'bg-rose-500',
    hex: '#EF4444'
  },
  progress: {
    title: 'In Progress',
    badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
    headerBg: 'bg-amber-50 border-amber-200',
    accentBar: 'bg-amber-500',
    hex: '#F59E0B'
  },
  testing: {
    title: 'Testing / QA',
    badgeBg: 'bg-blue-100 text-blue-700 border-blue-200',
    headerBg: 'bg-blue-50 border-blue-200',
    accentBar: 'bg-blue-500',
    hex: '#3B82F6'
  },
  success: {
    title: 'QA Success',
    badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
    headerBg: 'bg-purple-50 border-purple-200',
    accentBar: 'bg-purple-500',
    hex: '#8B5CF6'
  },
  done: {
    title: 'Done / Deployed',
    badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    headerBg: 'bg-emerald-50 border-emerald-200',
    accentBar: 'bg-emerald-500',
    hex: '#10B981'
  },
  done_production: {
    title: 'Done Production',
    badgeBg: 'bg-teal-100 text-teal-700 border-teal-200',
    headerBg: 'bg-teal-50 border-teal-200',
    accentBar: 'bg-teal-500',
    hex: '#0D9488'
  },
  backlog: {
    title: 'Backlog / Pending',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    headerBg: 'bg-slate-100 border-slate-200',
    accentBar: 'bg-slate-500',
    hex: '#64748B'
  }
};

export default function KanbanColumn({ id, tasks = [], onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfigs[id] || columnConfigs.backlog;
  const taskIds = tasks.map(t => t.id);

  return (
    <div className="flex-1 min-w-[260px] max-w-[320px] flex flex-col rounded-xl bg-slate-100/70 border border-slate-200 overflow-hidden shadow-2xs">
      
      {/* Swimlane Header */}
      <div className={`px-3.5 py-3 border-b flex items-center justify-between ${config.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.accentBar}`} />
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            {config.title}
          </h3>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable Swimlane Body */}
      <div 
        ref={setNodeRef}
        className={`flex-1 p-2.5 space-y-2.5 min-h-[380px] transition-colors ${
          isOver ? 'bg-blue-50/60 ring-2 ring-blue-400 ring-inset' : ''
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-4">
            <span className="text-xs font-medium text-slate-400">
              Drag tasks here
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
