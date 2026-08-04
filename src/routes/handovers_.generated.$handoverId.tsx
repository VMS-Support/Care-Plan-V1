import { createFileRoute } from "@tanstack/react-router";
import { ManagedGeneratedHandoverView } from "@/components/care/ManagedGeneratedHandover";

export const Route = createFileRoute("/handovers_/generated/$handoverId")({
  head: () => ({ meta: [{ title: "Generated Handover — CarePath" }] }),
  component: Page,
});

function Page() {
  const { handoverId } = Route.useParams();
  return <ManagedGeneratedHandoverView handoverId={handoverId} />;
}
