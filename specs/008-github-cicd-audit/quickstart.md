# Quickstart: GitHub CI/CD Audit and Rationalization

## 1. Review the current baseline

Inspect the workflows currently under review:

```bash
sed -n '1,220p' .github/workflows/ci.yml
sed -n '1,260p' .github/workflows/performance.yml
```

Confirm the repository validation baseline:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 2. Apply workflow decisions

Use the audit outputs in `research.md` and `github-workflow-governance.md` to:

- keep or refine the required verification workflow
- preserve secret-gated jobs only where they provide real value
- remove or replace placeholder performance automation
- add lightweight workflow-governance or dependency-risk checks if they improve signal

## 3. Validate branch-protection safety

Before opening a pull request, verify:

- required workflow and job names are stable (`Verify`, `Workflow Governance`, `Dependency Risk`)
- optional secret-dependent jobs are not treated as universally required
- no workflow reports placeholder success as if it were a real guardrail

## 4. Re-run repository verification

After workflow updates, run the repository's standard checks again:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If the implementation introduces additional workflow validation tooling, run it here as part of the final verification step.

## 5.1 Workflow Guardrail Review Checklist

Run a quick structural review:

```bash
sed -n '1,260p' .github/workflows/ci.yml
sed -n '1,260p' .github/workflows/performance.yml
```

Confirm:

- `ci.yml` contains `Verify`, `Workflow Governance`, `Dependency Risk`, and optional `MCP Smoke`
- `performance.yml` is optional (`workflow_dispatch` + schedule) and contains no placeholder success logic

## 5. Document the final policy

Update repository documentation so reviewers can answer these questions quickly:

- Which checks are required for merge?
- Which checks are optional or secrets-gated?
- What replaced or removed any prior placeholder workflow?
- What should a maintainer do when a workflow fails?

## 6. Validation Outcomes (2026-03-27)

- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS
- Workflow review (`ci.yml`, `performance.yml`): PASS (stable required-check names and branch-protection-safe trigger design confirmed)
