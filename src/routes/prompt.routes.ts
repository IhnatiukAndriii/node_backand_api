import { Router } from 'express';
import { handlePrompt } from '../controllers/prompt.controller';
import { validateBody } from '../middlewares/validation.middleware';
import { promptSchema } from '../validators/schemas';

const router = Router();

router.post('/', validateBody(promptSchema), handlePrompt);

export default router;