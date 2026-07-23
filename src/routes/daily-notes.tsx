import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { getRltDomainForCarePlanProblem } from "@/lib/care/rlt";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mic, Activity, AlertCircle, Check, ChevronsUpDown, Eye, Search, X } from "lucide-react";
import { DAILY_NOTE_CATEGORY_OPTIONS, DAILY_NOTE_CATEGORY_STRUCTURED_FIELDS } from "@/lib/care/types";
import type { DailyNote, Resident } from "@/lib/care/types";

export const Route = createFileRoute("/daily-notes")({
  head: () => ({ meta: [{ title: "Daily Notes â€” CarePath" }] }),
  component: DailyNotesPage,
});

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DAILY_NOTE_CATEGORY_LABELS = new Map(DAILY_NOTE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const dailyNoteStructuredFields = ["mood", "foodIntake", "fluidIntake", "sleep", "behaviour"] as const;

function allowedFields(category: DailyNote["category"]) {
  return new Set(DAILY_NOTE_CATEGORY_STRUCTURED_FIELDS[category || "general"] || []);
}

function clearIrrelevantFields<T extends Partial<DailyNote>>(note: T, category: DailyNote["category"]): T {
  const allowed = allowedFields(category);
  const next = { ...note };
  dailyNoteStructuredFields.forEach((field) => {
    if (!allowed.has(field)) delete next[field];
  });
  return next;
}

function assignEnteredStructuredFields(target: Partial<DailyNote>, source: Partial<DailyNote>, category: DailyNote["category"]) {
  const allowed = allowedFields(category);
  dailyNoteStructuredFields.forEach((field) => {
    const value = source[field];
    if (!allowed.has(field) || !value || value === "not_recorded") return;
    const nextValue = typeof value === "string" ? value.trim() : value;
    if (nextValue) (target as any)[field] = nextValue;
  });
}

function categoryLabel(value?: DailyNote["category"] | string) {
  if (value === "intervention") return "From intervention";
  return DAILY_NOTE_CATEGORY_LABELS.get(value as DailyNote["category"]) || "General";
}

function displayValue(value?: string) {
  return !value || value === "not_recorded" ? "Not recorded" : value.replace("_", " ");
}

function hasStructuredValues(note: DailyNote) {
  return Boolean(note.mood || note.foodIntake || note.fluidIntake || note.sleep);
}

function noteCategory(note: DailyNote) {
  if (note.category) return note.category;
  if (note.linkedInterventionId || note.linkedInterventionLogId) return "intervention";
  return "general";
}

function notePreview(note: DailyNote) {
  const text = [note.observation, note.behaviour, note.additionalNotes].filter(Boolean).join(" ");
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

function startOfWeekKey() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function ResidentSearchSelect({
  residents,
  value,
  onChange,
}: {
  residents: Resident[];
  value: string;
  onChange: (residentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedResident = residents.find((resident) => resident.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selectedResident ? "" : "text-muted-foreground"}>
            {selectedResident
              ? `${selectedResident.firstName} ${selectedResident.lastName}`
              : "Choose resident"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search resident, room or ID..." />
          <CommandList>
            <CommandEmpty>No residents found.</CommandEmpty>
            <CommandGroup>
              {residents.map((resident) => {
                const residentName = `${resident.firstName} ${resident.lastName}`;
                return (
                  <CommandItem
                    key={resident.id}
                    value={`${residentName} ${resident.roomNumber || ""} ${resident.id}`}
                    onSelect={() => {
                      onChange(resident.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={`h-4 w-4 ${value === resident.id ? "opacity-100" : "opacity-0"}`} />
                    <span>{residentName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Room {resident.roomNumber || "-"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function NoteViewDialog({
  note,
  residentName,
  room,
  relatedCarePlan,
  open,
  onOpenChange,
}: {
  note: DailyNote | null;
  residentName: string;
  room: string;
  relatedCarePlan?: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!note) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Daily Note</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <div><span className="text-muted-foreground">Resident:</span> {residentName}</div>
            <div><span className="text-muted-foreground">Room:</span> {room}</div>
            <div><span className="text-muted-foreground">Date/time:</span> {new Date(note.date).toLocaleString("en-GB")}</div>
            <div><span className="text-muted-foreground">Recorded by:</span> {note.staff}</div>
            <div><span className="text-muted-foreground">Shift:</span> <span className="capitalize">{note.shift}</span></div>
            <div><span className="text-muted-foreground">Category:</span> {categoryLabel(noteCategory(note))}</div>
            <div>
              <span className="text-muted-foreground">Related Care Plan:</span>{" "}
              {relatedCarePlan ? (
                <Link
                  to="/residents/$id"
                  params={{ id: note.residentId }}
                  search={{ carePlanProblemId: relatedCarePlan.id }}
                  className="text-primary hover:underline"
                >
                  {relatedCarePlan.title}
                </Link>
              ) : (
                "None"
              )}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Observation</div>
            <p className="rounded-md border p-3 whitespace-pre-wrap">{note.observation || "No observation recorded."}</p>
          </div>
          {note.behaviour && (
            <div>
              <div className="font-medium mb-1">Behaviour</div>
              <p className="rounded-md border p-3 whitespace-pre-wrap">{note.behaviour}</p>
            </div>
          )}
          {hasStructuredValues(note) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              {note.mood && <span>Mood: {displayValue(note.mood)}</span>}
              {note.foodIntake && <span>Food: {displayValue(note.foodIntake)}</span>}
              {note.fluidIntake && <span>Fluids: {displayValue(note.fluidIntake)}</span>}
              {note.sleep && <span>Sleep: {displayValue(note.sleep)}</span>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewNote() {
  const { residents, carePlanProblems, addNote, currentUserName } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Omit<DailyNote, "id" | "date" | "staff">>({
    residentId: "",
    carePlanId: null,
    shift: "morning",
    category: "general",
    observation: "",
    additionalNotes: "",
  });
  const residentCarePlans = carePlanProblems.filter(
    (plan) => plan.residentId === f.residentId && plan.status === "active",
  );
  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => setF(s => ({ ...s, observation: (s.observation + " " + e.results[0][0].transcript).trim() }));
    rec.start();
    toast.info("Listening...");
  };
  const save = () => {
    if (!f.residentId) { toast.error("Choose a resident"); return; }
    if (!f.shift || !f.category) { toast.error("Shift and note category are required"); return; }
    if (!f.observation.trim()) { toast.error("Observation is required"); return; }
    const category = f.category || "general";
    const payload: Omit<DailyNote, "id"> = {
      residentId: f.residentId,
      carePlanId: f.carePlanId || null,
      shift: f.shift,
      category,
      observation: f.observation.trim(),
      date: new Date().toISOString(),
      staff: currentUserName,
    };
    assignEnteredStructuredFields(payload, f, category);
    addNote(payload);
    toast.success("Note saved");
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New Daily Note</Button></DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader><DialogTitle>Daily Note</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Resident *</Label>
            <ResidentSearchSelect
              residents={residents}
              value={f.residentId}
              onChange={(residentId) => setF({ ...f, residentId, carePlanId: null })}
            />
          </div>
          <div className="col-span-2">
            <Label>Related Care Plan</Label>
            <Select value={f.carePlanId || "none"} onValueChange={v => setF({ ...f, carePlanId: v === "none" ? null : v })} disabled={!f.residentId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {residentCarePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {getRltDomainForCarePlanProblem(plan)?.title || plan.category.replace(/_/g, " ")} - {plan.problemStatement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Shift *</Label>
            <Select value={f.shift} onValueChange={v => setF({ ...f, shift: v as DailyNote["shift"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note Category *</Label>
            <Select
              value={f.category || "general"}
              onValueChange={v => {
                const category = v as DailyNote["category"];
                setF(clearIrrelevantFields({ ...f, category }, category));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAILY_NOTE_CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between"><Label>Observation *</Label>
              <Button type="button" size="sm" variant="ghost" onClick={startVoice}><Mic className="h-4 w-4 mr-1" /> Voice</Button>
            </div>
            <Textarea
              rows={4}
              placeholder="Enter the main note, observation, care provided, concern or outcome..."
              value={f.observation}
              onChange={e => setF({ ...f, observation: e.target.value })}
            />
          </div>
          {allowedFields(f.category).size > 0 && (
            <div className="col-span-2 border-t pt-3 text-sm font-medium">Additional Information</div>
          )}
          {allowedFields(f.category).has("mood") && (
            <div>
              <Label>Mood</Label>
              <Select value={f.mood || "not_recorded"} onValueChange={v => setF({ ...f, mood: v as DailyNote["mood"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["not_recorded", "happy", "calm", "anxious", "withdrawn", "agitated"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {allowedFields(f.category).has("foodIntake") && (
            <div>
              <Label>Food Intake</Label>
              <Select value={f.foodIntake || "not_recorded"} onValueChange={v => setF({ ...f, foodIntake: v as DailyNote["foodIntake"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["not_recorded", "full", "most", "half", "little", "none"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {allowedFields(f.category).has("fluidIntake") && (
            <div>
              <Label>Fluid Intake</Label>
              <Select value={f.fluidIntake || "not_recorded"} onValueChange={v => setF({ ...f, fluidIntake: v as DailyNote["fluidIntake"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["not_recorded", "good", "moderate", "poor"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {allowedFields(f.category).has("sleep") && (
            <div>
              <Label>Sleep</Label>
              <Select value={f.sleep || "not_recorded"} onValueChange={v => setF({ ...f, sleep: v as DailyNote["sleep"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["not_recorded", "good", "broken", "poor"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {allowedFields(f.category).has("behaviour") && (
            <div className="col-span-2"><Label>Behaviour</Label><Textarea rows={2} placeholder="Enter any behaviour-related details..." value={f.behaviour || ""} onChange={e => setF({ ...f, behaviour: e.target.value })} /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save Daily Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DailyNotesPage() {
  const { notes, residents, carePlanProblems, currentUser, currentUserName } = useCare();
  const [search, setSearch] = useState("");
  const [residentFilter, setResidentFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [recordedByFilter, setRecordedByFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState<DailyNote | null>(null);

  const residentById = useMemo(() => new Map(residents.map((resident) => [resident.id, resident])), [residents]);
  const carePlanProblemById = useMemo(() => new Map(carePlanProblems.map((plan) => [plan.id, plan])), [carePlanProblems]);
  const wingOptions = useMemo(
    () => Array.from(new Set(residents.map((resident) => resident.wingId).filter(Boolean))).sort(),
    [residents],
  );
  const roomOptions = useMemo(
    () => Array.from(new Set(residents.map((resident) => resident.roomNumber).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [residents],
  );
  const staffOptions = useMemo(
    () => Array.from(new Set(notes.map((note) => note.staff).filter(Boolean))).sort(),
    [notes],
  );

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setSearch("");
    setResidentFilter("all");
    setWingFilter("all");
    setRoomFilter("all");
    setShiftFilter("all");
    setRecordedByFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const applyToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDateFrom(today);
    setDateTo(today);
    setPage(1);
  };

  const applyThisWeek = () => {
    setDateFrom(startOfWeekKey());
    setDateTo(new Date().toISOString().slice(0, 10));
    setPage(1);
  };

  const applyMyResidents = () => {
    setResidentFilter("all");
    setWingFilter("my_residents");
    setPage(1);
  };

  const applyMyNotes = () => {
    setRecordedByFilter(currentUserName);
    setPage(1);
  };

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes
      .filter((note) => {
        const resident = residentById.get(note.residentId);
        const noteDate = note.date.slice(0, 10);
        if (residentFilter !== "all" && note.residentId !== residentFilter) return false;
        if (wingFilter === "my_residents") {
          const isMine =
            resident?.keyWorkers?.namedNurse === currentUserName ||
            resident?.keyWorkers?.keyWorker === currentUserName ||
            (!!resident?.wingId && currentUser.assignedWings.includes(resident.wingId));
          if (!isMine) return false;
        } else if (wingFilter !== "all" && resident?.wingId !== wingFilter) {
          return false;
        }
        if (roomFilter !== "all" && resident?.roomNumber !== roomFilter) return false;
        if (shiftFilter !== "all" && note.shift !== shiftFilter) return false;
        if (recordedByFilter !== "all" && note.staff !== recordedByFilter) return false;
        if (categoryFilter !== "all" && noteCategory(note) !== categoryFilter) return false;
        if (dateFrom && noteDate < dateFrom) return false;
        if (dateTo && noteDate > dateTo) return false;
        if (query) {
          const haystack = [
            resident?.firstName,
            resident?.lastName,
            resident?.roomNumber,
            note.staff,
            note.shift,
            note.observation,
            note.behaviour,
            note.additionalNotes,
            note.mood,
            note.foodIntake,
            note.fluidIntake,
            note.sleep,
          ].filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [categoryFilter, currentUser.assignedWings, currentUserName, dateFrom, dateTo, notes, recordedByFilter, residentById, residentFilter, roomFilter, search, shiftFilter, wingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedNotes = filteredNotes.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedResident = selectedNote ? residentById.get(selectedNote.residentId) : undefined;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-6xl">
      <div className="flex justify-between items-end gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredNotes.length} shown · {notes.length} notes recorded
          </p>
        </div>
        <NewNote />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); resetPage(); }}
                placeholder="Search notes, resident, room, staff"
                className="pl-9"
              />
            </div>
            <Select value={residentFilter} onValueChange={(value) => { setResidentFilter(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Resident" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All residents</SelectItem>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>{resident.firstName} {resident.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={wingFilter} onValueChange={(value) => { setWingFilter(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Wing" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wings</SelectItem>
                <SelectItem value="my_residents">My residents</SelectItem>
                {wingOptions.map((wing) => <SelectItem key={wing} value={wing}>{wing}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={roomFilter} onValueChange={(value) => { setRoomFilter(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rooms</SelectItem>
                {roomOptions.map((room) => <SelectItem key={room} value={room}>Room {room}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={shiftFilter} onValueChange={(value) => { setShiftFilter(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Shift" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shifts</SelectItem>
                {(["morning", "afternoon", "night"] as const).map((shift) => <SelectItem key={shift} value={shift} className="capitalize">{shift}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={recordedByFilter} onValueChange={(value) => { setRecordedByFilter(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Recorded by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff</SelectItem>
                {staffOptions.map((staff) => <SelectItem key={staff} value={staff}>{staff}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="intervention">From intervention</SelectItem>
                {DAILY_NOTE_CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); resetPage(); }} aria-label="Date from" />
            <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); resetPage(); }} aria-label="Date to" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={applyToday}>Today</Button>
            <Button size="sm" variant="outline" onClick={applyThisWeek}>This Week</Button>
            <Button size="sm" variant="outline" onClick={applyMyResidents}>My Residents</Button>
            <Button size="sm" variant="outline" onClick={applyMyNotes}>My Notes</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3.5 w-3.5 mr-1" /> Clear filters</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {pagedNotes.map((note) => {
          const resident = residentById.get(note.residentId);
          const residentName = resident ? `${resident.firstName} ${resident.lastName}` : "Unknown resident";
          return (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <Link to="/residents/$id" params={{ id: note.residentId }} className="font-medium hover:underline">
                        {residentName}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">Room {resident?.roomNumber || "-"}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{note.shift}</Badge>
                      <Badge variant="outline" className="text-[10px]">{categoryLabel(noteCategory(note))}</Badge>
                      {note.linkedInterventionId && (
                        <Badge variant="outline" className="text-[10px] bg-info/10 text-info border-info/30 gap-1">
                          <Activity className="h-2.5 w-2.5" /> From intervention
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.date).toLocaleString("en-GB")} · {note.staff}
                    </p>
                    <p className="text-sm mt-2 line-clamp-2">{notePreview(note)}</p>
                    {hasStructuredValues(note) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                        {note.mood && <span>Mood: {displayValue(note.mood)}</span>}
                        {note.foodIntake && <span>Food: {displayValue(note.foodIntake)}</span>}
                        {note.fluidIntake && <span>Fluids: {displayValue(note.fluidIntake)}</span>}
                        {note.sleep && <span>Sleep: {displayValue(note.sleep)}</span>}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedNote(note)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {pagedNotes.length === 0 && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-8 justify-center border rounded-lg">
            <AlertCircle className="h-4 w-4" /> No daily notes match these filters.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredNotes.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
          {Math.min(safePage * pageSize, filteredNotes.length)} of {filteredNotes.length}
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</Button>
          <div className="text-sm tabular-nums">{safePage} / {totalPages}</div>
          <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next</Button>
        </div>
      </div>

      <NoteViewDialog
        note={selectedNote}
        residentName={selectedResident ? `${selectedResident.firstName} ${selectedResident.lastName}` : "Unknown resident"}
        room={selectedResident?.roomNumber || "-"}
        relatedCarePlan={(() => {
          if (!selectedNote) return null;
          const id = selectedNote.carePlanId || selectedNote.linkedProblemId || "";
          const problem = carePlanProblemById.get(id);
          if (problem) {
            const domain = getRltDomainForCarePlanProblem(problem);
            return { id: problem.id, title: `${domain?.title || problem.category.replace(/_/g, " ")} · ${problem.problemStatement}` };
          }
          return null;
        })()}
        open={!!selectedNote}
        onOpenChange={(open) => { if (!open) setSelectedNote(null); }}
      />
    </div>
  );
}

