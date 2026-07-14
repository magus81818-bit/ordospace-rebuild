import { useMemo, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { ActivityReviewPanel } from "./cards/ActivityReviewPanel.jsx";
import { AdminCreateModuleCardPanel } from "./cards/AdminCreateModuleCardPanel.jsx";
import { AdminReviewModuleCardPanel } from "./cards/AdminReviewModuleCardPanel.jsx";
import { ClientDecisionModuleCardPanel } from "./cards/ClientDecisionModuleCardPanel.jsx";
import { useModuleCardStore } from "./cards/ModuleCardStoreContext.jsx";
import { WorkerSubmitModuleCardPanel } from "./cards/WorkerSubmitModuleCardPanel.jsx";
import { WorkerUpdateModuleCardPanel } from "./cards/WorkerUpdateModuleCardPanel.jsx";
import { createActivityReview } from "./cards/module-card-activity-review.mjs";
import { mvpSeed } from "./data/mvp-seed.mjs";
import {
  LIFECYCLE_STEPS,
  ROLES,
  getAvailableTransitions,
  getActivityForCard,
  getCardById,
  getCardsForRole,
  getCommentsForCard,
  getDisplayNameForUser,
  getRoleLabel,
  sortCardsByDueDate,
  summarizeModuleCards,
} from "./domain/module-card.model.mjs";
import { useSession } from "./session/SessionContext.jsx";
import {
  getSafePostLoginPath,
  getWorkspacePathForRole,
} from "./session/session.service.mjs";
import {
  AccountOption,
  AppButton,
  AppLink,
  DataPanel,
  EmptyStatePanel,
  MetricList,
  ModuleDetailPanel,
  ModulePreviewCard,
  NoticePanel,
  SessionCard,
  StatusCard,
  StatusGrid,
} from "./ui/index.js";

const navItems = [
  { to: "/", label: "Overview", public: true },
  { to: "/auth", label: "Login", public: true },
  { to: "/workspace/admin", label: "Admin", role: "admin" },
  { to: "/workspace/worker", label: "Worker", role: "worker" },
  { to: "/workspace/client", label: "Client", role: "client" },
];

const roleNotes = {
  admin: [
    "Create and assign ModuleCards.",
    "Review submitted work before client delivery.",
  ],
  worker: [
    "Update progress, QC status, and work notes.",
    "Submit ready ModuleCards for admin review.",
  ],
  client: [
    "Review delivered ModuleCards.",
    "Approve or request a revision.",
  ],
};

export function AppShell() {
  const { session, currentUser, isAuthenticated, signOut } = useSession();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter(
    (item) => item.public || item.role === session?.role,
  );

  function handleSignOut() {
    signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="React MVP navigation">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            O
          </span>
          <span>
            <strong>ORDOSPACE</strong>
            <small>React MVP</small>
          </span>
        </Link>

        <nav className="nav-list">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <SessionCard
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onSignOut={handleSignOut}
        />
      </aside>

      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}

export function OverviewScreen() {
  const { isAuthenticated, currentUser } = useSession();
  const { moduleCards } = useModuleCardStore();
  const summary = summarizeModuleCards(moduleCards);
  const lifecycleRows = LIFECYCLE_STEPS.map((step) => {
    const count = step.statuses.reduce(
      (total, status) => total + (summary.byStatus[status] ?? 0),
      0,
    );

    return {
      id: step.id,
      label: step.label,
      value: formatCardCount(count),
    };
  });
  const workspacePath = currentUser
    ? getWorkspacePathForRole(currentUser.role)
    : "/auth";

  return (
    <section className="page-stack">
      <p className="eyebrow">Round 16 browser-verified flow</p>
      <h1>Local ModuleCard state powers role work.</h1>
      <p className="lead">
        Seed users can sign in locally, view role-filtered ModuleCards, and
        run admin create, worker progress, worker submit, and admin client
        review send, plus client approve or revision decisions in the current
        app session. ModuleCard changes now survive refresh through
        localStorage, with role-scoped activity review, form validation, and
        browser-smoked lifecycle checks.
      </p>

      <div className="action-row">
        <AppLink to={workspacePath}>
          {isAuthenticated ? "Open my workspace" : "Choose an account"}
        </AppLink>
        {isAuthenticated ? (
          <span className="inline-note">
            Signed in as {currentUser.name} - {getRoleLabel(currentUser.role)}
          </span>
        ) : null}
      </div>

      <StatusGrid ariaLabel="Round 16 checkpoints">
        <StatusCard
          title="ModuleCards"
          value={String(moduleCards.length)}
          meta={`${summary.averageProgress}% average progress`}
        />
        <StatusCard
          title="Session"
          value={isAuthenticated ? "Active" : "Required"}
          meta="Stored in localStorage"
        />
        <StatusCard
          title="ModuleCard store"
          value="Persistent"
          meta="Cards, comments, activities"
        />
        <StatusCard
          title="Protected roles"
          value="3"
          meta="Admin, worker, client"
        />
      </StatusGrid>

      <DataPanel>
        <h2>Lifecycle coverage</h2>
        <MetricList rows={lifecycleRows} />
      </DataPanel>
    </section>
  );
}

export function AuthScreen() {
  const { session, currentUser, isAuthenticated, signIn, signOut } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState(
    session?.userId ?? mvpSeed.users[0].id,
  );
  const selectedUser = useMemo(
    () => mvpSeed.users.find((user) => user.id === selectedUserId),
    [selectedUserId],
  );

  function handleSubmit(event) {
    event.preventDefault();
    const nextSession = signIn(selectedUserId);
    const nextPath = getSafePostLoginPath(
      searchParams.get("next"),
      nextSession.role,
    );
    navigate(nextPath, { replace: true });
  }

  function handleSignOut() {
    signOut();
    setSelectedUserId(mvpSeed.users[0].id);
  }

  return (
    <section className="page-stack">
      <p className="eyebrow">Local session</p>
      <h1>Choose a seed account to enter the MVP.</h1>
      <p className="lead">
        This is a local MVP login. It stores the selected seed account in
        localStorage so refresh keeps the same role.
      </p>

      {isAuthenticated ? (
        <NoticePanel
          actions={
            <>
              <AppLink to={getWorkspacePathForRole(currentUser.role)}>
                Open workspace
              </AppLink>
              <AppButton variant="secondary" onClick={handleSignOut}>
                Log out
              </AppButton>
            </>
          }
        >
          <strong>{currentUser.name} is signed in.</strong>
          <span>
            {getRoleLabel(currentUser.role)} session - {currentUser.email}
          </span>
        </NoticePanel>
      ) : null}

      <form className="data-panel login-panel" onSubmit={handleSubmit}>
        <h2>Seed accounts</h2>
        <div className="account-grid" role="radiogroup" aria-label="Seed accounts">
          {mvpSeed.users.map((user) => (
            <AccountOption
              checked={selectedUserId === user.id}
              key={user.id}
              onChange={() => setSelectedUserId(user.id)}
              user={user}
            />
          ))}
        </div>

        <AppButton type="submit">
          Sign in as {selectedUser?.name ?? "selected user"}
        </AppButton>
      </form>
    </section>
  );
}

export function WorkspaceRedirectScreen() {
  const { session, isAuthenticated } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to={`/auth?next=${encodeURIComponent(location.pathname)}`}
      />
    );
  }

  return <Navigate replace to={getWorkspacePathForRole(session.role)} />;
}

export function RequireRole({ children, role }) {
  const { session, isAuthenticated } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to={`/auth?next=${encodeURIComponent(location.pathname)}`}
      />
    );
  }

  if (session.role !== role) {
    return <Navigate replace to={getWorkspacePathForRole(session.role)} />;
  }

  return children;
}

export function RoleWorkspaceScreen({ role }) {
  const { currentUser } = useSession();
  const { activities, createAssignedModuleCard, moduleCards } =
    useModuleCardStore();
  const notes = roleNotes[role] ?? [];
  const visibleCards = sortCardsByDueDate(
    getCardsForRole(moduleCards, role, currentUser?.id),
  );
  const activityReview = createActivityReview({
    activities,
    cards: moduleCards,
    role,
    userId: currentUser?.id,
    users: mvpSeed.users,
  });
  const workers = useMemo(
    () => mvpSeed.users.filter((user) => user.role === ROLES.WORKER),
    [],
  );

  return (
    <section className="page-stack">
      <p className="eyebrow">{role} workspace</p>
      <h1>{getRoleLabel(role)} workspace is protected.</h1>
      <p className="lead">
        You are viewing this route as {currentUser.name}. This list shows the
        ModuleCards available to the signed-in role.
      </p>

      <ul className="check-list">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <StatusGrid ariaLabel={`${role} seed summary`} compact>
        <StatusCard
          title="Signed in user"
          value={currentUser.name}
          meta={currentUser.email}
        />
        <StatusCard
          title="Visible cards"
          value={String(visibleCards.length)}
          meta="Role-filtered seed view"
        />
        <StatusCard
          title="Open actions"
          value={String(countAvailableActions(visibleCards, role))}
          meta="Based on status transitions"
        />
        <StatusCard
          title="Audit events"
          value={String(activityReview.total)}
          meta="Role-visible activity"
        />
      </StatusGrid>

      <ActivityReviewPanel review={activityReview} role={role} />

      {role === ROLES.ADMIN ? (
        <AdminCreateModuleCardPanel
          currentUser={currentUser}
          onCreate={(input) =>
            createAssignedModuleCard(input, currentUser.id)
          }
          workers={workers}
        />
      ) : null}

      {visibleCards.length > 0 ? (
        <div className="card-preview-list" aria-label={`${role} ModuleCards`}>
          {visibleCards.map((card) => (
            <ModulePreviewCard
              assigneeName={getDisplayNameForUser(mvpSeed.users, card.assigneeId)}
              card={card}
              clientName={getDisplayNameForUser(mvpSeed.users, card.clientId)}
              detailTo={`/workspace/${role}/cards/${card.id}`}
              key={card.id}
              role={role}
            />
          ))}
        </div>
      ) : (
        <EmptyStatePanel
          copy="No ModuleCards are currently visible for this role and account. New assignments or review handoffs will appear here."
          title="No visible ModuleCards"
        />
      )}
    </section>
  );
}

export function ModuleCardDetailScreen({ role }) {
  const { cardId } = useParams();
  const { currentUser } = useSession();
  const {
    activities,
    comments,
    decideClientModuleCard,
    moduleCards,
    sendAdminModuleCardToClientReview,
    submitWorkerModuleCard,
    updateWorkerModuleCard,
  } = useModuleCardStore();
  const visibleCards = getCardsForRole(moduleCards, role, currentUser?.id);
  const card = getCardById(visibleCards, cardId);

  if (!card) {
    return (
      <section className="page-stack">
        <p className="eyebrow">Card unavailable</p>
        <h1>This ModuleCard is not available for your role.</h1>
        <p className="lead">
          Return to your workspace to choose a card from the role-filtered list.
        </p>
        <AppLink to={getWorkspacePathForRole(role)}>Back to workspace</AppLink>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <p className="eyebrow">{role} card detail</p>
      <h1>{card.title}</h1>
      <p className="lead">
        Detail view for {currentUser.name}. Lifecycle actions use local state,
        validation, and role-specific visibility.
      </p>

      <div className="action-row">
        <AppLink to={getWorkspacePathForRole(role)} variant="secondary">
          Back to list
        </AppLink>
      </div>

      {role === ROLES.WORKER ? (
        <>
          <WorkerUpdateModuleCardPanel
            card={card}
            currentUser={currentUser}
            onUpdate={(input) =>
              updateWorkerModuleCard(card.id, input, currentUser.id)
            }
          />
          <WorkerSubmitModuleCardPanel
            card={card}
            currentUser={currentUser}
            onSubmit={(input) =>
              submitWorkerModuleCard(card.id, input, currentUser.id)
            }
          />
        </>
      ) : null}

      {role === ROLES.ADMIN ? (
        <AdminReviewModuleCardPanel
          card={card}
          currentUser={currentUser}
          onSend={(input) =>
            sendAdminModuleCardToClientReview(card.id, input, currentUser.id)
          }
        />
      ) : null}

      {role === ROLES.CLIENT ? (
        <ClientDecisionModuleCardPanel
          card={card}
          currentUser={currentUser}
          onDecide={(input) =>
            decideClientModuleCard(card.id, input, currentUser.id)
          }
        />
      ) : null}

      <ModuleDetailPanel
        activities={getActivityForCard(activities, card.id)}
        assigneeName={getDisplayNameForUser(mvpSeed.users, card.assigneeId)}
        card={card}
        clientName={getDisplayNameForUser(mvpSeed.users, card.clientId)}
        comments={getCommentsForCard(comments, card.id)}
        role={role}
      />
    </section>
  );
}

export function NotFoundScreen() {
  return (
    <section className="page-stack">
      <p className="eyebrow">Route fallback</p>
      <h1>This React MVP route does not exist yet.</h1>
      <p className="lead">
        Use the navigation to return to a connected MVP checkpoint route.
      </p>
      <AppLink to="/">Back to overview</AppLink>
    </section>
  );
}

function countAvailableActions(cards, role) {
  return cards.reduce(
    (total, card) => total + getAvailableTransitions(card, role).length,
    0,
  );
}

function formatCardCount(count) {
  return `${count} ${count === 1 ? "card" : "cards"}`;
}
