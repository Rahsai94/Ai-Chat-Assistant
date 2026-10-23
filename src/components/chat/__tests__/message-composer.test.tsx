import { render, screen, fireEvent } from '@testing-library/react';
import { MessageComposer } from '../message-composer';
import { describe, it, expect, vi } from 'vitest';

describe('MessageComposer', () => {
  it('renders input area and send button', () => {
    render(<MessageComposer input="" handleInputChange={() => {}} handleSubmit={() => {}} isLoading={false} />);

    expect(screen.getByPlaceholderText('Type your message here...')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDefined();
  });

  it('disables send button when input is empty', () => {
    render(<MessageComposer input="" handleInputChange={() => {}} handleSubmit={() => {}} isLoading={false} />);

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect((sendButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows stop button when loading', () => {
    const stopMock = vi.fn();
    render(<MessageComposer input="Test" handleInputChange={() => {}} handleSubmit={() => {}} isLoading={true} stop={stopMock} />);

    const stopButton = screen.getByRole('button', { name: 'Stop generating' });
    expect(stopButton).toBeDefined();

    fireEvent.click(stopButton);
    expect(stopMock).toHaveBeenCalled();
  });

  it('calls handleInputChange on typing', () => {
    const changeMock = vi.fn();
    render(<MessageComposer input="" handleInputChange={changeMock} handleSubmit={() => {}} isLoading={false} />);

    const textarea = screen.getByPlaceholderText('Type your message here...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(changeMock).toHaveBeenCalled();
  });
});
