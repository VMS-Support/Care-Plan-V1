import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/conflicts")({
  head: () => ({ meta: [{ title: "Roster Conflicts - NuCare" }] }),
  component: RosteringWorkspace,
});
