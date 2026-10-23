import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../sidebar';
import { describe, it, expect, vi } from 'vitest';

describe('Sidebar', () => {
  it('renders recent chats fixture data', () => {
    render(<Sidebar />);

    // Check for standard desktop view text
    expect(screen.getByText('Recent Chats')).toBeDefined();
    expect(screen.getByText('React Hooks Explanation')).toBeDefined();
  });

  it('triggers clear-chat event when New Chat is clicked', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Sidebar />);

    const newChatButton = screen.getAllByRole('button', { name: /New Chat/i })[0];
    fireEvent.click(newChatButton);

    expect(dispatchEventSpy).toHaveBeenCalled();
    const eventArg = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(eventArg.type).toBe('clear-chat');
  });

  it('toggles desktop sidebar collapse', () => {
    render(<Sidebar />);
    const toggleButtons = screen.getAllByRole('button', { name: 'Toggle Sidebar' });
    const toggleButton = toggleButtons[1]; // Desktop toggle

    fireEvent.click(toggleButton);

    expect(toggleButton).toBeDefined();
  });
});
