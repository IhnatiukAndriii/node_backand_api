import { Request, Response } from 'express';

export async function getHabits(req: Request, res: Response) {
  return res.status(200).json({ habits: [] });
}
