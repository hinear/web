export default function ProjectSettingsLoading() {
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
            <div className="h-11 w-80 animate-pulse rounded-[16px] bg-[#E5E7EB]" />
            <div className="h-6 w-full max-w-[620px] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
            <div className="h-6 w-[78%] max-w-[540px] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
          </div>
        </div>
      </section>

      <div className="min-h-[540px] animate-pulse rounded-[28px] border border-[var(--app-color-border-muted)] bg-[#FAFBFD] p-8 shadow-[0_20px_48px_rgba(15,23,42,0.06)]" />
    </main>
  );
}
