import { Router } from 'express';
import { getHabits } from '../controllers/habit.controller';

const router = Router();

// Temporary minimal implementation; will be extended per spec
router.get('/', getHabits);

export default router;