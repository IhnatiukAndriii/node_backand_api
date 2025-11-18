//import { ConversationMessage, ParsedIntent } from '../types/openai.types';
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type IntentAction = 'create' | 'update' | 'delete' | 'list' | 'clarification';

export interface ParsedIntent {
  action: IntentAction;
  habit_name?: string;
  habit_id?: number;
  frequency_type?: string;
  frequency_times?: number | string[] | Record<string, string[]>;
  clarification_question?: string;
}

export async function sendChatRequest(
  messages: ConversationMessage[],
): Promise<OpenAIResponseStub> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');

  let intent: ParsedIntent = {
    action: 'clarification',
    clarification_question:
      'This is a stub response. OpenAI API key is not configured yet.',
  };

  if (lastUser) {
    const text = lastUser.content.toLowerCase();

    if (text.includes('list')) {
      intent = { action: 'list' };
    } else if (text.includes('delete')) {
      intent = { action: 'delete', habit_name: 'drink water' };
    } else if (text.includes('update')) {
      intent = {
        action: 'update',
        habit_name: 'drink water',
        frequency_type: 'daily',
      };
    } else if (text.includes('drink') || text.includes('water')) {
      intent = {
        action: 'create',
        habit_name: 'drink water',
        frequency_type: 'times_per_day',
        frequency_times: 3,
      };
    }
  }

  return {
    content: JSON.stringify(intent),
  };
}

export function parseOpenAIResponse(response: OpenAIResponseStub): ParsedIntent {
  const raw = response.content;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.action) {
      throw new Error('Missing action field');
    }
    return parsed as ParsedIntent;
  } catch {
    throw new Error('Failed to parse OpenAI stub response');
  }
}