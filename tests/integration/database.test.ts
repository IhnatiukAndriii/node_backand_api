import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDatabase, setupTestDatabase, cleanupTestDatabase, destroyTestDatabase } from '../helpers/test-database';
import path from 'path';
import fs from 'fs';

describe('Integration: Database Operations', () => {
  let db: ReturnType<typeof import('knex').default>;
  const testDbPath = path.join(__dirname, '../../db/test_database.db');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = createTestDatabase('test_database.db');
    await setupTestDatabase(db);
    console.log('Database test: migrations applied');
  });

  afterAll(async () => {
    await destroyTestDatabase(db);
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    console.log('Database test: cleaned up');
  });

  beforeEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('Users Table', () => {
    it('should create and retrieve user', async () => {
      const result = await db('users')
        .insert({ phone_number: '+12025551234' })
        .returning('id');

      const userId = result[0].id;
      const user = await db('users').where('id', userId).first();
      
      expect(user).toBeDefined();
      expect(user?.phone_number).toBe('+12025551234');
    });

    it('should enforce unique phone numbers', async () => {
      await db('users').insert({ phone_number: '+12025551234' });
      await expect(
        db('users').insert({ phone_number: '+12025551234' })
      ).rejects.toThrow();
    });
  });

  describe('Habits Table', () => {
    let userId: number;

    beforeEach(async () => {
      const [id] = await db('users')
        .insert({ phone_number: '+12025555678' })
        .returning('id');
      userId = typeof id === 'object' ? (id as any).id : id;
    });

    it('should create and retrieve habit', async () => {
      const [habitId] = await db('habits')
        .insert({
          user_id: userId,
          habit_name: 'Morning Run',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'active',
        })
        .returning('id');
      const habitIdValue = typeof habitId === 'object' ? (habitId as any).id : habitId;

      const habit = await db('habits').where('id', habitIdValue).first();

      expect(habit).toBeDefined();
      expect(habit?.habit_name).toBe('Morning Run');
      expect(habit?.frequency_type).toBe('daily');
      expect(habit?.status).toBe('active');
    });

    it('should retrieve multiple habits for user', async () => {
      await db('habits').insert([
        {
          user_id: userId,
          habit_name: 'Habit 1',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'active',
        },
        {
          user_id: userId,
          habit_name: 'Habit 2',
          frequency_type: 'weekly',
          frequency_times: '["monday", "friday"]',
          status: 'active',
        },
      ]);

      const habits = await db('habits').where('user_id', userId);

      expect(habits.length).toBe(2);
    });

    it('should update habit', async () => {
      const [habitId] = await db('habits')
        .insert({
          user_id: userId,
          habit_name: 'Old Name',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'active',
        })
        .returning('id');
      const habitIdValue = typeof habitId === 'object' ? (habitId as any).id : habitId;

      await db('habits')
        .where('id', habitIdValue)
        .update({
          habit_name: 'New Name',
          updated_at: db.fn.now(),
        });

      const updated = await db('habits').where('id', habitIdValue).first();
      expect(updated?.habit_name).toBe('New Name');
    });

    it('should soft delete habit', async () => {
      const [habitId] = await db('habits')
        .insert({
          user_id: userId,
          habit_name: 'To Delete',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'active',
        })
        .returning('id');
      const habitIdValue = typeof habitId === 'object' ? (habitId as any).id : habitId;

      await db('habits')
        .where('id', habitIdValue)
        .update({ status: 'deleted' });

      const deleted = await db('habits').where('id', habitIdValue).first();
      expect(deleted?.status).toBe('deleted');
    });

    it('should filter active habits only', async () => {
      await db('habits').insert([
        {
          user_id: userId,
          habit_name: 'Active Habit',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'active',
        },
        {
          user_id: userId,
          habit_name: 'Deleted Habit',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'deleted',
        },
      ]);

      const activeHabits = await db('habits')
        .where('user_id', userId)
        .where('status', 'active');

      expect(activeHabits.length).toBe(1);
      expect(activeHabits[0].habit_name).toBe('Active Habit');
    });
  });

  describe('Conversations Table', () => {
    let userId: number;

    beforeEach(async () => {
      const [id] = await db('users')
        .insert({ phone_number: '+12025559999' })
        .returning('id');
      userId = typeof id === 'object' ? (id as any).id : id;
    });

    it('should create and retrieve conversation', async () => {
      const [convId] = await db('conversations')
        .insert({
          user_id: userId,
          messages: JSON.stringify([]),
          total_tokens: 0,
        })
        .returning('id');
      const convIdValue = typeof convId === 'object' ? (convId as any).id : convId;

      const conversation = await db('conversations').where('id', convIdValue).first();

      expect(conversation).toBeDefined();
      expect(conversation?.user_id).toBe(userId);
      expect(conversation?.messages).toBe('[]');
      expect(conversation?.total_tokens).toBe(0);
    });

    it('should store and parse JSON messages', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const [convId] = await db('conversations')
        .insert({
          user_id: userId,
          messages: JSON.stringify(messages),
          total_tokens: 10,
        })
        .returning('id');
      const convIdValue = typeof convId === 'object' ? (convId as any).id : convId;

      const conversation = await db('conversations').where('id', convIdValue).first();
      const parsedMessages = JSON.parse(conversation!.messages);

      expect(parsedMessages).toHaveLength(2);
      expect(parsedMessages[0].role).toBe('user');
      expect(parsedMessages[1].content).toBe('Hi there!');
    });

    it('should update total tokens', async () => {
      const [convId] = await db('conversations')
        .insert({
          user_id: userId,
          messages: '[]',
          total_tokens: 0,
        })
        .returning('id');
      const convIdValue = typeof convId === 'object' ? (convId as any).id : convId;

      await db('conversations')
        .where('id', convIdValue)
        .update({ total_tokens: 150 });

      const updated = await db('conversations').where('id', convIdValue).first();
      expect(updated?.total_tokens).toBe(150);
    });
  });

  describe('Joins and Relations', () => {
    it('should join users and habits', async () => {
      const [userId] = await db('users')
        .insert({ phone_number: '+12025558888' })
        .returning('id');
      const userIdValue = typeof userId === 'object' ? (userId as any).id : userId;

      await db('habits').insert({
        user_id: userIdValue,
        habit_name: 'Test Habit',
        frequency_type: 'daily',
        frequency_times: '1',
        status: 'active',
      });

      const result = await db('habits')
        .join('users', 'habits.user_id', 'users.id')
        .where('users.phone_number', '+12025558888')
        .select('habits.*', 'users.phone_number');

      expect(result.length).toBe(1);
      expect(result[0].habit_name).toBe('Test Habit');
      expect(result[0].phone_number).toBe('+12025558888');
    });
  });
});
