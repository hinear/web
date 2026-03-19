import type { ProjectType } from "@/features/projects/types";

interface ProjectCreateScreenProps {
  action: (formData: FormData) => void | Promise<void>;
  defaultType?: ProjectType;
}

export function ProjectCreateScreen({
  action,
  defaultType = "personal",
}: ProjectCreateScreenProps) {
  return (
    <main className="app-shell">
      <div className="app-stack">
        <section className="app-panel">
          <p className="app-kicker">Project-first issue tracking</p>
          <h1 className="app-title">Create a project</h1>
          <p className="app-muted">
            Start with a project boundary first, then open the first issue in a
            full-page detail flow.
          </p>
        </section>

        <section className="app-panel">
          <form action={action} className="app-form">
            <div className="app-field">
              <label htmlFor="project-name">Project name</label>
              <input
                id="project-name"
                name="name"
                type="text"
                placeholder="Web Platform"
                required
              />
            </div>

            <div className="app-field">
              <label htmlFor="project-key">Project key</label>
              <input
                id="project-key"
                name="key"
                type="text"
                placeholder="WEB"
                required
              />
            </div>

            <div className="app-field">
              <label htmlFor="project-type">Project type</label>
              <select id="project-type" name="type" defaultValue={defaultType}>
                <option value="personal">Personal</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div className="app-actions">
              <button type="submit" className="app-button">
                Create project
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
