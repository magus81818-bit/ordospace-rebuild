# app

This folder contains the runtime code for the ORDOSPACE static prototype.

The app remains framework-free. Responsibilities are split by ownership so that future work can change one layer at a time without turning `index.html` or `app/main.js` back into the only place to look.

| Folder | Owns | Plain meaning |
|---|---|---|
| `config/` | roles, menus, routes, CTA labels | operating policy |
| `data/` | static sample records | temporary data store |
| `repos/` | data lookup, sorting, aggregation | read/query layer |
| `services/` | session, role switching, fake login | business flow helpers |
| `router/` | hash navigation, aliases, role guard | traffic controller |
| `layout/` | shell, sidebar, drawer, topbar, theme hooks | app frame |
| `screens/` | role-specific visible screens | screen body |
| `ui/` | repeated card, badge, list, progress helpers | reusable parts |
| `styles/` | generated Tailwind CSS and app CSS | visual styling |
| `qa/` | smoke and runtime checks | inspection tools |
| `vendor/` | local browser bundles from pinned packages | vendored assets |

## Current Split

- Router: `router/hash-router.js`
- Session service: `services/session.service.js`
- Static room data: `data/room.data.js`
- Workspace sample data: `data/workspace.data.js`
- Room repository helpers: `repos/room.repo.js`
- Shell/layout behavior: `layout/app-shell.js`
- Room UI helpers: `ui/room.ui.js`
- Workspace UI helpers: `ui/workspace.ui.js`
- Auth screen: `screens/auth.screen.js`
- Client screens: `screens/client-workspace.screen.js`
- Report center: `screens/report-center.screen.js`
- Documents/change screens: `screens/documents.screen.js`
- Admin screens: `screens/admin-workspace.screen.js`
- Worker screens: `screens/worker-workspace.screen.js`
- Browser runtime QA: `qa/runtime-qa.js`
- Browser smoke harness: `qa/smoke-check.js`

## `main.js`

`main.js` is no longer the whole app, but it is not a thin file yet.

It currently keeps remaining initialization, legacy guarded renderers, inquiry/support flows, and event wiring that have not been moved into a clearer owner. When adding new work, place it in the responsible folder first. Only touch `main.js` when the existing flow still depends on it.

## Build Assets

Tailwind and Lucide are pinned through root package files.

- Tailwind source: `styles/tailwind.input.css`
- Tailwind output: `styles/tailwind.build.css`
- Lucide output: `vendor/lucide/lucide.min.js`

Run `npm run build` from the repo root after changing Tailwind classes, Tailwind config, or Lucide vendor setup.

## Out of Scope for This Split

- Framework migration.
- HTML partial generation.
- Large renderer refactor inside admin/worker workspace screens.
- Complete CSS module split.
