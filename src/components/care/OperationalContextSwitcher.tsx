import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { Button } from "@/components/ui/button";

export function OperationalContextSwitcher() {
  const { operationalContext, setOperationalDate } = useCare();

  return (
    <div className="hidden lg:flex items-center">
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-7"
          aria-label="Previous day"
          onClick={() => setOperationalDate(shiftDate(operationalContext.operationalDate, -1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          aria-label="Operational date"
          onClick={() => setOperationalDate(new Date().toISOString().slice(0, 10))}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {formatOperationalDate(operationalContext.operationalDate)}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-7"
          aria-label="Next day"
          onClick={() => setOperationalDate(shiftDate(operationalContext.operationalDate, 1))}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function formatOperationalDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

function shiftDate(value: string, offsetDays: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}
