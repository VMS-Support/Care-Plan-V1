import { createFileRoute } from "@tanstack/react-router";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";

export const Route = createFileRoute("/maintenance/contractors/$contractorId/edit")({
  head: () => ({ meta: [{ title: "Edit Contractor - NuCare" }] }),
  component: ContractorEditRoute,
});

function ContractorEditRoute() {
  const { contractorId } = Route.useParams();
  return <ContractorManagement mode="edit" contractorId={contractorId} />;
}
