import { Button } from "@/components/atoms/Button";

export interface ConflictDialogProps {
  currentVersion: number;
  requestedVersion: number;
  onDismiss: () => void;
}

export function ConflictDialog({
  currentVersion,
  requestedVersion,
  onDismiss,
}: ConflictDialogProps) {
  return (
    <div className="rounded-[14px] border border-[#FCA5A5] bg-[#FEF2F2] p-5">
      <div className="flex items-start gap-3">
        <div className="text-[#991B1B]">
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-label="Warning icon"
          >
            <title>Warning</title>
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[#991B1B]">
            변경 사항이 있습니다
          </h3>
          <p className="mt-2 text-[13px] font-medium text-[#7C2D12]">
            다른 사용자가 이 이슈를 변경했습니다. 최신 버전이 다시
            로드되었습니다.
          </p>
          <div className="mt-3 rounded-[10px] border border-[#FECACA] bg-white px-3 py-2">
            <div className="flex items-center justify-between text-[12px] font-medium">
              <span className="text-[#7C2D12]">요청한 버전:</span>
              <span className="text-[#991B1B]">v{requestedVersion}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12px] font-medium">
              <span className="text-[#7C2D12]">현재 버전:</span>
              <span className="text-[#166534]">v{currentVersion}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              onClick={onDismiss}
              size="sm"
              variant="secondary"
              className="!border-[#FCA5A5] !bg-white !text-[#991B1B] hover:!bg-[#FEF2F2]"
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
