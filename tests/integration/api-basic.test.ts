import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Integration: Basic API Tests', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toBeDefined();
    });

    it('should return 400 for POST /api/prompt without body', async () => {
      const response = await request(app)
        .post('/api/prompt')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for GET /api/habits without phoneNumber', async () => {
      const response = await request(app)
        .get('/api/habits')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('phone_number');
    });
  });
});
