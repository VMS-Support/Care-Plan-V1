import { createFileRoute } from "@tanstack/react-router";
import { Search, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RecordDailyCareDialog } from "@/components/dailyCare/RecordDailyCareDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCare } from "@/lib/care/store";

export const Route = createFileRoute("/fast-care")({
  head: () => ({ meta: [{ title: "Fast Care - CarePath" }] }),
  component: FastCarePage,
});

function FastCarePage() {
  const { getResidentsForContext, operationalContext, recordDailyCare } = useCare();
  const [search, setSearch] = useState("");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const residents = useMemo(
    () =>
      getResidentsForContext()
        .filter((resident) => resident.status === "active")
        .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)),
    [getResidentsForContext],
  );
  const searchTerm = search.trim().toLowerCase();
  const matchingResidents = useMemo(
    () =>
      residents.filter((resident) =>
        !searchTerm ||
        `${resident.firstName} ${resident.lastName} ${resident.roomNumber || ""} ${resident.id}`
          .toLowerCase()
          .includes(searchTerm),
      ),
    [residents, searchTerm],
  );
  const selectedResident = residents.find((resident) => resident.id === selectedResidentId) || null;

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <UserCheck className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold">Fast Care</span>
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Record daily care</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Choose the resident, record the care, and save. The resident stays linked throughout.
        </p>
      </div>

      <Card className="border-primary/25">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl">1. Choose resident</CardTitle>
          <p className="text-sm text-muted-foreground">Search by name, room, or resident identifier.</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Start typing a resident's name or room"
              className="h-12 pl-10 text-base"
              autoFocus
            />
          </div>

          {selectedResident ? (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold">{selectedResident.firstName} {selectedResident.lastName}</div>
                <div className="text-sm text-muted-foreground">
                  Room {selectedResident.roomNumber || "not recorded"} · {selectedResident.id}
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedResidentId(null)}>Choose another resident</Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {matchingResidents.slice(0, 12).map((resident) => (
                <Button
                  key={resident.id}
                  variant="outline"
                  className="h-auto min-h-16 justify-start px-4 py-3 text-left"
                  onClick={() => setSelectedResidentId(resident.id)}
                >
                  <span>
                    <span className="block text-base font-semibold">{resident.firstName} {resident.lastName}</span>
                    <span className="block pt-0.5 text-sm font-normal text-muted-foreground">Room {resident.roomNumber || "not recorded"}</span>
                  </span>
                </Button>
              ))}
              {matchingResidents.length === 0 && (
                <p className="col-span-full rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                  No active resident matches that search.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={selectedResident ? "border-primary/25" : "opacity-60"}>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl">2. Record care</CardTitle>
          <p className="text-sm text-muted-foreground">Use clear care choices and save when finished.</p>
        </CardHeader>
        <CardContent className="pt-5">
          <Button size="lg" className="min-h-12 text-base" disabled={!selectedResident} onClick={() => setRecording(true)}>
            Record Daily Care
          </Button>
          {!selectedResident && <p className="mt-2 text-sm text-muted-foreground">Choose a resident first.</p>}
        </CardContent>
      </Card>

      {selectedResident && (
        <RecordDailyCareDialog
          open={recording}
          onOpenChange={setRecording}
          residentId={selectedResident.id}
          residentName={`${selectedResident.firstName} ${selectedResident.lastName}`}
          nursingHomeId={selectedResident.facilityId || operationalContext.nursingHomeId}
          wardId={operationalContext.wardIds[0]}
          roomId={selectedResident.roomNumber}
          onSave={(command) => {
            recordDailyCare(command);
            toast.success(`Daily care recorded for ${selectedResident.firstName} ${selectedResident.lastName}.`);
          }}
        />
      )}
    </main>
  );
}
