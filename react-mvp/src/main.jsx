import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { ModuleCardStoreProvider } from "./cards/ModuleCardStoreContext.jsx";
import { router } from "./router.jsx";
import { SessionProvider } from "./session/SessionContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SessionProvider>
      <ModuleCardStoreProvider>
        <RouterProvider router={router} />
      </ModuleCardStoreProvider>
    </SessionProvider>
  </React.StrictMode>,
);
