import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/vacant")({
  head: () => ({ meta: [{ title: "Vacant Shifts - NuCare" }] }),
  component: RosteringWorkspace,
});
