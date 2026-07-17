import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/reports")({
  head: () => ({ meta: [{ title: "Roster Reports - NuCare" }] }),
  component: RosteringWorkspace,
});
