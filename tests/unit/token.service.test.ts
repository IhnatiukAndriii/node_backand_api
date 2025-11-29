import { describe, it, expect, beforeEach, vi } from 'vitest';
import { countTokens, trimMessages } from '../../src/services/token.service';
import { ConversationMessage } from '../../src/services/openai.service';

vi.mock('tiktoken', () => ({
  encoding_for_model: vi.fn(() => ({
    encode: vi.fn((text: string) => {
      return new Array(Math.ceil(text.length / 4)).fill(0);
    }),
    free: vi.fn(),
  })),
}));

describe('TokenService', () => {
  describe('countTokens', () => {
    it('should count tokens for single message', () => {
      const messages: ConversationMessage[] = [
        { role: 'user', content: 'Hello' },
      ];
      const result = countTokens(messages);
      expect(result).toBeGreaterThan(0);
    });

    it('should count tokens for multiple messages', () => {
      const messages: ConversationMessage[] = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      const result = countTokens(messages);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeGreaterThanOrEqual(messages.length * 4);
    });

    it('should return 0 for empty messages', () => {
      const messages: ConversationMessage[] = [];
      const result = countTokens(messages);
      expect(result).toBe(0);
    });
  });

  describe('trimMessages', () => {
    it('should keep system message when trimming', () => {
      const messages: ConversationMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
      ];
      const maxTokens = 20;
      const result = trimMessages(messages, maxTokens);
      expect(result[0]).toEqual(messages[0]);
      expect(result.length).toBeLessThan(messages.length);
    });

    it('should return all messages when under token limit', () => {
      const messages: ConversationMessage[] = [
        { role: 'system', content: 'Hi' },
        { role: 'user', content: 'Hello' },
      ];
      const maxTokens = 10000;
      const result = trimMessages(messages, maxTokens);
      expect(result).toEqual(messages);
    });

    it('should return messages as-is when array is empty', () => {
      const messages: ConversationMessage[] = [];
      const maxTokens = 100;
      const result = trimMessages(messages, maxTokens);
      expect(result).toEqual([]);
    });
  });
});
