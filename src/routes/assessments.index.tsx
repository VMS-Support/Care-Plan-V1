import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import { getRltDomainForAssessment } from "@/lib/care/rlt";
import { deriveStatus, riskBadgeCls } from "@/lib/care/assessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  Layers,
  Search,
  ShieldAlert,
  UserCheck,
  Printer,
} from "lucide-react";
import type { Assessment, AssessmentType } from "@/lib/care/types";

export const Route = createFileRoute("/assessments/")({
  head: () => ({ meta: [{ title: "Assessment Work Queue - CarePath" }] }),
  component: AssessmentsList,
});

type QueueStatus = "due" | "overdue" | "completed";
type ViewMode =
  | "due_overdue"
  | "all_active"
  | "completed"
  | "draft_in_progress"
  | "high_risk"
  | "my_assigned"
  | "by_resident"
  | "by_assessment_type";

type QueueGroupKey =
  | "overdue_critical"
  | "high_risk_due_soon"
  | "due_this_week"
  | "routine_scheduled";

interface RowModel {
  assessment: Assessment;
  residentName: string;
  roomNumber: string;
  wingId?: string;
  dueDate: string;
  status: QueueStatus;
}

type ResidentQueueGroupKey = "overdue" | "due_today" | "due_this_week" | "scheduled";

interface ResidentQueueItem {
  residentId: string;
  residentName: string;
  roomNumber: string;
  rows: RowModel[];
  group: ResidentQueueGroupKey;
  highestPriority: RowModel;
  highestRisk: Assessment["riskLevel"];
  oldestDueDate: string;
}

const ALL_TYPES: AssessmentType[] = [
  "abbey_pain",
  "waterlow",
  "barthel",
  "must",
  "mna",
  "mmse",
  "four_at",
  "falls",
  "continence",
  "pain_chart",
  "cornell",
  "gds15",
  "abc",
  "abs",
  "norton",
  "nutrition",
  "pinch_me",
];

const CORE_TYPES: AssessmentType[] = ["waterlow", "barthel", "abbey_pain", "must", "falls", "mmse"];

const CATEGORY_FILTERS: Array<{ id: string; label: string; types: AssessmentType[] }> = [
  { id: "mobility", label: "Mobility", types: ["barthel"] },
  { id: "pressure_care", label: "Pressure Care", types: ["waterlow", "norton"] },
  { id: "nutrition", label: "Nutrition", types: ["must", "mna", "nutrition"] },
  { id: "cognition", label: "Cognition", types: ["mmse", "four_at"] },
  { id: "falls_risk", label: "Falls Risk", types: ["falls"] },
  { id: "pain", label: "Pain", types: ["abbey_pain", "pain_chart"] },
  { id: "behaviour", label: "Behaviour", types: ["abc", "abs", "cornell", "gds15"] },
  { id: "continence", label: "Continence", types: ["continence"] },
  { id: "safety", label: "Safety", types: ["four_at", "norton", "falls"] },
];

function toDateKey(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function getStatus(a: Assessment): QueueStatus {
  const ds = deriveStatus(a);
  if (ds === "overdue") return "overdue";
  if (ds === "due") return "due";
  return "completed";
}

function riskOrder(level: Assessment["riskLevel"]) {
  if (level === "very_high") return 4;
  if (level === "high") return 3;
  if (level === "moderate") return 2;
  if (level === "low") return 1;
  return 0;
}

function statusClass(status: QueueStatus) {
  if (status === "overdue") return "bg-destructive/10 text-destructive border-destructive/30";
  if (status === "due") return "bg-warning/15 text-warning-foreground border-warning/40";
  return "bg-success/10 text-success border-success/25";
}

function statusLabel(status: QueueStatus) {
  if (status === "overdue") return "Overdue";
  if (status === "due") return "Due";
  return "Completed";
}

function dueText(dueDate: string, status: QueueStatus, todayKey: string) {
  if (!dueDate) return "No Due Date";
  if (status === "overdue") return `Overdue · ${dueDate}`;
  if (dueDate === todayKey) return "Due Today";
  return `Due ${dueDate}`;
}

function daysAgoLabel(dueDate: string, todayKey: string) {
  if (!dueDate) return "No due date";
  const diff = Math.floor((new Date(todayKey).getTime() - new Date(dueDate).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1) return `${diff} days ago`;
  const future = Math.abs(diff);
  if (future === 1) return "Tomorrow";
  return `In ${future} days`;
}

function priorityRank(row: RowModel) {
  const statusRank = row.status === "overdue" ? 0 : row.status === "due" ? 1 : 2;
  return statusRank * 100 - riskOrder(row.assessment.riskLevel) * 10;
}

function residentQueueGroup(rows: RowModel[], todayKey: string): ResidentQueueGroupKey {
  if (rows.some((row) => row.status === "overdue")) return "overdue";
  if (rows.some((row) => row.dueDate === todayKey)) return "due_today";
  if (
    rows.some((row) => {
      if (!row.dueDate) return false;
      const diff = Math.floor((new Date(row.dueDate).getTime() - new Date(todayKey).getTime()) / 86400000);
      return diff <= 7;
    })
  ) return "due_this_week";
  return "scheduled";
}

function queueGroup(row: RowModel, todayKey: string): QueueGroupKey {
  const highRisk = row.assessment.riskLevel === "high" || row.assessment.riskLevel === "very_high";
  if (row.status === "overdue") return "overdue_critical";
  if (highRisk && row.status === "due") return "high_risk_due_soon";

  if (row.status === "due") {
    const diff = row.dueDate
      ? Math.floor((new Date(row.dueDate).getTime() - new Date(todayKey).getTime()) / 86400000)
      : 999;
    if (diff <= 7) return "due_this_week";
  }

  return "routine_scheduled";
}

function QueueTable({
  rows,
  todayKey,
  onOpenAssessment,
}: {
  rows: RowModel[];
  todayKey: string;
  onOpenAssessment: (assessmentId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="text-left p-3">Resident</th>
            <th className="text-left p-3">Assessment</th>
            <th className="text-left p-3">Risk Level</th>
            <th className="text-left p-3">Due Date</th>
            <th className="text-left p-3">Assigned To</th>
            <th className="text-left p-3">Progress</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={row.assessment.id}
              className="hover:bg-muted/30 cursor-pointer"
              onClick={() => onOpenAssessment(row.assessment.id)}
              title="Open assessment details"
            >
              <td className="p-3">
                <div className="font-medium text-foreground">{row.residentName}</div>
                <div className="text-xs text-muted-foreground">Room {row.roomNumber || "-"}</div>
              </td>
              <td className="p-3">
                <div>{assessmentMeta[row.assessment.type].name}</div>
                {getRltDomainForAssessment(row.assessment.type) && (
                  <div className="text-xs text-muted-foreground">
                    {getRltDomainForAssessment(row.assessment.type)?.shortLabel}
                  </div>
                )}
              </td>
              <td className="p-3">
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${riskBadgeCls(row.assessment.riskLevel)}`}
                >
                  {row.assessment.riskLevel.replace("_", " ")}
                </Badge>
              </td>
              <td className="p-3">
                <span
                  className={
                    row.status === "overdue"
                      ? "font-semibold text-destructive"
                      : row.status === "due"
                        ? "font-medium text-warning-foreground"
                        : "text-muted-foreground"
                  }
                >
                  {dueText(row.dueDate, row.status, todayKey)}
                </span>
              </td>
              <td className="p-3 text-xs">{row.assessment.assignedToName || "Unassigned"}</td>
              <td className="p-3">
                <Badge variant="outline" className={`text-[10px] ${statusClass(row.status)}`}>
                  {statusLabel(row.status)}
                </Badge>
              </td>
              <td className="p-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <Link
                    to="/residents/$id"
                    params={{ id: row.assessment.residentId }}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Resident
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    to="/assessments/new/$residentId"
                    params={{ residentId: row.assessment.residentId }}
                    search={{ type: row.assessment.type } as any}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Start Assessment
                  </Link>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                No assessments match this view and filter selection.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AssessmentQueueFilters({
  search,
  setSearch,
  categoryF,
  setCategoryF,
  typeF,
  setTypeF,
  statusF,
  setStatusF,
  riskF,
  setRiskF,
  assignedF,
  setAssignedF,
  wingF,
  setWingF,
  roomF,
  setRoomF,
  users,
  wings,
  rooms,
  onReset,
}: {
  search: string;
  setSearch: (value: string) => void;
  categoryF: string;
  setCategoryF: (value: string) => void;
  typeF: AssessmentType | "all";
  setTypeF: (value: AssessmentType | "all") => void;
  statusF: QueueStatus | "all";
  setStatusF: (value: QueueStatus | "all") => void;
  riskF: Assessment["riskLevel"] | "all";
  setRiskF: (value: Assessment["riskLevel"] | "all") => void;
  assignedF: string;
  setAssignedF: (value: string) => void;
  wingF: string;
  setWingF: (value: string) => void;
  roomF: string;
  setRoomF: (value: string) => void;
  users: { id: string; name: string }[];
  wings: { id: string; name: string }[];
  rooms: string[];
  onReset: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              className="pl-8 h-9"
              placeholder="Resident search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={wingF} onValueChange={setWingF}>
            <SelectTrigger><SelectValue placeholder="Wing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wing: All</SelectItem>
              {wings.map((wing) => <SelectItem key={wing.id} value={wing.id}>{wing.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={roomF} onValueChange={setRoomF}>
            <SelectTrigger><SelectValue placeholder="Room" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Room: All</SelectItem>
              {rooms.map((room) => <SelectItem key={room} value={room}>Room {room}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <Select
            value={categoryF}
            onValueChange={(value) => {
              setCategoryF(value);
              setTypeF("all");
            }}
          >
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Category: All</SelectItem>
              {CATEGORY_FILTERS.map((category) => (
                <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeF} onValueChange={(value) => setTypeF(value as AssessmentType | "all")}>
            <SelectTrigger><SelectValue placeholder="Assessment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Assessment: All</SelectItem>
              {(categoryF === "all" ? ALL_TYPES : CATEGORY_FILTERS.find((c) => c.id === categoryF)?.types || []).map((type) => (
                <SelectItem key={type} value={type}>{assessmentMeta[type].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskF} onValueChange={(value) => setRiskF(value as Assessment["riskLevel"] | "all")}>
            <SelectTrigger><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Risk: All</SelectItem>
              <SelectItem value="very_high">Very High</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusF} onValueChange={(value) => setStatusF(value as QueueStatus | "all")}>
            <SelectTrigger><SelectValue placeholder="Progress" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Progress: All Open</SelectItem>
              <SelectItem value="due">Due</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assignedF} onValueChange={setAssignedF}>
            <SelectTrigger><SelectValue placeholder="Assigned To" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Assigned To: All</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((user) => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onReset}>Reset Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResidentAssessmentCard({ item, todayKey }: { item: ResidentQueueItem; todayKey: string }) {
  const firstType = item.highestPriority.assessment.type;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-base">{item.residentName}</CardTitle>
            <div className="text-xs text-muted-foreground mt-1">Room {item.roomNumber || "-"}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{item.rows.length} Assessment{item.rows.length === 1 ? "" : "s"} Due</Badge>
            <Badge variant="outline" className={`capitalize ${riskBadgeCls(item.highestRisk)}`}>
              {item.highestRisk.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3 text-sm">
          <div className="rounded-md border p-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Highest Priority</div>
            <div className="font-medium mt-1">{assessmentMeta[item.highestPriority.assessment.type].name}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Highest Risk</div>
            <div className="font-medium capitalize mt-1">{item.highestRisk.replace("_", " ")}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Oldest Due</div>
            <div className="font-medium mt-1">{daysAgoLabel(item.oldestDueDate, todayKey)}</div>
          </div>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="details">
            <AccordionTrigger className="text-sm">Assessments Due</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {item.rows.map((row) => (
                  <div key={row.assessment.id} className="rounded-md border p-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-medium">{assessmentMeta[row.assessment.type].name}</div>
                      <div className="text-xs text-muted-foreground">
                        {dueText(row.dueDate, row.status, todayKey)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] capitalize ${riskBadgeCls(row.assessment.riskLevel)}`}>
                        {row.assessment.riskLevel.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusClass(row.status)}`}>
                        {row.status === "overdue" ? "Overdue" : "Due"}
                      </Badge>
                      <Link to="/assessments/new/$residentId" params={{ residentId: row.assessment.residentId }} search={{ type: row.assessment.type } as any}>
                        <Button size="sm" variant="outline">
                          {row.assessment.status === "draft" || row.assessment.status === "in_progress" ? "Continue Assessment" : "Start Assessment"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap gap-2">
          <Link to="/residents/$id" params={{ id: item.residentId }}>
            <Button variant="outline">Open Resident</Button>
          </Link>
          <Link to="/residents/$id/assessments" params={{ id: item.residentId }} search={{ type: firstType } as any}>
            <Button>Start Assessment</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentWorkQueue({
  groups,
  todayKey,
}: {
  groups: Record<ResidentQueueGroupKey, ResidentQueueItem[]>;
  todayKey: string;
}) {
  const sections: { key: ResidentQueueGroupKey; label: string; empty: string }[] = [
    { key: "overdue", label: "Overdue", empty: "No overdue assessments." },
    { key: "due_today", label: "Due Today", empty: "No assessments due today." },
    { key: "due_this_week", label: "Due This Week", empty: "No assessments due this week." },
    { key: "scheduled", label: "Scheduled", empty: "All residents are up to date." },
  ];
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section key={section.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</h2>
            <Badge variant="outline">{groups[section.key].length}</Badge>
          </div>
          {groups[section.key].length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">{section.empty}</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {groups[section.key].map((item) => (
                <ResidentAssessmentCard key={item.residentId} item={item} todayKey={todayKey} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function AssessmentsList() {
  const navigate = useNavigate();
  const { assessments, residents, users, wings, currentRole, currentUserName } = useCare();

  const [roleView, setRoleView] = useState<"nurse" | "governance">("nurse");
  const [viewMode, setViewMode] = useState<ViewMode>("due_overdue");
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState<AssessmentType | "all">("all");
  const [statusF, setStatusF] = useState<QueueStatus | "all">("all");
  const [riskF, setRiskF] = useState<Assessment["riskLevel"] | "all">("all");
  const [categoryF, setCategoryF] = useState<string>("all");
  const [assignedF, setAssignedF] = useState("all");
  const [wingF, setWingF] = useState("all");
  const [roomF, setRoomF] = useState("all");

  const isGovernanceRole = currentRole === "cnm" || currentRole === "don";
  const todayKey = new Date().toISOString().slice(0, 10);

  const activeAssessments = useMemo(
    () => assessments.filter((a) => a.status !== "deleted" && a.status !== "archived"),
    [assessments],
  );

  const latestByResidentType = useMemo(() => {
    const sorted = [...activeAssessments].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, Assessment>();
    for (const a of sorted) {
      if (a.supersededById) continue;
      const key = `${a.residentId}:${a.type}`;
      if (!map.has(key)) map.set(key, a);
    }
    return map;
  }, [activeAssessments]);

  const latestRows = useMemo(() => {
    return Array.from(latestByResidentType.values())
      .map((assessment) => {
        const resident = residents.find((r) => r.id === assessment.residentId);
        return {
          assessment,
          residentName: resident
            ? `${resident.firstName} ${resident.lastName}`
            : "Unknown Resident",
          roomNumber: resident?.roomNumber || "",
          wingId: resident?.wingId,
          dueDate: toDateKey(assessment.nextReassessmentDate || assessment.dueDate),
          status: getStatus(assessment),
        } as RowModel;
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          const order = { overdue: 0, due: 1, completed: 2 };
          return order[a.status] - order[b.status];
        }
        if (a.dueDate !== b.dueDate)
          return `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`);
        return riskOrder(b.assessment.riskLevel) - riskOrder(a.assessment.riskLevel);
      });
  }, [latestByResidentType, residents]);

  const allActiveRows = useMemo(() => {
    return [...activeAssessments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((assessment) => {
        const resident = residents.find((r) => r.id === assessment.residentId);
        return {
          assessment,
          residentName: resident
            ? `${resident.firstName} ${resident.lastName}`
            : "Unknown Resident",
          roomNumber: resident?.roomNumber || "",
          wingId: resident?.wingId,
          dueDate: toDateKey(assessment.nextReassessmentDate || assessment.dueDate),
          status: getStatus(assessment),
        } as RowModel;
      });
  }, [activeAssessments, residents]);

  const baseRowsForMode = useMemo(() => {
    if (viewMode === "all_active") return allActiveRows;
    if (viewMode === "completed")
      return allActiveRows.filter((r) => (r.assessment.status || "completed") === "completed");
    if (viewMode === "draft_in_progress")
      return allActiveRows.filter((r) => {
        const s = r.assessment.status || "completed";
        return s === "draft" || s === "in_progress";
      });
    if (viewMode === "high_risk")
      return latestRows.filter(
        (r) => r.assessment.riskLevel === "high" || r.assessment.riskLevel === "very_high",
      );
    if (viewMode === "my_assigned")
      return latestRows.filter((r) => {
        const assigned = (r.assessment.assignedToName || "").toLowerCase();
        const me = currentUserName.toLowerCase();
        return assigned === me || (r.assessment.assessor || "").toLowerCase() === me;
      });
    if (viewMode === "by_resident") return allActiveRows;
    if (viewMode === "by_assessment_type") return allActiveRows;
    return latestRows.filter((r) => r.status === "due" || r.status === "overdue");
  }, [allActiveRows, currentUserName, latestRows, viewMode]);

  const filteredRows = useMemo(() => {
    return baseRowsForMode.filter((row) => {
      if (search) {
        const s = search.toLowerCase();
        const residentText = `${row.residentName} room ${row.roomNumber}`.toLowerCase();
        if (!residentText.includes(s)) return false;
      }

      if (typeF !== "all" && row.assessment.type !== typeF) return false;
      if (statusF !== "all" && row.status !== statusF) return false;
      if (riskF !== "all" && row.assessment.riskLevel !== riskF) return false;
      if (assignedF !== "all") {
        const assigned = row.assessment.assignedToName || "";
        if (assignedF === "unassigned") {
          if (assigned) return false;
        } else if (assigned !== assignedF) {
          return false;
        }
      }
      if (wingF !== "all" && row.wingId !== wingF) return false;
      if (roomF !== "all" && row.roomNumber !== roomF) return false;

      if (categoryF !== "all") {
        const category = CATEGORY_FILTERS.find((c) => c.id === categoryF);
        if (!category || !category.types.includes(row.assessment.type)) return false;
      }

      return true;
    });
  }, [assignedF, baseRowsForMode, categoryF, riskF, roomF, search, statusF, typeF, wingF]);

  const groupedPriorityRows = useMemo(() => {
    const grouped: Record<QueueGroupKey, RowModel[]> = {
      overdue_critical: [],
      high_risk_due_soon: [],
      due_this_week: [],
      routine_scheduled: [],
    };

    for (const row of filteredRows) {
      grouped[queueGroup(row, todayKey)].push(row);
    }

    return grouped;
  }, [filteredRows, todayKey]);

  const assessmentQueueRows = useMemo(
    () => filteredRows.filter((row) => row.status === "due" || row.status === "overdue"),
    [filteredRows],
  );

  const residentQueueGroups = useMemo(() => {
    const groupedByResident = new Map<string, RowModel[]>();
    for (const row of assessmentQueueRows) {
      const list = groupedByResident.get(row.assessment.residentId) || [];
      list.push(row);
      groupedByResident.set(row.assessment.residentId, list);
    }

    const groups: Record<ResidentQueueGroupKey, ResidentQueueItem[]> = {
      overdue: [],
      due_today: [],
      due_this_week: [],
      scheduled: [],
    };

    for (const rows of groupedByResident.values()) {
      const sortedRows = [...rows].sort((a, b) =>
        priorityRank(a) - priorityRank(b) ||
        `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`),
      );
      const highestPriority = sortedRows[0];
      const oldestDueDate = [...rows]
        .map((row) => row.dueDate)
        .filter(Boolean)
        .sort()[0] || "";
      const highestRisk = [...rows]
        .map((row) => row.assessment.riskLevel)
        .sort((a, b) => riskOrder(b) - riskOrder(a))[0] || "none";
      const group = residentQueueGroup(rows, todayKey);
      groups[group].push({
        residentId: highestPriority.assessment.residentId,
        residentName: highestPriority.residentName,
        roomNumber: highestPriority.roomNumber,
        rows: sortedRows,
        group,
        highestPriority,
        highestRisk,
        oldestDueDate,
      });
    }

    for (const key of Object.keys(groups) as ResidentQueueGroupKey[]) {
      groups[key].sort((a, b) =>
        priorityRank(a.highestPriority) - priorityRank(b.highestPriority) ||
        `${a.oldestDueDate || "9999-12-31"}`.localeCompare(`${b.oldestDueDate || "9999-12-31"}`) ||
        a.residentName.localeCompare(b.residentName),
      );
    }

    return groups;
  }, [assessmentQueueRows, todayKey]);

  const byResident = useMemo(() => {
    const map = new Map<string, RowModel[]>();
    for (const row of filteredRows) {
      const key = `${row.assessment.residentId}:${row.residentName}`;
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([key, rows]) => {
        const [residentId, residentName] = key.split(":");
        return {
          residentId,
          residentName,
          roomNumber: rows[0]?.roomNumber || "",
          rows: rows.sort((a, b) =>
            `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`),
          ),
        };
      })
      .sort((a, b) => a.residentName.localeCompare(b.residentName));
  }, [filteredRows]);

  const byAssessmentType = useMemo(() => {
    const map = new Map<AssessmentType, RowModel[]>();
    for (const row of filteredRows) {
      const list = map.get(row.assessment.type) || [];
      list.push(row);
      map.set(row.assessment.type, list);
    }
    return Array.from(map.entries())
      .map(([type, rows]) => ({
        type,
        rows: rows.sort((a, b) =>
          `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`),
        ),
      }))
      .sort((a, b) => assessmentMeta[a.type].name.localeCompare(assessmentMeta[b.type].name));
  }, [filteredRows]);

  const residentsMissingMandatory = useMemo(() => {
    return residents
      .map((resident) => {
        const missing = CORE_TYPES.filter(
          (type) => !latestByResidentType.has(`${resident.id}:${type}`),
        );
        return { resident, missing };
      })
      .filter((row) => row.missing.length > 0);
  }, [residents, latestByResidentType]);

  const availableRooms = useMemo(
    () => [...new Set(residents.map((resident) => resident.roomNumber).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [residents],
  );

  const summary = useMemo(() => {
    const residentsRequiringAssessment = new Set(
      latestRows
        .filter((r) => r.status === "due" || r.status === "overdue")
        .map((r) => r.assessment.residentId),
    ).size;
    const dueToday = latestRows.filter(
      (r) => (r.status === "due" || r.status === "overdue") && r.dueDate === todayKey,
    ).length;
    const overdue = latestRows.filter((r) => r.status === "overdue").length;
    const highRiskResidents = new Set(
      latestRows
        .filter((r) => r.assessment.riskLevel === "high" || r.assessment.riskLevel === "very_high")
        .map((r) => r.assessment.residentId),
    ).size;
    const myAssessments = latestRows.filter((r) => {
      const assigned = (r.assessment.assignedToName || "").toLowerCase();
      return (
        (r.status === "due" || r.status === "overdue") && assigned === currentUserName.toLowerCase()
      );
    }).length;

    return {
      residentsRequiringAssessment,
      dueToday,
      overdue,
      highRiskResidents,
      missingAssessments: residentsMissingMandatory.length,
      myAssessments,
    };
  }, [currentUserName, latestRows, residentsMissingMandatory.length, todayKey]);

  const governance = useMemo(() => {
    const dueUniverse = latestRows.filter((r) => !!r.dueDate);
    const overdue = dueUniverse.filter((r) => r.status === "overdue").length;
    const compliancePct = dueUniverse.length
      ? Math.max(0, Math.round(((dueUniverse.length - overdue) / dueUniverse.length) * 100))
      : 100;

    const coverageByType = ALL_TYPES.map((type) => {
      const rows = latestRows.filter((r) => r.assessment.type === type);
      return {
        type,
        completed: rows.filter((r) => r.status === "completed").length,
        due: rows.filter((r) => r.status === "due").length,
        overdue: rows.filter((r) => r.status === "overdue").length,
      };
    }).filter((row) => row.completed + row.due + row.overdue > 0);

    const riskDistribution = ["very_high", "high", "moderate", "low", "none"].map((level) => ({
      level,
      count: latestRows.filter((r) => r.assessment.riskLevel === level).length,
    }));

    const staffPerformance = users
      .map((u) => {
        const assigned = latestRows.filter((r) => (r.assessment.assignedToName || "") === u.name);
        return {
          name: u.name,
          role: u.role,
          due: assigned.filter((r) => r.status === "due").length,
          overdue: assigned.filter((r) => r.status === "overdue").length,
          completed: assigned.filter((r) => r.status === "completed").length,
        };
      })
      .filter((r) => r.due + r.overdue + r.completed > 0)
      .sort((a, b) => b.overdue - a.overdue || b.due - a.due);

    const completionTrends = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - idx));
      const key = day.toISOString().slice(0, 10);
      const count = activeAssessments.filter(
        (a) => (a.status || "completed") === "completed" && a.date.slice(0, 10) === key,
      ).length;
      return { day: key.slice(5), completed: count };
    });

    const auditRows = [...activeAssessments]
      .filter((a) => (a.status || "completed") === "completed")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .map((a) => {
        const resident = residents.find((r) => r.id === a.residentId);
        return {
          id: a.id,
          residentName: resident
            ? `${resident.firstName} ${resident.lastName}`
            : "Unknown Resident",
          assessmentName: assessmentMeta[a.type].name,
          assessor: a.assessor,
          completedDate: a.date.slice(0, 10),
        };
      });

    return {
      compliancePct,
      dueUniverse: dueUniverse.length,
      overdue,
      coverageByType,
      riskDistribution,
      staffPerformance,
      completionTrends,
      auditRows,
    };
  }, [activeAssessments, latestRows, residents, users]);

  const resetAssessmentFilters = () => {
    setViewMode("due_overdue");
    setSearch("");
    setCategoryF("all");
    setTypeF("all");
    setStatusF("all");
    setRiskF("all");
    setAssignedF("all");
    setWingF("all");
    setRoomF("all");
  };

  const nurseQueueView = (
    <>
      <AssessmentQueueFilters
        search={search}
        setSearch={setSearch}
        categoryF={categoryF}
        setCategoryF={setCategoryF}
        typeF={typeF}
        setTypeF={setTypeF}
        statusF={statusF}
        setStatusF={setStatusF}
        riskF={riskF}
        setRiskF={setRiskF}
        assignedF={assignedF}
        setAssignedF={setAssignedF}
        wingF={wingF}
        setWingF={setWingF}
        roomF={roomF}
        setRoomF={setRoomF}
        users={users}
        wings={wings}
        rooms={availableRooms}
        onReset={resetAssessmentFilters}
      />
      <AssessmentWorkQueue groups={residentQueueGroups} todayKey={todayKey} />
    </>
  );

  const exportGovernanceCsv = () => {
    const header = ["Resident", "Assessment", "Assessor", "Completed Date", "Due Date", "Status"];
    const body = filteredRows.map((row) => [
      row.residentName,
      assessmentMeta[row.assessment.type].name,
      row.assessment.assessor,
      row.assessment.date.slice(0, 10),
      row.dueDate || "",
      statusLabel(row.status),
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-centre-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAssessment = (assessmentId: string) => {
    navigate({ to: "/assessments/$assessmentId", params: { assessmentId } });
  };

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1500px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessment Work Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clinical assessment record system with a default task-focused nurse view.
          </p>
        </div>
        <Link to="/assessments/reassessment">
          <Button variant="outline">
            <ClipboardList className="h-4 w-4 mr-1.5" /> Review Workflow
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-warning-foreground" />
            <div>
              <div className="text-2xl font-semibold tabular-nums">{summary.residentsRequiringAssessment}</div>
              <div className="text-[11px] text-muted-foreground">Residents Requiring Assessment</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-2xl font-semibold tabular-nums">{summary.dueToday}</div>
              <div className="text-[11px] text-muted-foreground">Assessments Due Today</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-warning-foreground" />
            <div>
              <div className="text-2xl font-semibold tabular-nums">{summary.overdue}</div>
              <div className="text-[11px] text-muted-foreground">Overdue Assessments</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-semibold tabular-nums">{summary.highRiskResidents}</div>
              <div className="text-[11px] text-muted-foreground">High Risk Residents</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-info" />
            <div>
              <div className="text-2xl font-semibold tabular-nums">{summary.missingAssessments}</div>
              <div className="text-[11px] text-muted-foreground">Missing Initial Assessments</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isGovernanceRole ? (
          <Tabs value={roleView} onValueChange={(v) => setRoleView(v as "nurse" | "governance")}>
            <TabsList className="h-auto">
              <TabsTrigger value="nurse">Nurse View</TabsTrigger>
              <TabsTrigger value="governance">Governance View</TabsTrigger>
            </TabsList>

            <TabsContent value="nurse" className="space-y-4">
              {nurseQueueView}
              <div className="hidden">
              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                    <Select
                      value={viewMode}
                      onValueChange={(value) => setViewMode(value as ViewMode)}
                    >
                      <SelectTrigger className="xl:col-span-2">
                        <SelectValue placeholder="View mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due_overdue">Due for Review</SelectItem>
                        <SelectItem value="all_active">All Active Assessments</SelectItem>
                        <SelectItem value="completed">Completed Assessments</SelectItem>
                        <SelectItem value="draft_in_progress">Draft / In Progress</SelectItem>
                        <SelectItem value="high_risk">High Risk Only</SelectItem>
                        <SelectItem value="my_assigned">My Assigned Assessments</SelectItem>
                        <SelectItem value="by_resident">By Resident</SelectItem>
                        <SelectItem value="by_assessment_type">By Assessment</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative xl:col-span-2">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        className="pl-8 h-9"
                        placeholder="Resident search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <Select
                      value={categoryF}
                      onValueChange={(value) => {
                        setCategoryF(value);
                        setTypeF("all");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Category: All</SelectItem>
                        {CATEGORY_FILTERS.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={typeF}
                      onValueChange={(value) => setTypeF(value as AssessmentType | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assessment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Assessment: All</SelectItem>
                        {(categoryF === "all"
                          ? ALL_TYPES
                          : CATEGORY_FILTERS.find((c) => c.id === categoryF)?.types || []
                        ).map((type) => (
                          <SelectItem key={type} value={type}>
                            {assessmentMeta[type].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <Select
                      value={statusF}
                      onValueChange={(value) => setStatusF(value as QueueStatus | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Progress" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Progress: All</SelectItem>
                        <SelectItem value="due">Due</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={riskF}
                      onValueChange={(value) => setRiskF(value as Assessment["riskLevel"] | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Risk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Risk: All</SelectItem>
                        <SelectItem value="very_high">Very High</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewMode("due_overdue");
                        setSearch("");
                        setCategoryF("all");
                        setTypeF("all");
                        setStatusF("all");
                        setRiskF("all");
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {viewMode === "due_overdue" ? (
                <Card>
                  <CardContent className="p-3">
                    <Accordion
                      type="multiple"
                      defaultValue={["overdue_critical", "high_risk_due_soon"]}
                    >
                      <AccordionItem value="overdue_critical">
                        <AccordionTrigger>
                          <span className="font-medium">
                            Overdue Critical ({groupedPriorityRows.overdue_critical.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <QueueTable
                            rows={groupedPriorityRows.overdue_critical}
                            todayKey={todayKey}
                            onOpenAssessment={openAssessment}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="high_risk_due_soon">
                        <AccordionTrigger>
                          <span className="font-medium">
                            High Risk Due Soon ({groupedPriorityRows.high_risk_due_soon.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <QueueTable
                            rows={groupedPriorityRows.high_risk_due_soon}
                            todayKey={todayKey}
                            onOpenAssessment={openAssessment}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="due_this_week">
                        <AccordionTrigger>
                          <span className="font-medium">
                            Due This Week ({groupedPriorityRows.due_this_week.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <QueueTable
                            rows={groupedPriorityRows.due_this_week}
                            todayKey={todayKey}
                            onOpenAssessment={openAssessment}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="routine_scheduled">
                        <AccordionTrigger>
                          <span className="font-medium">
                            Routine / Scheduled ({groupedPriorityRows.routine_scheduled.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <QueueTable
                            rows={groupedPriorityRows.routine_scheduled}
                            todayKey={todayKey}
                            onOpenAssessment={openAssessment}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ) : viewMode === "by_resident" ? (
                <div className="space-y-3">
                  {byResident.map((group) => (
                    <Card key={group.residentId}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {group.residentName} · Room {group.roomNumber || "-"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <QueueTable
                          rows={group.rows}
                          todayKey={todayKey}
                          onOpenAssessment={openAssessment}
                        />
                      </CardContent>
                    </Card>
                  ))}
                  {byResident.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-sm text-muted-foreground">
                        No resident groups match the current filter set.
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : viewMode === "by_assessment_type" ? (
                <div className="space-y-3">
                  {byAssessmentType.map((group) => (
                    <Card key={group.type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {assessmentMeta[group.type].name} ({group.rows.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <QueueTable
                          rows={group.rows}
                          todayKey={todayKey}
                          onOpenAssessment={openAssessment}
                        />
                      </CardContent>
                    </Card>
                  ))}
                  {byAssessmentType.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-sm text-muted-foreground">
                        No assessment-type groups match the current filter set.
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <QueueTable
                      rows={filteredRows}
                      todayKey={todayKey}
                      onOpenAssessment={openAssessment}
                    />
                  </CardContent>
                </Card>
              )}
              </div>
            </TabsContent>

            <TabsContent value="governance" className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportGovernanceCsv}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Compliance %</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold tabular-nums">
                      {governance.compliancePct}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Overdue: {governance.overdue} / Due Universe: {governance.dueUniverse}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Missing Assessments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold tabular-nums">
                      {residentsMissingMandatory.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Residents missing core assessments
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Staff Workload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold tabular-nums">
                      {governance.staffPerformance.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active staff with assessment assignments
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Trend Window</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold tabular-nums">7 days</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Completion trend interval
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Residents Missing Mandatory Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {residentsMissingMandatory.slice(0, 20).map((row) => (
                    <div
                      key={row.resident.id}
                      className="border rounded-md p-2 text-sm flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-medium">
                          {row.resident.firstName} {row.resident.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Missing ({row.missing.length}):{" "}
                          {row.missing.map((m) => assessmentMeta[m].name).join(", ")}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to="/residents/$id"
                          params={{ id: row.resident.id }}
                          className="text-xs text-primary hover:underline"
                        >
                          Open Resident
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link
                          to="/residents/$id/assessments"
                          params={{ id: row.resident.id }}
                          className="text-xs text-primary hover:underline"
                        >
                          View Assessment Progress
                        </Link>
                      </div>
                    </div>
                  ))}
                  {residentsMissingMandatory.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      All residents currently have mandatory assessments on record.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Assessment Coverage by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="text-left p-3">Assessment</th>
                            <th className="text-left p-3">Completed</th>
                            <th className="text-left p-3">Due</th>
                            <th className="text-left p-3">Overdue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {governance.coverageByType.map((row) => (
                            <tr key={row.type}>
                              <td className="p-3">{assessmentMeta[row.type].name}</td>
                              <td className="p-3 tabular-nums">{row.completed}</td>
                              <td className="p-3 tabular-nums">{row.due}</td>
                              <td className="p-3 tabular-nums">{row.overdue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Risk Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {governance.riskDistribution.map((row) => (
                      <div
                        key={row.level}
                        className="flex items-center justify-between border rounded-md p-2 text-sm"
                      >
                        <span className="capitalize">{row.level.replace("_", " ")}</span>
                        <span className="font-semibold tabular-nums">{row.count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Staff Workload Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="text-left p-3">Staff</th>
                          <th className="text-left p-3">Role</th>
                          <th className="text-left p-3">Due</th>
                          <th className="text-left p-3">Overdue</th>
                          <th className="text-left p-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {governance.staffPerformance.map((row) => (
                          <tr key={row.name}>
                            <td className="p-3">{row.name}</td>
                            <td className="p-3 text-xs uppercase">{row.role}</td>
                            <td className="p-3 tabular-nums">{row.due}</td>
                            <td className="p-3 tabular-nums">{row.overdue}</td>
                            <td className="p-3 tabular-nums">{row.completed}</td>
                          </tr>
                        ))}
                        {governance.staffPerformance.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                              No staff workload data in current scope.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Completion Trends (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-7">
                  {governance.completionTrends.map((point) => (
                    <div key={point.day} className="border rounded-md p-2 text-center">
                      <div className="text-xs text-muted-foreground">{point.day}</div>
                      <div className="text-lg font-semibold tabular-nums">{point.completed}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Audit Reporting</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="text-left p-3">Resident</th>
                          <th className="text-left p-3">Assessment</th>
                          <th className="text-left p-3">Completed By</th>
                          <th className="text-left p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {governance.auditRows.map((row) => (
                          <tr key={row.id}>
                            <td className="p-3">{row.residentName}</td>
                            <td className="p-3">{row.assessmentName}</td>
                            <td className="p-3 text-xs">{row.assessor}</td>
                            <td className="p-3 text-xs">{row.completedDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {nurseQueueView}
            <div className="hidden">
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                  <Select
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as ViewMode)}
                  >
                    <SelectTrigger className="xl:col-span-2">
                      <SelectValue placeholder="View mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_overdue">Due for Review</SelectItem>
                      <SelectItem value="all_active">All Active Assessments</SelectItem>
                      <SelectItem value="completed">Completed Assessments</SelectItem>
                      <SelectItem value="draft_in_progress">Draft / In Progress</SelectItem>
                      <SelectItem value="high_risk">High Risk Only</SelectItem>
                      <SelectItem value="my_assigned">My Assigned Assessments</SelectItem>
                      <SelectItem value="by_resident">By Resident</SelectItem>
                      <SelectItem value="by_assessment_type">By Assessment</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative xl:col-span-2">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      className="pl-8 h-9"
                      placeholder="Resident search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <Select
                    value={categoryF}
                    onValueChange={(value) => {
                      setCategoryF(value);
                      setTypeF("all");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Category: All</SelectItem>
                      {CATEGORY_FILTERS.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={typeF}
                    onValueChange={(value) => setTypeF(value as AssessmentType | "all")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Assessment: All</SelectItem>
                      {(categoryF === "all"
                        ? ALL_TYPES
                        : CATEGORY_FILTERS.find((c) => c.id === categoryF)?.types || []
                      ).map((type) => (
                        <SelectItem key={type} value={type}>
                          {assessmentMeta[type].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <Select
                    value={statusF}
                    onValueChange={(value) => setStatusF(value as QueueStatus | "all")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Progress" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Progress: All</SelectItem>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={riskF}
                    onValueChange={(value) => setRiskF(value as Assessment["riskLevel"] | "all")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Risk: All</SelectItem>
                      <SelectItem value="very_high">Very High</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewMode("due_overdue");
                      setSearch("");
                      setCategoryF("all");
                      setTypeF("all");
                      setStatusF("all");
                      setRiskF("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {viewMode === "due_overdue" ? (
              <Card>
                <CardContent className="p-3">
                  <Accordion
                    type="multiple"
                    defaultValue={["overdue_critical", "high_risk_due_soon"]}
                  >
                    <AccordionItem value="overdue_critical">
                      <AccordionTrigger>
                        <span className="font-medium">
                          Overdue Critical ({groupedPriorityRows.overdue_critical.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <QueueTable
                          rows={groupedPriorityRows.overdue_critical}
                          todayKey={todayKey}
                          onOpenAssessment={openAssessment}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="high_risk_due_soon">
                      <AccordionTrigger>
                        <span className="font-medium">
                          High Risk Due Soon ({groupedPriorityRows.high_risk_due_soon.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <QueueTable
                          rows={groupedPriorityRows.high_risk_due_soon}
                          todayKey={todayKey}
                          onOpenAssessment={openAssessment}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="due_this_week">
                      <AccordionTrigger>
                        <span className="font-medium">
                          Due This Week ({groupedPriorityRows.due_this_week.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <QueueTable
                          rows={groupedPriorityRows.due_this_week}
                          todayKey={todayKey}
                          onOpenAssessment={openAssessment}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="routine_scheduled">
                      <AccordionTrigger>
                        <span className="font-medium">
                          Routine / Scheduled ({groupedPriorityRows.routine_scheduled.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <QueueTable
                          rows={groupedPriorityRows.routine_scheduled}
                          todayKey={todayKey}
                          onOpenAssessment={openAssessment}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : viewMode === "by_resident" ? (
              <div className="space-y-3">
                {byResident.map((group) => (
                  <Card key={group.residentId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {group.residentName} · Room {group.roomNumber || "-"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <QueueTable
                        rows={group.rows}
                        todayKey={todayKey}
                        onOpenAssessment={openAssessment}
                      />
                    </CardContent>
                  </Card>
                ))}
                {byResident.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                      No resident groups match the current filter set.
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : viewMode === "by_assessment_type" ? (
              <div className="space-y-3">
                {byAssessmentType.map((group) => (
                  <Card key={group.type}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {assessmentMeta[group.type].name} ({group.rows.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <QueueTable
                        rows={group.rows}
                        todayKey={todayKey}
                        onOpenAssessment={openAssessment}
                      />
                    </CardContent>
                  </Card>
                ))}
                {byAssessmentType.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                      No assessment-type groups match the current filter set.
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <QueueTable
                    rows={filteredRows}
                    todayKey={todayKey}
                    onOpenAssessment={openAssessment}
                  />
                </CardContent>
              </Card>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
