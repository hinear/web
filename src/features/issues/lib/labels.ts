import type { Label } from "@/features/issues/types";

const LABEL_COLOR_PALETTE = [
  "#5E6AD2",
  "#0F766E",
  "#DC2626",
  "#7C3AED",
  "#2563EB",
  "#16A34A",
  "#F59E0B",
  "#6B7280",
] as const;

export function normalizeLabelName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function createLabelKey(value: string): string {
  return normalizeLabelName(value).toLowerCase();
}

export function parseLabelInput(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();
  const labels: string[] = [];

  for (const segment of value.split(/[,\n]/)) {
    const name = normalizeLabelName(segment);

    if (!name) {
      continue;
    }

    const key = createLabelKey(name);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    labels.push(name);
  }

  return labels;
}

export function getLabelColor(labelKey: string): Label["color"] {
  let hash = 0;

  for (const char of labelKey) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return LABEL_COLOR_PALETTE[hash % LABEL_COLOR_PALETTE.length];
}
