import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, FileText, Plus, ShieldCheck, Wrench } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type {
  MaintenanceAsset,
  PlannedMaintenanceFrequencyType,
  SafetyCategory,
  SafetyCertificate,
  SafetyChecklistResponseType,
  SafetyEvidenceType,
  SafetyInspection,
  SafetyInspectionOccurrence,
  SafetyInspectionResponse,
  SafetyInspectionSchedule,
  SafetyInspectionTemplate,
  SafetyInspectionTemplateEvidenceRequirement,
  SafetyInspectionTemplateItem,
  SafetySeverity,
} from "@/lib/care/types";
import {
  SAFETY_CATEGORY_CODES,
  SAFETY_EVIDENCE_TYPES,
  SAFETY_RESPONSE_TYPES,
  evaluateSafetyInspection,
  safetyDashboardMetrics,
  safetyPresentationStatus,
  safetyTimeline,
} from "@/domain/maintenance/safetyCompliance";
import { frequencyLabel } from "@/domain/maintenance/plannedMaintenance";
import { workOrderPriorityLabel } from "@/domain/maintenance/workOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance/safety-compliance")({
  head: () => ({ meta: [{ title: "Safety & Compliance - NuCare" }] }),
  component: SafetyComplianceRoute,
});

type Tab = "overview" | "inspections" | "calendar" | "schedules" | "templates" | "upcoming" | "dueSoon" | "overdue" | "failed" | "certificates" | "categories";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "inspections", label: "Inspections" },
  { value: "calendar", label: "Inspection Calendar" },
  { value: "schedules", label: "Schedules" },
  { value: "templates", label: "Templates" },
  { value: "upcoming", label: "Upcoming" },
  { value: "dueSoon", label: "Due Soon" },
  { value: "overdue", label: "Overdue" },
  { value: "failed", label: "Failed" },
  { value: "certificates", label: "Certificates" },
  { value: "categories", label: "Categories" },
];

function SafetyComplianceRoute() {
  const care = useCare();
  const [tab, setTab] = useState<Tab>("overview");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>();
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; template?: SafetyInspectionTemplate }>({ open: false });
  const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; schedule?: SafetyInspectionSchedule }>({ open: false });
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category?: SafetyCategory }>({ open: false });
  const [certificateDialog, setCertificateDialog] = useState<{ open: boolean; certificate?: SafetyCertificate }>({ open: false });
  const [evidenceDialog, setEvidenceDialog] = useState<{ open: boolean; inspection?: SafetyInspection }>({ open: false });
  const [observationDialog, setObservationDialog] = useState<{ open: boolean; inspection?: SafetyInspection; response?: SafetyInspectionResponse }>({ open: false });
  const [message, setMessage] = useState("");

  const categories = care.safetyCategories || [];
  const templates = care.safetyInspectionTemplates || [];
  const schedules = care.safetyInspectionSchedules || [];
  const occurrences = care.safetyInspectionOccurrences || [];
  const inspections = care.safetyInspections || [];
  const selectedInspection = inspections.find((inspection) => inspection.id === selectedInspectionId);
  const metrics = useMemo(() => safetyDashboardMetrics({
    categories,
    templates,
    schedules,
    occurrences,
    inspections,
    certificates: care.safetyCertificates,
    workOrders: care.maintenanceWorkOrders,
  }), [categories, templates, schedules, occurrences, inspections, care.safetyCertificates, care.maintenanceWorkOrders]);

  const filteredInspections = inspections
    .filter((inspection) => !categoryFilter || inspection.categoryId === categoryFilter)
    .filter((inspection) => searchable([inspection.inspectionNumber, inspection.summary, categoryName(inspection.categoryId, categories), assetName(inspection.assetId, care.maintenanceAssets)], search))
    .sort((a, b) => (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt));

  function run(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete action.");
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Safety & Compliance</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Safety & Compliance</h1>
          <p className="text-sm text-muted-foreground">Unified inspections, evidence, certificates, verification and corrective Work Orders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCategoryDialog({ open: true })}><Plus className="mr-2 h-4 w-4" />Category</Button>
          <Button variant="outline" onClick={() => setTemplateDialog({ open: true })}><Plus className="mr-2 h-4 w-4" />Template</Button>
          <Button onClick={() => setScheduleDialog({ open: true })}><Plus className="mr-2 h-4 w-4" />Schedule</Button>
        </div>
      </div>

      {message && <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{message}</div>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => <Button key={item.value} size="sm" variant={tab === item.value ? "default" : "outline"} className="shrink-0" onClick={() => setTab(item.value)}>{item.label}</Button>)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric title="Active Schedules" value={metrics.activeSchedules} icon={CalendarDays} tone="blue" onClick={() => setTab("schedules")} />
        <Metric title="Due Soon" value={metrics.dueSoon} icon={ClipboardCheck} tone="amber" onClick={() => setTab("dueSoon")} />
        <Metric title="Overdue" value={metrics.overdue} icon={AlertTriangle} tone="red" onClick={() => setTab("overdue")} />
        <Metric title="Failed" value={metrics.failed} icon={AlertTriangle} tone="red" onClick={() => setTab("failed")} />
        <Metric title="Awaiting Verification" value={metrics.awaitingVerification} icon={ShieldCheck} tone="purple" />
        <Metric title="Active Templates" value={metrics.activeTemplates} icon={FileText} tone="green" onClick={() => setTab("templates")} />
        <Metric title="Certificates Expiring" value={metrics.certificatesExpiring} icon={FileText} tone="amber" onClick={() => setTab("certificates")} />
        <Metric title="Corrective Work Orders" value={metrics.currentCorrectiveWorkOrders} icon={Wrench} tone="slate" />
        <Metric title="Safety Categories" value={metrics.totalCategories} icon={ShieldCheck} tone="blue" onClick={() => setTab("categories")} />
        <Metric title="Upcoming" value={metrics.upcoming} icon={CalendarDays} tone="green" onClick={() => setTab("upcoming")} />
      </div>

      {(tab === "overview" || tab === "inspections" || tab === "failed") && (
        <FilterBar categories={categories} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} search={search} setSearch={setSearch} />
      )}

      {tab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <CategoryDashboard rows={metrics.byCategory} onCategory={(id) => { setCategoryFilter(id); setTab("inspections"); }} />
          <QueuePanel title="Attention Queue" occurrences={occurrences.filter((item) => ["OVERDUE", "DUE_TODAY", "DUE_SOON"].includes(safetyPresentationStatus(item)))} categories={categories} assets={care.maintenanceAssets} onStart={(id) => run(() => { const inspection = care.startSafetyInspection(id); setSelectedInspectionId(inspection.id); setTab("inspections"); }, "Inspection started.")} />
        </div>
      )}

      {tab === "inspections" && <InspectionsPanel inspections={filteredInspections} categories={categories} assets={care.maintenanceAssets} selected={selectedInspection} onOpen={setSelectedInspectionId} onEvidence={(inspection) => setEvidenceDialog({ open: true, inspection })} onObservation={(inspection) => setObservationDialog({ open: true, inspection })} onComplete={(id) => run(() => care.completeSafetyInspection(id, { declarationAccepted: true, summary: "Inspection completed from Safety & Compliance workspace." }), "Inspection completed.")} onVerify={(id) => run(() => care.verifySafetyInspection(id, "Reviewed in Safety & Compliance workspace."), "Inspection verified.")} onReject={(id) => run(() => care.rejectSafetyInspection(id, { reasonCode: "OTHER", details: "Returned for further detail." }), "Inspection rejected.")} onCorrective={(id) => run(() => care.createSafetyCorrectiveWorkOrder(id), "Corrective Work Order created or opened.")} />}
      {tab === "calendar" && <CalendarPanel occurrences={occurrences} categories={categories} assets={care.maintenanceAssets} onStart={(id) => run(() => { const inspection = care.startSafetyInspection(id); setSelectedInspectionId(inspection.id); setTab("inspections"); }, "Inspection started.")} />}
      {tab === "schedules" && <SchedulesPanel schedules={schedules} categories={categories} templates={templates} assets={care.maintenanceAssets} onEdit={(schedule) => setScheduleDialog({ open: true, schedule })} onGenerate={(id) => run(() => care.generateSafetyOccurrence(id), "Next occurrence generated.")} onPause={(id) => run(() => care.pauseSafetySchedule(id, "Paused from Safety & Compliance workspace"), "Schedule paused.")} onResume={(id) => run(() => care.resumeSafetySchedule(id), "Schedule resumed.")} />}
      {tab === "templates" && <TemplatesPanel templates={templates} categories={categories} items={care.safetyInspectionTemplateItems} evidence={care.safetyInspectionTemplateEvidenceRequirements} onEdit={(template) => setTemplateDialog({ open: true, template })} onDuplicate={(id) => run(() => care.duplicateSafetyTemplate(id), "Template duplicated.")} onArchive={(id) => run(() => care.archiveSafetyTemplate(id, "Archived from Safety & Compliance workspace"), "Template archived.")} />}
      {tab === "upcoming" && <QueuePanel title="Upcoming Inspections" occurrences={occurrences.filter((item) => safetyPresentationStatus(item) === "SCHEDULED")} categories={categories} assets={care.maintenanceAssets} onStart={(id) => run(() => { const inspection = care.startSafetyInspection(id); setSelectedInspectionId(inspection.id); setTab("inspections"); }, "Inspection started.")} />}
      {tab === "dueSoon" && <QueuePanel title="Due Soon Inspections" occurrences={occurrences.filter((item) => ["DUE_SOON", "DUE_TODAY"].includes(safetyPresentationStatus(item)))} categories={categories} assets={care.maintenanceAssets} onStart={(id) => run(() => { const inspection = care.startSafetyInspection(id); setSelectedInspectionId(inspection.id); setTab("inspections"); }, "Inspection started.")} />}
      {tab === "overdue" && <QueuePanel title="Overdue Inspections" occurrences={occurrences.filter((item) => safetyPresentationStatus(item) === "OVERDUE")} categories={categories} assets={care.maintenanceAssets} onStart={(id) => run(() => { const inspection = care.startSafetyInspection(id); setSelectedInspectionId(inspection.id); setTab("inspections"); }, "Inspection started.")} />}
      {tab === "failed" && <InspectionsPanel inspections={filteredInspections.filter((item) => item.overallResult === "FAIL" || item.status === "FAILED")} categories={categories} assets={care.maintenanceAssets} selected={selectedInspection} onOpen={setSelectedInspectionId} onEvidence={(inspection) => setEvidenceDialog({ open: true, inspection })} onObservation={(inspection) => setObservationDialog({ open: true, inspection })} onComplete={() => {}} onVerify={(id) => run(() => care.verifySafetyInspection(id, "Failed inspection verified without changing historical result."), "Verification recorded.")} onReject={(id) => run(() => care.rejectSafetyInspection(id, { reasonCode: "FAILED_ITEM_NOT_ACTIONED", details: "Failed item requires further action." }), "Inspection rejected.")} onCorrective={(id) => run(() => care.createSafetyCorrectiveWorkOrder(id), "Corrective Work Order created or opened.")} />}
      {tab === "certificates" && <CertificatesPanel certificates={care.safetyCertificates} categories={categories} assets={care.maintenanceAssets} onCreate={() => setCertificateDialog({ open: true })} onEdit={(certificate) => setCertificateDialog({ open: true, certificate })} onRevoke={(id) => run(() => care.revokeSafetyCertificate(id, "Revoked from Safety & Compliance workspace"), "Certificate revoked.")} />}
      {tab === "categories" && <CategoriesPanel categories={categories} templates={templates} schedules={schedules} inspections={inspections} onEdit={(category) => setCategoryDialog({ open: true, category })} onToggle={(category) => run(() => category.active ? care.deactivateSafetyCategory(category.id) : care.activateSafetyCategory(category.id), category.active ? "Category deactivated." : "Category activated.")} />}

      <TemplateDialog open={templateDialog.open} template={templateDialog.template} categories={categories} onOpenChange={(open) => setTemplateDialog({ open })} />
      <ScheduleDialog open={scheduleDialog.open} schedule={scheduleDialog.schedule} categories={categories} templates={templates} assets={care.maintenanceAssets} onOpenChange={(open) => setScheduleDialog({ open })} />
      <CategoryDialog open={categoryDialog.open} category={categoryDialog.category} onOpenChange={(open) => setCategoryDialog({ open })} />
      <CertificateDialog open={certificateDialog.open} certificate={certificateDialog.certificate} categories={categories} inspections={inspections} assets={care.maintenanceAssets} onOpenChange={(open) => setCertificateDialog({ open })} />
      <EvidenceDialog open={evidenceDialog.open} inspection={evidenceDialog.inspection} onOpenChange={(open) => setEvidenceDialog({ open })} />
      <ObservationDialog open={observationDialog.open} inspection={observationDialog.inspection} response={observationDialog.response} onOpenChange={(open) => setObservationDialog({ open })} />
    </div>
  );
}

function FilterBar({ categories, categoryFilter, setCategoryFilter, search, setSearch }: { categories: SafetyCategory[]; categoryFilter: string; setCategoryFilter: (v: string) => void; search: string; setSearch: (v: string) => void }) {
  return <Card><CardContent className="grid gap-3 py-4 md:grid-cols-[1fr_220px_auto]"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inspections, assets or summaries" /><select className="h-10 rounded-md border bg-background px-3 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Button variant="outline" onClick={() => { setSearch(""); setCategoryFilter(""); }}>Clear Filters</Button></CardContent></Card>;
}

function CategoryDashboard({ rows, onCategory }: { rows: ReturnType<typeof safetyDashboardMetrics>["byCategory"]; onCategory: (id: string) => void }) {
  return <Card><CardHeader><CardTitle>Category Dashboards</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{rows.map(({ category, inspections, failed, overdue }) => <button key={category.id} className="rounded-lg border p-4 text-left transition hover:border-primary" onClick={() => onCategory(category.id)}><div className="flex items-center justify-between"><div><div className="font-semibold">{category.name}</div><div className="text-xs text-muted-foreground">{category.description}</div></div><span className="h-4 w-4 rounded-full" style={{ background: category.colour }} /></div><div className="mt-4 grid grid-cols-3 gap-2 text-sm"><Stat label="Inspections" value={inspections} /><Stat label="Failed" value={failed} tone={failed ? "red" : "green"} /><Stat label="Overdue" value={overdue} tone={overdue ? "red" : "green"} /></div></button>)}</CardContent></Card>;
}

function QueuePanel({ title, occurrences, categories, assets, onStart }: { title: string; occurrences: SafetyInspectionOccurrence[]; categories: SafetyCategory[]; assets: MaintenanceAsset[]; onStart: (id: string) => void }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{occurrences.length === 0 ? <Empty text={title.includes("Overdue") ? "There are no overdue Safety & Compliance inspections." : "No Safety & Compliance inspections match this queue."} /> : <div className="space-y-2">{occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((occurrence) => <div key={occurrence.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold">{categoryName(occurrence.categoryId, categories)}</div><div className="text-muted-foreground">{assetName(occurrence.assetId, assets) || occurrence.locationId || "Home-level inspection"}</div></div><Badge className={statusClass(safetyPresentationStatus(occurrence))}>{safetyPresentationStatus(occurrence).replaceAll("_", " ")}</Badge></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-muted-foreground">Due {occurrence.dueDate} - {workOrderPriorityLabel(occurrence.priority)}</span><Button size="sm" disabled={Boolean(occurrence.inspectionId)} onClick={() => onStart(occurrence.id)}>{occurrence.inspectionId ? "Started" : "Start Inspection"}</Button></div></div>)}</div>}</CardContent></Card>;
}

function InspectionsPanel(props: { inspections: SafetyInspection[]; categories: SafetyCategory[]; assets: MaintenanceAsset[]; selected?: SafetyInspection; onOpen: (id: string) => void; onEvidence: (inspection: SafetyInspection) => void; onObservation: (inspection: SafetyInspection) => void; onComplete: (id: string) => void; onVerify: (id: string) => void; onReject: (id: string) => void; onCorrective: (id: string) => void }) {
  const care = useCare();
  return <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]"><Card><CardHeader><CardTitle>Inspection History</CardTitle></CardHeader><CardContent>{props.inspections.length === 0 ? <Empty text="No inspections match the selected filters." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Inspection</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Verification</th><th className="px-3 py-2">Action</th></tr></thead><tbody>{props.inspections.map((inspection) => <tr key={inspection.id} className="border-b last:border-0"><td className="px-3 py-3"><button className="font-medium text-blue-700 hover:underline" onClick={() => props.onOpen(inspection.id)}>{inspection.inspectionNumber}</button><div className="text-xs text-muted-foreground">{inspection.inspectionDate}</div></td><td className="px-3 py-3">{categoryName(inspection.categoryId, props.categories)}</td><td className="px-3 py-3">{assetName(inspection.assetId, props.assets) || inspection.locationId || "Home-level"}</td><td className="px-3 py-3"><Badge className={resultClass(inspection.overallResult)}>{inspection.overallResult.replaceAll("_", " ")}</Badge></td><td className="px-3 py-3">{inspection.verificationStatus.replaceAll("_", " ")}</td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => props.onOpen(inspection.id)}>Open</Button></td></tr>)}</tbody></table>}</CardContent></Card>{props.selected ? <InspectionDetail inspection={props.selected} categories={props.categories} assets={props.assets} responses={care.safetyInspectionResponses.filter((item) => item.inspectionId === props.selected!.id)} observations={care.safetyInspectionObservations.filter((item) => item.inspectionId === props.selected!.id)} evidence={care.safetyInspectionEvidence.filter((item) => item.inspectionId === props.selected!.id)} certificates={care.safetyCertificates.filter((item) => item.inspectionId === props.selected!.id)} requirements={care.safetyInspectionTemplateEvidenceRequirements.filter((item) => item.templateId === props.selected!.templateId)} onEvidence={() => props.onEvidence(props.selected!)} onObservation={() => props.onObservation(props.selected!)} onComplete={() => props.onComplete(props.selected!.id)} onVerify={() => props.onVerify(props.selected!.id)} onReject={() => props.onReject(props.selected!.id)} onCorrective={() => props.onCorrective(props.selected!.id)} /> : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select an inspection to view checklist responses, evidence, observations and timeline.</CardContent></Card>}</div>;
}

function InspectionDetail({ inspection, categories, assets, responses, observations, evidence, certificates, requirements, onEvidence, onObservation, onComplete, onVerify, onReject, onCorrective }: { inspection: SafetyInspection; categories: SafetyCategory[]; assets: MaintenanceAsset[]; responses: SafetyInspectionResponse[]; observations: any[]; evidence: any[]; certificates: SafetyCertificate[]; requirements: SafetyInspectionTemplateEvidenceRequirement[]; onEvidence: () => void; onObservation: () => void; onComplete: () => void; onVerify: () => void; onReject: () => void; onCorrective: () => void }) {
  const care = useCare();
  const evaluation = evaluateSafetyInspection({ inspection, responses, observations, evidence, requirements, certificate: certificates[0] });
  const sections = groupBy(responses.sort((a, b) => a.displayOrder - b.displayOrder), (item) => item.sectionName);
  const timeline = safetyTimeline({ inspection, observations, evidence, certificates });
  return <Card><CardHeader><CardTitle>{inspection.inspectionNumber}</CardTitle><p className="text-sm text-muted-foreground">{categoryName(inspection.categoryId, categories)} - {assetName(inspection.assetId, assets) || "Home-level"} - {inspection.status.replaceAll("_", " ")}</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 sm:grid-cols-3"><Stat label="Result" value={inspection.overallResult.replaceAll("_", " ")} /><Stat label="Verification" value={inspection.verificationStatus.replaceAll("_", " ")} /><Stat label="Evidence" value={evidence.filter((item) => item.active && !item.deletedAt).length} /></div>{evaluation.blockers.length > 0 && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><div className="font-semibold">Completion checks</div>{evaluation.blockers.slice(0, 4).map((item) => <div key={item}>{item}</div>)}</div>}<div className="space-y-3">{Object.entries(sections).map(([section, rows]) => <div key={section} className="rounded-lg border"><div className="border-b bg-muted/40 px-3 py-2 font-semibold">{section}</div>{rows.map((response) => <div key={response.id} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[1fr_130px_140px]"><div><div className="font-medium">{response.questionLabelSnapshot}{response.mandatory && <span className="text-destructive"> *</span>}</div>{response.observation && <div className="text-xs text-muted-foreground">{response.observation}</div>}</div><select className="h-9 rounded-md border bg-background px-2" value={response.result} disabled={["COMPLETED", "FAILED"].includes(inspection.status)} onChange={(e) => care.updateSafetyInspectionResponse(response.id, { result: e.target.value as SafetyInspectionResponse["result"], responseValue: e.target.value })}>{["UNANSWERED", "PASS", "FAIL", "NOT_APPLICABLE", "INFORMATION_ONLY"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select><Button size="sm" variant="outline" onClick={() => care.addSafetyObservation(inspection.id, { responseId: response.id, description: response.observation || response.questionLabelSnapshot, severity: response.failureSeverity, correctiveActionRequired: response.correctiveActionRequired })}>Observation</Button></div>)}</div>)}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onEvidence}>Add Evidence</Button><Button variant="outline" onClick={onObservation}>Add Observation</Button><Button variant="outline" onClick={onCorrective}>Corrective Work Order</Button><Button disabled={["COMPLETED", "FAILED"].includes(inspection.status)} onClick={onComplete}>Complete</Button><Button variant="outline" disabled={inspection.verificationStatus !== "PENDING"} onClick={onVerify}>Verify</Button><Button variant="outline" disabled={inspection.verificationStatus !== "PENDING"} onClick={onReject}>Reject</Button></div><InfoList title="Observations" rows={observations.map((item) => `${item.severity}: ${item.description}`)} empty="No observations recorded." /><InfoList title="Evidence" rows={evidence.filter((item) => item.active && !item.deletedAt).map((item) => `${item.evidenceType}: ${item.fileName}`)} empty="No evidence attached." /><InfoList title="Timeline" rows={timeline.map((item) => `${formatDateTime(item.at)} - ${item.summary}${item.reference ? ` - ${item.reference}` : ""}`)} empty="No timeline events." /></CardContent></Card>;
}

function CalendarPanel({ occurrences, categories, assets, onStart }: { occurrences: SafetyInspectionOccurrence[]; categories: SafetyCategory[]; assets: MaintenanceAsset[]; onStart: (id: string) => void }) {
  const days = groupBy(occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate)), (item) => item.dueDate);
  return <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>Inspection Calendar</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(days).slice(0, 30).map(([date, rows]) => <div key={date} className="rounded-lg border p-3"><div className="font-semibold">{date}</div><div className="mt-2 space-y-2">{rows.map((item) => <button key={item.id} className="w-full rounded-md border p-2 text-left text-sm hover:border-primary" onClick={() => !item.inspectionId && onStart(item.id)}><div>{categoryName(item.categoryId, categories)}</div><div className="text-xs text-muted-foreground">{assetName(item.assetId, assets) || item.locationId || "Home-level"} - {safetyPresentationStatus(item).replaceAll("_", " ")}</div></button>)}</div></div>)}</CardContent></Card><QueuePanel title="Agenda View" occurrences={occurrences.slice(0, 12)} categories={categories} assets={assets} onStart={onStart} /></div>;
}

function SchedulesPanel({ schedules, categories, templates, assets, onEdit, onGenerate, onPause, onResume }: { schedules: SafetyInspectionSchedule[]; categories: SafetyCategory[]; templates: SafetyInspectionTemplate[]; assets: MaintenanceAsset[]; onEdit: (s: SafetyInspectionSchedule) => void; onGenerate: (id: string) => void; onPause: (id: string) => void; onResume: (id: string) => void }) {
  return <Card><CardHeader><CardTitle>Inspection Schedules</CardTitle></CardHeader><CardContent>{schedules.length === 0 ? <Empty text="No Safety & Compliance inspections are scheduled for this Home. Create a schedule from an active inspection template." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Schedule</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Template</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Frequency</th><th className="px-3 py-2">Next Due</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{schedules.map((schedule) => <tr key={schedule.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{schedule.scheduleName}<div className="text-xs text-muted-foreground">{schedule.paused ? "Paused" : schedule.active ? "Active" : "Inactive"}</div></td><td className="px-3 py-3">{categoryName(schedule.categoryId, categories)}</td><td className="px-3 py-3">{templates.find((item) => item.id === schedule.templateId)?.name}</td><td className="px-3 py-3">{assetName(schedule.assetId, assets) || schedule.locationLabel || "Home-level"}</td><td className="px-3 py-3">{frequencyLabel(schedule.frequencyType, schedule.frequencyInterval)}</td><td className="px-3 py-3">{schedule.nextDueDate}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(schedule)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onGenerate(schedule.id)}>Generate</Button>{schedule.paused ? <Button size="sm" variant="outline" onClick={() => onResume(schedule.id)}>Resume</Button> : <Button size="sm" variant="outline" onClick={() => onPause(schedule.id)}>Pause</Button>}</div></td></tr>)}</tbody></table>}</CardContent></Card>;
}

function TemplatesPanel({ templates, categories, items, evidence, onEdit, onDuplicate, onArchive }: { templates: SafetyInspectionTemplate[]; categories: SafetyCategory[]; items: SafetyInspectionTemplateItem[]; evidence: SafetyInspectionTemplateEvidenceRequirement[]; onEdit: (t: SafetyInspectionTemplate) => void; onDuplicate: (id: string) => void; onArchive: (id: string) => void }) {
  return <Card><CardHeader><CardTitle>Inspection Templates</CardTitle></CardHeader><CardContent className="grid gap-3 lg:grid-cols-2">{templates.map((template) => <div key={template.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold">{template.name}</div><div className="text-sm text-muted-foreground">{categoryName(template.categoryId, categories)} - v{template.version} - {template.templateCode}</div></div><Badge className={template.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>{template.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{template.description}</p><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><Stat label="Items" value={items.filter((item) => item.templateId === template.id).length} /><Stat label="Evidence" value={evidence.filter((item) => item.templateId === template.id).length} /><Stat label="Duration" value={`${template.estimatedDurationMinutes}m`} /></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(template)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onDuplicate(template.id)}>Duplicate</Button><Button size="sm" variant="outline" onClick={() => onArchive(template.id)}>Archive</Button></div></div>)}</CardContent></Card>;
}

function CertificatesPanel({ certificates, categories, assets, onCreate, onEdit, onRevoke }: { certificates: SafetyCertificate[]; categories: SafetyCategory[]; assets: MaintenanceAsset[]; onCreate: () => void; onEdit: (c: SafetyCertificate) => void; onRevoke: (id: string) => void }) {
  return <Card><CardHeader className="gap-3 md:flex-row md:items-center md:justify-between"><CardTitle>Certificates</CardTitle><Button onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Add Certificate</Button></CardHeader><CardContent>{certificates.length === 0 ? <Empty text="No certificate is currently linked to this inspection." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Certificate</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{certificates.map((certificate) => <tr key={certificate.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{certificate.certificateType}<div className="text-xs text-muted-foreground">{certificate.certificateNumber} - {certificate.issuedBy}</div></td><td className="px-3 py-3">{categoryName(certificate.categoryId, categories)}</td><td className="px-3 py-3">{assetName(certificate.assetId, assets) || "Home-level"}</td><td className="px-3 py-3">{certificate.expiryDate}</td><td className="px-3 py-3"><Badge>{certificate.status.replaceAll("_", " ")}</Badge></td><td className="px-3 py-3"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(certificate)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onRevoke(certificate.id)}>Revoke</Button></div></td></tr>)}</tbody></table>}</CardContent></Card>;
}

function CategoriesPanel({ categories, templates, schedules, inspections, onEdit, onToggle }: { categories: SafetyCategory[]; templates: SafetyInspectionTemplate[]; schedules: SafetyInspectionSchedule[]; inspections: SafetyInspection[]; onEdit: (c: SafetyCategory) => void; onToggle: (c: SafetyCategory) => void }) {
  return <Card><CardHeader><CardTitle>Safety Categories</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{categories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => <div key={category.id} className="rounded-lg border p-4"><div className="flex items-center justify-between"><div className="font-semibold">{category.name}</div><span className="h-4 w-4 rounded-full" style={{ background: category.colour }} /></div><p className="mt-2 text-sm text-muted-foreground">{category.description}</p><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><Stat label="Templates" value={templates.filter((item) => item.categoryId === category.id).length} /><Stat label="Schedules" value={schedules.filter((item) => item.categoryId === category.id).length} /><Stat label="History" value={inspections.filter((item) => item.categoryId === category.id).length} /></div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(category)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onToggle(category)}>{category.active ? "Deactivate" : "Activate"}</Button></div></div>)}</CardContent></Card>;
}

function TemplateDialog({ open, template, categories, onOpenChange }: { open: boolean; template?: SafetyInspectionTemplate; categories: SafetyCategory[]; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState<Partial<SafetyInspectionTemplate>>(() => template || { name: "", categoryId: categories.find((item) => item.active)?.id || "", status: "DRAFT", active: false, defaultFrequencyType: "monthly", defaultFrequencyInterval: 1, estimatedDurationMinutes: 30, defaultPriority: "MEDIUM", verificationRequired: false, certificateRequired: false, evidenceRequired: true });
  const submit = () => { template ? care.updateSafetyTemplate(template.id, form) : care.createSafetyTemplate({ ...(form as any), name: form.name || "New safety template", checklist: [{ sectionName: "General Condition", label: "Item checked", responseType: "PASS_FAIL", mandatory: true }] }); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle><DialogDescription>Templates define category-specific checklists, evidence and verification rules.</DialogDescription></DialogHeader><div className="grid gap-3 md:grid-cols-2"><Field label="Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Category"><Select value={form.categoryId || ""} onChange={(categoryId) => setForm({ ...form, categoryId })} options={categories.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} /></Field><Field label="Status"><Select value={form.status || "DRAFT"} onChange={(status) => setForm({ ...form, status: status as SafetyInspectionTemplate["status"], active: status === "ACTIVE" })} options={["DRAFT", "ACTIVE", "INACTIVE"].map((item) => ({ value: item, label: item }))} /></Field><Field label="Frequency"><Select value={form.defaultFrequencyType || "monthly"} onChange={(defaultFrequencyType) => setForm({ ...form, defaultFrequencyType: defaultFrequencyType as PlannedMaintenanceFrequencyType })} options={["weekly", "monthly", "quarterly", "six_monthly", "annual"].map((item) => ({ value: item, label: item }))} /></Field><Field label="Interval"><Input type="number" value={form.defaultFrequencyInterval || 1} onChange={(e) => setForm({ ...form, defaultFrequencyInterval: Number(e.target.value) })} /></Field><Field label="Duration Minutes"><Input type="number" value={form.estimatedDurationMinutes || 30} onChange={(e) => setForm({ ...form, estimatedDurationMinutes: Number(e.target.value) })} /></Field><Field label="Description" className="md:col-span-2"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><Field label="Instructions" className="md:col-span-2"><Textarea value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.verificationRequired)} onChange={(e) => setForm({ ...form, verificationRequired: e.target.checked })} />Verification required</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.certificateRequired)} onChange={(e) => setForm({ ...form, certificateRequired: e.target.checked })} />Certificate required</label></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Template</Button></DialogFooter></DialogContent></Dialog>;
}

function ScheduleDialog({ open, schedule, categories, templates, assets, onOpenChange }: { open: boolean; schedule?: SafetyInspectionSchedule; categories: SafetyCategory[]; templates: SafetyInspectionTemplate[]; assets: MaintenanceAsset[]; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState<Partial<SafetyInspectionSchedule>>(() => schedule || { homeId: care.activeFacilityId, categoryId: categories[0]?.id || "", templateId: templates.find((item) => item.active)?.id || "", startDate: new Date().toISOString().slice(0, 10), nextDueDate: new Date().toISOString().slice(0, 10), frequencyType: "monthly", frequencyInterval: 1, responsibleTeamId: "maintenance", priority: "MEDIUM", active: true, autoCreateInspection: true, autoCreateCorrectiveWorkOrder: true });
  const submit = () => { schedule ? care.updateSafetySchedule(schedule.id, form) : care.createSafetySchedule(form); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{schedule ? "Edit Schedule" : "Create Schedule"}</DialogTitle></DialogHeader><div className="grid gap-3 md:grid-cols-2"><Field label="Schedule Name"><Input value={form.scheduleName || ""} onChange={(e) => setForm({ ...form, scheduleName: e.target.value })} /></Field><Field label="Category"><Select value={form.categoryId || ""} onChange={(categoryId) => setForm({ ...form, categoryId, templateId: templates.find((item) => item.categoryId === categoryId)?.id || "" })} options={categories.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} /></Field><Field label="Template"><Select value={form.templateId || ""} onChange={(templateId) => setForm({ ...form, templateId })} options={templates.filter((item) => item.active && (!form.categoryId || item.categoryId === form.categoryId)).map((item) => ({ value: item.id, label: item.name }))} /></Field><Field label="Asset"><Select value={form.assetId || ""} onChange={(assetId) => setForm({ ...form, assetId })} options={[{ value: "", label: "Home-level / location only" }, ...assets.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.assetNumber} - ${item.assetName}` }))]} /></Field><Field label="Location"><Input value={form.locationLabel || ""} onChange={(e) => setForm({ ...form, locationLabel: e.target.value })} /></Field><Field label="Next Due"><Input type="date" value={form.nextDueDate || ""} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></Field><Field label="Frequency"><Select value={form.frequencyType || "monthly"} onChange={(frequencyType) => setForm({ ...form, frequencyType: frequencyType as PlannedMaintenanceFrequencyType })} options={["weekly", "monthly", "quarterly", "six_monthly", "annual"].map((item) => ({ value: item, label: item }))} /></Field><Field label="Interval"><Input type="number" value={form.frequencyInterval || 1} onChange={(e) => setForm({ ...form, frequencyInterval: Number(e.target.value) })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Schedule</Button></DialogFooter></DialogContent></Dialog>;
}

function CategoryDialog({ open, category, onOpenChange }: { open: boolean; category?: SafetyCategory; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState<Partial<SafetyCategory>>(() => category || { code: "FIRE_SAFETY", name: "", description: "", colour: "#2563eb", icon: "shield", active: true, defaultFrequencyType: "monthly", defaultFrequencyInterval: 1, defaultPriority: "MEDIUM", defaultVerificationRequired: false, defaultCertificateRequired: false });
  const submit = () => { category ? care.updateSafetyCategory(category.id, form) : care.createSafetyCategory(form as any); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle></DialogHeader><div className="grid gap-3"><Field label="Code"><Select value={form.code || "FIRE_SAFETY"} onChange={(code) => setForm({ ...form, code: code as SafetyCategory["code"], name: form.name || code.replaceAll("_", " ") })} options={SAFETY_CATEGORY_CODES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} /></Field><Field label="Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Description"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Category</Button></DialogFooter></DialogContent></Dialog>;
}

function CertificateDialog({ open, certificate, categories, inspections, assets, onOpenChange }: { open: boolean; certificate?: SafetyCertificate; categories: SafetyCategory[]; inspections: SafetyInspection[]; assets: MaintenanceAsset[]; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState<Partial<SafetyCertificate>>(() => certificate || { categoryId: categories[0]?.id || "", issuedDate: new Date().toISOString().slice(0, 10), validFrom: new Date().toISOString().slice(0, 10), expiryDate: new Date().toISOString().slice(0, 10), status: "VALID" });
  const submit = () => { certificate ? care.updateSafetyCertificate(certificate.id, form) : care.createSafetyCertificate(form as any); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{certificate ? "Edit Certificate" : "Add Certificate"}</DialogTitle></DialogHeader><div className="grid gap-3 md:grid-cols-2"><Field label="Type"><Input value={form.certificateType || ""} onChange={(e) => setForm({ ...form, certificateType: e.target.value })} /></Field><Field label="Number"><Input value={form.certificateNumber || ""} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} /></Field><Field label="Category"><Select value={form.categoryId || ""} onChange={(categoryId) => setForm({ ...form, categoryId })} options={categories.map((item) => ({ value: item.id, label: item.name }))} /></Field><Field label="Inspection"><Select value={form.inspectionId || ""} onChange={(inspectionId) => setForm({ ...form, inspectionId })} options={[{ value: "", label: "No linked inspection" }, ...inspections.map((item) => ({ value: item.id, label: item.inspectionNumber }))]} /></Field><Field label="Asset"><Select value={form.assetId || ""} onChange={(assetId) => setForm({ ...form, assetId })} options={[{ value: "", label: "Home-level" }, ...assets.map((item) => ({ value: item.id, label: item.assetName }))]} /></Field><Field label="Issued By"><Input value={form.issuedBy || ""} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} /></Field><Field label="Issued Date"><Input type="date" value={form.issuedDate || ""} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} /></Field><Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Certificate</Button></DialogFooter></DialogContent></Dialog>;
}

function EvidenceDialog({ open, inspection, onOpenChange }: { open: boolean; inspection?: SafetyInspection; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ evidenceType: "PHOTO" as SafetyEvidenceType, fileName: "", caption: "" });
  const submit = () => { if (inspection) care.addSafetyEvidence(inspection.id, form); setForm({ evidenceType: "PHOTO", fileName: "", caption: "" }); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Evidence</DialogTitle><DialogDescription>Records metadata using the existing local evidence pattern.</DialogDescription></DialogHeader><Field label="Evidence Type"><Select value={form.evidenceType} onChange={(evidenceType) => setForm({ ...form, evidenceType: evidenceType as SafetyEvidenceType })} options={SAFETY_EVIDENCE_TYPES.map((item) => ({ value: item, label: item }))} /></Field><Field label="File Name"><Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="panel-photo.jpg" /></Field><Field label="Caption"><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></Field><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.fileName.trim()} onClick={submit}>Attach Evidence</Button></DialogFooter></DialogContent></Dialog>;
}

function ObservationDialog({ open, inspection, response, onOpenChange }: { open: boolean; inspection?: SafetyInspection; response?: SafetyInspectionResponse; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ description: "", severity: "MEDIUM" as SafetySeverity, correctiveActionRequired: true });
  const submit = () => { if (inspection) care.addSafetyObservation(inspection.id, { ...form, responseId: response?.id }); setForm({ description: "", severity: "MEDIUM", correctiveActionRequired: true }); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Observation</DialogTitle></DialogHeader><Field label="Severity"><Select value={form.severity} onChange={(severity) => setForm({ ...form, severity: severity as SafetySeverity })} options={["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => ({ value: item, label: item }))} /></Field><Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.correctiveActionRequired} onChange={(e) => setForm({ ...form, correctiveActionRequired: e.target.checked })} />Corrective Work Order required</label><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.description.trim()} onClick={submit}>Save Observation</Button></DialogFooter></DialogContent></Dialog>;
}

function Metric({ title, value, icon: Icon, tone, onClick }: { title: string; value: ReactNode; icon: any; tone: "blue" | "green" | "amber" | "red" | "purple" | "slate"; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border bg-card p-4 text-left shadow-sm", onClick && "transition hover:border-primary")}><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{title}</div><Icon className={cn("h-5 w-5", tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : tone === "green" ? "text-green-600" : tone === "purple" ? "text-purple-600" : tone === "blue" ? "text-blue-600" : "text-slate-600")} /></div><div className="mt-3 text-2xl font-bold">{value}</div></button>;
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "red" | "green" }) {
  return <div className="rounded-md bg-muted/40 p-2"><div className={cn("font-semibold", tone === "red" && "text-red-700", tone === "green" && "text-green-700")}>{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("space-y-1 text-sm", className)}><span className="font-medium">{label}</span>{children}</label>;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value || "blank"} value={option.value}>{option.label}</option>)}</select>;
}

function InfoList({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <div className="rounded-lg border p-3"><div className="font-semibold">{title}</div>{rows.length ? <div className="mt-2 space-y-1 text-sm text-muted-foreground">{rows.map((row, index) => <div key={`${row}-${index}`}>{row}</div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">{empty}</p>}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function categoryName(id: string | undefined, categories: SafetyCategory[]) {
  return categories.find((item) => item.id === id)?.name || "Unknown category";
}

function assetName(id: string | undefined, assets: MaintenanceAsset[]) {
  return id ? assets.find((item) => item.id === id)?.assetName : undefined;
}

function searchable(values: unknown[], query: string) {
  const q = query.trim().toLowerCase();
  return !q || values.some((value) => String(value || "").toLowerCase().includes(q));
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const group = key(item) || "Other";
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});
}

function statusClass(status: SafetyInspectionOccurrence["status"]) {
  if (status === "OVERDUE" || status === "FAILED") return "bg-red-100 text-red-800";
  if (status === "DUE_SOON" || status === "DUE_TODAY" || status === "AWAITING_VERIFICATION") return "bg-amber-100 text-amber-800";
  if (status === "COMPLETED") return "bg-green-100 text-green-800";
  return "bg-slate-100 text-slate-800";
}

function resultClass(result: SafetyInspection["overallResult"]) {
  if (result === "FAIL") return "bg-red-100 text-red-800";
  if (result === "PASS" || result === "PASS_WITH_OBSERVATIONS") return "bg-green-100 text-green-800";
  return "bg-slate-100 text-slate-800";
}

function formatDateTime(input: string) {
  return new Date(input).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
