import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";

interface IssueDetailScreenProps {
  issue: Issue;
  comments?: Comment[];
  activityLog?: ActivityLogEntry[];
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function IssueDetailScreen({
  issue,
  comments = [],
  activityLog = [],
}: IssueDetailScreenProps) {
  return (
    <main className="app-shell">
      <div className="app-stack">
        <section className="app-panel">
          <div className="app-badges">
            <span className="app-badge">{issue.identifier}</span>
            <span className="app-badge">{issue.status}</span>
            <span className="app-badge">{issue.priority}</span>
          </div>
          <h1 className="app-title">{issue.title}</h1>
          <p className="app-muted">
            Full-page issue detail stays the primary surface for the first
            desktop implementation.
          </p>
        </section>

        <section className="app-grid app-grid-detail">
          <div className="app-stack">
            <section className="app-panel">
              <h2 className="app-section-title">Description</h2>
              <p className="app-copy">
                {issue.description.trim().length > 0
                  ? issue.description
                  : "No description yet."}
              </p>
            </section>

            <section className="app-panel">
              <h2 className="app-section-title">Comments</h2>
              {comments.length > 0 ? (
                <ul className="app-list">
                  {comments.map((comment) => (
                    <li key={comment.id} className="app-list-item">
                      <strong>{comment.authorId}</strong>
                      <p className="app-copy">{comment.body}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="app-muted">No comments yet.</p>
              )}
            </section>
          </div>

          <aside className="app-stack">
            <section className="app-panel">
              <h2 className="app-section-title">Metadata</h2>
              <dl className="app-meta-list">
                <div>
                  <dt>Status</dt>
                  <dd>{issue.status}</dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd>{issue.priority}</dd>
                </div>
                <div>
                  <dt>Assignee</dt>
                  <dd>{issue.assigneeId ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatTimestamp(issue.createdAt)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatTimestamp(issue.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="app-panel">
              <h2 className="app-section-title">Activity</h2>
              {activityLog.length > 0 ? (
                <ul className="app-list">
                  {activityLog.map((entry) => (
                    <li key={entry.id} className="app-list-item">
                      <strong>{entry.summary}</strong>
                      <span className="app-muted">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="app-muted">No activity yet.</p>
              )}
            </section>

            <section className="app-panel">
              <h2 className="app-section-title">Failure support</h2>
              <p className="app-muted">
                If a save fails, restore the last persisted value and show a
                visible retry path in the full-page route.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
