import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createQueryClientMock, reactQueryDevtoolsMock } = vi.hoisted(() => ({
  createQueryClientMock: vi.fn(),
  reactQueryDevtoolsMock: vi.fn(() => <div data-testid="rq-devtools" />),
}));

vi.mock("@/lib/react-query/query-client", () => ({
  createQueryClient: createQueryClientMock,
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: reactQueryDevtoolsMock,
}));

import { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@/lib/react-query/query-provider";

describe("QueryClientProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createQueryClientMock.mockReturnValue(new QueryClient());
  });

  it("renders children and devtools in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(
      <QueryClientProvider>
        <div>child content</div>
      </QueryClientProvider>
    );

    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.getByTestId("rq-devtools")).toBeInTheDocument();
  });

  it("does not render devtools outside development", () => {
    vi.stubEnv("NODE_ENV", "test");

    render(
      <QueryClientProvider>
        <div>child content</div>
      </QueryClientProvider>
    );

    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.queryByTestId("rq-devtools")).not.toBeInTheDocument();
  });
});
