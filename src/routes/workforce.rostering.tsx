import { createFileRoute } from "@tanstack/react-router";
import { RosteringWorkspace } from "@/components/workforce/RosteringWorkspace";

export const Route = createFileRoute("/workforce/rostering")({
  head: () => ({ meta: [{ title: "Rostering - NuCare" }] }),
  component: RosteringWorkspace,
});
