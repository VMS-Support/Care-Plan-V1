import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import {
  projectClinicalActivityFeed,
  getResidentHandoverActivity,
} from "@/lib/care/clinicalActivityFeed";
import {
  generatedHandoverRepository,
  type GeneratedHandover,
  type GeneratedHandoverItem,
} from "@/lib/care/generatedHandovers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const sectionFor = (kind: string) =>
  kind === "daily_note" || kind === "daily_care"
    ? "Daily Notes and Care Delivered"
    : kind === "assessment" || kind === "observation" || kind === "vital"
      ? "Assessments and Observations"
      : kind === "care_plan"
        ? "Care Plans and Care Actions"
        : kind === "incident"
          ? "Incidents and Escalations"
          : "Other Clinical Activity";
const localDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const displayDate = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" }).format(new Date(value));
const displayTime = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(value),
  );

export function GenerateHandover() {
  const care = useCare();
  const navigate = useNavigate();
  const now = new Date();
  const [from, setFrom] = useState(localDateTime(new Date(now.getTime() - 8 * 3600000)));
  const [to, setTo] = useState(localDateTime(now));
  const [shift, setShift] = useState<GeneratedHandover["shiftType"]>("morning");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const activity = useMemo(
    () =>
      projectClinicalActivityFeed({
        notes: care.notes,
        dailyCareRecords: care.dailyCareRecords,
        timelineEvents: care.timelineEvents,
        carePlanProblems: care.carePlanProblems,
        problemEvaluations: care.problemEvaluations,
        problemReviews: care.problemReviews,
        facilityId: care.activeFacilityId,
      }),
    [
      care.notes,
      care.dailyCareRecords,
      care.timelineEvents,
      care.carePlanProblems,
      care.problemEvaluations,
      care.problemReviews,
      care.activeFacilityId,
    ],
  );
  const residents = care.residents.filter(
    (r) =>
      (r.facilityId || care.activeFacilityId) === care.activeFacilityId &&
      `${r.firstName} ${r.lastName} ${r.roomNumber}`.toLowerCase().includes(search.toLowerCase()),
  );

  const generate = () => {
    if (!selected.length || !from || !to || Date.parse(from) >= Date.parse(to))
      return toast.error("Select residents and a valid date/time range.");
    const id = `gh-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const sections = selected.map((residentId, index) => {
      const r = care.residents.find((x) => x.id === residentId)!;
      return {
        id: `${id}-section-${index + 1}`,
        handoverId: id,
        residentId,
        residentName: `${r.firstName} ${r.lastName}`,
        preferredName: r.preferredName,
        room: r.roomNumber,
        residentIdentifier: r.residentNumber,
        residentDateOfBirth: r.dob,
        residentPhotoUrl: r.photoUrl,
        shiftSummary: "",
        nextShiftNotes: "",
        sortOrder: index + 1,
      };
    });
    const items: GeneratedHandoverItem[] = sections.flatMap((section) =>
      getResidentHandoverActivity({
        activity,
        residentId: section.residentId,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      }).map((entry, index) => ({
        id: `${id}-item-${section.residentId}-${index}`,
        handoverId: id,
        residentSectionId: section.id,
        residentId: section.residentId,
        sourceModule: entry.sourceModule,
        sourceEntityType: entry.eventType,
        sourceEntityId: entry.sourceRecordId,
        sourceEventId: entry.eventId,
        occurredAt: entry.occurredAt,
        title: entry.title,
        summary: entry.summary,
        sectionType: sectionFor(entry.eventType),
        authorName: entry.recordedBy,
        systemGenerated: true,
        manuallyAdded: false,
        important: false,
        followUpRequired: false,
        excluded: false,
        sortOrder: index + 1,
      })),
    );
    const count = generatedHandoverRepository.list().length + 1;
    generatedHandoverRepository.createDraft({
      id,
      referenceNumber: `HO-${new Date().getFullYear()}-${String(count).padStart(6, "0")}`,
      status: "draft",
      archived: false,
      shiftType: shift,
      periodFrom: new Date(from).toISOString(),
      periodTo: new Date(to).toISOString(),
      nursingHomeId: care.activeFacilityId,
      nursingHomeName: care.activeFacility.name,
      generatedByUserId: care.currentUser.id,
      generatedByName: care.currentUserName,
      generatedByRole: care.currentRole,
      generatedAt: createdAt,
      versionNumber: 1,
      residentIds: selected,
      residentCount: selected.length,
      createdAt,
      updatedAt: createdAt,
      sections,
      items,
    });
    navigate({ to: "/handovers/generated/$handoverId", params: { handoverId: id } });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Generate Handover</h1>
        <p className="text-sm text-muted-foreground">
          Create a shift handover from activity already recorded in CarePath.
        </p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>From date and time</Label>
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>To date and time</Label>
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label>Shift</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={shift}
                onChange={(e) => setShift(e.target.value as GeneratedHandover["shiftType"])}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Residents</Label>
              <span className="text-xs text-muted-foreground">{selected.length} selected</span>
            </div>
            <Input
              placeholder="Search residents or room"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
              {residents.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.includes(r.id)}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked ? [...current, r.id] : current.filter((id) => id !== r.id),
                      )
                    }
                  />
                  <span className="text-sm flex-1">
                    {r.firstName} {r.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">Room {r.roomNumber}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to="/handovers">Cancel</Link>
            </Button>
            <Button onClick={generate}>Generate Handover Preview</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GeneratedHandoverView({ handoverId }: { handoverId: string }) {
  const navigate = useNavigate();
  const [handover, setHandover] = useState(() => generatedHandoverRepository.getById(handoverId));
  if (!handover)
    return (
      <div className="p-8">
        <p>Handover not found.</p>
        <Button className="mt-4" asChild>
          <Link to="/handovers">Back to handovers</Link>
        </Button>
      </div>
    );
  const readonly = handover.status === "finalised";
  const updateNotes = (sectionId: string, value: string) =>
    setHandover({
      ...handover,
      sections: handover.sections.map((s) =>
        s.id === sectionId ? { ...s, nextShiftNotes: value } : s,
      ),
    });
  const save = () => {
    const saved = generatedHandoverRepository.updateDraft(handover);
    setHandover(saved);
    toast.success("Draft saved");
  };
  const finalise = () => {
    generatedHandoverRepository.updateDraft(handover);
    const saved = generatedHandoverRepository.finalise(handover.id);
    setHandover(saved);
    toast.success("Handover finalised");
    navigate({
      to: "/handovers/generated/$handoverId",
      params: { handoverId: saved.id },
      replace: true,
    });
  };
  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-5">
      <div className="flex justify-between gap-3 flex-wrap">
        <div>
          <div className="flex gap-2 items-center">
            <h1 className="text-2xl font-semibold">Generated Handover</h1>
            <Badge variant={readonly ? "default" : "secondary"} className="capitalize">
              {handover.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {handover.shiftType} shift · {displayDate(handover.periodFrom)},{" "}
            {displayTime(handover.periodFrom)}–{displayTime(handover.periodTo)} ·{" "}
            {handover.referenceNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/handovers">Back</Link>
          </Button>
          {!readonly && (
            <>
              <Button variant="outline" onClick={save}>
                Save Draft
              </Button>
              <Button onClick={finalise}>Finalise Handover</Button>
            </>
          )}
        </div>
      </div>
      {handover.sections.map((section) => {
        const sectionItems = handover.items.filter(
          (i) => i.residentSectionId === section.id && !i.excluded,
        );
        const groups = [...new Set(sectionItems.map((i) => i.sectionType))];
        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>
                {section.residentName}{" "}
                <span className="font-normal text-muted-foreground">— Room {section.room}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {groups.map((group) => (
                <section key={group}>
                  <h3 className="text-sm font-semibold border-b pb-1 mb-2">{group}</h3>
                  <div className="space-y-3">
                    {sectionItems
                      .filter((i) => i.sectionType === group)
                      .map((item) => (
                        <div key={item.id} className="text-sm">
                          <div className="font-medium">
                            {displayTime(item.occurredAt)} — {item.title}
                          </div>
                          <p>{item.summary}</p>
                          {item.authorName && (
                            <p className="text-xs text-muted-foreground">
                              Recorded by {item.authorName}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              ))}
              {!sectionItems.length && (
                <p className="text-sm text-muted-foreground">
                  No recorded clinical activity in this period.
                </p>
              )}
              <div>
                <Label>Next Shift Notes</Label>
                {readonly ? (
                  <p className="mt-1 rounded-md border bg-muted/30 p-3 text-sm min-h-12">
                    {section.nextShiftNotes || "No next-shift notes."}
                  </p>
                ) : (
                  <Textarea
                    value={section.nextShiftNotes}
                    onChange={(e) => updateNotes(section.id, e.target.value)}
                    placeholder="Add a short note for the next shift"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Generated by {handover.generatedByName} on{" "}
        {new Date(handover.generatedAt).toLocaleString("en-IE")}. Finalised handovers use this
        frozen snapshot and do not reload clinical activity.
      </p>
    </div>
  );
}
