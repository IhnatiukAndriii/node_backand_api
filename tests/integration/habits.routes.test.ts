import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { createTestDatabase, setupTestDatabase, destroyTestDatabase } from '../helpers/test-database';
import path from 'path';
import fs from 'fs';

describe('Integration: /api/habits endpoints', () => {
  let db: ReturnType<typeof import('knex').default>;
  const testDbPath = path.join(__dirname, '../../db/test_habits_routes.db');
  const testPhone1 = '+14155551001';
  const testPhone2 = '+14155551002';
  let userId1: number;
  let userId2: number;

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = createTestDatabase('test_habits_routes.db');
    await setupTestDatabase(db);
    const [user1] = await db('users')
      .insert({ phone_number: testPhone1 })
      .returning('id');
    userId1 = typeof user1 === 'object' ? (user1 as any).id : user1;

    const [user2] = await db('users')
      .insert({ phone_number: testPhone2 })
      .returning('id');
    userId2 = typeof user2 === 'object' ? (user2 as any).id : user2;
    await db('habits').insert([
      {
        user_id: userId1,
        habit_name: 'Morning Meditation',
        frequency_type: 'daily',
        frequency_times: '1',
        status: 'active',
      },
      {
        user_id: userId1,
        habit_name: 'Drink Water',
        frequency_type: 'times_per_day',
        frequency_times: '3',
        status: 'active',
      },
      {
        user_id: userId2,
        habit_name: 'Evening Yoga',
        frequency_type: 'weekly',
        frequency_times: '["monday", "wednesday", "friday"]',
        status: 'active',
      },
    ]);

    console.log('Habits routes test database ready');
  });

  afterAll(async () => {
    await destroyTestDatabase(db);
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    console.log('Habits routes test database cleaned');
  });

  describe('GET /api/habits', () => {
    it('should return all habits for a user', async () => {
      const response = await request(app)
        .get(`/api/habits?phone_number=${testPhone1}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('habits');
      expect(Array.isArray(response.body.habits)).toBe(true);
      expect(response.body.habits.length).toBe(2);
      
      const habitNames = response.body.habits.map((h: any) => h.habit_name);
      expect(habitNames).toContain('Morning Meditation');
      expect(habitNames).toContain('Drink Water');
    });

    it('should return empty array for user with no habits', async () => {
      const noHabitsPhone = '+14155559999';
      await db('users').insert({ phone_number: noHabitsPhone });

      const response = await request(app)
        .get(`/api/habits?phone_number=${noHabitsPhone}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('habits');
      expect(response.body.habits).toEqual([]);
    });

    it('should return 400 if phoneNumber is missing', async () => {
      const response = await request(app)
        .get('/api/habits')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });

    it('should only return active habits', async () => {
      await db('habits').insert({
        user_id: userId1,
        habit_name: 'Deleted Habit',
        frequency_type: 'daily',
        frequency_times: '1',
        status: 'deleted',
      });

      const response = await request(app)
        .get(`/api/habits?phone_number=${testPhone1}`)
        .expect(200);

      const habitNames = response.body.habits.map((h: any) => h.habit_name);
      expect(habitNames).not.toContain('Deleted Habit');
    });
  });

  describe('POST /api/habits', () => {
    it('should create a new habit', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          phone_number: testPhone1,
          habitName: 'Evening Reading',
          frequencyType: 'daily',
          frequencyTimes: 1,
        })
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('habit');
      expect(response.body.habit).toHaveProperty('id');
      expect(response.body.habit.habit_name).toBe('Evening Reading');
      expect(response.body.habit.frequency_type).toBe('daily');
      const habit = await db('habits')
        .where('id', response.body.habit.id)
        .first();
      expect(habit).toBeDefined();
      expect(habit?.habit_name).toBe('Evening Reading');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          phone_number: testPhone1,
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('should update an existing habit', async () => {
      const habits = await db('habits')
        .where('user_id', userId1)
        .where('habit_name', 'Morning Meditation')
        .first();

      const response = await request(app)
        .put(`/api/habits/${habits.id}`)
        .send({
          habitName: 'Morning Meditation Extended',
          frequencyType: 'daily',
          frequencyTimes: 2,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('habit');
      expect(response.body.habit.habit_name).toBe('Morning Meditation Extended');
      const updated = await db('habits').where('id', habits.id).first();
      expect(updated?.habit_name).toBe('Morning Meditation Extended');
    });

    it('should return 404 if habit does not exist', async () => {
      const response = await request(app)
        .put('/api/habits/99999')
        .send({
          habitName: 'Non-existent',
          frequencyType: 'daily',
          frequencyTimes: 1,
        })
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete (soft delete) a habit', async () => {
      const habits = await db('habits')
        .where('user_id', userId1)
        .where('habit_name', 'Drink Water')
        .first();

      const response = await request(app)
        .delete(`/api/habits/${habits.id}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      const deleted = await db('habits').where('id', habits.id).first();
      expect(deleted?.status).toBe('deleted');
    });

    it('should return 404 if habit does not exist', async () => {
      const response = await request(app)
        .delete('/api/habits/99999')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });
  });
});
