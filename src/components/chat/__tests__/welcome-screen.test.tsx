import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeScreen } from '../welcome-screen';
import { describe, it, expect, vi } from 'vitest';

describe('WelcomeScreen', () => {
  it('renders the welcome message and prompt suggestions', () => {
    const onPromptSelect = vi.fn();
    render(<WelcomeScreen onPromptSelect={onPromptSelect} />);

    expect(screen.getByText(/How can/)).toBeDefined();
    expect(screen.getByText('Write a business report')).toBeDefined();
    expect(screen.getByText('Debug code')).toBeDefined();
  });

  it('calls onPromptSelect when a prompt is clicked', () => {
    const onPromptSelect = vi.fn();
    render(<WelcomeScreen onPromptSelect={onPromptSelect} />);

    const promptSpan = screen.getByText('Write a business report');
    fireEvent.click(promptSpan);

    expect(onPromptSelect).toHaveBeenCalledWith(expect.stringContaining('Write a comprehensive business report'));
  });
});
