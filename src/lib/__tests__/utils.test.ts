import { describe, it, expect } from 'vitest';
import { generateTitle } from '../utils';

describe('Utils', () => {
  describe('generateTitle', () => {
    it('should generate a title from the first line', () => {
      expect(generateTitle('Hello world\nThis is a test')).toBe('Hello world');
    });

    it('should truncate titles longer than 50 characters', () => {
      const longTitle = 'a'.repeat(60);
      expect(generateTitle(longTitle)).toBe('a'.repeat(50));
    });

    it('should fallback to "New Conversation" if content is empty or only whitespace', () => {
      expect(generateTitle('')).toBe('New Conversation');
      expect(generateTitle('   ')).toBe('New Conversation');
      expect(generateTitle('\n\n')).toBe('New Conversation');
    });
  });
});
