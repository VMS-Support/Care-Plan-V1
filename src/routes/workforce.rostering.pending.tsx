import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/pending")({
  head: () => ({ meta: [{ title: "Pending Confirmation - NuCare" }] }),
  component: RosteringWorkspace,
});
