import { useState, type ReactNode } from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreVertical, Eye, Pencil, Archive, ArchiveRestore, Trash2, Copy } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { can, canEditOpsRecord } from "@/lib/care/permissions";
import { toast } from "sonner";

interface Props {
  createdBy?: string;
  recordStatus?: "active" | "archived" | "deleted";
  onView?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: (reason: string) => void;
  onDuplicate?: () => void;
  recordLabel?: string;
  extra?: ReactNode;
}

export function RecordActions({
  createdBy, recordStatus = "active",
  onView, onEdit, onArchive, onRestore, onDelete, onDuplicate, recordLabel = "record", extra,
}: Props) {
  const { currentRole, currentUserName } = useCare();
  const [delOpen, setDelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const canEdit = canEditOpsRecord(currentRole, currentUserName, createdBy);
  const canArchive = can(currentRole, "ops.archive");
  const canRestore = can(currentRole, "ops.restore");
  const canDelete = can(currentRole, "ops.delete");
  const canDup = can(currentRole, "ops.duplicate");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={e => e.stopPropagation()}>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
          {onView && <DropdownMenuItem onClick={onView}><Eye className="h-3.5 w-3.5 mr-2" />View</DropdownMenuItem>}
          {onEdit && canEdit && recordStatus !== "deleted" && (
            <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
          )}
          {extra}
          {onDuplicate && canDup && (
            <DropdownMenuItem onClick={onDuplicate}><Copy className="h-3.5 w-3.5 mr-2" />Duplicate</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {recordStatus === "active" && onArchive && canArchive && (
            <DropdownMenuItem onClick={onArchive}><Archive className="h-3.5 w-3.5 mr-2" />Archive</DropdownMenuItem>
          )}
          {(recordStatus === "archived" || recordStatus === "deleted") && onRestore && canRestore && (
            <DropdownMenuItem onClick={onRestore}><ArchiveRestore className="h-3.5 w-3.5 mr-2" />Restore</DropdownMenuItem>
          )}
          {recordStatus !== "deleted" && onDelete && canDelete && (
            <DropdownMenuItem onClick={() => setDelOpen(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
            </DropdownMenuItem>
          )}
          {!canEdit && !canArchive && !canDelete && !canDup && (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">Read-only for your role</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {recordLabel}?</DialogTitle>
            <DialogDescription>
              This is a soft delete. The record will be moved to <strong>Deleted Records</strong> and remain in the audit trail. It can be restored by a CNM or DON.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="del-reason">Reason for deletion (required)</Label>
            <Textarea id="del-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Duplicate entry, entered against wrong resident…" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                onDelete?.(reason.trim());
                setDelOpen(false);
                setReason("");
                toast.success(`${recordLabel} deleted`);
              }}
            >Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
