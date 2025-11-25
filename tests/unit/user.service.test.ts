import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserByPhoneNumber, createUser, findOrCreateUser } from '../../src/services/user.service';
const mockFirst = vi.fn();
const mockWhere = vi.fn(() => ({ first: mockFirst }));
const mockReturning = vi.fn();
const mockInsert = vi.fn(() => ({ returning: mockReturning }));
vi.mock('../../src/config/database', () => {
  const mockDb = vi.fn((tableName: string) => ({
    where: mockWhere,
    first: mockFirst,
    insert: mockInsert,
  }));
  
  return {
    default: mockDb,
  };
});

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserByPhoneNumber', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        phone_number: '+12025551234',
        created_at: '2025-01-01T00:00:00.000Z',
      };
      mockFirst.mockResolvedValueOnce(mockUser);
      const result = await getUserByPhoneNumber('+12025551234');
      expect(result).toEqual(mockUser);
      expect(mockWhere).toHaveBeenCalledWith({ phone_number: '+12025551234' });
      expect(mockFirst).toHaveBeenCalled();
    });

    it('should return null when user is not found', async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      const result = await getUserByPhoneNumber('+447700900000');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockCreatedUser = {
        id: 2,
        phone_number: '+4915512345678',
        created_at: '2025-01-02T00:00:00.000Z',
      };
      
      mockReturning.mockResolvedValueOnce([mockCreatedUser]);
      const result = await createUser('+4915512345678');
      expect(result).toEqual(mockCreatedUser);
      expect(mockInsert).toHaveBeenCalledWith({ phone_number: '+4915512345678' });
      expect(mockReturning).toHaveBeenCalledWith('*');
    });
  });

  describe('findOrCreateUser', () => {
    it('should return existing user', async () => {
      const existingUser = {
        id: 1,
        phone_number: '+33612345678',
        created_at: '2025-01-01T00:00:00.000Z',
      };
      
      mockFirst.mockResolvedValueOnce(existingUser);
      const result = await findOrCreateUser('+33612345678');
      expect(result).toEqual(existingUser);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should create a new user if not exists', async () => {
      const newUser = {
        id: 3,
        phone_number: '+819012345678',
        created_at: '2025-01-03T00:00:00.000Z',
      };
      
      mockFirst.mockResolvedValueOnce(undefined);
      mockReturning.mockResolvedValueOnce([newUser]);
      const result = await findOrCreateUser('+819012345678');
      expect(result).toEqual(newUser);
      expect(mockInsert).toHaveBeenCalledWith({ phone_number: '+819012345678' });
    });
  });
});
