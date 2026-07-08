import { createFileRoute } from "@tanstack/react-router";
import { TaskWorkflowEngine } from "@/components/care/TaskWorkflowEngine";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks - CarePath" }] }),
  component: TaskWorkflowEngine,
});
