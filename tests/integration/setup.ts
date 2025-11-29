import db from '../../src/config/database';
import path from 'path';
import fs from 'fs';
import { beforeAll, afterAll } from 'vitest';

const testDbPath = path.join(process.cwd(), 'db', 'test_integration.db');

beforeAll(async () => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  const dbDir = path.dirname(testDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  await db.migrate.latest();
  
  console.log('Integration tests: database initialized');
});

afterAll(async () => {
  await db.destroy();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  console.log('Integration tests: database cleaned up');
});
