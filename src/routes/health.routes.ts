import { Router, Request, Response } from 'express';
import db from '../config/database';
import openai from '../config/openai';
import logger from '../utils/logger';

const router = Router();

router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const checks = {
    database: await checkDatabase(),
    openai: await checkOpenAI(),
  };

  const healthy = Object.values(checks).every(c => c.status === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

async function checkDatabase() {
  try {
    await db.raw('SELECT 1');
    return { status: 'ok' };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: 'error',
      message: 'API key not configured',
    };
  }

  try {
    await openai.models.list();
    return { status: 'ok' };
  } catch (error) {
    logger.error('OpenAI health check failed', { error });
    return {
      status: 'error',
      message: 'Cannot reach OpenAI API',
    };
  }
}

export default router;
