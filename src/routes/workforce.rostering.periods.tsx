import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/periods")({
  head: () => ({ meta: [{ title: "Roster Periods - NuCare" }] }),
  component: RosteringWorkspace,
});
