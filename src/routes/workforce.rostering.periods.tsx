import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/periods")({
  head: () => ({ meta: [{ title: "Roster Periods - NuCare" }] }),
  component: RosteringWorkspace,
});
