# Issue Detail Spec

## Goal

Implement a Linear-style issue detail page for managing project issues from a single screen.

The page is intentionally scoped to issue detail only. List views, filters, team switching, project overview, and keyboard shortcut parity are out of scope for the first implementation.

For the current desktop baseline, the primary implementation surface is an independent full-page issue detail route. A compact drawer may reuse the same detail model later, but the drawer is not the source of truth for V1.

## Primary User Outcome

A user can open one issue and complete the full triage and execution workflow without leaving the detail page.

## Core Scope

- Edit issue title
- Change status: `Triage`, `Backlog`, `Todo`, `In Progress`, `Done`
- Change priority
- Change assignee
- Add and remove labels
- Edit description
- Write comments
- View activity log

## Triage Workflow

`Triage` is the default status for newly created issues.

The `Triage` stage is used to clarify and route new work before it enters the execution queue.

While an issue is in `Triage`, the user should typically:

- confirm the title is clear
- set a priority
- assign an owner if known
- attach relevant labels
- expand or correct the description
- decide whether the issue moves to `Backlog` or directly to `Todo`

## Page Regions

### Header

- issue identifier
- editable title
- current status
- priority selector
- assignee selector
- labels selector

### Body

- description editor
- comments thread

### Sidebar or Secondary Section

- activity log
- creation and update metadata
- failure / rollback guidance or error support copy

The exact layout may be adjusted to match the app architecture, but all three content groups must be visible or reachable without navigation away from the page.

For desktop V1, the preferred layout is:

- full-page route as the primary detail surface
- main content column for editable issue content
- secondary column for metadata and full activity history

A drawer variant is allowed only if it stays compact and clearly delegates full metadata and full history to the full-page route.

## Breakpoint Model

### Desktop `>= 1280px`

- The primary issue detail surface is a full-page route.
- The drawer is optional and exploratory only.
- Create issue may open as a modal, but success should land on the full-page route.

### Tablet `768px - 1279px`

- The board may open issue detail in a compact drawer first.
- The tablet drawer should keep only compact fields, short description, recent activity, and metadata summary.
- Full metadata, full history, and long-form editing should move to the full-page route.
- Create issue success should still land on the full-page route, not the drawer.

### Mobile `< 768px`

- The primary issue detail surface is a compact full-page route.
- Issue tap should open full-page detail directly.
- Create issue should use a mobile-first full-page form and land on full-page detail after success.

## Functional Requirements

### Title Editing

- The title is displayed on initial load.
- The title can be edited inline.
- Saving the title persists the latest value.
- An empty title is invalid.
- On save failure, the UI restores the previous persisted title.

### Status Changes

- Status options are limited to `Triage`, `Backlog`, `Todo`, `In Progress`, and `Done`.
- A user can move an issue between statuses using a selector.
- Newly created issues default to `Triage`.
- Each status change appends an activity log entry.

### Priority Changes

- Priority is editable from the detail page.
- Priority changes persist immediately or on explicit save, depending on UI implementation.
- Each priority change appends an activity log entry.

### Assignee Changes

- The user can assign, replace, or clear an assignee.
- Each assignee change appends an activity log entry.

### Labels

- The user can add one or more labels.
- The user can remove an existing label.
- Duplicate labels are not allowed.
- Each label add or remove action appends an activity log entry.

### Description Editing

- The description supports empty and non-empty states.
- The user can edit and save the description.
- On save failure, the UI restores the previous persisted description.
- Each successful description change appends an activity log entry.

### Comments

- The user can write a new comment.
- Empty comments are invalid.
- A successful comment appears in the comment thread.
- A successful comment appends an activity log entry.

### Activity Log

- The activity log is read-only in the first version.
- Entries are ordered newest first.
- Entries must be shown for:
  - issue creation
  - title changes
  - status changes
  - priority changes
  - assignee changes
  - label add and remove
  - description changes
  - comment creation

### Route Model

- The main V1 route is a full-page issue detail screen.
- Create issue success should navigate to the full-page issue detail route by default.
- A board-linked drawer may exist later as a compact companion view.
- If a drawer exists, it should expose a clear action to open the full-page route.
- Tablet may use the compact drawer as its first exploration surface.
- Mobile should prefer direct full-page detail over drawer indirection.

## Non-Goals

- issue list view
- project dashboard
- board-first detail implementation
- team management
- real-time collaboration
- offline support
- keyboard shortcut parity with Linear
- issue relationships, subtasks, or cycles

## Default UX Rules

- Optimistic updates are allowed for field edits if rollback is implemented on failure.
- Loading state must be visible on first page load.
- Failed mutations must present a visible error state.
- The page must remain usable when description or comments are empty.

## Acceptance Criteria

1. A new issue defaults to `Triage`.
2. A user can move an issue from `Triage` to `Backlog` or `Todo`.
3. A user can update title, priority, assignee, labels, and description from the same page.
4. A user can create a comment without leaving the page.
5. Each successful change produces a visible activity log entry.
6. Failed saves do not leave the UI in a permanently inconsistent state.
7. On desktop, the full-page detail route remains the primary implementation surface even if a compact drawer exploration exists.
8. On tablet, the drawer stays compact and exposes a clear path to the full-page route.
9. On mobile, issue open and issue create both resolve to a full-page detail flow.
