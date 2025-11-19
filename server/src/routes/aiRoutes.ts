import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { parseTransactionText, parseTransactionVoice } from '../controllers/parseController';

const router = express.Router();

router.post('/parse-text', protect, parseTransactionText);
router.post('/parse-voice', protect, parseTransactionVoice);

export default router;

