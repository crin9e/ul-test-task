import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { router } from '../app/router';

describe('AuctionsPage', () => {
  it('renders the page title', async () => {
    window.history.pushState({}, '', '/auctions');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: /грузовые аукционы/i })).toBeInTheDocument();
  });
});
