import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { WorkOrderForm } from "@/components/maintenance/WorkOrderForm";
import type { CreateWorkOrderInput } from "@/domain/maintenance/workOrders";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/maintenance/work-orders/new")({
  head: () => ({ meta: [{ title: "Create Work Order - NuCare" }] }),
  component: NewWorkOrderRoute,
});

function NewWorkOrderRoute() {
  const care = useCare();
  const navigate = useNavigate();

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
        onCancel={() => navigate({ to: "/maintenance/work-orders" })}
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
