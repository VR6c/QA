import express from 'express';
import { register, login, getMe, triggerSeed, updateProfile, changePassword } from '../controllers/authController.js';
import { authMiddleware, superAdminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only Super Admin can register/create new accounts
router.post('/register', authMiddleware, superAdminMiddleware, register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/change-password', authMiddleware, changePassword);
router.post('/seed', triggerSeed);

export default router;

