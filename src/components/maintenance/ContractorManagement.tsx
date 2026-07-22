import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Archive, ArrowRight, Building2, CheckCircle2, ClipboardList, FileText, Home, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, ShieldAlert, UserRound } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { MaintenanceContractor, MaintenanceContractorBusinessType, MaintenanceContractorHomeRelationshipType, MaintenanceContractorNoteType } from "@/lib/care/types";
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

const TABS: Array<{ value: Tab; label: string; to: string }> = [
  { value: "overview", label: "Overview", to: "/maintenance/contractors" },
  { value: "register", label: "Contractor Register", to: "/maintenance/contractors/register" },
  { value: "archived", label: "Archived", to: "/maintenance/contractors/register" },
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
  const associations = care.maintenanceContractorHomeAssociations || [];
  const selected = contractors.find((item) => item.id === contractorId);
  const metrics = useMemo(() => contractorDashboardMetrics(contractors, associations), [contractors, associations]);

  const rows = contractors
    .filter((item) => tab === "archived" ? item.archived || item.status === "ARCHIVED" : !item.archived && item.status !== "ARCHIVED")
    .filter((item) => !status || item.status === status)
    .filter((item) => !businessType || item.businessType === businessType)
    .filter((item) => !homeId || associations.some((association) => association.contractorId === item.id && association.homeId === homeId && association.active))
    .filter((item) => searchable([item.contractorReference, item.legalName, item.tradingName, item.companyRegistrationNumber, item.generalEmail, item.mainPhone, item.primaryContactName], search))
    .sort((a, b) => contractorDisplayName(a).localeCompare(contractorDisplayName(b)));
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

  if (!care.canAccess("permission.manage")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have permission to view Contractors.</CardContent></Card></div>;
  }

  if (mode === "new") {
    return <div className="space-y-5 p-4 md:p-6"><Header title="New Contractor" subtitle="Create a tenant-level contractor master record. Active does not mean compliance approval." current="New Contractor" /><Card><CardContent className="pt-6"><ContractorForm onDone={(id) => navigate({ to: "/maintenance/contractors/$contractorId", params: { contractorId: id } })} /></CardContent></Card></div>;
  }

  if ((mode === "detail" || mode === "edit") && !selected) {
    return <div className="space-y-5 p-4 md:p-6"><Header title="Contractor Not Found" subtitle="The selected contractor could not be found in this tenant." current="Not Found" /><Card><CardContent className="py-10 text-center"><Button asChild><Link to="/maintenance/contractors/register">Back to Contractor Register</Link></Button></CardContent></Card></div>;
  }

  if (mode === "detail" && selected) {
    return <ContractorDetail contractor={selected} message={message} setMessage={setMessage} run={run} />;
  }

  if (mode === "edit" && selected) {
    return <div className="space-y-5 p-4 md:p-6"><Header title="Edit Contractor" subtitle="Update company identity, primary contact and business address." current={contractorDisplayName(selected)} /><Card><CardContent className="pt-6"><ContractorForm contractor={selected} onDone={(id) => navigate({ to: "/maintenance/contractors/$contractorId", params: { contractorId: id } })} /></CardContent></Card></div>;
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Header title="Contractors" subtitle="Shared contractor register for Maintenance, Certificates, Safety and future contractor workflows." current="Contractors" />
      {message && <Notice>{message}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate({ to: "/maintenance/contractors/new" })}><Plus className="mr-2 h-4 w-4" />New Contractor</Button>
        <Button variant="outline" onClick={() => navigate({ to: "/maintenance/contractors/register" })}>Open Register</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => <Link key={item.value} to={item.to} onClick={() => { setTab(item.value); setPage(1); }} className={cn("shrink-0 rounded-md border px-3 py-2 text-sm", tab === item.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>{item.label}</Link>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric title="Register Records" value={metrics.total} icon={Building2} tone="blue" />
        <Metric title="Draft" value={metrics.draft} icon={FileText} tone="amber" />
        <Metric title="Active" value={metrics.active} icon={CheckCircle2} tone="green" />
        <Metric title="Suspended" value={metrics.suspended} icon={ShieldAlert} tone="red" />
        <Metric title="Home Linked" value={metrics.withHomeAssociation} icon={Home} tone="teal" />
        <Metric title="Archived" value={metrics.archived} icon={Archive} tone="slate" />
      </div>
      {tab === "overview" ? <Overview rows={rows.slice(0, 6)} metrics={metrics} /> : <Register rows={pagedRows} total={rows.length} page={page} pageCount={pageCount} setPage={setPage} search={search} setSearch={(v) => { setSearch(v); setPage(1); }} status={status} setStatus={(v) => { setStatus(v); setPage(1); }} businessType={businessType} setBusinessType={(v) => { setBusinessType(v); setPage(1); }} homeId={homeId} setHomeId={(v) => { setHomeId(v); setPage(1); }} onArchive={(contractor) => run(() => care.archiveMaintenanceContractor(contractor.id, promptReason("Archive reason") || ""), "Contractor archived.")} onRestore={(contractor) => run(() => care.restoreMaintenanceContractor(contractor.id, promptReason("Restore reason") || ""), "Contractor restored.")} />}
    </div>
  );
}

function ContractorDetail({ contractor, message, setMessage, run }: { contractor: MaintenanceContractor; message: string; setMessage: (message: string) => void; run: (action: () => void, success: string) => void }) {
  const care = useCare();
  const navigate = useNavigate();
  const [homeDialog, setHomeDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const associations = care.maintenanceContractorHomeAssociations.filter((item) => item.contractorId === contractor.id);
  const notes = care.maintenanceContractorNotes.filter((item) => item.contractorId === contractor.id && item.active);
  const timeline = care.maintenanceContractorTimelineEvents.filter((item) => item.contractorId === contractor.id).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const links = care.maintenanceCertificateContractorLinks.filter((item) => item.contractorId === contractor.id && !item.unlinkedAt);
  const completeness = contractorProfileCompleteness(contractor);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Header title={contractorDisplayName(contractor)} subtitle={`${contractor.contractorReference} - foundation contractor record. Active does not confirm compliance approval.`} current={contractorDisplayName(contractor)} />
      {message && <Notice>{message}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/maintenance/contractors/register" })}>Back to Register</Button>
        {!contractor.archived && <Button onClick={() => navigate({ to: "/maintenance/contractors/$contractorId/edit", params: { contractorId: contractor.id } })}><Pencil className="mr-2 h-4 w-4" />Edit Contractor</Button>}
        {contractor.status !== "ACTIVE" && !contractor.archived && <Button variant="outline" onClick={() => run(() => care.activateMaintenanceContractor(contractor.id), "Contractor activated.")}>Activate</Button>}
        {contractor.status === "ACTIVE" && <Button variant="outline" onClick={() => run(() => care.deactivateMaintenanceContractor(contractor.id, promptReason("Deactivation reason") || ""), "Contractor deactivated.")}>Deactivate</Button>}
        {contractor.status !== "SUSPENDED" && !contractor.archived && <Button variant="outline" onClick={() => run(() => care.suspendMaintenanceContractor(contractor.id, promptReason("Suspension reason") || ""), "Contractor suspended.")}>Suspend</Button>}
        {!contractor.archived && <Button variant="outline" onClick={() => run(() => care.archiveMaintenanceContractor(contractor.id, promptReason("Archive reason") || ""), "Contractor archived.")}><Archive className="mr-2 h-4 w-4" />Archive</Button>}
        {contractor.archived && <Button variant="outline" onClick={() => run(() => care.restoreMaintenanceContractor(contractor.id, promptReason("Restore reason") || ""), "Contractor restored.")}><RefreshCw className="mr-2 h-4 w-4" />Restore</Button>}
        {!contractor.archived && <Button variant="outline" onClick={() => setHomeDialog(true)}>Associate Home</Button>}
        <Button variant="outline" onClick={() => setNoteDialog(true)}>Add Note</Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4"><Stat label="Status" value={statusBadge(contractor.status, contractor.archived)} /><Stat label="Profile Complete" value={`${completeness}%`} /><Stat label="Business Type" value={label(contractor.businessType)} /><Stat label="Version" value={contractor.version} /></div>
            <Info title="Legal Name" value={contractor.legalName} />
            <Info title="Trading Name" value={contractor.tradingName || "Not recorded"} />
            <Info title="Registration / Tax" value={[contractor.companyRegistrationNumber, contractor.taxRegistrationNumber].filter(Boolean).join(" / ") || "Not recorded"} />
            <Info title="Description" value={contractor.description || "No general service information recorded."} />
            <div className="grid gap-3 md:grid-cols-2"><Info icon={Mail} title="General Email" value={contractor.generalEmail || "Not recorded"} /><Info icon={Phone} title="Main Phone" value={contractor.mainPhone || "Not recorded"} /><Info icon={Phone} title="Emergency Phone" value={contractor.emergencyPhone || "Not recorded"} /><Info icon={UserRound} title="Primary Contact" value={[contractor.primaryContactName, contractor.primaryContactJobTitle, contractor.primaryContactEmail, contractor.primaryContactPhone].filter(Boolean).join(" - ") || "Not recorded"} /></div>
            <Info icon={MapPin} title="Business Address" value={[contractor.addressLine1, contractor.addressLine2, contractor.addressLine3, contractor.townCity, contractor.countyRegion, contractor.postalCode, contractor.countryCode].filter(Boolean).join(", ") || "Not recorded"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scope, Links & Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <InfoList title="Home Associations" rows={associations.map((item) => `${homeName(care, item.homeId)} - ${label(item.relationshipType)} - ${item.associationStatus}${item.active ? "" : " (inactive)"}`)} empty="No Home associations recorded." />
            <InfoList title="Linked Certificates" rows={links.map((link) => care.maintenanceCertificates.find((item) => item.id === link.certificateId)?.title || link.certificateId)} empty="No certificates linked to this contractor." />
            <InfoList title="Notes" rows={notes.map((note) => `${note.pinned ? "Pinned - " : ""}${note.title}: ${note.body}`)} empty="No contractor notes recorded." />
            <InfoList title="Timeline" rows={timeline.map((item) => `${formatDateTime(item.eventDate)} - ${item.summary}${item.details ? ` - ${item.details}` : ""}`)} empty="No timeline events recorded." />
          </CardContent>
        </Card>
      </div>
      <HomeDialog open={homeDialog} contractor={contractor} onOpenChange={setHomeDialog} />
      <NoteDialog open={noteDialog} contractor={contractor} onOpenChange={setNoteDialog} />
    </div>
  );
}

function Overview({ rows, metrics }: { rows: MaintenanceContractor[]; metrics: ReturnType<typeof contractorDashboardMetrics> }) {
  return <div className="grid gap-4 xl:grid-cols-[1fr_0.65fr]"><Card><CardHeader><CardTitle>Recently Updated Contractors</CardTitle></CardHeader><CardContent>{rows.length ? <div className="space-y-2">{rows.map((item) => <ContractorMiniRow key={item.id} contractor={item} />)}</div> : <Empty text="No contractors have been created yet." />}</CardContent></Card><Card><CardHeader><CardTitle>Foundation Readiness</CardTitle></CardHeader><CardContent className="space-y-3"><Stat label="Primary contacts recorded" value={metrics.withPrimaryContact} /><Stat label="Home associations" value={metrics.withHomeAssociation} /><Notice>Compliance, insurance, certificates, trades and contractor jobs are prepared for later phases and are not implied by Active status.</Notice></CardContent></Card></div>;
}

function Register(props: { rows: MaintenanceContractor[]; total: number; page: number; pageCount: number; setPage: (page: number) => void; search: string; setSearch: (v: string) => void; status: string; setStatus: (v: string) => void; businessType: string; setBusinessType: (v: string) => void; homeId: string; setHomeId: (v: string) => void; onArchive: (contractor: MaintenanceContractor) => void; onRestore: (contractor: MaintenanceContractor) => void }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>Contractor Register</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-[1fr_180px_220px_220px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Search name, reference, email, phone..." /></div><NativeSelect value={props.status} onChange={props.setStatus} options={[{ value: "", label: "All statuses" }, ...CONTRACTOR_STATUSES.map((item) => ({ value: item, label: label(item) }))]} /><NativeSelect value={props.businessType} onChange={props.setBusinessType} options={[{ value: "", label: "All business types" }, ...CONTRACTOR_BUSINESS_TYPES.map((item) => ({ value: item, label: label(item) }))]} /><NativeSelect value={props.homeId} onChange={props.setHomeId} options={[{ value: "", label: "All Homes" }, ...(care.facilities || []).map((item) => ({ value: item.id, label: item.name }))]} /></div>{props.rows.length ? <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[980px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Contractor</th><th className="px-3 py-2">Business Type</th><th className="px-3 py-2">Primary Contact</th><th className="px-3 py-2">Contact</th><th className="px-3 py-2">Homes</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{props.rows.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{item.contractorReference}</td><td className="px-3 py-3"><Link to="/maintenance/contractors/$contractorId" params={{ contractorId: item.id }} className="font-semibold text-blue-700 hover:underline">{contractorDisplayName(item)}</Link><div className="text-xs text-muted-foreground">{item.tradingName ? item.legalName : item.companyRegistrationNumber || "No registration number"}</div></td><td className="px-3 py-3">{label(item.businessType)}</td><td className="px-3 py-3">{item.primaryContactName || "Not recorded"}</td><td className="px-3 py-3">{item.generalEmail || item.mainPhone || "Not recorded"}</td><td className="px-3 py-3">{care.maintenanceContractorHomeAssociations.filter((association) => association.contractorId === item.id && association.active).length}</td><td className="px-3 py-3">{statusBadge(item.status, item.archived)}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><Link to="/maintenance/contractors/$contractorId" params={{ contractorId: item.id }}>View</Link></Button>{item.archived ? <Button size="sm" variant="outline" onClick={() => props.onRestore(item)}>Restore</Button> : <Button size="sm" variant="outline" onClick={() => props.onArchive(item)}>Archive</Button>}</div></td></tr>)}</tbody></table></div> : <Empty text="No contractors match the selected filters." />}<Pagination page={props.page} pageCount={props.pageCount} total={props.total} setPage={props.setPage} /></CardContent></Card>;
}

function ContractorForm({ contractor, onDone }: { contractor?: MaintenanceContractor; onDone: (id: string) => void }) {
  const care = useCare();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    legalName: contractor?.legalName || "",
    tradingName: contractor?.tradingName || "",
    businessType: contractor?.businessType || "LIMITED_COMPANY" as MaintenanceContractorBusinessType,
    companyRegistrationNumber: contractor?.companyRegistrationNumber || "",
    taxRegistrationNumber: contractor?.taxRegistrationNumber || "",
    website: contractor?.website || "",
    description: contractor?.description || "",
    generalEmail: contractor?.generalEmail || "",
    mainPhone: contractor?.mainPhone || "",
    alternativePhone: contractor?.alternativePhone || "",
    emergencyPhone: contractor?.emergencyPhone || "",
    primaryContactName: contractor?.primaryContactName || "",
    primaryContactJobTitle: contractor?.primaryContactJobTitle || "",
    primaryContactEmail: contractor?.primaryContactEmail || "",
    primaryContactPhone: contractor?.primaryContactPhone || "",
    addressLine1: contractor?.addressLine1 || "",
    addressLine2: contractor?.addressLine2 || "",
    addressLine3: contractor?.addressLine3 || "",
    townCity: contractor?.townCity || "",
    countyRegion: contractor?.countyRegion || "",
    postalCode: contractor?.postalCode || "",
    countryCode: contractor?.countryCode || "IE",
  });
  const duplicates = useMemo(() => potentialContractorDuplicates({ ...form, id: contractor?.id }, care.maintenanceContractors || []), [form, contractor?.id, care.maintenanceContractors]);
  const update = (key: keyof typeof form, value: string) => setForm((state) => ({ ...state, [key]: value }));
  function submit() {
    try {
      if (contractor) {
        care.updateMaintenanceContractor(contractor.id, form, contractor.version);
        onDone(contractor.id);
      } else {
        const created = care.createMaintenanceContractor(form);
        onDone(created.id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save contractor.");
    }
  }
  return <div className="space-y-4">{message && <Notice tone="red">{message}</Notice>}{duplicates.length > 0 && <Notice tone="amber">Potential duplicate: {duplicates.map((item) => `${item.contractorReference} ${contractorDisplayName(item)}`).join(", ")}. Review before saving.</Notice>}<div className="grid gap-3 md:grid-cols-2"><Field label="Legal Name *" value={form.legalName} onChange={(v) => update("legalName", v)} /><Field label="Trading Name" value={form.tradingName} onChange={(v) => update("tradingName", v)} /><Select label="Business Type *" value={form.businessType} onChange={(v) => update("businessType", v)} options={CONTRACTOR_BUSINESS_TYPES.map((item) => ({ value: item, label: label(item) }))} /><Field label="Website" value={form.website} onChange={(v) => update("website", v)} placeholder="https://..." /><Field label="Company Registration Number" value={form.companyRegistrationNumber} onChange={(v) => update("companyRegistrationNumber", v)} /><Field label="Tax Registration Number" value={form.taxRegistrationNumber} onChange={(v) => update("taxRegistrationNumber", v)} /><Field label="General Email" value={form.generalEmail} onChange={(v) => update("generalEmail", v)} /><Field label="Main Phone" value={form.mainPhone} onChange={(v) => update("mainPhone", v)} /><Field label="Alternative Phone" value={form.alternativePhone} onChange={(v) => update("alternativePhone", v)} /><Field label="Emergency Phone" value={form.emergencyPhone} onChange={(v) => update("emergencyPhone", v)} /><Field label="Primary Contact Name" value={form.primaryContactName} onChange={(v) => update("primaryContactName", v)} /><Field label="Primary Contact Job Title" value={form.primaryContactJobTitle} onChange={(v) => update("primaryContactJobTitle", v)} /><Field label="Primary Contact Email" value={form.primaryContactEmail} onChange={(v) => update("primaryContactEmail", v)} /><Field label="Primary Contact Phone" value={form.primaryContactPhone} onChange={(v) => update("primaryContactPhone", v)} /><Field label="Address Line 1" value={form.addressLine1} onChange={(v) => update("addressLine1", v)} /><Field label="Address Line 2" value={form.addressLine2} onChange={(v) => update("addressLine2", v)} /><Field label="Address Line 3" value={form.addressLine3} onChange={(v) => update("addressLine3", v)} /><Field label="Town / City" value={form.townCity} onChange={(v) => update("townCity", v)} /><Field label="County / Region" value={form.countyRegion} onChange={(v) => update("countyRegion", v)} /><Field label="Postal Code" value={form.postalCode} onChange={(v) => update("postalCode", v)} /><Field label="Country Code" value={form.countryCode} onChange={(v) => update("countryCode", v.toUpperCase())} /></div><div><label className="text-sm font-medium">General Service Information</label><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Service scope or general notes. Do not record compliance approval here." /></div><div className="flex flex-wrap gap-2"><Button onClick={submit}>{contractor ? "Save Contractor" : "Save Draft Contractor"}</Button><Button variant="outline" asChild><Link to="/maintenance/contractors/register">Cancel</Link></Button></div></div>;
}

function HomeDialog({ open, contractor, onOpenChange }: { open: boolean; contractor: MaintenanceContractor; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId || care.facilities?.[0]?.id || "");
  const [relationshipType, setRelationshipType] = useState<MaintenanceContractorHomeRelationshipType>("HOME_PROVIDER");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  function submit() {
    try {
      care.associateMaintenanceContractorHome(contractor.id, { homeId, relationshipType, notes });
      onOpenChange(false);
      setNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to associate Home.");
    }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Associate Home</DialogTitle></DialogHeader><div className="space-y-3">{message && <Notice tone="red">{message}</Notice>}<Select label="Home" value={homeId} onChange={setHomeId} options={(care.facilities || []).map((item) => ({ value: item.id, label: item.name }))} /><Select label="Relationship Type" value={relationshipType} onChange={(v) => setRelationshipType(v as MaintenanceContractorHomeRelationshipType)} options={["TENANT_WIDE", "HOME_PROVIDER", "EMERGENCY_PROVIDER", "HISTORICAL", "OTHER"].map((item) => ({ value: item, label: label(item) }))} /><div><label className="text-sm font-medium">Notes</label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Associate Home</Button></DialogFooter></DialogContent></Dialog>;
}

function NoteDialog({ open, contractor, onOpenChange }: { open: boolean; contractor: MaintenanceContractor; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [noteType, setNoteType] = useState<MaintenanceContractorNoteType>("GENERAL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  function submit() {
    try {
      care.addMaintenanceContractorNote(contractor.id, { noteType, title, body });
      onOpenChange(false);
      setTitle("");
      setBody("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add note.");
    }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Contractor Note</DialogTitle></DialogHeader><div className="space-y-3">{message && <Notice tone="red">{message}</Notice>}<Select label="Note Type" value={noteType} onChange={(v) => setNoteType(v as MaintenanceContractorNoteType)} options={["GENERAL", "ADMINISTRATIVE", "OPERATIONAL", "COMPLIANCE", "ACCESS", "OTHER"].map((item) => ({ value: item, label: label(item) }))} /><Field label="Title" value={title} onChange={setTitle} /><div><label className="text-sm font-medium">Body</label><Textarea value={body} onChange={(event) => setBody(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Add Note</Button></DialogFooter></DialogContent></Dialog>;
}

function Header({ title, subtitle, current }: { title: string; subtitle: string; current: string }) {
  return <div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/maintenance" className="hover:text-foreground">Maintenance</Link><ArrowRight className="h-3.5 w-3.5" /><Link to="/maintenance/contractors" className="hover:text-foreground">Contractors</Link>{current !== "Contractors" && <><ArrowRight className="h-3.5 w-3.5" /><span>{current}</span></>}</div><h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></div>;
}

function ContractorMiniRow({ contractor }: { contractor: MaintenanceContractor }) {
  return <Link to="/maintenance/contractors/$contractorId" params={{ contractorId: contractor.id }} className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/40"><div><div className="font-medium">{contractorDisplayName(contractor)}</div><div className="text-xs text-muted-foreground">{contractor.contractorReference} - {contractor.generalEmail || contractor.mainPhone || "No contact method"}</div></div>{statusBadge(contractor.status, contractor.archived)}</Link>;
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

function Field({ label: fieldLabel, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="space-y-1 text-sm font-medium">{fieldLabel}<Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function Select({ label: fieldLabel, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="space-y-1 text-sm font-medium">{fieldLabel}<NativeSelect value={value} onChange={onChange} options={options} /></label>;
}

function NativeSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}</select>;
}

function Pagination({ page, pageCount, total, setPage }: { page: number; pageCount: number; total: number; setPage: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>{total} contractor records</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div></div>;
}

function statusBadge(status: string, archived?: boolean) {
  const value = archived ? "ARCHIVED" : status;
  const classes: Record<string, string> = { DRAFT: "bg-amber-100 text-amber-800", ACTIVE: "bg-blue-100 text-blue-800", INACTIVE: "bg-slate-100 text-slate-800", SUSPENDED: "bg-red-100 text-red-800", ARCHIVED: "bg-zinc-200 text-zinc-800" };
  return <Badge className={classes[value] || "bg-muted text-foreground"}>{label(value)}</Badge>;
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
