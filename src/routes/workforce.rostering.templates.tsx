import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/templates")({
  head: () => ({ meta: [{ title: "Roster Templates - NuCare" }] }),
  component: RosteringWorkspace,
});
