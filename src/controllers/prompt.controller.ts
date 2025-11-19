import { Request, Response, NextFunction } from 'express';
import {
	addMessageToConversation,
	getMessages,
} from '../services/conversation.service';
import { sendChatRequest } from '../services/openai.service';
import SYSTEM_PROMPT from '../services/prompts/system.prompt';

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

		await addMessageToConversation(userId, 'user', content);

		const history = await getMessages(userId);

		const messages = [
			{ role: 'system' as const, content: SYSTEM_PROMPT },
			...history,
		];

		const aiResponse = await sendChatRequest(messages);
		const replyContent = aiResponse.content;

		const allMessages = await addMessageToConversation(
			userId,
			'assistant',
			replyContent,
		);

		return res.status(200).json({
			messages: allMessages,
			reply: replyContent,
		});
	} catch (error) {
		next(error);
	}
}
