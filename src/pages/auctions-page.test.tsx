import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuctionsPage } from './auctions-page';

describe('AuctionsPage', () => {
  it('renders the page title', () => {
    render(<AuctionsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /грузовые аукционы/i })).toBeInTheDocument();
  });
});
