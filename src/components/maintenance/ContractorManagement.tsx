import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Archive, ArrowRight, Building2, CheckCircle2, Clock, ClipboardList, FileText, Home, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, ShieldAlert, UserRound, Wrench } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type {
  MaintenanceContractor,
  MaintenanceContractorBusinessType,
  MaintenanceContractorContact,
  MaintenanceContractorContactRole,
  MaintenanceContractorHomeAccessLevel,
  MaintenanceContractorHomeAssociation,
  MaintenanceContractorHomeAssociationStatus,
  MaintenanceContractorHomeRelationshipType,
  MaintenanceContractorNote,
  MaintenanceContractorNoteType,
  MaintenanceContractorServiceArea,
  MaintenanceContractorServiceAreaType,
} from "@/lib/care/types";
import { CONTRACTOR_BUSINESS_TYPES, CONTRACTOR_STATUSES, contractorDashboardMetrics, contractorDisplayName, contractorProfileCompleteness, potentialContractorDuplicates } from "@/domain/maintenance/contractors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tab = "overview" | "register" | "archived";
type Mode = "list" | "new" | "detail" | "edit";
type ProfileTab = "overview" | "company" | "contacts" | "service" | "homes" | "notes" | "timeline" | "audit";

const TABS: Array<{ value: Tab; label: string; to: string }> = [
  { value: "overview", label: "Overview", to: "/maintenance/contractors" },
  { value: "register", label: "Contractor Register", to: "/maintenance/contractors/register" },
  { value: "archived", label: "Archived", to: "/maintenance/contractors/register" },
];
const PROFILE_TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "company", label: "Company Details" },
  { value: "contacts", label: "Contacts" },
  { value: "service", label: "Service Areas" },
  { value: "homes", label: "Homes" },
  { value: "notes", label: "Notes" },
  { value: "timeline", label: "Timeline" },
  { value: "audit", label: "Audit" },
];

export function ContractorManagement({ initialTab = "overview", mode = "list", contractorId }: { initialTab?: Tab; mode?: Mode; contractorId?: string }) {
  const care = useCare();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [homeId, setHomeId] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const contractors = care.maintenanceContractors || [];
  const contacts = care.maintenanceContractorContacts || [];
  const associations = care.maintenanceContractorHomeAssociations || [];
  const serviceAreas = care.maintenanceContractorServiceAreas || [];
  const selected = contractors.find((item) => item.id === contractorId);
  const metrics = useMemo(() => contractorDashboardMetrics(contractors, associations, contacts, serviceAreas), [contractors, associations, contacts, serviceAreas]);

  const rows = contractors
    .filter((item) => tab === "archived" ? item.archived || item.status === "ARCHIVED" : !item.archived && item.status !== "ARCHIVED")
    .filter((item) => !status || item.status === status)
    .filter((item) => !businessType || item.businessType === businessType)
    .filter((item) => !homeId || associations.some((association) => association.contractorId === item.id && association.homeId === homeId && association.active))
    .filter((item) => searchable([item.contractorReference, item.legalName, item.tradingName, item.companyRegistrationNumber, item.generalEmail, item.mainPhone, primaryContactName(contacts, item)], search))
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  function run(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete action.");
    }
  }

  if (!care.canAccess("maintenance.contractors.view")) return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have permission to view Contractors.</CardContent></Card></div>;
  if (mode === "new" && !care.canAccess("maintenance.contractors.create")) return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have permission to create Contractors.</CardContent></Card></div>;
  if (mode === "edit" && !care.canAccess("maintenance.contractors.edit")) return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have permission to edit Contractors.</CardContent></Card></div>;
  if (mode === "new") return <div className="space-y-5 p-4 md:p-6"><Header title="New Contractor" subtitle="Create a tenant-level contractor master record. Active does not mean compliance approval." current="New Contractor" /><Card><CardContent className="pt-6"><ContractorForm onDone={(id) => navigate({ to: "/maintenance/contractors/$contractorId", params: { contractorId: id } })} /></CardContent></Card></div>;
  if ((mode === "detail" || mode === "edit") && !selected) return <div className="space-y-5 p-4 md:p-6"><Header title="Contractor Not Found" subtitle="The selected contractor could not be found in this tenant." current="Not Found" /><Card><CardContent className="py-10 text-center"><Button asChild><Link to="/maintenance/contractors/register">Back to Contractor Register</Link></Button></CardContent></Card></div>;
  if (mode === "detail" && selected) return <ContractorDetail contractor={selected} message={message} setMessage={setMessage} run={run} />;
  if (mode === "edit" && selected) return <div className="space-y-5 p-4 md:p-6"><Header title="Edit Contractor" subtitle="Update company identity, primary contact and business address." current={contractorDisplayName(selected)} /><Card><CardContent className="pt-6"><ContractorForm contractor={selected} onDone={(id) => navigate({ to: "/maintenance/contractors/$contractorId", params: { contractorId: id } })} /></CardContent></Card></div>;

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Header title="Contractors" subtitle="Operational contractor register, contacts, Home access and service coverage." current="Contractors" />
      {message && <Notice>{message}</Notice>}
      <div className="flex flex-wrap gap-2">{care.canAccess("maintenance.contractors.create") && <Button onClick={() => navigate({ to: "/maintenance/contractors/new" })}><Plus className="mr-2 h-4 w-4" />New Contractor</Button>}<Button variant="outline" onClick={() => navigate({ to: "/maintenance/contractors/register" })}>Open Register</Button></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{TABS.map((item) => <Link key={item.value} to={item.to} onClick={() => { setTab(item.value); setPage(1); }} className={cn("shrink-0 rounded-md border px-3 py-2 text-sm", tab === item.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>{item.label}</Link>)}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric title="Total Contractors" value={metrics.total} icon={Building2} tone="blue" />
        <Metric title="Active" value={metrics.active} icon={CheckCircle2} tone="green" />
        <Metric title="Draft" value={metrics.draft} icon={FileText} tone="amber" />
        <Metric title="Suspended" value={metrics.suspended} icon={ShieldAlert} tone="red" />
        <Metric title="Archived" value={metrics.archived} icon={Archive} tone="slate" />
        <Metric title="Incomplete Profiles" value={metrics.incompleteProfiles} icon={ClipboardList} tone="amber" />
        <Metric title="No Primary Contact" value={metrics.withoutPrimaryContact} icon={UserRound} tone="red" />
        <Metric title="No Active Home" value={metrics.withoutHomeAssociation} icon={Home} tone="red" />
        <Metric title="Emergency Call-out" value={metrics.emergencyCallout} icon={Phone} tone="teal" />
        <Metric title="Remote Support" value={metrics.remoteSupport} icon={Wrench} tone="blue" />
      </div>
      {tab === "overview" ? <Overview rows={rows.slice(0, 6)} metrics={metrics} /> : <Register rows={pagedRows} total={rows.length} page={page} pageCount={pageCount} setPage={setPage} search={search} setSearch={(v) => { setSearch(v); setPage(1); }} status={status} setStatus={(v) => { setStatus(v); setPage(1); }} businessType={businessType} setBusinessType={(v) => { setBusinessType(v); setPage(1); }} homeId={homeId} setHomeId={(v) => { setHomeId(v); setPage(1); }} onArchive={(contractor) => run(() => care.archiveMaintenanceContractor(contractor.id, promptReason("Archive reason") || ""), "Contractor archived.")} onRestore={(contractor) => run(() => care.restoreMaintenanceContractor(contractor.id, promptReason("Restore reason") || ""), "Contractor restored.")} />}
    </div>
  );
}

function ContractorDetail({ contractor, message, setMessage, run }: { contractor: MaintenanceContractor; message: string; setMessage: (message: string) => void; run: (action: () => void, success: string) => void }) {
  const care = useCare();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [contactDialog, setContactDialog] = useState<{ open: boolean; contact?: MaintenanceContractorContact }>({ open: false });
  const [areaDialog, setAreaDialog] = useState<{ open: boolean; area?: MaintenanceContractorServiceArea }>({ open: false });
  const [homeDialog, setHomeDialog] = useState<{ open: boolean; association?: MaintenanceContractorHomeAssociation }>({ open: false });
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; note?: MaintenanceContractorNote }>({ open: false });
  const contacts = care.maintenanceContractorContacts.filter((item) => item.contractorId === contractor.id);
  const activeContacts = contacts.filter((item) => item.active && !item.archivedAt);
  const associations = care.maintenanceContractorHomeAssociations.filter((item) => item.contractorId === contractor.id);
  const serviceAreas = care.maintenanceContractorServiceAreas.filter((item) => item.contractorId === contractor.id);
  const notes = care.maintenanceContractorNotes.filter((item) => item.contractorId === contractor.id && (item.visibility !== "RESTRICTED_INTERNAL" || care.canAccess("maintenance.contractors.notes.restricted.view")));
  const timeline = care.maintenanceContractorTimelineEvents.filter((item) => item.contractorId === contractor.id).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const audits = care.auditLogs.filter((item) => item.entity === contractor.id || item.entityType?.includes("maintenance_contractor")).slice(0, 50);
  const completeness = contractorProfileCompleteness(contractor);
  const primary = activeContacts.find((item) => item.isPrimary);
  const visibleTabs = PROFILE_TABS.filter((item) => {
    if (item.value === "contacts") return care.canAccess("maintenance.contractors.contacts.view");
    if (item.value === "service") return care.canAccess("maintenance.contractors.service_areas.view");
    if (item.value === "homes") return care.canAccess("maintenance.contractors.homes.view");
    if (item.value === "notes") return care.canAccess("maintenance.contractors.notes.view");
    if (item.value === "timeline") return care.canAccess("maintenance.contractors.timeline.view");
    if (item.value === "audit") return care.canAccess("maintenance.contractors.audit.view");
    return true;
  });

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Header title={contractorDisplayName(contractor)} subtitle={`${contractor.contractorReference} - Active is operational only, not compliance approval.`} current={contractorDisplayName(contractor)} />
      {message && <Notice>{message}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/maintenance/contractors/register" })}>Back to Register</Button>
        {!contractor.archived && care.canAccess("maintenance.contractors.edit") && <Button onClick={() => navigate({ to: "/maintenance/contractors/$contractorId/edit", params: { contractorId: contractor.id } })}><Pencil className="mr-2 h-4 w-4" />Edit Contractor</Button>}
        {contractor.status !== "ACTIVE" && !contractor.archived && care.canAccess("maintenance.contractors.activate") && <Button variant="outline" onClick={() => run(() => care.activateMaintenanceContractor(contractor.id), "Contractor activated.")}>Activate</Button>}
        {contractor.status === "ACTIVE" && care.canAccess("maintenance.contractors.deactivate") && <Button variant="outline" onClick={() => run(() => care.deactivateMaintenanceContractor(contractor.id, promptReason("Deactivation reason") || ""), "Contractor deactivated.")}>Deactivate</Button>}
        {contractor.status !== "SUSPENDED" && !contractor.archived && care.canAccess("maintenance.contractors.suspend") && <Button variant="outline" onClick={() => run(() => care.suspendMaintenanceContractor(contractor.id, promptReason("Suspension reason") || ""), "Contractor suspended.")}>Suspend</Button>}
        {!contractor.archived && care.canAccess("maintenance.contractors.archive") && <Button variant="outline" onClick={() => run(() => care.archiveMaintenanceContractor(contractor.id, promptReason("Archive reason") || ""), "Contractor archived.")}><Archive className="mr-2 h-4 w-4" />Archive</Button>}
        {contractor.archived && care.canAccess("maintenance.contractors.restore") && <Button variant="outline" onClick={() => run(() => care.restoreMaintenanceContractor(contractor.id, promptReason("Restore reason") || ""), "Contractor restored.")}><RefreshCw className="mr-2 h-4 w-4" />Restore</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-4"><Stat label="Status" value={statusBadge(contractor.status, contractor.archived)} /><Stat label="Profile Complete" value={`${completeness}%`} /><Stat label="Primary Contact" value={primary?.displayName || contractor.primaryContactName || "Not recorded"} /><Stat label="Active Homes" value={associations.filter((item) => item.active).length} /></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{visibleTabs.map((item) => <button key={item.value} type="button" onClick={() => setTab(item.value)} className={cn("shrink-0 rounded-md border px-3 py-2 text-sm", tab === item.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>{item.label}</button>)}</div>
      {tab === "overview" && <ProfileOverview contractor={contractor} contacts={activeContacts} associations={associations} serviceAreas={serviceAreas} notes={notes} />}
      {tab === "company" && <CompanyPanel contractor={contractor} />}
      {tab === "contacts" && <ContactsPanel rows={contacts} onNew={() => setContactDialog({ open: true })} onEdit={(contact) => setContactDialog({ open: true, contact })} run={run} />}
      {tab === "service" && <ServiceAreasPanel rows={serviceAreas} onNew={() => setAreaDialog({ open: true })} onEdit={(area) => setAreaDialog({ open: true, area })} run={run} />}
      {tab === "homes" && <HomesPanel rows={associations} onNew={() => setHomeDialog({ open: true })} onEdit={(association) => setHomeDialog({ open: true, association })} run={run} />}
      {tab === "notes" && <NotesPanel rows={notes} onNew={() => setNoteDialog({ open: true })} onEdit={(note) => setNoteDialog({ open: true, note })} run={run} />}
      {tab === "timeline" && <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent><InfoList title="Contractor Timeline" rows={timeline.map((item) => `${formatDateTime(item.eventDate)} - ${item.summary}${item.details ? ` - ${item.details}` : ""}`)} empty="No timeline events recorded." /></CardContent></Card>}
      {tab === "audit" && <Card><CardHeader><CardTitle>Audit</CardTitle></CardHeader><CardContent><InfoList title="Audit Trail" rows={audits.map((item) => `${formatDateTime(item.timestamp)} - ${item.action} - ${item.user}`)} empty="No contractor audit records found." /></CardContent></Card>}
      <ContactDialog open={contactDialog.open} contact={contactDialog.contact} contractor={contractor} onOpenChange={(open) => setContactDialog({ open })} />
      <ServiceAreaDialog open={areaDialog.open} area={areaDialog.area} contractor={contractor} onOpenChange={(open) => setAreaDialog({ open })} />
      <HomeDialog open={homeDialog.open} association={homeDialog.association} contractor={contractor} onOpenChange={(open) => setHomeDialog({ open })} />
      <NoteDialog open={noteDialog.open} note={noteDialog.note} contractor={contractor} onOpenChange={(open) => setNoteDialog({ open })} />
    </div>
  );
}

function ProfileOverview({ contractor, contacts, associations, serviceAreas, notes }: { contractor: MaintenanceContractor; contacts: MaintenanceContractorContact[]; associations: MaintenanceContractorHomeAssociation[]; serviceAreas: MaintenanceContractorServiceArea[]; notes: MaintenanceContractorNote[] }) {
  const missing = [
    !contacts.some((item) => item.isPrimary) && !contractor.primaryContactName ? "Primary contact" : "",
    !contractor.generalEmail ? "General email" : "",
    !contractor.mainPhone ? "Main phone" : "",
    !contractor.addressLine1 ? "Business address" : "",
    !associations.some((item) => item.active) ? "Active Home association" : "",
    !serviceAreas.some((item) => item.active) ? "Active service area" : "",
  ].filter(Boolean);
  return <div className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Operational Summary</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Stat label="Active Contacts" value={contacts.length} /><Stat label="Emergency Contacts" value={contacts.filter((item) => item.isEmergencyContact).length} /><Stat label="Service Areas" value={serviceAreas.filter((item) => item.active).length} /><Stat label="Internal Notes" value={notes.filter((item) => item.active).length} /></CardContent></Card><Card><CardHeader><CardTitle>Missing Foundation Information</CardTitle></CardHeader><CardContent><InfoList title="Missing Items" rows={missing} empty="No missing foundation information." /></CardContent></Card></div>;
}

function CompanyPanel({ contractor }: { contractor: MaintenanceContractor }) {
  return <Card><CardHeader><CardTitle>Company Details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Info title="Legal Name" value={contractor.legalName} /><Info title="Trading Name" value={contractor.tradingName || "Not recorded"} /><Info title="Business Type" value={label(contractor.businessType)} /><Info title="Registration / Tax" value={[contractor.companyRegistrationNumber, contractor.taxRegistrationNumber].filter(Boolean).join(" / ") || "Not recorded"} /><Info icon={Mail} title="General Email" value={contractor.generalEmail || "Not recorded"} /><Info icon={Phone} title="Main Phone" value={contractor.mainPhone || "Not recorded"} /><Info icon={Phone} title="Emergency Phone" value={contractor.emergencyPhone || "Not recorded"} /><Info icon={MapPin} title="Business Address" value={[contractor.addressLine1, contractor.addressLine2, contractor.addressLine3, contractor.townCity, contractor.countyRegion, contractor.postalCode, contractor.countryCode].filter(Boolean).join(", ") || "Not recorded"} /></div><Info title="General Service Information" value={contractor.description || "No general service information recorded."} /></CardContent></Card>;
}

function ContactsPanel({ rows, onNew, onEdit, run }: { rows: MaintenanceContractorContact[]; onNew: () => void; onEdit: (row: MaintenanceContractorContact) => void; run: (a: () => void, s: string) => void }) {
  const care = useCare();
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Contacts</CardTitle>{care.canAccess("maintenance.contractors.contacts.create") && <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" />Add Contact</Button>}</div></CardHeader><CardContent>{rows.length ? <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[980px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Job Title</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Home</th><th className="px-3 py-2">Flags</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.displayName}<div className="text-xs text-muted-foreground">{row.active ? "Active" : "Inactive"}{row.archivedAt ? " - Archived" : ""}</div></td><td className="px-3 py-3">{row.jobTitle || "-"}</td><td className="px-3 py-3">{label(row.contactRole)}</td><td className="px-3 py-3">{row.email || "-"}</td><td className="px-3 py-3">{row.mobile || row.phone || row.emergencyPhone || "-"}</td><td className="px-3 py-3">{row.homeId ? homeName(care, row.homeId) : "Company-wide"}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{row.isPrimary && <Badge>Primary</Badge>}{row.isEmergencyContact && <Badge className="bg-red-100 text-red-800">Emergency</Badge>}</div></td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{care.canAccess("maintenance.contractors.contacts.edit") && <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button>}{!row.isPrimary && row.active && !row.archivedAt && care.canAccess("maintenance.contractors.contacts.set_primary") && <Button size="sm" variant="outline" onClick={() => run(() => care.setMaintenanceContractorContactPrimary(row.id), "Primary contact updated.")}>Set Primary</Button>}{care.canAccess("maintenance.contractors.contacts.set_emergency") && <Button size="sm" variant="outline" onClick={() => run(() => care.setMaintenanceContractorContactEmergency(row.id, !row.isEmergencyContact), "Emergency flag updated.")}>{row.isEmergencyContact ? "Unset Emergency" : "Set Emergency"}</Button>}{care.canAccess("maintenance.contractors.contacts.archive") && (row.archivedAt ? <Button size="sm" variant="outline" onClick={() => run(() => care.restoreMaintenanceContractorContact(row.id), "Contact restored.")}>Restore</Button> : <Button size="sm" variant="outline" onClick={() => run(() => care.archiveMaintenanceContractorContact(row.id, promptReason("Archive contact reason") || ""), "Contact archived.")}>Archive</Button>)}</div></td></tr>)}</tbody></table></div> : <Empty text="No contacts have been added." />}</CardContent></Card>;
}

function ServiceAreasPanel({ rows, onNew, onEdit, run }: { rows: MaintenanceContractorServiceArea[]; onNew: () => void; onEdit: (row: MaintenanceContractorServiceArea) => void; run: (a: () => void, s: string) => void }) {
  const care = useCare();
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Service Areas</CardTitle>{care.canAccess("maintenance.contractors.service_areas.create") && <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" />Add Service Area</Button>}</div></CardHeader><CardContent>{rows.length ? <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[960px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Area</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Region</th><th className="px-3 py-2">Home</th><th className="px-3 py-2">Coverage</th><th className="px-3 py-2">Dates</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.name}</td><td className="px-3 py-3">{label(row.serviceAreaType)}</td><td className="px-3 py-3">{[row.townCity, row.countyRegion, row.countryCode].filter(Boolean).join(", ") || "-"}</td><td className="px-3 py-3">{row.homeId ? homeName(care, row.homeId) : "-"}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{row.emergencyCalloutAvailable && <Badge>Emergency</Badge>}{row.outOfHoursAvailable && <Badge>Out of hours</Badge>}{row.remoteSupportAvailable && <Badge>Remote</Badge>}</div></td><td className="px-3 py-3">{row.effectiveFrom} to {row.effectiveTo || "open"}</td><td className="px-3 py-3">{row.archivedAt ? "Archived" : row.active ? "Active" : "Inactive"}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{care.canAccess("maintenance.contractors.service_areas.edit") && <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button>}{care.canAccess(row.active ? "maintenance.contractors.service_areas.deactivate" : "maintenance.contractors.service_areas.activate") && <Button size="sm" variant="outline" onClick={() => run(() => care.setMaintenanceContractorServiceAreaActive(row.id, !row.active, row.active ? promptReason("Deactivate service area reason") || "" : undefined), "Service area updated.")}>{row.active ? "Deactivate" : "Activate"}</Button>}{care.canAccess("maintenance.contractors.service_areas.archive") && (row.archivedAt ? <Button size="sm" variant="outline" onClick={() => run(() => care.restoreMaintenanceContractorServiceArea(row.id), "Service area restored.")}>Restore</Button> : <Button size="sm" variant="outline" onClick={() => run(() => care.archiveMaintenanceContractorServiceArea(row.id, promptReason("Archive service area reason") || ""), "Service area archived.")}>Archive</Button>)}</div></td></tr>)}</tbody></table></div> : <Empty text="No service areas have been configured." />}</CardContent></Card>;
}

function HomesPanel({ rows, onNew, onEdit, run }: { rows: MaintenanceContractorHomeAssociation[]; onNew: () => void; onEdit: (row: MaintenanceContractorHomeAssociation) => void; run: (a: () => void, s: string) => void }) {
  const care = useCare();
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Home Access</CardTitle>{care.canAccess("maintenance.contractors.homes.create") && <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" />Add Home</Button>}</div></CardHeader><CardContent>{rows.length ? <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1040px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Home</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Access Level</th><th className="px-3 py-2">Relationship</th><th className="px-3 py-2">Dates</th><th className="px-3 py-2">Requirements</th><th className="px-3 py-2">Notes</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{homeName(care, row.homeId)}</td><td className="px-3 py-3">{label(row.associationStatus)}</td><td className="px-3 py-3">{label(row.accessLevel || "BY_APPOINTMENT")}</td><td className="px-3 py-3">{label(row.relationshipType)}</td><td className="px-3 py-3">{row.effectiveFrom} to {row.effectiveTo || "open"}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{row.escortRequired && <Badge>Escort</Badge>}{row.siteInductionRequired && <Badge>Induction</Badge>}{row.emergencyAccessAllowed && <Badge>Emergency</Badge>}</div></td><td className="px-3 py-3">{row.accessRestrictions || row.accessNotes || row.serviceNotes || row.notes || "-"}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{care.canAccess("maintenance.contractors.homes.edit") && <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button>}{care.canAccess("maintenance.contractors.homes.restrict") && <Button size="sm" variant="outline" onClick={() => run(() => care.setMaintenanceContractorHomeAssociationStatus(row.id, "RESTRICTED", promptReason("Restriction reason") || ""), "Home access restricted.")}>Restrict</Button>}{care.canAccess("maintenance.contractors.homes.suspend") && <Button size="sm" variant="outline" onClick={() => run(() => care.setMaintenanceContractorHomeAssociationStatus(row.id, "SUSPENDED", promptReason("Suspension reason") || ""), "Home access suspended.")}>Suspend</Button>}{care.canAccess(row.active ? "maintenance.contractors.homes.deactivate" : "maintenance.contractors.homes.activate") && <Button size="sm" variant="outline" onClick={() => run(() => care.setMaintenanceContractorHomeAssociationStatus(row.id, row.active ? "INACTIVE" : "ACTIVE", row.active ? promptReason("Deactivation reason") || "" : undefined), "Home status updated.")}>{row.active ? "Deactivate" : "Activate"}</Button>}</div></td></tr>)}</tbody></table></div> : <Empty text="This contractor is not associated with any Nursing Homes." />}</CardContent></Card>;
}

function NotesPanel({ rows, onNew, onEdit, run }: { rows: MaintenanceContractorNote[]; onNew: () => void; onEdit: (row: MaintenanceContractorNote) => void; run: (a: () => void, s: string) => void }) {
  const care = useCare();
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Notes</CardTitle>{care.canAccess("maintenance.contractors.notes.create") && <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" />Add Note</Button>}</div></CardHeader><CardContent>{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className={cn("rounded-md border p-3 text-sm", !row.active && "opacity-60")}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{row.pinned ? "Pinned - " : ""}{row.title}</div><div className="text-xs text-muted-foreground">{label(row.noteType)} - {row.homeId ? homeName(care, row.homeId) : "Company-wide"} - {formatDateTime(row.createdAt)}</div></div><div className="flex flex-wrap gap-2">{care.canAccess("maintenance.contractors.notes.edit") && <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button>}{care.canAccess("maintenance.contractors.notes.pin") && <Button size="sm" variant="outline" onClick={() => run(() => care.pinMaintenanceContractorNote(row.id, !row.pinned), "Pinned state updated.")}>{row.pinned ? "Unpin" : "Pin"}</Button>}{care.canAccess("maintenance.contractors.notes.remove") && (row.active ? <Button size="sm" variant="outline" onClick={() => run(() => care.removeMaintenanceContractorNote(row.id, promptReason("Remove note reason") || ""), "Note removed.")}>Remove</Button> : <Button size="sm" variant="outline" onClick={() => run(() => care.restoreMaintenanceContractorNote(row.id), "Note restored.")}>Restore</Button>)}</div></div><p className="mt-2 text-muted-foreground">{row.body}</p></div>)}</div> : <Empty text="No internal notes have been recorded." />}</CardContent></Card>;
}

function Overview({ rows, metrics }: { rows: MaintenanceContractor[]; metrics: ReturnType<typeof contractorDashboardMetrics> }) {
  const care = useCare();
  const homes = care.facilities || [];
  return <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]"><Card><CardHeader><CardTitle>Recently Updated Contractors</CardTitle></CardHeader><CardContent>{rows.length ? <div className="space-y-2">{rows.map((item) => <ContractorMiniRow key={item.id} contractor={item} />)}</div> : <Empty text="No contractors have been created yet." />}</CardContent></Card><Card><CardHeader><CardTitle>Foundation Readiness</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3"><Stat label="No Primary Contact" value={metrics.withoutPrimaryContact} /><Stat label="No Home Access" value={metrics.withoutHomeAssociation} /><Stat label="No Service Area" value={metrics.withoutServiceArea} /><Stat label="Out of Hours" value={metrics.outOfHours} /></div><InfoList title="Home Coverage Summary" rows={homes.map((home) => `${home.name}: ${care.maintenanceContractorHomeAssociations.filter((item) => item.homeId === home.id && item.active).length} active contractors`)} empty="No Homes available." /><Notice>These are profile completeness and service coverage indicators only. They are not compliance failures.</Notice></CardContent></Card></div>;
}

function Register(props: { rows: MaintenanceContractor[]; total: number; page: number; pageCount: number; setPage: (page: number) => void; search: string; setSearch: (v: string) => void; status: string; setStatus: (v: string) => void; businessType: string; setBusinessType: (v: string) => void; homeId: string; setHomeId: (v: string) => void; onArchive: (contractor: MaintenanceContractor) => void; onRestore: (contractor: MaintenanceContractor) => void }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>Contractor Register</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-[1fr_180px_220px_220px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Search name, reference, email, phone..." /></div><NativeSelect value={props.status} onChange={props.setStatus} options={[{ value: "", label: "All statuses" }, ...CONTRACTOR_STATUSES.map((item) => ({ value: item, label: label(item) }))]} /><NativeSelect value={props.businessType} onChange={props.setBusinessType} options={[{ value: "", label: "All business types" }, ...CONTRACTOR_BUSINESS_TYPES.map((item) => ({ value: item, label: label(item) }))]} /><NativeSelect value={props.homeId} onChange={props.setHomeId} options={[{ value: "", label: "All Homes" }, ...(care.facilities || []).map((item) => ({ value: item.id, label: item.name }))]} /></div>{props.rows.length ? <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[980px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Contractor</th><th className="px-3 py-2">Business Type</th><th className="px-3 py-2">Primary Contact</th><th className="px-3 py-2">Service</th><th className="px-3 py-2">Homes</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{props.rows.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{item.contractorReference}</td><td className="px-3 py-3"><Link to="/maintenance/contractors/$contractorId" params={{ contractorId: item.id }} className="font-semibold text-blue-700 hover:underline">{contractorDisplayName(item)}</Link><div className="text-xs text-muted-foreground">{item.tradingName ? item.legalName : item.companyRegistrationNumber || "No registration number"}</div></td><td className="px-3 py-3">{label(item.businessType)}</td><td className="px-3 py-3">{primaryContactName(care.maintenanceContractorContacts, item) || "Not recorded"}</td><td className="px-3 py-3">{care.maintenanceContractorServiceAreas.filter((area) => area.contractorId === item.id && area.active).length} areas</td><td className="px-3 py-3">{care.maintenanceContractorHomeAssociations.filter((association) => association.contractorId === item.id && association.active).length}</td><td className="px-3 py-3">{statusBadge(item.status, item.archived)}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><Link to="/maintenance/contractors/$contractorId" params={{ contractorId: item.id }}>View</Link></Button>{item.archived ? care.canAccess("maintenance.contractors.restore") && <Button size="sm" variant="outline" onClick={() => props.onRestore(item)}>Restore</Button> : care.canAccess("maintenance.contractors.archive") && <Button size="sm" variant="outline" onClick={() => props.onArchive(item)}>Archive</Button>}</div></td></tr>)}</tbody></table></div> : <Empty text="No contractors match the selected filters." />}<Pagination page={props.page} pageCount={props.pageCount} total={props.total} setPage={props.setPage} /></CardContent></Card>;
}

function ContractorForm({ contractor, onDone }: { contractor?: MaintenanceContractor; onDone: (id: string) => void }) {
  const care = useCare();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ legalName: contractor?.legalName || "", tradingName: contractor?.tradingName || "", businessType: contractor?.businessType || "LIMITED_COMPANY" as MaintenanceContractorBusinessType, companyRegistrationNumber: contractor?.companyRegistrationNumber || "", taxRegistrationNumber: contractor?.taxRegistrationNumber || "", website: contractor?.website || "", description: contractor?.description || "", generalEmail: contractor?.generalEmail || "", mainPhone: contractor?.mainPhone || "", alternativePhone: contractor?.alternativePhone || "", emergencyPhone: contractor?.emergencyPhone || "", primaryContactName: contractor?.primaryContactName || "", primaryContactJobTitle: contractor?.primaryContactJobTitle || "", primaryContactEmail: contractor?.primaryContactEmail || "", primaryContactPhone: contractor?.primaryContactPhone || "", addressLine1: contractor?.addressLine1 || "", addressLine2: contractor?.addressLine2 || "", addressLine3: contractor?.addressLine3 || "", townCity: contractor?.townCity || "", countyRegion: contractor?.countyRegion || "", postalCode: contractor?.postalCode || "", countryCode: contractor?.countryCode || "IE" });
  const duplicates = useMemo(() => potentialContractorDuplicates({ ...form, id: contractor?.id }, care.maintenanceContractors || []), [form, contractor?.id, care.maintenanceContractors]);
  const update = (key: keyof typeof form, value: string) => setForm((state) => ({ ...state, [key]: value }));
  function submit() { try { if (contractor) { care.updateMaintenanceContractor(contractor.id, form, contractor.version); onDone(contractor.id); } else { const created = care.createMaintenanceContractor(form); onDone(created.id); } } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save contractor."); } }
  return <div className="space-y-4">{message && <Notice tone="red">{message}</Notice>}{duplicates.length > 0 && <Notice tone="amber">Potential duplicate: {duplicates.map((item) => `${item.contractorReference} ${contractorDisplayName(item)}`).join(", ")}. Review before saving.</Notice>}<div className="grid gap-3 md:grid-cols-2"><Field label="Legal Name *" value={form.legalName} onChange={(v) => update("legalName", v)} /><Field label="Trading Name" value={form.tradingName} onChange={(v) => update("tradingName", v)} /><Select label="Business Type *" value={form.businessType} onChange={(v) => update("businessType", v)} options={CONTRACTOR_BUSINESS_TYPES.map((item) => ({ value: item, label: label(item) }))} /><Field label="Website" value={form.website} onChange={(v) => update("website", v)} placeholder="https://..." /><Field label="Company Registration Number" value={form.companyRegistrationNumber} onChange={(v) => update("companyRegistrationNumber", v)} /><Field label="Tax Registration Number" value={form.taxRegistrationNumber} onChange={(v) => update("taxRegistrationNumber", v)} /><Field label="General Email" value={form.generalEmail} onChange={(v) => update("generalEmail", v)} /><Field label="Main Phone" value={form.mainPhone} onChange={(v) => update("mainPhone", v)} /><Field label="Alternative Phone" value={form.alternativePhone} onChange={(v) => update("alternativePhone", v)} /><Field label="Emergency Phone" value={form.emergencyPhone} onChange={(v) => update("emergencyPhone", v)} /><Field label="Primary Contact Name" value={form.primaryContactName} onChange={(v) => update("primaryContactName", v)} /><Field label="Primary Contact Job Title" value={form.primaryContactJobTitle} onChange={(v) => update("primaryContactJobTitle", v)} /><Field label="Primary Contact Email" value={form.primaryContactEmail} onChange={(v) => update("primaryContactEmail", v)} /><Field label="Primary Contact Phone" value={form.primaryContactPhone} onChange={(v) => update("primaryContactPhone", v)} /><Field label="Address Line 1" value={form.addressLine1} onChange={(v) => update("addressLine1", v)} /><Field label="Address Line 2" value={form.addressLine2} onChange={(v) => update("addressLine2", v)} /><Field label="Address Line 3" value={form.addressLine3} onChange={(v) => update("addressLine3", v)} /><Field label="Town / City" value={form.townCity} onChange={(v) => update("townCity", v)} /><Field label="County / Region" value={form.countyRegion} onChange={(v) => update("countyRegion", v)} /><Field label="Postal Code" value={form.postalCode} onChange={(v) => update("postalCode", v)} /><Field label="Country Code" value={form.countryCode} onChange={(v) => update("countryCode", v.toUpperCase())} /></div><div><label className="text-sm font-medium">General Service Information</label><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Service scope or general notes. Do not record compliance approval here." /></div><div className="flex flex-wrap gap-2"><Button onClick={submit}>{contractor ? "Save Contractor" : "Save Draft Contractor"}</Button><Button variant="outline" asChild><Link to="/maintenance/contractors/register">Cancel</Link></Button></div></div>;
}

function ContactDialog({ open, contact, contractor, onOpenChange }: { open: boolean; contact?: MaintenanceContractorContact; contractor: MaintenanceContractor; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ displayName: contact?.displayName || "", firstName: contact?.firstName || "", lastName: contact?.lastName || "", jobTitle: contact?.jobTitle || "", contactRole: contact?.contactRole || "GENERAL" as MaintenanceContractorContactRole, email: contact?.email || "", phone: contact?.phone || "", mobile: contact?.mobile || "", emergencyPhone: contact?.emergencyPhone || "", homeId: contact?.homeId || "", isPrimary: contact?.isPrimary || false, isEmergencyContact: contact?.isEmergencyContact || false, active: contact?.active ?? true, notes: contact?.notes || "" });
  const [message, setMessage] = useState("");
  const update = (key: keyof typeof form, value: any) => setForm((state) => ({ ...state, [key]: value }));
  function submit() { try { contact ? care.updateMaintenanceContractorContact(contact.id, form, contact.version) : care.createMaintenanceContractorContact(contractor.id, form); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save contact."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader><div className="space-y-3">{message && <Notice tone="red">{message}</Notice>}<div className="grid gap-3 md:grid-cols-2"><Field label="Display Name" value={form.displayName} onChange={(v) => update("displayName", v)} /><Field label="Job Title" value={form.jobTitle} onChange={(v) => update("jobTitle", v)} /><Select label="Role" value={form.contactRole} onChange={(v) => update("contactRole", v)} options={["GENERAL", "MANAGER", "OPERATIONS", "SERVICE_COORDINATOR", "ENGINEER", "EMERGENCY", "COMPLIANCE", "ACCOUNTS", "ADMINISTRATION", "OTHER"].map((item) => ({ value: item, label: label(item) }))} /><Select label="Home Scope" value={form.homeId} onChange={(v) => update("homeId", v)} options={[{ value: "", label: "Company-wide" }, ...care.maintenanceContractorHomeAssociations.filter((item) => item.contractorId === contractor.id && item.active).map((item) => ({ value: item.homeId, label: homeName(care, item.homeId) }))]} /><Field label="Email" value={form.email} onChange={(v) => update("email", v)} /><Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} /><Field label="Mobile" value={form.mobile} onChange={(v) => update("mobile", v)} /><Field label="Emergency Phone" value={form.emergencyPhone} onChange={(v) => update("emergencyPhone", v)} /></div><Check label="Primary Contact" checked={form.isPrimary} onChange={(v) => update("isPrimary", v)} /><Check label="Emergency Contact" checked={form.isEmergencyContact} onChange={(v) => update("isEmergencyContact", v)} /><Check label="Active" checked={form.active} onChange={(v) => update("active", v)} /><Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Contact notes" /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Contact</Button></DialogFooter></DialogContent></Dialog>;
}

function ServiceAreaDialog({ open, area, contractor, onOpenChange }: { open: boolean; area?: MaintenanceContractorServiceArea; contractor: MaintenanceContractor; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ name: area?.name || "", serviceAreaType: area?.serviceAreaType || "COUNTY" as MaintenanceContractorServiceAreaType, countryCode: area?.countryCode || "IE", countyRegion: area?.countyRegion || "", townCity: area?.townCity || "", postalCodePattern: area?.postalCodePattern || "", homeId: area?.homeId || "", coverageDescription: area?.coverageDescription || "", standardHours: area?.standardHours || "Mon-Fri 09:00-17:00", emergencyCalloutAvailable: area?.emergencyCalloutAvailable || false, outOfHoursAvailable: area?.outOfHoursAvailable || false, remoteSupportAvailable: area?.remoteSupportAvailable || false, responseNotes: area?.responseNotes || "", active: area?.active ?? true, effectiveFrom: area?.effectiveFrom || new Date().toISOString().slice(0, 10), effectiveTo: area?.effectiveTo || "" });
  const [message, setMessage] = useState("");
  const update = (key: keyof typeof form, value: any) => setForm((state) => ({ ...state, [key]: value }));
  function submit() { try { area ? care.updateMaintenanceContractorServiceArea(area.id, form, area.version) : care.createMaintenanceContractorServiceArea(contractor.id, form); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save service area."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{area ? "Edit Service Area" : "Add Service Area"}</DialogTitle></DialogHeader><div className="space-y-3">{message && <Notice tone="red">{message}</Notice>}<div className="grid gap-3 md:grid-cols-2"><Field label="Area Name" value={form.name} onChange={(v) => update("name", v)} /><Select label="Type" value={form.serviceAreaType} onChange={(v) => update("serviceAreaType", v)} options={["REGION", "COUNTY", "CITY", "POSTAL_AREA", "HOME", "NATIONWIDE", "REMOTE", "OTHER"].map((item) => ({ value: item, label: label(item) }))} /><Field label="Country Code" value={form.countryCode} onChange={(v) => update("countryCode", v.toUpperCase())} /><Field label="County / Region" value={form.countyRegion} onChange={(v) => update("countyRegion", v)} /><Field label="Town / City" value={form.townCity} onChange={(v) => update("townCity", v)} /><Field label="Postal Pattern" value={form.postalCodePattern} onChange={(v) => update("postalCodePattern", v)} /><Select label="Home" value={form.homeId} onChange={(v) => update("homeId", v)} options={[{ value: "", label: "No specific Home" }, ...care.maintenanceContractorHomeAssociations.filter((item) => item.contractorId === contractor.id && item.active).map((item) => ({ value: item.homeId, label: homeName(care, item.homeId) }))]} /><Field label="Standard Hours" value={form.standardHours} onChange={(v) => update("standardHours", v)} /><Field label="Effective From" type="date" value={form.effectiveFrom} onChange={(v) => update("effectiveFrom", v)} /><Field label="Effective To" type="date" value={form.effectiveTo} onChange={(v) => update("effectiveTo", v)} /></div><Check label="Emergency call-out available" checked={form.emergencyCalloutAvailable} onChange={(v) => update("emergencyCalloutAvailable", v)} /><Check label="Out-of-hours available" checked={form.outOfHoursAvailable} onChange={(v) => update("outOfHoursAvailable", v)} /><Check label="Remote support available" checked={form.remoteSupportAvailable} onChange={(v) => update("remoteSupportAvailable", v)} /><Textarea value={form.coverageDescription} onChange={(event) => update("coverageDescription", event.target.value)} placeholder="Coverage notes" /><Textarea value={form.responseNotes} onChange={(event) => update("responseNotes", event.target.value)} placeholder="Response notes" /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Service Area</Button></DialogFooter></DialogContent></Dialog>;
}

function HomeDialog({ open, association, contractor, onOpenChange }: { open: boolean; association?: MaintenanceContractorHomeAssociation; contractor: MaintenanceContractor; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ homeId: association?.homeId || care.activeFacilityId || care.facilities?.[0]?.id || "", associationStatus: association?.associationStatus || "ACTIVE" as MaintenanceContractorHomeAssociationStatus, accessLevel: association?.accessLevel || "BY_APPOINTMENT" as MaintenanceContractorHomeAccessLevel, relationshipType: association?.relationshipType || "HOME_PROVIDER" as MaintenanceContractorHomeRelationshipType, effectiveFrom: association?.effectiveFrom || new Date().toISOString().slice(0, 10), effectiveTo: association?.effectiveTo || "", accessRestrictions: association?.accessRestrictions || "", accessNotes: association?.accessNotes || "", serviceNotes: association?.serviceNotes || association?.notes || "", internalOwnerUserId: association?.internalOwnerUserId || "", internalOwnerTeamId: association?.internalOwnerTeamId || "", emergencyAccessAllowed: association?.emergencyAccessAllowed || false, escortRequired: association?.escortRequired || false, siteInductionRequired: association?.siteInductionRequired || false, siteInductionCompleted: association?.siteInductionCompleted || false });
  const [message, setMessage] = useState("");
  const update = (key: keyof typeof form, value: any) => setForm((state) => ({ ...state, [key]: value }));
  function submit() { try { association ? care.updateMaintenanceContractorHomeAssociation(association.id, form, association.version || 1) : care.associateMaintenanceContractorHome(contractor.id, form); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save Home access."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{association ? "Edit Home Access" : "Add Home Access"}</DialogTitle></DialogHeader><div className="space-y-3">{message && <Notice tone="red">{message}</Notice>}<div className="grid gap-3 md:grid-cols-2"><Select label="Nursing Home" value={form.homeId} onChange={(v) => update("homeId", v)} options={(care.facilities || []).map((item) => ({ value: item.id, label: item.name }))} /><Select label="Association Status" value={form.associationStatus} onChange={(v) => update("associationStatus", v)} options={["PLANNED", "ACTIVE", "INACTIVE", "RESTRICTED", "SUSPENDED", "ARCHIVED"].map((item) => ({ value: item, label: label(item) }))} /><Select label="Access Level" value={form.accessLevel} onChange={(v) => update("accessLevel", v)} options={["NO_ACCESS", "BY_APPOINTMENT", "ESCORTED", "STANDARD", "EMERGENCY_ONLY", "RESTRICTED"].map((item) => ({ value: item, label: label(item) }))} /><Select label="Relationship" value={form.relationshipType} onChange={(v) => update("relationshipType", v)} options={["TENANT_WIDE", "HOME_PROVIDER", "EMERGENCY_PROVIDER", "PREFERRED", "OCCASIONAL", "HISTORICAL", "OTHER"].map((item) => ({ value: item, label: label(item) }))} /><Field label="Effective From" type="date" value={form.effectiveFrom} onChange={(v) => update("effectiveFrom", v)} /><Field label="Effective To" type="date" value={form.effectiveTo} onChange={(v) => update("effectiveTo", v)} /><Field label="Internal Owner" value={form.internalOwnerUserId} onChange={(v) => update("internalOwnerUserId", v)} /><Field label="Responsible Team" value={form.internalOwnerTeamId} onChange={(v) => update("internalOwnerTeamId", v)} /></div><Check label="Emergency access allowed" checked={form.emergencyAccessAllowed} onChange={(v) => update("emergencyAccessAllowed", v)} /><Check label="Escort required" checked={form.escortRequired} onChange={(v) => update("escortRequired", v)} /><Check label="Site induction required" checked={form.siteInductionRequired} onChange={(v) => update("siteInductionRequired", v)} /><Check label="Site induction completed" checked={form.siteInductionCompleted} onChange={(v) => update("siteInductionCompleted", v)} /><Textarea value={form.accessRestrictions} onChange={(event) => update("accessRestrictions", event.target.value)} placeholder="Restriction notes, e.g. escorted areas only" /><Textarea value={form.accessNotes} onChange={(event) => update("accessNotes", event.target.value)} placeholder="Access notes" /><Textarea value={form.serviceNotes} onChange={(event) => update("serviceNotes", event.target.value)} placeholder="Service notes" /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Home Access</Button></DialogFooter></DialogContent></Dialog>;
}

function NoteDialog({ open, note, contractor, onOpenChange }: { open: boolean; note?: MaintenanceContractorNote; contractor: MaintenanceContractor; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ noteType: note?.noteType || "GENERAL" as MaintenanceContractorNoteType, title: note?.title || "", body: note?.body || "", homeId: note?.homeId || "", pinned: note?.pinned || false });
  const [message, setMessage] = useState("");
  const update = (key: keyof typeof form, value: any) => setForm((state) => ({ ...state, [key]: value }));
  function submit() { try { note ? care.updateMaintenanceContractorNote(note.id, form, note.version || 1) : care.addMaintenanceContractorNote(contractor.id, form); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save note."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{note ? "Edit Note" : "Add Contractor Note"}</DialogTitle></DialogHeader><div className="space-y-3">{message && <Notice tone="red">{message}</Notice>}<Select label="Note Type" value={form.noteType} onChange={(v) => update("noteType", v)} options={["GENERAL", "ADMINISTRATIVE", "OPERATIONAL", "COMPLIANCE_PREPARATION", "ACCESS", "OTHER"].map((item) => ({ value: item, label: label(item) }))} /><Select label="Home Scope" value={form.homeId} onChange={(v) => update("homeId", v)} options={[{ value: "", label: "Company-wide" }, ...care.maintenanceContractorHomeAssociations.filter((item) => item.contractorId === contractor.id && item.active).map((item) => ({ value: item.homeId, label: homeName(care, item.homeId) }))]} /><Field label="Title" value={form.title} onChange={(v) => update("title", v)} /><Textarea value={form.body} onChange={(event) => update("body", event.target.value)} placeholder="Internal note. Do not include resident data." /><Check label="Pinned" checked={form.pinned} onChange={(v) => update("pinned", v)} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Note</Button></DialogFooter></DialogContent></Dialog>;
}

function Header({ title, subtitle, current }: { title: string; subtitle: string; current: string }) {
  return <div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/maintenance" className="hover:text-foreground">Maintenance</Link><ArrowRight className="h-3.5 w-3.5" /><Link to="/maintenance/contractors" className="hover:text-foreground">Contractors</Link>{current !== "Contractors" && <><ArrowRight className="h-3.5 w-3.5" /><span>{current}</span></>}</div><h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></div>;
}

function ContractorMiniRow({ contractor }: { contractor: MaintenanceContractor }) {
  return <Link to="/maintenance/contractors/$contractorId" params={{ contractorId: contractor.id }} className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/40"><div><div className="font-medium">{contractorDisplayName(contractor)}</div><div className="text-xs text-muted-foreground">{contractor.contractorReference} - {contractor.updatedBy || contractor.createdBy}</div></div>{statusBadge(contractor.status, contractor.archived)}</Link>;
}

function Metric({ title, value, icon: Icon, tone }: { title: string; value: ReactNode; icon: any; tone: "blue" | "green" | "amber" | "red" | "teal" | "slate" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", teal: "bg-teal-50 text-teal-700", slate: "bg-slate-50 text-slate-700" };
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className={cn("rounded-lg p-2", tones[tone])}><Icon className="h-5 w-5" /></div><div><div className="text-xs font-medium text-muted-foreground">{title}</div><div className="text-2xl font-semibold">{value}</div></div></CardContent></Card>;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-md border bg-muted/20 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

function Info({ title, value, icon: Icon = ClipboardList }: { title: string; value: ReactNode; icon?: any }) {
  return <div className="flex gap-3 rounded-md border p-3 text-sm"><Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><div className="font-medium">{title}</div><div className="text-muted-foreground">{value}</div></div></div>;
}

function InfoList({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <div><div className="mb-2 text-sm font-medium">{title}</div>{rows.length ? <div className="space-y-2">{rows.map((row, index) => <div key={`${row}-${index}`} className="rounded-md border px-3 py-2 text-sm">{row}</div>)}</div> : <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">{empty}</div>}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

function Notice({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "red" | "amber" }) {
  const tones = { blue: "border-blue-200 bg-blue-50 text-blue-900", red: "border-red-200 bg-red-50 text-red-900", amber: "border-amber-200 bg-amber-50 text-amber-900" };
  return <div className={cn("rounded-md border px-3 py-2 text-sm", tones[tone])}>{children}</div>;
}

function Field({ label: fieldLabel, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="space-y-1 text-sm font-medium">{fieldLabel}<Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function Select({ label: fieldLabel, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="space-y-1 text-sm font-medium">{fieldLabel}<NativeSelect value={value} onChange={onChange} options={options} /></label>;
}

function NativeSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}</select>;
}

function Check({ label: text, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{text}</label>;
}

function Pagination({ page, pageCount, total, setPage }: { page: number; pageCount: number; total: number; setPage: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>{total} contractor records</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div></div>;
}

function statusBadge(status: string, archived?: boolean) {
  const value = archived ? "ARCHIVED" : status;
  const classes: Record<string, string> = { DRAFT: "bg-amber-100 text-amber-800", ACTIVE: "bg-blue-100 text-blue-800", INACTIVE: "bg-slate-100 text-slate-800", SUSPENDED: "bg-red-100 text-red-800", ARCHIVED: "bg-zinc-200 text-zinc-800" };
  return <Badge className={classes[value] || "bg-muted text-foreground"}>{label(value)}</Badge>;
}

function primaryContactName(contacts: MaintenanceContractorContact[], contractor: MaintenanceContractor) {
  return contacts.find((item) => item.contractorId === contractor.id && item.active && item.isPrimary)?.displayName || contractor.primaryContactName;
}

function searchable(values: Array<string | undefined>, term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => value?.toLowerCase().includes(q));
}

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" });
}

function homeName(care: ReturnType<typeof useCare>, homeId: string) {
  return care.facilities?.find((item) => item.id === homeId)?.name || homeId;
}

function promptReason(title: string) {
  return window.prompt(`${title}. This is retained for audit history.`)?.trim() || "";
}

