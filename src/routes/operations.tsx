import { createFileRoute, redirect } from "@tanstack/react-router";

// Keep legacy bookmarks and saved landing-page preferences working after
// Operations was replaced by Fast Care.
export const Route = createFileRoute("/operations")({
  beforeLoad: () => {
    throw redirect({ to: "/fast-care", replace: true });
  },
});
