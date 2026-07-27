import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import type { Task } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
  task?: Task | null;
  linkedCarePlanId?: string;
  linkedInterventionId?: string;
}

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

const empty = (residentId: string): Omit<Task, "id"> => ({
  residentId,
  title: "",
  assignedTo: "",
  dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  status: "pending" as const,
});

export function AddTaskModal({ open, onOpenChange, residentId, task, linkedCarePlanId, linkedInterventionId }: Props) {
  const { addTask, updateTask, residents } = useCare();
  const [form, setForm] = useState<Omit<Task, "id">>(empty(residentId));

  useEffect(() => {
    if (open) {
      if (task) {
        const { id: _id, ...existing } = task;
        setForm(existing);
      } else {
        setForm({ ...empty(residentId), linkedCarePlanId, linkedInterventionId });
      }
    }
  }, [open, residentId, task, linkedCarePlanId, linkedInterventionId]);

  const resident = residents.find((r) => r.id === residentId);

  function save() {
    if (!form.title.trim()) {
      toast.error("Task name required");
      return;
    }

    if (task) updateTask(task.id, form);
    else addTask(form);
    toast.success(task ? "Task updated" : "Task created");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Scheduled Task" : "Add Scheduled Task"}</DialogTitle>
          <DialogDescription>
            {resident && `For ${resident.firstName} ${resident.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Task Name *</Label>
            <Input
              placeholder="Enter task name..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Add task details..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority || "normal"} onValueChange={(value) => setForm({ ...form, priority: value as Task["priority"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input
                placeholder="Staff name"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as Task["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{task ? "Save Task" : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
