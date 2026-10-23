import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createConversation,
  getConversations,
  getConversation,
  saveMessage,
  deleteConversation,
  updateConversationTitle
} from '../conversation';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    conversation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
    }
  }
}));

// Mock server-only
vi.mock('server-only', () => ({}));

describe('Conversation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createConversation', async () => {
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: '1', title: 'Test', sessionId: 's1' } as any);
    const result = await createConversation('Test', 's1');
    expect(result.id).toBe('1');
    expect(prisma.conversation.create).toHaveBeenCalledWith({ data: { title: 'Test', sessionId: 's1' } });
  });

  it('getConversations', async () => {
    vi.mocked(prisma.conversation.findMany).mockResolvedValue([{ id: '1' }] as any);
    const result = await getConversations('s1');
    expect(result.length).toBe(1);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith({
      where: { sessionId: 's1' },
      orderBy: { createdAt: "desc" }
    });
  });

  it('getConversation', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({ id: '1' } as any);
    const result = await getConversation('1', 's1');
    expect(result).toBeDefined();
    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: { id: '1', sessionId: 's1' },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  });

  it('saveMessage defaults to completed status', async () => {
    vi.mocked(prisma.message.create).mockResolvedValue({ id: 'm1' } as any);
    await saveMessage('1', 'user', 'Hi');
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { conversationId: '1', role: 'user', content: 'Hi', status: 'completed' }
    });
  });

  it('saveMessage uses provided status', async () => {
    vi.mocked(prisma.message.create).mockResolvedValue({ id: 'm1' } as any);
    await saveMessage('1', 'assistant', 'Hi', 'aborted');
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { conversationId: '1', role: 'assistant', content: 'Hi', status: 'aborted' }
    });
  });

  it('deleteConversation throws if not found', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);
    await expect(deleteConversation('1', 's1')).rejects.toThrow("Conversation not found or unauthorized");
  });

  it('deleteConversation succeeds if found', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({ id: '1' } as any);
    await deleteConversation('1', 's1');
    expect(prisma.conversation.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('updateConversationTitle throws if not found', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);
    await expect(updateConversationTitle('1', 's1', 'New Title')).rejects.toThrow("Conversation not found or unauthorized");
  });

  it('updateConversationTitle succeeds if found', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({ id: '1' } as any);
    await updateConversationTitle('1', 's1', 'New Title');
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { title: 'New Title' }
    });
  });
});
