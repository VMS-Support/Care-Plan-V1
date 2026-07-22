import { createFileRoute } from "@tanstack/react-router";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";

export const Route = createFileRoute("/maintenance/contractors")({
  head: () => ({ meta: [{ title: "Maintenance Contractors - NuCare" }] }),
  component: () => <ContractorManagement />,
});
