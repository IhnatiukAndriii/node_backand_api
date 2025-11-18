import { Request, Response, NextFunction } from 'express';
import { addMessage } from '../services/conversation.service';

export async function handlePrompt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user?.id ?? req.body.userId;
    const { content, conversationId } = req.body;

    if (!userId || !content) {
      return res
        .status(400)
        .json({ message: 'userId and content are required' });
    }

    const userMsgResult = await addMessage({
      userId,
      conversationId,
      role: 'user',
      content,
    });

    const aiReplyContent = 'Stub response from assistant';

    const aiMsgResult = await addMessage({
      userId,
      conversationId: userMsgResult.conversationId,
      role: 'assistant',
      content: aiReplyContent,
    });

    return res.status(200).json({
      conversationId: aiMsgResult.conversationId,
      messages: aiMsgResult.messages,
      reply: aiReplyContent,
    });
  } catch (error) {
    next(error);
  }
}
