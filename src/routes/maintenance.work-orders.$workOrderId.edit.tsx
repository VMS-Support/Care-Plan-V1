import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { WorkOrderForm } from "@/components/maintenance/WorkOrderForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCare } from "@/lib/care/store";
import type { MaintenanceWorkOrder } from "@/lib/care/types";
import type { UpdateWorkOrderInput } from "@/domain/maintenance/workOrders";

export const Route = createFileRoute("/maintenance/work-orders/$workOrderId/edit")({
  head: () => ({ meta: [{ title: "Edit Work Order - NuCare" }] }),
  component: EditWorkOrderRoute,
});

function EditWorkOrderRoute() {
  const { workOrderId } = Route.useParams();
  const care = useCare();
  const navigate = useNavigate();
  const record = care.maintenanceWorkOrders.find((item) => item.id === workOrderId);

  if (!record) return <NotFoundState />;

  if (
    !care.canAccess("maintenance.work_orders.edit", { nursingHomeId: record.homeId }) ||
    !canViewWorkOrderRecord(care, record) ||
    record.archivedAt
  ) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You do not have permission to edit this Work Order.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          <Link to="/maintenance/work-orders" className="hover:text-foreground">Work Orders</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          <Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: record.id }} className="hover:text-foreground">
            {record.workOrderNumber}
          </Link>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Edit</span>
        </div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: record.id }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Work Order
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Work Order</h1>
        <p className="text-sm text-muted-foreground">{record.workOrderNumber} - {record.title}</p>
      </div>

      <WorkOrderForm
        mode="edit"
        workOrder={record}
        onCancel={() => navigate({ to: "/maintenance/work-orders/$workOrderId", params: { workOrderId: record.id } })}
        onSubmit={(input) => {
          try {
            care.updateMaintenanceWorkOrder(record.id, input as UpdateWorkOrderInput);
            toast.success("Work Order updated");
            navigate({ to: "/maintenance/work-orders/$workOrderId", params: { workOrderId: record.id } });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to update Work Order");
            throw error;
          }
        }}
      />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="py-12 text-center">
          <h1 className="text-lg font-semibold">Work Order Not Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">The Work Order may have been removed, or the link may be incorrect.</p>
          <Button asChild className="mt-4"><Link to="/maintenance/work-orders">Back to Work Orders</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function canViewWorkOrderRecord(care: ReturnType<typeof useCare>, record: MaintenanceWorkOrder) {
  if (care.canAccess("maintenance.work_orders.view_all_for_home", { nursingHomeId: record.homeId })) return true;
  if (record.assignedUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_assigned", { nursingHomeId: record.homeId })) return true;
  if (record.reportedByUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_reported_own", { nursingHomeId: record.homeId })) return true;
  return false;
}
