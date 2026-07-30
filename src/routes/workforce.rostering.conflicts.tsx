import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/conflicts")({
  head: () => ({ meta: [{ title: "Roster Conflicts - NuCare" }] }),
  component: RosteringWorkspace,
});
