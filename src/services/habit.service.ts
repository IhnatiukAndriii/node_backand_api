import { stat } from 'fs';
import db from '../config/database';
import { ParsedIntent } from './openai.service';
import e from 'express';

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

export async function createHabitDirect(
{ userId, habit_name, frequency_type, frequency_times, status }: { userId: number; habit_name: string; frequency_type: string; frequency_times: string | number; status: string; },
   ): Promise<Habit> {
  const data = {
    user_id: userId,
    habit_name,
    frequency_type,
    frequency_times: typeof frequency_times === 'number' ? String(frequency_times) : frequency_times,
    status,
  };
  const inserted = await db<Habit>('habits')
    .insert(data)
    .returning('*');
  return Array.isArray(inserted) ? inserted[0] : inserted;
}

export async function listHabitsByUser(userId: number): Promise<Habit[]> {
    console.log('>>> listHabitsByUser called with userId:', userId);
    const habits = await db<Habit>('habits')
        .where({ user_id: userId, status: 'active' })
        .orderBy('created_at', 'asc');

    console.log('>>> Found habits:', habits.length, 'habits');
    console.log('>>> Habits data:', JSON.stringify(habits, null, 2));
    return habits;
}
export async function getHabitById(habitId: number): Promise<Habit | null> {
    const habit = await db<Habit>('habits')
        .where({ id: habitId })
        .first();
    return habit || null;   
}
export async function findHabitByName(
    userId: number,
    habitName: string,
): Promise<Habit | null> {
    const habit = await db<Habit>('habits')
        .where({ user_id: userId, habit_name: habitName, status: 'active' })
        .first();
    return habit || null;
}
export async function updateHabit(
    habitId: number,
    habitData: Partial<{
        habit_name: string;
        frequency_type: string;
        frequency_times: number | string[];
    }>,
): Promise<Habit | null> {
    const existing = await getHabitById(habitId);
    if (!existing) return null;

    const updated = await db<Habit>('habits')
        .where({ id: habitId })
        .update({
            habit_name: habitData.habit_name ?? existing.habit_name,
            frequency_type: habitData.frequency_type ?? existing.frequency_type,
            frequency_times: habitData.frequency_times !== undefined
                ? Array.isArray(habitData.frequency_times)
                    ? JSON.stringify(habitData.frequency_times)
                    : String(habitData.frequency_times)
                : existing.frequency_times,
            updated_at: db.fn.now(),
        })
        .returning('*');
    const row = Array.isArray(updated) ? updated[0] : updated;
    return row as Habit;
}
export async function deleteHabit(habitId: number): Promise<boolean> {
    const existing = await getHabitById(habitId);
    if (!existing) return false;
    await db<Habit>('habits')
        .where({ id: habitId })
        .update({
            status: 'deleted',
            updated_at: db.fn.now(),
        });
    return true;
}