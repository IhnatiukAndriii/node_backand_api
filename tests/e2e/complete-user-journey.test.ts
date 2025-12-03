import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Complete User Journey E2E', () => {
  it('should test health check endpoints', async () => {
    const liveResponse = await request(app).get('/api/health/live');
    expect(liveResponse.status).toBe(200);
    expect(liveResponse.body.status).toBe('ok');

    const readyResponse = await request(app).get('/api/health/ready');
    expect(readyResponse.status).toBe(200);
    expect(readyResponse.body.status).toBe('ready');
    expect(readyResponse.body.checks).toHaveProperty('database');
    expect(readyResponse.body.checks).toHaveProperty('openai');
  });
});
