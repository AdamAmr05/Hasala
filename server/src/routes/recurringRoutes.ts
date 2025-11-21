import express from 'express';
import {
    getRecurringTransactions,
    addRecurringTransaction,
    deleteRecurringTransaction,
    rewindRecurringTransaction,
} from '../controllers/recurringController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getRecurringTransactions)
    .post(protect, addRecurringTransaction);

router.route('/:id')
    .delete(protect, deleteRecurringTransaction);

router.route('/:id/rewind')
    .post(protect, rewindRecurringTransaction);

export default router;
