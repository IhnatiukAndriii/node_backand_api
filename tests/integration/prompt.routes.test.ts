import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createTestDatabase, setupTestDatabase, destroyTestDatabase } from '../helpers/test-database';
import path from 'path';
import fs from 'fs';

describe('Integration: /api/prompt endpoint', () => {
  let db: ReturnType<typeof import('knex').default>;
  const testDbPath = path.join(__dirname, '../../db/test_prompt_routes.db');
  const testPhone = '+15105551234';

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = createTestDatabase('test_prompt_routes.db');
    await setupTestDatabase(db);
    console.log('✅ Prompt routes test database ready');
  });

  afterAll(async () => {
    await destroyTestDatabase(db);
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    console.log('✅ Prompt routes test database cleaned');
  });

  describe('POST /api/prompt', () => {
    const skipIfNoKey = !process.env.OPENAI_API_KEY;

    if (skipIfNoKey) {
      console.log('⚠️  Skipping OpenAI-dependent tests - OPENAI_API_KEY not set');
    }

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/prompt')
        .send({
          phone_number: testPhone,
          // Missing text
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if phoneNumber is missing', async () => {
      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'I want to drink water',
          // Missing phoneNumber
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });

    it.skipIf(skipIfNoKey)('should process natural language with real OpenAI API', async () => {
      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'I want to meditate every morning',
          phone_number: testPhone,
        })
        .expect('Content-Type', /json/);

      console.log('Prompt response:', JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty('action');
      expect(response.body.action).toBeOneOf(['create', 'clarification', 'list']);

      // If habit was created, verify in database
      if (response.body.action === 'create' && response.body.result) {
        const user = await db('users').where('phone_number', testPhone).first();
        expect(user).toBeDefined();

        const habits = await db('habits').where('user_id', user!.id);
        expect(habits.length).toBeGreaterThan(0);
      }
    });

    it.skipIf(skipIfNoKey)('should handle list intent', async () => {
      const listPhone = '+15105552222';

      // Create user and habits first
      const [userId] = await db('users')
        .insert({ phone_number: listPhone })
        .returning('id');
      const userIdValue = typeof userId === 'object' ? (userId as any).id : userId;

      await db('habits').insert({
        user_id: userIdValue,
        habit_name: 'Test Habit',
        frequency_type: 'daily',
        frequency_times: '1',
        status: 'active',
      });

      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'Show me my habits',
          phone_number: listPhone,
        })
        .expect('Content-Type', /json/);

      console.log('List response:', JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty('action');
      
      if (response.body.action === 'list') {
        expect(response.body).toHaveProperty('result');
        expect(response.body.result).toHaveProperty('habits');
        expect(Array.isArray(response.body.result.habits)).toBe(true);
      }
    });

    it.skipIf(skipIfNoKey)('should create user if not exists', async () => {
      const newPhone = '+15105553333';

      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'I want to run every day',
          phone_number: newPhone,
        })
        .expect('Content-Type', /json/);

      console.log('New user response:', JSON.stringify(response.body, null, 2));

      // Verify user was created
      const user = await db('users').where('phone_number', newPhone).first();
      expect(user).toBeDefined();
      expect(user?.phone_number).toBe(newPhone);
    });

    it.skipIf(skipIfNoKey)('should handle update intent', async () => {
      const updatePhone = '+15105554444';

      // Create user and habit
      const [userId] = await db('users')
        .insert({ phone_number: updatePhone })
        .returning('id');
      const userIdValue = typeof userId === 'object' ? (userId as any).id : userId;

      await db('habits').insert({
        user_id: userIdValue,
        habit_name: 'Morning Run',
        frequency_type: 'daily',
        frequency_times: '1',
        status: 'active',
      });

      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'Change my morning run to 3 times per week',
          phone_number: updatePhone,
        })
        .expect('Content-Type', /json/);

      console.log('Update response:', JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty('action');
      expect(response.body.action).toBeOneOf(['update', 'clarification']);
    });

    it.skipIf(skipIfNoKey)('should handle delete intent', async () => {
      const deletePhone = '+15105555555';

      // Create user and habit
      const [userId] = await db('users')
        .insert({ phone_number: deletePhone })
        .returning('id');
      const userIdValue = typeof userId === 'object' ? (userId as any).id : userId;

      await db('habits').insert({
        user_id: userIdValue,
        habit_name: 'Water Drinking',
        frequency_type: 'times_per_day',
        frequency_times: '3',
        status: 'active',
      });

      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'Remove my water drinking habit',
          phone_number: deletePhone,
        })
        .expect('Content-Type', /json/);

      console.log('Delete response:', JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty('action');
      expect(response.body.action).toBeOneOf(['delete', 'clarification']);
    });

    it.skipIf(skipIfNoKey)('should handle complex frequency patterns', async () => {
      const complexPhone = '+15105556666';

      const response = await request(app)
        .post('/api/prompt')
        .send({
          text: 'I want to go to the gym on Monday, Wednesday, and Friday',
          phone_number: complexPhone,
        })
        .expect('Content-Type', /json/);

      console.log('Complex frequency response:', JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty('action');
      
      if (response.body.action === 'create' && response.body.result) {
        const habit = response.body.result.habit;
        expect(habit.frequency_type).toBeOneOf(['weekly', 'custom']);
      }
    });
  });
});
