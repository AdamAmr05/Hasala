import express from 'express';
import { chatWithAI } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, chatWithAI);

export default router;

