import { Router } from 'express';
import promptRoutes from './prompt.routes';
import habitsRoutes from './habits.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/prompt', promptRoutes);
router.use('/habits', habitsRoutes);

export default router;