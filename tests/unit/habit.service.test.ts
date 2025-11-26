import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as habitService from '../../src/services/habit.service';
import { ParsedIntent } from '../../src/services/openai.service';
const mockFirst = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockReturning = vi.fn();
const mockInsert = vi.fn(() => ({ returning: mockReturning }));
const mockUpdate = vi.fn(() => ({ returning: mockReturning }));
vi.mock('../../src/config/database', () => {
  const mockFn = {
    now: vi.fn(() => 'CURRENT_TIMESTAMP'),
  };
  
  const mockDb = vi.fn((tableName: string) => {
    const queryBuilder = {
      where: mockWhere,
      first: mockFirst,
      insert: mockInsert,
      update: mockUpdate,
      orderBy: mockOrderBy,
    };
    mockWhere.mockReturnValue({ 
      first: mockFirst,
      update: mockUpdate,
      orderBy: mockOrderBy,
    });
    mockOrderBy.mockReturnValue(Promise.resolve([]));
    mockUpdate.mockReturnValue({ returning: mockReturning });
    
    return queryBuilder;
  }) as any;
  mockDb.fn = mockFn; 
  return {
    default: mockDb,
  };
});

describe('HabitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHabit', () => {
    it('should create habit with full data', async () => {
      const userId = 1;
      const intent: ParsedIntent = {
        action: 'create',
        habit_name: 'Run in the morning',
        frequency_type: 'weekly',
        frequency_times: ['monday', 'wednesday', 'friday'],
      };

      const mockCreatedHabit = {
        id: 1,
        user_id: userId,
        habit_name: 'Run in the morning',
        frequency_type: 'weekly',
        frequency_times: '["monday","wednesday","friday"]',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      mockReturning.mockResolvedValueOnce([mockCreatedHabit]);
      const result = await habitService.createHabit(userId, intent);
      expect(result).toEqual(mockCreatedHabit);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        habit_name: 'Run in the morning',
        frequency_type: 'weekly',
        frequency_times: '["monday","wednesday","friday"]',
      });
    });

    it('should create habit with default values', async () => {
      const userId = 2;
      const intent: ParsedIntent = {
        action: 'create',
        habit_name: undefined,
        frequency_type: undefined,
        frequency_times: undefined,
      };

      const mockCreatedHabit = {
        id: 2,
        user_id: userId,
        habit_name: 'Untitled habit',
        frequency_type: 'custom',
        frequency_times: null,
        status: 'active',
        created_at: '2025-01-02T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z',
      };

      mockReturning.mockResolvedValueOnce([mockCreatedHabit]);
      const result = await habitService.createHabit(userId, intent);
      expect(result.habit_name).toBe('Untitled habit');
      expect(result.frequency_type).toBe('custom');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        habit_name: 'Untitled habit',
        frequency_type: 'custom',
        frequency_times: null,
      });
    });
  });

  describe('listHabitsByUser', () => {
    it('should return all active habits for user', async () => {
      const userId = 1;
      const mockHabits = [
        {
          id: 1,
          user_id: userId,
          habit_name: 'Run',
          frequency_type: 'weekly',
          frequency_times: '["monday"]',
          status: 'active',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          user_id: userId,
          habit_name: 'Read',
          frequency_type: 'daily',
          frequency_times: '1',
          status: 'active',
          created_at: '2025-01-02T00:00:00.000Z',
          updated_at: '2025-01-02T00:00:00.000Z',
        },
      ];

      mockOrderBy.mockResolvedValueOnce(mockHabits);
      const result = await habitService.listHabitsByUser(userId);
      expect(result).toEqual(mockHabits);
      expect(result).toHaveLength(2);
      expect(mockWhere).toHaveBeenCalledWith({ user_id: userId, status: 'active' });
      expect(mockOrderBy).toHaveBeenCalledWith('created_at', 'asc');
    });

    it('should return empty array when no habits found', async () => {
      const userId = 999;
      mockOrderBy.mockResolvedValueOnce([]);

      const result = await habitService.listHabitsByUser(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getHabitById', () => {
    it('should return habit by ID', async () => {
      const mockHabit = {
        id: 1,
        user_id: 1,
        habit_name: 'Run',
        frequency_type: 'weekly',
        frequency_times: '["monday"]',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      mockFirst.mockResolvedValueOnce(mockHabit);

      const result = await habitService.getHabitById(1);

      expect(result).toEqual(mockHabit);
      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when habit not found', async () => {
      // Arrange
      mockFirst.mockResolvedValueOnce(undefined);

      // Act
      const result = await habitService.getHabitById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findHabitByName', () => {
    it('should find active habit by name', async () => {
      const mockHabit = {
        id: 1,
        user_id: 1,
        habit_name: 'Run',
        frequency_type: 'weekly',
        frequency_times: '["monday"]',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      mockFirst.mockResolvedValueOnce(mockHabit);

      const result = await habitService.findHabitByName(1, 'Run');

      expect(result).toEqual(mockHabit);
      expect(mockWhere).toHaveBeenCalledWith({
        user_id: 1,
        habit_name: 'Run',
        status: 'active',
      });
    });

    it('should return null when habit not found', async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      const result = await habitService.findHabitByName(1, 'Nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateHabit', () => {
    it('should update habit', async () => {
      const existingHabit = {
        id: 1,
        user_id: 1,
        habit_name: 'Run',
        frequency_type: 'weekly',
        frequency_times: '["monday"]',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      const updatedHabit = {
        ...existingHabit,
        habit_name: 'Run faster',
        updated_at: '2025-01-02T00:00:00.000Z',
      };
      mockFirst.mockResolvedValueOnce(existingHabit);
      const mockUpdateChain = {
        returning: vi.fn().mockResolvedValueOnce([updatedHabit]),
      };
      mockUpdate.mockReturnValueOnce(mockUpdateChain);
      const result = await habitService.updateHabit(1, {
        habit_name: 'Run faster',
      });
      expect(result).toEqual(updatedHabit);
    });

    it('should return null when habit does not exist', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await habitService.updateHabit(999, {
        habit_name: 'Something',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit (soft delete)', async () => {
      const existingHabit = {
        id: 1,
        user_id: 1,
        habit_name: 'Run',
        frequency_type: 'weekly',
        frequency_times: '["monday"]',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      mockFirst.mockResolvedValueOnce(existingHabit);

      const result = await habitService.deleteHabit(1);

      expect(result).toBe(true);
    });

    it('should return false when habit does not exist', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await habitService.deleteHabit(999);
      expect(result).toBe(false);
    });
  });
});


