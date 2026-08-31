import express from 'express';
import { ownerController } from '../controllers/ownerController.js';
import { authMiddleware, superAdminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', ownerController.getAllOwners);
router.post('/', authMiddleware, superAdminMiddleware, ownerController.createOwner);
router.patch('/:id', authMiddleware, superAdminMiddleware, ownerController.updateOwner);
router.delete('/:id', authMiddleware, superAdminMiddleware, ownerController.deleteOwner);

export default router;

