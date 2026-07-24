import { createFileRoute } from "@tanstack/react-router";
import { CorrectiveActionManagement } from "@/components/maintenance/CorrectiveActionManagement";

export const Route = createFileRoute("/maintenance/corrective-actions")({
  head: () => ({ meta: [{ title: "Corrective Actions - NuCare" }] }),
  component: () => <CorrectiveActionManagement mode="register" />,
});
