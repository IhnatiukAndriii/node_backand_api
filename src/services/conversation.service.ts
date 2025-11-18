import { Conversations } from 'openai/resources/index';
import db from '../config/database';

export interface CreateMessageInput {
  userId: number;
  conversationId?: number | null;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
}

export async function createConversation(userId: number) {
  const inserted = await db('conversations')
    .insert({
      user_id: userId,
      messages: JSON.stringify([]),
      total_tokens: 0,
    })
    .returning('id');

  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  const conversationId = typeof row === 'object' && row !== null ? (row as any).id : row;

  return conversationId as number;
}
export async function getConversationMessages(
    conversationId: number,
    userId: number,
) { 
     let query = db('conversations').where({ id: conversationId })
        
        if(userId){
          query.andWhere({user_id: userId});
        }
           const conversation = await query.first();




        if (!conversation) {
            throw new Error("Conversation not found or access denied");
        }

              const messages = await db('messages')
         .where({ conversation_id: conversationId })
         .orderBy('created_at', 'asc');

           return {
                       conversationId,
             userId: conversation.user_id,
              messages,
                  };

}
export async function getUserConversations(userId: number) {
   const conversations = await db('conversations')
       .where({ user_id: userId })
         .orderBy('updated_at', 'desc');
    return conversations;
}


export async function addMessage(input: CreateMessageInput) {
  const { userId, role, content, tokens = 0 } = input;
  let { conversationId } = input;

  if (!conversationId) {
    conversationId = await createConversation(userId);
  }

  await db('messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    tokens,
  });

  const existing = await db('conversations')
    .where({ id: conversationId })
    .first();

  const currentMessages = existing?.messages ? JSON.parse(existing.messages) : [];
  currentMessages.push({ role, content, tokens });

  await db('conversations')
    .where({ id: conversationId })
    .update({
      messages: JSON.stringify(currentMessages),
      total_tokens: (existing?.total_tokens || 0) + tokens,
      updated_at: db.fn.now(),
    });

  return { conversationId, messages: currentMessages };
}
