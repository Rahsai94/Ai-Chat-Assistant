import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { generateChatStream } from '@/services/ai';
import { createConversation, saveMessage } from '@/services/conversation';

// Mock the AI service
vi.mock('@/services/ai', () => ({
  generateChatStream: vi.fn(),
}));

vi.mock('@/services/conversation', () => ({
  createConversation: vi.fn(),
  saveMessage: vi.fn(),
  updateConversationTitle: vi.fn(),
}));

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  it('should return 400 for invalid requests (missing messages)', async () => {
    const req = createRequest({});
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid request payload');
  });

  it('should return 400 if message content is empty', async () => {
    const req = createRequest({
      messages: [{ role: 'user', content: '' }],
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid request payload');
  });

  it('should return 400 if too many messages are sent', async () => {
    const messages = Array.from({ length: 101 }, (_, i) => ({
      role: 'user',
      content: `Message ${i}`,
    }));
    const req = createRequest({ messages });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should handle AI service provider errors (e.g. rate limit)', async () => {
    vi.mocked(generateChatStream).mockResolvedValue({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      status: 429,
    });

    vi.mocked(createConversation).mockResolvedValue({
      id: 'new-conv-123',
      title: 'Hello',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toBe('Rate limit exceeded. Please try again later.');
  });

  it('should return successful response formatted correctly and save to new conversation', async () => {
    const mockStream = (async function* () {
      yield { text: 'Hello ' };
      yield { text: 'from ' };
      yield { text: 'AI' };
    })();

    vi.mocked(generateChatStream).mockResolvedValue({
      success: true,
      stream: mockStream as any,
    });

    vi.mocked(createConversation).mockResolvedValue({
      id: 'new-conv-123',
      title: 'Hello',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
    }

    expect(result).toContain('data: {"conversationId": "new-conv-123"}');
    expect(result).toContain('data: {"text":"Hello "}');
    expect(result).toContain('data: {"text":"from "}');
    expect(result).toContain('data: {"text":"AI"}');

    expect(createConversation).toHaveBeenCalledWith('Hello');
    expect(saveMessage).toHaveBeenCalledWith('new-conv-123', 'user', 'Hello');
  });

  it('should save to existing conversation if conversationId is provided', async () => {
    const mockStream = (async function* () {
      yield { text: 'Hello from AI' };
    })();

    vi.mocked(generateChatStream).mockResolvedValue({
      success: true,
      stream: mockStream as any,
    });

    const req = createRequest({
      conversationId: 'existing-conv-456',
      messages: [{ role: 'user', content: 'Hello again' }],
    });
    const res = await POST(req);

    expect(res.status).toBe(200);

    expect(createConversation).not.toHaveBeenCalled();
    expect(saveMessage).toHaveBeenCalledWith('existing-conv-456', 'user', 'Hello again');
  });

  it('should cap relevant messages to the last 50 before sending to AI', async () => {
    const mockStream = (async function* () {
      yield { text: 'OK' };
    })();

    vi.mocked(generateChatStream).mockResolvedValue({
      success: true,
      stream: mockStream as any,
    });

    // 60 messages, max validation allows 100, but route caps at 50
    const messages = Array.from({ length: 60 }, (_, i) => ({
      role: 'user',
      content: `Msg ${i}`,
    }));

    const req = createRequest({ messages });
    await POST(req);

    // Assert that generateChatStream was called with only the last 50 messages
    const calledWith = vi.mocked(generateChatStream).mock.calls[0][0];
    expect(calledWith.length).toBe(50);
    expect(calledWith[0].content).toBe('Msg 10');
    expect(calledWith[49].content).toBe('Msg 59');
  });
});
