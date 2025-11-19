import openai from '../config/openai';

export interface ConversationMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export type IntentAction =
	| 'create'
	| 'update'
	| 'delete'
	| 'list'
	| 'clarification';

export interface ParsedIntent {
	action: IntentAction;
	habit_name?: string;
	habit_id?: number;
	frequency_type?: string;
	frequency_times?: number | string[];
	clarification_question?: string;
}

export interface OpenAIResponse {
	content: string;
}

export async function sendChatRequest(
	messages: ConversationMessage[],
): Promise<OpenAIResponse> {
	const response = await openai.chat.completions.create({
		model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
		messages: messages.map((m) => ({ role: m.role, content: m.content })),
		response_format: { type: 'json_object' },
	});

	const content = response.choices[0]?.message?.content ?? '';

	return { content };
}

export function parseOpenAIResponse(response: OpenAIResponse): ParsedIntent {
	const raw = response.content;

	try {
		const parsed = JSON.parse(raw);
		if (!parsed.action) {
			throw new Error('Missing action field in OpenAI response');
		}
		return parsed as ParsedIntent;
	} catch (error) {
		throw new Error('Failed to parse OpenAI JSON response');
	}
}