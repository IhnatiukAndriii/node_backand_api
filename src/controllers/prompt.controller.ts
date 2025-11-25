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
}  from '../services/openai.service';
import { createHabit, listHabitsByUser, deleteHabit, updateHabit, findHabitByName } from '../services/habit.service';
import {countTokens, trimMessages} from '../services/token.service';
import { updateTotalTokens } from '../services/conversation.service';
import db from '../config/database';

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

    let messagesForAI: ConversationMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messagesFromDb,
    ];

    const MAX_TOKENS_PER_REQUEST = Number(process.env.MAX_TOKENS_PER_REQUEST) || 4000;
    const currentTokens = countTokens(messagesForAI);
    console.log(`>>> Current tokens: ${currentTokens}, Max tokens: ${MAX_TOKENS_PER_REQUEST}`);

    if (currentTokens > MAX_TOKENS_PER_REQUEST) {
      console.log('>>> Token limit exceeded! Trimming old messages...');
      messagesForAI = trimMessages(messagesForAI, MAX_TOKENS_PER_REQUEST);

      const trimmedMessagesForDb = messagesForAI.slice(1);
      await db('conversations')
        .where({ user_id: user.id })
        .update({
          messages: JSON.stringify(trimmedMessagesForDb),
          updated_at: db.fn.now(),
        });
      console.log(`>>> Trimmed to ${countTokens(messagesForAI)} tokens`);
    }

    await updateTotalTokens(user.id, countTokens(messagesForAI));

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
} else if (parsedIntent.action === 'update') {
  if (!parsedIntent.habit_name) {
    return res.status(400).json({
      message: 'habit_name is required for update action',
    });
  }
  
  const habitToUpdate = await findHabitByName(user.id, parsedIntent.habit_name);
  
  if (!habitToUpdate) {
    return res.status(404).json({
      message: `Habit "${parsedIntent.habit_name}" not found`,
    });
  }
  
  result = await updateHabit(habitToUpdate.id, {
    habit_name: parsedIntent.habit_name,
    frequency_type: parsedIntent.frequency_type,
    frequency_times: parsedIntent.frequency_times,
  });
} else if (parsedIntent.action === 'delete') {
  if (!parsedIntent.habit_name) {
    return res.status(400).json({
      message: 'habit_name is required for delete action',
    });
  }
  
  const habitToDelete = await findHabitByName(user.id, parsedIntent.habit_name);
  
  if (!habitToDelete) {
    return res.status(404).json({
      message: `Habit "${parsedIntent.habit_name}" not found`,
    });
  }
  
  await deleteHabit(habitToDelete.id);
  result = { message: 'Habit deleted successfully' };
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
