import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Link2,
  Package,
  Plus,
  Search,
  Settings2,
  Upload,
  Wrench,
} from "lucide-react";
import { useCare } from "@/lib/care/store";
import type {
  MaintenanceAsset,
  MaintenanceAssetCategory,
  MaintenanceAssetCondition,
  MaintenanceAssetCriticality,
  MaintenanceAssetDocumentType,
  MaintenanceAssetOperationalStatus,
  MaintenanceAssetRelationshipType,
  MaintenanceAssetStatus,
  MaintenanceWorkOrder,
} from "@/lib/care/types";
import {
  ASSET_CONDITIONS,
  ASSET_DOCUMENT_TYPES,
  ASSET_OPERATIONAL_STATUSES,
  ASSET_RELATIONSHIP_TYPES,
  ASSET_STATUSES,
  assetDashboardMetrics,
  assetNeedsAttention,
  currentWorkOrdersForAsset,
  inspectionHistoryForAsset,
  maintenanceHistoryForAsset,
  serviceHistoryForAsset,
  timelineForAsset,
  warrantyStatus,
} from "@/domain/maintenance/assets";
import { workOrderAssigneeLabel, workOrderCategoryLabel, workOrderPriorityLabel, workOrderStatusLabel } from "@/domain/maintenance/workOrders";
import { frequencyLabel } from "@/domain/maintenance/plannedMaintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance/assets")({
  head: () => ({ meta: [{ title: "Maintenance Assets - NuCare" }] }),
  component: AssetsRoute,
});

type Tab = "overview" | "register" | "categories" | "dashboard" | "documents" | "replacement" | "workOrders" | "relationships";
type DetailTab = "overview" | "maintenance" | "service" | "inspection" | "documents" | "photos" | "timeline" | "relationships" | "workOrders" | "location" | "replacement";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "register", label: "Asset Register" },
  { value: "categories", label: "Categories" },
  { value: "dashboard", label: "Dashboard" },
  { value: "documents", label: "Documents" },
  { value: "replacement", label: "Replacement Planning" },
  { value: "workOrders", label: "Current Work Orders" },
  { value: "relationships", label: "Asset Relationships" },
];

const DETAIL_TABS: Array<{ value: DetailTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "maintenance", label: "Maintenance" },
  { value: "service", label: "Service History" },
  { value: "inspection", label: "Inspection History" },
  { value: "documents", label: "Documents" },
  { value: "photos", label: "Photos" },
  { value: "timeline", label: "Timeline" },
  { value: "relationships", label: "Relationships" },
  { value: "workOrders", label: "Current Work Orders" },
  { value: "location", label: "Location History" },
  { value: "replacement", label: "Replacement" },
];

function AssetsRoute() {
  const care = useCare();
  const [tab, setTab] = useState<Tab>("overview");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [operationalFilter, setOperationalFilter] = useState("");
  const [sortBy, setSortBy] = useState("assetNumber");
  const [page, setPage] = useState(1);
  const [selectedColumns, setSelectedColumns] = useState(["assetNumber", "assetName", "category", "location", "condition", "status", "operational", "warranty", "workOrders", "replacement"]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [assetDialog, setAssetDialog] = useState<{ open: boolean; asset?: MaintenanceAsset }>({ open: false });
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category?: MaintenanceAssetCategory }>({ open: false });
  const [documentDialog, setDocumentDialog] = useState<{ open: boolean; asset?: MaintenanceAsset }>({ open: false });
  const [photoDialog, setPhotoDialog] = useState<{ open: boolean; asset?: MaintenanceAsset }>({ open: false });
  const [relationshipDialog, setRelationshipDialog] = useState(false);
  const [message, setMessage] = useState<string>();

  const assets = care.maintenanceAssets || [];
  const categories = care.maintenanceAssetCategories || [];
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);
  const metrics = useMemo(() => assetDashboardMetrics({
    assets,
    categories,
    workOrders: care.maintenanceWorkOrders,
    schedules: care.plannedMaintenanceSchedules,
    occurrences: care.plannedMaintenanceOccurrences,
  }), [assets, categories, care.maintenanceWorkOrders, care.plannedMaintenanceSchedules, care.plannedMaintenanceOccurrences]);

  const filteredAssets = assets
    .filter((asset) => searchable([asset.assetNumber, asset.assetName, asset.description, asset.manufacturer, asset.model, asset.serialNumber, asset.locationLabel], search))
    .filter((asset) => !categoryFilter || asset.categoryId === categoryFilter)
    .filter((asset) => !conditionFilter || asset.condition === conditionFilter)
    .filter((asset) => !statusFilter || asset.assetStatus === statusFilter)
    .filter((asset) => !operationalFilter || asset.operationalStatus === operationalFilter)
    .sort((a, b) => assetSortValue(a, b, sortBy, categories));
  const pagedAssets = filteredAssets.slice((page - 1) * 10, page * 10);
  const pageCount = Math.max(1, Math.ceil(filteredAssets.length / 10));

  const currentAssetWorkOrders = selectedAsset ? currentWorkOrdersForAsset(selectedAsset.id, care.maintenanceWorkOrders) : [];
  const upcomingForAsset = selectedAsset ? care.plannedMaintenanceSchedules.filter((schedule) => schedule.assetId === selectedAsset.id) : [];

  const run = (action: () => void, success: string) => {
    try {
      action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete action.");
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Assets</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground">Master register for physical assets, history, documentation and replacement planning.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCategoryDialog({ open: true })}><Settings2 className="mr-2 h-4 w-4" />Add Category</Button>
          <Button onClick={() => setAssetDialog({ open: true })}><Plus className="mr-2 h-4 w-4" />Create Asset</Button>
        </div>
      </div>

      {message && <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{message}</div>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => <Button key={item.value} size="sm" variant={tab === item.value ? "default" : "outline"} className="shrink-0" onClick={() => setTab(item.value)}>{item.label}</Button>)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total Assets" value={metrics.totalAssets} icon={Package} tone="blue" onClick={() => setTab("register")} />
        <Metric title="Operational Assets" value={metrics.operationalAssets} icon={CheckCircle2} tone="green" />
        <Metric title="Under Maintenance" value={metrics.underMaintenance} icon={Wrench} tone="amber" />
        <Metric title="Out of Service" value={metrics.outOfService} icon={Clock} tone="red" />
        <Metric title="Warranty Expiring" value={metrics.warrantyExpiring} icon={FileText} tone="amber" />
        <Metric title="Replacement Due" value={metrics.replacementDue} icon={Clock} tone="red" onClick={() => setTab("replacement")} />
        <Metric title="Current Work Orders" value={metrics.currentWorkOrders} icon={Wrench} tone="purple" onClick={() => setTab("workOrders")} />
        <Metric title="Upcoming Planned Maintenance" value={metrics.upcomingPlannedMaintenance} icon={Clock} tone="slate" />
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <AssetRegisterCard assets={pagedAssets.slice(0, 6)} categories={categories} selectedColumns={selectedColumns} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpen={(asset) => { setSelectedAssetId(asset.id); setDetailTab("overview"); }} compact />
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {assets.flatMap((asset) => timelineForAsset({ asset, documents: care.maintenanceAssetDocuments, photos: care.maintenanceAssetPhotos, locations: care.maintenanceAssetLocationHistory, relationships: care.maintenanceAssetRelationships, workOrders: care.maintenanceWorkOrders }).slice(0, 2)).slice(0, 8).map((event, index) => (
                <div key={`${event.at}-${index}`} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{event.summary}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(event.at)} - {event.user}</div>
                  {event.reference && <div className="mt-1 text-xs">{event.reference}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "register" && (
        <Card>
          <CardHeader><CardTitle>Asset Register</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <AssetFilters search={search} setSearch={setSearch} categories={categories} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} conditionFilter={conditionFilter} setConditionFilter={setConditionFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} operationalFilter={operationalFilter} setOperationalFilter={setOperationalFilter} sortBy={sortBy} setSortBy={setSortBy} setPage={setPage} selectedColumns={selectedColumns} setSelectedColumns={setSelectedColumns} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => run(() => { selectedIds.forEach((id) => care.deactivateMaintenanceAsset(id, "Bulk deactivated from asset register")); setSelectedIds([]); }, "Selected assets deactivated.")}>Deactivate Selected</Button>
              <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => run(() => { selectedIds.forEach((id) => care.archiveMaintenanceAsset(id, "Bulk archived from asset register")); setSelectedIds([]); }, "Selected assets archived.")}>Archive Selected</Button>
            </div>
            <AssetRegisterCard assets={pagedAssets} categories={categories} selectedColumns={selectedColumns} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpen={(asset) => { setSelectedAssetId(asset.id); setDetailTab("overview"); }} onEdit={(asset) => setAssetDialog({ open: true, asset })} onDuplicate={(asset) => run(() => care.duplicateMaintenanceAsset(asset.id), "Asset duplicated.")} />
            <Pagination page={page} pageCount={pageCount} total={filteredAssets.length} setPage={setPage} />
          </CardContent>
        </Card>
      )}

      {tab === "categories" && <CategoriesPanel categories={categories} assets={assets} onEdit={(category) => setCategoryDialog({ open: true, category })} onArchive={(category) => run(() => care.archiveMaintenanceAssetCategory(category.id, "Archived from Assets module"), "Category archived.")} onRestore={(category) => run(() => care.restoreMaintenanceAssetCategory(category.id), "Category restored.")} />}
      {tab === "dashboard" && <DashboardPanel metrics={metrics} />}
      {tab === "documents" && <DocumentsPanel assets={assets} />}
      {tab === "replacement" && <ReplacementPanel assets={assets} onEdit={(asset) => setAssetDialog({ open: true, asset })} />}
      {tab === "workOrders" && <CurrentWorkOrdersPanel workOrders={care.maintenanceWorkOrders.filter((wo) => wo.assetId)} />}
      {tab === "relationships" && <RelationshipsPanel assets={assets} onCreate={() => setRelationshipDialog(true)} />}

      {selectedAsset && (
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{selectedAsset.assetName}</CardTitle>
              <p className="text-sm text-muted-foreground">{selectedAsset.assetNumber} - {categoryName(selectedAsset.categoryId, categories)} - {selectedAsset.locationLabel || "Location not recorded"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDocumentDialog({ open: true, asset: selectedAsset })}><Upload className="mr-2 h-4 w-4" />Document</Button>
              <Button variant="outline" onClick={() => setPhotoDialog({ open: true, asset: selectedAsset })}><Camera className="mr-2 h-4 w-4" />Photo</Button>
              <Button onClick={() => setAssetDialog({ open: true, asset: selectedAsset })}>Edit Asset</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">{DETAIL_TABS.map((item) => <Button key={item.value} size="sm" variant={detailTab === item.value ? "default" : "outline"} className="shrink-0" onClick={() => setDetailTab(item.value)}>{item.label}</Button>)}</div>
            <AssetDetail asset={selectedAsset} tab={detailTab} workOrders={care.maintenanceWorkOrders} schedules={upcomingForAsset} categories={categories} />
          </CardContent>
        </Card>
      )}

      <AssetDialog open={assetDialog.open} asset={assetDialog.asset} categories={categories.filter((category) => category.active && !category.archivedAt)} onOpenChange={(open) => setAssetDialog({ open })} />
      <CategoryDialog open={categoryDialog.open} category={categoryDialog.category} onOpenChange={(open) => setCategoryDialog({ open })} />
      <DocumentDialog open={documentDialog.open} asset={documentDialog.asset} onOpenChange={(open) => setDocumentDialog({ open })} />
      <PhotoDialog open={photoDialog.open} asset={photoDialog.asset} onOpenChange={(open) => setPhotoDialog({ open })} />
      <RelationshipDialog open={relationshipDialog} assets={assets} onOpenChange={setRelationshipDialog} />
    </div>
  );
}

function AssetRegisterCard({ assets, categories, selectedColumns, selectedIds, setSelectedIds, onOpen, onEdit, onDuplicate, compact }: { assets: MaintenanceAsset[]; categories: MaintenanceAssetCategory[]; selectedColumns: string[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; onOpen: (asset: MaintenanceAsset) => void; onEdit?: (asset: MaintenanceAsset) => void; onDuplicate?: (asset: MaintenanceAsset) => void; compact?: boolean }) {
  return (
    <Card className={compact ? "" : "border-0 shadow-none"}>
      {compact && <CardHeader><CardTitle>Asset Register</CardTitle></CardHeader>}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {!compact && <th className="px-3 py-2"><input type="checkbox" checked={assets.length > 0 && assets.every((asset) => selectedIds.includes(asset.id))} onChange={(event) => setSelectedIds(event.target.checked ? Array.from(new Set([...selectedIds, ...assets.map((asset) => asset.id)])) : selectedIds.filter((id) => !assets.some((asset) => asset.id === id)))} /></th>}
                {selectedColumns.includes("assetNumber") && <th className="px-3 py-2">Asset Number</th>}
                {selectedColumns.includes("assetName") && <th className="px-3 py-2">Asset Name</th>}
                {selectedColumns.includes("category") && <th className="px-3 py-2">Category</th>}
                {selectedColumns.includes("location") && <th className="px-3 py-2">Location</th>}
                {selectedColumns.includes("condition") && <th className="px-3 py-2">Condition</th>}
                {selectedColumns.includes("status") && <th className="px-3 py-2">Status</th>}
                {selectedColumns.includes("operational") && <th className="px-3 py-2">Operational</th>}
                {selectedColumns.includes("warranty") && <th className="px-3 py-2">Warranty</th>}
                {selectedColumns.includes("replacement") && <th className="px-3 py-2">Replacement</th>}
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>{assets.map((asset) => {
              const warranty = warrantyStatus(asset);
              return (
                <tr key={asset.id} className="border-b last:border-0">
                  {!compact && <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(asset.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, asset.id] : selectedIds.filter((id) => id !== asset.id))} /></td>}
                  {selectedColumns.includes("assetNumber") && <td className="px-3 py-3 font-medium">{asset.assetNumber}</td>}
                  {selectedColumns.includes("assetName") && <td className="px-3 py-3"><button className="text-left font-medium text-blue-700 hover:underline" onClick={() => onOpen(asset)}>{asset.assetName}</button><div className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</div></td>}
                  {selectedColumns.includes("category") && <td className="px-3 py-3">{categoryName(asset.categoryId, categories)}</td>}
                  {selectedColumns.includes("location") && <td className="px-3 py-3">{asset.locationLabel || "-"}</td>}
                  {selectedColumns.includes("condition") && <td className="px-3 py-3"><Badge className={conditionClass(asset.condition)}>{asset.condition}</Badge></td>}
                  {selectedColumns.includes("status") && <td className="px-3 py-3">{asset.assetStatus}</td>}
                  {selectedColumns.includes("operational") && <td className="px-3 py-3">{asset.operationalStatus}</td>}
                  {selectedColumns.includes("warranty") && <td className="px-3 py-3"><Badge className={toneBadge(warranty.tone)}>{warranty.label}</Badge></td>}
                  {selectedColumns.includes("replacement") && <td className="px-3 py-3">{asset.replacementDate || "-"}</td>}
                  <td className="px-3 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onOpen(asset)}>Open</Button>{onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(asset)}>Edit</Button>}{onDuplicate && <Button size="icon" variant="outline" onClick={() => onDuplicate(asset)}><Copy className="h-4 w-4" /></Button>}</div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetFilters(props: { search: string; setSearch: (v: string) => void; categories: MaintenanceAssetCategory[]; categoryFilter: string; setCategoryFilter: (v: string) => void; conditionFilter: string; setConditionFilter: (v: string) => void; statusFilter: string; setStatusFilter: (v: string) => void; operationalFilter: string; setOperationalFilter: (v: string) => void; sortBy: string; setSortBy: (v: string) => void; setPage: (n: number) => void; selectedColumns: string[]; setSelectedColumns: (v: string[]) => void }) {
  const columnOptions = [["assetNumber", "Asset Number"], ["assetName", "Asset Name"], ["category", "Category"], ["location", "Location"], ["condition", "Condition"], ["status", "Status"], ["operational", "Operational Status"], ["warranty", "Warranty"], ["replacement", "Replacement Date"]];
  const change = (fn: (v: string) => void) => (value: string) => { fn(value); props.setPage(1); };
  return (
    <div className="space-y-3">
      <div className="grid gap-2 lg:grid-cols-[1.5fr_repeat(5,minmax(140px,1fr))]">
        <SearchBox value={props.search} onChange={change(props.setSearch)} placeholder="Search assets, serial number, model or location" />
        <Select value={props.categoryFilter} onChange={change(props.setCategoryFilter)} options={[{ value: "", label: "All categories" }, ...props.categories.map((category) => ({ value: category.id, label: category.name }))]} />
        <Select value={props.conditionFilter} onChange={change(props.setConditionFilter)} options={[{ value: "", label: "All conditions" }, ...ASSET_CONDITIONS.map((item) => ({ value: item, label: item }))]} />
        <Select value={props.statusFilter} onChange={change(props.setStatusFilter)} options={[{ value: "", label: "All statuses" }, ...ASSET_STATUSES.map((item) => ({ value: item, label: item }))]} />
        <Select value={props.operationalFilter} onChange={change(props.setOperationalFilter)} options={[{ value: "", label: "All operational" }, ...ASSET_OPERATIONAL_STATUSES.map((item) => ({ value: item, label: item }))]} />
        <Select value={props.sortBy} onChange={props.setSortBy} options={[{ value: "assetNumber", label: "Sort by number" }, { value: "assetName", label: "Sort by name" }, { value: "condition", label: "Sort by condition" }, { value: "replacementDate", label: "Sort by replacement" }]} />
      </div>
      <div className="flex flex-wrap gap-2">
        {columnOptions.map(([key, label]) => <label key={key} className="rounded-md border px-2 py-1 text-xs"><input className="mr-1" type="checkbox" checked={props.selectedColumns.includes(key)} onChange={(event) => props.setSelectedColumns(event.target.checked ? [...props.selectedColumns, key] : props.selectedColumns.filter((item) => item !== key))} />{label}</label>)}
      </div>
    </div>
  );
}

function AssetDetail({ asset, tab, workOrders, schedules, categories }: { asset: MaintenanceAsset; tab: DetailTab; workOrders: MaintenanceWorkOrder[]; schedules: ReturnType<typeof useCare>["plannedMaintenanceSchedules"]; categories: MaintenanceAssetCategory[] }) {
  const care = useCare();
  if (tab === "overview") {
    const warranty = warrantyStatus(asset);
    return <div className="grid gap-4 xl:grid-cols-3"><InfoGrid title="Basic Information" rows={[["Asset Number", asset.assetNumber], ["Manufacturer", asset.manufacturer], ["Model", asset.model], ["Serial Number", asset.serialNumber], ["Category", categoryName(asset.categoryId, categories)], ["Location", asset.locationLabel], ["Condition", asset.condition], ["Status", asset.assetStatus], ["Operational Status", asset.operationalStatus], ["Criticality", asset.criticality], ["Warranty", warranty.label], ["Replacement Date", asset.replacementDate], ["Replacement Cost", money(asset.replacementCost)]]} /><InfoCard title="Current Open Work Orders">{currentWorkOrdersForAsset(asset.id, workOrders).map((wo) => <WorkOrderLine key={wo.id} workOrder={wo} />)}</InfoCard><InfoCard title="Upcoming Planned Maintenance">{schedules.map((schedule) => <div key={schedule.id} className="rounded-md border p-3 text-sm"><div className="font-medium">{schedule.assetName}</div><div className="text-xs text-muted-foreground">{frequencyLabel(schedule.frequencyType, schedule.frequencyValue)} - Next due {schedule.nextDueDate}</div></div>)}</InfoCard></div>;
  }
  if (tab === "maintenance") return <WorkOrderHistory records={maintenanceHistoryForAsset(asset.id, workOrders)} />;
  if (tab === "service") return <WorkOrderHistory records={serviceHistoryForAsset(asset.id, workOrders)} />;
  if (tab === "inspection") return <WorkOrderHistory records={inspectionHistoryForAsset(asset.id, workOrders)} />;
  if (tab === "documents") return <DocumentsPanel assets={[asset]} />;
  if (tab === "photos") return <PhotosPanel asset={asset} />;
  if (tab === "timeline") return <TimelinePanel asset={asset} />;
  if (tab === "relationships") return <RelationshipsPanel assets={care.maintenanceAssets} focusAssetId={asset.id} onCreate={() => {}} />;
  if (tab === "workOrders") return <CurrentWorkOrdersPanel workOrders={currentWorkOrdersForAsset(asset.id, workOrders)} />;
  if (tab === "location") return <LocationHistoryPanel asset={asset} />;
  return <ReplacementPanel assets={[asset]} onEdit={() => {}} />;
}

function CategoriesPanel({ categories, assets, onEdit, onArchive, onRestore }: { categories: MaintenanceAssetCategory[]; assets: MaintenanceAsset[]; onEdit: (c: MaintenanceAssetCategory) => void; onArchive: (c: MaintenanceAssetCategory) => void; onRestore: (c: MaintenanceAssetCategory) => void }) {
  return <Card><CardHeader><CardTitle>Asset Categories</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{categories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => <div key={category.id} className="rounded-lg border p-4"><div className="flex items-center justify-between"><div className="font-semibold">{category.name}</div><span className="h-4 w-4 rounded-full" style={{ background: category.colour }} /></div><p className="mt-2 text-sm text-muted-foreground">{category.description}</p><div className="mt-3 text-sm">{assets.filter((asset) => asset.categoryId === category.id).length} assets</div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(category)}>Edit</Button>{category.archivedAt ? <Button size="sm" variant="outline" onClick={() => onRestore(category)}>Restore</Button> : <Button size="sm" variant="outline" onClick={() => onArchive(category)}>Archive</Button>}</div></div>)}</CardContent></Card>;
}

function DashboardPanel({ metrics }: { metrics: ReturnType<typeof assetDashboardMetrics> }) {
  return <div className="grid gap-4 xl:grid-cols-3"><ChartList title="Assets by Category" items={metrics.byCategory} /><ChartList title="Assets by Condition" items={metrics.byCondition} /><ChartList title="Assets by Operational Status" items={metrics.byOperationalStatus} /></div>;
}

function DocumentsPanel({ assets }: { assets: MaintenanceAsset[] }) {
  const care = useCare();
  const assetIds = new Set(assets.map((asset) => asset.id));
  const docs = care.maintenanceAssetDocuments.filter((doc) => assetIds.has(doc.assetId) && !doc.deletedAt && !doc.replacedByDocumentId);
  return <Card><CardHeader><CardTitle>Documents</CardTitle></CardHeader><CardContent>{docs.length === 0 ? <Empty text="No asset documents uploaded." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">File</th><th className="px-3 py-2">Uploaded</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{docs.map((doc) => <tr key={doc.id} className="border-b last:border-0"><td className="px-3 py-3">{assets.find((asset) => asset.id === doc.assetId)?.assetName}</td><td className="px-3 py-3">{doc.documentType}</td><td className="px-3 py-3">{doc.fileName}</td><td className="px-3 py-3">{formatDateTime(doc.uploadedAt)} - {doc.uploadedBy}</td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => alert(`Preview/download placeholder: ${doc.storageReference}`)}>Preview</Button></td></tr>)}</tbody></table>}</CardContent></Card>;
}

function PhotosPanel({ asset }: { asset: MaintenanceAsset }) {
  const care = useCare();
  const photos = care.maintenanceAssetPhotos.filter((photo) => photo.assetId === asset.id && !photo.deletedAt).sort((a, b) => a.displayOrder - b.displayOrder);
  return <div className="grid gap-3 md:grid-cols-3">{photos.length === 0 ? <Empty text="No photos uploaded for this asset." /> : photos.map((photo) => <div key={photo.id} className="rounded-lg border p-3"><div className="aspect-video rounded bg-muted" style={{ backgroundImage: `url(${photo.fileReference})`, backgroundSize: "cover", backgroundPosition: "center" }} /><div className="mt-2 text-sm font-medium">{photo.caption || "Asset photo"}</div>{photo.primary && <Badge className="mt-2">Primary</Badge>}</div>)}</div>;
}

function ReplacementPanel({ assets, onEdit }: { assets: MaintenanceAsset[]; onEdit: (asset: MaintenanceAsset) => void }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>Replacement Planning</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Condition</th><th className="px-3 py-2">Operational</th><th className="px-3 py-2">Repairs</th><th className="px-3 py-2">Last Service</th><th className="px-3 py-2">Warranty</th><th className="px-3 py-2">Replacement</th><th className="px-3 py-2">Cost</th><th className="px-3 py-2">Action</th></tr></thead><tbody>{assets.map((asset) => { const history = maintenanceHistoryForAsset(asset.id, care.maintenanceWorkOrders); return <tr key={asset.id} className={cn("border-b last:border-0", assetNeedsAttention(asset, care.maintenanceWorkOrders) && "bg-amber-50/50")}><td className="px-3 py-3 font-medium">{asset.assetName}</td><td className="px-3 py-3">{asset.condition}</td><td className="px-3 py-3">{asset.operationalStatus}</td><td className="px-3 py-3">{history.length}</td><td className="px-3 py-3">{history[0]?.completedAt?.slice(0, 10) || history[0]?.createdAt?.slice(0, 10) || "-"}</td><td className="px-3 py-3">{warrantyStatus(asset).label}</td><td className="px-3 py-3">{asset.replacementDate || "-"}</td><td className="px-3 py-3">{money(asset.replacementCost)}</td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => onEdit(asset)}>Edit</Button></td></tr>; })}</tbody></table></CardContent></Card>;
}

function CurrentWorkOrdersPanel({ workOrders }: { workOrders: MaintenanceWorkOrder[] }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>Current Work Orders</CardTitle></CardHeader><CardContent>{workOrders.length === 0 ? <Empty text="No current Work Orders linked to assets." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Work Order</th><th className="px-3 py-2">Priority</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Assigned To</th><th className="px-3 py-2">Due Date</th><th className="px-3 py-2">Category</th></tr></thead><tbody>{workOrders.map((wo) => <tr key={wo.id} className="border-b last:border-0"><td className="px-3 py-3"><Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: wo.id }} className="font-medium text-blue-700 hover:underline">{wo.workOrderNumber}</Link><div className="text-xs text-muted-foreground">{wo.title}</div></td><td className="px-3 py-3">{workOrderPriorityLabel(wo.priority)}</td><td className="px-3 py-3">{workOrderStatusLabel(wo.status)}</td><td className="px-3 py-3">{workOrderAssigneeLabel(wo, care.users)}</td><td className="px-3 py-3">{wo.dueAt?.slice(0, 10) || "-"}</td><td className="px-3 py-3">{workOrderCategoryLabel(wo.category)}</td></tr>)}</tbody></table>}</CardContent></Card>;
}

function RelationshipsPanel({ assets, focusAssetId, onCreate }: { assets: MaintenanceAsset[]; focusAssetId?: string; onCreate: () => void }) {
  const care = useCare();
  const relationships = care.maintenanceAssetRelationships.filter((rel) => !focusAssetId || rel.parentAssetId === focusAssetId || rel.childAssetId === focusAssetId);
  return <Card><CardHeader className="gap-3 md:flex-row md:items-center md:justify-between"><CardTitle>Asset Relationships</CardTitle><Button onClick={onCreate}><Link2 className="mr-2 h-4 w-4" />Link Assets</Button></CardHeader><CardContent>{relationships.length === 0 ? <Empty text="No asset relationships recorded." /> : <div className="grid gap-3 md:grid-cols-2">{relationships.map((rel) => { const parent = assets.find((asset) => asset.id === rel.parentAssetId); const child = assets.find((asset) => asset.id === rel.childAssetId); return <div key={rel.id} className="rounded-lg border p-4 text-sm"><div className="font-semibold">{parent?.assetName}</div><div className="my-2 text-muted-foreground">{rel.relationshipType}</div><div className="font-semibold">{child?.assetName}</div>{rel.notes && <p className="mt-2 text-muted-foreground">{rel.notes}</p>}</div>; })}</div>}</CardContent></Card>;
}

function LocationHistoryPanel({ asset }: { asset: MaintenanceAsset }) {
  const care = useCare();
  const rows = care.maintenanceAssetLocationHistory.filter((item) => item.assetId === asset.id);
  return <Card><CardHeader><CardTitle>Location History</CardTitle></CardHeader><CardContent>{rows.length === 0 ? <Empty text="No movement history recorded." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Previous</th><th className="px-3 py-2">New</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Moved By</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3">{formatDateTime(row.movedDate)}</td><td className="px-3 py-3">{row.previousLocationLabel || "-"}</td><td className="px-3 py-3">{row.newLocationLabel || "-"}</td><td className="px-3 py-3">{row.reason}</td><td className="px-3 py-3">{row.movedBy}</td></tr>)}</tbody></table>}</CardContent></Card>;
}

function TimelinePanel({ asset }: { asset: MaintenanceAsset }) {
  const care = useCare();
  const events = timelineForAsset({ asset, documents: care.maintenanceAssetDocuments, photos: care.maintenanceAssetPhotos, locations: care.maintenanceAssetLocationHistory, relationships: care.maintenanceAssetRelationships, workOrders: care.maintenanceWorkOrders });
  return <div className="space-y-3">{events.map((event, index) => <div key={`${event.at}-${index}`} className="rounded-md border p-3 text-sm"><div className="font-medium">{event.summary}</div><div className="text-xs text-muted-foreground">{formatDateTime(event.at)} - {event.user}</div>{event.reference && <div className="mt-1">{event.reference}</div>}</div>)}</div>;
}

function WorkOrderHistory({ records }: { records: MaintenanceWorkOrder[] }) {
  return records.length === 0 ? <Empty text="No maintenance history recorded." /> : <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Work Order</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Engineer</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Outcome</th></tr></thead><tbody>{records.map((wo) => <tr key={wo.id} className="border-b last:border-0"><td className="px-3 py-3">{(wo.completedAt || wo.createdAt).slice(0, 10)}</td><td className="px-3 py-3"><Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: wo.id }} className="text-blue-700 hover:underline">{wo.workOrderNumber}</Link></td><td className="px-3 py-3">{wo.type}</td><td className="px-3 py-3">{wo.assignedUserId || wo.assignedTeamId || "Unassigned"}</td><td className="px-3 py-3">{wo.status}</td><td className="px-3 py-3">{wo.completionSummary || "-"}</td></tr>)}</tbody></table>;
}

function AssetDialog({ open, asset, categories, onOpenChange }: { open: boolean; asset?: MaintenanceAsset; categories: MaintenanceAssetCategory[]; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState<Partial<MaintenanceAsset>>(() => assetForm(asset, care));
  useEffect(() => setForm(assetForm(asset, care)), [asset, care.activeFacilityId, care.maintenanceAssetCategories.length]);
  const submit = () => { if (asset) care.updateMaintenanceAsset(asset.id, form, "Updated from Assets module"); else care.createMaintenanceAsset(form as any); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{asset ? "Edit Asset" : "Create Asset"}</DialogTitle><DialogDescription>Record lifecycle, warranty, condition and replacement information.</DialogDescription></DialogHeader><div className="grid gap-3 md:grid-cols-3"><Field label="Asset Number"><Input value={form.assetNumber || ""} onChange={(e) => setForm({ ...form, assetNumber: e.target.value })} placeholder="Auto-generated if blank" /></Field><Field label="Asset Name"><Input value={form.assetName || ""} onChange={(e) => setForm({ ...form, assetName: e.target.value })} /></Field><Field label="Category"><Select value={form.categoryId || ""} onChange={(categoryId) => setForm({ ...form, categoryId })} options={categories.map((c) => ({ value: c.id, label: c.name }))} /></Field><Field label="Manufacturer"><Input value={form.manufacturer || ""} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field><Field label="Model"><Input value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field><Field label="Serial Number"><Input value={form.serialNumber || ""} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></Field><Field label="Barcode"><Input value={form.barcode || ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field><Field label="Location ID"><Input value={form.locationId || ""} onChange={(e) => setForm({ ...form, locationId: e.target.value })} /></Field><Field label="Location"><Input value={form.locationLabel || ""} onChange={(e) => setForm({ ...form, locationLabel: e.target.value })} /></Field><Field label="Purchase Date"><Input type="date" value={form.purchaseDate || ""} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field><Field label="Installation Date"><Input type="date" value={form.installationDate || ""} onChange={(e) => setForm({ ...form, installationDate: e.target.value })} /></Field><Field label="Supplier"><Input value={form.supplier || ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field><Field label="Warranty Start"><Input type="date" value={form.warrantyStartDate || ""} onChange={(e) => setForm({ ...form, warrantyStartDate: e.target.value })} /></Field><Field label="Warranty End"><Input type="date" value={form.warrantyEndDate || ""} onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })} /></Field><Field label="Replacement Date"><Input type="date" value={form.replacementDate || ""} onChange={(e) => setForm({ ...form, replacementDate: e.target.value })} /></Field><Field label="Replacement Cost"><Input type="number" value={form.replacementCost ?? ""} onChange={(e) => setForm({ ...form, replacementCost: Number(e.target.value) })} /></Field><Field label="Condition"><Select value={form.condition || "Good"} onChange={(condition) => setForm({ ...form, condition: condition as MaintenanceAssetCondition })} options={ASSET_CONDITIONS.map((v) => ({ value: v, label: v }))} /></Field><Field label="Status"><Select value={form.assetStatus || "Active"} onChange={(assetStatus) => setForm({ ...form, assetStatus: assetStatus as MaintenanceAssetStatus, active: assetStatus === "Active" })} options={ASSET_STATUSES.map((v) => ({ value: v, label: v }))} /></Field><Field label="Operational Status"><Select value={form.operationalStatus || "Operational"} onChange={(operationalStatus) => setForm({ ...form, operationalStatus: operationalStatus as MaintenanceAssetOperationalStatus })} options={ASSET_OPERATIONAL_STATUSES.map((v) => ({ value: v, label: v }))} /></Field><Field label="Criticality"><Select value={form.criticality || "Medium"} onChange={(criticality) => setForm({ ...form, criticality: criticality as MaintenanceAssetCriticality })} options={["Low", "Medium", "High", "Critical"].map((v) => ({ value: v, label: v }))} /></Field><Field label="Photo URL"><Input value={form.photo || ""} onChange={(e) => setForm({ ...form, photo: e.target.value })} /></Field><Field label="Active"><label className="flex h-10 items-center gap-2"><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Active</label></Field><Field label="Description" className="md:col-span-3"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><Field label="Notes" className="md:col-span-3"><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>{asset ? "Save Asset" : "Create Asset"}</Button></DialogFooter></DialogContent></Dialog>;
}

function CategoryDialog({ open, category, onOpenChange }: { open: boolean; category?: MaintenanceAssetCategory; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState<Partial<MaintenanceAssetCategory>>(() => ({ name: category?.name || "", description: category?.description || "", colour: category?.colour || "#2563eb", icon: category?.icon || "package", active: category?.active ?? true, displayOrder: category?.displayOrder || care.maintenanceAssetCategories.length + 1 }));
  useEffect(() => setForm({ name: category?.name || "", description: category?.description || "", colour: category?.colour || "#2563eb", icon: category?.icon || "package", active: category?.active ?? true, displayOrder: category?.displayOrder || care.maintenanceAssetCategories.length + 1 }), [category, care.maintenanceAssetCategories.length]);
  const submit = () => { if (category) care.updateMaintenanceAssetCategory(category.id, form); else care.createMaintenanceAssetCategory(form as any); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle></DialogHeader><div className="grid gap-3"><Field label="Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Description"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><Field label="Colour"><Input type="color" value={form.colour || "#2563eb"} onChange={(e) => setForm({ ...form, colour: e.target.value })} /></Field><Field label="Icon"><Input value={form.icon || ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save Category</Button></DialogFooter></DialogContent></Dialog>;
}

function DocumentDialog({ open, asset, onOpenChange }: { open: boolean; asset?: MaintenanceAsset; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [documentType, setDocumentType] = useState<MaintenanceAssetDocumentType>("Manual");
  const [fileName, setFileName] = useState("");
  const submit = () => { if (asset) care.addMaintenanceAssetDocument(asset.id, { documentType, fileName }); setFileName(""); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Upload Asset Document</DialogTitle><DialogDescription>Metadata is recorded in this local demo; file storage can attach to the existing upload service later.</DialogDescription></DialogHeader><Field label="Document Type"><Select value={documentType} onChange={(v) => setDocumentType(v as MaintenanceAssetDocumentType)} options={ASSET_DOCUMENT_TYPES.map((v) => ({ value: v, label: v }))} /></Field><Field label="File Name"><Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="manual.pdf" /></Field><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!fileName.trim()} onClick={submit}>Upload</Button></DialogFooter></DialogContent></Dialog>;
}

function PhotoDialog({ open, asset, onOpenChange }: { open: boolean; asset?: MaintenanceAsset; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [fileReference, setFileReference] = useState("");
  const [caption, setCaption] = useState("");
  const submit = () => { if (asset) care.addMaintenanceAssetPhoto(asset.id, { fileReference, caption }); setFileReference(""); setCaption(""); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Asset Photo</DialogTitle></DialogHeader><Field label="Photo URL / Reference"><Input value={fileReference} onChange={(e) => setFileReference(e.target.value)} /></Field><Field label="Caption"><Input value={caption} onChange={(e) => setCaption(e.target.value)} /></Field><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!fileReference.trim()} onClick={submit}>Add Photo</Button></DialogFooter></DialogContent></Dialog>;
}

function RelationshipDialog({ open, assets, onOpenChange }: { open: boolean; assets: MaintenanceAsset[]; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ parentAssetId: "", childAssetId: "", relationshipType: "Connected To" as MaintenanceAssetRelationshipType, notes: "" });
  const submit = () => { care.createMaintenanceAssetRelationship(form); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Link Assets</DialogTitle></DialogHeader><Field label="Parent Asset"><Select value={form.parentAssetId} onChange={(parentAssetId) => setForm({ ...form, parentAssetId })} options={assets.map((a) => ({ value: a.id, label: a.assetName }))} /></Field><Field label="Relationship"><Select value={form.relationshipType} onChange={(relationshipType) => setForm({ ...form, relationshipType: relationshipType as MaintenanceAssetRelationshipType })} options={ASSET_RELATIONSHIP_TYPES.map((v) => ({ value: v, label: v }))} /></Field><Field label="Child Asset"><Select value={form.childAssetId} onChange={(childAssetId) => setForm({ ...form, childAssetId })} options={assets.map((a) => ({ value: a.id, label: a.assetName }))} /></Field><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Create Link</Button></DialogFooter></DialogContent></Dialog>;
}

function Metric({ title, value, icon: Icon, tone, onClick }: { title: string; value: number; icon: any; tone: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border bg-card p-4 text-left shadow-sm", onClick && "hover:bg-muted/50")}><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{title}</span><Icon className={cn("h-5 w-5", toneClass(tone))} /></div><div className="mt-3 text-3xl font-semibold">{value}</div></button>;
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("space-y-1 text-sm font-medium", className)}><span>{label}</span>{children}</label>;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" /></div>;
}

function InfoGrid({ title, rows }: { title: string; rows: Array<[string, unknown]> }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value ? String(value) : "-"}</span></div>)}</CardContent></Card>;
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{Array.isArray(children) && children.length === 0 ? <Empty text="None recorded." /> : children}</CardContent></Card>;
}

function WorkOrderLine({ workOrder }: { workOrder: MaintenanceWorkOrder }) {
  return <Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: workOrder.id }} className="block rounded-md border p-3 text-sm hover:bg-muted/50"><div className="font-medium">{workOrder.workOrderNumber}</div><div className="text-xs text-muted-foreground">{workOrder.title}</div></Link>;
}

function ChartList({ title, items }: { title: string; items: Array<{ label: string; value: number; colour?: string }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-3">{items.map((item) => <div key={item.label} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm"><span>{item.label}</span><div className="h-2 rounded bg-muted"><div className="h-2 rounded" style={{ width: `${(item.value / max) * 100}%`, background: item.colour || "#2563eb" }} /></div><span className="text-right">{item.value}</span></div>)}</CardContent></Card>;
}

function Pagination({ page, pageCount, total, setPage }: { page: number; pageCount: number; total: number; setPage: (n: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{total} assets</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function assetForm(asset: MaintenanceAsset | undefined, care: ReturnType<typeof useCare>): Partial<MaintenanceAsset> {
  return asset ? { ...asset } : { homeId: care.activeFacilityId, assetName: "", categoryId: care.maintenanceAssetCategories.find((category) => category.active && !category.archivedAt)?.id || "", condition: "Good", operationalStatus: "Operational", assetStatus: "Active", criticality: "Medium", active: true };
}

function searchable(values: unknown[], search: string) {
  if (!search.trim()) return true;
  const term = search.toLowerCase();
  return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
}

function assetSortValue(a: MaintenanceAsset, b: MaintenanceAsset, sortBy: string, categories: MaintenanceAssetCategory[]) {
  const value = (asset: MaintenanceAsset) => sortBy === "assetName" ? asset.assetName : sortBy === "condition" ? asset.condition : sortBy === "replacementDate" ? asset.replacementDate || "9999-12-31" : sortBy === "category" ? categoryName(asset.categoryId, categories) : asset.assetNumber;
  return value(a).localeCompare(value(b));
}

function categoryName(id: string | undefined, categories: MaintenanceAssetCategory[]) {
  return categories.find((category) => category.id === id)?.name || "Uncategorised";
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function money(value?: number) {
  return value === undefined ? "-" : new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function toneClass(tone: string) {
  return ({ blue: "text-blue-600", green: "text-green-600", amber: "text-amber-600", red: "text-red-600", purple: "text-purple-600", slate: "text-slate-600" } as Record<string, string>)[tone] || "text-slate-600";
}

function toneBadge(tone: string) {
  return ({ green: "bg-green-100 text-green-800 hover:bg-green-100", amber: "bg-amber-100 text-amber-800 hover:bg-amber-100", red: "bg-red-100 text-red-800 hover:bg-red-100", slate: "bg-slate-100 text-slate-800 hover:bg-slate-100" } as Record<string, string>)[tone] || "";
}

function conditionClass(condition: MaintenanceAssetCondition) {
  if (condition === "Excellent" || condition === "Good") return "bg-green-100 text-green-800 hover:bg-green-100";
  if (condition === "Fair") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  return "bg-red-100 text-red-800 hover:bg-red-100";
}
