# screens

Screen files own user-visible role surfaces. They may call services, repos, and UI helpers, but they should stay focused on rendering a screen-level flow.

## Current Files

- `auth.screen.js`
  - Login, password recovery, password reset, signup modal entry, and fake login entry.
  - Calls `app/services/session.service.js` when creating a fake login session.

- `client-workspace.screen.js`
  - Client dashboard, project view, approval flow, card detail modal, and deliverable approval interactions.
  - Uses ModuleCard helpers while the static prototype continues to be split.

- `report-center.screen.js`
  - Report center rendering and approval/rejection sheet behavior.

- `documents.screen.js`
  - Document, change request, profile, terms, privacy, and support screens.

- `admin-workspace.screen.js`
  - Admin home, project management, ModuleCard management, team/resource, and audit screens.
  - This file is intentionally left for feedback item 5 because it still contains large template renderers.

- `worker-workspace.screen.js`
  - Worker home and worker card/task screens.

## Current Route Surface

The canonical screen list is in `app/config/app.config.js`.

- Client: `dashboard`, `project`, `approvals`, `profile`
- Worker: `worker-home`, `worker-cards`
- Admin: `admin-home`, `admin-projects`, `admin-cards`, `admin-team`, `admin-audit`

Deleted room and older task/report screens are handled through aliases or QA deny-list checks, not through live screen DOM.
