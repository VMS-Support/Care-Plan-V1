import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCare } from "@/lib/care/store";
import { ALL_KINDS, getModule } from "@/lib/care/observations";
import { ObservationModule } from "@/components/care/observations/ObservationModule";
import type { ObservationKind } from "@/lib/care/types";

export const Route = createFileRoute("/residents/$id/observations")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) || "weight" }),
  head: ({ params }) => ({ meta: [{ title: `Observations — Resident ${params.id} — CarePath` }] }),
  component: ResidentObservations,
});

function ResidentObservations() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { residents } = useCare();
  const r = residents.find(x => x.id === id);
  if (!r) return <div className="p-8">Resident not found.</div>;

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl">
      <Link to="/residents/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back to {r.firstName} {r.lastName}</Link>
      <h1 className="text-2xl font-semibold tracking-tight">Clinical Observations</h1>
      <p className="text-sm text-muted-foreground">Each tab is an independent observation module with its own form, history, trends, alerts and audit trail.</p>

      <Tabs value={tab} onValueChange={v => navigate({ to: "/residents/$id/observations", params: { id }, search: { tab: v } })}>
        <TabsList className="flex-wrap h-auto">
          {ALL_KINDS.map(k => {
            const m = getModule(k);
            return <TabsTrigger key={k} value={k}>{m.shortLabel}</TabsTrigger>;
          })}
        </TabsList>
        {ALL_KINDS.map(k => (
          <TabsContent key={k} value={k} className="mt-4">
            <ObservationModule residentId={id} kind={k as ObservationKind} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
