import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createTestDatabase, setupTestDatabase, cleanupTestDatabase, destroyTestDatabase } from '../helpers/test-database';
import path from 'path';
import fs from 'fs';

describe('Integration Tests - Full Flow with Real Database', () => {
  let db: ReturnType<typeof import('knex').default>;
  const testDbPath = path.join(__dirname, '../../db/test_full_flow.db');
  const testPhoneNumber = '+12025551111';

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = createTestDatabase('test_full_flow.db');
    await setupTestDatabase(db);
    console.log('Full flow test database created and migrated');
  });

  afterAll(async () => {
    await destroyTestDatabase(db);
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    console.log(' Full flow test database cleaned up');
  });

  beforeEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('POST /prompt → Database Flow', () => {
    it('should process natural language and create habit in database', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping OpenAI test - OPENAI_API_KEY not set');
        return;
      }

      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'I want to drink water 3 times a day',
          phone_number: testPhoneNumber,
        })
        .expect('Content-Type', /json/);

      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));
      expect(response.body).toHaveProperty('action');
      expect(response.body.action).toBeOneOf(['create', 'clarification']);
      if (response.body.action === 'create') {
        const habits = await db('habits')
          .join('users', 'habits.user_id', 'users.id')
          .where('users.phone_number', testPhoneNumber)
          .select('habits.*');

        console.log('Habits in database:', habits);

        expect(habits.length).toBeGreaterThan(0);
        expect(habits[0]).toHaveProperty('habit_name');
        expect(habits[0].habit_name.toLowerCase()).toContain('water');
      }
    });

    it('should create user and habit through prompt endpoint', async () => {
      const testPhone = '+12025552222';
      
      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'Create habit: exercise every morning',
          phone_number: testPhone,
        })
        .expect('Content-Type', /json/);

      console.log('Response:', response.body);
      const user = await db('users')
        .where('phone_number', testPhone)
        .first();

      expect(user).toBeDefined();
      expect(user?.phone_number).toBe(testPhone);
      if (response.body.action === 'create' && response.body.result) {
        const habits = await db('habits')
          .where('user_id', user!.id)
          .select('*');

        console.log('Created habits:', habits);
        expect(habits.length).toBeGreaterThan(0);
      }
    });
  });

  describe('GET /habits → Database Flow', () => {
    it('should return habits from real database', async () => {
      const testPhone = '+12025553333';
      const [userId] = await db('users')
        .insert({ phone_number: testPhone })
        .returning('id');

      const userIdValue = typeof userId === 'object' ? (userId as any).id : userId;

      await db('habits').insert({
        user_id: userIdValue,
        habit_name: 'Test Habit from DB',
        frequency_type: 'daily',
        frequency_times: '1',
        status: 'active',
      });
      const response = await request(app)
        .get(`/api/habits?phone_number=${testPhone}`)
        .expect(200)
        .expect('Content-Type', /json/);

      console.log('GET /habits response:', response.body);

      expect(response.body).toHaveProperty('habits');
      expect(Array.isArray(response.body.habits)).toBe(true);
      expect(response.body.habits.length).toBeGreaterThan(0);
      expect(response.body.habits[0]).toHaveProperty('habit_name');
      expect(response.body.habits[0].habit_name).toBe('Test Habit from DB');
    });

    it('should return empty array for user with no habits', async () => {
      const emptyPhone = '+12025554444';
      await db('users').insert({ phone_number: emptyPhone });

      const response = await request(app)
        .get(`/api/habits?phone_number=${emptyPhone}`)
        .expect(200)
        .expect('Content-Type', /json/);

      console.log('Empty habits response:', response.body);

      expect(response.body).toHaveProperty('habits');
      expect(Array.isArray(response.body.habits)).toBe(true);
      expect(response.body.habits.length).toBe(0);
    });
  });

  describe('Database Operations', () => {
    it('should handle concurrent user creation (findOrCreate)', async () => {
      const phone = '+12025555555';
      const [user1, user2, user3] = await Promise.all([
        db('users').insert({ phone_number: phone }).returning('*').catch(() => 
          db('users').where('phone_number', phone).first()
        ),
        db('users').insert({ phone_number: phone }).returning('*').catch(() => 
          db('users').where('phone_number', phone).first()
        ),
        db('users').insert({ phone_number: phone }).returning('*').catch(() => 
          db('users').where('phone_number', phone).first()
        ),
      ]);
      const allUsers = await db('users').where('phone_number', phone);
      expect(allUsers.length).toBe(1);
    });

    it('should handle habit CRUD operations', async () => {
      const phone = '+12025556666';
      const [userId] = await db('users')
        .insert({ phone_number: phone })
        .returning('id');

      const userIdValue = typeof userId === 'object' ? (userId as any).id : userId;
      const [habitId] = await db('habits')
        .insert({
          user_id: userIdValue,
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
      await db('habits')
        .where('id', habitIdValue)
        .update({
          habit_name: 'Evening Run',
          updated_at: db.fn.now(),
        });

      const updatedHabit = await db('habits').where('id', habitIdValue).first();
      expect(updatedHabit?.habit_name).toBe('Evening Run');
      await db('habits')
        .where('id', habitIdValue)
        .update({ status: 'deleted' });

      const deletedHabit = await db('habits').where('id', habitIdValue).first();
      expect(deletedHabit?.status).toBe('deleted');
    });
  });
});
