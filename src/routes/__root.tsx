// Android app root: no web document shell (index.html is the document), no service worker.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Layout } from "../components/ll/Layout";
import { AppStateProvider } from "../lib/ll/store";

function NotFound() {
  return (
    <div className="box">
      <h2>Stránka nenalezena</h2>
      <Link to="/">Na úvod</Link>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <Layout>
          <Outlet />
        </Layout>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});
