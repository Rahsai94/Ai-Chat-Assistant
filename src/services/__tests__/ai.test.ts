import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Must set env before importing the module since it throws on evaluation if missing
process.env.GEMINI_API_KEY = 'test-key';

import { generateChatResponse } from '../ai';
import { GoogleGenAI } from '@google/genai';

// We must mock the genai constructor explicitly because of how it is initialized at module scope
vi.mock('@google/genai', () => {
  const generateContent = vi.fn();
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent,
      };
    },
  };
});

describe('AI Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should generate content and return text successfully', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    // Cannot mock module-level process.env.GEMINI_MODEL after import here due to scope,
    // so we assert on the fallback default model 'gemini-2.5-flash'.

    // We get the mocked instance's generateContent function
    const aiInstance = new GoogleGenAI({ apiKey: 'test' });
    vi.mocked(aiInstance.models.generateContent).mockResolvedValue({
      text: 'AI response text',
    } as any);

    const result = await generateChatResponse([{ role: 'user', content: 'test message' }]);

    expect(result.success).toBe(true);
    expect(result.text).toBe('AI response text');
    expect(aiInstance.models.generateContent).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'test message' }] }],
    });
  });

  it('should properly map assistant role to model role for Gemini', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const aiInstance = new GoogleGenAI({ apiKey: 'test' });
    vi.mocked(aiInstance.models.generateContent).mockResolvedValue({ text: 'ok' } as any);

    await generateChatResponse([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' }
    ]);

    const callArgs = vi.mocked(aiInstance.models.generateContent).mock.calls[0][0];
    expect(callArgs.contents).toEqual([
      { role: 'user', parts: [{ text: 'hello' }] },
      { role: 'model', parts: [{ text: 'hi' }] }
    ]);
  });

  it('should handle provider errors and return generic error message', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const aiInstance = new GoogleGenAI({ apiKey: 'test' });
    vi.mocked(aiInstance.models.generateContent).mockRejectedValue(new Error('Provider failure'));

    const result = await generateChatResponse([{ role: 'user', content: 'test' }]);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBe('Failed to generate AI response due to a provider error.');
  });
});
