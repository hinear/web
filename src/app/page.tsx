import Link from "next/link";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Project-first issue tracking</p>
          <h1>Hinear initial setup is ready.</h1>
          <p className={styles.lead}>
            Next.js App Router, TDD-ready test tooling, PWA metadata, and the
            project-based issue model are now in place.
          </p>
          <p className={styles.lead}>
            <Link href="/projects/new">Create the first project</Link>
          </p>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>Core direction</h2>
            <ul>
              <li>Projects are the top-level boundary.</li>
              <li>Roles stay simple: owner and member.</li>
              <li>Issue identifiers follow PROJECTKEY-n.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h2>Current stack</h2>
            <ul>
              <li>Next.js 16 with App Router</li>
              <li>Supabase for auth and data</li>
              <li>Firebase Cloud Messaging for web push</li>
              <li>Vitest and Testing Library for TDD</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h2>Next steps</h2>
            <ul>
              <li>Set up project and issue tables.</li>
              <li>Build the issue detail shell.</li>
              <li>Add activity logs with before/after tracking.</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
