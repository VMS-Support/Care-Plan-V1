import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/current")({
  head: () => ({ meta: [{ title: "Current Roster - NuCare" }] }),
  component: RosteringWorkspace,
});
