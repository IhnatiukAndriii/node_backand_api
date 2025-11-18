import { Request, Response, NextFunction } from 'express';
import { resetConversation } from '../services/conversation.service';

export async function resetConversationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    await resetConversation(userId);

    return res
      .status(200)
      .json({ message: 'Conversation reset successfully' });
  } catch (error) {
    next(error);
  }
}
