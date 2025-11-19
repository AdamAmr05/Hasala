import express from 'express';
import { getTransactions, addTransaction, deleteTransaction } from '../controllers/transactionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Apply 'protect' middleware to all routes in this file
router.route('/')
  .get(protect, getTransactions)
  .post(protect, addTransaction);

router.route('/:id')
  .delete(protect, deleteTransaction);

export default router;

