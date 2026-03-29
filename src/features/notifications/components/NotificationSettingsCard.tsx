"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/atoms/Skeleton";
import type { NotificationPreferences } from "@/features/notifications/repositories/supabase-notification-preferences-repository";
import { NotificationPermissionButton } from "./NotificationPermissionButton";

const NOTIFICATION_LOADING_IDS = [
  "issue-assigned",
  "status-changed",
  "comment-added",
  "project-invited",
] as const;

interface NotificationToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function NotificationToggle({
  label,
  description,
  enabled,
  onChange,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--app-color-ink-900)]">
          {label}
        </span>
        <span className="text-xs text-[var(--app-color-gray-600)]">
          {description}
        </span>
      </div>
      <button
        aria-label={label}
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--app-color-brand-300)] focus:ring-offset-2 ${
          enabled
            ? "bg-[var(--app-color-brand-500)]"
            : "bg-[var(--app-color-gray-200)]"
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsCard() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load preferences");
      }

      setPreferences(data.preferences);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!preferences) return;

      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      setSaving(true);

      try {
        const response = await fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [key]: value }),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Failed to update preference");
        }

        setPreferences((currentPreferences) => {
          if (!currentPreferences) {
            return data.preferences;
          }

          return {
            ...currentPreferences,
            ...data.preferences,
            [key]: value,
          };
        });
      } catch (error) {
        console.error("Failed to update preference:", error);
        // 실패 시 롤백
        setPreferences(preferences);
      } finally {
        setSaving(false);
      }
    },
    [preferences]
  );

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 rounded-[16px] border border-[#E6E8EC] p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-64 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[52px] w-full rounded-[12px]" />
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-50)] p-4">
            {NOTIFICATION_LOADING_IDS.map((notificationId) => (
              <div
                key={notificationId}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-3 w-40 rounded-full" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E6E8EC] p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[16px] font-semibold text-[#111318]">
          Notification Settings
        </h2>
        <p className="text-[13px] text-[#6B7280]">
          Stay updated in real time with issue changes, comments, and project
          invitations.
          {saving && " Saving..."}
        </p>
        <p className="text-[12px] text-[var(--app-color-gray-500)]">
          Permission prompts only appear after you tap the notification control.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <NotificationPermissionButton />

        <div className="flex flex-col gap-3 rounded-lg border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-50)] p-4">
          {preferences && (
            <>
              <NotificationToggle
                label="Issue Assignment Notifications"
                description="When another user assigns an issue to you"
                enabled={preferences.issue_assigned}
                onChange={(enabled) =>
                  updatePreference("issue_assigned", enabled)
                }
              />
              <NotificationToggle
                label="Status Change Notifications"
                description="When an issue status changes"
                enabled={preferences.issue_status_changed}
                onChange={(enabled) =>
                  updatePreference("issue_status_changed", enabled)
                }
              />
              <NotificationToggle
                label="Comment Notifications"
                description="When a new comment is added"
                enabled={preferences.comment_added}
                onChange={(enabled) =>
                  updatePreference("comment_added", enabled)
                }
              />
              <NotificationToggle
                label="Project Invitation Notifications"
                description="When you are invited to a new project"
                enabled={preferences.project_invited}
                onChange={(enabled) =>
                  updatePreference("project_invited", enabled)
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
