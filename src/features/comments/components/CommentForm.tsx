import { type FormEvent, useState } from "react";
import { Button } from "@/components/atoms/Button";

interface CommentFormProps {
  onSubmit: (body: string) => void | Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = "댓글을 입력하세요...",
  initialValue = "",
  submitLabel = "댓글 작성",
  isSubmitting = false,
  maxLength = 10000,
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (body.trim().length === 0) return;

    await onSubmit(body.trim());
    setBody("");
  };

  const characterCount = body.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isAtLimit = characterCount >= maxLength;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        autoFocus={autoFocus}
        className="min-h-[100px] w-full resize-y rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 py-3 text-[14px] leading-[1.5] text-[var(--app-color-ink-900)] placeholder:text-[var(--app-color-gray-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2"
        disabled={isSubmitting}
        maxLength={maxLength}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        value={body}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span
            className={
              isAtLimit ? "text-red-500" : isNearLimit ? "text-yellow-600" : ""
            }
          >
            {characterCount}
          </span>
          <span className="text-gray-400"> / {maxLength.toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={body.trim().length === 0 || isSubmitting}
          >
            {isSubmitting ? "작성 중..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

function Textarea(props: TextareaProps) {
  return <textarea {...props} />;
}
