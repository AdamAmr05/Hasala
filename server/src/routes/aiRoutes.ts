import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { parseTransactionText, parseTransactionVoice } from '../controllers/parseController';
import { generateInfographic } from '../controllers/aiController';

const router = express.Router();

router.post('/parse-text', protect, parseTransactionText);
router.post('/parse-voice', protect, parseTransactionVoice);
router.post('/generate-infographic', protect, generateInfographic);

export default router;

