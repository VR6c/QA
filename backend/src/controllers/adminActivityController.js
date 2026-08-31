import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

/**
 * Get Searchable, Filtered, Paginated Audit Logs
 * GET /api/admin/activities
 */
export const getActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      user_id = '',
      role = '',
      module = '',
      action = '',
      status = '',
      date_from = '',
      date_to = '',
      sort = '-createdAt'
    } = req.query;

    const query = {};

    const isAdmin = req.user && ['Super Admin', 'Admin', 'QA Lead'].includes(req.user.role);

    if (!isAdmin && req.user) {
      const userIdentifier = req.user.name || req.user.email;
      query.$or = [
        { user_id: req.user.id },
        { user_email: req.user.email },
        { user_name: req.user.name },
        { target_name: { $regex: userIdentifier, $options: 'i' } },
        { description: { $regex: userIdentifier, $options: 'i' } }
      ];
    } else if (user_id) {
      query.user_id = user_id;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = [
        { activity_id: searchRegex },
        { user_name: searchRegex },
        { user_email: searchRegex },
        { target_name: searchRegex },
        { description: searchRegex }
      ];

      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    if (role) query.role_name = role;
    if (module) query.module = module;
    if (action) query.action = action;
    if (status) query.status = status;

    if (date_from || date_to) {
      query.createdAt = {};
      if (date_from) {
        query.createdAt.$gte = date_from.includes('T')
          ? new Date(date_from)
          : new Date(`${date_from}T00:00:00.000+07:00`);
      }
      if (date_to) {
        query.createdAt.$lte = date_to.includes('T')
          ? new Date(date_to)
          : new Date(`${date_to}T23:59:59.999+07:00`);
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, activities, modules, actions, statuses, roles, usersList] = await Promise.all([
      ActivityLog.countDocuments(query),
      ActivityLog.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      ActivityLog.distinct('module'),
      ActivityLog.distinct('action'),
      ActivityLog.distinct('status'),
      Role.distinct('name'),
      User.find({ deleted_at: null }, 'name email username role _id').lean()
    ]);

    const filterOptions = {
      modules,
      actions,
      statuses,
      roles,
      users: usersList
    };

    return sendSuccess(res, activities, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      filterOptions
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return sendError(res, 'Failed to fetch audit logs', 500, 'ERR_INTERNAL');
  }
};

/**
 * Get Activity Log Detail by ID
 * GET /api/admin/activities/:id
 */
export const getActivityById = async (req, res) => {
  try {
    const activity = await ActivityLog.findById(req.params.id).lean();
    if (!activity) {
      return sendError(res, 'Activity record not found', 404, 'ERR_NOT_FOUND');
    }
    return sendSuccess(res, activity);
  } catch (error) {
    console.error('Error fetching activity log detail:', error);
    return sendError(res, 'Failed to fetch activity detail', 500, 'ERR_INTERNAL');
  }
};

/**
 * Get Dashboard Key Statistics
 * GET /api/admin/dashboard-stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [userStats, totalRoles, totalActivities, recentActivities] = await Promise.all([
      User.aggregate([
        { $match: { deleted_at: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Role.countDocuments(),
      ActivityLog.countDocuments(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(6).lean()
    ]);

    const userCounts = new Map(userStats.map(item => [item._id, item.count]));
    const activeUsers = userCounts.get('Active') || 0;
    const inactiveUsers = userCounts.get('Inactive') || 0;
    const lockedUsers = userCounts.get('Locked') || 0;
    const totalUsers = activeUsers + inactiveUsers + lockedUsers;

    return sendSuccess(res, {
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        lockedUsers,
        totalRoles,
        totalPermissions: 14,
        totalActivities
      },
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return sendError(res, 'Failed to fetch dashboard stats', 500, 'ERR_INTERNAL');
  }
};
