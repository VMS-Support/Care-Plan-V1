import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Printer, ArrowUpDown } from "lucide-react";
import { useCare } from "@/lib/care/store";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  statusTab: "active" | "archived" | "deleted";
  setStatusTab: (v: "active" | "archived" | "deleted") => void;
  sort: string;
  setSort: (v: string) => void;
  sortOptions: { value: string; label: string }[];
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  workflowStatus?: string;
  setWorkflowStatus?: (v: string) => void;
  workflowOptions?: { value: string; label: string }[];
  counts: { active: number; archived: number; deleted: number };
}

export function OpsListToolbar({
  search, setSearch, statusTab, setStatusTab, sort, setSort, sortOptions,
  dateFrom, setDateFrom, dateTo, setDateTo,
  workflowStatus, setWorkflowStatus, workflowOptions, counts,
}: Props) {
  const { residents, wings, filter, setFilter } = useCare();
  return (
    <div className="space-y-2 print:hidden">
      <Tabs value={statusTab} onValueChange={v => setStatusTab(v as any)}>
        <TabsList>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({counts.archived})</TabsTrigger>
          <TabsTrigger value="deleted">Deleted ({counts.deleted})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-9" />
        </div>
        <Select value={filter.wingId || "all"} onValueChange={v => setFilter({ ...filter, wingId: v === "all" ? undefined : v, residentId: undefined })}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Wing" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wings</SelectItem>
            {wings.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filter.residentId || "all"} onValueChange={v => setFilter({ ...filter, residentId: v === "all" ? undefined : v })}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Resident" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Residents</SelectItem>
            {residents.filter(r => !filter.wingId || r.wingId === filter.wingId).map(r => (
              <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-[150px]" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-[150px]" />
        {workflowOptions && setWorkflowStatus && (
          <Select value={workflowStatus || "all"} onValueChange={setWorkflowStatus}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {workflowOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[160px]"><ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            {sortOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" /> Print</Button>
      </div>
    </div>
  );
}
