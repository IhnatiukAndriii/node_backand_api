import db from '../config/database';
import { ParsedIntent } from './openai.service';

export interface Habit {
    id: number;
    user_id: number;
    habit_name: string;
    frequency_type: string | null;
    frequency_times: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export async function createHabit(
    userId: number,
    intent: ParsedIntent,
): Promise<Habit> {
    const inserted = await db<Habit>('habits')
        .insert({
            user_id: userId,
            habit_name: intent.habit_name ?? 'Untitled habit',
            frequency_type: intent.frequency_type ?? 'custom',
            frequency_times: intent.frequency_times
                ? Array.isArray(intent.frequency_times)
                    ? JSON.stringify(intent.frequency_times)
                    : String(intent.frequency_times)
                : null,
        })
        .returning('*');
    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    return row as Habit;
}

export async function listHabitsByUser(userId: number): Promise<Habit[]> {
    const habits = await db<Habit>('habits')
        .where({ user_id: userId })
        .orderBy('created_at', 'asc');

    return habits;
}
