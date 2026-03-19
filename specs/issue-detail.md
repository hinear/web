# Issue Detail Spec

## Goal

Implement a Linear-style issue detail page for managing project issues from a single screen.

The page is intentionally scoped to issue detail only. List views, filters, team switching, project overview, and keyboard shortcut parity are out of scope for the first implementation.

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

The exact layout may be adjusted to match the app architecture, but all three content groups must be visible or reachable without navigation away from the page.

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

## Non-Goals

- issue list view
- project dashboard
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
