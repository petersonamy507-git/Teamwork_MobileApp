import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import type { AiChat } from '../../types/models';

// The web "Catch me up" button opens the AI Teammate with the prompt "Catch me up" (pages/MyWork.jsx).
export const aiApi = { ask: (prompt: string, chatId?: number) => apiClient.post<AiChat>('/ai/ask', { prompt, chat_id: chatId ?? null }) };

export const useCatchMeUp = () => useMutation({ mutationFn: () => aiApi.ask('Catch me up') });

/** The summary is the last non-user message in the chat. */
export const lastAnswer = (c?: AiChat) => [...(c?.messages ?? [])].reverse().find((m) => m.role !== 'user')?.text ?? '';
