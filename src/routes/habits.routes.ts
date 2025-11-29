import { Router } from 'express';
import { getHabits, createHabitController, updateHabitController, deleteHabitController } from '../controllers/habit.controller';

const router = Router();
router.get('/', getHabits);
router.post('/', createHabitController);
router.put('/:id', updateHabitController);
router.delete('/:id', deleteHabitController);

export default router;