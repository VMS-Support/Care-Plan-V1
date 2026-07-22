import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/missing")({
  head: () => ({ meta: [{ title: "Missing Certificates - NuCare" }] }),
  component: () => <CertificateManagement initialTab="missing" />,
});
