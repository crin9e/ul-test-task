import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers, resetMockStore } from "../shared/mocks";

const server = setupServer(...handlers);

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: vi.fn(),
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMockStore();
});
afterAll(() => server.close());
