# Issue Detail States

## Page States

### Loading

- Issue data is being fetched.
- Editable controls are disabled or replaced with skeletons.

### Ready

- Issue data is loaded successfully.
- All editable controls reflect persisted state.

### Saving

- A field mutation is in progress.
- The relevant field shows pending feedback.
- Other fields may remain interactive if independent.

### Error

- Initial issue fetch failed or a mutation failed.
- The UI displays an actionable error message.

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
