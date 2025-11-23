import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createGroup,
    getUserGroups,
    getGroupDetails,
    addExpense,
    joinGroup,
    getGroupExpenses
} from '../controllers/groupController';

const router = express.Router();

router.route('/')
    .post(protect, createGroup)
    .get(protect, getUserGroups);

router.post('/join', protect, joinGroup);

router.route('/:id')
    .get(protect, getGroupDetails);

router.get('/:id/expenses', protect, getGroupExpenses);

router.post('/:id/expenses', protect, addExpense);

export default router;
