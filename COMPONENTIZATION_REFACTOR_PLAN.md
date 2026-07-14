# ORDOSPACE Componentization Refactor Plan

Date: 2026-07-03 KST

## Goal

Make the existing ORDOSPACE static UI code manageable in component-sized units while preserving the current public UI shell and backend behavior.

The goal is maintainability, not a visual redesign.

## Current Assessment

The project already has folder-level separation:

- `app/config/`
- `app/router/`
- `app/repos/`
- `app/data/`
- `app/services/`
- `app/screens/`
- `app/ui/`
- `app/qa/`

However, the visible static UI is not yet fully componentized.

The current state is best described as:

- Service/repo split: good enough for the current MVP backend.
- React MVP component split: reasonably good, but not the production UI.
- Existing static UI component split: partial and incomplete.

## Principles

1. Preserve the current visible ORDOSPACE UI.
2. Refactor one small screen area at a time.
3. Extract repeated visual patterns before changing screen renderers.
4. Keep business mutations in `app/services/module-card-lifecycle.service.js`.
5. Keep screen files responsible for flow, routing state, and event binding.
6. Keep UI component factories pure where possible.
7. Verify after every slice.
8. Do not deploy the React MVP shell as production.

## Target Architecture

```text
app/
|-- services/
|   `-- module-card-lifecycle.service.js
|-- screens/
|   |-- admin-workspace.screen.js
|   |-- worker-workspace.screen.js
|   `-- client-workspace.screen.js
|-- ui/
|   |-- workspace.ui.js
|   |-- room.ui.js
|   `-- components/
|       |-- base.ui.js
|       |-- status.ui.js
|       |-- metric.ui.js
|       |-- module-card.ui.js
|       |-- detail.ui.js
|       |-- form.ui.js
|       `-- sheet.ui.js
`-- qa/
    |-- runtime-qa.js
    `-- smoke-check.js
```

## Component Boundary Rules

### UI component factory

Owns:

- HTML structure.
- CSS class composition.
- Empty-state markup.
- Accessible labels where local to the component.
- Escaping dynamic text.

Does not own:

- Fetching data.
- Mutating ModuleCards.
- Calling lifecycle actions.
- Reading route params.
- Re-rendering other screens.

### Screen renderer

Owns:

- Choosing data for the route.
- Calling UI component factories.
- Mounting generated HTML.
- Binding event handlers.
- Calling service methods.
- Re-rendering affected screens after service mutations.

### Service

Owns:

- ModuleCard state transitions.
- Persistence.
- Remote sync.
- Audit/timeline/comment side effects that belong to the data model.

## Component Inventory

First component targets:

| Component | Existing source | First consumer |
|---|---|---|
| `escapeHtml` | `moduleEsc`, `roomEsc` | all component factories |
| `StatusBadge` | `statusBadgeHtml`, `moduleToneClass`, `roomBadge` | Admin/Worker/Client |
| `MetricCard` | `moduleMetric`, `roomMetric` | Admin/Worker dashboards |
| `ProgressTrack` | `progressBar`, inline progress markup | Admin project rows |
| `ModuleCardListItem` | `moduleCard`, `adminCardListItemHtml`, `workerCardSummaryHtml` | Admin card list |
| `DetailSection` | admin/worker/client detail sections | Admin card detail |
| `MetaGrid` | admin/client detail meta grids | Admin card detail |
| `ActionToolbar` | admin/worker/client detail action buttons | Admin card detail |
| `EmptyState` | repeated dashed empty panels | Admin/Worker/Client |
| `FormField` | bulk create and worker/client prompts future replacement | Admin create |
| `Sheet` | modal/sheet wrappers | Admin bulk create |

## Recommended Round Plan

Use 16 rounds for Codex-led implementation.

If production deployment and GitHub `origin/main` source alignment are included in the same workstream, reserve 18 rounds.

### Round 1 - Source and document baseline

- Confirm branch, dirty files, production URL, rollback target, and source-control mismatch.
- Do not refactor code yet.
- Update handoff docs if the baseline has drifted.

### Round 2 - Component inventory lock

- Map every repeated UI pattern in Admin/Worker/Client screens.
- Decide exact component names and file placement.
- Add a simple inventory checklist to this document if needed.

### Round 3 - Base component utilities

- Create `app/ui/components/base.ui.js`.
- Centralize escape, class joining, fallback text, and safe list helpers.
- Keep compatibility with existing `moduleEsc` and `roomEsc`.

### Round 4 - Status, metric, progress, and empty-state components

- Extract `StatusBadge`, `MetricCard`, `ProgressTrack`, and `EmptyState`.
- Replace only low-risk call sites first.
- Run verification.

### Round 5 - ModuleCard list item component

- Extract `ModuleCardListItem`.
- Preserve current classes and data attributes.
- Replace Admin card list item rendering first.

### Round 6 - Admin detail component primitives

- Extract detail header, meta grid, QC list, work log list, attachment list, comment list, and action toolbar.
- Keep event binding in `admin-workspace.screen.js`.

### Round 7 - Admin card screen migration

- Replace Admin ModuleCard list/detail render paths with the new components.
- Keep behavior identical.
- Run browser smoke and lifecycle checks.

### Round 8 - Remove Admin legacy override noise

- Remove old direct-mutation Admin functions that are now superseded by lifecycle-service actions.
- Keep lifecycle actions as the only mutation path.

### Round 9 - Worker list/detail migration

- Reuse `ModuleCardListItem`, detail sections, and action toolbar for Worker.
- Preserve current Worker route and card behavior.

### Round 10 - Remove Worker legacy override noise

- Remove old direct-mutation Worker handlers.
- Keep lifecycle-service actions as the only mutation path.

### Round 11 - Client approval/detail migration

- Reuse detail, attachment preview, comment list, action toolbar, and empty-state components.
- Preserve client approval and revision behavior.

### Round 12 - Remove Client legacy override noise

- Remove old Client approval/direct mutation handlers.
- Keep lifecycle-service actions as the only mutation path.

### Round 13 - Form and sheet primitives

- Extract reusable bulk-create sheet, form field, error/help text, and action row helpers.
- Do not redesign the UI.

### Round 14 - CSS and component catalog alignment

- Align component catalog examples with actual component factories.
- Clean stale CSS comments/selectors only where directly related.
- Do not make a broad style rewrite.

### Round 15 - QA hardening

- Add or update static validation for component files.
- Ensure smoke routes still cover Admin cards, Worker cards, Client dashboard/project/approvals, and runtime QA.
- Confirm no React MVP shell appears in production build output.

### Round 16 - Final local release check

- Run full local verification.
- Produce a final componentization report.
- Decide with the user whether to proceed to source-control alignment or deployment.

### Optional Round 17 - Source-control alignment

- Review final diff.
- Commit only intended files.
- Keep unrelated files out.
- Decide whether GitHub `origin/main` should be updated to match production/source.

### Optional Round 18 - Production verification

- Deploy only if explicitly requested.
- Verify production URL, API, route smoke, runtime QA, and rollback target.

## Definition of Done

The componentization work is done when:

- Repeated Admin/Worker/Client card/detail UI is generated through shared UI component factories.
- Screen files are shorter and mostly own flow, data selection, and event binding.
- Direct business mutations in screens are removed or isolated behind lifecycle service calls.
- Existing ORDOSPACE visual UI remains stable.
- Existing backend persistence still works.
- Local smoke and lifecycle checks pass.
- Documentation reflects the final structure.

## Risks

- Large template-string changes can accidentally alter visible layout.
- Removing legacy handlers too early can break edge flows.
- Production source is not yet aligned with GitHub main.
- React MVP can still be mistaken for the intended public UI if docs are ignored.

## Safety Strategy

- One component slice per round.
- No broad visual redesign.
- No React production replacement.
- Keep old behavior until the new component path is verified.
- Remove old code only after the replacement path is proven.
- Run checks after every slice.
