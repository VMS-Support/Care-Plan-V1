import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, UserRound, Home, ShieldCheck, Plus, CheckCircle2, FileText, Plane, Pencil, X } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { EmploymentRecord, ProfessionalRegistration, Role, StaffEmergencyContact, StaffMember, UserAccount, UserProfile } from "@/lib/care/types";
import {
  WORKFORCE_CAPABILITIES,
  EMPLOYMENT_CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  employmentRecordCardModel,
  getAuthorisedWorkforceScope,
  professionalRegistrationRow,
  staffDocumentViewModel,
  getStaffImmigrationSummary,
  getStaffTrainingProfile,
  getStaffCompetencyProfile,
  resolveStaffProfileRoute,
  staffHomeAssignmentCardModel,
  type CreateStaffDocumentCommand,
  type CreateStaffVisaRecordCommand,
  type CreateResidencePermissionRecordCommand,
  type CreateEmploymentPermitRecordCommand,
  type AssignTrainingCommand,
  type RecordCompetencyValidationCommand,
  type RecordTrainingCompletionCommand,
  type CreateStaffHomeAssignmentCommand,
  type CreateEmploymentRecordCommand,
  type CreateProfessionalRegistrationCommand,
  STAFF_MEMBER_STATUS_LABELS,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

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
  const profileState = resolveStaffProfileRoute(care, staffMemberId, { user: care.currentUser, capabilities, scope });

  if (profileState.status !== "ready") {
    return <StaffProfileState status={profileState.status} />;
  }

  const profile = profileState.profile;
  const { staff, row, role } = profile;
  const contacts = care.staffEmergencyContacts
    .filter((contact) => String(contact.staffMemberId) === String(staff.id) && contact.active)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.priority - b.priority);
  const canPersonal = capabilities.includes("staff_directory.view_personal_details");
  const canAddress = capabilities.includes("staff_directory.view_address");
  const canContacts = capabilities.includes("staff_directory.view_emergency_contacts");
  const canAccount = capabilities.includes("staff_directory.view_account_link");
  const canEditStaff = capabilities.includes("staff_directory.edit");
  const canEditPersonal = canEditStaff || capabilities.includes("staff_directory.edit_personal_details") || capabilities.includes("staff_directory.upload_photo");
  const canEditContact = canEditStaff || capabilities.includes("staff_directory.edit_contact_details");
  const canEditAddress = canEditStaff || capabilities.includes("staff_directory.edit_address");
  const canManageContacts = capabilities.includes("staff_directory.manage_emergency_contacts");
  const canManageAccount = capabilities.includes("staff_directory.manage_account_link");
  const canViewPayroll = capabilities.includes("employment_record.view_payroll");
  const canCreateEmployment = capabilities.includes("employment_record.create");
  const canEditEmployment = capabilities.includes("employment_record.edit");
  const canCreateRegistration = capabilities.includes("professional_registration.create");
  const canEditRegistration = capabilities.includes("professional_registration.edit_draft") || capabilities.includes("professional_registration.renew") || capabilities.includes("professional_registration.edit_conditions");
  const canVerifyRegistration = capabilities.includes("professional_registration.verify");
  const canCreateDocument = capabilities.includes("staff_document.upload");
  const canVerifyDocument = capabilities.includes("staff_document.verify");
  const canCreateImmigration = capabilities.includes("staff_immigration.create");
  const canVerifyImmigration = capabilities.includes("staff_immigration.verify");
  const canViewSensitiveWorkforce = capabilities.includes("staff_document.view_sensitive") || capabilities.includes("staff_immigration.view_sensitive");
  const canAssignTraining = capabilities.includes("training.assign");
  const canRecordTraining = capabilities.includes("training.record_completion");
  const canVerifyTraining = capabilities.includes("training.verify");
  const canRecordCompetency = capabilities.includes("competency.create_draft") || capabilities.includes("competency.validate");
  const canCreateHomeAssignment = capabilities.includes("home_assignments.create");
  const canEndHomeAssignment = capabilities.includes("home_assignments.end");
  const canViewHomeAssignmentFte = capabilities.includes("home_assignments.view_fte");
  const linkedAccount = care.userAccounts.find((account) => String(account.id) === String(staff.linkedUserAccountId || "") || String(account.staffMemberId || "") === String(staff.id));
  const linkedUser = linkedAccount ? care.users.find((user) => user.email.toLowerCase() === (linkedAccount.email || linkedAccount.username || "").toLowerCase()) : undefined;
  const [employmentOpen, setEmploymentOpen] = useState(false);
  const [employmentEditId, setEmploymentEditId] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationEditId, setRegistrationEditId] = useState<string | null>(null);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [workContactOpen, setWorkContactOpen] = useState(false);
  const [emergencyContactDialog, setEmergencyContactDialog] = useState<StaffEmergencyContact | "new" | null>(null);
  const [systemAccessOpen, setSystemAccessOpen] = useState(false);
  const [immigrationOpen, setImmigrationOpen] = useState(false);
  const [trainingAssignOpen, setTrainingAssignOpen] = useState(false);
  const [trainingCompletionOpen, setTrainingCompletionOpen] = useState(false);
  const [competencyOpen, setCompetencyOpen] = useState(false);
  const [homeAssignmentOpen, setHomeAssignmentOpen] = useState(false);
  const employmentCards = care.employmentRecords
    .filter((record) => String(record.staffMemberId) === String(staff.id))
    .map((record) => employmentRecordCardModel(record, {
      facilities: care.facilities,
      homeAssignments: care.employmentHomeAssignments,
      roleAssignments: care.employmentRoleAssignments,
      canViewPayroll,
    }))
    .sort((a, b) => (a.status === "Active" ? -1 : b.status === "Active" ? 1 : a.startDate.localeCompare(b.startDate)));
  const registrationRows = care.professionalRegistrations
    .filter((record) => String(record.staffMemberId) === String(staff.id))
    .map((record) => professionalRegistrationRow(record, {
      staffMembers: care.staffMembers,
      facilities: care.facilities,
      canViewNumber: capabilities.includes("professional_registration.view_number"),
    }));
  const documentRows = care.staffDocuments
    .filter((document) => String(document.staffMemberId) === String(staff.id) && document.status !== "entered_in_error" && document.status !== "superseded")
    .map((document) => staffDocumentViewModel(document, {
      staffMembers: care.staffMembers,
      documentTypes: care.staffDocumentTypes,
      capabilities,
    }));
  const immigrationSummary = getStaffImmigrationSummary({
    staffMemberId: String(staff.id),
    requirementProfiles: care.staffImmigrationRequirementProfiles,
    visaRecords: care.staffVisaRecords,
    residenceRecords: care.staffResidencePermissionRecords,
    permitRecords: care.staffEmploymentPermitRecords,
    visaTypes: care.staffVisaTypes,
    permitTypes: care.staffEmploymentPermitTypes,
    canViewSensitive: canViewSensitiveWorkforce,
  });
  const trainingRows = getStaffTrainingProfile({ staffMemberId: String(staff.id), courses: care.trainingCourses, assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions });
  const competencyRows = getStaffCompetencyProfile({ staffMemberId: String(staff.id), definitions: care.competencyDefinitions, requirements: care.competencyRequirements, validations: care.staffCompetencyValidations });
  const homeAssignmentRows = care.employmentHomeAssignments
    .filter((assignment) => String(assignment.staffMemberId) === String(staff.id))
    .map((assignment) => staffHomeAssignmentCardModel(assignment, { facilities: care.facilities, employmentRecords: care.employmentRecords, canViewFte: canViewHomeAssignmentFte }));

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
            <div className="mt-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {row.userAccount?.label || "No User Account"}</div>
          </div>
          {canEditPersonal && <Button variant="outline" onClick={() => setPersonalOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit Profile</Button>}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Work Contact" action={canEditContact ? <Button size="sm" variant="outline" onClick={() => setWorkContactOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button> : undefined}>
          <Detail icon={Mail} label="Work Email" value={row.workEmail || "Not recorded"} />
          <Detail icon={Phone} label="Work Phone" value={row.workPhone || "Not recorded"} />
        </Section>

        <Section title="Personal Details" action={canEditPersonal ? <Button size="sm" variant="outline" onClick={() => setPersonalOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button> : undefined}>
          {canPersonal ? (
            <>
              <Detail label="First Name" value={staff.firstName || "Not recorded"} />
              <Detail label="Last Name" value={staff.surname || staff.lastName || "Not recorded"} />
              <Detail label="Preferred Name" value={staff.preferredName || "Not recorded"} />
              <Detail label="Date of Birth" value={staff.dateOfBirth || "Not recorded"} />
              <Detail label="Gender" value={staff.gender ? staff.gender.replaceAll("_", " ") : "Not recorded"} />
              <Detail label="Nationality" value={staff.nationalityDisplayName || staff.nationalityCode || "Not recorded"} />
              <Detail label="Mobile" value={staff.contactDetails?.personalPhone || "Not recorded"} />
              <Detail label="Personal Email" value={staff.contactDetails?.personalEmail || "Not recorded"} />
            </>
          ) : <p className="text-sm text-muted-foreground">Personal details are restricted.</p>}
        </Section>

        <Section title="Address" action={canEditAddress ? <Button size="sm" variant="outline" onClick={() => setPersonalOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button> : undefined}>
          {canAddress ? (
            <p className="text-sm">{[staff.address?.line1, staff.address?.line2, staff.address?.townCity, staff.address?.countyRegion, staff.address?.postcode, staff.address?.country].filter(Boolean).join(", ") || "Not recorded"}</p>
          ) : <p className="text-sm text-muted-foreground">Address details are restricted.</p>}
        </Section>

        <Section title="Emergency Contacts" action={canManageContacts ? <Button size="sm" onClick={() => setEmergencyContactDialog("new")}><Plus className="mr-2 h-4 w-4" /> Add Contact</Button> : undefined}>
          {canContacts ? (
            contacts.length ? contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3"><strong>{contact.fullName}</strong><div className="flex items-center gap-2">{contact.isPrimary && <Badge variant="outline">Primary</Badge>}{canManageContacts && <Button size="sm" variant="ghost" onClick={() => setEmergencyContactDialog(contact)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}</div></div>
                <div className="mt-1 text-muted-foreground">{contact.relationship || "Relationship not recorded"} · {contact.phoneNumber}</div>
                {contact.email && <div className="mt-1 text-muted-foreground">{contact.email}</div>}
                {contact.notes && <div className="mt-1 text-muted-foreground">{contact.notes}</div>}
              </div>
            )) : <p className="text-sm text-muted-foreground">No active emergency contacts recorded.</p>
          ) : <p className="text-sm text-muted-foreground">Emergency contacts are restricted.</p>}
        </Section>

        <Section title="System Access" action={canManageAccount ? <Button size="sm" variant={linkedAccount ? "outline" : "default"} onClick={() => setSystemAccessOpen(true)}><ShieldCheck className="mr-2 h-4 w-4" /> {linkedAccount ? "Manage" : "Create Login"}</Button> : undefined}>
          {canAccount ? (
            <div className="space-y-2 text-sm">
              <Detail icon={ShieldCheck} label="Login Status" value={row.userAccount?.label || "No User Account"} />
              <Detail icon={Mail} label="Email" value={linkedAccount?.email || linkedAccount?.username || "Not recorded"} />
              <Detail label="Role" value={linkedUser?.role ? linkedUser.role.replaceAll("_", " ") : "Not recorded"} />
              <Detail label="Last Login" value={linkedAccount?.lastLoginAt || linkedUser?.lastLogin || "Not recorded"} />
            </div>
          ) : <p className="text-sm text-muted-foreground">System access details are restricted.</p>}
        </Section>
      </div>

      <Section
        title="Employment Records"
        action={canCreateEmployment ? <Button size="sm" onClick={() => setEmploymentOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Employment Record</Button> : undefined}
      >
        <p className="text-sm text-muted-foreground">Contracts, roles, home assignments and payroll references for this Staff Member.</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {employmentCards.map((record) => (
            <div key={record.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{record.employeeNumber}</div><div className="text-muted-foreground">{record.contractType}</div></div>
                <Badge>{record.status}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Start: {record.startDate}</span>
                <span>End: {record.endDate || "Open"}</span>
                <span>FTE: {record.fte ?? "Not recorded"}</span>
                <span>Hours: {record.contractedHoursPerWeek ?? "Not recorded"}</span>
                <span>Home: {record.primaryHome}</span>
                <span>Role: {record.primaryRole}</span>
              </div>
              {record.additionalHomes.length > 0 && <p className="mt-2 text-muted-foreground">Additional homes: {record.additionalHomes.join(", ")}</p>}
              {record.additionalRoles.length > 0 && <p className="mt-2 text-muted-foreground">Additional roles: {record.additionalRoles.join(", ")}</p>}
              {canViewPayroll && <p className="mt-2 text-muted-foreground">Payroll link: {record.payrollLinked ? "Linked" : "Not recorded"}</p>}
              {canEditEmployment && <Button className="mt-3" size="sm" variant="outline" onClick={() => setEmploymentEditId(record.id)}><Pencil className="mr-2 h-4 w-4" /> Edit Employment</Button>}
            </div>
          ))}
          {employmentCards.length === 0 && <p className="text-sm text-muted-foreground">No Employment Records have been added for this Staff Member.</p>}
        </div>
      </Section>

      <Section
        title="Home Assignments"
        action={canCreateHomeAssignment ? <Button size="sm" onClick={() => setHomeAssignmentOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Assignment</Button> : undefined}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {homeAssignmentRows.map((assignment) => (
            <div key={assignment.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{assignment.homeName}</div><div className="text-muted-foreground">{assignment.type}</div></div>
                <div className="flex gap-2"><Badge variant="outline">{assignment.status}</Badge>{assignment.isPrimary && <Badge>Primary</Badge>}</div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>State: {assignment.effectiveState}</span>
                <span>Role: {assignment.roleSummary}</span>
                <span>From: {assignment.effectiveFrom}</span>
                <span>To: {assignment.effectiveTo || "Open"}</span>
                {canViewHomeAssignmentFte && <span>FTE: {assignment.fteAtHome ?? "Not allocated"}</span>}
                {canViewHomeAssignmentFte && <span>Hours: {assignment.hoursAtHome ?? "Not allocated"}</span>}
              </div>
              {assignment.agencyProviderId && <p className="mt-2 text-muted-foreground">Agency provider: {assignment.agencyProviderId}</p>}
              {canEndHomeAssignment && assignment.status === "Active" && <Button className="mt-3" size="sm" variant="outline" onClick={() => { care.endStaffHomeAssignment(assignment.id); toast.success("Home Assignment ended."); }}>End Assignment</Button>}
            </div>
          ))}
          {homeAssignmentRows.length === 0 && <p className="text-sm text-muted-foreground">No Home Assignments have been recorded for this Staff Member.</p>}
        </div>
      </Section>

      <Section
        title="Professional Registrations"
        action={canCreateRegistration ? <Button size="sm" onClick={() => setRegistrationOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Registration</Button> : undefined}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {registrationRows.map((record) => (
            <div key={record.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{record.registrationBody}</div><div className="text-muted-foreground">{record.profession}</div></div>
                <Badge variant="outline">{record.status}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Number: {record.registrationNumber || "Restricted"}</span>
                <span>Expiry: {record.expiryDate || "Not recorded"}</span>
                <span>Verification: {record.verificationStatus}</span>
                <span>Document: {record.documentLinked ? "Linked" : "Not linked"}</span>
              </div>
              {record.restrictionsOrConditionsPresent && capabilities.includes("professional_registration.view_conditions") && <p className="mt-2 text-amber-700">Restrictions or conditions present.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {canEditRegistration && <Button size="sm" variant="outline" onClick={() => setRegistrationEditId(record.id)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}
                {canEditRegistration && <Button size="sm" variant="outline" onClick={() => setRegistrationEditId(record.id)}>Renew</Button>}
                {canVerifyRegistration && <Button size="sm" variant="outline" onClick={() => { care.verifyProfessionalRegistration(record.id); toast.success("Registration verified."); }}><CheckCircle2 className="mr-2 h-4 w-4" /> Verify</Button>}
              </div>
            </div>
          ))}
          {registrationRows.length === 0 && <p className="text-sm text-muted-foreground">No Professional Registrations have been recorded.</p>}
        </div>
      </Section>

      <Section
        title="Visa & Immigration"
        action={canCreateImmigration ? <Button size="sm" onClick={() => setImmigrationOpen(true)}><Plane className="mr-2 h-4 w-4" /> Add Immigration Record</Button> : undefined}
      >
        <p className="text-sm text-muted-foreground">Visa, Irish Residence Permission / GNIB and Employment Permit records are structured separately from generic document evidence.</p>
        <div className="grid gap-3 xl:grid-cols-3">
          <ImmigrationCard title="Visa" record={immigrationSummary.visa} empty="No Visa record has been added for this Staff Member." onVerify={canVerifyImmigration && immigrationSummary.visa ? () => care.verifyStaffVisaRecord(immigrationSummary.visa!.id) : undefined} />
          <ImmigrationCard title="Irish Residence Permission / GNIB" record={immigrationSummary.residencePermission} empty="No Irish Residence Permission record has been added." onVerify={canVerifyImmigration && immigrationSummary.residencePermission ? () => care.verifyResidencePermissionRecord(immigrationSummary.residencePermission!.id) : undefined} />
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-semibold">Employment Permits</div>
            {immigrationSummary.employmentPermits.length ? immigrationSummary.employmentPermits.map((permit) => (
              <div key={permit.id} className="mt-3 border-t pt-3">
                <div className="font-medium">{permit.label}</div>
                <div className="text-muted-foreground">Ref: {permit.referenceDisplay || "Not recorded"}</div>
                <div className="text-muted-foreground">Expiry: {permit.expiryDate || "Not recorded"}</div>
                <Badge variant="outline" className="mt-2">{permit.status}</Badge>
                {canVerifyImmigration && <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => care.verifyEmploymentPermitRecord(permit.id)}>Verify</Button>}
              </div>
            )) : <p className="mt-3 text-muted-foreground">No Employment Permit records have been added.</p>}
          </div>
        </div>
        {immigrationSummary.activeAlerts.length > 0 && <p className="text-sm text-amber-700">{immigrationSummary.activeAlerts.length} immigration item(s) require compliance review.</p>}
      </Section>

      <Section
        title="Staff Documents"
        action={canCreateDocument ? <Button size="sm" onClick={() => setDocumentOpen(true)}><FileText className="mr-2 h-4 w-4" /> Upload Document</Button> : undefined}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {documentRows.map((document) => (
            <div key={document.staffDocumentId} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{document.documentType.name}</div><div className="text-muted-foreground">{document.title || document.documentType.category.replaceAll("_", " ")}</div></div>
                <Badge variant="outline">{document.effectiveStatus}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Reference: {document.referenceNumberDisplay || "Not recorded"}</span>
                <span>Verification: {document.verificationStatus.replaceAll("_", " ")}</span>
                <span>Issue: {document.issueDate || "Not recorded"}</span>
                <span>Expiry: {document.expiryDate || "Not recorded"}</span>
              </div>
              {canVerifyDocument && <Button className="mt-3" size="sm" variant="outline" onClick={() => care.verifyStaffDocument(document.staffDocumentId)}><CheckCircle2 className="mr-2 h-4 w-4" /> Verify Document</Button>}
            </div>
          ))}
          {documentRows.length === 0 && <p className="text-sm text-muted-foreground">No Staff Documents have been uploaded.</p>}
        </div>
      </Section>

      <Section
        title="Training"
        action={<div className="flex gap-2">{canAssignTraining && <Button size="sm" variant="outline" onClick={() => setTrainingAssignOpen(true)}>Assign Training</Button>}{canRecordTraining && <Button size="sm" onClick={() => setTrainingCompletionOpen(true)}>Record Completion</Button>}</div>}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {trainingRows.map((row) => (
            <div key={row.assignmentId} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{row.courseTitle}</div><div className="text-muted-foreground">{row.mandatory ? "Mandatory" : "Optional"}</div></div>
                <Badge variant="outline">{row.status.replaceAll("_", " ")}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Due: {row.dueDate || "Not recorded"}</span>
                <span>Completed: {row.completionDate || "Not recorded"}</span>
                <span>Expiry: {row.expiryDate || "Not recorded"}</span>
                <span>Certificate: {row.certificateLinked ? "Linked" : "Not linked"}</span>
              </div>
              {canVerifyTraining && row.verificationStatus === "pending" && <Button className="mt-3" size="sm" variant="outline" onClick={() => care.verifyTrainingCompletion(String(row.completionId))}>Verify Completion</Button>}
            </div>
          ))}
          {trainingRows.length === 0 && <p className="text-sm text-muted-foreground">No Training Assignments have been created for this Staff Member.</p>}
        </div>
      </Section>

      <Section
        title="Competencies"
        action={canRecordCompetency ? <Button size="sm" onClick={() => setCompetencyOpen(true)}>Record Validation</Button> : undefined}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {competencyRows.map((row) => (
            <div key={row.competencyDefinitionId} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{row.title}</div><div className="text-muted-foreground">{row.category}</div></div>
                <Badge variant="outline">{row.status.replaceAll("_", " ")}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Scope: {row.scope || "Not recorded"}</span>
                <span>Validated: {row.validationDate || "Not recorded"}</span>
                <span>Expiry: {row.expiryDate || "Not recorded"}</span>
                <span>Supervision: {row.supervisionRequired ? "Required" : "No"}</span>
              </div>
              {row.restrictionsPresent && capabilities.includes("competency.view_restrictions") && <p className="mt-2 text-amber-700">Restrictions are present.</p>}
            </div>
          ))}
          {competencyRows.length === 0 && <p className="text-sm text-muted-foreground">No Competency Validations have been recorded for this Staff Member.</p>}
        </div>
      </Section>

      <EditPersonalDetailsDialog open={personalOpen} staff={staff} homes={care.facilities} onOpenChange={setPersonalOpen} onSave={(input, photoUrlChanged) => { try { care.updateStaffMember(String(staff.id), input); if (photoUrlChanged) care.updateStaffPhoto(String(staff.id), input.photoUrl); toast.success("Personal details saved."); setPersonalOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The personal details could not be saved."); } }} />
      <EditWorkContactDialog open={workContactOpen} staff={staff} onOpenChange={setWorkContactOpen} onSave={(input) => { try { care.updateStaffMember(String(staff.id), input); toast.success("Work contact saved."); setWorkContactOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The work contact could not be saved."); } }} />
      <EmergencyContactDialog open={Boolean(emergencyContactDialog)} staffMemberId={String(staff.id)} contact={emergencyContactDialog === "new" ? undefined : emergencyContactDialog || undefined} onOpenChange={(open) => !open && setEmergencyContactDialog(null)} onSave={(input) => { try { if (emergencyContactDialog && emergencyContactDialog !== "new") care.updateStaffEmergencyContact(String(staff.id), emergencyContactDialog.id, input); else care.addStaffEmergencyContact(String(staff.id), input); toast.success("Emergency contact saved."); setEmergencyContactDialog(null); } catch (error) { toast.error(error instanceof Error ? error.message : "The emergency contact could not be saved."); } }} onRemove={(contactId) => { try { care.inactivateStaffEmergencyContact(String(staff.id), contactId); toast.success("Emergency contact removed."); setEmergencyContactDialog(null); } catch (error) { toast.error(error instanceof Error ? error.message : "The emergency contact could not be removed."); } }} />
      <SystemAccessDialog open={systemAccessOpen} staff={staff} account={linkedAccount} user={linkedUser} onOpenChange={setSystemAccessOpen} onCreate={(input) => { try { care.createStaffUser(input); toast.success("Login created."); setSystemAccessOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The login could not be created."); } }} onUpdateUser={(id, patch) => { try { care.updateUser(id, patch); toast.success("Login access updated."); setSystemAccessOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The login access could not be updated."); } }} onUnlink={() => { try { care.unlinkStaffUserAccount(String(staff.id)); toast.success("Login unlinked."); setSystemAccessOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The login could not be unlinked."); } }} />
      <AddEmploymentDialog open={employmentOpen} staffMemberId={String(staff.id)} homes={care.facilities} onOpenChange={setEmploymentOpen} onSave={(input) => { try { care.createEmploymentRecord(input); toast.success("Employment Record saved."); setEmploymentOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Employment Record could not be saved."); } }} />
      <EditEmploymentDialog open={Boolean(employmentEditId)} record={care.employmentRecords.find((record) => String(record.id) === employmentEditId)} homes={care.facilities} onOpenChange={(open) => !open && setEmploymentEditId(null)} onSave={(id, input) => { try { care.updateEmploymentRecord(id, input); toast.success("Employment Record saved."); setEmploymentEditId(null); } catch (error) { toast.error(error instanceof Error ? error.message : "The Employment Record could not be saved."); } }} />
      <AddRegistrationDialog open={registrationOpen} staffMemberId={String(staff.id)} onOpenChange={setRegistrationOpen} onSave={(input) => { try { care.createProfessionalRegistration(input); toast.success("Professional Registration saved."); setRegistrationOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Professional Registration could not be saved."); } }} />
      <EditRegistrationDialog open={Boolean(registrationEditId)} registration={care.professionalRegistrations.find((record) => String(record.id) === registrationEditId)} onOpenChange={(open) => !open && setRegistrationEditId(null)} onSave={(id, input) => { try { care.updateProfessionalRegistration(id, input); toast.success("Professional Registration saved."); setRegistrationEditId(null); } catch (error) { toast.error(error instanceof Error ? error.message : "The Professional Registration could not be saved."); } }} />
      <AddStaffDocumentDialog open={documentOpen} staffMemberId={String(staff.id)} documentTypes={care.staffDocumentTypes} onOpenChange={setDocumentOpen} onSave={(input) => { try { care.createStaffDocument(input); toast.success("Staff Document saved."); setDocumentOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Staff Document could not be saved."); } }} />
      <AddImmigrationDialog open={immigrationOpen} staffMemberId={String(staff.id)} visaTypes={care.staffVisaTypes} permitTypes={care.staffEmploymentPermitTypes} onOpenChange={setImmigrationOpen} onSave={(kind, input) => { try { if (kind === "visa") care.createStaffVisaRecord(input as CreateStaffVisaRecordCommand); if (kind === "residence") care.createResidencePermissionRecord(input as CreateResidencePermissionRecordCommand); if (kind === "permit") care.createEmploymentPermitRecord(input as CreateEmploymentPermitRecordCommand); toast.success("Immigration record saved."); setImmigrationOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Immigration record could not be saved."); } }} />
      <AssignTrainingDialog open={trainingAssignOpen} staffMemberId={String(staff.id)} courses={care.trainingCourses} onOpenChange={setTrainingAssignOpen} onSave={(input) => { try { care.assignTrainingToStaff(input); toast.success("Training assigned."); setTrainingAssignOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Training record could not be saved."); } }} />
      <RecordTrainingCompletionDialog open={trainingCompletionOpen} staffMemberId={String(staff.id)} courses={care.trainingCourses} assignments={care.staffTrainingAssignments.filter((assignment) => String(assignment.staffMemberId) === String(staff.id))} onOpenChange={setTrainingCompletionOpen} onSave={(input) => { try { care.recordTrainingCompletion(input); toast.success("Training completion recorded."); setTrainingCompletionOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Training record could not be saved."); } }} />
      <RecordCompetencyDialog open={competencyOpen} staffMemberId={String(staff.id)} definitions={care.competencyDefinitions} onOpenChange={setCompetencyOpen} onSave={(input) => { try { care.recordCompetencyValidation(input); toast.success("Competency validation recorded."); setCompetencyOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Competency Validation could not be saved."); } }} />
      <AddHomeAssignmentDialog open={homeAssignmentOpen} staffMemberId={String(staff.id)} homes={care.facilities} employmentRecords={care.employmentRecords.filter((record) => String(record.staffMemberId) === String(staff.id))} onOpenChange={setHomeAssignmentOpen} onSave={(input) => { try { care.createStaffHomeAssignment(input); toast.success("Home Assignment saved."); setHomeAssignmentOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Home Assignment could not be saved."); } }} />
    </div>
  );
}

function ImmigrationCard({ title, record, empty, onVerify }: { title: string; record?: { id: string; label: string; referenceDisplay?: string; expiryDate?: string; reviewDate?: string; status: string; verificationStatus: string }; empty: string; onVerify?: () => void }) {
  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="font-semibold">{title}</div>
      {record ? (
        <div className="mt-3 space-y-2">
          <div>{record.label}</div>
          <div className="text-muted-foreground">Ref: {record.referenceDisplay || "Not recorded"}</div>
          <div className="text-muted-foreground">Expiry: {record.expiryDate || "Not recorded"}</div>
          <div className="text-muted-foreground">Verification: {record.verificationStatus}</div>
          <Badge variant="outline">{record.status}</Badge>
          {onVerify && <Button className="w-full" size="sm" variant="outline" onClick={onVerify}>Verify</Button>}
        </div>
      ) : <p className="mt-3 text-muted-foreground">{empty}</p>}
    </div>
  );
}

function StaffProfileState({ status }: { status: "malformed" | "forbidden" | "not_found" }) {
  const title =
    status === "forbidden"
      ? "Staff Profile Access Denied"
      : status === "malformed"
        ? "Invalid Staff Profile Link"
        : "Staff Member Not Found";
  const message =
    status === "forbidden"
      ? "You do not have permission to view this Staff Profile or it is outside your authorised Home scope."
      : status === "malformed"
        ? "This Staff Profile link is not valid."
        : "This Staff Profile may have been removed, entered in error, or you may not have access to it.";

  return (
    <div className="p-6">
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild><Link to="/workforce/staff">Return to Staff Directory</Link></Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">{title}</CardTitle>{action}</CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>;
}

function Detail({ icon: Icon = UserRound, label, value }: { icon?: any; label: string; value: string }) {
  return <div className="flex items-center gap-3 text-sm"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{label}:</span><span>{value}</span></div>;
}

function EditPersonalDetailsDialog({ open, staff, homes, onOpenChange, onSave }: { open: boolean; staff: StaffMember; homes: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: any, photoUrlChanged: boolean) => void }) {
  const [form, setForm] = useState(() => personalDraft(staff));
  const [photoChanged, setPhotoChanged] = useState(false);
  useEffect(() => { if (open) { setForm(personalDraft(staff)); setPhotoChanged(false); } }, [open, staff.id]);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setAddress = (key: string, value: string) => setForm((current) => ({ ...current, address: { ...current.address, [key]: value || undefined } }));
  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { set("photoUrl", String(reader.result || "")); setPhotoChanged(true); };
    reader.readAsDataURL(file);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Personal Details</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
          <Avatar className="h-20 w-20"><AvatarImage src={form.photoUrl} /><AvatarFallback>{(form.firstName?.[0] || "S")}{(form.surname?.[0] || "M")}</AvatarFallback></Avatar>
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <Input type="file" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} />
            {form.photoUrl && <Button size="sm" variant="outline" onClick={() => { set("photoUrl", ""); setPhotoChanged(true); }}><X className="mr-2 h-4 w-4" /> Remove Photo</Button>}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name"><Input value={form.firstName} onChange={(event) => set("firstName", event.target.value)} /></Field>
          <Field label="Last Name"><Input value={form.surname} onChange={(event) => set("surname", event.target.value)} /></Field>
          <Field label="Preferred Name"><Input value={form.preferredName} onChange={(event) => set("preferredName", event.target.value)} /></Field>
          <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={(event) => set("dateOfBirth", event.target.value)} /></Field>
          <Field label="Gender"><Select value={form.gender || "not_recorded"} onValueChange={(value) => set("gender", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["female", "male", "non_binary", "other", "prefer_not_to_say", "not_recorded"].map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Nationality"><Input value={form.nationalityDisplayName} onChange={(event) => set("nationalityDisplayName", event.target.value)} /></Field>
          <Field label="Mobile"><Input value={form.personalPhone} onChange={(event) => set("personalPhone", event.target.value)} /></Field>
          <Field label="Personal Email"><Input type="email" value={form.personalEmail} onChange={(event) => set("personalEmail", event.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STAFF_MEMBER_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Primary Home"><Select value={form.primaryNursingHomeId || homes[0]?.id} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Address Line 1"><Input value={form.address.line1 || ""} onChange={(event) => setAddress("line1", event.target.value)} /></Field>
          <Field label="Address Line 2"><Input value={form.address.line2 || ""} onChange={(event) => setAddress("line2", event.target.value)} /></Field>
          <Field label="Town / City"><Input value={form.address.townCity || ""} onChange={(event) => setAddress("townCity", event.target.value)} /></Field>
          <Field label="County"><Input value={form.address.countyRegion || ""} onChange={(event) => setAddress("countyRegion", event.target.value)} /></Field>
          <Field label="Postcode"><Input value={form.address.postcode || ""} onChange={(event) => setAddress("postcode", event.target.value)} /></Field>
          <Field label="Country"><Input value={form.address.country || ""} onChange={(event) => setAddress("country", event.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(cleanDraft(form), photoChanged)}>Save Personal Details</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function EditWorkContactDialog({ open, staff, onOpenChange, onSave }: { open: boolean; staff: StaffMember; onOpenChange: (open: boolean) => void; onSave: (input: any) => void }) {
  const [form, setForm] = useState({ workEmail: staff.contactDetails?.workEmail || staff.email || "", workPhone: staff.contactDetails?.workPhone || staff.phone || "" });
  useEffect(() => { if (open) setForm({ workEmail: staff.contactDetails?.workEmail || staff.email || "", workPhone: staff.contactDetails?.workPhone || staff.phone || "" }); }, [open, staff.id]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Edit Work Contact</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Work Email"><Input type="email" value={form.workEmail} onChange={(event) => setForm((current) => ({ ...current, workEmail: event.target.value }))} /></Field>
        <Field label="Work Phone"><Input value={form.workPhone} onChange={(event) => setForm((current) => ({ ...current, workPhone: event.target.value }))} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ workEmail: form.workEmail || undefined, workPhone: form.workPhone || undefined })}>Save Work Contact</Button></div>
    </DialogContent></Dialog>
  );
}

function EmergencyContactDialog({ open, staffMemberId, contact, onOpenChange, onSave, onRemove }: { open: boolean; staffMemberId: string; contact?: StaffEmergencyContact; onOpenChange: (open: boolean) => void; onSave: (input: Omit<StaffEmergencyContact, "id" | "staffMemberId" | "createdAt" | "updatedAt">) => void; onRemove: (contactId: string) => void }) {
  const [form, setForm] = useState(() => emergencyContactDraft(contact));
  useEffect(() => { if (open) setForm(emergencyContactDraft(contact)); }, [open, contact?.id]);
  const set = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{contact ? "Edit Emergency Contact" : "Add Emergency Contact"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name"><Input value={form.fullName} onChange={(event) => set("fullName", event.target.value)} /></Field>
        <Field label="Relationship"><Input value={form.relationship} onChange={(event) => set("relationship", event.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phoneNumber} onChange={(event) => set("phoneNumber", event.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></Field>
        <Field label="Address"><Input value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPrimary} onChange={(event) => set("isPrimary", event.target.checked)} /> Primary Contact</label>
      <div className="flex justify-between gap-2 pt-4">
        <div>{contact && <Button variant="outline" onClick={() => onRemove(contact.id)}>Remove Contact</Button>}</div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, staffMemberId: staffMemberId as any, fullName: form.fullName.trim(), phoneNumber: form.phoneNumber.trim(), relationship: form.relationship || undefined, email: form.email || undefined, notes: form.notes || undefined, active: true, priority: form.priority || 1, isPrimary: form.isPrimary })}>Save Contact</Button></div>
      </div>
    </DialogContent></Dialog>
  );
}

function SystemAccessDialog({ open, staff, account, user, onOpenChange, onCreate, onUpdateUser, onUnlink }: { open: boolean; staff: StaffMember; account?: UserAccount; user?: UserProfile; onOpenChange: (open: boolean) => void; onCreate: (input: { staffMemberId: string; name: string; role: Role; email: string; status: UserProfile["status"]; accountStatus?: UserAccount["accountStatus"]; temporaryPassword?: string }) => void; onUpdateUser: (id: string, patch: Partial<UserProfile>) => void; onUnlink: () => void }) {
  const [form, setForm] = useState({ name: staff.displayName, email: staff.contactDetails?.workEmail || staff.email || "", role: "nurse" as Role, accountStatus: "invited" as UserAccount["accountStatus"], temporaryPassword: "" });
  useEffect(() => { if (open) setForm({ name: staff.displayName, email: account?.email || staff.contactDetails?.workEmail || staff.email || "", role: user?.role || "nurse", accountStatus: account?.accountStatus || "invited", temporaryPassword: "" }); }, [open, staff.id, account?.id, user?.id]);
  const statusFromAccount = form.accountStatus === "disabled" ? "inactive" : form.accountStatus === "suspended" || form.accountStatus === "locked" ? "suspended" : "active";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Manage System Access</DialogTitle></DialogHeader>
      {account ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{account.email || account.username || "Login email not recorded"}</div>
            <div className="text-muted-foreground">Status: {account.accountStatus.replaceAll("_", " ")} · Last login: {account.lastLoginAt || user?.lastLogin || "Not recorded"}</div>
            <div className="text-muted-foreground">Role: {user?.role?.replaceAll("_", " ") || "Not recorded"}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user && user.status !== "suspended" && <Button variant="outline" onClick={() => onUpdateUser(user.id, { status: "suspended" })}>Suspend Access</Button>}
            {user && user.status !== "active" && <Button onClick={() => onUpdateUser(user.id, { status: "active" })}>Reactivate</Button>}
            <Button variant="outline" onClick={onUnlink}>Unlink Login</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display Name"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Login Email"><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
            <Field label="Role"><Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as Role }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["carer", "nurse", "doctor", "cnm", "don", "group_owner"].map((role) => <SelectItem key={role} value={role}>{role.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Account Status"><Select value={form.accountStatus} onValueChange={(value) => setForm((current) => ({ ...current, accountStatus: value as UserAccount["accountStatus"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["invited", "active", "suspended", "locked", "disabled"].map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Temporary Password"><Input value={form.temporaryPassword} onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Optional" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onCreate({ staffMemberId: String(staff.id), name: form.name, email: form.email, role: form.role, status: statusFromAccount, accountStatus: form.accountStatus, temporaryPassword: form.temporaryPassword || undefined })}>Create Login</Button></div>
        </>
      )}
    </DialogContent></Dialog>
  );
}

function EditEmploymentDialog({ open, record, homes, onOpenChange, onSave }: { open: boolean; record?: EmploymentRecord; homes: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (id: string, input: Partial<CreateEmploymentRecordCommand>) => void }) {
  const [form, setForm] = useState(() => employmentDraft(record));
  useEffect(() => { if (open) setForm(employmentDraft(record)); }, [open, record?.id]);
  if (!record) return null;
  const set = (key: keyof CreateEmploymentRecordCommand, value: string) => setForm((current) => ({ ...current, [key]: key === "fteValue" || key === "contractedHoursPerWeek" ? Number(value) : value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Edit Employment</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Position"><Input value={form.primaryRoleKey || ""} onChange={(event) => set("primaryRoleKey", event.target.value)} /></Field>
        <Field label="Department"><Input value={(form as any).department || ""} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value } as any))} /></Field>
        <Field label="Primary Home"><Select value={form.primaryNursingHomeId || homes[0]?.id} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Employment Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Start Date"><Input type="date" value={form.startDate || ""} onChange={(event) => set("startDate", event.target.value)} /></Field>
        <Field label="End Date"><Input type="date" value={form.endDate || ""} onChange={(event) => set("endDate", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(String(record.id), form)}>Save Employment</Button></div>
    </DialogContent></Dialog>
  );
}

function EditRegistrationDialog({ open, registration, onOpenChange, onSave }: { open: boolean; registration?: ProfessionalRegistration; onOpenChange: (open: boolean) => void; onSave: (id: string, input: Partial<CreateProfessionalRegistrationCommand>) => void }) {
  const [form, setForm] = useState(() => registrationDraft(registration));
  useEffect(() => { if (open) setForm(registrationDraft(registration)); }, [open, registration?.id]);
  if (!registration) return null;
  const set = (key: keyof CreateProfessionalRegistrationCommand, value: string | boolean) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Edit Professional Registration</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Registration Body"><Input value={form.registrationBody || ""} onChange={(event) => set("registrationBody", event.target.value)} /></Field>
        <Field label="Profession"><Select value={form.profession} onValueChange={(value) => set("profession", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nurse">Nurse</SelectItem><SelectItem value="doctor">Doctor</SelectItem><SelectItem value="allied_health">Allied Health</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></Field>
        <Field label="Registration Number"><Input value={form.registrationNumber || ""} onChange={(event) => set("registrationNumber", event.target.value)} /></Field>
        <Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
        <Field label="Review Date"><Input type="date" value={form.reviewDate || ""} onChange={(event) => set("reviewDate", event.target.value)} /></Field>
        <Field label="Status"><Select value={form.status || "draft"} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["draft", "current", "expired", "suspended", "revoked", "entered_in_error"].map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Evidence Document IDs"><Input value={(form.documentIds || []).join(", ")} onChange={(event) => setForm((current) => ({ ...current, documentIds: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.restrictionsOrConditionsPresent)} onChange={(event) => set("restrictionsOrConditionsPresent", event.target.checked)} /> Restrictions or conditions present</label>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(String(registration.id), form)}>Save Registration</Button></div>
    </DialogContent></Dialog>
  );
}

function AddEmploymentDialog({ open, staffMemberId, homes, onOpenChange, onSave }: { open: boolean; staffMemberId: string; homes: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: CreateEmploymentRecordCommand) => void }) {
  const [form, setForm] = useState<CreateEmploymentRecordCommand>({ staffMemberId, employeeNumber: "", contractType: "permanent_full_time", status: "active", startDate: new Date().toISOString().slice(0, 10), primaryNursingHomeId: homes[0]?.id, primaryRoleKey: "NURSE", fteValue: 1, contractedHoursPerWeek: 37.5, isPrimaryEmployment: true });
  const set = (key: keyof CreateEmploymentRecordCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: key === "fteValue" || key === "contractedHoursPerWeek" ? Number(value) : value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Employment Record</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Employee Number"><Input value={form.employeeNumber} onChange={(event) => set("employeeNumber", event.target.value)} /></Field>
        <Field label="Contract Type"><Select value={form.contractType} onValueChange={(value) => set("contractType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_CONTRACT_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field>
        <Field label="FTE"><Input type="number" step="0.1" value={form.fteValue ?? ""} onChange={(event) => set("fteValue", event.target.value)} /></Field>
        <Field label="Hours / Week"><Input type="number" step="0.5" value={form.contractedHoursPerWeek ?? ""} onChange={(event) => set("contractedHoursPerWeek", event.target.value)} /></Field>
        <Field label="Primary Home"><Select value={form.primaryNursingHomeId} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Primary Role"><Select value={form.primaryRoleKey} onValueChange={(value) => set("primaryRoleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["NURSE", "CNM", "HCA", "DOCTOR", "ADMINISTRATION", "HOUSEKEEPING", "MAINTENANCE"].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Employment Record</Button></div>
    </DialogContent></Dialog>
  );
}

function AddRegistrationDialog({ open, staffMemberId, onOpenChange, onSave }: { open: boolean; staffMemberId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateProfessionalRegistrationCommand) => void }) {
  const [form, setForm] = useState<CreateProfessionalRegistrationCommand>({ staffMemberId, registrationBody: "Nursing and Midwifery Board of Ireland", registrationBodyId: "nmbi", profession: "nurse", registrationNumber: "", status: "draft", verificationStatus: "not_submitted" });
  const set = (key: keyof CreateProfessionalRegistrationCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Professional Registration</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Registration Body"><Input value={form.registrationBody} onChange={(event) => set("registrationBody", event.target.value)} /></Field>
        <Field label="Profession"><Select value={form.profession} onValueChange={(value) => set("profession", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nurse">Nurse</SelectItem><SelectItem value="doctor">Doctor</SelectItem><SelectItem value="allied_health">Allied Health</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></Field>
        <Field label="Registration Number"><Input value={form.registrationNumber || ""} onChange={(event) => set("registrationNumber", event.target.value)} /></Field>
        <Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Registration</Button></div>
    </DialogContent></Dialog>
  );
}

function AddStaffDocumentDialog({ open, staffMemberId, documentTypes, onOpenChange, onSave }: { open: boolean; staffMemberId: string; documentTypes: { id: string; name: string; key: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: CreateStaffDocumentCommand) => void }) {
  const [form, setForm] = useState<CreateStaffDocumentCommand>({ staffMemberId, documentTypeId: documentTypes[0]?.id || "staff-document-type-passport", fileId: `demo-file-${Date.now()}`, clientRequestId: `staff-document-${Date.now()}` });
  const [fileName, setFileName] = useState("");
  const set = (key: keyof CreateStaffDocumentCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: value || undefined }));
  const selectFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setForm((current) => ({ ...current, staffMemberId, title: current.title || file.name, fileId: `staff-file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`, clientRequestId: current.clientRequestId || `staff-document-${Date.now()}` }));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Upload Staff Document</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Document Type"><Select value={form.documentTypeId} onValueChange={(value) => set("documentTypeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{documentTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Title"><Input value={form.title || ""} onChange={(event) => set("title", event.target.value)} /></Field>
        <Field label="Reference"><Input value={form.referenceNumber || ""} onChange={(event) => set("referenceNumber", event.target.value)} /></Field>
        <Field label="Document File"><Input type="file" onChange={(event) => selectFile(event.target.files?.[0])} />{fileName && <p className="text-xs text-muted-foreground">Selected: {fileName}</p>}</Field>
        <Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Document</Button></div>
    </DialogContent></Dialog>
  );
}

function AddImmigrationDialog({ open, staffMemberId, visaTypes, permitTypes, onOpenChange, onSave }: { open: boolean; staffMemberId: string; visaTypes: { id: string; name: string }[]; permitTypes: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (kind: "visa" | "residence" | "permit", input: CreateStaffVisaRecordCommand | CreateResidencePermissionRecordCommand | CreateEmploymentPermitRecordCommand) => void }) {
  const [kind, setKind] = useState<"visa" | "residence" | "permit">("visa");
  const [form, setForm] = useState<any>({ staffMemberId, visaTypeId: visaTypes[0]?.id, permitTypeId: permitTypes[0]?.id, clientRequestId: `immigration-${Date.now()}` });
  const set = (key: string, value: string) => setForm((current: any) => ({ ...current, staffMemberId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Immigration Record</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Record Type"><Select value={kind} onValueChange={(value: any) => setKind(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="visa">Visa</SelectItem><SelectItem value="residence">Irish Residence Permission / GNIB</SelectItem><SelectItem value="permit">Employment Permit</SelectItem></SelectContent></Select></Field>
        {kind === "visa" && <Field label="Visa Type"><Select value={form.visaTypeId} onValueChange={(value) => set("visaTypeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{visaTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field>}
        {kind === "permit" && <Field label="Permit Type"><Select value={form.permitTypeId} onValueChange={(value) => set("permitTypeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{permitTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field>}
        {kind === "residence" ? <Field label="Registration Number"><Input value={form.registrationNumber || ""} onChange={(event) => set("registrationNumber", event.target.value)} /></Field> : <Field label="Reference Number"><Input value={form.visaReferenceNumber || form.permitNumber || ""} onChange={(event) => set(kind === "visa" ? "visaReferenceNumber" : "permitNumber", event.target.value)} /></Field>}
        <Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
        <Field label="Evidence File ID"><Input value={form.evidenceFileId || ""} onChange={(event) => set("evidenceFileId", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(kind, { ...form, staffMemberId, clientRequestId: form.clientRequestId || `immigration-${Date.now()}` })}>Save Immigration Record</Button></div>
    </DialogContent></Dialog>
  );
}

function AssignTrainingDialog({ open, staffMemberId, courses, onOpenChange, onSave }: { open: boolean; staffMemberId: string; courses: { id: string; title: string; status: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: AssignTrainingCommand) => void }) {
  const activeCourses = courses.filter((course) => course.status === "active");
  const [form, setForm] = useState<AssignTrainingCommand>({ staffMemberId, trainingCourseId: activeCourses[0]?.id || "", dueDate: new Date().toISOString().slice(0, 10), source: "manual", clientRequestId: `training-assignment-${Date.now()}` });
  const set = (key: keyof AssignTrainingCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Assign Training</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Course"><Select value={form.trainingCourseId} onValueChange={(value) => set("trainingCourseId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activeCourses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Due Date"><Input type="date" value={form.dueDate || ""} onChange={(event) => set("dueDate", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Assign</Button></div>
    </DialogContent></Dialog>
  );
}

function RecordTrainingCompletionDialog({ open, staffMemberId, courses, assignments, onOpenChange, onSave }: { open: boolean; staffMemberId: string; courses: { id: string; title: string; status: string }[]; assignments: { id: string; trainingCourseId: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: RecordTrainingCompletionCommand) => void }) {
  const activeCourses = courses.filter((course) => course.status === "active");
  const firstAssignment = assignments[0];
  const [form, setForm] = useState<RecordTrainingCompletionCommand>({ staffMemberId, trainingAssignmentId: firstAssignment?.id, trainingCourseId: firstAssignment?.trainingCourseId || activeCourses[0]?.id || "", completionDate: new Date().toISOString().slice(0, 10), result: "completed", clientRequestId: `training-completion-${Date.now()}` });
  const set = (key: keyof RecordTrainingCompletionCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: key === "score" || key === "passMark" ? Number(value) : value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Record Training Completion</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Course"><Select value={form.trainingCourseId} onValueChange={(value) => set("trainingCourseId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activeCourses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Completion Date"><Input type="date" value={form.completionDate} onChange={(event) => set("completionDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
        <Field label="Certificate File ID"><Input value={form.certificateFileId || ""} onChange={(event) => set("certificateFileId", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Record Completion</Button></div>
    </DialogContent></Dialog>
  );
}

function RecordCompetencyDialog({ open, staffMemberId, definitions, onOpenChange, onSave }: { open: boolean; staffMemberId: string; definitions: { id: string; title: string; status: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: RecordCompetencyValidationCommand) => void }) {
  const activeDefinitions = definitions.filter((definition) => definition.status === "active");
  const [form, setForm] = useState<RecordCompetencyValidationCommand>({ staffMemberId, competencyDefinitionId: activeDefinitions[0]?.id || "", validationDate: new Date().toISOString().slice(0, 10), supervisionRequired: false, restrictionsPresent: false, clientRequestId: `competency-validation-${Date.now()}` });
  const set = (key: keyof RecordCompetencyValidationCommand, value: string | boolean) => setForm((current) => ({ ...current, staffMemberId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Record Competency Validation</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Competency"><Select value={form.competencyDefinitionId} onValueChange={(value) => set("competencyDefinitionId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activeDefinitions.map((definition) => <SelectItem key={definition.id} value={definition.id}>{definition.title}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Validation Date"><Input type="date" value={form.validationDate || ""} onChange={(event) => set("validationDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
        <Field label="Evidence File ID"><Input value={form.evidenceFileId || ""} onChange={(event) => set("evidenceFileId", event.target.value)} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.supervisionRequired)} onChange={(event) => set("supervisionRequired", event.target.checked)} /> Competent with supervision</label>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Record Validation</Button></div>
    </DialogContent></Dialog>
  );
}

function AddHomeAssignmentDialog({ open, staffMemberId, homes, employmentRecords, onOpenChange, onSave }: { open: boolean; staffMemberId: string; homes: { id: string; name: string }[]; employmentRecords: { id: string; primaryRoleKey?: string; startDate: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: CreateStaffHomeAssignmentCommand) => void }) {
  const firstEmployment = employmentRecords[0];
  const [form, setForm] = useState<CreateStaffHomeAssignmentCommand>({
    staffMemberId,
    employmentRecordId: firstEmployment?.id,
    nursingHomeId: homes[0]?.id || "",
    assignmentType: "secondary",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    isPrimary: false,
    roleKeys: firstEmployment?.primaryRoleKey ? [firstEmployment.primaryRoleKey] : [],
    clientRequestId: `home-assignment-${Date.now()}`,
  });
  const set = (key: keyof CreateStaffHomeAssignmentCommand, value: string | boolean) => setForm((current) => ({
    ...current,
    staffMemberId,
    [key]: key === "isPrimary" ? Boolean(value) : key === "fteAtHome" || key === "contractedHoursPerWeekAtHome" ? Number(value) : value || undefined,
  }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Home Assignment</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Home"><Select value={form.nursingHomeId} onValueChange={(value) => set("nursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Assignment Type"><Select value={form.assignmentType} onValueChange={(value: any) => set("assignmentType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Primary Home</SelectItem><SelectItem value="secondary">Secondary Home</SelectItem><SelectItem value="temporary">Temporary Assignment</SelectItem><SelectItem value="agency_cover">Agency Cover</SelectItem><SelectItem value="floating">Floating Assignment</SelectItem><SelectItem value="secondment">Secondment</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></Field>
        <Field label="Effective From"><Input type="date" value={form.effectiveFrom} onChange={(event) => set("effectiveFrom", event.target.value)} /></Field>
        <Field label="Effective To"><Input type="date" value={form.effectiveTo || ""} onChange={(event) => set("effectiveTo", event.target.value)} /></Field>
        <Field label="FTE at Home"><Input type="number" step="0.1" value={form.fteAtHome ?? ""} onChange={(event) => set("fteAtHome", event.target.value)} /></Field>
        <Field label="Hours at Home"><Input type="number" step="0.5" value={form.contractedHoursPerWeekAtHome ?? ""} onChange={(event) => set("contractedHoursPerWeekAtHome", event.target.value)} /></Field>
        <Field label="Agency Provider"><Input value={form.agencyProviderId || ""} onChange={(event) => set("agencyProviderId", event.target.value)} /></Field>
        <Field label="Reason"><Input value={form.reason || ""} onChange={(event) => set("reason", event.target.value)} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPrimary} onChange={(event) => set("isPrimary", event.target.checked)} /> Set as Primary Home</label>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Assignment</Button></div>
    </DialogContent></Dialog>
  );
}

function personalDraft(staff: StaffMember) {
  return {
    staffNumber: staff.staffNumber || "",
    firstName: staff.firstName || "",
    surname: staff.surname || staff.lastName || "",
    preferredName: staff.preferredName || "",
    status: staff.status || (staff.active ? "active" : "inactive"),
    primaryNursingHomeId: staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : undefined,
    workEmail: staff.contactDetails?.workEmail || staff.email || "",
    workPhone: staff.contactDetails?.workPhone || staff.phone || "",
    personalEmail: staff.contactDetails?.personalEmail || "",
    personalPhone: staff.contactDetails?.personalPhone || "",
    dateOfBirth: staff.dateOfBirth || "",
    gender: staff.gender || "not_recorded",
    nationalityCode: staff.nationalityCode || "",
    nationalityDisplayName: staff.nationalityDisplayName || "",
    address: {
      line1: staff.address?.line1 || "",
      line2: staff.address?.line2 || "",
      townCity: staff.address?.townCity || "",
      countyRegion: staff.address?.countyRegion || "",
      postcode: staff.address?.postcode || "",
      country: staff.address?.country || "",
    },
    photoUrl: staff.photoUrl || "",
  };
}

function cleanDraft(form: ReturnType<typeof personalDraft>) {
  return {
    ...form,
    preferredName: form.preferredName || undefined,
    workEmail: form.workEmail || undefined,
    workPhone: form.workPhone || undefined,
    personalEmail: form.personalEmail || undefined,
    personalPhone: form.personalPhone || undefined,
    dateOfBirth: form.dateOfBirth || undefined,
    nationalityCode: form.nationalityCode || undefined,
    nationalityDisplayName: form.nationalityDisplayName || undefined,
    photoUrl: form.photoUrl || undefined,
    address: Object.fromEntries(Object.entries(form.address).filter(([, value]) => Boolean(value))),
  };
}

function emergencyContactDraft(contact?: StaffEmergencyContact) {
  return {
    fullName: contact?.fullName || "",
    relationship: contact?.relationship || "",
    phoneNumber: contact?.phoneNumber || "",
    email: contact?.email || "",
    notes: contact?.notes || "",
    priority: contact?.priority || 1,
    isPrimary: Boolean(contact?.isPrimary),
    active: true,
  };
}

function employmentDraft(record?: EmploymentRecord): Partial<CreateEmploymentRecordCommand> {
  return {
    staffMemberId: record ? String(record.staffMemberId) : "",
    employeeNumber: record?.employeeNumber || "",
    contractType: record?.contractType || "permanent_full_time",
    status: record?.status || "active",
    startDate: record?.startDate || new Date().toISOString().slice(0, 10),
    endDate: record?.endDate || "",
    primaryNursingHomeId: record?.primaryNursingHomeId ? String(record.primaryNursingHomeId) : undefined,
    primaryRoleKey: record?.primaryRoleKey || record?.jobTitle || "",
    fteValue: record?.fteValue,
    contractedHoursPerWeek: record?.contractedHoursPerWeek,
    notes: record?.notes || "",
    ...(record?.department ? { department: record.department } : {}),
  } as any;
}

function registrationDraft(registration?: ProfessionalRegistration): Partial<CreateProfessionalRegistrationCommand> {
  return {
    staffMemberId: registration ? String(registration.staffMemberId) : "",
    employmentRecordId: registration?.employmentRecordId ? String(registration.employmentRecordId) : undefined,
    registrationBody: registration?.registrationBody || "",
    registrationBodyId: registration?.registrationBodyId,
    profession: registration?.profession || "nurse",
    professionKey: registration?.professionKey,
    registrationType: registration?.registrationType,
    registrationNumber: registration?.registrationNumber || "",
    issueDate: registration?.issueDate || "",
    expiryDate: registration?.expiryDate || "",
    reviewDate: registration?.reviewDate || "",
    status: registration?.status || "draft",
    verificationStatus: registration?.verificationStatus || "not_submitted",
    restrictionsOrConditionsPresent: Boolean(registration?.restrictionsOrConditionsPresent),
    restrictedSummary: registration?.restrictedSummary,
    documentIds: registration?.documentIds || [],
    notes: registration?.notes,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
