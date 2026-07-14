import { createHashRouter } from "react-router-dom";

import {
  AppShell,
  AuthScreen,
  ModuleCardDetailScreen,
  NotFoundScreen,
  OverviewScreen,
  RequireRole,
  WorkspaceRedirectScreen,
  RoleWorkspaceScreen,
} from "./App.jsx";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewScreen /> },
      { path: "auth", element: <AuthScreen /> },
      { path: "workspace", element: <WorkspaceRedirectScreen /> },
      {
        path: "workspace/admin",
        element: (
          <RequireRole role="admin">
            <RoleWorkspaceScreen role="admin" />
          </RequireRole>
        ),
      },
      {
        path: "workspace/admin/cards/:cardId",
        element: (
          <RequireRole role="admin">
            <ModuleCardDetailScreen role="admin" />
          </RequireRole>
        ),
      },
      {
        path: "workspace/worker",
        element: (
          <RequireRole role="worker">
            <RoleWorkspaceScreen role="worker" />
          </RequireRole>
        ),
      },
      {
        path: "workspace/worker/cards/:cardId",
        element: (
          <RequireRole role="worker">
            <ModuleCardDetailScreen role="worker" />
          </RequireRole>
        ),
      },
      {
        path: "workspace/client",
        element: (
          <RequireRole role="client">
            <RoleWorkspaceScreen role="client" />
          </RequireRole>
        ),
      },
      {
        path: "workspace/client/cards/:cardId",
        element: (
          <RequireRole role="client">
            <ModuleCardDetailScreen role="client" />
          </RequireRole>
        ),
      },
      { path: "*", element: <NotFoundScreen /> },
    ],
  },
]);
