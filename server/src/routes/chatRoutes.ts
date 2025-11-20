import express from 'express';
import { chatWithAI, getThreads, getThreadMessages, deleteThread } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, chatWithAI);
router.get('/', protect, getThreads);
router.get('/:threadId', protect, getThreadMessages);
router.delete('/:threadId', protect, deleteThread);

export default router;

