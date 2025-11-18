import db from '../config/database';
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface ConversationRow {
  id: number;
  user_id: number;
  messages: string;
  total_tokens: number;
}
export async function createConversation(userId: number): Promise<number> {
  const initialMessages: ConversationMessage[] = [];

  const inserted = await db('conversations')
    .insert({
      user_id: userId,
      messages: JSON.stringify(initialMessages),
      total_tokens: 0,
    })
    .returning('id');

  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  const conversationId =
    typeof row === 'object' && row !== null ? (row as any).id : row;

  return conversationId as number;
}
export async function getConversation(userId: number): Promise<ConversationRow> {
  let conversation = await db<ConversationRow>('conversations')
    .where({ user_id: userId })
    .first();

  if (!conversation) {
    const conversationId = await createConversation(userId);
    conversation = (await db<ConversationRow>('conversations')
      .where({ id: conversationId })
      .first()) as ConversationRow;
  }

  return conversation;
}
export async function getMessages(
  userId: number,
): Promise<ConversationMessage[]> {
  const conversation = await getConversation(userId);

  try {
    return JSON.parse(conversation.messages) as ConversationMessage[];
  } catch {
    return [];
  }
}
export async function addMessageToConversation(
  userId: number,
  role: ConversationMessage['role'],
  content: string,
): Promise<ConversationMessage[]> {
  const conversation = await getConversation(userId);
  const messages = await getMessages(userId);

  messages.push({ role, content });

  await db('conversations')
    .where({ id: conversation.id })
    .update({
      messages: JSON.stringify(messages),
      updated_at: db.fn.now(),
    });

  return messages;
}
export async function updateTotalTokens(
  userId: number,
  tokens: number,
): Promise<void> {
  const conversation = await getConversation(userId);

  await db('conversations')
    .where({ id: conversation.id })
    .update({
      total_tokens: tokens,
      updated_at: db.fn.now(),
    });
}
export async function resetConversation(userId: number): Promise<void> {
  const conversation = await getConversation(userId);

  const emptyMessages: ConversationMessage[] = [];

  await db('conversations')
    .where({ id: conversation.id })
    .update({
      messages: JSON.stringify(emptyMessages),
      total_tokens: 0,
      updated_at: db.fn.now(),
    });
}
export async function getUserConversations(userId: number) {
  const conversations = await db('conversations')
    .where({ user_id: userId })
    .orderBy('updated_at', 'desc');

  return conversations;
}