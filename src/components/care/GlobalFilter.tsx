import { useCare } from "@/lib/care/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter as FilterIcon, X } from "lucide-react";

export function GlobalFilter() {
  const { wings, rooms, residents, filter, setFilter } = useCare();
  const wingRooms = filter.wingId ? rooms.filter(r => r.wingId === filter.wingId) : [];
  const wingResidents = filter.wingId ? residents.filter(r => r.wingId === filter.wingId) : residents;
  const active = !!(filter.wingId || filter.roomId || filter.residentId || filter.status);

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
      <Select
        value={filter.wingId || "all"}
        onValueChange={v => setFilter({ ...filter, wingId: v === "all" ? undefined : v, roomId: undefined, residentId: undefined })}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Wings" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Wings ({residents.length})</SelectItem>
          {wings.map(w => {
            const count = residents.filter(r => r.wingId === w.id).length;
            return <SelectItem key={w.id} value={w.id}>{w.name} ({count})</SelectItem>;
          })}
        </SelectContent>
      </Select>
      {filter.wingId && (
        <Select value={filter.roomId || "all"} onValueChange={v => setFilter({ ...filter, roomId: v === "all" ? undefined : v, residentId: undefined })}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="All Rooms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {wingRooms.map(r => <SelectItem key={r.id} value={r.id}>Room {r.number}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={filter.residentId || "all"} onValueChange={v => setFilter({ ...filter, residentId: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="All Residents" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Residents</SelectItem>
          {wingResidents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}
        </SelectContent>
      </Select>
      {active && (
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setFilter({})}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
