import { createFileRoute } from "@tanstack/react-router";
import { OperationsHub } from "@/components/operations/OperationsHub";

export const Route = createFileRoute("/operations")({
  head: () => ({ meta: [{ title: "Operations — CarePath" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  return <OperationsHub />;
}
