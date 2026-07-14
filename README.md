# ORDOSPACE Sprint 5

ORDOSPACE Sprint 5 is a static HTML/CSS/JavaScript prototype for a multi-role project workspace.

The original submission started as a single `index.html`. The current codebase keeps the same product surface while splitting data, routing, services, screens, UI helpers, QA, and build assets into documented folders.

## Current Entry Points

- `index.html`
  - Static app entry and screen markup.
  - Loads local generated Tailwind CSS and local vendored Lucide.
  - Still keeps some static screen markup inline; HTML partial extraction is not part of the current scope.
- `app/styles/app.css`
  - App-specific CSS outside generated Tailwind utilities.
- `app/main.js`
  - Remaining runtime glue for initialization, legacy event wiring, inquiry/support flows, and a few no-op guarded renderers.
  - This is no longer the whole app, but it is still a mixed file and should be split further in small follow-up rounds.

## Route Surface

Current canonical screens are defined in `app/config/app.config.js`.

- Public: `landing`, `auth`, `terms`, `privacy`, `support`, `select-workspace`, `forbidden-403`
- Client: `dashboard`, `project`, `approvals`, `profile`
- Worker: `worker-home`, `worker-cards`
- Admin: `admin-home`, `admin-projects`, `admin-cards`, `admin-team`, `admin-audit`
- Dev-only: `components-gallery` when `dev_mode` is on

Legacy room routes such as `project-room`, `action-room`, and `report-room` are aliases only. They should not be restored as live screens unless the product direction changes.

## Build

Install pinned dependencies:

```powershell
npm install
```

Generate local assets:

```powershell
npm run build
```

The build produces:

- `app/styles/tailwind.build.css`
- `app/vendor/lucide/lucide.min.js`

See `BUILD.md` for the dependency policy.

## Verification

Run the local checks after structural, routing, or dependency changes:

```powershell
npm run build
npm run check:js
npm run static:validate-lifecycle
npm run static:validate-components
npm run smoke
git diff --check
```

`npm run smoke` opens the app in a real browser and also runs `window.ORDO_QA.run()`.
The two `static:validate-*` checks run the lifecycle service and the UI component factories in a Node vm without a browser.

## Maintenance Rules

- Keep user-facing copy, CTA labels, logo text, and route behavior stable unless explicitly requested.
- Add new behavior in the smallest responsible layer: `screens/` for screen renderers, `ui/components/` for shared HTML factories (`window.ORDO_UI_COMPONENTS`), `ui/` for remaining view fragments, `repos/` for read/query helpers, `services/` for session/lifecycle behavior, and `data/` for static sample data.
- ModuleCard mutations go through `app/services/module-card-lifecycle.service.js` only; UI factories must not mutate cards or bind events.
- Keep generated files reproducible through `npm run build`.
- Do not add runtime Tailwind CDN or unpinned Lucide CDN references.
- Treat `HARNESS_ENGINEERING_REPORT.md` as unrelated unless a later task explicitly asks for it.

## Componentization Follow-Up

- `CLAUDE_COMPONENTIZATION_HANDOFF.md` is the handoff document for Claude Code, another Codex account, or a future agent.
- `COMPONENTIZATION_REFACTOR_PLAN.md` is the implementation blueprint for splitting the existing static UI into component-sized units without replacing the public ORDOSPACE UI.
