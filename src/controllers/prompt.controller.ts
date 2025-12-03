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
import {
  markHabitComplete,
  getUserStatistics,
  getCompletionHistory,
} from '../services/complection.service';
import {
  getPendingIntent,
  savePendingIntent,
  clearPendingIntent,
  mergePendingWithNewInput,
  identifyMissingFields,
} from '../services/context.service';
import logger from '../utils/logger';

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

  
    const pendingIntent = await getPendingIntent(user.id);

    const messagesFromDb = JSON.parse(history.messages) as {
      role: 'user' | 'assistant';
      content: string;
    }[];

    let messagesForAI: ConversationMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messagesFromDb,
    ];

    if (pendingIntent) {
      const contextMessage = `Previous incomplete request: ${JSON.stringify(pendingIntent)}. User is now providing additional information.`;
      messagesForAI.splice(1, 0, {
        role: 'system',
        content: contextMessage,
      });
    }

    const MAX_TOKENS_PER_REQUEST = Number(process.env.MAX_TOKENS_PER_REQUEST) || 4000;
    const currentTokens = countTokens(messagesForAI);
    logger.info('Token count', { currentTokens, maxTokens: MAX_TOKENS_PER_REQUEST });

    if (currentTokens > MAX_TOKENS_PER_REQUEST) {
      logger.warn('Token limit exceeded, trimming messages', { currentTokens, maxTokens: MAX_TOKENS_PER_REQUEST });
      messagesForAI = trimMessages(messagesForAI, MAX_TOKENS_PER_REQUEST);

      const trimmedMessagesForDb = messagesForAI.slice(1);
      await db('conversations')
        .where({ user_id: user.id })
        .update({
          messages: JSON.stringify(trimmedMessagesForDb),
          updated_at: db.fn.now(),
        });
      logger.info('Messages trimmed', { newTokenCount: countTokens(messagesForAI) });
    }

    await updateTotalTokens(user.id, countTokens(messagesForAI));

    const aiResponse = await sendChatRequest(messagesForAI);
    let parsedIntent = parseOpenAIResponse(aiResponse);

    if (pendingIntent && parsedIntent.action !== 'clarification') {
      parsedIntent = mergePendingWithNewInput(pendingIntent, parsedIntent);
      await clearPendingIntent(user.id);
    }

    if (parsedIntent.action === 'clarification') {
      const missingFields = identifyMissingFields(parsedIntent);
      
      if (missingFields.length > 0) {
        await savePendingIntent(user.id, {
          action: parsedIntent.action,
          habit_name: parsedIntent.habit_name,
          frequency_type: parsedIntent.frequency_type,
          frequency_times: parsedIntent.frequency_times,
          missing_fields: missingFields,
          clarification_asked: parsedIntent.clarification_question,
        });
      }

      await addMessageToConversation(
        user.id,
        'assistant',
        JSON.stringify(parsedIntent),
      );

      return res.status(200).json({
        phone_number: user.phone_number,
        textReceived: text,
        intent: parsedIntent,
        message: parsedIntent.assistant_message || parsedIntent.clarification_question,
        history,
      });
    }

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
} else if (parsedIntent.action === 'complete') {
  if (!parsedIntent.habit_name) {
    return res.status(400).json({
      message: 'habit_name is required for complete action',
    });
  }
  
  const habitToComplete = await findHabitByName(user.id, parsedIntent.habit_name);
  
  if (!habitToComplete) {
    return res.status(404).json({
      message: `Habit "${parsedIntent.habit_name}" not found`,
    });
  }
  
  const completion = await markHabitComplete(
    user.id,
    habitToComplete.id,
    parsedIntent.scheduled_time,
    parsedIntent.note
  );
  
  result = {
    message: 'Habit marked as complete',
    completion,
    habit: habitToComplete,
  };
} else if (parsedIntent.action === 'stats') {
  const stats = await getUserStatistics(user.id);
  result = {
    message: 'User statistics',
    statistics: stats,
  };
} else if (parsedIntent.action === 'history') {
  if (!parsedIntent.habit_name) {
    return res.status(400).json({
      message: 'habit_name is required for history action',
    });
  }
  
  const habitForHistory = await findHabitByName(user.id, parsedIntent.habit_name);
  
  if (!habitForHistory) {
    return res.status(404).json({
      message: `Habit "${parsedIntent.habit_name}" not found`,
    });
  }
  
  const history = await getCompletionHistory(habitForHistory.id);
  result = {
    message: 'Habit completion history',
    habit: habitForHistory,
    history,
  };
}

    await clearPendingIntent(user.id);

    return res.status(200).json({
      phone_number: user.phone_number,
      textReceived: text,
      intent: parsedIntent,
      result,
      message: parsedIntent.assistant_message,
      history,
    });
  } catch (error) {
    next(error);
  }
}