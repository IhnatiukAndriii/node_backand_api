import openai from '../config/openai';

export interface ConversationMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface OpenAIResponse {
	content: string;
}

export async function sendChatRequest(
	messages: ConversationMessage[],
): Promise<OpenAIResponse> {
	const response = await openai.chat.completions.create({
		model: 'gpt-4.1-mini',
		messages: messages.map((m) => ({ role: m.role, content: m.content })),
	});

	const content = response.choices[0]?.message?.content ?? '';

	return { content };
}