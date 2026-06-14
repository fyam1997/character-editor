import type { ChatMessage } from '../types';

export type ChatChunk = {
  type: 'text' | 'done' | 'error';
  content?: string;
};

export async function* streamChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<ChatChunk> {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal,
    });
  } catch (e: unknown) {
    yield { type: 'error', content: `Request failed: ${(e as Error)?.message ?? e}` };
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    yield { type: 'error', content: `API ${response.status}: ${text}` };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          yield { type: 'done' };
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content ?? '';
          if (content) {
            yield { type: 'text', content };
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (e: unknown) {
    yield { type: 'error', content: `Stream error: ${(e as Error)?.message ?? e}` };
    return;
  }

  yield { type: 'done' };
}

export async function* mockStreamText(
  text: string,
  wordDelayMs: number = 30,
  signal?: AbortSignal,
): AsyncGenerator<ChatChunk> {
  const words = text.split(/\b/);

  for (const word of words) {
    if (signal?.aborted) {
      yield { type: 'error', content: 'Mock stream aborted' };
      return;
    }

    yield { type: 'text', content: word };
    await new Promise(r => setTimeout(r, wordDelayMs));
  }

  yield { type: 'done' };
}
