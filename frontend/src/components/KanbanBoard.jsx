import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import useUIStore from '../stores/uiStore';

const columnIds = ['backlog', 'progress', 'feedback', 'testing', 'success', 'done', 'done_production'];

export default function KanbanBoard({ tasks = [], onStatusChange, onEdit, onDelete, onStartTesting, onPauseTesting }) {
  const { dashboardDensity } = useUIStore();
  const isCompact = dashboardDensity === 'compact';
  const [activeTask, setActiveTask] = useState(null);

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

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => String(t.id || t._id) === String(active.id));
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const activeTaskObj = tasks.find(t => String(t.id || t._id) === String(activeId));
    if (!activeTaskObj) return;

    // Determine target column status
    let targetStatus = over.id;

    // If dropped over another task, find that task's status
    if (!columnIds.includes(targetStatus)) {
      const overTask = tasks.find(t => String(t.id || t._id) === String(over.id));
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (columnIds.includes(targetStatus) && activeTaskObj.status !== targetStatus) {
      onStatusChange(activeTaskObj.id || activeTaskObj._id, targetStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`flex overflow-x-auto snap-x snap-mandatory pb-4 pt-1 min-h-[500px] scroll-smooth ${isCompact ? 'gap-2' : 'gap-3 sm:gap-3.5'}`}>
        {columnIds.map((colId) => (
          <KanbanColumn
            key={colId}
            id={colId}
            tasks={groupedTasks[colId] || []}
            onEdit={onEdit}
            onDelete={onDelete}
            onStartTesting={onStartTesting}
            onPauseTesting={onPauseTesting}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
