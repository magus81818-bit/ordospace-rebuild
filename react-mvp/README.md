# ORDOSPACE React MVP

This folder contains the React MVP work area. It is intentionally separate from the existing static production app until the React release candidate is reviewed.

## Commands

- `npm run mvp:dev` starts the React MVP development server.
- `npm run mvp:build` builds the React MVP into `dist-react/`.
- `npm run mvp:smoke` runs the React MVP lifecycle in a real browser against a temporary dev server.
- `npm run mvp:smoke:preview` runs the same browser lifecycle smoke against the built `dist-react/` artifact through Vite preview.
- `npm run mvp:release-check` runs validators, builds `dist-react/`, and smokes the built artifact.
- `npm run build` still builds the existing static production app.

## Current Round

Round 17 keeps the React MVP as a preview-first release candidate. The production static app remains unchanged until the release candidate is reviewed and the user explicitly approves a cutover.

## Data Model

- `src/domain/module-card.model.mjs` owns roles, statuses, lifecycle steps, transitions, and query helpers.
- `src/data/mvp-seed.mjs` owns seed users, ModuleCards, comments, and activity events.
- `scripts/validate-seed.mjs` verifies that seed records reference valid users, cards, statuses, priorities, and activity types.

## Session Model

- `src/session/session.service.mjs` owns the localStorage session contract and route helpers.
- `src/session/SessionContext.jsx` exposes sign in, sign out, current user, and authentication state to React screens.
- `scripts/validate-session.mjs` verifies the seed-user session contract without a browser.

## UI Primitives

- `src/ui/Button.jsx` owns app-level button and link variants.
- `src/ui/StatusCard.jsx` owns status cards and status-card grids.
- `src/ui/Panel.jsx` owns reusable data panels, notice panels, and metric lists.
- `src/ui/Feedback.jsx` owns shared form feedback and empty-state panels.
- `src/ui/AccountOption.jsx` owns selectable seed account cards.
- `src/ui/ModulePreviewCard.jsx` owns ModuleCard preview display.
- `src/ui/SessionCard.jsx` owns the sidebar session summary.

## Release Candidate

See `../REACT_MVP_RELEASE_CANDIDATE.md` for the preview-first release path and Vercel preview guardrails.
