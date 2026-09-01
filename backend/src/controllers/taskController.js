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

      const isSuperAdmin = req.user && ['Super Admin', 'Admin', 'QA Lead'].includes(req.user.role);

      // Data Isolation Rule for Regular Authenticated Users: Only return tasks created by (user) or assigned to (owner) req.user
      if (!isSuperAdmin && req.user?.name) {
        const uName = req.user.name.trim();
        const flexNameRegex = new RegExp(escapeRegex(uName), 'i');
        
        const userOrConditions = [
          { user: flexNameRegex },
          { owner: flexNameRegex }
        ];
        if (req.user.email) {
          const flexEmailRegex = new RegExp(escapeRegex(req.user.email.trim()), 'i');
          userOrConditions.push({ user: flexEmailRegex }, { owner: flexEmailRegex });
        }
        query.$or = userOrConditions;
      }

      if (req.query.user) {
        query.user = { $regex: new RegExp(`^${escapeRegex(req.query.user.trim())}$`, 'i') };
      }
      if (req.query.owner) {
        query.owner = { $regex: new RegExp(`^${escapeRegex(req.query.owner.trim())}$`, 'i') };
      }

      const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
      const formattedTasks = tasks.map(t => ({
        ...t,
        id: t._id.toString()
      }));
      return sendSuccess(res, formattedTasks, { total: formattedTasks.length }, 'Tasks retrieved successfully');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return sendError(res, error.message || 'Failed to fetch tasks', 500, 'ERR_INTERNAL');
    }
  },

  // POST /api/tasks
  createTask: async (req, res) => {
    try {
      const { title, status, pushTo, reason, timeline, remark, date, flowType, flowValue, kpiCategory, user, owner, datelineDeveloper, datelineTesting } = req.body;
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

      const isTerminal = ['success', 'done', 'done_production'].includes(status);
      const newTask = new Task({
        title: trimmedTitle,
        status: status || 'backlog',
        pushTo: pushTo || 'Development',
        reason: reason || '',
        timeline: timeline || '',
        remark: remark || '',
        date: date || '2026-08-01',
        due_date: req.body.due_date || date || null,
        datelineDeveloper: datelineDeveloper || '',
        datelineTesting: datelineTesting || '',
        delay_reason: req.body.delay_reason || '',
        flowType: flowType || 'none',
        flowValue: flowValue || '',
        kpiCategory: kpiCategory || 'none',
        user: user || req.user?.name || 'Unassigned',
        owner: owner || req.user?.name || 'Unassigned',
        completed_at: isTerminal ? new Date() : null
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

      const isSuperAdmin = req.user && ['Super Admin', 'Admin', 'QA Lead'].includes(req.user.role);
      if (!isSuperAdmin && req.user?.name) {
        const uName = req.user.name.toLowerCase().trim();
        const tUser = (currentTask.user || '').toLowerCase().trim();
        const tOwner = (currentTask.owner || '').toLowerCase().trim();
        if (!tUser.includes(uName) && !uName.includes(tUser) && !tOwner.includes(uName) && !uName.includes(tOwner)) {
          return sendError(res, 'Access denied. You can only update your own tasks.', 403, 'ERR_FORBIDDEN');
        }
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

      // Automatically maintain completed_at timestamp & stop active testing timer on status transition
      if (updateData.status) {
        const isTerminalNow = ['success', 'done', 'done_production'].includes(updateData.status);
        const isTerminalBefore = ['success', 'done', 'done_production'].includes(currentTask.status);
        if (isTerminalNow && (!isTerminalBefore || !currentTask.completed_at)) {
          updateData.completed_at = new Date();
        } else if (!isTerminalNow && isTerminalBefore && !currentTask.kpi_claimed_month) {
          updateData.completed_at = null;
        }

        // If moving task away from testing (or stopping clock on status change) while testing_started_at is active
        if (updateData.status !== 'testing' && currentTask.testing_started_at) {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(currentTask.testing_started_at).getTime()) / 1000));
          updateData.testing_duration_seconds = (currentTask.testing_duration_seconds || 0) + elapsed;
          updateData.testing_started_at = null;
          updateData.testing_started_by = null;
        } else if (updateData.status === 'testing' && !currentTask.testing_started_at) {
          // If starting testing via status dropdown/drag-and-drop
          updateData.testing_started_at = new Date();
          updateData.testing_started_by = req.user?.name || req.user?.email || currentTask.owner || 'QA Tester';
        }
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
      const currentTask = await Task.findById(id);

      if (!currentTask) {
        return sendError(res, `Task with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      const isSuperAdmin = req.user && ['Super Admin', 'Admin', 'QA Lead'].includes(req.user.role);
      if (!isSuperAdmin && req.user?.name) {
        const uName = req.user.name.toLowerCase().trim();
        const tUser = (currentTask.user || '').toLowerCase().trim();
        const tOwner = (currentTask.owner || '').toLowerCase().trim();
        if (!tUser.includes(uName) && !uName.includes(tUser) && !tOwner.includes(uName) && !uName.includes(tOwner)) {
          return sendError(res, 'Access denied. You can only delete your own tasks.', 403, 'ERR_FORBIDDEN');
        }
      }

      const task = await Task.findByIdAndDelete(id);

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
  },

  // POST /api/tasks/:id/start-testing
  startTesting: async (req, res) => {
    try {
      const { id } = req.params;
      const currentTask = await Task.findById(id);
      if (!currentTask) {
        return sendError(res, `Task with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      const testerName = req.user?.name || req.user?.email || req.body?.tester_name || currentTask.owner || 'QA Tester';

      // Single active task timer rule: auto-pause any existing active timer for this QA tester
      const otherActiveTasks = await Task.find({
        _id: { $ne: id },
        testing_started_at: { $ne: null },
        $or: [
          { testing_started_by: testerName },
          { owner: testerName },
          { user: testerName }
        ]
      });

      for (const otherTask of otherActiveTasks) {
        const elapsed = Math.max(0, Math.floor((Date.now() - new Date(otherTask.testing_started_at).getTime()) / 1000));
        otherTask.testing_duration_seconds = (otherTask.testing_duration_seconds || 0) + elapsed;
        otherTask.testing_started_at = null;
        otherTask.testing_started_by = null;
        await otherTask.save();

        recordActivity({
          req,
          module: 'Task Management',
          action: 'TASK_TESTING_AUTO_PAUSED',
          targetType: 'Task',
          targetId: otherTask._id.toString(),
          targetName: otherTask.title,
          description: `Auto-paused active testing timer on "${otherTask.title}" because a new timer was started by ${testerName}`
        });
      }

      // Start testing timer on target task
      currentTask.status = 'testing';
      currentTask.testing_started_at = new Date();
      currentTask.testing_started_by = testerName;
      await currentTask.save();

      recordActivity({
        req,
        module: 'Task Management',
        action: 'TASK_TESTING_STARTED',
        targetType: 'Task',
        targetId: currentTask._id.toString(),
        targetName: currentTask.title,
        description: `Started active testing timer for "${currentTask.title}"`
      });

      return sendSuccess(res, currentTask, null, `Started testing for "${currentTask.title}"`);
    } catch (error) {
      console.error('Error starting testing timer:', error);
      return sendError(res, error.message || 'Failed to start testing timer', 500, 'ERR_INTERNAL');
    }
  },

  // POST /api/tasks/:id/pause-testing
  pauseTesting: async (req, res) => {
    try {
      const { id } = req.params;
      const { nextStatus } = req.body || {};
      const currentTask = await Task.findById(id);
      if (!currentTask) {
        return sendError(res, `Task with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      if (currentTask.testing_started_at) {
        const elapsed = Math.max(0, Math.floor((Date.now() - new Date(currentTask.testing_started_at).getTime()) / 1000));
        currentTask.testing_duration_seconds = (currentTask.testing_duration_seconds || 0) + elapsed;
        currentTask.testing_started_at = null;
        currentTask.testing_started_by = null;
      }

      if (nextStatus) {
        const isTerminalNow = ['success', 'done', 'done_production'].includes(nextStatus);
        const isTerminalBefore = ['success', 'done', 'done_production'].includes(currentTask.status);
        currentTask.status = nextStatus;
        if (isTerminalNow && (!isTerminalBefore || !currentTask.completed_at)) {
          currentTask.completed_at = new Date();
        }
      }

      await currentTask.save();

      recordActivity({
        req,
        module: 'Task Management',
        action: 'TASK_TESTING_PAUSED',
        targetType: 'Task',
        targetId: currentTask._id.toString(),
        targetName: currentTask.title,
        description: `Paused testing timer for "${currentTask.title}"${nextStatus ? ` and updated status to ${nextStatus}` : ''}`
      });

      return sendSuccess(res, currentTask, null, `Paused testing timer for "${currentTask.title}"`);
    } catch (error) {
      console.error('Error pausing testing timer:', error);
      return sendError(res, error.message || 'Failed to pause testing timer', 500, 'ERR_INTERNAL');
    }
  }
};
