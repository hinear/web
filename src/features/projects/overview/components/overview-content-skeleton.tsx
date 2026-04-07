export function OverviewContentSkeleton() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="rounded-[14px] border border-[#E6E8EC] bg-white px-[14px] py-[14px]"
            key={`mobile-stat-${String(i)}`}
          >
            <div className="h-[12px] w-16 animate-pulse rounded bg-[#E6E8EC]" />
            <div className="mt-[6px] h-[28px] w-8 animate-pulse rounded bg-[#E6E8EC]" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-[10px] md:hidden">
        <div className="h-[14px] w-24 animate-pulse rounded bg-[#E6E8EC]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="rounded-[14px] border border-[#E6E8EC] bg-white px-[14px] py-[14px]"
            key={`mobile-activity-${String(i)}`}
          >
            <div className="h-[13px] w-full animate-pulse rounded bg-[#E6E8EC]" />
            <div className="mt-2 h-[11px] w-20 animate-pulse rounded bg-[#E6E8EC]" />
          </div>
        ))}
      </div>

      {/* Desktop skeleton */}
      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="border border-[#E8E8E8] bg-white px-7 py-7"
            key={`desktop-stat-${String(i)}`}
          >
            <div className="h-[12px] w-20 animate-pulse rounded bg-[#E6E8EC]" />
            <div className="mt-2 h-[40px] w-12 animate-pulse rounded bg-[#E6E8EC]" />
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-[14px] md:flex">
        <div className="h-[18px] w-32 animate-pulse rounded bg-[#E6E8EC]" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              className="flex items-start gap-3 border border-[#E8E8E8] bg-white px-4 py-[14px]"
              key={`desktop-activity-${String(i)}`}
            >
              <div className="mt-[2px] h-[18px] w-[18px] animate-pulse rounded bg-[#E6E8EC]" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-[13px] w-full animate-pulse rounded bg-[#E6E8EC]" />
                <div className="h-[11px] w-24 animate-pulse rounded bg-[#E6E8EC]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
