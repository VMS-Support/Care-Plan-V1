import { createFileRoute } from "@tanstack/react-router";
import { CorrectiveActionManagement } from "@/components/maintenance/CorrectiveActionManagement";
export const Route = createFileRoute("/maintenance/corrective-actions/$id/edit")({ component: () => <CorrectiveActionManagement mode="edit" actionId={Route.useParams().id} /> });
