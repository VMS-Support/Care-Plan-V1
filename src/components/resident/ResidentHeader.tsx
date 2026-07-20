import type { ReactNode } from "react";
import {
  AlertTriangle,
  BedDouble,
  HeartPulse,
  MapPin,
  Scale,
  ShieldAlert,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResidentHeaderViewModel } from "@/lib/care/residentHeader";

const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const initials = (header: ResidentHeaderViewModel) =>
  `${header.identity.legalFirstName[0] || ""}${header.identity.legalLastName[0] || ""}`;

const formatDateTime = (value?: string) => {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPlacementPart = (prefix: "Room" | "Bed", value?: string) => {
  if (!value) return prefix === "Room" ? "Room not assigned" : undefined;
  return new RegExp(`^${prefix}\\b`, "i").test(value) ? value : `${prefix} ${value}`;
};

type LatestWeight = {
  weightKg: number;
  recordedAt?: string;
  recordedBy?: string;
};

function Safety({ header, compact = false }: { header: ResidentHeaderViewModel; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {header.allergyStatus === "active" ? (
        <Badge className="bg-red-50 text-red-800 hover:bg-red-50">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {compact
            ? `${header.allergies.length} allergy alert`
            : header.allergies.map((item) => item.substance).join(" - ")}
        </Badge>
      ) : (
        !compact && (
          <Badge variant="secondary">
            {header.allergyStatus === "no_known_allergies"
              ? "No known allergies recorded"
              : "Allergy status not recorded"}
          </Badge>
        )
      )}
      {header.advanceCare.dnarStatus !== "unknown" && (
        <Badge variant="secondary" className="text-violet-800">
          <HeartPulse className="mr-1 h-3 w-3" />
          {header.advanceCare.dnarStatus === "recorded"
            ? "DNAR Decision Recorded"
            : header.advanceCare.dnarStatus === "under_review"
              ? "DNAR Under Review"
              : header.advanceCare.dnarStatus === "revoked"
                ? "DNAR Revoked"
                : "DNAR Not Recorded"}
        </Badge>
      )}
      {header.advanceCare.advanceDirectiveStatus === "available" && !compact && (
        <Badge variant="secondary">Advance Directive Available</Badge>
      )}
      {header.isolation.active && (
        <Badge className="bg-amber-50 text-amber-900 hover:bg-amber-50">
          <ShieldAlert className="mr-1 h-3 w-3" />
          Isolation Active{header.isolation.type ? ` - ${header.isolation.type}` : ""}
        </Badge>
      )}
    </div>
  );
}

export function ResidentHeader({
  header,
  latestWeight,
  canEdit,
  onEdit,
  actions,
}: {
  header: ResidentHeaderViewModel;
  latestWeight?: LatestWeight;
  canEdit: boolean;
  onEdit: () => void;
  actions?: ReactNode;
}) {
  const legalDifferent =
    header.identity.displayName.toLocaleLowerCase() !==
    header.identity.legalDisplayName.toLocaleLowerCase();
  const placement = [
    header.currentPlacement.wardName,
    formatPlacementPart("Room", header.currentPlacement.roomLabel),
    formatPlacementPart("Bed", header.currentPlacement.bedLabel),
  ]
    .filter(Boolean)
    .join(" - ");
  const residentStatus = titleCase(header.lifecycleStatus || "unknown");
  const presenceStatus = titleCase(header.currentPlacement.presenceStatus);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <section className="flex min-w-0 gap-4">
            <Avatar className="h-24 w-24 shrink-0 rounded-2xl border border-white/20">
              <AvatarImage src={header.photo?.url} alt={header.photo?.altText} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-white/15 text-2xl text-white">{initials(header)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{header.identity.displayName}</h1>
                <Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">{residentStatus}</Badge>
                <Badge className="bg-white/10 text-white hover:bg-white/10">{presenceStatus}</Badge>
              </div>
              {legalDifferent && (
                <p className="text-sm text-white/70">Legal name: {header.identity.legalDisplayName}</p>
              )}
              <p className="text-sm text-white/80">
                DOB {header.identity.dateOfBirth || "not recorded"}
                {header.identity.age !== undefined ? ` - Age ${header.identity.age}` : ""}
              </p>
              {header.identity.residentNumber && (
                <p className="text-xs text-white/60">Resident number {header.identity.residentNumber}</p>
              )}
            </div>
          </section>

          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                Edit Resident Profile
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoLine
              icon={<MapPin className="h-4 w-4" />}
              label="Current placement"
              value={placement}
            />
            <InfoLine
              icon={<BedDouble className="h-4 w-4" />}
              label={`Dependency: ${header.dependency.summaryLabel}`}
              value={`${header.dependency.domainsRecorded} of 12 Activities recorded`}
            />
            <InfoLine
              icon={<Scale className="h-4 w-4" />}
              label="Latest weight"
              value={
                latestWeight
                  ? `${latestWeight.weightKg.toFixed(1)} kg - ${formatDateTime(latestWeight.recordedAt)}`
                  : "No weight recorded"
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Named Nurse"
              value={header.namedNurse?.displayName || "Not assigned"}
            />
            <InfoLine
              icon={<UsersRound className="h-4 w-4" />}
              label="Key Worker"
              value={header.keyWorker?.displayName || "Not assigned"}
            />
            <InfoLine
              icon={<Stethoscope className="h-4 w-4" />}
              label="GP"
              value={header.gp?.displayName || "Not recorded"}
            />
          </div>
        </section>

        <section className="space-y-4">
          <Safety header={header} />
          <div className="text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary contact</p>
            {header.primaryContact ? (
              <div className="mt-1 space-y-1">
                <p className="font-medium">
                  {header.primaryContact.displayName}
                  {header.primaryContact.relationship ? ` - ${header.primaryContact.relationship}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {header.primaryContact.phone ||
                    header.primaryContact.email ||
                    "Contact details not recorded"}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {header.primaryContact.nominatedRepresentative && <span>Nominated representative</span>}
                  {header.primaryContact.powerOfAttorney && <span>Power of attorney recorded</span>}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-muted-foreground">Primary contact not assigned</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}
