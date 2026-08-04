import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  Eye,
  Printer,
  RotateCcw,
  Archive,
  Trash2,
  FilePenLine,
  Ban,
  UserMinus,
} from "lucide-react";
import { generatedHandoverRepository, type GeneratedHandover } from "@/lib/care/generatedHandovers";
import { handoverPdfService } from "@/lib/care/handoverPdfService";
import { useCare } from "@/lib/care/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" }).format(new Date(value));
const time = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(value),
  );
const dateTime = (value?: string) => (value ? new Date(value).toLocaleString("en-IE") : "—");
const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
type Action = "correct" | "cancel" | "archive" | "delete" | null;

export function ManagedGeneratedHandoverView({ handoverId }: { handoverId: string }) {
  const care = useCare();
  const navigate = useNavigate();
  const [handover, setHandover] = useState(() => generatedHandoverRepository.getById(handoverId));
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    const residentId = new URLSearchParams(window.location.search).get("residentId");
    if (residentId)
      document
        .getElementById(`handover-resident-${residentId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  if (!handover)
    return (
      <div className="p-8">
        <p>Handover not found or the draft was deleted.</p>
        <Button className="mt-4" asChild>
          <Link to="/handovers">Back to handovers</Link>
        </Button>
      </div>
    );
  const readonly = handover.status !== "draft";
  const versions = generatedHandoverRepository.listVersions(handover.referenceNumber);
  const current = generatedHandoverRepository.getCurrentVersion(handover.referenceNumber);
  const run = async (task: () => Promise<void> | void) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };
  const save = () =>
    run(() => {
      const saved = generatedHandoverRepository.updateDraft(handover);
      setHandover(saved);
      toast.success("Draft saved");
    });
  const finalise = () =>
    run(() => {
      generatedHandoverRepository.updateDraft(handover);
      const saved = generatedHandoverRepository.finalise(handover.id, care.currentUserName);
      setHandover(saved);
      toast.success("Handover finalised");
    });
  const preview = () =>
    run(async () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(await handoverPdfService.previewPdf(handover.id, care.currentUserName));
    });
  const confirmAction = () =>
    run(() => {
      if (!action) return;
      if (action === "delete") {
        generatedHandoverRepository.deleteDraft(handover.id);
        toast.success("Draft deleted");
        navigate({ to: "/handovers" });
        return;
      }
      if (!reason.trim())
        throw new Error(
          `${action === "correct" ? "Correction" : action === "cancel" ? "Cancellation" : "Archive"} reason is required.`,
        );
      if (action === "correct") {
        const next = generatedHandoverRepository.createCorrectedVersion(
          handover.id,
          reason,
          care.currentUserName,
          care.currentUser.id,
        );
        toast.success("Corrected draft created");
        navigate({ to: "/handovers/generated/$handoverId", params: { handoverId: next.id } });
      }
      if (action === "cancel")
        setHandover(
          generatedHandoverRepository.cancel(handover.id, reason, notes, care.currentUserName),
        );
      if (action === "archive")
        setHandover(generatedHandoverRepository.archive(handover.id, reason, care.currentUserName));
      setAction(null);
      setReason("");
      setNotes("");
    });
  const updateNotes = (sectionId: string, value: string) =>
    setHandover({
      ...handover,
      sections: handover.sections.map((section) =>
        section.id === sectionId ? { ...section, nextShiftNotes: value } : section,
      ),
    });
  const removeResident = (residentId: string) => {
    if (handover.sections.length === 1) {
      toast.error("A handover must include at least one resident.");
      return;
    }
    const section = handover.sections.find((item) => item.residentId === residentId);
    setHandover({
      ...handover,
      residentIds: handover.residentIds.filter((id) => id !== residentId),
      residentCount: handover.residentCount - 1,
      sections: handover.sections.filter((item) => item.residentId !== residentId),
      items: handover.items.filter((item) => item.residentId !== residentId),
    });
    toast.success(`${section?.residentName || "Resident"} removed from this draft.`);
  };
  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-5">
      <div className="flex justify-between gap-3 flex-wrap">
        <div>
          <div className="flex gap-2 items-center flex-wrap">
            <h1 className="text-2xl font-semibold">Generated Handover</h1>
            <Badge className="capitalize">{handover.status}</Badge>
            {handover.archived && <Badge variant="outline">Archived</Badge>}
            {current?.id === handover.id && <Badge variant="secondary">Current version</Badge>}
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {handover.shiftType} shift · {date(handover.periodFrom)}, {time(handover.periodFrom)}–
            {time(handover.periodTo)} · {handover.referenceNumber} · Version{" "}
            {handover.versionNumber}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/handovers">Back</Link>
          </Button>
          <Button variant="outline" disabled={busy} onClick={preview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview PDF
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() => handoverPdfService.downloadPdf(handover.id, care.currentUserName))
            }
          >
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() => handoverPdfService.printPdf(handover.id, care.currentUserName))
            }
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {handover.status === "draft" && !handover.archived && (
          <>
            <Button variant="outline" disabled={busy} onClick={save}>
              Save Draft
            </Button>
            <Button disabled={busy} onClick={finalise}>
              Finalise Handover
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => setAction("delete")}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Draft
            </Button>
          </>
        )}
        {["finalised", "superseded", "cancelled"].includes(handover.status) &&
          !handover.archived && (
            <>
              <Button variant="outline" disabled={busy} onClick={() => setAction("correct")}>
                <FilePenLine className="h-4 w-4 mr-1" />
                Create Corrected Version
              </Button>
              {handover.status === "finalised" && (
                <Button variant="outline" disabled={busy} onClick={() => setAction("cancel")}>
                  <Ban className="h-4 w-4 mr-1" />
                  Cancel Handover
                </Button>
              )}
              <Button variant="outline" disabled={busy} onClick={() => setAction("archive")}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            </>
          )}
        {handover.archived && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() =>
                setHandover(generatedHandoverRepository.restore(handover.id, care.currentUserName)),
              )
            }
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Restore from Archive
          </Button>
        )}
      </div>
      {(handover.correctionReason || handover.cancellationReason) && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
            {handover.correctionReason && (
              <p>
                <strong>Correction reason:</strong> {handover.correctionReason}
              </p>
            )}
            {handover.cancellationReason && (
              <p>
                <strong>Cancellation reason:</strong> {handover.cancellationReason}
                {handover.cancellationNotes ? ` — ${handover.cancellationNotes}` : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {handover.sections.map((section) => {
        const items = handover.items.filter(
          (item) => item.residentSectionId === section.id && !item.excluded,
        );
        const groups = [...new Set(items.map((item) => item.sectionType))];
        return (
          <Card
            id={`handover-resident-${section.residentId}`}
            key={section.id}
            className="scroll-mt-6"
          >
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <CardTitle>
                {section.residentName}{" "}
                <span className="font-normal text-muted-foreground">— Room {section.room}</span>
              </CardTitle>
              {!readonly && !handover.archived && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeResident(section.residentId)}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove Resident
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {groups.map((group) => (
                <section key={group}>
                  <h3 className="text-sm font-semibold border-b pb-1 mb-2">{group}</h3>
                  <div className="space-y-3">
                    {items
                      .filter((item) => item.sectionType === group)
                      .map((item) => (
                        <div key={item.id} className="text-sm">
                          <div className="font-medium">
                            {time(item.occurredAt)} — {item.title}
                          </div>
                          <p>{item.summary}</p>
                          {item.authorName && (
                            <p className="text-xs text-muted-foreground">
                              Recorded by {item.authorName}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              ))}
              {!items.length && (
                <p className="text-sm text-muted-foreground">
                  No recorded clinical activity in this period.
                </p>
              )}
              <div>
                <Label>Next Shift Notes</Label>
                {readonly || handover.archived ? (
                  <p className="mt-1 rounded-md border bg-muted/30 p-3 text-sm min-h-12">
                    {section.nextShiftNotes || "No next-shift notes."}
                  </p>
                ) : (
                  <Textarea
                    value={section.nextShiftNotes}
                    onChange={(event) => updateNotes(section.id, event.target.value)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className="rounded-md border p-3 flex justify-between gap-3 flex-wrap"
            >
              <div className="text-sm">
                <div className="font-medium">
                  Version {version.versionNumber}{" "}
                  {current?.id === version.id && (
                    <Badge variant="secondary" className="ml-2">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="capitalize">
                  {version.status}
                  {version.archived ? " · Archived" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated by {version.generatedByName} · {dateTime(version.generatedAt)}
                  {version.finalisedAt ? ` · Finalised ${dateTime(version.finalisedAt)}` : ""}
                </p>
                {version.correctionReason && (
                  <p className="text-xs">Correction: {version.correctionReason}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/handovers/generated/$handoverId" params={{ handoverId: version.id }}>
                    View
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    run(() => handoverPdfService.downloadPdf(version.id, care.currentUserName))
                  }
                >
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Client-side prototype: PDFs are regenerated from this frozen snapshot. This does not provide
        server-side retention, secure file storage, cross-device persistence, production audit
        integrity, or formal records-destruction governance.
      </p>
      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => {
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(undefined);
          }
        }}
      >
        <DialogContent className="max-w-6xl h-[94vh] grid-rows-[auto_minmax(0,1fr)_auto]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>
              {handover.referenceNumber} · Version {handover.versionNumber}
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <iframe
              title="Handover PDF preview"
              src={previewUrl}
              className="w-full h-full min-h-0 rounded border bg-muted"
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => previewUrl && window.open(previewUrl, "_blank")}
            >
              Open all pages
            </Button>
            <Button
              onClick={() =>
                run(() => handoverPdfService.downloadPdf(handover.id, care.currentUserName))
              }
            >
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "delete"
                ? "Delete Draft Handover?"
                : action === "correct"
                  ? "Create Corrected Version"
                  : action === "cancel"
                    ? "Cancel Handover"
                    : "Archive Handover?"}
            </DialogTitle>
            <DialogDescription>
              {action === "delete"
                ? "This permanently removes this unfinished draft. Existing clinical source records will not be affected."
                : action === "archive"
                  ? "The handover will leave the default list but remain available in Archived Handovers."
                  : action === "cancel"
                    ? "The frozen handover will be retained and clearly marked Cancelled."
                    : "The original remains unchanged. A new editable draft will be created in the same reference family."}
            </DialogDescription>
          </DialogHeader>
          {action !== "delete" && (
            <div>
              <Label>
                {action === "correct"
                  ? "Reason for Correction"
                  : action === "cancel"
                    ? "Cancellation Reason"
                    : "Archive Reason"}{" "}
                *
              </Label>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
          )}
          {action === "cancel" && (
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              {action === "delete" ? "Keep Draft" : "Cancel"}
            </Button>
            <Button
              variant={action === "delete" || action === "cancel" ? "destructive" : "default"}
              disabled={busy || (action !== "delete" && !reason.trim())}
              onClick={confirmAction}
            >
              {action === "delete"
                ? "Delete Draft"
                : action === "correct"
                  ? "Create Draft"
                  : action === "cancel"
                    ? "Cancel Handover"
                    : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
