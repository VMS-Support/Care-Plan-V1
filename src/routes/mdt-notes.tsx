import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/mdt-notes")({
  head: () => ({ meta: [{ title: "MDT Notes — CarePath" }] }),
  component: () => {
    const { mdtNotes, residents } = useCare();
    return (
      <div className="p-4 md:p-8 space-y-4 max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">MDT Notes</h1>
        <div className="space-y-2">
          {mdtNotes.map(m => {
            const r = residents.find(x => x.id === m.residentId);
            return (
              <Link key={m.id} to="/residents/$id" params={{ id: m.residentId }}>
                <Card className="hover:shadow-sm"><CardContent className="p-4">
                  <div className="font-medium">{r?.firstName} {r?.lastName} — {m.date}</div>
                  <p className="text-xs text-muted-foreground">{m.authoredBy} · Attendees: {m.attendees}</p>
                  <p className="text-sm mt-1"><strong>Discussion:</strong> {m.discussion}</p>
                  <p className="text-sm"><strong>Recommendations:</strong> {m.recommendations}</p>
                </CardContent></Card>
              </Link>
            );
          })}
          {mdtNotes.length === 0 && <p className="text-sm text-muted-foreground">No MDT notes recorded.</p>}
        </div>
      </div>
    );
  },
});
