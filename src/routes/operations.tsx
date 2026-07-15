import { createFileRoute } from "@tanstack/react-router";
import { OperationsHub } from "@/components/operations/OperationsHub";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/operations")({
  head: () => ({ meta: [{ title: "Operations — CarePath" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  const { currentRole } = useCare();

  if (currentRole === "group_owner") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Operations is not available for Group Owner users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OperationsHub />;
}
