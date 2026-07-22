import { createFileRoute } from "@tanstack/react-router";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";

export const Route = createFileRoute("/maintenance/contractors/register")({
  head: () => ({ meta: [{ title: "Contractor Register - NuCare" }] }),
  component: () => <ContractorManagement initialTab="register" />,
});
