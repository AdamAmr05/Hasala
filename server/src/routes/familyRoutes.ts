import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createFamily,
    getUserFamilies,
    joinFamily,
    getFamilyDetails,
    leaveFamily,
} from '../controllers/familyController';

const router = Router();

// All routes require authentication
router.post('/', protect, createFamily);
router.get('/', protect, getUserFamilies);
router.post('/join', protect, joinFamily);
router.get('/:id', protect, getFamilyDetails);
router.post('/:id/leave', protect, leaveFamily);

export default router;
