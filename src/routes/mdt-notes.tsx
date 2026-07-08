import { createFileRoute } from "@tanstack/react-router";
import { MDTWorkspace } from "@/components/care/MDTWorkspace";

export const Route = createFileRoute("/mdt-notes")({
  head: () => ({ meta: [{ title: "MDT - CarePath" }] }),
  component: MDTWorkspace,
});
