import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/interventions")({
  beforeLoad: () => {
    throw redirect({ to: "/operations" });
  },
});
