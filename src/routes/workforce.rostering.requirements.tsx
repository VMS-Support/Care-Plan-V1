import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/requirements")({
  head: () => ({ meta: [{ title: "Staffing Requirements - NuCare" }] }),
  component: RosteringWorkspace,
});
