import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, UserRound, Home, ShieldCheck } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  WORKFORCE_CAPABILITIES,
  getAuthorisedWorkforceScope,
  getStaffProfile,
  STAFF_MEMBER_STATUS_LABELS,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/workforce/staff/$staffMemberId")({
  head: () => ({ meta: [{ title: "Staff Profile - NuCare" }] }),
  component: StaffProfilePage,
});

function StaffProfilePage() {
  const { staffMemberId } = Route.useParams();
  const care = useCare();
  const capabilities = WORKFORCE_CAPABILITIES.filter((capability) =>
    care.canAccess(capability, { nursingHomeId: care.activeFacilityId }),
  );
  const scope = getAuthorisedWorkforceScope({ currentUser: care.currentUser, activeFacilityId: care.activeFacilityId, facilities: care.facilities });
  const profile = getStaffProfile(care, staffMemberId, { user: care.currentUser, capabilities, scope });

  if (!profile) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">The Staff Member could not be loaded.</CardContent></Card></div>;
  }

  const { staff, row, role } = profile;
  const contacts = care.staffEmergencyContacts
    .filter((contact) => String(contact.staffMemberId) === String(staff.id) && contact.active)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.priority - b.priority);
  const canPersonal = capabilities.includes("staff_directory.view_personal_details");
  const canAddress = capabilities.includes("staff_directory.view_address");
  const canContacts = capabilities.includes("staff_directory.view_emergency_contacts");
  const canAccount = capabilities.includes("staff_directory.view_account_link");

  return (
    <div className="space-y-4 p-4 md:p-8">
      <Button variant="ghost" asChild className="pl-0"><Link to="/workforce/staff"><ArrowLeft className="mr-2 h-4 w-4" /> Staff Directory</Link></Button>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="h-20 w-20"><AvatarImage src={row.photoUrl} /><AvatarFallback className="text-xl">{row.initials}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{row.displayName}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{row.staffNumber}</Badge>
              <Badge>{STAFF_MEMBER_STATUS_LABELS[row.status]}</Badge>
              <Badge variant="secondary">{role.primaryRoleLabel || "Role Not Recorded"}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Home className="h-4 w-4" /> {row.primaryHome?.name || "Primary Home Not Recorded"}</div>
            <div className="mt-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {row.linkedUserAccount ? "User Account Linked" : "No User Account Linked"}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Work Contact">
          <Detail icon={Mail} label="Work Email" value={row.workEmail || "Not recorded"} />
          <Detail icon={Phone} label="Work Phone" value={row.workPhone || "Not recorded"} />
        </Section>

        <Section title="Personal Details">
          {canPersonal ? (
            <>
              <Detail label="Date of Birth" value={staff.dateOfBirth || "Not recorded"} />
              <Detail label="Gender" value={staff.gender ? staff.gender.replaceAll("_", " ") : "Not recorded"} />
              <Detail label="Nationality" value={staff.nationalityDisplayName || staff.nationalityCode || "Not recorded"} />
            </>
          ) : <p className="text-sm text-muted-foreground">Personal details are restricted.</p>}
        </Section>

        <Section title="Address">
          {canAddress ? (
            <p className="text-sm">{[staff.address?.line1, staff.address?.line2, staff.address?.townCity, staff.address?.countyRegion, staff.address?.postcode, staff.address?.country].filter(Boolean).join(", ") || "Not recorded"}</p>
          ) : <p className="text-sm text-muted-foreground">Address details are restricted.</p>}
        </Section>

        <Section title="Emergency Contacts">
          {canContacts ? (
            contacts.length ? contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between"><strong>{contact.fullName}</strong>{contact.isPrimary && <Badge variant="outline">Primary</Badge>}</div>
                <div className="mt-1 text-muted-foreground">{contact.relationship || "Relationship not recorded"} · {contact.phoneNumber}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No active emergency contacts recorded.</p>
          ) : <p className="text-sm text-muted-foreground">Emergency contacts are restricted.</p>}
        </Section>

        <Section title="Account Link">
          {canAccount ? (
            <p className="text-sm">{row.linkedUserAccount ? "This Staff Member is linked to a User Account." : "No User Account Linked"}</p>
          ) : <p className="text-sm text-muted-foreground">Account link details are restricted.</p>}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>;
}

function Detail({ icon: Icon = UserRound, label, value }: { icon?: any; label: string; value: string }) {
  return <div className="flex items-center gap-3 text-sm"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{label}:</span><span>{value}</span></div>;
}
