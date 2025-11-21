import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getRecurringExpenses,
    addRecurringExpense,
    deleteRecurringExpense,
} from '../controllers/recurringController';

const router = express.Router();

router.route('/')
    .get(protect, getRecurringExpenses)
    .post(protect, addRecurringExpense);

router.route('/:id')
    .delete(protect, deleteRecurringExpense);

export default router;
