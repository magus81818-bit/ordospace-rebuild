# ORDOSPACE Feedback Items 1-5 QA Report

Date: 2026-06-29 KST

Branch: `feedback/room-dead-code-cleanup`

Workspace: `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work`

## Scope

This QA pass covers all mentor feedback work completed so far:

1. Dead room dashboard subsystem cleanup.
2. Runtime QA and router alias alignment.
3. Tailwind/Lucide CDN dependency pinning.
4. Documentation and implementation alignment.
5. Large renderer maintainability cleanup.

## Summary

Status: PASS

No blocking QA issues were found.

The smoke harness was strengthened during this QA pass. It now checks 12 browser routes instead of 7, adding direct coverage for:

- `admin-cards`
- `admin-projects`
- `admin-team`
- `admin-audit`
- `worker-cards`

Runtime QA remains enabled inside the smoke run and passes 20/20 checks.

## Verification Commands

All commands were run from the repo root.

```powershell
npm.cmd run build
Get-ChildItem app -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
npm.cmd run check:js
npm.cmd run smoke
npm.cmd ls --depth=0
npm.cmd audit --omit=dev
git diff --check
```

## Verification Results

| Check | Result | Notes |
| --- | --- | --- |
| Build | PASS | `app/styles/tailwind.build.css` rebuilt and `app/vendor/lucide/lucide.min.js` copied. |
| JS syntax | PASS | All `app/**/*.js` files passed `node --check`. |
| QA scripts | PASS | `npm.cmd run check:js` passed. |
| Browser smoke | PASS | 12 routes passed in real Chrome. |
| Runtime QA | PASS | 20/20 checks passed. |
| Dependency versions | PASS | `lucide@1.22.0`, `tailwindcss@3.4.17`. |
| npm audit | PASS | 0 vulnerabilities with `--omit=dev`. |
| Diff whitespace | PASS | Only existing LF/CRLF conversion warnings appeared. |

## Feedback Item Coverage

### 1. Dead Room Dashboard Cleanup

Confirmed:

- `app/screens/room-dashboard.screen.js` is deleted.
- Legacy room renderer globals are absent from live screen code.
- Runtime QA keeps the removed globals in its deny-list and verifies they are not present on `window`.
- Removed room DOM IDs are absent from `index.html`.

Expected remaining references:

- Legacy route names such as `project-room`, `action-room`, and `report-room` remain only as router aliases and runtime QA alias cases.

### 2. Runtime QA and Router Alias Alignment

Confirmed:

- `ROUTE_ALIASES` is populated in `app/router/hash-router.js`.
- `resolveRouteAlias()` and `getReportsChangesFallbackHash()` are exposed through `window.ORDO_ROUTER`.
- Runtime QA checks current role routes, removed DOM IDs, removed globals, alias cases, local dependency loading, and component catalog expectations.
- Browser smoke reports runtime QA as `20/20`.

### 3. CDN Dependency Pinning

Confirmed:

- `index.html` loads `./app/styles/tailwind.build.css`.
- `index.html` loads `./app/vendor/lucide/lucide.min.js`.
- `package.json` pins `lucide` to `1.22.0`.
- `package.json` pins `tailwindcss` to `3.4.17`.
- `BUILD.md` documents the local build flow and CDN policy.
- Forbidden Tailwind/Lucide CDN strings appear only in `BUILD.md` policy text and runtime QA's forbidden-pattern check.

Non-blocking note:

- Fonts still load from external font CDNs: Pretendard via jsDelivr and Inter/Orbitron via Google Fonts. This is outside the original Tailwind/Lucide feedback scope, but it is still an external runtime dependency if the project later wants fully local assets.

### 4. Documentation and Implementation Alignment

Confirmed:

- Component catalog now says 8 shared components and includes ModuleCard.
- README and structure docs describe the current local Tailwind/Lucide build.
- `main.js` is documented as no longer the whole app, but still not thin.
- `#chain` and `#gap` CSS references are valid because the landing sections still exist in `index.html`.
- DEV navigation copy is dev-mode scoped rather than promised as automatically removed.

### 5. Renderer Maintainability

Confirmed:

- Legacy PM timeline/compose handlers were removed from `app/main.js`.
- Removed admin approvals renderer/event hooks were removed from `app/screens/admin-workspace.screen.js`.
- Admin ModuleCard detail rendering is split into focused helper functions.
- `renderAdminCards()` is split into selection, filter controls, list rendering, and binding helpers.
- Admin project detail tabs/header/body/binding are split into smaller helpers.
- `renderWorkerCards()` is split into route sync, active card resolution, filter rendering, list rendering, and binding helpers.
- The expanded smoke harness directly validates the screens most affected by these refactors.

Known optional future cleanup:

- `renderAdminProjects()` remains dense.
- `renderAdminTeamHeatmap()` remains dense and event-heavy.
- `workerDetailHtml()` remains a large template by design; it was not rewritten in item 5 to avoid unnecessary visible text/encoding risk.

## Static Searches

The following categories were searched:

- removed screen IDs in live DOM
- removed legacy globals in live code
- stale PM timeline/compose selectors
- old admin approvals renderer selectors
- unpinned Tailwind/Lucide CDN references
- old component catalog count
- visible text corruption markers such as `???` or replacement characters

Result: PASS

The only expected matches are deny-list/policy references in QA and docs.

## Current Working Tree Notes

Untracked files that are part of the feedback implementation:

- `BUILD.md`
- `app/styles/tailwind.build.css`
- `app/styles/tailwind.input.css`
- `app/vendor/lucide/lucide.min.js`
- `package-lock.json`
- `package.json`
- `tailwind.config.cjs`
- `tools/copy-lucide.js`
- `QA_REPORT_FEEDBACK_ITEMS_1_5.md`

Untracked unrelated file:

- `HARNESS_ENGINEERING_REPORT.md`

Do not push unless the user explicitly requests it.
