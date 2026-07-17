import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/requirements")({
  head: () => ({ meta: [{ title: "Staffing Requirements - NuCare" }] }),
  component: RosteringWorkspace,
});
