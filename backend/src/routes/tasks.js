import express from 'express';
import { taskController } from '../controllers/taskController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(optionalAuthMiddleware);

router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.delete('/clear-all', taskController.clearAllTasks);
router.patch('/:id', taskController.updateTask);
router.post('/:id/start-testing', taskController.startTesting);
router.post('/:id/pause-testing', taskController.pauseTesting);
router.delete('/:id', taskController.deleteTask);
router.post('/seed', taskController.seedTasks);

export default router;
