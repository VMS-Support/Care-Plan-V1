import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { TaskStatus } from "@/lib/care/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — CarePath" }] }),
  component: TasksPage,
});

function NewTask() {
  const { residents, addTask } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", residentId: "", assignedTo: "Care team", dueDate: new Date().toISOString().slice(0, 10) });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New Task</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
          <div>
            <Label>Resident (optional)</Label>
            <Select value={f.residentId} onValueChange={v => setF({ ...f, residentId: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Assigned to</Label><Input value={f.assignedTo} onChange={e => setF({ ...f, assignedTo: e.target.value })} /></div>
          <div><Label>Due date</Label><Input type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.title) { toast.error("Title required"); return; }
            addTask({ ...f, status: "pending" });
            toast.success("Task created");
            setOpen(false);
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TasksPage() {
  const { tasks: allTasks, residents, updateTask, filteredResidentIds, filter: globalFilter } = useCare();
  const statuses: TaskStatus[] = ["pending", "in_progress", "completed", "overdue"];
  const globalActive = !!(globalFilter.wingId || globalFilter.roomId || globalFilter.residentId);
  const allowed = new Set(filteredResidentIds);
  const tasks = globalActive
    ? allTasks.filter(t => !t.residentId || allowed.has(t.residentId))
    : allTasks;
  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{tasks.length} tasks</p>
        </div>
        <NewTask />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statuses.map(s => (
          <div key={s} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.replace("_", " ")}</h3>
            {tasks.filter(t => t.status === s).map(t => {
              const r = residents.find(x => x.id === t.residentId);
              return (
                <Card key={t.id}>
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{t.title}</div>
                    {r && <div className="text-xs text-muted-foreground">{r.firstName} {r.lastName}</div>}
                    <div className="text-xs text-muted-foreground mt-1">Due {t.dueDate}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {statuses.filter(x => x !== s).map(x => (
                        <Button key={x} size="sm" variant="outline" className="h-6 text-[10px] capitalize" onClick={() => updateTask(t.id, { status: x })}>{x.replace("_", " ")}</Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
