import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as conversationService from '../../src/services/conversation.service';

vi.mock('../../src/config/database', () => {
  const mockFirst = vi.fn();
  const mockReturning = vi.fn();
  const mockUpdate = vi.fn();
  const mockOrderBy = vi.fn();
  const mockWhere = vi.fn(() => ({
    first: mockFirst,
    update: mockUpdate,
  }));

  const mockInsert = vi.fn(() => ({
    returning: mockReturning,
  }));
  
  const mockDb = vi.fn((tableName: string) => ({
    where: mockWhere,
    insert: mockInsert,
    orderBy: mockOrderBy,
  })) as any;
  
  mockDb.fn = {
    now: vi.fn(() => 'CURRENT_TIMESTAMP'),
  };
  
  return {
    default: mockDb,
    mockFirst,
    mockWhere,
    mockInsert,
    mockReturning,
    mockUpdate,
    mockOrderBy,
  };
});

describe('Conversation Service', () => {
  let mockFirst: any;
  let mockInsert: any;
  let mockReturning: any;
  let mockUpdate: any;
  let mockOrderBy: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbModule = await import('../../src/config/database');
    mockFirst = (dbModule as any).mockFirst;
    mockInsert = (dbModule as any).mockInsert;
    mockReturning = (dbModule as any).mockReturning;
    mockUpdate = (dbModule as any).mockUpdate;
    mockOrderBy = (dbModule as any).mockOrderBy;
  });

  describe('createConversation', () => {
    it('should create new conversation with empty messages', async () => {
      mockReturning.mockResolvedValueOnce([{ id: 1 }]);

      const result = await conversationService.createConversation(1);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 1,
        messages: JSON.stringify([]),
        total_tokens: 0,
      });
      expect(result).toBe(1);
    });
  });

  describe('getConversation', () => {
    it('should return existing conversation', async () => {
      const mockConversation = {
        id: 1,
        user_id: 1,
        messages: '[]',
        total_tokens: 0,
      };
      mockFirst.mockResolvedValueOnce(mockConversation);

      const result = await conversationService.getConversation(1);

      expect(result).toEqual(mockConversation);
      expect(mockFirst).toHaveBeenCalledTimes(1);
    });

    it('should create new conversation if not exists', async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      mockReturning.mockResolvedValueOnce([{ id: 2 }]);

      const newConversation = {
        id: 2,
        user_id: 1,
        messages: '[]',
        total_tokens: 0,
      };
      mockFirst.mockResolvedValueOnce(newConversation);

      const result = await conversationService.getConversation(1);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 1,
        messages: JSON.stringify([]),
        total_tokens: 0,
      });
      expect(mockFirst).toHaveBeenCalledTimes(2);
      expect(result).toEqual(newConversation);
    });
  });

  describe('getMessages', () => {
    it('should return parsed messages from conversation', async () => {
      const mockConversation = {
        id: 1,
        user_id: 1,
        messages: '[{"role":"user","content":"Hello"}]',
        total_tokens: 5,
      };
      mockFirst.mockResolvedValueOnce(mockConversation);

      const result = await conversationService.getMessages(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: 'Hello',
      });
    });

    it('should return empty array for invalid JSON', async () => {
      const mockConversation = {
        id: 1,
        user_id: 1,
        messages: 'invalid json string',
        total_tokens: 0,
      };
      mockFirst.mockResolvedValueOnce(mockConversation);

      const result = await conversationService.getMessages(1);

      expect(result).toEqual([]);
    });
  });

  describe('addMessageToConversation', () => {
    it('should add message to conversation', async () => {
      const mockConversation = {
        id: 1,
        user_id: 1,
        messages: '[]',
        total_tokens: 0,
      };
      mockFirst.mockResolvedValueOnce(mockConversation);
      mockFirst.mockResolvedValueOnce(mockConversation);

      mockUpdate.mockResolvedValueOnce(1);

      const result = await conversationService.addMessageToConversation(
        1,
        'user',
        'Test message'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: 'Test message',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        messages: JSON.stringify([{ role: 'user', content: 'Test message' }]),
        updated_at: 'CURRENT_TIMESTAMP',
      });
    });
  });

  describe('updateTotalTokens', () => {
    it('should update total tokens for conversation', async () => {
      const mockConversation = {
        id: 1,
        user_id: 1,
        messages: '[]',
        total_tokens: 0,
      };
      mockFirst.mockResolvedValueOnce(mockConversation);

      mockUpdate.mockResolvedValueOnce(1);

      await conversationService.updateTotalTokens(1, 150);

      expect(mockUpdate).toHaveBeenCalledWith({
        total_tokens: 150,
        updated_at: 'CURRENT_TIMESTAMP',
      });
    });
  });

  describe('resetConversation', () => {
    it('should reset conversation messages and tokens', async () => {
      const mockConversation = {
        id: 1,
        user_id: 1,
        messages: '[{"role":"user","content":"Old message"}]',
        total_tokens: 100,
      };
      mockFirst.mockResolvedValueOnce(mockConversation);

      mockUpdate.mockResolvedValueOnce(1);

      await conversationService.resetConversation(1);

      expect(mockUpdate).toHaveBeenCalledWith({
        messages: JSON.stringify([]),
        total_tokens: 0,
        updated_at: 'CURRENT_TIMESTAMP',
      });
    });
  });

  describe('getUserConversations', () => {
    it('should return all conversations for user', async () => {
      const mockConversations = [
        { id: 1, user_id: 1, messages: '[]', total_tokens: 0 },
        { id: 2, user_id: 1, messages: '[]', total_tokens: 5 },
      ];
      
      const mockWhere = vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValueOnce(mockConversations),
      }));
      
      const dbModule = await import('../../src/config/database');
      const mockDb = (dbModule as any).default;
      mockDb.mockReturnValueOnce({
        where: mockWhere,
      });

      const result = await conversationService.getUserConversations(1);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockConversations);
    });
  });
});

