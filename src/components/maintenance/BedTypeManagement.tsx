import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_BED_REFERENCE_DATA,
  loadBedReferenceData,
  saveBedReferenceData,
  type BedReferenceData,
  type BedReferenceItem,
} from "@/domain/maintenance/bedReferenceData";

export function BedTypeManagement() {
  const [data, setData] = useState<BedReferenceData>(() => loadBedReferenceData());
  const [kind, setKind] = useState<keyof BedReferenceData>("bedTypes");
  const [editing, setEditing] = useState<BedReferenceItem>();
  const rows = [...data[kind]].sort((a, b) => a.displayOrder - b.displayOrder);
  const commit = (next: BedReferenceData) => {
    setData(next);
    saveBedReferenceData(next);
  };
  const save = (row: BedReferenceItem) => {
    const list = data[kind].some((item) => item.id === row.id)
      ? data[kind].map((item) => (item.id === row.id ? row : item))
      : [...data[kind], row];
    commit({ ...data, [kind]: list });
    setEditing(undefined);
    toast.success(`${kind === "bedTypes" ? "Bed" : "Mattress"} type saved.`);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle>Bed and Mattress Types</CardTitle><p className="mt-1 text-sm text-muted-foreground">Inactive types remain on historical bed records but cannot be selected for new beds.</p></div>
          <Button onClick={() => setEditing({ id: `custom-${Date.now()}`, name: "", active: true, displayOrder: rows.length + 1 })}><Plus className="mr-2 h-4 w-4" />Add {kind === "bedTypes" ? "bed" : "mattress"} type</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2"><Button variant={kind === "bedTypes" ? "default" : "outline"} onClick={() => setKind("bedTypes")}>Bed Types</Button><Button variant={kind === "mattressTypes" ? "default" : "outline"} onClick={() => setKind("mattressTypes")}>Mattress Types</Button></div>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left"><tr><th className="p-3">Name</th><th className="p-3">Order</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="p-3 font-medium">{row.name}</td><td className="p-3">{row.displayOrder}</td><td className="p-3">{row.active ? "Active" : "Inactive"}</td><td className="p-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(row)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => commit({ ...data, [kind]: data[kind].map((item) => item.id === row.id ? { ...item, active: !item.active } : item) })}>{row.active ? "Deactivate" : "Activate"}</Button></div></td></tr>)}</tbody></table>
        </div>
        <Button className="mt-3" size="sm" variant="ghost" onClick={() => commit(DEFAULT_BED_REFERENCE_DATA)}>Restore suggested defaults</Button>
      </CardContent>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent><DialogHeader><DialogTitle>{editing?.name ? "Edit" : "Add"} {kind === "bedTypes" ? "bed" : "mattress"} type</DialogTitle></DialogHeader>{editing && <div className="space-y-3"><div><Label>Name</Label><Input className="mt-1" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></div><div><Label>Display order</Label><Input className="mt-1" type="number" min="1" value={editing.displayOrder} onChange={(event) => setEditing({ ...editing, displayOrder: Number(event.target.value) })} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} />Active</label></div>}<DialogFooter><Button variant="outline" onClick={() => setEditing(undefined)}>Cancel</Button><Button disabled={!editing?.name.trim()} onClick={() => editing && save(editing)}>Save type</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  );
}
