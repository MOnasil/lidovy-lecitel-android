import { createFileRoute, redirect } from "@tanstack/react-router";

// "Co mám doma" was folded into Atlas (button "Mám doma") and the table at the top of Zahrádka.
export const Route = createFileRoute("/doma")({
  beforeLoad: () => {
    throw redirect({ to: "/zahradka", replace: true });
  },
});
