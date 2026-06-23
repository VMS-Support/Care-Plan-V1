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
}

const PRIORITIES = ["Low", "Medium", "High"];

const empty = (residentId: string): Omit<Task, "id"> => ({
  residentId,
  title: "",
  assignedTo: "",
  dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  status: "pending" as const,
});

export function AddTaskModal({ open, onOpenChange, residentId }: Props) {
  const { addTask, residents } = useCare();
  const [form, setForm] = useState<Omit<Task, "id">>(empty(residentId));
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setForm(empty(residentId));
      setPriority("Medium");
      setDescription("");
    }
  }, [open, residentId]);

  const resident = residents.find((r) => r.id === residentId);

  function save() {
    if (!form.title.trim()) {
      toast.error("Task name required");
      return;
    }

    const item = addTask(form);
    toast.success("Task Created");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
