import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering/availability")({
  head: () => ({ meta: [{ title: "Staff Availability - NuCare" }] }),
  component: RosteringWorkspace,
});
