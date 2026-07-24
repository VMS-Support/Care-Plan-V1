import { createFileRoute } from "@tanstack/react-router";
import { CorrectiveActionManagement } from "@/components/maintenance/CorrectiveActionManagement";
export const Route = createFileRoute("/maintenance/corrective-actions/$id")({ component: () => <CorrectiveActionManagement mode="detail" actionId={Route.useParams().id} /> });
