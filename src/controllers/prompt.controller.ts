import { Request, Response, NextFunction } from 'express';
import { addMessageToConversation } from '../services/conversation.service';

export async function handlePrompt(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = (req as any).user?.id ?? req.body.userId;
		const { content } = req.body;

		if (!userId || !content) {
			return res
				.status(400)
				.json({ message: 'userId and content are required' });
		}

		const userMessages = await addMessageToConversation(
			userId,
			'user',
			content,
		);

		const aiReplyContent = 'Stub response from assistant';

		const aiMessages = await addMessageToConversation(
			userId,
			'assistant',
			aiReplyContent,
		);

		return res.status(200).json({
			messages: aiMessages,
			reply: aiReplyContent,
		});
	} catch (error) {
		next(error);
	}
}
