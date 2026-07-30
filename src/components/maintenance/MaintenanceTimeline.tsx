import { useMemo, useState } from "react";
import { Activity, ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type MaintenanceTimelineEvent = {
  id: string;
  at: string;
  title: string;
  actor?: string;
  description?: string;
  reference?: string;
  category?: string;
};

/** A single, filter-safe activity presentation for Maintenance records. */
export function MaintenanceTimeline({ events, empty = "No activity has been recorded." }: { events: MaintenanceTimelineEvent[]; empty?: string }) {
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [visible, setVisible] = useState(20);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return events
      .filter((event) => !term || [event.title, event.actor, event.description, event.reference, event.category].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)))
      .slice()
      .sort((a, b) => {
        const byDate = a.at.localeCompare(b.at);
        const stable = a.id.localeCompare(b.id);
        return newestFirst ? (byDate || stable) * -1 : byDate || stable;
      });
  }, [events, newestFirst, query]);

  const shown = filtered.slice(0, visible);
  return <section aria-label="Record activity timeline" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(20); }} className="pl-9" placeholder="Search activity" /></div>
      <Button type="button" variant="outline" size="sm" onClick={() => setNewestFirst((value) => !value)} aria-label={newestFirst ? "Show oldest activity first" : "Show newest activity first"}>
        {newestFirst ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />}{newestFirst ? "Newest first" : "Oldest first"}
      </Button>
    </div>
    {shown.length === 0 ? <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{empty}</div> : <ol className="space-y-3" aria-live="polite">
      {shown.map((event) => <li key={event.id} className="rounded-lg border p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><div className="font-medium">{event.title}</div>{event.category && <div className="mt-0.5 text-xs text-muted-foreground">{event.category}</div>}</div></div><time className="text-xs text-muted-foreground" dateTime={event.at}>{formatDate(event.at)}</time></div>
        <div className="mt-2 pl-6 text-xs text-muted-foreground">By {event.actor || "System"}</div>
        {event.description && <p className="mt-2 pl-6 text-muted-foreground">{event.description}</p>}
        {event.reference && <div className="mt-2 pl-6 text-xs font-medium">{event.reference}</div>}
      </li>)}
    </ol>}
    {visible < filtered.length && <Button type="button" variant="outline" onClick={() => setVisible((value) => value + 20)}>Load more activity</Button>}
  </section>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
