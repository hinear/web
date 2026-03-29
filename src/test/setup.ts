import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { server } from "@/mocks/server";

vi.mock("server-only", () => ({}));

const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  addEventListener: vi.fn(),
  addListener: vi.fn(),
  dispatchEvent: vi.fn(),
  matches: false,
  media: query,
  onchange: null,
  removeEventListener: vi.fn(),
  removeListener: vi.fn(),
}));

const serviceWorkerReady = Promise.resolve({
  pushManager: {
    subscribe: vi.fn(),
  },
} satisfies Partial<ServiceWorkerRegistration>);

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: matchMediaMock,
});

Object.defineProperty(window, "Notification", {
  configurable: true,
  value: {
    permission: "default" satisfies NotificationPermission,
    requestPermission: vi
      .fn<() => Promise<NotificationPermission>>()
      .mockResolvedValue("granted"),
  },
});

Object.defineProperty(window.navigator, "serviceWorker", {
  configurable: true,
  value: {
    ready: serviceWorkerReady,
  },
});

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: {
      permission: "default" satisfies NotificationPermission,
      requestPermission: vi
        .fn<() => Promise<NotificationPermission>>()
        .mockResolvedValue("granted"),
    },
  });
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: serviceWorkerReady,
    },
  });
});

// Clean up after the tests are finished
afterAll(() => server.close());
