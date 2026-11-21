import { createFileRoute, redirect } from "@tanstack/react-router";

// The former "Babské rady" page: its content now lives in Interakce.
export const Route = createFileRoute("/babske")({
  beforeLoad: () => {
    throw redirect({ to: "/interakce" });
  },
});
