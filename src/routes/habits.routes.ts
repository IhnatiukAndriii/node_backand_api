import { Router } from 'express';
import { getHabits } from '../controllers/habit.controller';

const router = Router();
router.get('/', getHabits);

export default router;