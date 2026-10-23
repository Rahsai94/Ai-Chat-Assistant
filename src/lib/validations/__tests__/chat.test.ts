import { describe, it, expect } from 'vitest';
import { messageSchema, chatRequestSchema } from '../chat';

describe('Chat Validations', () => {
  describe('messageSchema', () => {
    it('should validate a correct user message', () => {
      const result = messageSchema.safeParse({ role: 'user', content: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should validate a correct assistant message', () => {
      const result = messageSchema.safeParse({ role: 'assistant', content: 'Hi there' });
      expect(result.success).toBe(true);
    });

    it('should fail if role is invalid', () => {
      const result = messageSchema.safeParse({ role: 'system', content: 'Hello' });
      expect(result.success).toBe(false);
    });

    it('should fail if content is empty', () => {
      const result = messageSchema.safeParse({ role: 'user', content: '' });
      expect(result.success).toBe(false);
    });

    it('should fail if content exceeds limit', () => {
      const result = messageSchema.safeParse({ role: 'user', content: 'a'.repeat(10001) });
      expect(result.success).toBe(false);
    });
  });

  describe('chatRequestSchema', () => {
    it('should validate a correct chat request', () => {
      const result = chatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail if more than 100 messages', () => {
      const result = chatRequestSchema.safeParse({
        messages: Array(101).fill({ role: 'user', content: 'Hello' }),
      });
      expect(result.success).toBe(false);
    });
  });
});
