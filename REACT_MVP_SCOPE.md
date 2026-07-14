# ORDOSPACE React MVP Scope

## Round 1 Baseline

- Production URL: https://ordospace-sprint5.vercel.app/
- Protected baseline commit: `9235223edccacb890d43e8f4cc1a9b53bf75be2e`
- Local rollback tag: `react-mvp-baseline-20260630`
- Working branch: `react-mvp-modulecard-lifecycle`
- Source requirement note: `frontend_mvp_mission_requirements_integrated.md` from the 260630 archive.

The existing deployed static site is the reference version. React MVP work starts from a separate branch so the current Vercel production route can remain stable until the new version is intentionally reviewed and deployed.

## Round 2 Scope Lock

The MVP will not attempt to rebuild every existing ORDOSPACE screen. The first React version will implement one complete, demonstrable product loop around a shared `ModuleCard` lifecycle.

Think of the MVP as one delivery box moving through four desks:

1. Admin creates a module card and assigns it.
2. Worker updates progress, quality status, work notes, and submits it.
3. Admin reviews the submitted card and sends it to the client.
4. Client approves it or requests a revision.

That single box must actually move, keep its labels, and remember its history after refresh.

## Selected MVP Features

### 1. Local authentication and role routing

- Provide login/logout with local persistence.
- Route users into role-appropriate workspaces.
- Keep role logic simple and visible enough for review.

### 2. ModuleCard list, detail, and lifecycle actions

- Show cards in list form.
- Open a card detail view.
- Support status changes across admin, worker, and client roles.
- Keep the card model shared across all role views.

### 3. User interaction and state handling

- Add practical form interactions: create, edit, filter, comment, validate, and confirm.
- Include empty states, loading states where useful, and error/validation messages.
- Use React state first; introduce heavier state tools only if a later round proves they are necessary.

### 4. Local data persistence and activity history

- Store module cards and session state in localStorage.
- Preserve important changes after refresh.
- Maintain a readable activity log for review evidence.

## In Scope

- Vite React setup in a later round.
- React Router based navigation.
- Shared data model for users, roles, module cards, comments, and activity events.
- Reusable UI primitives for buttons, inputs, cards, badges, dialogs, and filters.
- Role-specific views built from the same underlying card data.
- Build verification, browser verification, and final Vercel deployment after approval.

## Out of Scope For This Pass

- Full migration of every current static screen.
- Rebuilding the removed room dashboard subsystem.
- Separate large systems for client, admin, and worker.
- Real backend API integration.
- JSON Server or MirageJS unless a later round shows localStorage is insufficient.
- Broad landing page redesign.
- Pushing to production before review and approval.

## Acceptance Checklist

- The app builds without errors.
- Login/logout works and survives refresh.
- Role routing works for admin, worker, and client.
- A module card can move through create, assign, update, review, send, approve, and revision-request states.
- Filters, detail view, comments, validation, and empty states are visible in the browser.
- Data persists after refresh through localStorage.
- The final GitHub repository is public and up to date.
- The final Vercel deployment URL opens successfully and demonstrates the MVP flow.

## Round Map Anchor

- Round 1: Protect deployed baseline and create working branch.
- Round 2: Lock MVP scope in this document.
- Round 3: Add minimal React/Vite foundation.
- Round 4: Define shared MVP data model and seed data.
- Round 5: Build app shell, routing, and local login.
- Round 6: Build reusable UI primitives.
- Round 7: Build ModuleCard list and detail views.
- Round 8: Build admin create and assign flow.
- Round 9: Build worker update, note, QC, and submit flow.
- Round 10: Build admin review and send flow.
- Round 11: Build client approve and revision flow.
- Round 12: Add filters, search, and status grouping.
- Round 13: Add activity log and persistence hardening.
- Round 14: Add empty, loading, error, and validation states.
- Round 15: Run local build and browser QA.
- Round 16: Fix QA findings.
- Round 17: Prepare GitHub and Vercel release candidate.
- Round 18: Deploy, verify, and produce final submission evidence.
