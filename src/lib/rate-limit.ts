import { prisma } from "./db/prisma";

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    // Attempt to upsert the rate limit record
    const rateLimit = await prisma.rateLimit.upsert({
      where: { key },
      update: {
        points: {
          increment: 1,
        },
      },
      create: {
        key,
        points: 1,
        resetAt,
      },
    });

    // Check if the window has expired and reset if needed
    if (rateLimit.resetAt < now) {
      await prisma.rateLimit.update({
        where: { key },
        data: {
          points: 1,
          resetAt,
        },
      });
      return { success: true, remaining: limit - 1 };
    }

    // Check if within limit
    if (rateLimit.points > limit) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: limit - rateLimit.points };
  } catch (error) {
    // In case of a DB failure, we might want to default to allowing the request
    // or block it. Usually, defaulting to success is better for reliability if
    // the rate limiting DB is down, to avoid taking down the whole app.
    console.error("Rate limit check failed", error);
    return { success: true, remaining: limit - 1 };
  }
}
