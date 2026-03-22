export default function InviteLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] items-center px-4 py-10">
      <section className="flex w-full flex-col gap-5 rounded-[28px] border border-[#E6E8EC] bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="h-4 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="h-10 w-64 animate-pulse rounded-[16px] bg-[#E5E7EB]" />
        <div className="h-5 w-full animate-pulse rounded-[12px] bg-[#E5E7EB]" />
        <div className="h-5 w-[84%] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
        <div className="rounded-[18px] border border-[#E6E8EC] bg-[#FCFCFD] p-[18px]">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <div className="h-4 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-4 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-4 w-44 animate-pulse rounded-full bg-[#E5E7EB]" />
          </div>
        </div>
      </section>
    </main>
  );
}
