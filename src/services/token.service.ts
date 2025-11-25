import { encoding_for_model } from 'tiktoken';
import { ConversationMessage } from './conversation.service';

const MODEL = 'gpt-4';

export function countTokens(messages: ConversationMessage[]): number {
  const encoding = encoding_for_model(MODEL);
  let totalTokens = 0;

  for (const message of messages) {
    const tokens = encoding.encode(message.content);
    totalTokens += tokens.length + 4; 
  }

  encoding.free();
  return totalTokens;
}

export function trimMessages(
  messages: ConversationMessage[],
  maxTokens: number,
): ConversationMessage[] {
  if (messages.length === 0) return messages;

  const systemMessage = messages[0];
  let rest = messages.slice(1);

  while (countTokens([systemMessage, ...rest]) > maxTokens && rest.length > 0) {
    rest = rest.slice(2);
  }

  return [systemMessage, ...rest];
}
