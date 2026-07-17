import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "./workforce.rostering";

export const Route = createFileRoute("/workforce/rostering/agency")({
  head: () => ({ meta: [{ title: "Agency Cover - NuCare" }] }),
  component: RosteringWorkspace,
});
