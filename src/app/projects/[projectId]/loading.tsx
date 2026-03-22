export default function ProjectWorkspaceLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <section className="overflow-hidden rounded-[28px] border border-[var(--app-color-border-muted)] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F8FF_52%,#EEF2FF_100%)] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-8 w-36 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
          </div>
          <div className="space-y-3">
            <div className="h-11 w-72 animate-pulse rounded-[16px] bg-[#E5E7EB]" />
            <div className="h-6 w-full max-w-[620px] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
            <div className="h-6 w-[78%] max-w-[540px] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="min-h-[240px] animate-pulse rounded-[28px] border border-[var(--app-color-border-muted)] bg-[#FBFCFE] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]" />
        <div className="min-h-[240px] animate-pulse rounded-[28px] border border-[var(--app-color-border-muted)] bg-[#FBFCFE] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]" />
      </section>

      <section className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-[var(--app-color-border-muted)] bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D6DAF8] border-t-[var(--app-color-brand-500)]" />
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              Loading workspace
            </p>
            <p className="text-[16px] font-semibold text-[#111318]">
              Preparing project board, member access, and issue tools.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
