export function StatCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: number;
}) {
  return (
    <article className="rounded-[14px] border border-[#E6E8EC] bg-white px-[14px] py-[14px]">
      <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#6B7280]">
        {label}
      </p>
      <p
        className={`mt-[6px] text-[28px] leading-none font-[var(--app-font-weight-700)] ${tone}`}
      >
        {value}
      </p>
    </article>
  );
}
