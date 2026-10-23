import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionId } from '../session';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock server-only to avoid errors in tests
vi.mock('server-only', () => ({}));

describe('Session Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing session id if cookie exists', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: 'existing-session-id' }),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const sessionId = await getSessionId();

    expect(sessionId).toBe('existing-session-id');
    expect(mockCookieStore.get).toHaveBeenCalledWith('chat_session_id');
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it('should create and set a new session id if cookie does not exist', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const sessionId = await getSessionId();

    expect(sessionId).toBeDefined();
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(mockCookieStore.get).toHaveBeenCalledWith('chat_session_id');
    expect(mockCookieStore.set).toHaveBeenCalledWith('chat_session_id', sessionId, expect.any(Object));
  });
});
