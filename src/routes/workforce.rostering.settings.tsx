import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/settings")({
  head: () => ({ meta: [{ title: "Rostering Settings - NuCare" }] }),
  component: RosteringWorkspace,
});
