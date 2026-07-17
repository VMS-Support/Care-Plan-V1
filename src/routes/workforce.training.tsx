import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  FileUp,
  Filter,
  GraduationCap,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Search,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import {
  getTrainingComplianceMetric,
  getCompletedTrainingHours,
  getTrainingCompletionYears,
  formatTrainingDuration,
  latestTrainingCompletion,
  minutesToDurationHours,
  parseDurationHoursToMinutes,
  buildTrainingAssignmentRows,
  queryTrainingAssignments,
  resolveTrainingAssignmentStatus,
  type AssignTrainingCommand,
  type RecordTrainingCompletionCommand,
  type TrainingAssignmentFilters,
  type TrainingAssignmentSortKey,
  type SortDirection,
} from "@/domain/workforce";
import type { StaffTrainingAssignment, TrainingCourse } from "@/lib/care/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/workforce/training")({
  head: () => ({ meta: [{ title: "Training Management - NuCare" }] }),
  component: TrainingWorkspace,
});

const ALL = "all";
const STATUSES = ["active_and_completed", "all", "not_started", "in_progress", "overdue", "completed", "cancelled", "entered_in_error"] as const;
const PAGE_SIZES = [25, 50, 100];

function TrainingWorkspace() {
  const care = useCare();
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState("staff");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState(ALL);
  const [filters, setFilters] = useState<TrainingAssignmentFilters>({ status: "active_and_completed", mandatory: "all", certificate: "all", year: ALL });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: TrainingAssignmentSortKey; direction: SortDirection } | undefined>();
  const [courseOpen, setCourseOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>();
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: care.activeFacilityId });

  const courses = care.trainingCourses;
  const categories = ((care as any).trainingCategories || defaultCategories()) as Array<{ id: string; code: string; name: string; active: boolean }>;
  const rows = useMemo(
    () => buildTrainingAssignmentRows({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses, staffMembers: care.staffMembers, facilities: care.facilities, employmentRecords: care.employmentRecords as any, effectiveAt: today }),
    [care.staffTrainingAssignments, care.staffTrainingCompletions, care.staffMembers, care.facilities, care.employmentRecords, courses, today],
  );
  const activeRows = rows.filter((row) => !["cancelled", "entered_in_error"].includes(row.status));
  const mandatoryRows = activeRows.filter((row) => row.assignment.mandatory ?? row.course?.mandatoryByDefault ?? false);
  const completedRows = activeRows.filter((row) => row.status === "completed");
  const inProgressRows = activeRows.filter((row) => row.status === "in_progress");
  const overdueRows = activeRows.filter((row) => row.status === "overdue");
  const notStartedRows = activeRows.filter((row) => row.status === "not_started");
  const roleOptions = [...new Set(rows.map((row) => row.roleName).filter((role) => role && role !== "Not recorded"))].sort();
  const metric = getTrainingComplianceMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses, effectiveAt: today });
  const yearOptions = getTrainingCompletionYears(care.staffTrainingCompletions);
  const completedYear = filters.year && filters.year !== ALL ? filters.year : today.slice(0, 4);
  const hours = getCompletedTrainingHours({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses, filters: { year: completedYear, courseId: filters.courseId, category: filters.category, mandatory: filters.mandatory } });
  const draftCount = courses.filter((course) => course.status === "draft").length;

  const filteredCourses = courses.filter((course) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [course.title, course.code, course.description, course.category].some((value) => String(value || "").toLowerCase().includes(q));
    const matchesFilter =
      courseFilter === ALL ||
      (courseFilter === "mandatory" ? course.mandatoryByDefault : courseFilter === "optional" ? !course.mandatoryByDefault : course.status === courseFilter || course.category === courseFilter);
    return matchesSearch && matchesFilter;
  });
  const assignmentQuery = useMemo(
    () => queryTrainingAssignments(rows, { filters: { ...filters, search }, sort, page, pageSize, effectiveAt: today }),
    [rows, filters, search, sort, page, pageSize, today],
  );
  const overdueQuery = useMemo(
    () => queryTrainingAssignments(rows, { filters: { ...filters, status: "overdue", search }, sort: { key: "dueDate", direction: "asc" }, page, pageSize, effectiveAt: today }),
    [rows, filters, search, page, pageSize, today],
  );
  useEffect(() => setPage(1), [search, filters, sort, pageSize, tab]);
  const setFilter = (key: keyof TrainingAssignmentFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => {
    setSearch("");
    setFilters({ status: "active_and_completed", mandatory: "all", certificate: "all", year: ALL });
    setSort(undefined);
  };

  if (!can("training.view")) {
    return <PageShell><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Training.</CardContent></Card></PageShell>;
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training Management</h1>
          <p className="text-sm text-muted-foreground">Create Courses, assign required Training and monitor Staff completion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("training.manage_courses") && <Button size="sm" onClick={() => { setSelectedCourseId(undefined); setCourseOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Course</Button>}
          {can("training.assign") && <Button size="sm" variant="outline" onClick={() => { setSelectedCourseId(undefined); setAssignOpen(true); }}><Users className="mr-2 h-4 w-4" /> Assign Training</Button>}
          {can("training.assign") && <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>Bulk Assign</Button>}
          <Button size="sm" variant="outline" onClick={() => setTab("matrix")}>Training Matrix</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <SummaryCard icon={<GraduationCap />} title="Mandatory Training Compliance" value={metric.percentage === undefined ? "Not Configured" : `${metric.percentage}%`} detail={metric.denominator ? `${metric.numerator} of ${metric.denominator} mandatory Training assignments completed` : "No mandatory Training assignments exist."} />
        <SummaryCard icon={<CheckCircle2 />} title="Completed" value={String(completedRows.length)} detail="Completed Training assignments" />
        <SummaryCard icon={<PlayCircle />} title="In Progress" value={String(inProgressRows.length)} detail="Started and awaiting completion" />
        <SummaryCard icon={<ShieldAlert />} title="Overdue" value={String(overdueRows.length)} detail="Past due and not completed" />
        <SummaryCard icon={<Clock3 />} title="Not Started" value={String(notStartedRows.length)} detail="Assigned but not yet started" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses {draftCount ? <Badge className="ml-2" variant="outline">{draftCount} draft</Badge> : null}</TabsTrigger>
          <TabsTrigger value="staff">Staff Training</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="matrix">Training Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <TrainingFilters search={search} setSearch={setSearch} filters={filters} setFilter={setFilter} clearFilters={clearFilters} courses={courses} categories={categories} homes={care.facilities} roleOptions={roleOptions} yearOptions={yearOptions} total={assignmentQuery.total} />
          <AssignmentTable rows={assignmentQuery.rows} total={assignmentQuery.total} page={assignmentQuery.page} pageSize={assignmentQuery.pageSize} pageCount={assignmentQuery.pageCount} onPageChange={setPage} onPageSizeChange={setPageSize} sort={sort} onSort={setSort} onComplete={(id) => { setSelectedAssignmentId(id); setCompletionOpen(true); }} onStart={care.startTrainingAssignment} onCancel={care.cancelTrainingAssignment} empty={emptyMessage(filters.status)} />
          <Panel title="Quick Actions">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Button size="sm" className="justify-start" onClick={() => { setSelectedCourseId(undefined); setCourseOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
              <Button size="sm" className="justify-start" variant="outline" onClick={() => setAssignOpen(true)}><Users className="mr-2 h-4 w-4" /> Assign Training</Button>
              <Button size="sm" className="justify-start" variant="outline" onClick={() => setBulkOpen(true)}>Bulk Assign</Button>
              <Button size="sm" className="justify-start" variant="outline" onClick={() => setTab("matrix")}>Training Matrix</Button>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Toolbar search={search} setSearch={setSearch}>
            <Select value={courseFilter} onValueChange={setCourseFilter}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All courses</SelectItem><SelectItem value="mandatory">Mandatory</SelectItem><SelectItem value="optional">Optional</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="retired">Retired</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.code}>{category.name}</SelectItem>)}</SelectContent></Select>
          </Toolbar>
          <CourseTable courses={filteredCourses} rows={rows} onEdit={(id) => { setSelectedCourseId(id); setCourseOpen(true); }} onAssign={(id) => { setSelectedCourseId(id); setAssignOpen(true); }} />
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <TrainingFilters search={search} setSearch={setSearch} filters={filters} setFilter={setFilter} clearFilters={clearFilters} courses={courses} categories={categories} homes={care.facilities} roleOptions={roleOptions} yearOptions={yearOptions} total={assignmentQuery.total} />
          <AssignmentTable rows={assignmentQuery.rows} total={assignmentQuery.total} page={assignmentQuery.page} pageSize={assignmentQuery.pageSize} pageCount={assignmentQuery.pageCount} onPageChange={setPage} onPageSizeChange={setPageSize} sort={sort} onSort={setSort} onComplete={(id) => { setSelectedAssignmentId(id); setCompletionOpen(true); }} onStart={care.startTrainingAssignment} onCancel={care.cancelTrainingAssignment} empty={emptyMessage(filters.status)} />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <TrainingFilters search={search} setSearch={setSearch} filters={{ ...filters, status: "overdue" }} setFilter={setFilter} clearFilters={clearFilters} courses={courses} categories={categories} homes={care.facilities} roleOptions={roleOptions} yearOptions={yearOptions} total={overdueQuery.total} />
          <AssignmentTable rows={overdueQuery.rows} total={overdueQuery.total} page={overdueQuery.page} pageSize={overdueQuery.pageSize} pageCount={overdueQuery.pageCount} onPageChange={setPage} onPageSizeChange={setPageSize} sort={sort} onSort={setSort} empty="No active overdue Training assignments match the selected filters." onComplete={(id) => { setSelectedAssignmentId(id); setCompletionOpen(true); }} onStart={care.startTrainingAssignment} onCancel={care.cancelTrainingAssignment} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <CompletedSummary hours={hours} year={completedYear} />
          <TrainingFilters search={search} setSearch={setSearch} filters={{ ...filters, status: "completed" }} setFilter={setFilter} clearFilters={clearFilters} courses={courses} categories={categories} homes={care.facilities} roleOptions={roleOptions} yearOptions={yearOptions} total={queryTrainingAssignments(rows, { filters: { ...filters, search, status: "completed", year: completedYear }, page, pageSize }).total} />
          <AssignmentTable rows={queryTrainingAssignments(rows, { filters: { ...filters, search, status: "completed", year: completedYear }, sort, page, pageSize }).rows} total={queryTrainingAssignments(rows, { filters: { ...filters, search, status: "completed", year: completedYear }, sort, page, pageSize }).total} page={page} pageSize={pageSize} pageCount={queryTrainingAssignments(rows, { filters: { ...filters, search, status: "completed", year: completedYear }, sort, page, pageSize }).pageCount} empty="No Training was completed during the selected year." onPageChange={setPage} onPageSizeChange={setPageSize} sort={sort} onSort={setSort} onComplete={(id) => { setSelectedAssignmentId(id); setCompletionOpen(true); }} onStart={care.startTrainingAssignment} onCancel={care.cancelTrainingAssignment} />
        </TabsContent>

        <TabsContent value="matrix">
          <TrainingMatrix rows={rows} courses={courses.filter((course) => course.status === "active")} staffMembers={care.staffMembers} onAssign={(courseId, staffMemberId) => { setSelectedCourseId(courseId); setAssignOpen(true); toast.info(`Assign ${staffName(care, staffMemberId)} from the Assign Training dialog.`); }} />
        </TabsContent>
      </Tabs>

      <CourseDialog open={courseOpen} course={courses.find((course) => course.id === selectedCourseId)} categories={categories} onOpenChange={setCourseOpen} />
      <CategoryDialog open={categoryOpen} onOpenChange={setCategoryOpen} />
      <AssignDialog open={assignOpen} courseId={selectedCourseId} onOpenChange={setAssignOpen} />
      <AssignDialog open={bulkOpen} bulk onOpenChange={setBulkOpen} />
      <CompletionDialog open={completionOpen} assignmentId={selectedAssignmentId} onOpenChange={setCompletionOpen} />
    </PageShell>
  );
}

function CategoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Training Category</DialogTitle></DialogHeader>
        <Field label="Category Name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Description"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-3"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { try { care.createTrainingCategory({ name, description }); toast.success("Training Category created."); setName(""); setDescription(""); onOpenChange(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Category could not be saved."); } }}>Save Category</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function CourseDialog({ open, course, categories, onOpenChange }: { open: boolean; course?: TrainingCourse; categories: Array<{ code: string; name: string; active: boolean }>; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState(() => courseForm(course));
  useMemo(() => setForm(courseForm(course)), [course?.id, open]);
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const save = (activate = false) => {
    try {
      const payload = { ...form, status: activate ? "active" : form.status, durationMinutes: parseDurationHoursToMinutes(form.duration), skillsToGain: lines(form.skills), learningObjectives: lines(form.lessons), materialDocumentIds: lines(form.materials) } as any;
      if (course) care.updateTrainingCourse(course.id, payload);
      else care.createTrainingCourse(payload);
      toast.success(activate ? "Course saved and activated." : "Course saved.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The Course could not be saved.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{course ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Course Title"><Input value={form.title} onChange={(event) => set("title", event.target.value)} /></Field>
          <Field label="Category"><Select value={form.category} onValueChange={(value) => set("category", value)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.filter((item) => item.active).map((item) => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Course Duration (Hours)"><Input inputMode="decimal" placeholder="0.5, 1, 1.5, 2" value={form.duration} onChange={(event) => set("duration", event.target.value)} /></Field>
          <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Mandatory</Label><Switch checked={form.mandatoryByDefault} onCheckedChange={(value) => set("mandatoryByDefault", value)} /></div>
          <Field label="Description"><Textarea value={form.description} onChange={(event) => set("description", event.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></Field>
          <Field label="Lessons or Topics"><Textarea placeholder="One per line" value={form.lessons} onChange={(event) => set("lessons", event.target.value)} /></Field>
          <Field label="Skills to Gain"><Textarea placeholder="One per line" value={form.skills} onChange={(event) => set("skills", event.target.value)} /></Field>
          <Field label="Course Material Upload"><Textarea placeholder="Secure file IDs, one per line. Add multiple materials or remove lines before saving." value={form.materials} onChange={(event) => set("materials", event.target.value)} /></Field>
        </div>
        <MaterialList ids={lines(form.materials)} />
        <div className="flex justify-end gap-2 pt-3"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="outline" onClick={() => save(false)}>Save Draft</Button><Button onClick={() => save(true)}>Save and Activate</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ open, courseId, bulk, onOpenChange }: { open: boolean; courseId?: string; bulk?: boolean; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState({ courseId: courseId || "", staffIds: [] as string[], dueDate: "", dueDays: "30", mandatoryOverride: "", role: ALL, home: ALL, staffSearch: "" });
  useMemo(() => setForm((current) => ({ ...current, courseId: courseId || current.courseId || care.trainingCourses.find((course) => course.status === "active")?.id || "" })), [courseId, open]);
  const selectedCourse = care.trainingCourses.find((course) => course.id === form.courseId);
  const staffOptions = care.staffMembers.filter((staff) => {
    if (staff.status && !["active", "on_leave"].includes(staff.status)) return false;
    const employment = care.employmentRecords.find((record) => String(record.staffMemberId) === String(staff.id));
    if (form.home !== ALL && String(staff.primaryNursingHomeId || employment?.primaryNursingHomeId || employment?.nursingHomeId) !== form.home) return false;
    if (form.role !== ALL && employment?.primaryRoleKey !== form.role && employment?.jobTitle !== form.role) return false;
    const q = form.staffSearch.trim().toLowerCase();
    return !q || [staff.displayName, staff.staffNumber, employment?.primaryRoleKey, employment?.jobTitle].some((value) => String(value || "").toLowerCase().includes(q));
  });
  const staffIds = bulk ? staffOptions.map((staff) => String(staff.id)) : form.staffIds;
  const duplicates = staffIds.filter((staffId) => care.staffTrainingAssignments.some((assignment) => String(assignment.staffMemberId) === staffId && assignment.trainingCourseId === form.courseId && !["cancelled", "entered_in_error", "completed"].includes(assignment.status)));
  const selectedStaff = care.staffMembers.filter((staff) => staffIds.includes(String(staff.id)));
  const dueDate = form.dueDate || addDays(new Date().toISOString().slice(0, 10), Number(form.dueDays || 0));
  const save = () => {
    try {
      const mandatory = form.mandatoryOverride === "" ? selectedCourse?.mandatoryByDefault : form.mandatoryOverride === "mandatory";
      const created = care.assignTrainingToMany({ staffMemberIds: staffIds, staffMemberId: staffIds[0] || "", trainingCourseId: form.courseId, dueDate, mandatory, source: "manual", clientRequestId: `training-assign-${Date.now()}` } as AssignTrainingCommand & { staffMemberIds: string[] });
      toast.success(created.length ? `${created.length} Training assignment(s) created.` : "No new assignments created.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The Training assignment could not be saved.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{bulk ? "Bulk Assign Training" : "Assign Training"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Course"><Select value={form.courseId} onValueChange={(value) => setForm((current) => ({ ...current, courseId: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.trainingCourses.filter((course) => course.status === "active").map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Mandatory"><Select value={form.mandatoryOverride || "course"} onValueChange={(value) => setForm((current) => ({ ...current, mandatoryOverride: value === "course" ? "" : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="course">Use Course Default</SelectItem><SelectItem value="mandatory">Mandatory</SelectItem><SelectItem value="optional">Optional</SelectItem></SelectContent></Select></Field>
          <Field label="Home"><Select value={form.home} onValueChange={(value) => setForm((current) => ({ ...current, home: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Homes</SelectItem>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Role"><Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Roles</SelectItem>{[...new Set(care.employmentRecords.map((record) => record.primaryRoleKey || record.jobTitle).filter(Boolean))].map((role) => <SelectItem key={role} value={String(role)}>{String(role)}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Search Staff"><Input placeholder="Name, staff number or role" value={form.staffSearch} onChange={(event) => setForm((current) => ({ ...current, staffSearch: event.target.value }))} /></Field>
          <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
          <Field label="Or Days From Assignment"><Input value={form.dueDays} onChange={(event) => setForm((current) => ({ ...current, dueDays: event.target.value }))} /></Field>
        </div>
        {!bulk && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">Selected Staff: {form.staffIds.length}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setForm((current) => ({ ...current, staffIds: [...new Set([...current.staffIds, ...staffOptions.map((staff) => String(staff.id))])] }))}>Select All Visible</Button>
                <Button size="sm" variant="outline" onClick={() => setForm((current) => ({ ...current, staffIds: [] }))}>Clear Selection</Button>
              </div>
            </div>
            <div className="flex max-h-16 flex-wrap gap-1 overflow-auto">
              {selectedStaff.slice(0, 12).map((staff) => <button key={staff.id} className="rounded-full border px-2 py-1 text-xs" onClick={() => setForm((current) => ({ ...current, staffIds: current.staffIds.filter((id) => id !== String(staff.id)) }))}>{staff.displayName} x</button>)}
              {selectedStaff.length > 12 && <Badge variant="outline">{selectedStaff.length - 12} more</Badge>}
            </div>
            <div className="max-h-72 divide-y overflow-auto rounded-md border">
              {staffOptions.slice(0, 100).map((staff) => {
                const id = String(staff.id);
                const selected = form.staffIds.includes(id);
                const employment = care.employmentRecords.find((record) => String(record.staffMemberId) === id);
                const duplicate = care.staffTrainingAssignments.find((assignment) => String(assignment.staffMemberId) === id && assignment.trainingCourseId === form.courseId && !["cancelled", "entered_in_error", "completed"].includes(assignment.status));
                return (
                  <button key={staff.id} className={`flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-muted ${selected ? "bg-primary/5" : ""}`} onClick={() => setForm((current) => ({ ...current, staffIds: selected ? current.staffIds.filter((item) => item !== id) : [...current.staffIds, id] }))}>
                    <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{selected ? <Check className="h-3.5 w-3.5" /> : null}</span>
                    <span className="min-w-0">
                      <span className="font-medium">{staff.displayName}</span>
                      <span className="block text-xs text-muted-foreground">{staff.staffNumber || "No staff number"} · {employment?.primaryRoleKey || employment?.jobTitle || "Role not recorded"} · {care.facilities.find((home) => home.id === String(staff.primaryNursingHomeId || employment?.primaryNursingHomeId))?.name || "Home not assigned"}</span>
                      {duplicate && <span className="block text-xs text-amber-700">Already assigned - Due {duplicate.dueDate || "not set"}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="font-medium">{selectedCourse?.title || "No Course selected"}</div>
          <div className="text-muted-foreground">{staffIds.length} Staff selected · {duplicates.length} duplicate active assignment(s) will be skipped · {Math.max(0, staffIds.length - duplicates.length)} assignment(s) to create · Due {dueDate || "not set"}</div>
          {selectedCourse?.durationMinutes && <div className="text-muted-foreground">Duration: {formatDuration(selectedCourse.durationMinutes)}</div>}
        </div>
        <div className="flex justify-end gap-2 pt-3"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.courseId || !staffIds.length} onClick={save}>Confirm Assignment</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function CompletionDialog({ open, assignmentId, onOpenChange }: { open: boolean; assignmentId?: string; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const assignment = care.staffTrainingAssignments.find((item) => item.id === assignmentId) || care.staffTrainingAssignments[0];
  const course = care.trainingCourses.find((item) => item.id === assignment?.trainingCourseId);
  const [form, setForm] = useState({ completionDate: new Date().toISOString().slice(0, 10), notes: "", certificateFileId: "", expiryDate: "", durationMinutes: "" });
  useEffect(() => {
    if (open) setForm((current) => ({ ...current, durationMinutes: String(course?.durationMinutes || "") }));
  }, [open, course?.durationMinutes]);
  const save = () => {
    if (!assignment || !course) return;
    try {
      const creditedDurationMinutes = form.durationMinutes.trim() ? Number(form.durationMinutes) : course.durationMinutes;
      if (creditedDurationMinutes !== undefined && (!Number.isFinite(creditedDurationMinutes) || creditedDurationMinutes <= 0)) throw new Error("The Course duration must be a positive number of hours.");
      let certificateDocumentId: string | undefined;
      if (form.certificateFileId.trim()) {
        const docType = care.staffDocumentTypes.find((type) => type.category === "training") || care.staffDocumentTypes.find((type) => type.key === "other");
        const document = care.createStaffDocument({ staffMemberId: String(assignment.staffMemberId), documentTypeId: docType?.id || "staff-document-type-other", title: `${course.title} Certificate`, fileId: form.certificateFileId.trim(), issueDate: form.completionDate, expiryDate: form.expiryDate || undefined, notes: `Training certificate for ${course.title}`, clientRequestId: `training-certificate-${Date.now()}` });
        certificateDocumentId = document.id;
      }
      const input: RecordTrainingCompletionCommand = { staffMemberId: String(assignment.staffMemberId), employmentRecordId: assignment.employmentRecordId ? String(assignment.employmentRecordId) : undefined, trainingAssignmentId: assignment.id, trainingCourseId: course.id, completionDate: form.completionDate, expiryDate: form.expiryDate || undefined, result: "completed", deliveryMethod: "classroom", certificateDocumentId, notes: form.notes, clientRequestId: `training-completion-${Date.now()}`, creditedDurationMinutes, durationSource: creditedDurationMinutes === course.durationMinutes ? "course_default" : "manual_adjustment" } as any;
      care.recordTrainingCompletion(input);
      care.updateTrainingAssignment(assignment.id, { completedAt: `${form.completionDate}T12:00:00.000Z`, completionNotes: form.notes, certificateDocumentId, status: "completed" });
      toast.success("Training completion recorded.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The Training Completion could not be saved.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark Completed</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border p-3 text-sm"><div className="font-medium">{course?.title || "Training Course"}</div><div className="text-muted-foreground">{staffName(care, String(assignment?.staffMemberId || ""))}</div></div>
          <Field label="Completion Date"><Input type="date" value={form.completionDate} onChange={(event) => setForm((current) => ({ ...current, completionDate: event.target.value }))} /></Field>
          <Field label="Completion Notes"><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></Field>
          <Field label="Credited Duration (Minutes)"><Input inputMode="numeric" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} /></Field>
          <Field label="Certificate Upload"><Input placeholder="Secure file ID" value={form.certificateFileId} onChange={(event) => setForm((current) => ({ ...current, certificateFileId: event.target.value }))} /></Field>
          <Field label="Certificate Expiry Date"><Input type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-3"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save Completion</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function CourseTable({ courses, rows, onEdit, onAssign }: { courses: TrainingCourse[]; rows: any[]; onEdit: (id: string) => void; onAssign: (id: string) => void }) {
  const care = useCare();
  return <Panel title="Courses"><div className="overflow-auto rounded-lg border"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Course Title</th><th>Category</th><th>Type</th><th>Duration</th><th>Assigned</th><th>Completed</th><th>In Progress</th><th>Overdue</th><th>Status</th><th>Actions</th></tr></thead><tbody>{courses.map((course) => { const courseRows = rows.filter((row) => row.course?.id === course.id); return <tr key={course.id} className="border-t"><td className="px-4 py-3 font-medium">{course.title}<div className="text-xs text-muted-foreground">{course.description}</div></td><td>{title(course.category)}</td><td>{course.mandatoryByDefault ? "Mandatory" : "Optional"}</td><td>{formatDuration(course.durationMinutes)}</td><td>{courseRows.length}</td><td>{courseRows.filter((row) => row.status === "completed").length}</td><td>{courseRows.filter((row) => row.status === "in_progress").length}</td><td>{courseRows.filter((row) => row.status === "overdue").length}</td><td><Badge variant="outline">{title(course.status)}</Badge></td><td><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => onEdit(course.id)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onAssign(course.id)}>Assign</Button><Button size="sm" variant="ghost" onClick={() => { care.duplicateTrainingCourse(course.id); toast.success("Draft copy created."); }}><Copy className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => care.updateTrainingCourse(course.id, { status: course.status === "active" ? "inactive" : "active" })}>{course.status === "active" ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="ghost" onClick={() => care.updateTrainingCourse(course.id, { status: "retired" })}>Retire</Button>{course.status === "draft" && <Button size="sm" variant="ghost" onClick={() => { try { care.deleteTrainingCourse(course.id); toast.success("Unused Draft Course deleted."); } catch (error) { toast.error(error instanceof Error ? error.message : "This Course cannot be deleted."); } }}>Delete Draft</Button>}</div></td></tr>; })}{courses.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No Training Courses have been created.</td></tr>}</tbody></table></div></Panel>;
}

function TrainingFilters({ search, setSearch, filters, setFilter, clearFilters, courses, categories, homes, roleOptions, yearOptions, total }: { search: string; setSearch: (value: string) => void; filters: TrainingAssignmentFilters; setFilter: (key: keyof TrainingAssignmentFilters, value: string) => void; clearFilters: () => void; courses: TrainingCourse[]; categories: Array<{ code: string; name: string }>; homes: Array<{ id: string; name: string }>; roleOptions: string[]; yearOptions: string[]; total: number }) {
  const active = [
    search && `Search: ${search}`,
    filters.status && filters.status !== "active_and_completed" && `Status: ${title(filters.status)}`,
    filters.role && filters.role !== ALL && `Role: ${filters.role}`,
    filters.courseId && filters.courseId !== ALL && `Course`,
    filters.category && filters.category !== ALL && `Category: ${title(filters.category)}`,
    filters.mandatory && filters.mandatory !== "all" && title(filters.mandatory),
    filters.year && filters.year !== ALL && `Year: ${filters.year}`,
  ].filter(Boolean);
  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[260px] pl-8" placeholder="Search Staff, number or Course" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Select value={filters.nursingHomeId || ALL} onValueChange={(value) => setFilter("nursingHomeId", value)}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Homes</SelectItem>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.role || ALL} onValueChange={(value) => setFilter("role", value)}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Roles</SelectItem>{roleOptions.map((role) => <SelectItem key={role} value={role}>{title(role)}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.courseId || ALL} onValueChange={(value) => setFilter("courseId", value)}><SelectTrigger className="w-[210px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Courses</SelectItem>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.status || "active_and_completed"} onValueChange={(value) => setFilter("status", value)}><SelectTrigger className="w-[210px]"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item === "active_and_completed" ? "Active and Completed" : item === "all" ? "All Statuses" : title(item)}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.year || ALL} onValueChange={(value) => setFilter("year", value)}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Years</SelectItem>{yearOptions.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="mr-2 h-4 w-4" /> More Filters</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="space-y-3 p-2">
              <Field label="Category"><Select value={filters.category || ALL} onValueChange={(value) => setFilter("category", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Categories</SelectItem>{categories.map((category) => <SelectItem key={category.code} value={category.code}>{category.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Mandatory Status"><Select value={filters.mandatory || "all"} onValueChange={(value) => setFilter("mandatory", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="mandatory">Mandatory</SelectItem><SelectItem value="optional">Optional</SelectItem></SelectContent></Select></Field>
              <Field label="Certificate Status"><Select value={filters.certificate || "all"} onValueChange={(value) => setFilter("certificate", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="uploaded">Certificate Uploaded</SelectItem><SelectItem value="missing">No Certificate</SelectItem><SelectItem value="expired">Certificate Expired</SelectItem><SelectItem value="expiring">Certificate Expiring</SelectItem></SelectContent></Select></Field>
              <div className="grid grid-cols-2 gap-2"><Field label="Due From"><Input type="date" value={filters.dueFrom || ""} onChange={(event) => setFilter("dueFrom", event.target.value)} /></Field><Field label="Due To"><Input type="date" value={filters.dueTo || ""} onChange={(event) => setFilter("dueTo", event.target.value)} /></Field></div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{total} result{total === 1 ? "" : "s"}</span>{active.map((chip) => <Badge key={String(chip)} variant="outline">{chip}</Badge>)}</div>
    </div>
  );
}

function CompletedSummary({ hours, year }: { hours: ReturnType<typeof getCompletedTrainingHours>; year: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <SummaryCard icon={<CheckCircle2 />} title="Completed Assignments" value={String(hours.completionCount)} detail={`Completed in ${year}`} />
      <SummaryCard icon={<Clock3 />} title="Training Hours" value={String(hours.totalHours)} detail={hours.availability === "partial" ? `${hours.missingDurationCount} missing duration` : "Credited hours completed"} />
      <SummaryCard icon={<Users />} title="Staff Members Trained" value={String(hours.staffMemberCount)} detail="Unique Staff Members" />
      <SummaryCard icon={<BookOpen />} title="Courses Completed" value={String(hours.courseCount)} detail="Unique Courses" />
    </div>
  );
}

function MaterialList({ ids }: { ids: string[] }) {
  if (!ids.length) return <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">No Course materials have been uploaded.</div>;
  return <div className="mt-3 divide-y rounded-md border">{ids.map((id) => <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm"><span><FileUp className="mr-2 inline h-4 w-4 text-muted-foreground" />{id}</span><div className="flex gap-1"><Button size="sm" variant="ghost">Open</Button><Button size="sm" variant="ghost">Replace</Button><Button size="sm" variant="ghost">Remove</Button></div></div>)}</div>;
}

function AssignmentTable({ rows, empty = "No active or completed Training assignments match the selected filters.", total = rows.length, page = 1, pageSize = rows.length || 25, pageCount = 1, hidePagination, compact, sort, onSort, onPageChange, onPageSizeChange, onComplete, onStart, onCancel }: { rows: any[]; empty?: string; total?: number; page?: number; pageSize?: number; pageCount?: number; hidePagination?: boolean; compact?: boolean; sort?: { key: TrainingAssignmentSortKey; direction: SortDirection }; onSort?: (sort: { key: TrainingAssignmentSortKey; direction: SortDirection } | undefined) => void; onPageChange?: (page: number) => void; onPageSizeChange?: (size: number) => void; onComplete: (id: string) => void; onStart: (id: string) => void; onCancel: (id: string, reason: string) => void }) {
  const care = useCare();
  const changeSort = (key: TrainingAssignmentSortKey) => onSort?.(sort?.key === key ? { key, direction: sort.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  return (
    <Panel title="Staff Training">
      <div className="hidden overflow-auto rounded-lg border md:block">
        <table className="w-full min-w-[1060px] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <SortableTh label="Staff Member" sortKey="staff" active={sort} onSort={changeSort} />
              <th>Staff Number</th>
              <SortableTh label="Course" sortKey="course" active={sort} onSort={changeSort} />
              <SortableTh label="Category" sortKey="category" active={sort} onSort={changeSort} />
              <SortableTh label="Mandatory" sortKey="mandatory" active={sort} onSort={changeSort} />
              <SortableTh label="Assigned Date" sortKey="assignedAt" active={sort} onSort={changeSort} />
              <SortableTh label="Due Date" sortKey="dueDate" active={sort} onSort={changeSort} />
              <SortableTh label="Status" sortKey="status" active={sort} onSort={changeSort} />
              <SortableTh label="Completion Date" sortKey="completedAt" active={sort} onSort={changeSort} />
              <th>Certificate</th>
              <th className="sticky right-0 z-10 bg-muted/50 px-4 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">Actions</th>
            </tr>
          </thead>
          <tbody>{rows.map((row) => <AssignmentRow key={row.assignment.id} row={row} care={care} onStart={onStart} onComplete={onComplete} onCancel={onCancel} />)}{rows.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => <AssignmentMobileCard key={row.assignment.id} row={row} care={care} onStart={onStart} onComplete={onComplete} onCancel={onCancel} />)}
        {rows.length === 0 && <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">{empty}</div>}
      </div>
      {!hidePagination && <PaginationFooter total={total} page={page} pageSize={pageSize} pageCount={pageCount} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />}
      {compact && total > rows.length && <p className="mt-2 text-xs text-muted-foreground">Showing {rows.length} of {total} matching assignments.</p>}
    </Panel>
  );
}

function SortableTh({ label, sortKey, active, onSort }: { label: string; sortKey: TrainingAssignmentSortKey; active?: { key: TrainingAssignmentSortKey; direction: SortDirection }; onSort: (key: TrainingAssignmentSortKey) => void }) {
  return <th className="px-4 py-3"><button className="text-left hover:text-foreground" onClick={() => onSort(sortKey)}>{label}{active?.key === sortKey ? ` ${active.direction === "asc" ? "↑" : "↓"}` : ""}</button></th>;
}

function AssignmentRow({ row, care, onStart, onComplete, onCancel }: { row: any; care: ReturnType<typeof useCare>; onStart: (id: string) => void; onComplete: (id: string) => void; onCancel: (id: string, reason: string) => void }) {
  return (
    <tr className="border-t">
      <td className="px-4 py-3 font-medium">{row.staff?.displayName || "Staff Member"}</td>
      <td>{row.staff?.staffNumber || "Not recorded"}</td>
      <td>{row.course?.title || "Training Course"}</td>
      <td>{title(row.course?.category || "other")}</td>
      <td>{row.assignment.mandatory ?? row.course?.mandatoryByDefault ? "Yes" : "No"}</td>
      <td>{dateOnly(row.assignment.assignedAt)}</td>
      <td>{row.assignment.dueDate || "No due date"}</td>
      <td><StatusBadge status={row.status} started={Boolean(row.assignment.startedAt)} /></td>
      <td>{row.completion?.completionDate || row.assignment.completedAt?.slice(0, 10) || (row.status === "cancelled" ? dateOnly(row.assignment.cancelledAt) : "Not completed")}</td>
      <td>{row.assignment.certificateDocumentId || row.completion?.certificateDocumentId ? <Badge variant="outline">Uploaded</Badge> : <span className="text-muted-foreground">No Certificate</span>}</td>
      <td className="sticky right-0 bg-card px-4 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]"><AssignmentActions row={row} care={care} onStart={onStart} onComplete={onComplete} onCancel={onCancel} /></td>
    </tr>
  );
}

function AssignmentMobileCard({ row, care, onStart, onComplete, onCancel }: { row: any; care: ReturnType<typeof useCare>; onStart: (id: string) => void; onComplete: (id: string) => void; onCancel: (id: string, reason: string) => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3"><div><div className="font-medium">{row.staff?.displayName || "Staff Member"}</div><div className="text-xs text-muted-foreground">{row.staff?.staffNumber || "Not recorded"} · {row.course?.title || "Training Course"}</div></div><StatusBadge status={row.status} /></div>
        <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-muted-foreground">Due</span><div>{row.assignment.dueDate || "No due date"}</div></div><div><span className="text-muted-foreground">Mandatory</span><div>{row.assignment.mandatory ?? row.course?.mandatoryByDefault ? "Yes" : "No"}</div></div><div><span className="text-muted-foreground">Certificate</span><div>{row.assignment.certificateDocumentId || row.completion?.certificateDocumentId ? "Uploaded" : "No Certificate"}</div></div></div>
        <AssignmentActions row={row} care={care} onStart={onStart} onComplete={onComplete} onCancel={onCancel} />
      </CardContent>
    </Card>
  );
}

function AssignmentActions({ row, care, onStart, onComplete, onCancel }: { row: any; care: ReturnType<typeof useCare>; onStart: (id: string) => void; onComplete: (id: string) => void; onCancel: (id: string, reason: string) => void }) {
  const inactive = row.status === "cancelled" || row.status === "entered_in_error";
  const completed = row.status === "completed";
  const primary = row.status === "not_started" ? <Button size="sm" variant="outline" onClick={() => onStart(row.assignment.id)}>Start</Button> : !inactive && !completed ? <Button size="sm" variant="outline" onClick={() => onComplete(row.assignment.id)}>Mark Completed</Button> : <Button size="sm" variant="outline" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(row.assignment.staffMemberId) }}>Open</Link></Button>;
  return (
    <div className="flex items-center gap-1">
      {primary}
      {!inactive && !completed && <Button size="sm" variant="ghost" onClick={() => editTrainingDueDate(row, care)}>Edit Due</Button>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!inactive && !completed && <DropdownMenuItem onClick={() => onComplete(row.assignment.id)}>Mark Completed</DropdownMenuItem>}
          {row.status === "in_progress" && <DropdownMenuItem onClick={() => {
            care.updateTrainingAssignment(row.assignment.id, { status: "not_started", startedAt: undefined }, "Training reset to Not Started from Training workspace");
            toast.success("Training reset to Not Started.");
          }}>Reset to Not Started</DropdownMenuItem>}
          {!inactive && !completed && <DropdownMenuItem onClick={() => editTrainingDueDate(row, care)}>Edit Due Date</DropdownMenuItem>}
          {!inactive && !completed && <DropdownMenuItem onClick={() => { const reason = window.prompt("Reason for cancellation"); if (reason) onCancel(row.assignment.id, reason); else toast.error("A cancellation reason is required."); }}>Cancel</DropdownMenuItem>}
          {!inactive && <DropdownMenuItem onClick={() => { const reason = window.prompt("Reason for entered in error"); if (reason) care.enterTrainingAssignmentInError(row.assignment.id, reason); }}>Enter in Error</DropdownMenuItem>}
          {completed && <DropdownMenuItem onClick={() => onComplete(row.assignment.id)}>Correct Completion</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(row.assignment.staffMemberId) }}>Open Staff Profile</Link></DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info(cancellationSummary(row))}>{row.status === "cancelled" ? "View Cancellation" : row.status === "entered_in_error" ? "View Error Reason" : "View History"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function editTrainingDueDate(row: any, care: ReturnType<typeof useCare>) {
  const dueDate = window.prompt("New due date (YYYY-MM-DD)", row.assignment.dueDate || "");
  if (!dueDate) return;
  care.updateTrainingAssignment(row.assignment.id, { dueDate }, "Due date updated from Training workspace");
  toast.success("Training due date updated.");
}

function PaginationFooter({ total, page, pageSize, pageCount, onPageChange, onPageSizeChange }: { total: number; page: number; pageSize: number; pageCount: number; onPageChange?: (page: number) => void; onPageSizeChange?: (size: number) => void }) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="text-muted-foreground">Showing {start}-{end} of {total} assignments</div>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange?.(Number(value))}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{PAGE_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Previous</Button>
        <span className="text-muted-foreground">Page {page} of {pageCount}</span>
        <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

function TrainingMatrix({ rows, courses, staffMembers, onAssign }: { rows: any[]; courses: TrainingCourse[]; staffMembers: any[]; onAssign: (courseId: string, staffMemberId: string) => void }) {
  const visibleCourses = courses.filter((course) => course.mandatoryByDefault).slice(0, 8);
  return <Panel title="Training Matrix"><div className="overflow-auto rounded-lg border"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-muted/50"><tr><th className="px-3 py-2">Staff Member</th>{visibleCourses.map((course) => <th key={course.id} className="px-3 py-2">{course.title}</th>)}</tr></thead><tbody>{staffMembers.slice(0, 50).map((staff) => <tr key={staff.id} className="border-t"><td className="px-3 py-2 font-medium">{staff.displayName}</td>{visibleCourses.map((course) => { const row = rows.find((item) => String(item.assignment.staffMemberId) === String(staff.id) && item.course?.id === course.id); return <td key={course.id} className="px-3 py-2">{row ? <StatusBadge status={row.status} compact /> : <Button size="sm" variant="ghost" onClick={() => onAssign(course.id, String(staff.id))}>Assign</Button>}</td>; })}</tr>)}</tbody></table></div><p className="mt-2 text-xs text-muted-foreground">Showing the first 50 Staff Members and active mandatory Courses.</p></Panel>;
}

function Toolbar({ search, setSearch, children }: { search: string; setSearch: (value: string) => void; children: ReactNode }) {
  return <div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[260px] pl-8" placeholder="Search Training" value={search} onChange={(event) => setSearch(event.target.value)} /></div>{children}</div>;
}

function SummaryCard({ icon, title: label, value, detail }: { icon: ReactNode; title: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>{label}</div><div className="mt-3 text-2xl font-semibold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Panel({ title: label, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return <Card className={className}><CardHeader><CardTitle className="text-base">{label}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function SimpleRows({ rows, onOpen }: { rows: Array<[string, number, string]>; onOpen: (target: string) => void }) {
  return <div className="divide-y rounded-lg border">{rows.map(([label, count, target]) => <button key={label} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted" onClick={() => onOpen(target)}><span>{label}</span><Badge variant={count ? "default" : "outline"}>{count}</Badge></button>)}</div>;
}

function StatusBadge({ status, started, compact }: { status: string; started?: boolean; compact?: boolean }) {
  const cls = status === "completed" ? "border-green-200 bg-green-50 text-green-700" : status === "overdue" ? "border-red-200 bg-red-50 text-red-700" : status === "in_progress" ? "border-blue-200 bg-blue-50 text-blue-700" : status === "cancelled" ? "border-amber-200 bg-amber-50 text-amber-700" : status === "entered_in_error" ? "border-slate-300 bg-slate-100 text-slate-700" : "border-slate-200 bg-slate-50 text-slate-700";
  return <Badge variant="outline" className={cls}>{compact ? title(status).slice(0, 10) : status === "overdue" && started ? "Overdue - In Progress" : title(status)}</Badge>;
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-5 p-4 md:p-8">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function lines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function durationToMinutes(value: string) {
  const text = value.trim().toLowerCase();
  if (!text) return undefined;
  const number = Number(text.match(/[\d.]+/)?.[0] || 0);
  if (!number) return undefined;
  return text.includes("hour") ? Math.round(number * 60) : Math.round(number);
}

function formatDuration(minutes?: number) {
  return formatTrainingDuration(minutes);
}

function courseForm(course?: TrainingCourse) {
  return {
    title: course?.title || "",
    category: course?.category || "other",
    mandatoryByDefault: course?.mandatoryByDefault || false,
    duration: minutesToDurationHours(course?.durationMinutes),
    description: course?.description || "",
    lessons: (course?.learningObjectives || []).join("\n"),
    skills: (course?.skillsToGain || []).join("\n"),
    materials: (course?.materialDocumentIds || []).join("\n"),
    status: course?.status || "draft",
  };
}

function defaultCategories() {
  return ["Safety", "Mandatory", "Governance", "Clinical", "Other"].map((name) => ({ id: `training-category-${name.toLowerCase()}`, code: name.toLowerCase(), name, active: true }));
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : "Not set";
}

function staffName(care: ReturnType<typeof useCare>, staffMemberId: string) {
  return care.staffMembers.find((staff) => String(staff.id) === String(staffMemberId))?.displayName || "Staff Member";
}

function emptyMessage(status?: string) {
  if (status === "cancelled") return "No cancelled Training assignments match the selected filters.";
  if (status === "entered_in_error") return "No Training assignments entered in error match the selected filters.";
  if (status === "completed") return "No completed Training assignments match the selected filters.";
  return "No active or completed Training assignments match the selected filters.";
}

function cancellationSummary(row: any) {
  if (row.status === "cancelled") {
    return `Cancelled ${dateOnly(row.assignment.cancelledAt)}. Reason: ${row.assignment.cancellationReason || row.assignment.exemptionReason || "Not recorded"}`;
  }
  if (row.status === "entered_in_error") {
    return `Entered in error ${dateOnly(row.assignment.enteredInErrorAt)}. Reason: ${row.assignment.enteredInErrorReason || row.assignment.exemptionReason || "Not recorded"}`;
  }
  return "Training assignment history is retained in the audit log.";
}
