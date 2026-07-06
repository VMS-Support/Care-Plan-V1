import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import type { Resident } from "@/lib/care/types";

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
  const { addResident, rooms } = useCare();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "" as Resident["gender"] | "",
    roomId: "",
    roomNumber: "",
    primaryDiagnosis: "",
    preferredName: "",
    externalResidentId: "",
    nextOfKinName: "",
    nextOfKinRelationship: "",
    nextOfKinPhone: "",
    nextOfKinEmail: "",
    nextOfKinAddress: "",
    emergencyContact: "",
    medicalHistory: "",
    allergies: "",
    mentalCapacity: "not_assessed" as Resident["mentalCapacity"],
    currentMedication: "",
    dnarStatus: "not_recorded" as NonNullable<Resident["dnarStatus"]>,
    gp: "",
    gpPractice: "",
    consultant: "",
    consultantSpecialty: "",
    bedType: "" as NonNullable<Resident["bed"]>["bedType"] | "",
    mattressType: "" as NonNullable<Resident["bed"]>["mattressType"] | "",
    mattressInstalledDate: "",
    mattressReviewDate: "",
    namedNurse: "",
    namedCarer: "",
    keyWorker: "",
    communicationNeeds: "",
    religion: "",
    preferredLanguage: "",
    otherPreferences: "",
    admissionDate: new Date().toISOString().slice(0, 10),
    admissionSource: "" as NonNullable<Resident["admissionSource"]>,
  });

  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const reset = () => {
    setForm({
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      roomId: "",
      roomNumber: "",
      primaryDiagnosis: "",
      preferredName: "",
      externalResidentId: "",
      nextOfKinName: "",
      nextOfKinRelationship: "",
      nextOfKinPhone: "",
      nextOfKinEmail: "",
      nextOfKinAddress: "",
      emergencyContact: "",
      medicalHistory: "",
      allergies: "",
      mentalCapacity: "not_assessed",
      currentMedication: "",
      dnarStatus: "not_recorded",
      gp: "",
      gpPractice: "",
      consultant: "",
      consultantSpecialty: "",
      bedType: "",
      mattressType: "",
      mattressInstalledDate: "",
      mattressReviewDate: "",
      namedNurse: "",
      namedCarer: "",
      keyWorker: "",
      communicationNeeds: "",
      religion: "",
      preferredLanguage: "",
      otherPreferences: "",
      admissionDate: new Date().toISOString().slice(0, 10),
      admissionSource: "",
    });
    setDetailsOpen(false);
  };

  const submit = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob || !form.gender || !form.roomId) {
      toast.error("First name, last name, date of birth, gender and room are required.");
      return;
    }

    const nok = form.nextOfKinName.trim()
      ? [{
          name: form.nextOfKinName.trim(),
          relationship: form.nextOfKinRelationship.trim(),
          phone: form.nextOfKinPhone.trim(),
          mobile: form.nextOfKinPhone.trim(),
          email: form.nextOfKinEmail.trim(),
          address: form.nextOfKinAddress.trim(),
          primaryContact: true,
          emergencyContact: true,
          powerOfAttorney: false,
          legalRepresentative: false,
          notes: "",
        }]
      : undefined;

    const resident = addResident({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      preferredName: form.preferredName.trim() || undefined,
      externalResidentId: form.externalResidentId.trim() || undefined,
      dob: form.dob,
      gender: form.gender as Resident["gender"],
      roomNumber: form.roomNumber.trim(),
      roomId: form.roomId || undefined,
      wingId: rooms.find((room) => room.id === form.roomId)?.wingId,
      unitId: rooms.find((room) => room.id === form.roomId)?.unitId,
      admissionDate: form.admissionDate || new Date().toISOString().slice(0, 10),
      admissionSource: form.admissionSource,
      primaryDiagnosis: form.primaryDiagnosis.trim(),
      medicalHistory: form.medicalHistory.trim(),
      allergies: form.allergies.trim(),
      gp: form.gp.trim(),
      gpPractice: form.gpPractice.trim() || undefined,
      consultant: form.consultant.trim(),
      consultantSpecialty: form.consultantSpecialty.trim() || undefined,
      nextOfKin: form.nextOfKinName.trim(),
      nextOfKinList: nok,
      emergencyContact: form.emergencyContact.trim(),
      communicationNeeds: form.communicationNeeds.trim(),
      religion: form.religion.trim(),
      preferredLanguage: form.preferredLanguage.trim(),
      otherPreferences: form.otherPreferences.trim() || undefined,
      mentalCapacity: form.mentalCapacity,
      dnarStatus: form.dnarStatus,
      endOfLife: false,
      currentMedication: form.currentMedication.trim(),
      status: "active",
      residentType: "active",
      bed: form.bedType || form.mattressType || form.mattressInstalledDate || form.mattressReviewDate
        ? {
            bedType: (form.bedType || "standard") as NonNullable<Resident["bed"]>["bedType"],
            mattressType: (form.mattressType || "foam") as NonNullable<Resident["bed"]>["mattressType"],
            installationDate: form.mattressInstalledDate,
            reviewDate: form.mattressReviewDate,
          }
        : undefined,
      keyWorkers: form.namedNurse || form.namedCarer || form.keyWorker
        ? {
            namedNurse: form.namedNurse.trim(),
            namedCarer: form.namedCarer.trim(),
            keyWorker: form.keyWorker.trim(),
          }
        : undefined,
    });
    toast.success("Resident admitted successfully.");
    setOpen(false);
    reset();
    navigate({ to: "/residents/$id", params: { id: resident.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" /> New Resident</Button></DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Admit New Resident</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => update({ firstName: e.target.value })} /></div>
          <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => update({ lastName: e.target.value })} /></div>
          <div><Label>Date of Birth *</Label><Input type="date" value={form.dob} onChange={e => update({ dob: e.target.value })} /></div>
          <div>
            <Label>Gender *</Label>
            <Select value={form.gender} onValueChange={(value) => update({ gender: value as Resident["gender"] })}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Room *</Label>
            <Select
              value={form.roomId}
              onValueChange={(value) => {
                const room = rooms.find((candidate) => candidate.id === value);
                update({ roomId: value, roomNumber: room?.number || "" });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>Room {room.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Primary Diagnosis</Label><Input value={form.primaryDiagnosis} onChange={e => update({ primaryDiagnosis: e.target.value })} /></div>
        </div>

        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-4 rounded-md border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-4">
              <span>Additional Details (Optional)</span>
              <span>{detailsOpen ? "Hide" : "Show"}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t p-4 space-y-5">
            <OptionalSection title="Personal">
              <Field label="Preferred Name" value={form.preferredName} onChange={(v) => update({ preferredName: v })} />
              <Field label="Resident ID" value={form.externalResidentId} onChange={(v) => update({ externalResidentId: v })} />
              <Field label="Resident Photograph" placeholder="Photo upload can be added later" disabled value="" onChange={() => {}} />
            </OptionalSection>
            <OptionalSection title="Contact / Next of Kin">
              <Field label="Next of Kin Name" value={form.nextOfKinName} onChange={(v) => update({ nextOfKinName: v })} />
              <Field label="Relationship" value={form.nextOfKinRelationship} onChange={(v) => update({ nextOfKinRelationship: v })} />
              <Field label="Phone Number" value={form.nextOfKinPhone} onChange={(v) => update({ nextOfKinPhone: v })} />
              <Field label="Email Address" value={form.nextOfKinEmail} onChange={(v) => update({ nextOfKinEmail: v })} />
              <div className="md:col-span-2"><Label>Address</Label><Textarea value={form.nextOfKinAddress} onChange={(e) => update({ nextOfKinAddress: e.target.value })} /></div>
              <Field label="Emergency Contact Number" value={form.emergencyContact} onChange={(v) => update({ emergencyContact: v })} />
            </OptionalSection>
            <OptionalSection title="Clinical">
              <Field label="Primary Diagnosis" value={form.primaryDiagnosis} onChange={(v) => update({ primaryDiagnosis: v })} />
              <div className="md:col-span-2"><Label>Medical History</Label><Textarea value={form.medicalHistory} onChange={(e) => update({ medicalHistory: e.target.value })} /></div>
              <Field label="Known Allergies" value={form.allergies} onChange={(v) => update({ allergies: v })} />
              <div>
                <Label>Mental Capacity</Label>
                <Select value={form.mentalCapacity} onValueChange={(value) => update({ mentalCapacity: value as Resident["mentalCapacity"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="has_capacity">Has capacity</SelectItem>
                    <SelectItem value="lacks_capacity">Lacks capacity</SelectItem>
                    <SelectItem value="fluctuating">Fluctuating capacity</SelectItem>
                    <SelectItem value="not_assessed">Not assessed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Medication</Label><Textarea value={form.currentMedication} onChange={(e) => update({ currentMedication: e.target.value })} /></div>
              <div>
                <Label>DNAR Status</Label>
                <Select value={form.dnarStatus} onValueChange={(value) => update({ dnarStatus: value as NonNullable<Resident["dnarStatus"]> })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_recorded">Not recorded</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </OptionalSection>
            <OptionalSection title="GP / Consultant">
              <Field label="GP Name" value={form.gp} onChange={(v) => update({ gp: v })} />
              <Field label="GP Practice" value={form.gpPractice} onChange={(v) => update({ gpPractice: v })} />
              <Field label="Consultant Name" value={form.consultant} onChange={(v) => update({ consultant: v })} />
              <Field label="Consultant Specialty" value={form.consultantSpecialty} onChange={(v) => update({ consultantSpecialty: v })} />
            </OptionalSection>
            <OptionalSection title="Bed Management">
              <SelectField label="Bed Type" value={form.bedType} onChange={(v) => update({ bedType: v as any })} options={[["standard","Standard"],["low","Low"],["profiling","Profiling"],["bariatric","Bariatric"]]} />
              <SelectField label="Mattress Type" value={form.mattressType} onChange={(v) => update({ mattressType: v as any })} options={[["foam","Foam"],["dynamic","Dynamic"],["air_mattress","Air Mattress"],["pressure_relieving","Pressure-relieving mattress"]]} />
              <Field label="Mattress Installed Date" type="date" value={form.mattressInstalledDate} onChange={(v) => update({ mattressInstalledDate: v })} />
              <Field label="Mattress Review Date" type="date" value={form.mattressReviewDate} onChange={(v) => update({ mattressReviewDate: v })} />
            </OptionalSection>
            <OptionalSection title="Key Workers">
              <Field label="Named Nurse" value={form.namedNurse} onChange={(v) => update({ namedNurse: v })} />
              <Field label="Named Carer" value={form.namedCarer} onChange={(v) => update({ namedCarer: v })} />
              <Field label="Key Worker" value={form.keyWorker} onChange={(v) => update({ keyWorker: v })} />
            </OptionalSection>
            <OptionalSection title="Preferences">
              <Field label="Communication Needs" value={form.communicationNeeds} onChange={(v) => update({ communicationNeeds: v })} />
              <Field label="Religion" value={form.religion} onChange={(v) => update({ religion: v })} />
              <Field label="Preferred Language" value={form.preferredLanguage} onChange={(v) => update({ preferredLanguage: v })} />
              <div className="md:col-span-2"><Label>Other Preferences</Label><Textarea value={form.otherPreferences} onChange={(e) => update({ otherPreferences: e.target.value })} /></div>
            </OptionalSection>
            <OptionalSection title="Admission">
              <Field label="Admission Date" type="date" value={form.admissionDate} onChange={(v) => update({ admissionDate: v })} />
              <SelectField label="Admission Source" value={form.admissionSource} onChange={(v) => update({ admissionSource: v as any })} options={[["home","Home"],["hospital","Hospital"],["another_care_home","Another Care Home"],["other","Other"]]} />
            </OptionalSection>
          </CollapsibleContent>
        </Collapsible>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Admit Resident</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="grid md:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Not recorded" /></SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, label]) => <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
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
