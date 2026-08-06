import { createFileRoute } from "@tanstack/react-router";
import { ContractorsCertificatesWorkspace } from "@/components/maintenance/ContractorsCertificatesWorkspace";

export const Route = createFileRoute("/maintenance/contractors-certificates")({
  head: () => ({ meta: [{ title: "Contractors & Certificates - ORITAS" }] }),
  component: ContractorsCertificatesWorkspace,
});
