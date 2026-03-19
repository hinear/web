# Issue Detail States

## Page States

The primary V1 page state model targets the independent full-page issue detail route.

A compact drawer may exist later, but it should reuse the same persisted issue state and defer full history / full metadata to the full-page route.

### Loading

- Issue data is being fetched.
- Editable controls are disabled or replaced with skeletons.

### Ready

- Issue data is loaded successfully.
- All editable controls reflect persisted state.
- Full-page route shows the main editable content plus metadata and activity history.

### Saving

- A field mutation is in progress.
- The relevant field shows pending feedback.
- Other fields may remain interactive if independent.

### Error

- Initial issue fetch failed or a mutation failed.
- The UI displays an actionable error message.
- If optimistic UI was used, the failed field rolls back to the last persisted value.

### Not Found

- The requested issue does not exist.
- The page displays a not-found state.

## Empty Substates

### Empty Description

- Description area shows placeholder copy.
- User can start editing immediately.

### Empty Comments

- Comments thread shows no comments yet.
- User can still create the first comment.

### Unassigned

- Assignee control shows no assignee selected.

### No Labels

- Labels area shows no labels selected.

## Domain State Rules

### Status Model

Allowed values:

- `Triage`
- `Backlog`
- `Todo`
- `In Progress`
- `Done`

### Default Status

- Newly created issues start in `Triage`.

### Recommended Status Paths

Recommended, but not technically required, transitions:

- `Triage -> Backlog`
- `Triage -> Todo`
- `Backlog -> Todo`
- `Todo -> In Progress`
- `In Progress -> Done`

Reverse transitions may be allowed by product policy. The first implementation should keep the domain permissive unless the team wants stricter workflow enforcement.

## Mutation Outcomes

### Success

- persisted issue data updates
- activity log entry is appended when applicable
- pending indicator clears

### Failure

- visible error feedback is shown
- optimistic UI changes are rolled back to the last persisted state
- no success activity log entry is appended

## Layout States

### Full Page Detail

- Primary desktop implementation surface.
- Shows editable issue content, metadata, and full activity history together.

### Compact Drawer

- Secondary exploration surface.
- Shows compact fields first.
- May show recent activity only.
- Must provide a clear action to open the full-page route.

## Breakpoint Layout States

### Desktop

- Uses the full-page detail layout as the primary state.
- May include an exploration drawer, but the drawer is not the primary route state.

### Tablet

- Uses compact drawer as the first board-linked state.
- Keeps metadata summary and recent activity only.
- Escalates to full-page detail for full history and long-form editing.

### Mobile

- Uses a compact full-page detail stack.
- Avoids drawer-first navigation for issue detail.
- Uses a mobile full-page create form that resolves to full-page detail on success.
