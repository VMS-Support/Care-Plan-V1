import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/agency")({
  head: () => ({ meta: [{ title: "Agency Cover - NuCare" }] }),
  component: RosteringWorkspace,
});
