import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import { ProblemIntervention } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: ProblemIntervention | null;
  action: "extend" | "complete" | "cancel" | null;
  onSuccess?: () => void;
}

export function InterventionReviewModal({
  open,
  onOpenChange,
  intervention,
  action,
  onSuccess,
}: Props) {
  const { updateProblemIntervention, currentUserName, currentRole } = useCare();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newReviewDate: "",
    reason: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({ newReviewDate: "", reason: "", notes: "" });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleExtendOrReschedule = async () => {
    if (!intervention || !formData.newReviewDate) {
      toast.error("Please select a new review date");
      return;
    }

    // Validate new review date is in future
    if (new Date(formData.newReviewDate) <= new Date()) {
      toast.error("Review date must be in the future");
      return;
    }

    // Validate new review date is before end date
    if (new Date(formData.newReviewDate) >= new Date(intervention.endDate)) {
      toast.error("Review date must be before intervention end date");
      return;
    }

    setIsLoading(true);
    try {
      await updateProblemIntervention(intervention.id, {
        reviewDate: formData.newReviewDate,
        status: "active",
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserName,
        updatedByRole: currentRole,
      });
      toast.success("Intervention rescheduled successfully");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to reschedule intervention");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrStop = async () => {
    if (!intervention || !formData.reason) {
      toast.error("Please provide a completion reason");
      return;
    }

    setIsLoading(true);
    try {
      await updateProblemIntervention(intervention.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: currentUserName,
        completedByRole: currentRole,
        completionReason: formData.reason,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserName,
        updatedByRole: currentRole,
      });
      toast.success("Intervention marked as completed");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to complete intervention");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!intervention || !formData.reason) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setIsLoading(true);
    try {
      await updateProblemIntervention(intervention.id, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: currentUserName,
        cancelledByRole: currentRole,
        cancellationReason: formData.reason,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserName,
        updatedByRole: currentRole,
      });
      toast.success("Intervention cancelled");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to cancel intervention");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (action === "extend") {
      await handleExtendOrReschedule();
    } else if (action === "complete") {
      await handleCompleteOrStop();
    } else if (action === "cancel") {
      await handleCancel();
    }
  };

  if (!intervention) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "extend" && "Reschedule Intervention"}
            {action === "complete" && "Complete Intervention"}
            {action === "cancel" && "Cancel Intervention"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">{intervention.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Currently reviewed on: {intervention.reviewDate}
            </p>
          </div>

          {action === "extend" && (
            <div>
              <Label htmlFor="newReviewDate" className="text-sm">
                New Review Date
              </Label>
              <Input
                id="newReviewDate"
                type="date"
                value={formData.newReviewDate}
                onChange={(e) => setFormData({ ...formData, newReviewDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                max={intervention.endDate}
              />
            </div>
          )}

          {action === "complete" && (
            <div>
              <Label htmlFor="reason" className="text-sm">
                Completion Reason
              </Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goal_achieved">Goal Achieved</SelectItem>
                  <SelectItem value="clinical_improvement">Clinical Improvement</SelectItem>
                  <SelectItem value="resident_request">Resident Request</SelectItem>
                  <SelectItem value="medical_contraindication">Medical Contraindication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "cancel" && (
            <div>
              <Label htmlFor="reason" className="text-sm">
                Cancellation Reason
              </Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_longer_clinically_appropriate">
                    No Longer Clinically Appropriate
                  </SelectItem>
                  <SelectItem value="resident_preference">Resident Preference</SelectItem>
                  <SelectItem value="resource_constraints">Resource Constraints</SelectItem>
                  <SelectItem value="duplicate_intervention">Duplicate Intervention</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(action === "complete" || action === "cancel") && (
            <div>
              <Label htmlFor="notes" className="text-sm">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional clinical notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-24"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
