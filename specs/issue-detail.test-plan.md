# Issue Detail Test Plan

## Test Layers

### Domain Tests

- new issue defaults to `Triage`
- empty title is rejected
- empty comment body is rejected
- duplicate labels are not allowed
- activity log entries are ordered newest first

### Application Service Tests

- `updateIssue` persists title changes
- `updateIssue` persists status changes
- `updateIssue` persists priority changes
- `updateIssue` can clear assignee
- `updateIssue` replaces label set
- `createComment` appends a new comment

### Component Tests

- issue detail shows loading state before issue data resolves
- title can be edited inline and saved
- failed title save rolls back to the previous value
- status selector includes `Triage`, `Backlog`, `Todo`, `In Progress`, `Done`
- status can change from `Triage` to `Backlog`
- status can change from `Triage` to `Todo`
- description empty state is visible when no description exists
- description edit persists and shows updated content
- assignee can be added, replaced, and cleared
- labels can be added and removed
- comment form rejects empty submission
- successful comment appears in the thread
- activity log renders all supported event types

### E2E Tests

- open issue detail, move issue from `Triage` to `Todo`, verify activity log entry
- open issue detail, update title and description, reload, verify persistence
- open issue detail, add comment, verify comment and activity log entry

## Suggested First Red-Green Cycle

1. Write a failing test that a newly created issue defaults to `Triage`.
2. Write a failing test for inline title editing with rollback on save failure.
3. Write a failing test for status change from `Triage` to `Backlog`.
4. Write a failing test for adding a comment and appending an activity log entry.
5. Add one E2E path for the core triage flow.

## Definition Of Done For V1

- core issue detail interactions are covered by tests
- triage-first workflow is covered by at least one E2E scenario
- failed mutations are explicitly tested
- activity log behavior is explicitly tested
