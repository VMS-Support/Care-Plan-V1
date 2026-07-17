import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/changes")({
  head: () => ({ meta: [{ title: "Roster Changes - NuCare" }] }),
  component: RosteringWorkspace,
});
