import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare, age } from "@/lib/care/store";
import { isActionRequiredAlert } from "@/lib/care/alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/residents/")({
  head: () => ({ meta: [{ title: "Residents — CarePath" }] }),
  component: ResidentsList,
});

type Filter = "all" | "active" | "inactive" | "active_respite" | "inactive_respite";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "active_respite", label: "Active Respite" },
  { value: "inactive_respite", label: "Inactive Respite" },
];

function NewResidentDialog() {
  const { addResident } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", dob: "1940-01-01", roomNumber: "", primaryDiagnosis: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" /> New Resident</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Admit New Resident</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>First name</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
          <div><Label>Last name</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          <div><Label>Date of birth</Label><Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
          <div><Label>Room number</Label><Input value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} /></div>
          <div className="col-span-2"><Label>Primary diagnosis</Label><Input value={form.primaryDiagnosis} onChange={e => setForm({ ...form, primaryDiagnosis: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!form.firstName || !form.lastName) { toast.error("Name required"); return; }
            addResident({
              ...form, gender: "female", admissionDate: new Date().toISOString().slice(0, 10),
              medicalHistory: "", allergies: "No known drug allergies", gp: "", consultant: "", nextOfKin: "",
              emergencyContact: "", communicationNeeds: "", religion: "", preferredLanguage: "English",
              mentalCapacity: "has_capacity", endOfLife: false, currentMedication: "", status: "active",
              residentType: "active",
            });
            toast.success("Resident admitted");
            setOpen(false);
          }}>Admit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResidentsList() {
  const { residents, assessments, alerts, filteredResidentIds, filter: globalFilter } = useCare();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const globalActive = !!(globalFilter.wingId || globalFilter.roomId || globalFilter.residentId);
  const allowed = new Set(filteredResidentIds);

  const filtered = residents.filter(r => {
    if (globalActive && !allowed.has(r.id)) return false;
    if (filter !== "all" && (r.residentType || "active") !== filter) return false;
    const t = (r.firstName + " " + r.lastName + " " + r.roomNumber + " " + r.id).toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Residents</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {residents.length} residents</p>
        </div>
        <NewResidentDialog />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by name, room, ID…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <Button key={f.value} size="sm" variant={filter === f.value ? "default" : "outline"} onClick={() => setFilter(f.value)}>{f.label}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => {
          const rAlerts = alerts.filter(
            (a) =>
              a.residentId === r.id &&
              isActionRequiredAlert(a) &&
              !a.acknowledged &&
              !a.resolvedAt,
          );
          const highest = assessments.filter(a => a.residentId === r.id && a.status !== "deleted")
            .sort((a, b) => b.date.localeCompare(a.date))[0];
          return (
            <Link key={r.id} to="/residents/$id" params={{ id: r.id }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12"><AvatarFallback className="bg-accent text-accent-foreground font-semibold">{r.firstName[0]}{r.lastName[0]}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{r.firstName} {r.lastName}</div>
                      <div className="text-xs text-muted-foreground">{r.id} · Age {age(r.dob)} · Room {r.roomNumber}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">{r.primaryDiagnosis}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <Badge variant="secondary" className="text-[10px] capitalize">{(r.residentType || "active").replace("_", " ")}</Badge>
                    {r.bed && <Badge variant="outline" className="text-[10px] capitalize">{r.bed.bedType.replace("_", " ")}</Badge>}
                    {r.endOfLife && <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">EoL</Badge>}
                    {highest && (highest.riskLevel === "high" || highest.riskLevel === "very_high") && (
                      <Badge variant="outline" className="text-[10px] border-warning/50 text-warning-foreground bg-warning/10">High risk</Badge>
                    )}
                    {rAlerts.length > 0 && (
                      <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">{rAlerts.length} alert{rAlerts.length > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
