import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '../rate-limit';
import { prisma } from '../db/prisma';

vi.mock('../db/prisma', () => ({
  prisma: {
    rateLimit: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when within limits', async () => {
    vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({ id: 'test-id', createdAt: new Date(), updatedAt: new Date(),
    vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      key: 'test',
      points: 1,
      resetAt: new Date(Date.now() + 10000),
    });

    const result = await checkRateLimit('test', 5, 10000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should deny request when limit exceeded', async () => {
    vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({ id: 'test-id', createdAt: new Date(), updatedAt: new Date(),
    vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      key: 'test',
      points: 6,
      resetAt: new Date(Date.now() + 10000),
    });

    const result = await checkRateLimit('test', 5, 10000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset limit when window expired', async () => {
    vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({ id: 'test-id', createdAt: new Date(), updatedAt: new Date(),
    vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      key: 'test',
      points: 6,
      resetAt: new Date(Date.now() - 10000), // Expired
    });
    vi.mocked(prisma.rateLimit.update).mockResolvedValue({ id: 'test-id', createdAt: new Date(), updatedAt: new Date(),
    vi.mocked(prisma.rateLimit.update).mockResolvedValue({
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      key: 'test',
      points: 1,
      resetAt: new Date(Date.now() + 10000),
    });

    const result = await checkRateLimit('test', 5, 10000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(prisma.rateLimit.update).toHaveBeenCalled();
  });

  it('should fail gracefully and allow request if DB throws an error', async () => {
    vi.mocked(prisma.rateLimit.upsert).mockRejectedValue(new Error('DB Error'));

    const result = await checkRateLimit('test', 5, 10000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
