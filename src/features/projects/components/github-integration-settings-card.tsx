"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button";
import { GitHubAuthButton } from "@/features/auth/components/github-auth-button";
import type { GitHubIntegrationSettings } from "@/features/projects/contracts";

interface GitHubIntegrationSettingsCardProps {
  projectId: string;
  initialSettings?: GitHubIntegrationSettings;
}

interface Repository {
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
}

interface ConnectRepositoryErrorResponse {
  error?: string;
  installUrl?: string | null;
  success?: boolean;
}

export function GitHubIntegrationSettingsCard({
  projectId,
  initialSettings,
}: GitHubIntegrationSettingsCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<GitHubIntegrationSettings>(
    initialSettings ?? { enabled: false }
  );
  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [readOnlyMessage, setReadOnlyMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/github`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 403) {
          setReadOnlyMessage(
            data.error ?? "Only project owners can manage GitHub integration."
          );
          return;
        }
        throw new Error(data.error ?? "Failed to load GitHub settings");
      }

      setReadOnlyMessage(null);
      setSettings(data.settings);
    } catch (error) {
      console.error("Failed to load GitHub settings:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load GitHub settings"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadRepositories = useCallback(async () => {
    try {
      const response = await fetch("/api/github/repositories");
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setShowRepoSelector(false);
          throw new Error(
            "GitHub session is missing or expired. Click 'Connect with GitHub' and try again."
          );
        }
        throw new Error(data.error ?? "Failed to load repositories");
      }

      setRepositories(data.repositories);
    } catch (error) {
      console.error("Failed to load repositories:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load repositories"
      );
    }
  }, []);

  const connectRepository = useCallback(async () => {
    if (!selectedRepo) return;

    setSaving(true);
    try {
      const [owner, name] = selectedRepo.split("/");

      const response = await fetch(`/api/projects/${projectId}/github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoOwner: owner, repoName: name }),
      });

      const data = (await response.json()) as ConnectRepositoryErrorResponse &
        Record<string, unknown>;

      if (!response.ok || !data.success) {
        if (response.status === 409 && data.installUrl) {
          toast.info("Redirecting to GitHub App installation...");
          window.location.href = data.installUrl;
          return;
        }

        throw new Error(data.error ?? "Failed to connect repository");
      }

      setSettings({
        enabled: true,
        repoOwner: owner,
        repoName: name,
        connected: true,
      });
      setShowRepoSelector(false);
      toast.success("Repository connected successfully!");
    } catch (error) {
      console.error("Failed to connect repository:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to connect repository"
      );
    } finally {
      setSaving(false);
    }
  }, [projectId, selectedRepo]);

  const disconnectRepository = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/github`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to disconnect repository");
      }

      setSettings({ enabled: false });
      toast.success("Repository disconnected successfully!");
    } catch (error) {
      console.error("Failed to disconnect repository:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to disconnect repository"
      );
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  useEffect(() => {
    const githubState = searchParams.get("github");

    if (githubState === "oauth-error") {
      toast.error(
        "GitHub OAuth completed, but no provider token was issued. Check Supabase GitHub provider settings and try again."
      );

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.delete("github");
      const nextUrl = `${pathname}${nextSearchParams.toString() ? `?${nextSearchParams.toString()}` : ""}`;
      router.replace(nextUrl);
      return;
    }

    if (githubState !== "select-repo") {
      return;
    }

    setShowRepoSelector(true);
    loadRepositories();

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("github");
    const nextUrl = `${pathname}${nextSearchParams.toString() ? `?${nextSearchParams.toString()}` : ""}`;
    router.replace(nextUrl);
  }, [loadRepositories, pathname, router, searchParams]);

  useEffect(() => {
    if (!initialSettings) {
      loadSettings();
    }
  }, [initialSettings, loadSettings]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 rounded-[16px] border border-[#E6E8EC] p-5">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-32 animate-pulse rounded-full bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E6E8EC] bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[16px] font-semibold text-[#111318]">
          GitHub Integration
        </h2>
        <p className="text-[13px] text-[#6B7280]">
          Connect a GitHub repository to enable branch creation and pull request
          flow.
        </p>
      </div>

      {settings.connected ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[#E6E8EC] bg-[#FCFCFD] p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#111318]">
                Connected Repository
              </span>
              <span className="text-xs text-[#6B7280]">
                {settings.repoOwner}/{settings.repoName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 items-center justify-center rounded-full bg-green-500">
                <div className="h-2 w-2 animate-ping rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-[#6B7280]">Connected</span>
            </div>
          </div>

          <button
            type="button"
            onClick={disconnectRepository}
            disabled={saving}
            className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-[#991B1B] transition-colors hover:bg-[#FEE2E2] disabled:opacity-50"
          >
            {saving ? "Disconnecting..." : "Disconnect Repository"}
          </button>
        </div>
      ) : readOnlyMessage ? (
        <div className="rounded-lg border border-[#E6E8EC] bg-[#FCFCFD] p-4">
          <p className="text-sm font-medium text-[#111318]">Read-only access</p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            {readOnlyMessage}
          </p>
        </div>
      ) : showRepoSelector ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[#E6E8EC] bg-[#FCFCFD] p-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-[#111318]"
              htmlFor="github-repository-select"
            >
              Select Repository
            </label>
            <select
              id="github-repository-select"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="rounded-lg border border-[#E6E8EC] bg-white px-3 py-2 text-sm text-[#111318] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)]"
            >
              <option value="">Choose a repository...</option>
              {repositories.map((repo) => (
                <option key={repo.fullName} value={repo.fullName}>
                  {repo.fullName}
                  {repo.private && " (Private)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={connectRepository}
              disabled={!selectedRepo || saving}
              size="sm"
              variant="primary"
            >
              {saving ? "Connecting..." : "Connect Repository"}
            </Button>
            <Button
              onClick={() => setShowRepoSelector(false)}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <GitHubAuthButton
            next={`/projects/${projectId}/settings`}
            projectId={projectId}
          />
          <p className="text-xs text-[#6B7280]">
            Click "Connect with GitHub" to authorize and select a repository.
            Issue sync uses the server GitHub token configured for this app.
          </p>
        </div>
      )}
    </div>
  );
}
