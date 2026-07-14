# ORDOSPACE Structure Note

This document describes the current Sprint 5 source layout after the room cleanup, runtime QA alignment, and dependency pinning work.

## File Tree

```text
.
|-- index.html
|-- README.md
|-- STRUCTURE.md
|-- BUILD.md
|-- package.json
|-- package-lock.json
|-- tailwind.config.cjs
|-- vercel.json
|-- api/
|   |-- module-cards.js
|   |-- _lib/
|   |   `-- module-card-repository.cjs
|   `-- _schema/
|       `-- module-cards.sql
|-- tools/
|   |-- copy-lucide.js
|   |-- seed-module-cards-db.cjs
|   |-- validate-static-module-lifecycle.cjs
|   |-- validate-static-components.cjs
|   |-- validate-module-card-api-contract.cjs
|   |-- validate-module-card-api-db.cjs
|   |-- validate-module-card-db-connection.cjs
|   |-- validate-module-card-refresh-recovery.cjs
|   |-- validate-admin-module-card-server-persistence.cjs
|   |-- validate-worker-module-card-server-persistence.cjs
|   |-- validate-client-module-card-server-persistence.cjs
|   `-- validate-cross-role-module-card-server-flow.cjs
`-- app/
    |-- README.md
    |-- config/
    |   `-- app.config.js
    |-- data/
    |   |-- room.data.js
    |   `-- workspace.data.js
    |-- layout/
    |   `-- app-shell.js
    |-- repos/
    |   `-- room.repo.js
    |-- router/
    |   `-- hash-router.js
    |-- screens/
    |   |-- auth.screen.js
    |   |-- client-workspace.screen.js
    |   |-- report-center.screen.js
    |   |-- documents.screen.js
    |   |-- admin-workspace.screen.js
    |   `-- worker-workspace.screen.js
    |-- services/
    |   |-- session.service.js
    |   `-- module-card-lifecycle.service.js
    |-- styles/
    |   |-- app.css
    |   |-- tailwind.input.css
    |   `-- tailwind.build.css
    |-- ui/
    |   |-- components/
    |   |   |-- base.ui.js
    |   |   |-- status.ui.js
    |   |   |-- metric.ui.js
    |   |   |-- module-card.ui.js
    |   |   |-- detail.ui.js
    |   |   |-- form.ui.js
    |   |   `-- sheet.ui.js
    |   |-- room.ui.js
    |   `-- workspace.ui.js
    |-- qa/
    |   |-- runtime-qa.js
    |   |-- smoke-check.js
    |   `-- smoke-checklist.md
    |-- vendor/
    |   `-- lucide/
    |       `-- lucide.min.js
    `-- main.js
```

Reference-only surfaces kept out of the public product: `react-mvp/` (React MVP evidence) and `dist-react/` (its build output). `.vercelignore` excludes them from deployment.

## Ownership

### `index.html`

- Holds the static markup and script order.
- Loads local generated Tailwind CSS and vendored Lucide.
- Includes the dev-only component gallery screen.

### Root Build Files

- `package.json` and `package-lock.json` pin build/runtime asset dependencies.
- `tailwind.config.cjs` owns Tailwind tokens and content scanning.
- `tools/copy-lucide.js` copies the pinned Lucide browser bundle.
- `BUILD.md` records install, build, verification, and CDN policy.

### `app/config/`

- Owns roles, route names, menu labels, CTA definitions, and global UI policy.
- Does not own Tailwind browser runtime configuration anymore.

### `app/router/`

- Owns hash navigation, role guards, landing section scrolling, and legacy route aliases.
- Deleted room routes are mapped to current client screens rather than restored as DOM screens.

### `api/`

- `module-cards.js` is the Vercel Function endpoint (GET/PUT) for ModuleCards.
- `_lib/module-card-repository.cjs` owns validation, normalization, and Postgres persistence.
- `_schema/module-cards.sql` records the table/index DDL.

### `tools/`

- `copy-lucide.js` copies the pinned Lucide bundle (build step).
- `seed-module-cards-db.cjs` seeds the ModuleCard table.
- `validate-static-module-lifecycle.cjs` runs the lifecycle service in a vm (no browser).
- `validate-static-components.cjs` checks component factories: escaping, marker classes, and that screens neither emit ModuleCard markup inline nor mutate `card.status` directly.
- Remaining `validate-*.cjs` scripts cover API contract, DB connection, and server persistence flows (env vars required for DB-backed ones).

### `app/services/`

- `session.service.js` owns session, role switching, fake login behavior, and role-aware entry helpers.
- `module-card-lifecycle.service.js` owns ModuleCard state transitions, local/remote persistence, and audit/timeline side effects. It is the only mutation path for ModuleCards.

### `app/data/`

- Owns static sample data used by the prototype.

### `app/repos/`

- Owns read/query/aggregation helpers over static data.

### `app/layout/`

- Owns shell behavior such as sidebar, drawer, topbar CTA, role display, and theme hooks.

### `app/screens/`

- Owns user-visible screen rendering by role.
- Admin and worker renderers are still large and should be split in the next maintenance item.

### `app/ui/`

- `components/` owns the shared UI factories under the `window.ORDO_UI_COMPONENTS` namespace:
  - `base.ui.js` — escape/format/date/route helpers (canonical implementations).
  - `status.ui.js` — tone rules, `StatusBadge`, `PriorityBar`, `statusBadgeHtml` compat wrapper.
  - `metric.ui.js` — `MetricCard`, `ProgressTrack`, `EmptyState` variants, `Notice`.
  - `module-card.ui.js` — `ModuleCardListItem`, the single source for ModuleCard summary markup.
  - `detail.ui.js` — detail-pane primitives (header, meta grid, QC/log/attachment/comment lists, section wrapper, action toolbar).
  - `form.ui.js` / `sheet.ui.js` — form field/row/option factories and the sheet open/close controller.
- Factories accept explicit data, return HTML strings, escape dynamic text by default, and never bind events or mutate cards. Event binding stays in `screens/`.
- `workspace.ui.js` keeps legacy global names as thin delegates plus the demo base-date helpers (`moduleDays`, `moduleTodayText`) and the remaining `moduleCard` article renderer (pending the dashboard/timeline click-through decision).
- `room.ui.js` owns the legacy room fragments (out of componentization scope).

### `app/styles/`

- `tailwind.input.css` is the Tailwind source.
- `tailwind.build.css` is generated and loaded by `index.html`.
- `app.css` contains app-specific CSS that is not generated by Tailwind.

### `app/qa/`

- `smoke-check.js` drives a real browser.
- `runtime-qa.js` verifies current DOM, aliases, role guards, and local dependency assets inside the browser.

## Known Follow-Up

- `app/main.js` still contains runtime glue and some legacy guarded renderers.
- Workspace ModuleCard list/detail markup is now generated through `app/ui/components/` factories; screens own data selection, filters, and event binding. Remaining large template strings are limited to non-card areas (admin home/projects/team single-line renderers) and `index.html` itself.
- `workspace.ui.js` `moduleCard` is the last duplicated summary renderer, kept until the dashboard/admin-timeline click-through decision (componentization plan F2/F3).
- See `CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md` round log for the componentization history and verification evidence.
