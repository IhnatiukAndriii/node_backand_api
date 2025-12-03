import db from '../config/database';
import { ParsedIntent } from './openai.service';

export interface PendingIntent {
  action: string;
  habit_name?: string;
  frequency_type?: string;
  frequency_times?: number | string[];
  missing_fields: string[];
  clarification_asked?: string;
}

export async function savePendingIntent(
  userId: number,
  intent: PendingIntent
): Promise<void> {
  await db('conversations')
    .where({ user_id: userId })
    .update({
      pending_intent: JSON.stringify(intent),
      updated_at: db.fn.now(),
    });
}

export async function getPendingIntent(
  userId: number
): Promise<PendingIntent | null> {
  const conversation = await db('conversations')
    .where({ user_id: userId })
    .first();

  if (!conversation || !conversation.pending_intent) {
    return null;
  }

  try {
    return JSON.parse(conversation.pending_intent) as PendingIntent;
  } catch {
    return null;
  }
}

export async function clearPendingIntent(userId: number): Promise<void> {
  await db('conversations')
    .where({ user_id: userId })
    .update({
      pending_intent: null,
      updated_at: db.fn.now(),
    });
}

export function mergePendingWithNewInput(
  pending: PendingIntent,
  newIntent: ParsedIntent
): ParsedIntent {
  return {
    ...newIntent,
    action: pending.action as any,
    habit_name: newIntent.habit_name || pending.habit_name,
    frequency_type: newIntent.frequency_type || pending.frequency_type,
    frequency_times: newIntent.frequency_times || pending.frequency_times,
  };
}

export function identifyMissingFields(intent: ParsedIntent): string[] {
  const missing: string[] = [];

  if (intent.action === 'create' || intent.action === 'update') {
    if (!intent.habit_name) missing.push('habit_name');
    if (!intent.frequency_type) missing.push('frequency_type');
    if (intent.frequency_type === 'times_per_day' && !intent.frequency_times) {
      missing.push('frequency_times');
    }
  }

  return missing;
}
