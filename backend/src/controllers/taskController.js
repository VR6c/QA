import Task from '../models/Task.js';
import { recordActivity } from '../services/auditLogger.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const taskController = {
  // GET /api/tasks
  getAllTasks: async (req, res) => {
    try {
      const query = {};
      if (req.query.user) {
        query.user = { $regex: new RegExp(`^${escapeRegex(req.query.user.trim())}$`, 'i') };
      }
      if (req.query.owner) {
        query.owner = { $regex: new RegExp(`^${escapeRegex(req.query.owner.trim())}$`, 'i') };
      }

      const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
      return sendSuccess(res, tasks, { total: tasks.length }, 'Tasks retrieved successfully');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return sendError(res, error.message || 'Failed to fetch tasks', 500, 'ERR_INTERNAL');
    }
  },

  // POST /api/tasks
  createTask: async (req, res) => {
    try {
      const { title, status, pushTo, reason, timeline, remark, date, flowType, flowValue, kpiCategory, user, owner } = req.body;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Title is required', 400, 'ERR_VALIDATION');
      }

      const trimmedTitle = title.trim();

      const existingTask = await Task.findOne({
        title: { $regex: new RegExp(`^${escapeRegex(trimmedTitle)}$`, 'i') }
      }).lean();

      if (existingTask) {
        return sendError(res, `Task title "${trimmedTitle}" already exists. Duplicate titles are not allowed.`, 409, 'ERR_CONFLICT');
      }

      const newTask = new Task({
        title: trimmedTitle,
        status: status || 'backlog',
        pushTo: pushTo || 'Development',
        reason: reason || '',
        timeline: timeline || '',
        remark: remark || '',
        date: date || '2026-08-01',
        flowType: flowType || 'none',
        flowValue: flowValue || '',
        kpiCategory: kpiCategory || 'none',
        user: user || req.user?.name || 'Unassigned',
        owner: owner || 'Unassigned'
      });

      await newTask.save();

      recordActivity({
        req,
        module: 'Task Management',
        action: 'TASK_CREATED',
        targetType: 'Task',
        targetId: newTask._id.toString(),
        targetName: newTask.title,
        description: `Created task "${newTask.title}" assigned to owner ${newTask.owner}`,
        newValue: {
          title: newTask.title,
          status: newTask.status,
          owner: newTask.owner,
          pushTo: newTask.pushTo,
          date: newTask.date
        }
      });

      return sendSuccess(res, newTask, null, 'Task created successfully', 201);
    } catch (error) {
      console.error('Error creating task:', error);
      return sendError(res, error.message || 'Failed to create task', 400, 'ERR_VALIDATION');
    }
  },

  // PATCH /api/tasks/:id
  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body, updatedAt: new Date() };

      const currentTask = await Task.findById(id);
      if (!currentTask) {
        return sendError(res, `Task with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      const oldValueSnapshot = {
        title: currentTask.title,
        status: currentTask.status,
        owner: currentTask.owner,
        pushTo: currentTask.pushTo,
        reason: currentTask.reason,
        remark: currentTask.remark
      };

      if (updateData.title && typeof updateData.title === 'string') {
        const trimmedTitle = updateData.title.trim();
        if (!trimmedTitle) {
          return sendError(res, 'Title cannot be empty', 400, 'ERR_VALIDATION');
        }

        const existingTask = await Task.findOne({
          _id: { $ne: id },
          title: { $regex: new RegExp(`^${escapeRegex(trimmedTitle)}$`, 'i') }
        }).lean();

        if (existingTask) {
          return sendError(res, `Task title "${trimmedTitle}" already exists. Duplicate titles are not allowed.`, 409, 'ERR_CONFLICT');
        }
        updateData.title = trimmedTitle;
      }

      const task = await Task.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      const newValueSnapshot = {
        title: task.title,
        status: task.status,
        owner: task.owner,
        pushTo: task.pushTo,
        reason: task.reason,
        remark: task.remark
      };

      const isOnlyStatusChange = Object.keys(req.body).length === 1 && req.body.status !== undefined;
      const actionType = isOnlyStatusChange ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED';
      const actionDesc = isOnlyStatusChange
        ? `Changed task status for "${task.title}" from ${oldValueSnapshot.status} to ${task.status}`
        : `Updated task details for "${task.title}"`;

      recordActivity({
        req,
        module: 'Task Management',
        action: actionType,
        targetType: 'Task',
        targetId: task._id.toString(),
        targetName: task.title,
        description: actionDesc,
        oldValue: oldValueSnapshot,
        newValue: newValueSnapshot
      });

      return sendSuccess(res, task, null, 'Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      return sendError(res, error.message || 'Failed to update task', 400, 'ERR_VALIDATION');
    }
  },

  // DELETE /api/tasks/:id
  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.findByIdAndDelete(id);

      if (!task) {
        return sendError(res, `Task with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      recordActivity({
        req,
        module: 'Task Management',
        action: 'TASK_DELETED',
        targetType: 'Task',
        targetId: task._id.toString(),
        targetName: task.title,
        description: `Deleted task "${task.title}" (Owner: ${task.owner})`,
        oldValue: {
          title: task.title,
          status: task.status,
          owner: task.owner
        }
      });

      return sendSuccess(res, { id }, null, 'Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      return sendError(res, error.message || 'Failed to delete task', 500, 'ERR_INTERNAL');
    }
  },

  // DELETE /api/tasks/clear-all
  clearAllTasks: async (req, res) => {
    try {
      const result = await Task.deleteMany({});

      recordActivity({
        req,
        module: 'Task Management',
        action: 'TASKS_CLEARED',
        description: `Cleared all task records from database (Count: ${result.deletedCount})`
      });

      return sendSuccess(res, { deletedCount: result.deletedCount }, null, 'All records removed from database successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      return sendError(res, error.message || 'Failed to clear database', 500, 'ERR_INTERNAL');
    }
  },

  // POST /api/tasks/seed
  seedTasks: async (req, res) => {
    try {
      const { sampleTasks } = await import('../seed/sampleData.js');
      const deleteResult = await Task.deleteMany({});
      const insertedDocs = await Task.insertMany(sampleTasks);

      recordActivity({
        req,
        module: 'Task Management',
        action: 'TASKS_IMPORTED',
        description: `Imported ${insertedDocs.length} sample tasks`
      });

      return sendSuccess(res, {
        seeded: true,
        count: insertedDocs.length,
        deleted: deleteResult.deletedCount
      }, null, 'Sample tasks seeded successfully');
    } catch (error) {
      console.error('Error seeding tasks:', error);
      return sendError(res, error.message || 'Failed to seed sample tasks', 500, 'ERR_INTERNAL');
    }
  }
};
