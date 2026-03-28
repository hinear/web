import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  getServerProjectsRepository: vi.fn(),
  listUserProjectsPage: vi.fn(),
  requireApiActorId: vi.fn(),
}));

vi.mock("@/app/api/_lib/auth", () => ({
  requireApiActorId: mocks.requireApiActorId,
}));

vi.mock("@/features/projects/repositories/server-projects-repository", () => ({
  getServerProjectsRepository: mocks.getServerProjectsRepository,
}));

import { GET, POST } from "@/app/api/v1/projects/route";
import { readJson } from "@/test/api-route-helpers";

describe("GET /api/v1/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiActorId.mockResolvedValue("user-1");
    mocks.getServerProjectsRepository.mockResolvedValue({
      createProject: mocks.createProject,
      listUserProjectsPage: mocks.listUserProjectsPage,
    });
    mocks.listUserProjectsPage.mockResolvedValue({
      projects: [
        {
          createdAt: "2026-03-27T10:00:00Z",
          id: "project-1",
          key: "AAA",
          name: "Alpha",
          type: "team",
          updatedAt: "2026-03-27T10:00:00Z",
        },
      ],
      totalCount: 1,
    });
  });

  it("returns paginated projects", async () => {
    const response = await GET(
      new Request("https://hinear.test/api/v1/projects?page=1&limit=20")
    );

    expect(response.status).toBe(200);
    await expect(readJson<any>(response)).resolves.toMatchObject({
      success: true,
      data: {
        items: [
          {
            id: "project-1",
            key: "AAA",
            name: "Alpha",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
        },
      },
    });
    expect(mocks.listUserProjectsPage).toHaveBeenCalledWith({
      ascending: false,
      limit: 20,
      offset: 0,
      sortBy: "created_at",
      userId: "user-1",
    });
  });

  it("returns validation error for invalid page", async () => {
    const response = await GET(
      new Request("https://hinear.test/api/v1/projects?page=0")
    );

    expect(response.status).toBe(400);
    await expect(readJson<any>(response)).resolves.toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });
});

describe("POST /api/v1/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiActorId.mockResolvedValue("user-1");
    mocks.getServerProjectsRepository.mockResolvedValue({
      createProject: mocks.createProject,
    });
  });

  it("creates a project and returns location", async () => {
    mocks.createProject.mockResolvedValue({
      createdAt: "2026-03-27T10:00:00Z",
      id: "project-1",
      key: "AAA",
      name: "Alpha",
      type: "team",
      updatedAt: "2026-03-27T10:00:00Z",
    });

    const response = await POST(
      new Request("https://hinear.test/api/v1/projects", {
        body: JSON.stringify({
          key: "AAA",
          name: "Alpha",
          type: "team",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Location")).toBe("/api/v1/projects/project-1");
    expect(mocks.createProject).toHaveBeenCalledWith({
      createdBy: "user-1",
      key: "AAA",
      name: "Alpha",
      type: "team",
    });
  });
});
