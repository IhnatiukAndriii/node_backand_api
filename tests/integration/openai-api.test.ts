import { describe, it, expect } from 'vitest';
import { sendChatRequest, parseOpenAIResponse } from '../../src/services/openai.service';

describe('Integration Tests - Real OpenAI API', () => {
  const skipIfNoKey = !process.env.OPENAI_API_KEY;

  if (skipIfNoKey) {
    console.log(' Skipping OpenAI API tests - OPENAI_API_KEY not set');
    console.log(' To run these tests, set OPENAI_API_KEY in your .env file');
  }

  describe('sendChatRequest with Real API', () => {
    it.skipIf(skipIfNoKey)('should send request to OpenAI and get response', async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant. Respond with JSON only.',
        },
        {
          role: 'user' as const,
          content: 'Say hello in JSON format with a "message" field',
        },
      ];

      const response = await sendChatRequest(messages);

      console.log('OpenAI Response:', response);

      expect(response).toHaveProperty('content');
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it.skipIf(skipIfNoKey)('should parse habit creation intent from real OpenAI', async () => {
      const systemPrompt = `You are a habit management assistant. Analyze user messages and return JSON with:
{
  "action": "create" | "update" | "delete" | "list" | "clarification",
  "habit_name": string (if applicable),
  "frequency_type": "daily" | "weekly" | "times_per_day" (if applicable),
  "frequency_times": number | string[] (if applicable)
}`;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: 'I want to drink water 3 times per day',
        },
      ];

      const response = await sendChatRequest(messages);
      console.log('Raw OpenAI response:', response.content);

      const parsed = parseOpenAIResponse(response);
      console.log('Parsed intent:', parsed);

      expect(parsed).toHaveProperty('action');
      expect(parsed.action).toBeOneOf(['create', 'clarification']);
      
      if (parsed.action === 'create') {
        expect(parsed.habit_name?.toLowerCase()).toContain('water');
      }
    });

    it.skipIf(skipIfNoKey)('should handle list intent from real OpenAI', async () => {
      const systemPrompt = `You are a habit management assistant. Analyze user messages and return JSON with:
{
  "action": "create" | "update" | "delete" | "list" | "clarification"
}`;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: 'Show me all my habits',
        },
      ];

      const response = await sendChatRequest(messages);
      console.log('Raw OpenAI response:', response.content);

      const parsed = parseOpenAIResponse(response);
      console.log('Parsed intent:', parsed);

      expect(parsed).toHaveProperty('action');
      expect(parsed.action).toBe('list');
    });

    it.skipIf(skipIfNoKey)('should handle update intent from real OpenAI', async () => {
      const systemPrompt = `You are a habit management assistant. Analyze user messages and return JSON with:
{
  "action": "create" | "update" | "delete" | "list" | "clarification",
  "habit_name": string (if applicable),
  "frequency_type": "daily" | "weekly" | "times_per_day" (if applicable)
}`;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: 'Change my morning run to twice per week',
        },
      ];

      const response = await sendChatRequest(messages);
      console.log('Raw OpenAI response:', response.content);

      const parsed = parseOpenAIResponse(response);
      console.log('Parsed intent:', parsed);

      expect(parsed).toHaveProperty('action');
      expect(parsed.action).toBeOneOf(['update', 'clarification']);
    });

    it.skipIf(skipIfNoKey)('should handle delete intent from real OpenAI', async () => {
      const systemPrompt = `You are a habit management assistant. Analyze user messages and return JSON with:
{
  "action": "create" | "update" | "delete" | "list" | "clarification",
  "habit_name": string (if applicable)
}`;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: 'Remove my water drinking habit',
        },
      ];

      const response = await sendChatRequest(messages);
      console.log('Raw OpenAI response:', response.content);

      const parsed = parseOpenAIResponse(response);
      console.log('Parsed intent:', parsed);

      expect(parsed).toHaveProperty('action');
      expect(parsed.action).toBeOneOf(['delete', 'clarification']);
    });
  });

  describe('Error Handling with Real API', () => {
    it.skipIf(skipIfNoKey)('should handle invalid JSON response gracefully', async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'Respond with plain text, not JSON.',
        },
        {
          role: 'user' as const,
          content: 'Hello',
        },
      ];

      const response = await sendChatRequest(messages);
      console.log('Plain text response:', response.content);
      expect(() => parseOpenAIResponse(response)).toThrow();
    });
  });

  describe('Token Management', () => {
    it.skipIf(skipIfNoKey)('should handle long conversation with token limits', async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user' as const,
          content: 'Tell me about habits',
        },
        {
          role: 'assistant' as const,
          content: 'Habits are routines...',
        },
        {
          role: 'user' as const,
          content: 'How do I create a good habit?',
        },
        {
          role: 'assistant' as const,
          content: 'Start small...',
        },
        {
          role: 'user' as const,
          content: 'Give me 5 examples',
        },
      ];

      const response = await sendChatRequest(messages);
      console.log('Long conversation response:', response.content);

      expect(response).toHaveProperty('content');
      expect(response.content.length).toBeGreaterThan(0);
    });
  });
});
