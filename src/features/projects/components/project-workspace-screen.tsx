import Link from "next/link";

import type { Project } from "@/features/projects/types";

interface ProjectWorkspaceScreenProps {
  action: (formData: FormData) => void | Promise<void>;
  project: Project;
}

export function ProjectWorkspaceScreen({
  action,
  project,
}: ProjectWorkspaceScreenProps) {
  return (
    <main className="app-shell">
      <div className="app-stack">
        <section className="app-panel">
          <p className="app-kicker">{project.key}</p>
          <h1 className="app-title">{project.name}</h1>
          <p className="app-muted">
            Create a new triage issue for {project.key}.
          </p>
        </section>

        <section className="app-grid app-grid-two">
          <section className="app-panel">
            <h2 className="app-section-title">New issue</h2>
            <form action={action} className="app-form">
              <div className="app-field">
                <label htmlFor="issue-title">Issue title</label>
                <input
                  id="issue-title"
                  name="title"
                  type="text"
                  placeholder="Add issue detail page"
                  required
                />
              </div>

              <div className="app-field">
                <label htmlFor="issue-description">Issue description</label>
                <textarea
                  id="issue-description"
                  name="description"
                  placeholder="Describe the work that needs triage."
                  rows={6}
                />
              </div>

              <div className="app-actions">
                <button type="submit" className="app-button">
                  Create issue
                </button>
              </div>
            </form>
          </section>

          <aside className="app-panel">
            <h2 className="app-section-title">Project summary</h2>
            <dl className="app-meta-list">
              <div>
                <dt>Type</dt>
                <dd>{project.type}</dd>
              </div>
              <div>
                <dt>Next issue number</dt>
                <dd>{project.issueSeq + 1}</dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{project.createdBy}</dd>
              </div>
            </dl>
            <p className="app-muted">
              The first implementation keeps this route focused on issue
              creation and the full-page issue detail flow.
            </p>
            <Link href="/" className="app-link">
              Back to home
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
