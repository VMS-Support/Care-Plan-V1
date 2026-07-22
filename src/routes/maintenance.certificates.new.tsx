import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/new")({
  head: () => ({ meta: [{ title: "Create Certificate - NuCare" }] }),
  component: () => <CertificateManagement mode="new" />,
});
