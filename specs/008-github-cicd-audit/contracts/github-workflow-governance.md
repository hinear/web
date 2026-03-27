# Contract: GitHub Workflow Governance

## Purpose

Define the repository contract for GitHub Actions workflows so maintainers can determine which checks are required, which are conditional, and which workflows must be removed or replaced when they stop providing trustworthy signal.

## Workflow Categories

### 1. Required Merge Guardrails

These workflows or jobs must provide reliable, reproducible signal for pull requests and protected branches.

**Contract**
- Must run without repository secrets in standard pull request contexts unless the repository explicitly limits contributor sources.
- Must execute real repository validation commands rather than placeholders.
- Must have stable check names suitable for branch protection.
- Must fail only on actionable repository problems.

### 2. Conditional Environment Guardrails

These workflows or jobs provide extra confidence when secrets or privileged environments are available.

**Contract**
- Must declare their secret or variable dependencies.
- Must skip cleanly when prerequisites are missing.
- Must not be configured as universally required merge checks.
- Must document whether failures block deployment, internal release, or only investigation.

### 3. Manual or Scheduled Diagnostics

These workflows are useful for periodic review, investigation, or long-running analysis.

**Contract**
- Must not present placeholder success as meaningful validation.
- Must be clearly documented as diagnostic, experimental, or deferred if they are not merge guardrails.
- Must define what artifact, metric, or decision they produce.

## Retirement and Replacement Rules

A workflow or job must be removed, merged, or replaced when any of the following is true:

- It reports success using placeholder logic rather than real verification.
- It duplicates another workflow's purpose without providing additional signal.
- It cannot run in its intended context and does not skip predictably.
- Its required-check name would mislead reviewers about actual coverage.
- The repository's current commands or architecture no longer match the workflow's assumptions.

## Required Review Triggers

The governance contract must be reviewed whenever:

- A workflow is added or deleted under `.github/workflows/`
- A required check name changes
- A job gains or loses secret dependencies
- Pull request validation commands change
- Branch protection expectations change

## Verification Expectations

Any workflow governance change must verify:

- Required checks still correspond to real workflow/job names
- Repository validation commands still pass locally where applicable
- Secret-dependent jobs skip or run as designed
- Documentation reflects the final required vs optional workflow set
