import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../shared/mocks/handlers';
import { resetMockStore } from '../shared/mocks/store';

const server = setupServer(...handlers);

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockStore();
});
afterAll(() => server.close());
