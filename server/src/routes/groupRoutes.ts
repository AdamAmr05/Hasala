import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createGroup,
    getUserGroups,
    getGroupDetails,
    addExpense,
    joinGroup
} from '../controllers/groupController';

const router = express.Router();

router.route('/')
    .post(protect, createGroup)
    .get(protect, getUserGroups);

router.post('/join', protect, joinGroup);

router.route('/:id')
    .get(protect, getGroupDetails);

router.post('/:id/expenses', protect, addExpense);

export default router;
