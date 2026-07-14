# ORDOSPACE Componentization Handoff

Date: 2026-07-03 KST

This document is for Claude Code, another Codex account, or any future agent taking over the ORDOSPACE componentization work.

## Current Objective

Refactor the existing ORDOSPACE static UI code so it can be managed in component-sized units.

This is not a React production cutover. The visible product must remain the existing ORDOSPACE UI at:

- https://ordospace-sprint5.vercel.app/

## Required Startup Reading

Read the shared memory files first:

1. `00_CONTROL/START_HERE.md`
2. `01_PROJECTS/코덱스/_CURRENT.md`
3. `01_PROJECTS/코덱스/_NEXT.md`
4. `01_PROJECTS/코덱스/_DECISIONS.md`
5. `01_PROJECTS/코덱스/_CONTEXT.md`

Then read these repo files:

1. `README.md`
2. `STRUCTURE.md`
3. `BUILD.md`
4. `COMPONENTIZATION_REFACTOR_PLAN.md`
5. `QA_REPORT_FEEDBACK_ITEMS_1_5.md`
6. `app/screens/README.md`
7. `app/ui/README.md`
8. `react-mvp/README.md`

## Product Direction

Durable decisions already made:

- Preserve the existing ORDOSPACE static UI as the public product surface.
- Do not deploy the separate React MVP shell as the production UI.
- Use the React MVP only as a source of component/state/lifecycle ideas.
- Absorb logic into the existing Admin, Worker, and Client screens gradually.
- Keep `react-mvp/` and `dist-react/` out of production packages unless the user explicitly changes direction.

## Current Repo State

Active workspace:

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work
```

Current branch:

```text
react-mvp-modulecard-lifecycle
```

Important current caveat:

- Production was deployed by direct Vercel CLI from local source.
- GitHub `origin/main` is not yet source-aligned with the deployed production behavior.
- Local worktree has uncommitted changes.
- `HARNESS_ENGINEERING_REPORT.md` is unrelated and should stay out of commits/deploy packages unless explicitly requested.

## What Is Already Good

Service and backend split:

- `app/services/module-card-lifecycle.service.js` owns ModuleCard lifecycle rules and local/remote persistence behavior.
- `api/module-cards.js` exposes the Vercel Function API.
- `api/_lib/module-card-repository.cjs` owns DB schema/repository behavior.
- Production `/api/module-cards` returns data from Postgres.

React MVP component reference:

- `react-mvp/src/ui/` contains real reusable React UI primitives.
- `react-mvp/src/cards/` contains role/action panels, action builders, store context, validation, and persistence helpers.
- These are references only, not the public UI.

Existing static UI helper layer:

- `app/ui/workspace.ui.js`
- `app/ui/room.ui.js`
- `index.html` component gallery

## What Is Not Yet Good

The existing static UI is only partially componentized.

Known problems:

- `index.html` still owns a large static shell and component-gallery examples.
- `app/styles/app.css` is large and not component-scoped.
- `app/screens/admin-workspace.screen.js` still contains large template-string renderers.
- `app/screens/worker-workspace.screen.js` and `app/screens/client-workspace.screen.js` contain large render/detail functions.
- Admin, Worker, and Client screens still contain legacy direct-mutation functions that are later overridden to call `module-card-lifecycle.service.js`.
- The component catalog documents visual patterns, but those patterns are not yet fully enforced by component factories.

## Non-Goals

Do not do these unless the user explicitly asks:

- Do not replace production with the React MVP shell.
- Do not rewrite the full app to React in one pass.
- Do not change visible IA, copy, route behavior, or role flow as part of component cleanup.
- Do not remove backend persistence behavior.
- Do not include secrets, Vercel env values, or DB credentials in docs or logs.
- Do not commit unrelated files such as `HARNESS_ENGINEERING_REPORT.md`.

## Componentization Target

Use plain static-app component factories first.

Recommended namespace:

```js
window.ORDO_UI_COMPONENTS = {
  escapeHtml,
  StatusBadge,
  MetricCard,
  ProgressTrack,
  EmptyState,
  ModuleCardListItem,
  DetailSection,
  MetaGrid,
  ActionToolbar,
  FormField,
  Sheet,
};
```

Recommended folder shape:

```text
app/ui/components/
|-- base.ui.js
|-- status.ui.js
|-- metric.ui.js
|-- module-card.ui.js
|-- detail.ui.js
|-- form.ui.js
`-- sheet.ui.js
```

Use global scripts, not ES modules, unless the build/runtime architecture is changed deliberately.

## Component Contract

Each component factory should:

- Accept explicit input data.
- Return HTML strings or small DOM-safe fragments consistently.
- Escape dynamic text by default.
- Avoid direct `document.querySelector` calls.
- Avoid direct access to `moduleCards()` or global data unless the component is explicitly a compatibility wrapper.
- Avoid business mutations.
- Keep event binding in the screen layer or a separate binder helper.
- Preserve existing class names and visual behavior.

## Recommended First Slice

Start with Admin ModuleCard list/detail.

Why:

- It is the largest visible maintenance problem.
- It contains repeated ModuleCard card, status, meta tile, detail section, comments, attachments, and action toolbar patterns.
- It is already wired to the lifecycle service, so cleanup can remove old direct-mutation fallback code after verification.

First extraction targets:

1. Status badge.
2. Metric card.
3. ModuleCard list item.
4. Detail meta tile/grid.
5. QC/log/attachment/comment list sections.
6. Action toolbar.
7. Empty detail state.

## Verification Commands

Run after every small slice:

```powershell
npm.cmd run check:js
npm.cmd run static:validate-lifecycle
npm.cmd run smoke
git diff --check
```

Run before any deployment or source-control alignment:

```powershell
npm.cmd run build
npm.cmd run check:js
npm.cmd run static:validate-lifecycle
npm.cmd run api:validate
npm.cmd run smoke:lifecycle
npm.cmd audit --omit=dev
```

## Handoff Rule

If another agent takes over, it should first report:

1. Current branch and dirty files.
2. Whether production still matches the expected existing ORDOSPACE UI.
3. Which component slice it will touch.
4. Which verification commands it will run.
5. Which files it will not touch.
