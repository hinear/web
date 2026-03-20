import { HttpResponse, http } from "msw";
import type {
  ActivityLogEntry,
  ActivityType,
  CreateCommentInput,
  Issue,
  IssuePriority,
} from "@/specs/issue-detail.contract";

// Mock data store
const mockIssues: Issue[] = [
  {
    id: "issue-1",
    identifier: "WEB-1",
    title: "온보딩 성공 메시지용 카피 기준 정리",
    status: "Triage",
    priority: "Low",
    assignee: null,
    labels: [],
    description: "",
    comments: [],
    activityLog: [],
    createdAt: "2025-03-20T10:00:00Z",
    updatedAt: "2025-03-20T10:00:00Z",
  },
  {
    id: "issue-2",
    identifier: "WEB-2",
    title: "칸반 보드 UI 구현",
    status: "In Progress",
    priority: "High",
    assignee: {
      id: "user-1",
      name: "Choi",
      avatarUrl: undefined,
    },
    labels: [
      {
        id: "label-1",
        name: "Feature",
        color: "#3b82f6",
      },
    ],
    description: "Linear 스타일의 칸반 보드를 구현합니다.",
    comments: [],
    activityLog: [],
    createdAt: "2025-03-19T15:30:00Z",
    updatedAt: "2025-03-20T09:15:00Z",
  },
  {
    id: "issue-3",
    identifier: "WEB-3",
    title: "이슈 생성 모달 개발",
    status: "Backlog",
    priority: "Medium",
    assignee: null,
    labels: [
      {
        id: "label-2",
        name: "UI",
        color: "#8b5cf6",
      },
    ],
    description: "",
    comments: [],
    activityLog: [],
    createdAt: "2025-03-18T11:00:00Z",
    updatedAt: "2025-03-18T11:00:00Z",
  },
  {
    id: "issue-4",
    identifier: "WEB-4",
    title: "드래그앤드롭 기능 구현",
    status: "Todo",
    priority: "High",
    assignee: {
      id: "user-1",
      name: "Choi",
      avatarUrl: undefined,
    },
    labels: [
      {
        id: "label-1",
        name: "Feature",
        color: "#3b82f6",
      },
    ],
    description:
      "dnd-kit을 사용하여 이슈 카드를 컬럼 간에 이동할 수 있게 합니다.",
    comments: [],
    activityLog: [],
    createdAt: "2025-03-17T14:20:00Z",
    updatedAt: "2025-03-19T16:45:00Z",
  },
  {
    id: "issue-5",
    identifier: "WEB-5",
    title: "PWA 설정 완료",
    status: "Done",
    priority: "Medium",
    assignee: null,
    labels: [],
    description: "",
    comments: [],
    activityLog: [],
    createdAt: "2025-03-15T09:00:00Z",
    updatedAt: "2025-03-16T10:30:00Z",
  },
];

let nextIssueNumber = 6;

// Helper function to find issue by id
function findIssueById(id: string): Issue | undefined {
  return mockIssues.find((issue) => issue.id === id);
}

// Helper function to generate new issue identifier
function generateIdentifier(): string {
  return `WEB-${nextIssueNumber++}`;
}

// Helper function to create activity log entry
function createActivityLogEntry(
  type: ActivityType,
  actor: { id: string; name: string; avatarUrl?: string },
  summary: string
): ActivityLogEntry {
  return {
    id: `activity-${Date.now()}`,
    type,
    actor,
    createdAt: new Date().toISOString(),
    summary,
  };
}

export const handlers = [
  // GET /api/issues - Get all issues for a project
  http.get("/api/projects/:projectId/issues", ({ params }) => {
    const { projectId } = params;

    // Filter issues by project (for now, just return all)
    const issues = mockIssues.filter((issue) =>
      issue.identifier.startsWith((projectId as string).toUpperCase())
    );

    return HttpResponse.json({
      issues,
      total: issues.length,
    });
  }),

  // GET /api/issues/:id - Get single issue
  http.get("/api/issues/:issueId", ({ params }) => {
    const { issueId } = params;
    const issue = findIssueById(issueId as string);

    if (!issue) {
      return HttpResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return HttpResponse.json({ issue });
  }),

  // POST /api/issues - Create new issue
  http.post("/api/projects/:projectId/issues", async ({ request }) => {
    const body = await request.json();
    const { title, description, priority } = body as {
      title: string;
      description?: string;
      priority?: IssuePriority;
    };

    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      identifier: generateIdentifier(),
      title,
      status: "Triage",
      priority: priority || "No Priority",
      assignee: null,
      labels: [],
      description: description || "",
      comments: [],
      activityLog: [
        createActivityLogEntry(
          "issue.created",
          { id: "user-1", name: "Choi" },
          `이슈를 생성했습니다: ${title}`
        ),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockIssues.push(newIssue);

    return HttpResponse.json({ issue: newIssue }, { status: 201 });
  }),

  // PUT /api/issues/:id - Update issue
  http.put("/api/issues/:issueId", async ({ request, params }) => {
    const { issueId } = params;
    const issue = findIssueById(issueId as string);

    if (!issue) {
      return HttpResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates = body as Partial<
      Pick<Issue, "title" | "status" | "priority" | "description">
    >;

    // Track changes for activity log
    const actor = { id: "user-1", name: "Choi" };

    if (updates.title && updates.title !== issue.title) {
      issue.activityLog.unshift(
        createActivityLogEntry(
          "issue.title.updated",
          actor,
          `제목을 "${issue.title}"에서 "${updates.title}"(으)로 변경했습니다`
        )
      );
      issue.title = updates.title;
    }

    if (updates.status && updates.status !== issue.status) {
      issue.activityLog.unshift(
        createActivityLogEntry(
          "issue.status.updated",
          actor,
          `상태를 "${issue.status}"에서 "${updates.status}"(으)로 변경했습니다`
        )
      );
      issue.status = updates.status as Issue["status"];
    }

    if (updates.priority && updates.priority !== issue.priority) {
      issue.activityLog.unshift(
        createActivityLogEntry(
          "issue.priority.updated",
          actor,
          `우선순위를 "${issue.priority}"에서 "${updates.priority}"(으)로 변경했습니다`
        )
      );
      issue.priority = updates.priority as Issue["priority"];
    }

    if (
      updates.description !== undefined &&
      updates.description !== issue.description
    ) {
      issue.activityLog.unshift(
        createActivityLogEntry(
          "issue.description.updated",
          actor,
          "설명을 업데이트했습니다"
        )
      );
      issue.description = updates.description;
    }

    issue.updatedAt = new Date().toISOString();

    return HttpResponse.json({ issue });
  }),

  // POST /api/issues/:id/comments - Create comment
  http.post("/api/issues/:issueId/comments", async ({ request, params }) => {
    const { issueId } = params;
    const issue = findIssueById(issueId as string);

    if (!issue) {
      return HttpResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const body = await request.json();
    const { body: commentBody } = body as CreateCommentInput;

    if (!commentBody || commentBody.trim().length === 0) {
      return HttpResponse.json(
        { error: "Comment body cannot be empty" },
        { status: 400 }
      );
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      body: commentBody,
      author: { id: "user-1", name: "Choi" },
      createdAt: new Date().toISOString(),
    };

    issue.comments.push(newComment);
    issue.activityLog.unshift(
      createActivityLogEntry(
        "issue.comment.created",
        { id: "user-1", name: "Choi" },
        "코멘트를 작성했습니다"
      )
    );
    issue.updatedAt = new Date().toISOString();

    return HttpResponse.json({ comment: newComment }, { status: 201 });
  }),

  // PATCH /internal/issues/:issueId/detail - Update issue details (with optimistic locking)
  http.patch(
    "/internal/issues/:issueId/detail",
    async ({ request, params }) => {
      const { issueId } = params;
      const issue = findIssueById(issueId as string);

      if (!issue) {
        return HttpResponse.json({ error: "Issue not found" }, { status: 404 });
      }

      const body = await request.json();
      const { version, title, description, status, priority, assigneeId } =
        body as {
          version?: number;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          assigneeId?: string | null;
        };

      // Simulate optimistic locking conflict if version doesn't match
      // For testing purposes, we'll treat version 1 as current, version 2 as conflicting
      if (version && version === 1) {
        // Simulate successful update
        const actor = { id: "user-1", name: "Choi" };

        if (title && title !== issue.title) {
          issue.activityLog.unshift(
            createActivityLogEntry(
              "issue.title.updated",
              actor,
              `제목을 "${issue.title}"에서 "${title}"(으)로 변경했습니다`
            )
          );
          issue.title = title;
        }

        if (description !== undefined && description !== issue.description) {
          issue.activityLog.unshift(
            createActivityLogEntry(
              "issue.description.updated",
              actor,
              "설명을 업데이트했습니다"
            )
          );
          issue.description = description;
        }

        if (status && status !== issue.status) {
          issue.activityLog.unshift(
            createActivityLogEntry(
              "issue.status.updated",
              actor,
              `상태를 "${issue.status}"에서 "${status}"(으)로 변경했습니다`
            )
          );
          issue.status = status as Issue["status"];
        }

        if (priority && priority !== issue.priority) {
          issue.activityLog.unshift(
            createActivityLogEntry(
              "issue.priority.updated",
              actor,
              `우선순위를 "${issue.priority}"에서 "${priority}"(으)로 변경했습니다`
            )
          );
          issue.priority = priority as Issue["priority"];
        }

        if (assigneeId !== undefined && assigneeId !== issue.assignee?.id) {
          issue.activityLog.unshift(
            createActivityLogEntry(
              "issue.assignee.updated",
              actor,
              assigneeId ? "담당자를 배정했습니다" : "담당자를 해제했습니다"
            )
          );
          if (assigneeId) {
            issue.assignee = {
              id: assigneeId,
              name: "User",
              avatarUrl: undefined,
            };
          } else {
            issue.assignee = null;
          }
        }

        issue.updatedAt = new Date().toISOString();

        return HttpResponse.json({
          issue: { ...issue, version: 2 },
          activityLog: issue.activityLog,
        });
      }

      // Simulate conflict if version is not 1
      if (version && version !== 1) {
        return HttpResponse.json(
          {
            type: "CONFLICT",
            currentIssue: { ...issue, version: 2 },
            currentVersion: 2,
            requestedVersion: version,
            message: "This issue has changed since you loaded it.",
          },
          { status: 409 }
        );
      }

      // Default successful update without version check
      const actor = { id: "user-1", name: "Choi" };

      if (title && title !== issue.title) {
        issue.activityLog.unshift(
          createActivityLogEntry(
            "issue.title.updated",
            actor,
            `제목을 "${issue.title}"에서 "${title}"(으)로 변경했습니다`
          )
        );
        issue.title = title;
      }

      if (description !== undefined && description !== issue.description) {
        issue.activityLog.unshift(
          createActivityLogEntry(
            "issue.description.updated",
            actor,
            "설명을 업데이트했습니다"
          )
        );
        issue.description = description;
      }

      if (status && status !== issue.status) {
        issue.activityLog.unshift(
          createActivityLogEntry(
            "issue.status.updated",
            actor,
            `상태를 "${issue.status}"에서 "${status}"(으)로 변경했습니다`
          )
        );
        issue.status = status as Issue["status"];
      }

      if (priority && priority !== issue.priority) {
        issue.activityLog.unshift(
          createActivityLogEntry(
            "issue.priority.updated",
            actor,
            `우선순위를 "${issue.priority}"에서 "${priority}"(으)로 변경했습니다`
          )
        );
        issue.priority = priority as Issue["priority"];
      }

      if (assigneeId !== undefined && assigneeId !== issue.assignee?.id) {
        issue.activityLog.unshift(
          createActivityLogEntry(
            "issue.assignee.updated",
            actor,
            assigneeId ? "담당자를 배정했습니다" : "담당자를 해제했습니다"
          )
        );
        if (assigneeId) {
          issue.assignee = {
            id: assigneeId,
            name: "User",
            avatarUrl: undefined,
          };
        } else {
          issue.assignee = null;
        }
      }

      issue.updatedAt = new Date().toISOString();

      return HttpResponse.json({
        issue: { ...issue, version: 2 },
        activityLog: issue.activityLog,
      });
    }
  ),

  // POST /internal/issues/:issueId/comments - Create comment
  http.post(
    "/internal/issues/:issueId/comments",
    async ({ request, params }) => {
      const { issueId } = params;
      const issue = findIssueById(issueId as string);

      if (!issue) {
        return HttpResponse.json({ error: "Issue not found" }, { status: 404 });
      }

      const body = await request.json();
      const { body: commentBody } = body as { body?: string };

      if (!commentBody || commentBody.trim().length === 0) {
        return HttpResponse.json(
          { error: "Comment body cannot be empty" },
          { status: 400 }
        );
      }

      const newComment = {
        id: `comment-${Date.now()}`,
        body: commentBody,
        author: { id: "user-1", name: "Choi" },
        createdAt: new Date().toISOString(),
      };

      issue.comments.push(newComment);

      const activityEntry = createActivityLogEntry(
        "issue.comment.created",
        { id: "user-1", name: "Choi" },
        "코멘트를 작성했습니다"
      );
      issue.activityLog.unshift(activityEntry);
      issue.updatedAt = new Date().toISOString();

      return HttpResponse.json(
        {
          comment: newComment,
          activityEntry,
        },
        { status: 201 }
      );
    }
  ),
];
