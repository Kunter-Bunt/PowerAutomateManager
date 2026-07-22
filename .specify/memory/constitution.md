<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0
Rationale: Initial ratification of the PowerAutomateManager constitution (MAJOR
baseline for a new governance document).

Modified principles: N/A (initial creation)
Added sections:
  - Core Principles
    - I. Code Quality
    - II. User Experience Consistency
    - III. Performance Requirements
    - IV. Minimal Comments & Small Functions
  - Platform Integration Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A

Templates requiring updates:
  - .specify/templates/plan-template.md ....... ⚠ pending (not present; create with a
    "Constitution Check" gate referencing Principles I–IV when scaffolding is added)
  - .specify/templates/spec-template.md ....... ⚠ pending (not present; add UX-consistency
    and performance-expectation sections when scaffolding is added)
  - .specify/templates/tasks-template.md ...... ⚠ pending (not present; add task categories
    for performance validation and UX-consistency checks when scaffolding is added)
  - README.md ................................. ✅ reviewed (no principle references to update)

Follow-up TODOs:
  - When Spec Kit templates are generated for this repo, propagate Principles I–IV into the
    plan/spec/tasks Constitution Check gates.
-->

# PowerAutomateManager Constitution

PowerAutomateManager is a tool for **Power Platform ToolBox (PPTB)** that performs actions
against Power Automate Flows, Connection References, and Connections. As a PPTB tool it runs
as a sandboxed web application communicating with the PPTB host through the ToolBox,
Dataverse, and Power Platform APIs. This constitution defines the non-negotiable engineering
principles that govern its development.

## Core Principles

### I. Code Quality

Code MUST be maintainable, clean, and consistent.

- All code MUST be written in TypeScript with strict type checking enabled; `any` MUST be
  avoided and justified in code review when unavoidable.
- Public/exported functions and modules MUST have clear, single responsibilities. A change to
  one concern MUST NOT require edits scattered across unrelated modules.
- Linting and formatting MUST pass with zero errors before merge. Style is enforced by
  tooling, not debated in review.
- Dead code, commented-out code, and unused dependencies MUST NOT be committed.
- Naming MUST be descriptive and unambiguous; identifiers reveal intent without needing a
  comment to explain them.

**Rationale**: This tool operates against production Power Platform environments where a
defect can disable business-critical Flows. High code quality is the primary defense against
regressions and the foundation for safe, rapid iteration.

### II. User Experience Consistency

The tool MUST feel like a native part of Power Platform ToolBox. UX and integration
conventions MUST align with the official PPTB documentation at
https://docs.powerplatformtoolbox.com/.

- The tool MUST access Power Platform data exclusively through the sanctioned host APIs —
  `window.toolboxAPI` (connections, utils, settings, terminal, events), `window.dataverseAPI`,
  and `window.powerplatformAPI` — and MUST NOT bypass the sandbox or open unsanctioned
  network calls.
- Connection context MUST be obtained from `toolboxAPI.connections` (read-only, host-managed);
  the tool MUST NOT manage its own authentication or store credentials.
- User-facing feedback (notifications, clipboard, file operations, theme) MUST use
  `toolboxAPI.utils` rather than custom mechanisms, so behavior matches the rest of PPTB.
- The tool MUST be theme-aware: icons MUST use `fill="currentColor"` / `stroke="currentColor"`
  and the UI MUST respect the host's active theme (light/dark).
- Tool-specific persistence MUST use `toolboxAPI.settings`; state MUST NOT leak across
  connection contexts.
- The package manifest MUST follow current PPTB conventions (top-level `icon` relative to the
  `dist` root; deprecated fields such as `configurations.iconURL` MUST NOT be used) and use
  `@pptb/types` for type-safe host integration.

**Rationale**: Users trust PPTB tools because they behave predictably within the platform's
secure, isolated model. Consistency with platform conventions preserves that trust, keeps the
tool within the security sandbox, and reduces the learning curve.

### III. Performance Requirements

Operations MUST be responsive and MUST scale gracefully with the size of the target
environment.

- The UI MUST remain responsive at all times; long-running operations MUST run without
  blocking the interface and MUST surface progress and cancellation where feasible.
- Interactive actions on a single Flow, Connection Reference, or Connection (open, inspect,
  toggle, update) SHOULD complete within 2 seconds under normal conditions, excluding
  unavoidable Dataverse/Power Platform service latency.
- List and query operations MUST use server-side filtering, selection, and paging (FetchXML /
  OData `$select`, `$filter`, `$top`) rather than retrieving-then-filtering on the client. The
  tool MUST NOT fetch entire tables to display a subset.
- Bulk operations across many Flows, Connection References, or Connections MUST batch requests,
  bound concurrency to avoid throttling, and handle Power Platform API throttling with retry
  and backoff.
- Any operation whose cost grows with environment size MUST be validated against a realistic
  environment (hundreds of Flows/Connections) before release.

**Rationale**: Administrators run this tool against environments of widely varying sizes. Clear,
measurable performance expectations prevent the tool from freezing, timing out, or triggering
service throttling in large tenants.

### IV. Minimal Comments & Small Functions

Code MUST explain itself through structure and naming, not narration.

- Comments MUST be kept to a minimum and MUST explain **WHY**, never **WHAT**. A comment that
  restates what the code does MUST be removed.
- Comments are permitted to record intent, trade-offs, workarounds, external constraints, or
  non-obvious rationale that the code cannot express on its own.
- Long functions MUST NOT be organized into segments delimited by explanatory comments.
  Instead, extract each segment into a shorter function with a descriptive name that conveys
  what the comment would have said.
- Functions SHOULD do one thing; prefer many small, well-named functions over few large ones.

**Rationale**: Descriptive decomposition stays correct as code evolves, whereas "WHAT" comments
drift out of sync and mislead. Reserving comments for "WHY" preserves genuinely valuable
context while keeping the codebase self-documenting.

## Platform Integration Constraints

- The tool runs in a sandboxed iframe with limited API access; it MUST NOT attempt to escape
  the sandbox, access host internals, or make direct network requests outside the sanctioned
  host APIs.
- All host communication MUST use the structured `postMessage` protocol exposed by the PPTB
  APIs; ad-hoc messaging channels MUST NOT be introduced.
- The tool MUST NOT persist secrets, tokens, or credentials; authentication and connection
  lifecycle are owned by the host.
- Integration with Dataverse and Power Platform service endpoints MUST use the documented
  namespaced clients (`dataverseAPI`, `powerplatformAPI.<Namespace>`), keeping to the platform's
  secure-by-design architecture.
- When cloning or porting an existing XrmToolBox tool, the original author MUST be contacted (if
  not the author) in the spirit of the PPTB community guidelines before publishing.

## Development Workflow & Quality Gates

- Every change MUST pass, at minimum: type checking, linting/formatting, and the project's
  automated tests before merge.
- Pull requests MUST be reviewed against this constitution; reviewers MUST verify compliance
  with Principles I–IV and the Platform Integration Constraints.
- New features and bug fixes affecting Flows, Connection References, or Connections MUST be
  validated against a real (or realistically sized) Power Platform environment before release.
- Releases MUST follow the PPTB publishing process (build → prepare manifest → publish to npm →
  submit to the ToolBox registry) with a versioned, documented changelog.
- Any deviation from a principle MUST be documented in the PR with explicit justification and
  approved by a maintainer; undocumented deviations block merge.

## Governance

This constitution supersedes ad-hoc conventions for the PowerAutomateManager project. When
guidance conflicts, this document takes precedence.

- **Amendment procedure**: Proposed changes MUST be submitted as a pull request that edits this
  file, states the rationale, and identifies the version bump. Amendments require maintainer
  approval before merge.
- **Versioning policy**: This constitution is versioned with semantic versioning.
  - **MAJOR**: Backward-incompatible governance changes, or removal/redefinition of a principle.
  - **MINOR**: A new principle or section is added, or existing guidance is materially expanded.
  - **PATCH**: Clarifications, wording, and non-semantic refinements.
- **Compliance review**: Every pull request is a compliance checkpoint. Maintainers MUST confirm
  the change adheres to the principles above (or carries an approved, documented exception).
- **Propagation**: When a principle changes, dependent artifacts (plan/spec/tasks templates,
  contributor docs, and README references) MUST be updated in the same change or tracked as
  explicit follow-ups in the Sync Impact Report.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
