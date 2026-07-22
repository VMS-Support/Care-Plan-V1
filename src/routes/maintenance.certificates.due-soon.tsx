import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/due-soon")({
  head: () => ({ meta: [{ title: "Certificates Due Soon - NuCare" }] }),
  component: () => <CertificateManagement initialTab="dueSoon" />,
});
