import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/templates")({
  head: () => ({ meta: [{ title: "Roster Templates - NuCare" }] }),
  component: RosteringWorkspace,
});
