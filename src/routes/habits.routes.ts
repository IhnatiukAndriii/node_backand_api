import { Router } from 'express';
import { getHabits, createHabitController, updateHabitController, deleteHabitController } from '../controllers/habit.controller';
import { validateQuery } from '../middlewares/validation.middleware';
import { habitQuerySchema } from '../validators/schemas';

const router = Router();
router.get('/', validateQuery(habitQuerySchema), getHabits);
router.post('/', createHabitController);
router.put('/:id', updateHabitController);
router.delete('/:id', deleteHabitController);

export default router;