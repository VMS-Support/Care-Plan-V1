import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/reports")({
  head: () => ({ meta: [{ title: "Roster Reports - NuCare" }] }),
  component: RosteringWorkspace,
});
