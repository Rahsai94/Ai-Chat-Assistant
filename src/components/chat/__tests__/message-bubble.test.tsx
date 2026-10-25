import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../message-bubble';
import { describe, it, expect, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('MessageBubble', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders user message', () => {
    const message = { id: '1', role: 'user' as const, content: 'Hello AI' };
    render(<MessageBubble message={message} />);

    expect(screen.getByText('Hello AI')).toBeDefined();
    expect(screen.getByText('You')).toBeDefined();
  });

  it('renders assistant message with markdown', () => {
    const message = { id: '2', role: 'assistant' as const, content: '**Bold Text**' };
    render(<MessageBubble message={message} />);

    expect(screen.getByText('AI Assistant')).toBeDefined();
    const boldText = screen.getByText('Bold Text');
    expect(boldText.tagName).toBe('STRONG');
  });

  it('renders code block and supports copy action', async () => {
    const message = {
      id: '3',
      role: 'assistant' as const,
      content: '```js\nconsole.log("test");\n```'
    };
    render(<MessageBubble message={message} />);

    const codeElement = await screen.findByText(/console/);
    expect(codeElement).toBeDefined();

    const copyButtons = screen.getAllByRole('button', { name: /copy code/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    const user = userEvent.setup();
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await user.click(copyButtons[0]);

    expect(clipboardSpy).toHaveBeenCalledWith('console.log("test");');
  });
});
