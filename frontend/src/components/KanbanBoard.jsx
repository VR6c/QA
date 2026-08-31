import React from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import useUIStore from '../stores/uiStore';

const columnIds = ['backlog', 'progress', 'feedback', 'testing', 'success', 'done', 'done_production'];

export default function KanbanBoard({ tasks = [], onStatusChange, onEdit, onDelete }) {
  const { dashboardDensity } = useUIStore();
  const isCompact = dashboardDensity === 'compact';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3
      }
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const activeTask = tasks.find(t => String(t.id) === String(activeId));
    if (!activeTask) return;

    // Determine target column status
    let targetStatus = over.id;

    // If dropped over another task, find that task's status
    if (!columnIds.includes(targetStatus)) {
      const overTask = tasks.find(t => String(t.id) === String(over.id));
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (columnIds.includes(targetStatus) && activeTask.status !== targetStatus) {
      onStatusChange(activeTask.id, targetStatus);
    }
  };

  // Group tasks by column status
  const groupedTasks = columnIds.reduce((acc, colId) => {
    acc[colId] = tasks.filter(t => t.status === colId);
    return acc;
  }, {});

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex overflow-x-auto snap-x snap-mandatory pb-4 pt-1 min-h-[500px] scroll-smooth ${isCompact ? 'gap-2' : 'gap-3 sm:gap-3.5'}`}>
        {columnIds.map((colId) => (
          <KanbanColumn
            key={colId}
            id={colId}
            tasks={groupedTasks[colId] || []}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
