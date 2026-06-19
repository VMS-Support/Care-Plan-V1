import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import { can } from "@/lib/care/permissions";
import { ASSESSMENT_CATEGORIES, deriveStatus, riskBadgeCls, statusBadgeCls } from "@/lib/care/assessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, Lock, RefreshCw } from "lucide-react";
import type { AssessmentType, AssessmentCategory } from "@/lib/care/types";

export const Route = createFileRoute("/residents/$id/assessments")({
  head: () => ({ meta: [{ title: "Assessment Centre — CarePath" }] }),
  component: ResidentAssessments,
});

const ALL_TYPES: AssessmentType[] = [
  "abbey_pain", "waterlow", "barthel", "must", "mna", "mmse", "four_at",
  "falls", "continence", "pain_chart", "cornell", "gds15", "abc", "abs",
  "norton", "nutrition", "pinch_me",
];

function NewAssessmentDialog({ residentId }: { residentId: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AssessmentCategory | "all">("all");
  const list = ALL_TYPES.filter(t => {
    if (cat !== "all" && !ASSESSMENT_CATEGORIES.find(c => c.id === cat)?.types.includes(t)) return false;
    const m = assessmentMeta[t];
    return !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1.5" /> New Assessment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Select Assessment Type</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by name or category…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={cat === "all" ? "default" : "outline"} onClick={() => setCat("all")}>All</Button>
          {ASSESSMENT_CATEGORIES.map(c => (
            <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} onClick={() => setCat(c.id)}>{c.label}</Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[28rem] overflow-y-auto">
          {list.map(t => (
            <Link key={t} to="/assessments/new/$residentId" params={{ residentId }} search={{ type: t } as any}
              onClick={() => setOpen(false)} className="border rounded-lg p-3 hover:bg-accent hover:border-accent transition">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm">{assessmentMeta[t].name}</div>
                <Badge variant="outline" className="text-[10px]">{assessmentMeta[t].category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{assessmentMeta[t].description}</p>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResidentAssessments() {
  const { id } = Route.useParams();
  const { residents, assessments, currentRole } = useCare();
  const resident = residents.find(r => r.id === id);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<AssessmentCategory | "all">("all");
  const [typeF, setTypeF] = useState<AssessmentType | "all">("all");
  const [statusF, setStatusF] = useState<"all" | "active" | "due" | "overdue" | "draft" | "archived" | "deleted">("active");

  const filtered = useMemo(() => {
    return assessments.filter(a => {
      if (a.residentId !== id) return false;
      if (typeF !== "all" && a.type !== typeF) return false;
      if (cat !== "all") {
        const ts = ASSESSMENT_CATEGORIES.find(c => c.id === cat)?.types || [];
        if (!ts.includes(a.type)) return false;
      }
      if (statusF === "active" && !(a.status === "completed" && !a.supersededById)) return false;
      if (statusF === "due") { if (a.status !== "completed" || deriveStatus(a) !== "due") return false; }
      if (statusF === "overdue") { if (a.status !== "completed" || deriveStatus(a) !== "overdue") return false; }
      if (statusF === "draft" && a.status !== "draft" && a.status !== "in_progress") return false;
      if (statusF === "archived" && a.status !== "archived") return false;
      if (statusF === "deleted" && a.status !== "deleted") return false;
      if (search) {
        const s = search.toLowerCase();
        if (!a.assessor.toLowerCase().includes(s) &&
            !assessmentMeta[a.type].name.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((x, y) => y.date.localeCompare(x.date));
  }, [assessments, id, typeF, cat, statusF, search]);

  if (!resident) return <div className="p-8">Resident not found.</div>;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1400px]">
      <Link to="/residents/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> {resident.firstName} {resident.lastName}
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessment Centre</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {resident.firstName} {resident.lastName} · Room {resident.roomNumber}
          </p>
        </div>
        {can(currentRole, "assessment.create") && <NewAssessmentDialog residentId={id} />}
      </div>

      {/* Filter bar — mirrors global Assessment Centre */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Search assessor or assessment type…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Status:</span>
            {(["active", "due", "overdue", "draft", "archived", "deleted", "all"] as const).map(s => (
              <Button key={s} size="sm" variant={statusF === s ? "default" : "outline"} className="capitalize" onClick={() => setStatusF(s)}>{s}</Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Category:</span>
            <Button size="sm" variant={cat === "all" ? "default" : "outline"} onClick={() => setCat("all")}>All</Button>
            {ASSESSMENT_CATEGORIES.map(c => (
              <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} onClick={() => setCat(c.id)}>{c.label}</Button>
            ))}
          </div>
          {cat !== "all" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground mr-1">Type:</span>
              <Button size="sm" variant={typeF === "all" ? "default" : "outline"} onClick={() => setTypeF("all")}>All</Button>
              {(ASSESSMENT_CATEGORIES.find(c2 => c2.id === cat)?.types || []).map(t => (
                <Button key={t} size="sm" variant={typeF === t ? "default" : "outline"} onClick={() => setTypeF(t)}>{assessmentMeta[t].name}</Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{filtered.length} assessment{filtered.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Assessment</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Risk</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Completed By</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Next</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 200).map(a => {
                  const ds = deriveStatus(a);
                  const canReassess = a.status === "completed" && !a.supersededById && can(currentRole, "assessment.create");
                  return (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <Link to="/assessments/$assessmentId" params={{ assessmentId: a.id }} className="font-medium hover:text-primary inline-flex items-center gap-1.5">
                          {a.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                          {assessmentMeta[a.type].name}
                        </Link>
                      </td>
                      <td className="p-3 tabular-nums font-semibold">{a.totalScore}</td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] ${riskBadgeCls(a.riskLevel)}`}>{a.interpretation}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] capitalize ${statusBadgeCls(ds)}`}>{ds}</Badge></td>
                      <td className="p-3 text-xs">{a.assessor}<br /><span className="text-muted-foreground capitalize">{a.assessorRole}</span></td>
                      <td className="p-3 text-xs">{a.date.slice(0, 10)}</td>
                      <td className="p-3 text-xs">{a.nextReassessmentDate || "—"}</td>
                      <td className="p-3 text-right">
                        {canReassess && (
                          <Link to="/assessments/new/$residentId" params={{ residentId: id }} search={{ type: a.type } as any}>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]">
                              <RefreshCw className="h-3 w-3 mr-1" /> Reassess
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No assessments match.</td></tr>
                )}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <div className="p-3 text-xs text-muted-foreground text-center">Showing first 200 of {filtered.length}. Refine filters to narrow.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
