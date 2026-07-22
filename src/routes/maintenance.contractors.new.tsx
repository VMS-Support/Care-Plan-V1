import { createFileRoute } from "@tanstack/react-router";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";

export const Route = createFileRoute("/maintenance/contractors/new")({
  head: () => ({ meta: [{ title: "New Contractor - NuCare" }] }),
  component: () => <ContractorManagement mode="new" />,
});
