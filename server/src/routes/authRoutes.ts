import express from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile, deleteUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);

export default router;

