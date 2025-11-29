import { describe, it, expect, vi, beforeEach} from 'vitest';
import {sendChatRequest,  parseOpenAIResponse } from '../../src/services/openai.service';
vi.mock('../../src/config/openai', () => {
	const mockCreate = vi.fn()
    return{
        default:{
            chat:{
                completions:{
                create:mockCreate,
                }
            }
        }
    }
});
describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseOpenAIResponse', () => {
    it('should parse valid response with create action', () => {
      const response = {
        content: JSON.stringify({
          action: 'create',
          habit_name: 'Exercise',
          frequency_type: 'daily',
        }),
      };

      const result = parseOpenAIResponse(response);

      expect(result.action).toBe('create');
      expect(result.habit_name).toBe('Exercise');
      expect(result.frequency_type).toBe('daily');
    });

    it('should parse valid response with list action', () => {
      const response = {
        content: JSON.stringify({
          action: 'list',
        }),
      };

      const result = parseOpenAIResponse(response);

      expect(result.action).toBe('list');
    });

    it('should throw error for invalid JSON', () => {
      const response = { content: 'not a JSON' };

      expect(() => parseOpenAIResponse(response)).toThrow('Failed to parse OpenAI JSON response');
    });

    it('should throw error when action field is missing', () => {
      const response = {
        content: JSON.stringify({
          habit_name: 'Exercise',
        }),
      };

      expect(() => parseOpenAIResponse(response)).toThrow('Missing action field in OpenAI response');
    });
  });

  describe('sendChatRequest', () => {
    it('should send messages to OpenAI and return response', async () => {
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({ action: 'create', habit_name: 'Run' }),
            },
          },
        ],
      });

      const openai = (await import('../../src/config/openai')).default;
      openai.chat.completions.create = mockCreate;

      const messages = [
        { role: 'user' as const, content: 'Create habit Run' },
      ];

      const result = await sendChatRequest(messages);

      expect(mockCreate).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: [{ role: 'user', content: 'Create habit Run' }],
      });
      expect(result.content).toContain('action');
    });

    it('should return content from OpenAI response', async () => {
      const expectedContent = JSON.stringify({ action: 'list' });
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: expectedContent,
            },
          },
        ],
      });

      const openai = (await import('../../src/config/openai')).default;
      openai.chat.completions.create = mockCreate;

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'List my habits' },
      ];

      const result = await sendChatRequest(messages);

      expect(result.content).toBe(expectedContent);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });
});