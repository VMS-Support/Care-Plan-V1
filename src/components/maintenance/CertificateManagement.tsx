import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Archive, ArrowRight, CheckCircle2, Clock, FileText, History, Link2, Plus, RefreshCw, Search, ShieldCheck, Upload } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type {
  MaintenanceAsset,
  MaintenanceCertificate,
  MaintenanceCertificateAttachment,
  MaintenanceCertificateRequirement,
  MaintenanceCertificateSubjectType,
  MaintenanceCertificateType,
  MaintenanceCertificateTypeCategory,
  MaintenanceCertificateVersion,
} from "@/lib/care/types";
import {
  CERTIFICATE_SUBJECT_TYPES,
  CERTIFICATE_TYPE_CATEGORIES,
  certificateComplianceStatus,
  certificateDashboardMetrics,
  certificateTimeline,
  missingCertificateRequirements,
  versionPresentationStatus,
} from "@/domain/maintenance/certificates";
import { contractorDisplayName } from "@/domain/maintenance/contractors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tab = "overview" | "register" | "dueSoon" | "expired" | "missing" | "types" | "requirements" | "archived";
type Mode = "list" | "new" | "detail" | "edit" | "renew";

const TABS: Array<{ value: Tab; label: string; to: string }> = [
  { value: "overview", label: "Overview", to: "/maintenance/certificates" },
  { value: "register", label: "Certificate Register", to: "/maintenance/certificates/register" },
  { value: "dueSoon", label: "Due Soon", to: "/maintenance/certificates/due-soon" },
  { value: "expired", label: "Expired", to: "/maintenance/certificates/expired" },
  { value: "missing", label: "Missing Certificates", to: "/maintenance/certificates/missing" },
  { value: "types", label: "Certificate Types", to: "/maintenance/certificates/types" },
  { value: "requirements", label: "Requirements", to: "/maintenance/certificates/requirements" },
  { value: "archived", label: "Archived", to: "/maintenance/certificates/archived" },
];

export function CertificateManagement({ initialTab = "overview", mode = "list", certificateId }: { initialTab?: Tab; mode?: Mode; certificateId?: string }) {
  const care = useCare();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [certificateDialog, setCertificateDialog] = useState<{ open: boolean; certificate?: MaintenanceCertificate; action: "new" | "edit" | "renew" }>({ open: mode === "new", action: "new" });
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; type?: MaintenanceCertificateType }>({ open: false });
  const [requirementDialog, setRequirementDialog] = useState<{ open: boolean; requirement?: MaintenanceCertificateRequirement }>({ open: false });
  const [attachmentDialog, setAttachmentDialog] = useState<{ open: boolean; certificate?: MaintenanceCertificate }>({ open: false });
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; certificate?: MaintenanceCertificate }>({ open: false });

  const certificates = care.maintenanceCertificates || [];
  const versions = care.maintenanceCertificateVersions || [];
  const types = care.maintenanceCertificateTypes || [];
  const attachments = care.maintenanceCertificateAttachments || [];
  const selectedCertificate = certificates.find((item) => item.id === certificateId);
  const selectedVersion = versions.find((item) => item.id === selectedCertificate?.currentVersionId);
  const metrics = useMemo(() => certificateDashboardMetrics({
    certificates,
    versions,
    types,
    attachments,
    requirements: care.maintenanceCertificateRequirements || [],
    assets: care.maintenanceAssets || [],
  }), [certificates, versions, types, attachments, care.maintenanceCertificateRequirements, care.maintenanceAssets]);
  const missing = useMemo(() => missingCertificateRequirements({
    requirements: care.maintenanceCertificateRequirements || [],
    certificates,
    versions,
    types,
    attachments,
    assets: care.maintenanceAssets || [],
  }), [care.maintenanceCertificateRequirements, certificates, versions, types, attachments, care.maintenanceAssets]);

  const rows = certificates
    .map((certificate) => decorateCertificate(certificate, versions, types, attachments))
    .filter((row) => tab === "archived" ? row.certificate.archived : !row.certificate.archived)
    .filter((row) => tab !== "dueSoon" || row.status === "EXPIRING_SOON")
    .filter((row) => tab !== "expired" || row.status === "EXPIRED")
    .filter((row) => !statusFilter || row.status === statusFilter)
    .filter((row) => !typeFilter || row.certificate.certificateTypeId === typeFilter)
    .filter((row) => searchable([row.certificate.certificateNumber, row.certificate.title, row.type?.name, row.certificate.issuingOrganisation, subjectLabel(row.certificate, care.maintenanceAssets, care.maintenanceWorkOrders, care.safetyInspections)], search))
    .sort((a, b) => (a.version?.expiryDate || "9999-12-31").localeCompare(b.version?.expiryDate || "9999-12-31"));
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

  if (mode !== "list" && selectedCertificate) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <Header title={mode === "renew" ? "Renew Certificate" : mode === "edit" ? "Edit Certificate" : selectedCertificate.title} subtitle="Shared certificate lifecycle, version history, links and audit trail." />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/maintenance/certificates/register" })}>Back to Register</Button>
          {mode === "detail" && <Button onClick={() => navigate({ to: "/maintenance/certificates/$id/edit", params: { id: selectedCertificate.id } })}>Edit Certificate</Button>}
          {mode === "detail" && <Button variant="outline" onClick={() => navigate({ to: "/maintenance/certificates/$id/renew", params: { id: selectedCertificate.id } })}><RefreshCw className="mr-2 h-4 w-4" />Renew</Button>}
        </div>
        {mode === "detail" ? (
          <CertificateDetail certificate={selectedCertificate} />
        ) : (
          <Card><CardHeader><CardTitle>{mode === "renew" ? "Renew Certificate" : "Edit Certificate"}</CardTitle></CardHeader><CardContent><CertificateForm certificate={selectedCertificate} action={mode === "renew" ? "renew" : "edit"} onDone={() => navigate({ to: "/maintenance/certificates/$id", params: { id: selectedCertificate.id } })} /></CardContent></Card>
        )}
      </div>
    );
  }

  if (mode === "new") {
    return <div className="space-y-5 p-4 md:p-6"><Header title="Create Certificate" subtitle="Create a shared certificate with an initial current version." /><Card><CardContent className="pt-6"><CertificateForm action="new" onDone={(id) => navigate({ to: id ? "/maintenance/certificates/$id" : "/maintenance/certificates/register", params: id ? { id } : undefined as any })} /></CardContent></Card></div>;
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Header title="Certificates" subtitle="Shared certificate register, renewals, expiry monitoring and missing compliance requirements." />
      {message && <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{message}</div>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate({ to: "/maintenance/certificates/new" })}><Plus className="mr-2 h-4 w-4" />Create Certificate</Button>
        <Button variant="outline" onClick={() => setTypeDialog({ open: true })}>Certificate Type</Button>
        <Button variant="outline" onClick={() => setRequirementDialog({ open: true })}>Requirement</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => <Link key={item.value} to={item.to} onClick={() => setTab(item.value)} className={cn("shrink-0 rounded-md border px-3 py-2 text-sm", tab === item.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>{item.label}</Link>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric title="Total Active" value={metrics.total} icon={FileText} tone="blue" />
        <Metric title="Valid" value={metrics.valid} icon={CheckCircle2} tone="green" />
        <Metric title="Due Soon" value={metrics.dueSoon} icon={Clock} tone="amber" onClick={() => navigate({ to: "/maintenance/certificates/due-soon" })} />
        <Metric title="Expired" value={metrics.expired} icon={AlertTriangle} tone="red" onClick={() => navigate({ to: "/maintenance/certificates/expired" })} />
        <Metric title="Missing" value={metrics.missing} icon={ShieldCheck} tone="red" onClick={() => navigate({ to: "/maintenance/certificates/missing" })} />
        <Metric title="Attachment Gaps" value={metrics.attachmentGaps} icon={Upload} tone="amber" />
      </div>

      {tab === "overview" && <OverviewPanel metrics={metrics} rows={rows.slice(0, 5)} missing={missing.slice(0, 5)} />}
      {["register", "dueSoon", "expired", "archived"].includes(tab) && (
        <Card>
          <CardHeader><CardTitle>{tab === "register" ? "Certificate Register" : TABS.find((item) => item.value === tab)?.label}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FilterBar search={search} setSearch={(v) => { setSearch(v); setPage(1); }} statusFilter={statusFilter} setStatusFilter={(v) => { setStatusFilter(v); setPage(1); }} typeFilter={typeFilter} setTypeFilter={(v) => { setTypeFilter(v); setPage(1); }} types={types} />
            <RegisterTable rows={pagedRows} assets={care.maintenanceAssets} workOrders={care.maintenanceWorkOrders} inspections={care.safetyInspections} onArchive={(certificate) => run(() => care.archiveMaintenanceCertificate(certificate.id, "Archived from Certificate Register"), "Certificate archived.")} onRestore={(certificate) => run(() => care.restoreMaintenanceCertificate(certificate.id), "Certificate restored.")} onAttachment={(certificate) => setAttachmentDialog({ open: true, certificate })} onLink={(certificate) => setLinkDialog({ open: true, certificate })} />
            <Pagination page={page} pageCount={pageCount} total={rows.length} setPage={setPage} />
          </CardContent>
        </Card>
      )}
      {tab === "missing" && <MissingPanel rows={missing} types={types} assets={care.maintenanceAssets} />}
      {tab === "types" && <TypesPanel types={types} certificates={certificates} onEdit={(type) => setTypeDialog({ open: true, type })} onToggle={(type) => run(() => type.active ? care.deactivateMaintenanceCertificateType(type.id) : care.activateMaintenanceCertificateType(type.id), type.active ? "Certificate type deactivated." : "Certificate type activated.")} />}
      {tab === "requirements" && <RequirementsPanel rows={care.maintenanceCertificateRequirements || []} types={types} assets={care.maintenanceAssets} onEdit={(requirement) => setRequirementDialog({ open: true, requirement })} onArchive={(requirement) => run(() => care.archiveMaintenanceCertificateRequirement(requirement.id, "Archived from Certificate Requirements"), "Requirement archived.")} />}
      <CertificateDialog open={certificateDialog.open} certificate={certificateDialog.certificate} action={certificateDialog.action} onOpenChange={(open) => setCertificateDialog((state) => ({ ...state, open }))} />
      <TypeDialog open={typeDialog.open} type={typeDialog.type} onOpenChange={(open) => setTypeDialog({ open })} />
      <RequirementDialog open={requirementDialog.open} requirement={requirementDialog.requirement} onOpenChange={(open) => setRequirementDialog({ open })} />
      <AttachmentDialog open={attachmentDialog.open} certificate={attachmentDialog.certificate} onOpenChange={(open) => setAttachmentDialog({ open })} />
      <LinkDialog open={linkDialog.open} certificate={linkDialog.certificate} onOpenChange={(open) => setLinkDialog({ open })} />
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Link to="/maintenance" className="hover:text-foreground">Maintenance</Link><ArrowRight className="h-3.5 w-3.5" /><span>Certificates</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></div>;
}

function OverviewPanel({ metrics, rows, missing }: { metrics: ReturnType<typeof certificateDashboardMetrics>; rows: DecoratedCertificate[]; missing: MaintenanceCertificateRequirement[] }) {
  return <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><Card><CardHeader><CardTitle>Highest Priority Expiries</CardTitle></CardHeader><CardContent>{rows.length === 0 ? <Empty text="No certificates match the selected filters." /> : <div className="space-y-2">{rows.map((row) => <CertificateRow key={row.certificate.id} row={row} />)}</div>}</CardContent></Card><Card><CardHeader><CardTitle>Compliance Summary</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3 text-sm"><Stat label="Valid" value={metrics.valid} /><Stat label="Due Soon" value={metrics.dueSoon} tone="amber" /><Stat label="Expired" value={metrics.expired} tone="red" /><Stat label="Archived" value={metrics.archived} /></div><InfoList title="Missing Requirements" rows={missing.map((item) => item.requirementName)} empty="No mandatory certificate requirements are currently missing." /></CardContent></Card></div>;
}

type DecoratedCertificate = ReturnType<typeof decorateCertificate>;

function RegisterTable({ rows, assets, workOrders, inspections, onArchive, onRestore, onAttachment, onLink }: { rows: DecoratedCertificate[]; assets: any[]; workOrders: any[]; inspections: any[]; onArchive: (c: MaintenanceCertificate) => void; onRestore: (c: MaintenanceCertificate) => void; onAttachment: (c: MaintenanceCertificate) => void; onLink: (c: MaintenanceCertificate) => void }) {
  if (rows.length === 0) return <Empty text="No certificates match the selected filters." />;
  return <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1100px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Certificate Number</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Title</th><th className="px-3 py-2">Issuer</th><th className="px-3 py-2">Version</th><th className="px-3 py-2">Dates</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Linked Subject</th><th className="px-3 py-2">Attachment</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.certificate.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.certificate.certificateNumber}</td><td className="px-3 py-3">{row.type?.name || "Unknown type"}</td><td className="px-3 py-3"><Link className="font-medium text-blue-700 hover:underline" to="/maintenance/certificates/$id" params={{ id: row.certificate.id }}>{row.certificate.title}</Link><div className="text-xs text-muted-foreground">{row.certificate.lifecycleStatus}</div></td><td className="px-3 py-3">{row.certificate.issuingOrganisation}</td><td className="px-3 py-3">v{row.version?.versionNumber || 0}</td><td className="px-3 py-3"><div>Issued {row.version?.issuedDate || "-"}</div><div className="text-xs text-muted-foreground">Valid {row.version?.validFromDate || "-"} to {row.version?.expiryDate || "No expiry"}</div></td><td className="px-3 py-3"><Badge className={statusClass(row.status)}>{row.status.replaceAll("_", " ")}</Badge></td><td className="px-3 py-3">{subjectLabel(row.certificate, assets, workOrders, inspections)}</td><td className="px-3 py-3">{row.attachments.length ? <span>{row.attachments.find((item) => item.primaryAttachment)?.fileName || row.attachments[0].fileName}</span> : <Badge className="bg-amber-100 text-amber-800">Missing</Badge>}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><Link to="/maintenance/certificates/$id" params={{ id: row.certificate.id }}>View</Link></Button><Button size="sm" variant="outline" onClick={() => onAttachment(row.certificate)}>Attach</Button><Button size="sm" variant="outline" onClick={() => onLink(row.certificate)}>Link</Button>{row.certificate.archived ? <Button size="sm" variant="outline" onClick={() => onRestore(row.certificate)}>Restore</Button> : <Button size="sm" variant="outline" onClick={() => onArchive(row.certificate)}><Archive className="mr-1 h-3.5 w-3.5" />Archive</Button>}</div></td></tr>)}</tbody></table></div>;
}

function CertificateDetail({ certificate }: { certificate: MaintenanceCertificate }) {
  const care = useCare();
  const versions = care.maintenanceCertificateVersions.filter((item) => item.certificateId === certificate.id).sort((a, b) => b.versionNumber - a.versionNumber);
  const attachments = care.maintenanceCertificateAttachments.filter((item) => item.certificateId === certificate.id);
  const type = care.maintenanceCertificateTypes.find((item) => item.id === certificate.certificateTypeId);
  const timeline = certificateTimeline({ certificate, versions, attachments, events: care.maintenanceCertificateTimelineEvents.filter((item) => item.certificateId === certificate.id) });
  return <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]"><Card><CardHeader><CardTitle>{certificate.title}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Stat label="Compliance" value={certificateComplianceStatus({ certificate, version: versions.find((item) => item.id === certificate.currentVersionId), type, attachments: attachments.filter((item) => item.certificateVersionId === certificate.currentVersionId) }).replaceAll("_", " ")} /><Stat label="Current Version" value={`v${versions.find((item) => item.id === certificate.currentVersionId)?.versionNumber || 0}`} /><Stat label="Attachments" value={attachments.filter((item) => item.active && !item.removedAt).length} /></div><Info title="Certificate Number" value={certificate.certificateNumber} /><Info title="Type" value={type?.name || "Unknown"} /><Info title="Issuing Organisation" value={certificate.issuingOrganisation} /><Info title="Subject" value={subjectLabel(certificate, care.maintenanceAssets, care.maintenanceWorkOrders, care.safetyInspections)} /><InfoList title="Attachments" rows={attachments.filter((item) => item.active && !item.removedAt).map((item) => `${item.primaryAttachment ? "Primary - " : ""}${item.fileName} (${item.documentType.replaceAll("_", " ")})`)} empty="No attachments have been uploaded for this certificate version." /></CardContent></Card><Card><CardHeader><CardTitle>Version History & Timeline</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{versions.map((version) => <div key={version.id} className="rounded-md border p-3 text-sm"><div className="flex items-center justify-between gap-2"><div className="font-medium">Version {version.versionNumber}</div><Badge className={statusClass(versionPresentationStatus(version, type))}>{versionPresentationStatus(version, type).replaceAll("_", " ")}</Badge></div><div className="text-xs text-muted-foreground">Issued {version.issuedDate} · Valid from {version.validFromDate} · Expires {version.expiryDate || "No expiry"}</div>{version.renewalReason && <div className="mt-1 text-xs">{version.renewalReason}</div>}</div>)}</div><InfoList title="Timeline" rows={timeline.map((item) => `${formatDateTime(item.at)} - ${item.summary}${item.reference ? ` - ${item.reference}` : ""}`)} empty="No certificate timeline events." /></CardContent></Card></div>;
}

function CertificateForm({ certificate, action, onDone }: { certificate?: MaintenanceCertificate; action: "new" | "edit" | "renew"; onDone: (id?: string) => void }) {
  const care = useCare();
  const currentVersion = care.maintenanceCertificateVersions.find((item) => item.id === certificate?.currentVersionId);
  const [form, setForm] = useState({ certificateTypeId: certificate?.certificateTypeId || care.maintenanceCertificateTypes[0]?.id || "", title: certificate?.title || "", certificateNumber: certificate?.certificateNumber || "", issuingOrganisation: certificate?.issuingOrganisation || "", subjectType: certificate?.subjectType || "HOME" as MaintenanceCertificateSubjectType, primarySubjectId: certificate?.primarySubjectId || "", issuedDate: currentVersion?.issuedDate || new Date().toISOString().slice(0, 10), validFromDate: currentVersion?.validFromDate || new Date().toISOString().slice(0, 10), expiryDate: currentVersion?.expiryDate || "", attachmentFileName: "", renewalReason: "" });
  const [message, setMessage] = useState("");
  const update = (key: string, value: string) => setForm((state) => ({ ...state, [key]: value }));
  function submit() {
    try {
      if (action === "new") {
        const created = care.createMaintenanceCertificate({ ...form, expiryDate: form.expiryDate || undefined, primarySubjectId: form.primarySubjectId || undefined, attachmentFileName: form.attachmentFileName || undefined });
        onDone(created.id);
      } else if (action === "edit" && certificate) {
        care.updateMaintenanceCertificate(certificate.id, { ...form, expiryDate: form.expiryDate || undefined, primarySubjectId: form.primarySubjectId || undefined }, "Edited from certificate detail");
        onDone(certificate.id);
      } else if (action === "renew" && certificate) {
        care.renewMaintenanceCertificate(certificate.id, { issuedDate: form.issuedDate, validFromDate: form.validFromDate, expiryDate: form.expiryDate || undefined, renewalReason: form.renewalReason || "Renewed from certificate workspace", attachmentFileName: form.attachmentFileName || undefined, activate: true });
        onDone(certificate.id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save certificate.");
    }
  }
  return <div className="space-y-4">{message && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{message}</div>}<div className="grid gap-3 md:grid-cols-2"><Select label="Certificate Type" value={form.certificateTypeId} onChange={(v) => update("certificateTypeId", v)} options={care.maintenanceCertificateTypes.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} /><Select label="Subject Type" value={form.subjectType} onChange={(v) => update("subjectType", v)} options={CERTIFICATE_SUBJECT_TYPES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} /><Field label="Title" value={form.title} onChange={(v) => update("title", v)} /><Field label="Certificate Number" value={form.certificateNumber} onChange={(v) => update("certificateNumber", v)} /><Field label="Issuing Organisation" value={form.issuingOrganisation} onChange={(v) => update("issuingOrganisation", v)} /><SubjectField subjectType={form.subjectType} value={form.primarySubjectId} onChange={(v) => update("primarySubjectId", v)} /><Field label="Issued Date" type="date" value={form.issuedDate} onChange={(v) => update("issuedDate", v)} /><Field label="Valid From" type="date" value={form.validFromDate} onChange={(v) => update("validFromDate", v)} /><Field label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => update("expiryDate", v)} /><Field label={action === "renew" ? "Renewal Attachment" : "Attachment File Name"} value={form.attachmentFileName} placeholder="certificate.pdf" onChange={(v) => update("attachmentFileName", v)} /></div>{action === "renew" && <div><label className="text-sm font-medium">Renewal Reason</label><Textarea value={form.renewalReason} onChange={(e) => update("renewalReason", e.target.value)} /></div>}<div className="flex gap-2"><Button onClick={submit}>{action === "renew" ? "Activate Renewal" : "Save Certificate"}</Button><Button variant="outline" onClick={() => onDone(certificate?.id)}>Cancel</Button></div></div>;
}

function MissingPanel({ rows, types, assets }: { rows: MaintenanceCertificateRequirement[]; types: MaintenanceCertificateType[]; assets: MaintenanceAsset[] }) {
  return <Card><CardHeader><CardTitle>Missing Certificates</CardTitle></CardHeader><CardContent>{rows.length === 0 ? <Empty text="No mandatory certificate requirements are currently missing." /> : <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border p-3 text-sm"><div className="font-semibold">{row.requirementName}</div><div className="text-muted-foreground">{types.find((item) => item.id === row.certificateTypeId)?.name} · {row.subjectType.replaceAll("_", " ")}{row.subjectId ? ` · ${assets.find((item) => item.id === row.subjectId)?.assetName || row.subjectId}` : ""}</div><Badge className="mt-2 bg-red-100 text-red-800">Missing</Badge></div>)}</div>}</CardContent></Card>;
}

function TypesPanel({ types, certificates, onEdit, onToggle }: { types: MaintenanceCertificateType[]; certificates: MaintenanceCertificate[]; onEdit: (t: MaintenanceCertificateType) => void; onToggle: (t: MaintenanceCertificateType) => void }) {
  return <Card><CardHeader><CardTitle>Certificate Types</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{types.map((type) => <div key={type.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{type.name}</div><div className="text-xs text-muted-foreground">{type.code} · {type.category.replaceAll("_", " ")}</div></div><Badge className={type.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>{type.active ? "Active" : "Inactive"}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><Stat label="Records" value={certificates.filter((item) => item.certificateTypeId === type.id).length} /><Stat label="Warning" value={`${type.warningDays}d`} /><Stat label="Critical" value={`${type.criticalWarningDays}d`} /></div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(type)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onToggle(type)}>{type.active ? "Deactivate" : "Activate"}</Button></div></div>)}</CardContent></Card>;
}

function RequirementsPanel({ rows, types, assets, onEdit, onArchive }: { rows: MaintenanceCertificateRequirement[]; types: MaintenanceCertificateType[]; assets: MaintenanceAsset[]; onEdit: (r: MaintenanceCertificateRequirement) => void; onArchive: (r: MaintenanceCertificateRequirement) => void }) {
  return <Card><CardHeader><CardTitle>Certificate Requirements</CardTitle></CardHeader><CardContent>{rows.length === 0 ? <Empty text="No certificate requirements configured." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Requirement</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Warning</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.requirementName}</td><td className="px-3 py-3">{types.find((item) => item.id === row.certificateTypeId)?.name}</td><td className="px-3 py-3">{row.subjectType.replaceAll("_", " ")} {row.subjectId ? `· ${assets.find((item) => item.id === row.subjectId)?.assetName || row.subjectId}` : ""}</td><td className="px-3 py-3">{row.warningDays} days</td><td className="px-3 py-3"><Badge>{row.active ? "Active" : "Inactive"}</Badge></td><td className="px-3 py-3"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onArchive(row)}>Archive</Button></div></td></tr>)}</tbody></table>}</CardContent></Card>;
}

function FilterBar({ search, setSearch, statusFilter, setStatusFilter, typeFilter, setTypeFilter, types }: { search: string; setSearch: (v: string) => void; statusFilter: string; setStatusFilter: (v: string) => void; typeFilter: string; setTypeFilter: (v: string) => void; types: MaintenanceCertificateType[] }) {
  return <div className="grid gap-3 md:grid-cols-[1fr_190px_240px_auto]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search certificate number, title, issuer, asset or Work Order" /></div><select className="h-10 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{["VALID", "EXPIRING_SOON", "EXPIRED", "REVOKED", "MISSING", "NOT_APPLICABLE"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select><select className="h-10 rounded-md border bg-background px-3 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">All certificate types</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select><Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); }}>Clear</Button></div>;
}

function CertificateDialog({ open, certificate, action, onOpenChange }: { open: boolean; certificate?: MaintenanceCertificate; action: "new" | "edit" | "renew"; onOpenChange: (v: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{action === "new" ? "Create Certificate" : action === "renew" ? "Renew Certificate" : "Edit Certificate"}</DialogTitle><DialogDescription>Certificate and version details are retained for audit and renewal history.</DialogDescription></DialogHeader><CertificateForm certificate={certificate} action={action} onDone={() => onOpenChange(false)} /></DialogContent></Dialog>;
}

function TypeDialog({ open, type, onOpenChange }: { open: boolean; type?: MaintenanceCertificateType; onOpenChange: (v: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ code: type?.code || "", name: type?.name || "", category: type?.category || "SAFETY" as MaintenanceCertificateTypeCategory, warningDays: String(type?.warningDays ?? 90), criticalWarningDays: String(type?.criticalWarningDays ?? 30) });
  const [message, setMessage] = useState("");
  function submit() { try { type ? care.updateMaintenanceCertificateType(type.id, { ...form, warningDays: Number(form.warningDays), criticalWarningDays: Number(form.criticalWarningDays) }) : care.createMaintenanceCertificateType({ ...form, warningDays: Number(form.warningDays), criticalWarningDays: Number(form.criticalWarningDays) }); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save type."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{type ? "Edit Certificate Type" : "Create Certificate Type"}</DialogTitle></DialogHeader>{message && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{message}</div>}<div className="grid gap-3"><Field label="Code" value={form.code} onChange={(v) => setForm((s) => ({ ...s, code: v }))} /><Field label="Name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} /><Select label="Category" value={form.category} onChange={(v) => setForm((s) => ({ ...s, category: v as MaintenanceCertificateTypeCategory }))} options={CERTIFICATE_TYPE_CATEGORIES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} /><Field label="Warning Days" type="number" value={form.warningDays} onChange={(v) => setForm((s) => ({ ...s, warningDays: v }))} /><Field label="Critical Warning Days" type="number" value={form.criticalWarningDays} onChange={(v) => setForm((s) => ({ ...s, criticalWarningDays: v }))} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Type</Button></DialogFooter></DialogContent></Dialog>;
}

function RequirementDialog({ open, requirement, onOpenChange }: { open: boolean; requirement?: MaintenanceCertificateRequirement; onOpenChange: (v: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ requirementName: requirement?.requirementName || "", certificateTypeId: requirement?.certificateTypeId || care.maintenanceCertificateTypes[0]?.id || "", subjectType: requirement?.subjectType || "ASSET" as MaintenanceCertificateSubjectType, subjectId: requirement?.subjectId || "", assetCategoryId: requirement?.assetCategoryId || "", warningDays: String(requirement?.warningDays ?? 90) });
  const [message, setMessage] = useState("");
  function submit() { try { const input = { ...form, subjectId: form.subjectId || undefined, assetCategoryId: form.assetCategoryId || undefined, warningDays: Number(form.warningDays) }; requirement ? care.updateMaintenanceCertificateRequirement(requirement.id, input) : care.createMaintenanceCertificateRequirement(input); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save requirement."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{requirement ? "Edit Requirement" : "Create Requirement"}</DialogTitle></DialogHeader>{message && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{message}</div>}<div className="grid gap-3"><Field label="Requirement Name" value={form.requirementName} onChange={(v) => setForm((s) => ({ ...s, requirementName: v }))} /><Select label="Certificate Type" value={form.certificateTypeId} onChange={(v) => setForm((s) => ({ ...s, certificateTypeId: v }))} options={care.maintenanceCertificateTypes.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Subject Type" value={form.subjectType} onChange={(v) => setForm((s) => ({ ...s, subjectType: v as MaintenanceCertificateSubjectType }))} options={CERTIFICATE_SUBJECT_TYPES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} /><SubjectField subjectType={form.subjectType} value={form.subjectId} onChange={(v) => setForm((s) => ({ ...s, subjectId: v }))} /><Select label="Asset Category Requirement" value={form.assetCategoryId} onChange={(v) => setForm((s) => ({ ...s, assetCategoryId: v }))} options={[{ value: "", label: "None" }, ...care.maintenanceAssetCategories.map((item) => ({ value: item.id, label: item.name }))]} /><Field label="Warning Days" type="number" value={form.warningDays} onChange={(v) => setForm((s) => ({ ...s, warningDays: v }))} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Requirement</Button></DialogFooter></DialogContent></Dialog>;
}

function AttachmentDialog({ open, certificate, onOpenChange }: { open: boolean; certificate?: MaintenanceCertificate; onOpenChange: (v: boolean) => void }) {
  const care = useCare();
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  function submit() { try { if (!certificate?.currentVersionId) throw new Error("Current version not available."); care.addMaintenanceCertificateAttachment(certificate.id, certificate.currentVersionId, { fileName, documentType: "CERTIFICATE_FILE", primaryAttachment: true }); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add attachment."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Certificate Attachment</DialogTitle><DialogDescription>Attachment metadata is stored against the selected certificate version.</DialogDescription></DialogHeader>{message && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{message}</div>}<Field label="File Name" placeholder="certificate.pdf" value={fileName} onChange={setFileName} /><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Add Attachment</Button></DialogFooter></DialogContent></Dialog>;
}

function LinkDialog({ open, certificate, onOpenChange }: { open: boolean; certificate?: MaintenanceCertificate; onOpenChange: (v: boolean) => void }) {
  const care = useCare();
  const [kind, setKind] = useState("asset");
  const [targetId, setTargetId] = useState("");
  const [message, setMessage] = useState("");
  const options = kind === "asset" ? care.maintenanceAssets.map((item) => ({ value: item.id, label: item.assetName })) : kind === "workOrder" ? care.maintenanceWorkOrders.map((item) => ({ value: item.id, label: item.workOrderNumber })) : kind === "contractor" ? care.maintenanceContractors.filter((item) => !item.archived).map((item) => ({ value: item.id, label: `${item.contractorReference} - ${contractorDisplayName(item)}` })) : care.safetyInspections.map((item) => ({ value: item.id, label: item.inspectionNumber }));
  function submit() { try { if (!certificate) throw new Error("Certificate not selected."); if (!targetId) throw new Error("Select a target."); if (kind === "asset") care.linkMaintenanceCertificateAsset(certificate.id, targetId, "APPLIES_TO"); else if (kind === "workOrder") care.linkMaintenanceCertificateWorkOrder(certificate.id, targetId, "RELATED_TO"); else if (kind === "contractor") care.linkMaintenanceCertificateContractor(certificate.id, targetId, "HELD_BY"); else care.linkMaintenanceCertificateSafetyInspection(certificate.id, targetId, "SUPPORTS_COMPLIANCE"); onOpenChange(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to link certificate."); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Link Certificate</DialogTitle></DialogHeader>{message && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{message}</div>}<Select label="Link Type" value={kind} onChange={(v) => { setKind(v); setTargetId(""); }} options={[{ value: "asset", label: "Asset" }, { value: "workOrder", label: "Work Order" }, { value: "inspection", label: "Safety Inspection" }, { value: "contractor", label: "Contractor" }]} /><Select label="Target" value={targetId} onChange={setTargetId} options={[{ value: "", label: "Select target" }, ...options]} /><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Link</Button></DialogFooter></DialogContent></Dialog>;
}

function SubjectField({ subjectType, value, onChange }: { subjectType: MaintenanceCertificateSubjectType; value: string; onChange: (v: string) => void }) {
  const care = useCare();
  const options = subjectType === "ASSET" ? care.maintenanceAssets.map((item) => ({ value: item.id, label: item.assetName })) : subjectType === "WORK_ORDER" ? care.maintenanceWorkOrders.map((item) => ({ value: item.id, label: item.workOrderNumber })) : subjectType === "SAFETY_INSPECTION" ? care.safetyInspections.map((item) => ({ value: item.id, label: item.inspectionNumber })) : [{ value: care.activeFacilityId || "facility:ballymore-haven", label: "Current Home" }];
  return <Select label="Primary Subject" value={value} onChange={onChange} options={[{ value: "", label: subjectType === "HOME" ? "Current Home" : "Select subject" }, ...options]} />;
}

function CertificateRow({ row }: { row: DecoratedCertificate }) {
  return <div className="rounded-lg border p-3 text-sm"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{row.certificate.title}</div><div className="text-xs text-muted-foreground">{row.type?.name} · {row.certificate.certificateNumber}</div></div><Badge className={statusClass(row.status)}>{row.status.replaceAll("_", " ")}</Badge></div><div className="mt-2 text-muted-foreground">Expires {row.version?.expiryDate || "No expiry"} · {row.certificate.issuingOrganisation}</div></div>;
}

function decorateCertificate(certificate: MaintenanceCertificate, versions: MaintenanceCertificateVersion[], types: MaintenanceCertificateType[], attachments: MaintenanceCertificateAttachment[]) {
  const version = versions.find((item) => item.id === certificate.currentVersionId);
  const type = types.find((item) => item.id === certificate.certificateTypeId);
  const currentAttachments = attachments.filter((item) => item.certificateId === certificate.id && item.certificateVersionId === certificate.currentVersionId && item.active && !item.removedAt);
  const status = certificateComplianceStatus({ certificate, version, type, attachments: currentAttachments });
  return { certificate, version, type, attachments: currentAttachments, status };
}

function subjectLabel(certificate: MaintenanceCertificate, assets: any[], workOrders: any[], inspections: any[]) {
  if (certificate.subjectType === "ASSET") return assets.find((item) => item.id === certificate.primarySubjectId)?.assetName || "Asset";
  if (certificate.subjectType === "WORK_ORDER") return workOrders.find((item) => item.id === certificate.primarySubjectId)?.workOrderNumber || "Work Order";
  if (certificate.subjectType === "SAFETY_INSPECTION") return inspections.find((item) => item.id === certificate.primarySubjectId)?.inspectionNumber || "Safety Inspection";
  if (certificate.subjectType === "HOME") return "Home-level";
  return certificate.primarySubjectId || certificate.subjectType.replaceAll("_", " ");
}

function Metric({ title, value, icon: Icon, tone, onClick }: { title: string; value: ReactNode; icon: any; tone: string; onClick?: () => void }) {
  const body = <Card className={cn("transition", onClick && "cursor-pointer hover:border-primary")}><CardContent className="flex items-center gap-3 p-4"><div className={cn("rounded-full p-2", toneClass(tone))}><Icon className="h-5 w-5" /></div><div><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-semibold">{value}</div></div></CardContent></Card>;
  return onClick ? <button className="text-left" onClick={onClick}>{body}</button> : body;
}

function Stat({ label, value, tone = "slate" }: { label: string; value: ReactNode; tone?: string }) {
  return <div className="rounded-md border bg-background p-3"><div className="text-xs text-muted-foreground">{label}</div><div className={cn("font-semibold", tone === "red" && "text-red-700", tone === "amber" && "text-amber-700")}>{value}</div></div>;
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-1 text-sm"><span className="font-medium">{label}</span><Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="space-y-1 text-sm"><span className="font-medium">{label}</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
}

function Info({ title, value }: { title: string; value?: ReactNode }) {
  return <div className="rounded-md border p-3 text-sm"><div className="text-xs text-muted-foreground">{title}</div><div className="font-medium">{value || "-"}</div></div>;
}

function InfoList({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <div><div className="mb-2 font-semibold">{title}</div>{rows.length === 0 ? <div className="rounded-md border p-3 text-sm text-muted-foreground">{empty}</div> : <div className="space-y-2">{rows.map((row, index) => <div key={`${row}-${index}`} className="rounded-md border p-2 text-sm">{row}</div>)}</div>}</div>;
}

function Pagination({ page, pageCount, total, setPage }: { page: number; pageCount: number; total: number; setPage: (v: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>{total} records · Page {page} of {pageCount}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function statusClass(status: string) {
  if (["VALID", "ACTIVE"].includes(status)) return "bg-green-100 text-green-800";
  if (["EXPIRING_SOON", "DRAFT"].includes(status)) return "bg-amber-100 text-amber-800";
  if (["EXPIRED", "REVOKED", "MISSING"].includes(status)) return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-800";
}

function toneClass(tone: string) {
  if (tone === "green") return "bg-green-100 text-green-700";
  if (tone === "amber") return "bg-amber-100 text-amber-700";
  if (tone === "red") return "bg-red-100 text-red-700";
  if (tone === "blue") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

function searchable(values: unknown[], query: string) {
  if (!query.trim()) return true;
  const needle = query.toLowerCase();
  return values.some((value) => String(value || "").toLowerCase().includes(needle));
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IE", { dateStyle: "short", timeStyle: "short" });
}
