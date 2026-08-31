import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getActivities, getActivityById } from '../controllers/adminActivityController.js';

const router = express.Router();

// Apply Authentication Middleware
router.use(authMiddleware);

// GET /api/activities - Retrieve activities (scoped for regular users, full for admins)
router.get('/', getActivities);

// GET /api/activities/:id - Retrieve single activity detail
router.get('/:id', getActivityById);

export default router;
