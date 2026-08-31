import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const columnConfigs = {
  feedback: {
    title: 'Feedback & Issue',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    headerBg: 'bg-rose-100/90 border-rose-200',
    columnBg: 'bg-rose-50/70 border-rose-200/80',
    accentBar: 'bg-rose-500',
    hex: '#EF4444'
  },
  progress: {
    title: 'In Progress',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    headerBg: 'bg-amber-100/90 border-amber-200',
    columnBg: 'bg-amber-50/70 border-amber-200/80',
    accentBar: 'bg-amber-500',
    hex: '#F59E0B'
  },
  testing: {
    title: 'Testing / QA',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    headerBg: 'bg-blue-100/90 border-blue-200',
    columnBg: 'bg-blue-50/70 border-blue-200/80',
    accentBar: 'bg-blue-500',
    hex: '#3B82F6'
  },
  success: {
    title: 'QA Success',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    headerBg: 'bg-purple-100/90 border-purple-200',
    columnBg: 'bg-purple-50/70 border-purple-200/80',
    accentBar: 'bg-purple-500',
    hex: '#8B5CF6'
  },
  done: {
    title: 'Done / Deployed',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    headerBg: 'bg-emerald-100/90 border-emerald-200',
    columnBg: 'bg-emerald-50/70 border-emerald-200/80',
    accentBar: 'bg-emerald-500',
    hex: '#10B981'
  },
  done_production: {
    title: 'Done Production',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    headerBg: 'bg-teal-100/90 border-teal-200',
    columnBg: 'bg-teal-50/70 border-teal-200/80',
    accentBar: 'bg-teal-500',
    hex: '#0D9488'
  },
  backlog: {
    title: 'Backlog / Pending',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    headerBg: 'bg-sky-100/80 border-sky-200',
    columnBg: 'bg-slate-100 border-slate-200',
    accentBar: 'bg-sky-500',
    hex: '#0284C7'
  }
};

export default function KanbanColumn({ id, tasks = [], onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfigs[id] || columnConfigs.backlog;
  const taskIds = tasks.map(t => String(t.id || t._id));

  return (
    <div className={`snap-center min-w-[280px] sm:min-w-[300px] max-w-[320px] shrink-0 flex flex-col rounded-xl border overflow-hidden shadow-2xs ${config.columnBg}`}>
      
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
