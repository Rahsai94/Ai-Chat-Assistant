import { render, screen } from '@testing-library/react';
import Home from '../page';
import { expect, test } from 'vitest';

test('renders the homepage with correct heading', () => {
  render(<Home />);
  const heading = screen.getByRole('heading', { name: /Welcome to Vortex/i });
  expect(heading).toBeDefined();
});
