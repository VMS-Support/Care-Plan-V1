import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/vacant")({
  head: () => ({ meta: [{ title: "Vacant Shifts - NuCare" }] }),
  component: RosteringWorkspace,
});
