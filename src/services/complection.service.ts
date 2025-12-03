import db from '../config/database';

export interface HabitCompletion {
  id: number;
  habit_id: number;
  user_id: number;
  completed_at: string;
  scheduled_time?: string | null;
  note?: string | null;
}

export interface CompletionStats {
  total_completions: number;
  today_completions: number;
  current_streak: number;
  longest_streak: number;
}

export async function markHabitComplete(
  userId: number,
  habitId: number,
  scheduledTime?: string,
  note?: string
): Promise<HabitCompletion> {
  const inserted = await db<HabitCompletion>('habit_completions')
    .insert({
      habit_id: habitId,
      user_id: userId,
      scheduled_time: scheduledTime || null,
      note: note || null,
    })
    .returning('*');
  
  return Array.isArray(inserted) ? inserted[0] : inserted;
}

export async function getCompletionHistory(
  habitId: number,
  startDate?: Date,
  endDate?: Date
): Promise<HabitCompletion[]> {
  let query = db<HabitCompletion>('habit_completions')
    .where({ habit_id: habitId })
    .orderBy('completed_at', 'desc');

  if (startDate) {
    query = query.where('completed_at', '>=', startDate.toISOString());
  }
  
  if (endDate) {
    query = query.where('completed_at', '<=', endDate.toISOString());
  }
  
  return await query;
}

export async function getUserStatistics(userId: number): Promise<CompletionStats> {
  const totalResult = await db('habit_completions')
    .where({ user_id: userId })
    .count('* as count')
    .first();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayResult = await db('habit_completions')
    .where({ user_id: userId })
    .where('completed_at', '>=', todayStart.toISOString())
    .count('* as count')
    .first();

  return {
    total_completions: Number(totalResult?.count || 0),
    today_completions: Number(todayResult?.count || 0),
    current_streak: 0,
    longest_streak: 0,
  };
}

export async function getStreakCount(habitId: number): Promise<number> {
  const completions = await db<HabitCompletion>('habit_completions')
    .where({ habit_id: habitId })
    .orderBy('completed_at', 'desc')
    .select('completed_at');

  if (completions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const completion of completions) {
    const completionDate = new Date(completion.completed_at);
    completionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diffDays > streak) {
      break;
    }
  }
  
  return streak;
}

export async function deleteCompletion(completionId: number): Promise<void> {
  await db('habit_completions')
    .where({ id: completionId })
    .delete();
}
    

