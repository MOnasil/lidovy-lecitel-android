import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { listenForAuthLinks } from "./native/deepLinks";
import { setupOwnAvatar } from "./native/avatar";

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  context: { queryClient },
  history: createHashHistory(),
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

listenForAuthLinks((to) => void router.navigate({ to: to as "/" }));
setupOwnAvatar();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
