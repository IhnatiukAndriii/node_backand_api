import { Router, Request, Response, NextFunction } from 'express';
import { findOrCreateUser } from '../services/user.service';
import { logger } from '../utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ message: 'phone_number is required' });
    }

    const user = await findOrCreateUser(phone_number);
    
    logger.info('User created or found', { userId: user.id, phone: phone_number });
    
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
