/**
 * AI Provider Service: Google Gemini, Groq Cloud, and Local Ollama
 */

import { AIProvider, Message, MessageMetadata } from '../types';

export function parseMetadata(rawText: string): { pText: string; pMeta?: MessageMetadata } {
  const split = rawText.split('--META--');
  const textStr = split[0];
  let metaObj: MessageMetadata | undefined = undefined;

  if (split.length > 1) {
    const mStr = split[1];
    metaObj = {};
    const toneMatch = mStr.match(/TONE:\s*([^\n]+)/);
    if (toneMatch) metaObj.tone = toneMatch[1].trim();

    const tagsMatch = mStr.match(/TAGS:\s*([^\n]+)/);
    if (tagsMatch) metaObj.tags = tagsMatch[1].split(' ').filter(t => t.startsWith('#'));

    const suggMatch = mStr.match(/SUGGESTIONS:\s*([^\n]+)/);
    if (suggMatch) metaObj.suggestions = suggMatch[1].split('|').map(s => s.trim());

    const confMatch = mStr.match(/CONFIDENCE:\s*(\d+)/);
    if (confMatch) metaObj.confidence = parseInt(confMatch[1], 10);
  }

  return { pText: textStr, pMeta: metaObj };
}

export interface GenerateTextOptions {
  provider: AIProvider;
  geminiKey: string;
  geminiModel: string;
  groqKey: string;
  groqModel: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  onGeminiModelFallback?: (fallbackModel: string) => void;
}

export async function generateAIText(options: GenerateTextOptions): Promise<string> {
  const {
    provider,
    geminiKey,
    geminiModel,
    groqKey,
    groqModel,
    ollamaModel,
    ollamaBaseUrl,
    systemPrompt,
    userPrompt,
    jsonMode = false,
    onGeminiModelFallback
  } = options;

  if (provider === 'GEMINI') {
    if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured. Please add to .env or settings.');

    const tryFetch = async (mName: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${geminiKey}`;
      const payload: any = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
      };
      if (jsonMode) {
        payload.generationConfig = { responseMimeType: 'application/json' };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API returned HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    };

    try {
      return await tryFetch(geminiModel);
    } catch (err: any) {
      if (geminiModel !== 'gemini-flash-lite-latest') {
        onGeminiModelFallback?.('gemini-flash-lite-latest');
        return await tryFetch('gemini-flash-lite-latest');
      }
      throw err;
    }
  } else if (provider === 'GROQ') {
    if (!groqKey) throw new Error('GROQ_API_KEY is not configured. Please add to .env or settings.');

    const payload: any = {
      model: groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };
    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } else {
    // OLLAMA
    const endpoint = '/ollama-proxy/v1/chat/completions';
    const payload: any = {
      model: ollamaModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };
    if (jsonMode) {
      payload.format = 'json';
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      throw new Error(`Cannot reach local Ollama at ${ollamaBaseUrl}. Make sure 'ollama serve' is running.`);
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Ollama returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

export interface StreamOptions {
  provider: AIProvider;
  geminiKey: string;
  geminiModel: string;
  groqKey: string;
  groqModel: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  systemPrompt: string;
  commandStr: string;
  messages: Message[];
  onChunk: (chunk: string) => void;
  onGeminiModelFallback?: (fallbackModel: string) => void;
}

export async function generateAIStream(options: StreamOptions): Promise<void> {
  const {
    provider,
    geminiKey,
    geminiModel,
    groqKey,
    groqModel,
    ollamaModel,
    ollamaBaseUrl,
    systemPrompt,
    commandStr,
    messages,
    onChunk,
    onGeminiModelFallback
  } = options;

  if (provider === 'GEMINI') {
    if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured.');

    const fetchStream = async (mName: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const contents = [
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.rawText || m.text }]
        })),
        { role: 'user', parts: [{ text: commandStr }] }
      ];

      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 4096 }
        })
      });
    };

    let res = await fetchStream(geminiModel);
    if (!res.ok && geminiModel !== 'gemini-flash-lite-latest') {
      onGeminiModelFallback?.('gemini-flash-lite-latest');
      res = await fetchStream('gemini-flash-lite-latest');
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Gemini HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    if (reader) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) onChunk(chunk);
          } catch (e) {
            console.error('Gemini SSE parse error:', trimmed, e);
          }
        }
      }
    }
  } else {
    // GROQ or OLLAMA
    const isGroq = provider === 'GROQ';
    const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : '/ollama-proxy/v1/chat/completions';
    const modelName = isGroq ? groqModel : ollamaModel;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isGroq) headers['Authorization'] = `Bearer ${groqKey}`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.rawText || m.text })),
      { role: 'user', content: commandStr }
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: apiMessages,
        stream: true,
        max_tokens: 4096
      })
    }).catch(err => {
      if (!isGroq) {
        throw new Error(`Cannot reach local Ollama at ${ollamaBaseUrl}. Please run 'ollama serve' or switch to Gemini.`);
      }
      throw err;
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error?.message || `HTTP ${res.status}`;
      if (isGroq && res.status === 401) {
        throw new Error(`Invalid Groq API Key. Please click [AI_KERNEL_SETTINGS] to update your key or switch to Gemini.`);
      }
      throw new Error(errMsg);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (reader) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          if (trimmedLine === 'data: [DONE]') break;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                onChunk(data.choices[0].delta.content);
              }
            } catch (e) {
              console.error('SSE parse error:', trimmedLine, e);
            }
          }
        }
      }
    }
  }
}
