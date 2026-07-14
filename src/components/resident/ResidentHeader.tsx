import type { ReactNode } from "react";
import { AlertTriangle, BedDouble, HeartPulse, MapPin, ShieldAlert, Stethoscope, UserRound, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ResidentHeaderViewModel } from "@/lib/care/residentHeader";

const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const initials = (header: ResidentHeaderViewModel) => `${header.identity.legalFirstName[0] || ""}${header.identity.legalLastName[0] || ""}`;

function Safety({ header, compact = false }: { header: ResidentHeaderViewModel; compact?: boolean }) {
  return <div className="flex flex-wrap gap-2">
    {header.allergyStatus === "active" ? <Badge className="border border-red-300 bg-red-50 text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />{compact ? `${header.allergies.length} allergy alert` : header.allergies.map((item) => item.substance).join(" · ")}</Badge> : !compact && <Badge variant="outline">{header.allergyStatus === "no_known_allergies" ? "No known allergies recorded" : "Allergy status not recorded"}</Badge>}
    {header.advanceCare.dnarStatus !== "unknown" && <Badge variant="outline" className="border-violet-300 text-violet-800"><HeartPulse className="mr-1 h-3 w-3" />{header.advanceCare.dnarStatus === "recorded" ? "DNAR Decision Recorded" : header.advanceCare.dnarStatus === "under_review" ? "DNAR Under Review" : header.advanceCare.dnarStatus === "revoked" ? "DNAR Revoked" : "DNAR Not Recorded"}</Badge>}
    {header.advanceCare.advanceDirectiveStatus === "available" && !compact && <Badge variant="outline">Advance Directive Available</Badge>}
    {header.isolation.active && <Badge className="border border-amber-300 bg-amber-50 text-amber-900"><ShieldAlert className="mr-1 h-3 w-3" />Isolation Active{header.isolation.type ? ` · ${header.isolation.type}` : ""}</Badge>}
  </div>;
}

export function ResidentHeader({ header, canEdit, onEdit, actions }: { header: ResidentHeaderViewModel; canEdit: boolean; onEdit: () => void; actions?: ReactNode }) {
  const legalDifferent = header.identity.displayName.toLocaleLowerCase() !== header.identity.legalDisplayName.toLocaleLowerCase();
  const placement = [header.currentPlacement.wardName, header.currentPlacement.roomLabel ? `Room ${header.currentPlacement.roomLabel}` : "Room not assigned", header.currentPlacement.bedLabel ? `Bed ${header.currentPlacement.bedLabel}` : undefined].filter(Boolean).join(" · ");
  return <>
    <div className="sticky top-0 z-20 -mx-4 hidden border-y bg-background/95 px-4 py-2 shadow-sm backdrop-blur md:flex md:items-center md:gap-3">
      <Avatar className="h-8 w-8"><AvatarImage src={header.photo?.url} alt={header.photo?.altText} /><AvatarFallback>{initials(header)}</AvatarFallback></Avatar>
      <span className="font-semibold">{header.identity.displayName}</span><span className="text-sm text-muted-foreground">{placement}</span><Safety header={header} compact />
    </div>
    <Card className="overflow-hidden border-slate-300">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(240px,1fr)_minmax(280px,1.15fr)_minmax(300px,1.2fr)]">
        <section className="flex gap-4">
          <Avatar className="h-24 w-24 shrink-0 rounded-xl"><AvatarImage src={header.photo?.url} alt={header.photo?.altText} className="object-cover" /><AvatarFallback className="rounded-xl bg-accent text-2xl">{initials(header)}</AvatarFallback></Avatar>
          <div className="min-w-0 space-y-1"><h1 className="text-2xl font-semibold tracking-tight">{header.identity.displayName}</h1>{legalDifferent && <p className="text-sm text-muted-foreground">Legal name: {header.identity.legalDisplayName}</p>}<p className="text-sm">DOB {header.identity.dateOfBirth || "not recorded"}{header.identity.age !== undefined ? ` · Age ${header.identity.age}` : ""}</p><Badge variant="outline">{titleCase(header.currentPlacement.presenceStatus)}</Badge>{header.identity.residentNumber && <p className="text-xs text-muted-foreground">Resident number {header.identity.residentNumber}</p>}</div>
        </section>
        <section className="space-y-3 text-sm"><div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Current placement</p><p className="text-muted-foreground">{placement}</p></div></div><div className="flex gap-2"><BedDouble className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Dependency: {header.dependency.summaryLabel}</p><p className="text-muted-foreground">{header.dependency.domainsRecorded} of 12 Activities recorded</p></div></div><div className="grid grid-cols-2 gap-2"><Relationship icon={<UserRound className="h-4 w-4" />} label="Named Nurse" value={header.namedNurse?.displayName || "Not assigned"} /><Relationship icon={<UsersRound className="h-4 w-4" />} label="Key Worker" value={header.keyWorker?.displayName || "Not assigned"} /><Relationship icon={<Stethoscope className="h-4 w-4" />} label="GP" value={header.gp?.displayName || "Not recorded"} /></div></section>
        <section className="space-y-3"><Safety header={header} /><div className="rounded-md border p-3 text-sm"><p className="font-medium">Primary contact</p>{header.primaryContact ? <><p>{header.primaryContact.displayName}{header.primaryContact.relationship ? ` · ${header.primaryContact.relationship}` : ""}</p><p className="text-muted-foreground">{header.primaryContact.phone || header.primaryContact.email || "Contact details not recorded"}</p><div className="mt-1 flex gap-1">{header.primaryContact.nominatedRepresentative && <Badge variant="outline">Nominated representative</Badge>}{header.primaryContact.powerOfAttorney && <Badge variant="outline">Power of attorney recorded</Badge>}</div></> : <p className="text-muted-foreground">Primary contact not assigned</p>}</div><div className="flex flex-wrap justify-end gap-2">{canEdit && <Button variant="outline" size="sm" onClick={onEdit}>Edit Resident Profile</Button>}{actions}</div></section>
        <details className="lg:hidden"><summary className="cursor-pointer text-sm font-medium">Resident Details</summary><div className="mt-2 text-sm text-muted-foreground">{placement} · Dependency {header.dependency.summaryLabel}</div></details>
      </CardContent>
    </Card>
  </>;
}

function Relationship({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex gap-2 rounded-md border p-2"><span className="text-muted-foreground">{icon}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate font-medium">{value}</p></div></div>; }
