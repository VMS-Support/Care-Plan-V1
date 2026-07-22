import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/archived")({
  head: () => ({ meta: [{ title: "Archived Certificates - NuCare" }] }),
  component: () => <CertificateManagement initialTab="archived" />,
});
