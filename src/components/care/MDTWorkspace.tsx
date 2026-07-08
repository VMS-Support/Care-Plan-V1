import { Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, Download, ExternalLink, Filter, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { MDTNote, Resident } from "@/lib/care/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MEETING_TYPES = [
  "Weekly MDT",
  "GP Review",
  "Family Meeting",
  "Medication Review",
  "Care Plan Review",
  "Safeguarding",
  "Hospital Review",
  "Discharge Planning",
  "End of Life",
  "Behaviour Review",
  "Nutrition Review",
  "Falls Review",
  "Wound Review",
  "Other",
];

const ATTENDEE_OPTIONS = [
  "GP",
  "Consultant",
  "DON",
  "CNM",
  "Nurse",
  "HCA",
  "Dietitian",
  "Physiotherapist",
  "Occupational Therapist",
  "Speech & Language Therapist",
  "Pharmacist",
  "Psychologist",
  "Social Worker",
  "Family Representative",
  "Advocate",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextDay() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.toISOString().slice(0, 10)}T10:00`;
}

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthEnd() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
}

function weekEnd() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function preview(text = "", length = 120) {
  const cleaned = text.trim();
  if (!cleaned) return "Not recorded";
  return cleaned.length > length ? `${cleaned.slice(0, length)}...` : cleaned;
}

function residentName(resident?: Resident) {
  return resident ? `${resident.firstName} ${resident.lastName}` : "Unknown resident";
}

function attendeeList(note: MDTNote) {
  return note.attendeeList?.length ? note.attendeeList : note.attendees.split(",").map((item) => item.trim()).filter(Boolean);
}

function actionLines(note: MDTNote) {
  return (note.actionsAgreed || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function blankMeeting(currentUserName: string): Omit<MDTNote, "id"> {
  return {
    residentId: "",
    date: today(),
    meetingTime: "10:00",
    meetingType: "Weekly MDT",
    chairperson: currentUserName,
    attendees: "",
    attendeeList: [],
    discussion: "",
    recommendations: "",
    clinicalDecisions: "",
    actionsAgreed: "",
    followUpDate: "",
    authoredBy: currentUserName,
    linkedTaskIds: [],
  };
}

function MeetingDialog({
  note,
  trigger,
  onSaved,
}: {
  note?: MDTNote;
  trigger: React.ReactNode;
  onSaved?: (note: MDTNote) => void;
}) {
  const { residents, addMDTNote, updateMDTNote, currentUserName, currentRole } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<MDTNote, "id">>(() =>
    note
      ? {
          ...note,
          attendeeList: attendeeList(note),
          attendees: attendeeList(note).join(", "),
        }
      : blankMeeting(currentUserName),
  );

  const toggleAttendee = (attendee: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...(form.attendeeList || []), attendee])]
      : (form.attendeeList || []).filter((item) => item !== attendee);
    setForm({ ...form, attendeeList: next, attendees: next.join(", ") });
  };

  const save = () => {
    if (!form.residentId || !form.date || !form.discussion.trim()) {
      toast.error("Resident, meeting date and discussion are required");
      return;
    }
    const payload = {
      ...form,
      attendees: (form.attendeeList || []).join(", ") || form.attendees,
      authoredBy: form.authoredBy || currentUserName,
      role: form.role || currentRole,
      updatedAt: note ? new Date().toISOString() : form.updatedAt,
      updatedBy: note ? currentUserName : form.updatedBy,
    };
    if (note) {
      updateMDTNote(note.id, payload);
      toast.success("MDT meeting updated");
      onSaved?.({ ...note, ...payload });
    } else {
      const created = addMDTNote(payload);
      toast.success("MDT meeting recorded");
      onSaved?.(created);
      setForm(blankMeeting(currentUserName));
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{note ? "Edit MDT Meeting" : "New MDT Meeting"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Resident *</Label>
            <Select value={form.residentId || ""} onValueChange={(residentId) => setForm({ ...form, residentId })}>
              <SelectTrigger>
                <SelectValue placeholder="Select resident" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.firstName} {resident.lastName} - Room {resident.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Meeting Date *</Label>
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Meeting Time</Label>
              <Input type="time" value={form.meetingTime || ""} onChange={(event) => setForm({ ...form, meetingTime: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Meeting Type</Label>
            <Select value={form.meetingType || "Weekly MDT"} onValueChange={(meetingType) => setForm({ ...form, meetingType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Chairperson</Label>
            <Input value={form.chairperson || ""} onChange={(event) => setForm({ ...form, chairperson: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Attendees</Label>
            <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-3">
              {ATTENDEE_OPTIONS.map((attendee) => (
                <label key={attendee} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(form.attendeeList || []).includes(attendee)}
                    onCheckedChange={(checked) => toggleAttendee(attendee, checked === true)}
                  />
                  {attendee}
                </label>
              ))}
            </div>
            <Input
              placeholder="Other attendees"
              value={form.attendees}
              onChange={(event) => setForm({ ...form, attendees: event.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Discussion *</Label>
            <Textarea value={form.discussion} onChange={(event) => setForm({ ...form, discussion: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Recommendations</Label>
            <Textarea value={form.recommendations} onChange={(event) => setForm({ ...form, recommendations: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Clinical Decisions</Label>
            <Textarea value={form.clinicalDecisions || ""} onChange={(event) => setForm({ ...form, clinicalDecisions: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Actions Agreed</Label>
            <Textarea
              placeholder="One action per line"
              value={form.actionsAgreed || ""}
              onChange={(event) => setForm({ ...form, actionsAgreed: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Review Date</Label>
            <Input type="date" value={form.followUpDate || ""} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{note ? "Save Changes" : "Create MDT Meeting"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MDTWorkspace() {
  const {
    mdtNotes,
    residents,
    tasks,
    addTask,
    updateMDTNote,
    wings,
    currentUserName,
    currentRole,
    filteredResidentIds,
  } = useCare();
  const [filters, setFilters] = useState({
    residentId: "all",
    wingId: "all",
    room: "",
    meetingType: "all",
    from: "",
    to: "",
    attendee: "all",
    chairperson: "all",
    recordedBy: "all",
    search: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const residentById = useMemo(() => new Map(residents.map((resident) => [resident.id, resident])), [residents]);
  const filteredResidentIdSet = useMemo(() => {
    if (!Array.isArray(filteredResidentIds)) return new Set<string>();
    return new Set(filteredResidentIds.map((id) => String(id)));
  }, [filteredResidentIds]);
  const selected = selectedId ? mdtNotes.find((note) => note.id === selectedId) || null : null;

  const chairpeople = useMemo(
    () => Array.from(new Set(mdtNotes.map((note) => note.chairperson || note.authoredBy).filter(Boolean))).sort(),
    [mdtNotes],
  );
  const authors = useMemo(
    () => Array.from(new Set(mdtNotes.map((note) => note.authoredBy).filter(Boolean))).sort(),
    [mdtNotes],
  );

  const filtered = useMemo(() => {
    return mdtNotes
      .filter((note) => {
        const resident = residentById.get(note.residentId);
        const attendees = attendeeList(note);
        const residentMatches =
          filteredResidentIdSet.size === 0 || filteredResidentIdSet.has(String(note.residentId));
        if (note.residentId && !residentMatches) return false;
        if (filters.residentId !== "all" && note.residentId !== filters.residentId) return false;
        if (filters.wingId !== "all" && resident?.wingId !== filters.wingId) return false;
        if (filters.room && !resident?.roomNumber.toLowerCase().includes(filters.room.toLowerCase())) return false;
        if (filters.meetingType !== "all" && (note.meetingType || "Weekly MDT") !== filters.meetingType) return false;
        if (filters.from && note.date < filters.from) return false;
        if (filters.to && note.date > filters.to) return false;
        if (filters.attendee !== "all" && !attendees.includes(filters.attendee)) return false;
        if (filters.chairperson !== "all" && (note.chairperson || note.authoredBy) !== filters.chairperson) return false;
        if (filters.recordedBy !== "all" && note.authoredBy !== filters.recordedBy) return false;
        if (filters.search.trim()) {
          const haystack = [
            residentName(resident),
            note.meetingType,
            note.discussion,
            note.recommendations,
            note.clinicalDecisions,
            note.actionsAgreed,
            attendees.join(" "),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(filters.search.trim().toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => `${b.date} ${b.meetingTime || ""}`.localeCompare(`${a.date} ${a.meetingTime || ""}`));
  }, [filteredResidentIdSet, filters, mdtNotes, residentById]);

  const createTaskFromAction = (note: MDTNote, action: string) => {
    const task = addTask({
      residentId: note.residentId,
      title: action,
      description: `Follow-up from ${note.meetingType || "MDT"} meeting on ${note.date}`,
      assignedTo: "GP",
      assignedToType: "role",
      assignedRole: "gp",
      dueDate: nextDay(),
      status: "pending",
      category: "clinical",
      taskType: "MDT Follow-up",
      priority: "normal",
      linkedMDTNoteId: note.id,
      createdAt: new Date().toISOString(),
      createdBy: currentUserName,
    });
    updateMDTNote(note.id, { linkedTaskIds: [...(note.linkedTaskIds || []), task.id] });
    toast.success("Follow-up task created");
  };

  const setQuickRange = (from: string, to: string) => setFilters({ ...filters, from, to });

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MDT</h1>
          <p className="text-sm text-muted-foreground mt-1">Multidisciplinary meetings, decisions and follow-up actions</p>
        </div>
        <MeetingDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New MDT Meeting
            </Button>
          }
          onSaved={(note) => setSelectedId(note.id)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Users} label="Meetings" value={filtered.length} />
        <Metric icon={CalendarDays} label="This Week" value={mdtNotes.filter((note) => note.date >= today() && note.date <= weekEnd()).length} />
        <Metric icon={ClipboardList} label="Actions Agreed" value={filtered.reduce((total, note) => total + actionLines(note).length, 0)} />
        <Metric icon={ClipboardList} label="Linked Tasks" value={tasks.filter((task) => task.linkedMDTNoteId).length} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            <Select value={filters.residentId} onValueChange={(residentId) => setFilters({ ...filters, residentId })}>
              <SelectTrigger><SelectValue placeholder="Resident" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All residents</SelectItem>
                {residents.map((resident) => <SelectItem key={resident.id} value={resident.id}>{resident.firstName} {resident.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.wingId} onValueChange={(wingId) => setFilters({ ...filters, wingId })}>
              <SelectTrigger><SelectValue placeholder="Wing" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wings</SelectItem>
                {wings.map((wing) => <SelectItem key={wing.id} value={wing.id}>{wing.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Room" value={filters.room} onChange={(event) => setFilters({ ...filters, room: event.target.value })} />
            <Select value={filters.meetingType} onValueChange={(meetingType) => setFilters({ ...filters, meetingType })}>
              <SelectTrigger><SelectValue placeholder="Meeting type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {MEETING_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
            <Input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
            <Select value={filters.attendee} onValueChange={(attendee) => setFilters({ ...filters, attendee })}>
              <SelectTrigger><SelectValue placeholder="Attendee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All attendees</SelectItem>
                {ATTENDEE_OPTIONS.map((attendee) => <SelectItem key={attendee} value={attendee}>{attendee}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.chairperson} onValueChange={(chairperson) => setFilters({ ...filters, chairperson })}>
              <SelectTrigger><SelectValue placeholder="Chairperson" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All chairs</SelectItem>
                {chairpeople.map((chairperson) => <SelectItem key={chairperson} value={chairperson}>{chairperson}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Select value={filters.recordedBy} onValueChange={(recordedBy) => setFilters({ ...filters, recordedBy })}>
              <SelectTrigger className="md:w-52"><SelectValue placeholder="Recorded by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All recorders</SelectItem>
                {authors.map((author) => <SelectItem key={author} value={author}>{author}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search resident, meeting type, discussion, recommendations or attendees" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            </div>
            <Button variant="outline" onClick={() => setQuickRange(today(), today())}>Today</Button>
            <Button variant="outline" onClick={() => setQuickRange(today(), weekEnd())}>This Week</Button>
            <Button variant="outline" onClick={() => setQuickRange(monthStart(), monthEnd())}>This Month</Button>
            <Button variant="outline" onClick={() => setFilters({ ...filters, residentId: "all" })}>My Residents</Button>
            <Button variant="ghost" onClick={() => setFilters({ residentId: "all", wingId: "all", room: "", meetingType: "all", from: "", to: "", attendee: "all", chairperson: "all", recordedBy: "all", search: "" })}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtered.map((note) => {
          const resident = residentById.get(note.residentId);
          const attendees = attendeeList(note);
          const actions = actionLines(note);
          return (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{residentName(resident)}</h3>
                      <Badge variant="outline">{note.meetingType || "Weekly MDT"}</Badge>
                      <Badge variant="outline">{note.date}{note.meetingTime ? ` ${note.meetingTime}` : ""}</Badge>
                    </div>
                    <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-3">
                      <span>Room {resident?.roomNumber || "N/A"}</span>
                      <span>Chair: {note.chairperson || note.authoredBy}</span>
                      <span>{attendees.length} attendee{attendees.length === 1 ? "" : "s"}</span>
                    </div>
                    <p className="text-sm"><span className="text-muted-foreground">Discussion:</span> {preview(note.discussion)}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Recommendations:</span> {preview(note.recommendations)}</p>
                    <div className="text-xs text-muted-foreground">{actions.length} action{actions.length === 1 ? "" : "s"} agreed</div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button variant="outline" size="sm" onClick={() => setSelectedId(note.id)}>Open</Button>
                    <MeetingDialog note={note} trigger={<Button variant="outline" size="sm">Edit</Button>} onSaved={(updated) => setSelectedId(updated.id)} />
                    <Link to="/residents/$id" params={{ id: note.residentId }}>
                      <Button variant="outline" size="sm"><ExternalLink className="mr-1 h-3.5 w-3.5" />Resident</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No MDT meetings recorded.</h3>
              <div className="mt-4">
                <MeetingDialog trigger={<Button>New MDT Meeting</Button>} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selected?.meetingType || "MDT Meeting"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <MeetingDetail
              note={selected}
              resident={residentById.get(selected.residentId)}
              tasks={tasks.filter((task) => task.linkedMDTNoteId === selected.id || selected.linkedTaskIds?.includes(task.id))}
              onCreateTask={createTaskFromAction}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Export PDF</Button>
            <Button onClick={() => setSelectedId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function MeetingDetail({
  note,
  resident,
  tasks,
  onCreateTask,
}: {
  note: MDTNote;
  resident?: Resident;
  tasks: { id: string; title: string; status: string; dueDate: string; assignedTo: string }[];
  onCreateTask: (note: MDTNote, action: string) => void;
}) {
  const attendees = attendeeList(note);
  const actions = actionLines(note);
  return (
    <div className="space-y-5">
      <section className="grid gap-2 rounded-md border p-4 text-sm md:grid-cols-2">
        <div><span className="text-muted-foreground">Resident:</span> {residentName(resident)}</div>
        <div><span className="text-muted-foreground">Room:</span> {resident?.roomNumber || "N/A"}</div>
        <div><span className="text-muted-foreground">Date:</span> {note.date}{note.meetingTime ? ` ${note.meetingTime}` : ""}</div>
        <div><span className="text-muted-foreground">Chairperson:</span> {note.chairperson || note.authoredBy}</div>
        <div><span className="text-muted-foreground">Recorded by:</span> {note.authoredBy}</div>
        <div><span className="text-muted-foreground">Next review:</span> {note.followUpDate || "Not set"}</div>
        <div className="md:col-span-2"><span className="text-muted-foreground">Attendees:</span> {attendees.join(", ") || "Not recorded"}</div>
      </section>
      <DetailSection title="Discussion" content={note.discussion} />
      <DetailSection title="Recommendations" content={note.recommendations} />
      <DetailSection title="Clinical Decisions" content={note.clinicalDecisions} />
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Actions</h3>
        {actions.length > 0 ? (
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <span>{action}</span>
                <Button size="sm" variant="outline" onClick={() => onCreateTask(note, action)}>Create Task</Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No actions agreed.</p>
        )}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Linked Tasks</h3>
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-muted-foreground">Assigned to {task.assignedTo} · Due {task.dueDate} · {task.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No linked tasks yet.</p>
        )}
      </section>
      <section className="rounded-md border p-4 text-sm">
        <h3 className="mb-2 font-semibold">History</h3>
        <div className="text-muted-foreground">Created by {note.createdBy || note.authoredBy} on {note.createdAt || note.date}</div>
        {note.lastModifiedAt && <div className="text-muted-foreground">Last edited by {note.lastModifiedBy} on {note.lastModifiedAt}</div>}
      </section>
    </div>
  );
}

function DetailSection({ title, content }: { title: string; content?: string }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="whitespace-pre-wrap rounded-md border p-3 text-sm text-muted-foreground">{content?.trim() || "Not recorded"}</p>
    </section>
  );
}
