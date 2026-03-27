# Data Model: GitHub CI/CD Audit and Rationalization

## Workflow Inventory Item

**Purpose**: Represent one repository workflow or one separately governed job within a workflow.

**Fields**
- `name`: Human-readable workflow or job name
- `file_path`: Repository path to the workflow definition
- `scope`: Workflow-level or job-level governance scope
- `trigger_events`: Events that execute the automation
- `required_for_merge`: Whether the signal is intended to be branch-protection required
- `secret_dependencies`: Secrets or variables required for execution
- `execution_mode`: Always-run, conditional, manual-only, scheduled, or retired
- `current_signal_quality`: High-signal, low-signal, placeholder, duplicate, or unknown
- `owner`: Team or maintainership responsibility
- `notes`: Supporting rationale or migration notes

**Validation Rules**
- `file_path` must resolve to a file under `.github/workflows/`
- `required_for_merge` cannot be true when `execution_mode` depends on secrets unavailable to normal PR contexts
- `current_signal_quality` cannot remain `unknown` after audit completion

## Guardrail Policy

**Purpose**: Define the minimum set of repository checks expected for pull requests, protected branches, and optional secret-aware validation.

**Fields**
- `policy_name`: Short policy identifier
- `applies_to`: PRs, protected branch pushes, schedules, manual runs, or combinations
- `required_checks`: Named checks required for merge
- `optional_checks`: Named checks that may run conditionally
- `skip_conditions`: Conditions under which optional checks should skip rather than fail
- `failure_handling`: Expected maintainer response when the check fails
- `review_trigger`: What kinds of workflow edits require policy review

**Validation Rules**
- Every required check must map to a real workflow/job name
- Optional checks must define explicit skip conditions when secrets or environment setup are missing
- `failure_handling` must distinguish between retry, fix, or ignore paths

## Workflow Decision Record

**Purpose**: Capture the audit outcome for each workflow or job that is evaluated during this feature.

**Fields**
- `subject`: Workflow or job under review
- `decision`: Keep, remove, merge, replace, or defer
- `reason`: Plain-language justification for the decision
- `impact_on_branch_protection`: Required check impact summary
- `follow_up_action`: Concrete next step after the decision
- `validation_needed`: Commands or checks required to confirm the decision
- `status`: Proposed, approved, implemented, or verified

**Validation Rules**
- `decision` must be one of the allowed values
- `impact_on_branch_protection` is required for any subject that currently participates in PR checks
- `validation_needed` must reference at least one verification activity before `status` becomes `verified`
