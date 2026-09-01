import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getSystemUsers,
  getMessages,
  sendMessage,
  deleteMessage
} from '../controllers/chatController.js';

const router = express.Router();

// Require authentication for all chat routes
router.use(authMiddleware);

router.get('/users', getSystemUsers);
router.get('/messages', getMessages);
router.post('/messages', sendMessage);
router.delete('/messages/:messageId', deleteMessage);

export default router;
