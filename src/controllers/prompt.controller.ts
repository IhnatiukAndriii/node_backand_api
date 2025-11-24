import {
  addMessageToConversation,
  getConversation,
} from '../services/conversation.service';
import { findOrCreateUser } from '../services/user.service';
import SYSTEM_PROMPT from '../services/prompts/system.prompt';
import { Request, Response, NextFunction } from 'express';
import {
  sendChatRequest,
  parseOpenAIResponse,
  ConversationMessage,
} from '../services/openai.service';
import { createHabit, listHabitsByUser } from '../services/habit.service';

export async function handlePrompt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { text, phone_number } = req.body;

    if (!text || !phone_number) {
      return res.status(400).json({
        message: 'text and phone_number are required',
      });
    }

    const user = await findOrCreateUser(phone_number);

    await addMessageToConversation(user.id, 'user', text);
    const history = await getConversation(user.id);

    const messagesFromDb = JSON.parse(history.messages) as {
      role: 'user' | 'assistant';
      content: string;
    }[];

    const messagesForAI: ConversationMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messagesFromDb,
    ];

    const aiResponse = await sendChatRequest(messagesForAI);
    const parsedIntent = parseOpenAIResponse(aiResponse);

    await addMessageToConversation(
      user.id,
      'assistant',
      JSON.stringify(parsedIntent),
    );

    let result: unknown = null;
    if (parsedIntent.action === 'create') {
      result = await createHabit(user.id, parsedIntent);
    } else if (parsedIntent.action === 'list') {
      result = await listHabitsByUser(user.id);
    }

    return res.status(200).json({
      phone_number: user.phone_number,
      textReceived: text,
      intent: parsedIntent,
      result,
      history,
    });
  } catch (error) {
    next(error);
  }
}