import { createFileRoute } from "@tanstack/react-router";
import { GenerateHandover } from "@/components/care/GeneratedHandover";

export const Route = createFileRoute("/handovers_/generate")({
  head: () => ({ meta: [{ title: "Generate Handover — CarePath" }] }),
  component: GenerateHandover,
});
