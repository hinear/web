"use client";

import * as React from "react";
import { toast } from "sonner";

import { createLabelAction } from "@/features/issues/actions/create-label-action";
import { getLabelsAction } from "@/features/issues/actions/get-labels-action";
import { createLabelKey, getLabelColor } from "@/features/issues/lib/labels";
import type { Label } from "@/features/issues/types";

interface UseMobileIssueCreateOptions {
  defaultLabels?: string;
  projectId?: string;
}

export interface UseMobileIssueCreateReturn {
  availableLabels: Label[];
  selectedLabelIds: string[];
  parsedDefaultLabels: string[];
  selectedLabels: Label[];
  labelsFormValue: string;
  handleLabelToggle: (labelId: string) => void;
  handleCreateLabel: (name: string) => Promise<void>;
}

export function useMobileIssueCreate({
  defaultLabels = "",
  projectId,
}: UseMobileIssueCreateOptions): UseMobileIssueCreateReturn {
  const parsedDefaultLabels = React.useMemo(
    () =>
      defaultLabels
        ? defaultLabels
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean)
        : [],
    [defaultLabels]
  );

  const [availableLabels, setAvailableLabels] = React.useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const fallbackLabels: Label[] = parsedDefaultLabels.map((labelName) => ({
      color: getLabelColor(createLabelKey(labelName)),
      id: `draft:${createLabelKey(labelName)}`,
      name: labelName,
    }));

    if (!projectId) {
      setAvailableLabels(fallbackLabels);
      setSelectedLabelIds(fallbackLabels.map((label) => label.id));
      return () => {
        isMounted = false;
      };
    }

    const currentProjectId = projectId;

    async function loadLabels() {
      const result = await getLabelsAction(currentProjectId);

      if (!isMounted) {
        return;
      }

      const existingLabels = result.success ? result.labels : [];
      const mergedLabels = [
        ...existingLabels,
        ...fallbackLabels.filter(
          (fallbackLabel) =>
            !existingLabels.some(
              (existingLabel) =>
                createLabelKey(existingLabel.name) ===
                createLabelKey(fallbackLabel.name)
            )
        ),
      ];

      setAvailableLabels(mergedLabels);
      setSelectedLabelIds(
        mergedLabels
          .filter((label) =>
            parsedDefaultLabels.some(
              (defaultLabel) =>
                createLabelKey(defaultLabel) === createLabelKey(label.name)
            )
          )
          .map((label) => label.id)
      );
    }

    loadLabels();

    return () => {
      isMounted = false;
    };
  }, [parsedDefaultLabels, projectId]);

  const selectedLabels = availableLabels.filter((label) =>
    selectedLabelIds.includes(label.id)
  );
  const labelsFormValue = selectedLabels.map((label) => label.name).join(", ");

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  };

  const handleCreateLabel = async (name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return;
    }

    if (!projectId) {
      const createdLabel: Label = {
        color: getLabelColor(createLabelKey(normalizedName)),
        id: `draft:${createLabelKey(normalizedName)}`,
        name: normalizedName,
      };

      setAvailableLabels((current) => [...current, createdLabel]);
      setSelectedLabelIds((current) => [...current, createdLabel.id]);
      return;
    }

    const result = await createLabelAction({
      name: normalizedName,
      projectId,
    });

    if (result.success && result.label) {
      toast.success(`Label "${normalizedName}" created`);
      setAvailableLabels((current) => [...current, result.label]);
      setSelectedLabelIds((current) => [...current, result.label.id]);
      return;
    }

    toast.error(result.error || "Failed to create label");
  };

  return {
    availableLabels,
    selectedLabelIds,
    parsedDefaultLabels,
    selectedLabels,
    labelsFormValue,
    handleLabelToggle,
    handleCreateLabel,
  };
}
