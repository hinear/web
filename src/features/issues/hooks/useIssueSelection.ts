import { useCallback, useState } from "react";

export function useIssueSelection() {
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(
    new Set()
  );

  const toggleIssue = useCallback((issueId: string) => {
    setSelectedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  }, []);

  const selectIssue = useCallback((issueId: string) => {
    setSelectedIssueIds((prev) => new Set(prev).add(issueId));
  }, []);

  const deselectIssue = useCallback((issueId: string) => {
    setSelectedIssueIds((prev) => {
      const next = new Set(prev);
      next.delete(issueId);
      return next;
    });
  }, []);

  const selectAll = useCallback((issueIds: string[]) => {
    setSelectedIssueIds(new Set(issueIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIssueIds(new Set());
  }, []);

  const isSelected = useCallback(
    (issueId: string) => selectedIssueIds.has(issueId),
    [selectedIssueIds]
  );

  const selectedCount = selectedIssueIds.size;

  return {
    isSelected,
    selectedCount,
    selectedIssueIds: Array.from(selectedIssueIds),
    toggleIssue,
    selectIssue,
    deselectIssue,
    selectAll,
    clearSelection,
  };
}
