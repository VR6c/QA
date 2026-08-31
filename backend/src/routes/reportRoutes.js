import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(optionalAuthMiddleware);

router.get('/kpi-targets', reportController.getKpiTargets);
router.put('/kpi-targets', reportController.updateKpiTargets);

router.get('/weekly/preview', reportController.getWeeklyPreview);
router.get('/monthly/preview', reportController.getMonthlyPreview);

router.post('/finalize', reportController.finalizeReport);
router.post('/unlock-task/:taskId', reportController.unlockTask);

router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);

export default router;
