import { Link } from "@tanstack/react-router";
import { AlertTriangle, Box, CalendarDays, CheckCircle2, ClipboardList, FileText, ShieldCheck, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCare } from "@/lib/care/store";
import { workOrderDashboardMetrics, workOrderPriorityLabel, workOrderStatusLabel } from "@/domain/maintenance/workOrders";
import { assetDashboardMetrics } from "@/domain/maintenance/assets";
import { certificateDashboardMetrics } from "@/domain/maintenance/certificates";
import { correctiveActionIsOverdue } from "@/domain/maintenance/correctiveActions";

export function MaintenanceHousekeepingDashboard() {
  const care = useCare();
  const workOrders = care.maintenanceWorkOrders.filter((item) => item.homeId === care.activeFacilityId && !item.archivedAt);
  const workOrderMetrics = workOrderDashboardMetrics(workOrders);
  const assets = care.maintenanceAssets.filter((item) => item.homeId === care.activeFacilityId && !item.archivedAt);
  const assetMetrics = assetDashboardMetrics({ assets, categories: care.maintenanceAssetCategories, workOrders, schedules: care.plannedMaintenanceSchedules, occurrences: care.plannedMaintenanceOccurrences });
  const certificateMetrics = certificateDashboardMetrics({ certificates: care.maintenanceCertificates.filter((item) => !item.homeId || item.homeId === care.activeFacilityId), versions: care.maintenanceCertificateVersions, types: care.maintenanceCertificateTypes, attachments: care.maintenanceCertificateAttachments, requirements: care.maintenanceCertificateRequirements, assets });
  const corrective = care.correctiveActions.filter((item) => item.homeId === care.activeFacilityId && !["CLOSED", "CANCELLED"].includes(item.status));
  const facility = care.facilities.find((item) => item.id === care.activeFacilityId)?.name || "Current Nursing Home";
  const currentOrders = workOrders.filter((item) => !["COMPLETED", "VERIFIED", "CLOSED", "CANCELLED", "ENTERED_IN_ERROR"].includes(item.status)).sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999")).slice(0, 6);

  if (care.currentRole !== "don" && care.currentRole !== "group_owner") return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Maintenance & Housekeeping is available to authorised users only.</CardContent></Card></div>;

  return <div className="space-y-5 bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
    <header><h1 className="text-2xl font-bold tracking-tight">Maintenance & Housekeeping</h1><p className="mt-1 text-sm text-[#536176]">Live operational overview for {facility}.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <Kpi icon={Wrench} title="Open Work Orders" value={workOrderMetrics.open} detail={`High priority: ${workOrderMetrics.high}`} to="/maintenance/work-orders?preset=active" tone="red" />
      <Kpi icon={AlertTriangle} title="Overdue Work Orders" value={workOrderMetrics.overdue} detail="Require attention" to="/maintenance/work-orders?preset=overdue" tone="red" />
      <Kpi icon={CalendarDays} title="Preventive Maintenance Due" value={assetMetrics.upcomingPlannedMaintenance} detail="Next 30 days" to="/maintenance/planned-maintenance" tone="amber" />
      <Kpi icon={Box} title="Assets Out of Service" value={assetMetrics.outOfService} detail={`Operational: ${assetMetrics.operationalAssets}`} to="/maintenance/assets" tone="purple" />
      <Kpi icon={FileText} title="Certificates Expiring Soon" value={certificateMetrics.dueSoon} detail={`Expired: ${certificateMetrics.expired}`} to="/maintenance/certificates/due-soon" tone="amber" />
      <Kpi icon={ShieldCheck} title="Open Corrective Actions" value={corrective.length} detail={`Overdue: ${corrective.filter(correctiveActionIsOverdue).length}`} to="/maintenance/corrective-actions" tone="teal" />
      <Kpi icon={CheckCircle2} title="Total Assets" value={assetMetrics.totalAssets} detail={`Warranty expiring: ${assetMetrics.warrantyExpiring}`} to="/maintenance/assets" tone="green" />
    </section>
    <section className="grid gap-4 xl:grid-cols-2">
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Work Orders by Status</CardTitle><Link to="/maintenance/work-orders" className="text-sm font-medium text-primary hover:underline">View all</Link></CardHeader><CardContent className="space-y-1"><StatusLink label="Open" value={workOrderMetrics.open} to="/maintenance/work-orders?status=OPEN" /><StatusLink label="In Progress" value={workOrderMetrics.inProgress} to="/maintenance/work-orders?status=IN_PROGRESS" /><StatusLink label="On Hold" value={workOrderMetrics.onHold} to="/maintenance/work-orders?status=ON_HOLD" /><StatusLink label="Completed" value={workOrderMetrics.completed} to="/maintenance/work-orders?preset=completed" /><StatusLink label="Cancelled" value={workOrderMetrics.cancelled} to="/maintenance/work-orders?preset=cancelled" /></CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Assets by Condition</CardTitle><Link to="/maintenance/assets" className="text-sm font-medium text-primary hover:underline">Open asset register</Link></CardHeader><CardContent className="space-y-1">{assetMetrics.byCondition.filter((item) => item.value > 0).map((item) => <div key={item.label} className="flex items-center justify-between border-b py-2 text-sm last:border-0"><span>{item.label}</span><span className="font-semibold">{item.value}</span></div>)}{assetMetrics.byCondition.every((item) => item.value === 0) && <p className="py-4 text-sm text-muted-foreground">No assets have been recorded for this Nursing Home.</p>}</CardContent></Card>
    </section>
    <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Work Orders Requiring Attention</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Live active Work Orders, ordered by due date.</p></div><Link to="/maintenance/work-orders?preset=active" className="text-sm font-medium text-primary hover:underline">View all active</Link></CardHeader><CardContent>{currentOrders.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No active Work Orders for this Nursing Home.</p> : <div className="divide-y">{currentOrders.map((item) => <Link key={item.id} to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: item.id }} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-muted/50"><div><div className="font-medium">{item.title}</div><div className="text-xs text-muted-foreground">{item.workOrderNumber} · Due {item.dueAt ? new Date(item.dueAt).toLocaleDateString("en-IE") : "not set"}</div></div><div className="flex gap-2"><Badge variant="outline">{workOrderPriorityLabel(item.priority)}</Badge><Badge variant="secondary">{workOrderStatusLabel(item.status)}</Badge></div></Link>)}</div>}</CardContent></Card>
  </div>;
}

function Kpi({ icon: Icon, title, value, detail, to, tone }: { icon: typeof Wrench; title: string; value: number; detail: string; to: string; tone: string }) {
  return <Link to={to as any} className="rounded-xl bg-white p-4 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary"><div className="flex items-center gap-2 text-sm font-semibold"><Icon className={`h-4 w-4 ${toneClass(tone)}`} />{title}</div><div className="mt-4 text-3xl font-bold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></Link>;
}
function StatusLink({ label, value, to }: { label: string; value: number; to: string }) { return <Link to={to as any} className="flex items-center justify-between border-b py-2 text-sm last:border-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary"><span>{label}</span><span className="font-semibold">{value}</span></Link>; }
function toneClass(tone: string) { return ({ red: "text-red-600", amber: "text-amber-600", purple: "text-violet-600", teal: "text-teal-600", green: "text-emerald-600" } as Record<string, string>)[tone] || "text-primary"; }
