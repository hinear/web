import { Button } from "@/components/atoms/Button";

export interface ConflictDialogProps {
  currentVersion: number;
  requestedVersion: number;
  onDismiss: () => void;
}

function VersionRow({
  label,
  tone = "muted",
  value,
}: {
  label: string;
  tone?: "accent" | "muted";
  value: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-[14px] border px-4 py-3",
        tone === "accent"
          ? "border-[var(--app-color-brand-200)] bg-[var(--app-color-brand-50)]"
          : "border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-0)]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] tracking-[0.08em] text-[var(--app-color-gray-400)] uppercase">
          {label}
        </span>
        <span className="text-[13px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
          {tone === "accent"
            ? "다른 사용자의 최신 변경이 반영된 상태입니다."
            : "저장 요청 당시 기준으로 편집한 버전입니다."}
        </span>
      </div>
      <span
        className={[
          "rounded-full px-3 py-[7px] text-[12px] leading-[12px] font-[var(--app-font-weight-600)]",
          tone === "accent"
            ? "bg-[var(--app-color-white)] text-[var(--app-color-brand-700)]"
            : "bg-[var(--app-color-white)] text-[var(--app-color-gray-500)]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export function ConflictDialog({
  currentVersion,
  requestedVersion,
  onDismiss,
}: ConflictDialogProps) {
  return (
    <section
      aria-live="assertive"
      className="rounded-[20px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      role="alert"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--app-color-orange-50)] text-[var(--app-color-orange-800)]">
            <svg
              aria-label="Conflict detected"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              role="img"
            >
              <title>Conflict detected</title>
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center rounded-full bg-[var(--app-color-orange-50)] px-3 py-[7px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-orange-800)]">
              Version conflict
            </div>
            <h3 className="mt-3 text-[20px] leading-[1.2] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
              최신 변경을 먼저 반영해야 합니다
            </h3>
            <p className="mt-2 max-w-[520px] text-[14px] leading-[1.6] font-normal text-[var(--app-color-gray-600)]">
              다른 사용자가 이 이슈를 먼저 수정했습니다. 에디터는 최신 버전으로
              다시 동기화되었고, 아래 차이를 확인한 뒤 계속 진행하면 됩니다.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-50)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                버전 비교
              </p>
              <p className="mt-1 text-[12px] leading-[1.45] font-normal text-[var(--app-color-gray-500)]">
                오래된 버전 기준 저장 요청은 자동으로 차단됩니다.
              </p>
            </div>
            <div className="rounded-full bg-[var(--app-color-white)] px-3 py-[7px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
              +{currentVersion - requestedVersion} rev
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <VersionRow label="Requested" value={`v${requestedVersion}`} />
            <VersionRow
              label="Current"
              tone="accent"
              value={`v${currentVersion}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--app-color-border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-[1.5] font-normal text-[var(--app-color-gray-500)]">
            최신 내용을 확인한 뒤 다시 수정하거나 저장을 시도하세요.
          </p>
          <div className="flex justify-end">
            <Button
              className="min-w-[96px]"
              onClick={onDismiss}
              size="sm"
              variant="secondary"
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
