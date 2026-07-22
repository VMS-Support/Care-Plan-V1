import { createFileRoute } from "@tanstack/react-router";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";

export const Route = createFileRoute("/maintenance/contractors/$contractorId")({
  head: () => ({ meta: [{ title: "Contractor Profile - NuCare" }] }),
  component: ContractorDetailRoute,
});

function ContractorDetailRoute() {
  const { contractorId } = Route.useParams();
  return <ContractorManagement mode="detail" contractorId={contractorId} />;
}
