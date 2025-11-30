import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal, getGoalById } from '../controllers/savingsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoalById);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
