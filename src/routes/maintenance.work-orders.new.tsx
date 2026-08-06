import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { WorkOrderForm } from "@/components/maintenance/WorkOrderForm";
import type { MaintenanceWorkOrderCategory, MaintenanceWorkOrderPriority, MaintenanceWorkOrderSource } from "@/lib/care/types";
import type { CorrectiveAction } from "@/domain/maintenance/correctiveActions";
import type { CreateWorkOrderInput } from "@/domain/maintenance/workOrders";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/maintenance/work-orders/new")({
  validateSearch: (search: Record<string, unknown>) => ({ correctiveActionId: typeof search.correctiveActionId === "string" ? search.correctiveActionId : undefined }),
  head: () => ({ meta: [{ title: "Create Work Order - ORITAS" }] }),
  component: NewWorkOrderRoute,
});

function NewWorkOrderRoute() {
  const care = useCare();
  const navigate = useNavigate();
  const { correctiveActionId } = Route.useSearch();
  const correctiveAction = correctiveActionId ? care.correctiveActions.find((item) => item.id === correctiveActionId && item.homeId === care.activeFacilityId) : undefined;
  const initialValues = correctiveAction ? workOrderPrefill(correctiveAction, care) : undefined;

  if (!care.canAccess("maintenance.work_orders.create")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You do not have permission to create Work Orders.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          <Link to="/maintenance/work-orders" className="hover:text-foreground">Work Orders</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Create Work Order</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create Work Order</h1>
        <p className="text-sm text-muted-foreground">Record the issue, location, priority and due date. The Work Order number is generated automatically.</p>
      </div>
      <WorkOrderForm
        mode="create"
        initialValues={initialValues}
        onCancel={() => correctiveAction ? navigate({ to: "/maintenance/corrective-actions/$id", params: { id: correctiveAction.id } }) : navigate({ to: "/maintenance/work-orders" })}
        onSubmit={(input) => {
          try {
            const record = care.addMaintenanceWorkOrder(input as CreateWorkOrderInput);
            toast.success(`${record.workOrderNumber} created`);
            navigate({ to: "/maintenance/work-orders/$workOrderId", params: { workOrderId: record.id } });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to create Work Order");
            throw error;
          }
        }}
      />
    </div>
  );
}

function workOrderPrefill(action: CorrectiveAction, care: ReturnType<typeof useCare>): Partial<CreateWorkOrderInput> {
  const categoryName = care.correctiveActionCategories.find((item) => item.id === action.categoryId)?.name || "";
  const category = categoryFor(categoryName);
  const priority = priorityFor(action.riskLevel, action.severity);
  const asset = care.maintenanceAssets.find((item) => item.id === action.assetId);
  const bed = care.beds.find((item) => String(item.id) === action.bedId);
  const contractorAllowed = action.responsibleContractorId && action.contractorComplianceSnapshot && ["COMPLIANT", "DUE_SOON"].includes(action.contractorComplianceSnapshot.state) && action.contractorComplianceSnapshot.blockers.length === 0;
  return {
    correctiveActionId: action.id,
    correctiveActionReference: action.referenceNumber,
    correctiveActionSourceLink: `/maintenance/corrective-actions/${action.id}`,
    correctiveActionEvidenceReferences: action.evidenceReferences || action.evidence?.map((item) => item.documentReference).filter((item): item is string => Boolean(item)) || [],
    homeId: action.homeId,
    title: `${action.referenceNumber} · ${action.title}`,
    description: [action.description, action.requiredAction ? `Required corrective action: ${action.requiredAction}` : "", action.sourceReferenceId ? `Source record: ${action.sourceReferenceId}` : ""].filter(Boolean).join("\n\n"),
    type: "CORRECTIVE",
    source: sourceFor(action.sourceType),
    category,
    subcategory: categoryName,
    priority,
    dueAt: action.dueDate ? `${action.dueDate}T17:00:00` : undefined,
    roomId: action.roomId || action.locationId,
    bedId: action.bedId,
    exactLocation: bed ? `Bed ${bed.label}` : undefined,
    assetId: action.assetId,
    affectedAssetDescription: asset ? `${asset.assetName} (${asset.assetNumber})` : undefined,
    contractorId: contractorAllowed ? action.responsibleContractorId : undefined,
    immediateRisk: action.severity === "CRITICAL" || ["CRITICAL", "EXTREME"].includes(action.riskLevel),
    immediateControlSummary: action.immediateControl,
    complianceImpact: ["CONTRACTOR", "CERTIFICATE", "COMPLIANCE", "AUDIT"].includes(action.sourceType),
    verificationRequired: action.verificationRequired,
  };
}

function priorityFor(risk: CorrectiveAction["riskLevel"], severity: CorrectiveAction["severity"]): MaintenanceWorkOrderPriority {
  if (severity === "CRITICAL" || ["CRITICAL", "EXTREME"].includes(risk)) return "CRITICAL";
  if (severity === "HIGH" || ["HIGH", "VERY_HIGH"].includes(risk)) return "HIGH";
  if (severity === "MODERATE" || risk === "MEDIUM") return "MEDIUM";
  return "LOW";
}

function categoryFor(name: string): MaintenanceWorkOrderCategory {
  const value = name.toLowerCase();
  if (value.includes("fire")) return "FIRE_SAFETY";
  if (value.includes("water")) return "WATER_SAFETY";
  if (value.includes("electrical")) return "ELECTRICAL";
  if (value.includes("clean")) return "CLEANING_HOUSEKEEPING_SUPPORT";
  if (value.includes("equipment") || value.includes("asset")) return "GENERAL_EQUIPMENT";
  return "OTHER";
}

function sourceFor(source: CorrectiveAction["sourceType"]): MaintenanceWorkOrderSource {
  if (source === "SAFETY_INSPECTION") return "SAFETY_INSPECTION";
  if (source === "PLANNED_MAINTENANCE") return "PLANNED_MAINTENANCE";
  if (["CLEANING_TASK", "HOUSEKEEPING_INSPECTION", "ROOM_READINESS"].includes(source)) return "HOUSEKEEPING";
  if (source === "AUDIT") return "AUDIT";
  if (source === "INCIDENT") return "INCIDENT";
  if (source === "CONTRACTOR") return "CONTRACTOR";
  if (["CERTIFICATE", "COMPLIANCE"].includes(source)) return "COMPLIANCE_INSPECTION";
  return "MAINTENANCE_TEAM";
}
