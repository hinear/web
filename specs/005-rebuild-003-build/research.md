# Research: Rebuild 003 Build Stability

## Decision 1: Recover in dependency-to-feature order

- **Decision**: Repair the current red state in this order: root dependency/config resolution, generated route/type reference cleanup, 003 performance module type reconciliation, then targeted validation and documentation.
- **Rationale**: Current failures show `build` stops immediately on config/module resolution and `typecheck` fails across both generated route expectations and 003 performance code. Fixing lower-level blockers first prevents wasted work inside feature code that still cannot be validated.
- **Alternatives considered**:
  - Fix feature code first: rejected because `build` is blocked before feature execution.
  - Chase all type errors in arbitrary order: rejected because it hides the highest-leverage blockers.

## Decision 2: Treat generated `.next` validator errors as source-of-truth mismatches, not build artifacts to patch

- **Decision**: Resolve `.next/dev/types/validator.ts` failures by regenerating production route types via `next typegen` and running standalone `tsc` against a dedicated `tsconfig.typecheck.json` that excludes stale `.next/dev/types`.
- **Rationale**: The missing MCP token routes were not active source routes; they survived only in old dev-generated artifacts. The stable fix was to make `typecheck` consume the production type graph instead of patching ephemeral dev output.
- **Alternatives considered**:
  - Edit `.next` output manually: rejected because generated artifacts are ephemeral and non-source-controlled.
  - Recreate deprecated MCP token routes just to satisfy dev validators: rejected because it would add dead source solely to appease stale output.

## Decision 3: Preserve 003 intent by fixing active integrations instead of masking them

- **Decision**: Keep the 003 performance surface in scope where it is part of the active app/config graph, including React Query provider wiring, performance repositories/utilities, and supporting config imports.
- **Rationale**: The feature goal is to recover a real baseline, not a narrowed build that succeeds by quietly orphaning recently added value.
- **Alternatives considered**:
  - Disable 003-specific modules wholesale: rejected because it would violate the clarified scope and likely erase intended performance value.
  - Keep every experimental 003 artifact regardless of usage: rejected because stale dead edges can be removed if they are not part of the recovered baseline.

## Decision 4: Define checkpoint validation around meaningful module or user-flow batches

- **Decision**: A recovery checkpoint occurs when a meaningful module batch or user-flow slice has been completed, and each checkpoint must record `build`/`typecheck` status plus targeted test results for directly modified and adjacent critical flows.
- **Rationale**: This matches the clarified spec and creates a practical cadence that catches regressions early without forcing full validation on every single file edit.
- **Alternatives considered**:
  - Validate after every code edit: rejected as too granular for a cross-cutting recovery.
  - Validate only at the very end: rejected because it recreates the failure mode that caused the recovery effort.

## Decision 5: Use documentation artifacts to freeze the recovered baseline

- **Decision**: Capture the recovered scope, deferred items, and validation sequence in the plan, quickstart, and recovery validation contract so the next implementation turn can execute deterministically.
- **Rationale**: The user explicitly wants to avoid another drift into ad hoc simplification. Written recovery boundaries reduce repeated rediscovery.
- **Alternatives considered**:
  - Keep recovery knowledge in commit history only: rejected because it slows onboarding and makes deferred work boundaries ambiguous.

## Decision 6: Promote placeholder recovery tests into executable regression tests

- **Decision**: Replace `.skip` placeholder tests with executable Vitest coverage for bottleneck tracking, regression detection, React Query provider wiring, and Supabase client reuse.
- **Rationale**: US1 completion requires affected critical tests to be part of the recovered baseline, and placeholder assertions do not provide a durable guardrail.
- **Alternatives considered**:
  - Leave placeholder `.skip` files as documentation only: rejected because they do not validate the repaired contracts.
  - Depend only on user-flow tests: rejected because the type recovery touched lower-level performance and provider boundaries directly.
