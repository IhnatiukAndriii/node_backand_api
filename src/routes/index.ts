import { Router } from 'express';
import promptRoutes from './prompt.routes';
import habitsRoutes from './habits.routes';
import completionsRoutes from './completions.routes';
import healthRoutes from './health.routes';
import usersRoutes from './users.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/prompt', promptRoutes);
router.use('/habits', habitsRoutes);
router.use('/completions', completionsRoutes);
router.use('/health', healthRoutes);
router.use('/users', usersRoutes);

export default router;