import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, FileText, HardHat, Search, ShieldCheck } from "lucide-react";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { certificateComplianceStatus, daysBetween } from "@/domain/maintenance/certificates";
import { useCare } from "@/lib/care/store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { loadPhase5AGovernance, persistPhase5AGovernance, uploadDocumentVersion, type MaintenanceDocumentRecord } from "@/domain/maintenance/phase5aGovernance";

type WorkspaceTab = "contractors" | "certificates" | "documents" | "expiry";

const TABS: Array<{ value: WorkspaceTab; label: string; icon: typeof HardHat }> = [
  { value: "contractors", label: "Contractors", icon: HardHat },
  { value: "certificates", label: "Certificates", icon: ShieldCheck },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "expiry", label: "Expiry Calendar", icon: CalendarDays },
];

export function ContractorsCertificatesWorkspace() {
  const care = useCare();
  const [tab, setTab] = useState<WorkspaceTab>("contractors");
  const canView = care.canAccess("maintenance.contractors.register.view") || care.canAccess("maintenance.contractors.view") || care.canAccess("permission.manage");
  if (!canView) return <main className="p-4 md:p-6"><Card><CardContent className="py-12 text-center"><h1 className="text-xl font-semibold">Contractors &amp; Certificates</h1><p className="mt-2 text-muted-foreground">You do not have permission to view contractor or certificate records.</p></CardContent></Card></main>;
  return (
    <main className="space-y-5 p-4 md:p-6">
      <header>
        <div className="text-base text-muted-foreground">Maintenance</div>
        <h1 className="text-3xl font-semibold tracking-tight">Contractors &amp; Certificates</h1>
        <p className="mt-1 max-w-3xl text-base text-muted-foreground">Manage contractors, compliance, certificates and supporting documents from one place.</p>
      </header>
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Contractors and certificates">
        {TABS.map((item) => <Button key={item.value} size="lg" variant={tab === item.value ? "default" : "outline"} className="shrink-0" onClick={() => setTab(item.value)}><item.icon className="mr-2 h-5 w-5" />{item.label}</Button>)}
      </nav>
      {tab === "contractors" && <ContractorManagement initialTab="register" embedded />}
      {tab === "certificates" && <CertificateManagement initialTab="register" embedded />}
      {tab === "documents" && <DocumentsRegister />}
      {tab === "expiry" && <ExpiryCalendar />}
    </main>
  );
}

function DocumentsRegister() {
  const care = useCare();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (care.maintenanceCertificateAttachments || [])
    .filter((item) => item.active && !item.removedAt)
    .map((attachment) => ({ attachment, certificate: care.maintenanceCertificates.find((item) => item.id === attachment.certificateId) }))
    .filter(({ attachment, certificate }) => [attachment.title, attachment.fileName, attachment.documentType, certificate?.title, certificate?.certificateNumber].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.attachment.uploadedAt.localeCompare(a.attachment.uploadedAt)), [care.maintenanceCertificateAttachments, care.maintenanceCertificates, search]);
  return <section className="space-y-4"><div><h2 className="text-2xl font-semibold">Documents</h2><p className="text-muted-foreground">Maintenance documents and certificate evidence, with immutable version history.</p></div><StandaloneDocuments /><Card><CardHeader><CardTitle>Certificate attachments</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents, certificates or file names" /></div>{rows.length ? <div className="space-y-2">{rows.map(({ attachment, certificate }) => <div key={attachment.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="font-medium">{attachment.title || attachment.fileName}</div><div className="text-sm text-muted-foreground">{label(attachment.documentType)} · {certificate?.title || "Record unavailable"} · {formatDate(attachment.uploadedAt)}</div></div><Button size="sm" variant="outline" disabled={!certificate} onClick={() => certificate && navigate({ to: "/maintenance/certificates/$id", params: { id: certificate.id } })}>View record</Button></div>)}</div> : <Empty title="No certificate attachments found" text="Upload evidence from a certificate record." />}</CardContent></Card></section>;
}

function StandaloneDocuments() { const care = useCare(); const [data, setData] = useState(loadPhase5AGovernance); const [editing, setEditing] = useState<MaintenanceDocumentRecord>(); const [form, setForm] = useState({ title: "", type: "SERVICE_REPORT", fileName: "", expiryDate: "", notes: "" }); const commit = (documents: MaintenanceDocumentRecord[]) => { const next = { ...data, documents }; setData(next); persistPhase5AGovernance(next); }; const openNew = () => { setForm({ title: "", type: "SERVICE_REPORT", fileName: "", expiryDate: "", notes: "" }); setEditing({ id: `document-${Date.now()}`, tenantId: "tenant-oritas-demo", homeId: care.activeFacilityId, reference: `DOC-${String(data.documents.length + 1).padStart(5, "0")}`, title: "", documentType: "SERVICE_REPORT", currentVersionId: "", versions: [] }); }; const save = () => { if (!editing || !form.title.trim() || !form.fileName.trim()) return; const base = { ...editing, title: form.title.trim(), documentType: form.type }; const updated = uploadDocumentVersion(base, { idempotencyKey: `document-version-${Date.now()}`, fileName: form.fileName.trim(), uploadedBy: care.currentUser.name, uploadedAt: new Date().toISOString(), expiryDate: form.expiryDate || undefined, notes: form.notes }); commit(data.documents.some((item) => item.id === updated.id) ? data.documents.map((item) => item.id === updated.id ? updated : item) : [updated, ...data.documents]); setEditing(undefined); }; return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Standalone documents</CardTitle><p className="mt-1 text-sm text-muted-foreground">Service reports, risk assessments, manuals, warranties and contractor evidence.</p></div><Button onClick={openNew}>Upload Document</Button></div></CardHeader><CardContent>{data.documents.length ? <div className="space-y-2">{data.documents.map((document) => { const current = document.versions.find((item) => item.id === document.currentVersionId); return <div key={document.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{document.title}</div><div className="text-sm text-muted-foreground">{label(document.documentType)} · Version {current?.versionNumber} · {current?.status}</div><div className="text-sm">{current?.fileName} · uploaded by {current?.uploadedBy}</div></div><Button variant="outline" onClick={() => { setForm({ title: document.title, type: document.documentType, fileName: "", expiryDate: "", notes: "" }); setEditing(document); }}>Upload New Version</Button></div><details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Version history</summary><div className="mt-2 space-y-1 text-sm">{[...document.versions].reverse().map((version) => <div key={version.id}>Version {version.versionNumber} · {version.current ? "Current" : "Superseded"} · {version.fileName} · {formatDate(version.uploadedAt)}</div>)}</div></details></div>; })}</div> : <Empty title="No standalone documents" text="Upload the first maintenance or contractor document." />}</CardContent><Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent><DialogHeader><DialogTitle>{editing?.versions.length ? "Upload New Version" : "Upload Document"}</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Title</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div><div><Label>Document Type</Label><select className="h-11 w-full rounded-md border bg-background px-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{["SERVICE_REPORT","INSURANCE","QUOTE","RISK_ASSESSMENT","METHOD_STATEMENT","SAFETY_DATA_SHEET","MAINTENANCE_MANUAL","WARRANTY","INSPECTION_REPORT","PHOTOGRAPH","COMPLIANCE_POLICY","CONTRACTOR_DOCUMENT","OTHER"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></div><div><Label>Attachment file name</Label><Input value={form.fileName} onChange={(event) => setForm({ ...form, fileName: event.target.value })} placeholder="document.pdf" /></div><div><Label>Expiry date (optional)</Label><Input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setEditing(undefined)}>Cancel</Button><Button onClick={save}>Save Document Version</Button></DialogFooter></DialogContent></Dialog></Card>; }

function ExpiryCalendar() {
  const care = useCare();
  const navigate = useNavigate();
  const [scope, setScope] = useState<"all" | "due" | "expired">("all");
  const today = new Date();
  const rows = useMemo(() => care.maintenanceCertificates.filter((certificate) => !certificate.archived).map((certificate) => {
    const version = care.maintenanceCertificateVersions.find((item) => item.id === certificate.currentVersionId);
    const type = care.maintenanceCertificateTypes.find((item) => item.id === certificate.certificateTypeId);
    const attachments = care.maintenanceCertificateAttachments.filter((item) => item.certificateId === certificate.id && item.certificateVersionId === certificate.currentVersionId);
    const contractorLink = care.maintenanceCertificateContractorLinks.find((item) => item.certificateId === certificate.id && !item.unlinkedAt);
    const contractor = care.maintenanceContractors.find((item) => item.id === contractorLink?.contractorId);
    const status = certificateComplianceStatus({ certificate, version, type, attachments, today });
    return { certificate, version, type, contractor, status, days: version?.expiryDate ? daysBetween(today, version.expiryDate) : undefined };
  }).filter((row) => row.version?.expiryDate).filter((row) => scope === "all" || (scope === "due" ? row.status === "EXPIRING_SOON" : row.status === "EXPIRED")).sort((a, b) => a.version!.expiryDate!.localeCompare(b.version!.expiryDate!)), [care.maintenanceCertificates, care.maintenanceCertificateVersions, care.maintenanceCertificateTypes, care.maintenanceCertificateAttachments, care.maintenanceCertificateContractorLinks, care.maintenanceContractors, scope]);
  return <section className="space-y-4"><div><h2 className="text-2xl font-semibold">Expiry Calendar</h2><p className="text-muted-foreground">A clear agenda of insurance, qualifications and maintenance certificates that need attention.</p></div><div className="flex flex-wrap gap-2">{([['all','All expiries'],['due','Due soon'],['expired','Expired']] as const).map(([value, text]) => <Button key={value} variant={scope === value ? "default" : "outline"} onClick={() => setScope(value)}>{text}</Button>)}</div><Card><CardHeader><CardTitle>Expiry agenda</CardTitle></CardHeader><CardContent>{rows.length ? <div className="space-y-3">{rows.map((row) => <button key={row.certificate.id} className="flex w-full flex-col gap-3 rounded-lg border p-4 text-left transition hover:bg-muted/50 sm:flex-row sm:items-center" onClick={() => navigate({ to: "/maintenance/certificates/$id", params: { id: row.certificate.id } })}><div className="min-w-32"><div className="font-semibold">{formatDate(row.version!.expiryDate!)}</div><div className={cn("text-sm", row.days! < 0 ? "text-destructive" : "text-muted-foreground")}>{row.days! < 0 ? `${Math.abs(row.days!)} days overdue` : `${row.days} days remaining`}</div></div><div className="min-w-0 flex-1"><div className="font-medium">{row.certificate.title}</div><div className="text-sm text-muted-foreground">{row.type?.name || "Certificate"}{row.contractor ? ` · ${row.contractor.tradingName || row.contractor.legalName}` : ""}</div></div><Status value={row.status} /></button>)}</div> : <Empty title="No expiry items" text="There are no certificate expiry dates in this view." />}</CardContent></Card></section>;
}

function Status({ value }: { value: string }) { const bad = value === "EXPIRED" || value === "MISSING" || value === "REVOKED"; return <Badge className={cn(bad ? "bg-red-100 text-red-900" : value === "EXPIRING_SOON" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900")}>{label(value)}</Badge>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-lg border border-dashed px-6 py-12 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>; }
function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
