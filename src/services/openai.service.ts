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
	| 'complete'
	| 'stats'
	| 'history'
	| 'clarification';

export interface ParsedIntent {
	action: IntentAction;
	habit_name?: string;
	habit_id?: number;
	frequency_type?: string;
	frequency_times?: number | string[];
	scheduled_time?: string;
	note?: string;
	clarification_question?: string;
	assistant_message?: string;
}

export interface OpenAIResponse {
	content: string;
}

import logger from '../utils/logger';

export async function sendChatRequest(
	messages: ConversationMessage[],
): Promise<OpenAIResponse> {
	const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
	logger.info('sendChatRequest', { model });

	const response = await openai.chat.completions.create({
		model,
		messages: messages.map((m) => ({ role: m.role, content: m.content })),
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
		if (error instanceof Error && error.message === 'Missing action field in OpenAI response') {
			throw error;
		}
		throw new Error('Failed to parse OpenAI JSON response');
	}
}