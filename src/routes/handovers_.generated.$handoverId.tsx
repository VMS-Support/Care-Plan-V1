import { createFileRoute } from "@tanstack/react-router";
import { GeneratedHandoverView } from "@/components/care/GeneratedHandover";

export const Route = createFileRoute("/handovers_/generated/$handoverId")({
  head: () => ({ meta: [{ title: "Generated Handover — CarePath" }] }),
  component: Page,
});

function Page() {
  const { handoverId } = Route.useParams();
  return <GeneratedHandoverView handoverId={handoverId} />;
}
