import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCare } from "@/lib/care/store";

type MaintenancePlaceholderPageProps = {
  title: string;
  description: string;
};

export function MaintenancePlaceholderPage({ title, description }: MaintenancePlaceholderPageProps) {
  const care = useCare();

  if (!care.canAccess("permission.manage")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You do not have permission to view this Maintenance section.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{title}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            This section will be implemented in a later phase.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
