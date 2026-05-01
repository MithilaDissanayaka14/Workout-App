import express from 'express';
import { getAchievements, checkAchievements } from '../controller/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAchievements);
router.post('/check', protect, checkAchievements);

export default router;
