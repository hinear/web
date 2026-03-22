"use client";

import * as React from "react";

import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { CreateIssueTabletModal } from "@/components/organisms/CreateIssueTabletModal";

interface ProjectIssueCreatePanelProps {
  action: React.ComponentProps<"form">["action"];
  projectKey: string;
}

export function ProjectIssueCreatePanel({
  action,
  projectKey,
}: ProjectIssueCreatePanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Chip className="w-fit" variant="accent">
            New issue
          </Chip>
          <div className="space-y-2">
            <h2 className="text-[22px] leading-[1.1] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
              Launch the full issue composer
            </h2>
            <p className="text-[14px] leading-6 font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
              Open the richer create flow for {projectKey} without leaving the
              board.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--app-color-brand-100)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F8FF_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h3 className="text-[18px] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
                Capture the full triage context in one pass
              </h3>
              <p className="text-[13px] leading-6 font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
                Capture title, status, priority, assignee, labels, and a
                markdown-ready description in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip variant="outline">Title + Description</Chip>
              <Chip variant="outline">Status + Priority</Chip>
              <Chip variant="outline">Labels + Assignee</Chip>
            </div>

            <div className="flex flex-col gap-3 rounded-[18px] border border-[var(--app-color-border-muted)] bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--app-color-gray-500)]">
                  Board flow
                </p>
                <p className="text-[14px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                  Create the issue and return directly to the workspace context.
                </p>
              </div>
              <Button onClick={() => setIsOpen(true)} type="button">
                Create issue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(15,23,42,0.36)] px-4 py-10">
          <CreateIssueTabletModal
            action={action}
            className="max-h-[calc(100vh-80px)] overflow-y-auto"
            onCancel={() => setIsOpen(false)}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </>
  );
}
