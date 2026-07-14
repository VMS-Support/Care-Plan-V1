import { useMemo, useState } from "react";
import { FileText, History, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  getResidentDocuments,
  type ResidentDocumentCategory,
  type ResidentDocumentSensitivity,
  type ResidentDocumentSource,
  type ResidentDocumentState,
  type ResidentDocumentType,
  type UploadDocumentMetadata,
} from "@/lib/care/residentDocuments";
import { openResidentFile } from "@/lib/care/residentFileStorage";
const labels = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const types: ResidentDocumentType[] = [
  "identity_document",
  "medical_card",
  "gp_visit_card",
  "health_insurance",
  "contract",
  "consent",
  "advance_directive",
  "dnar",
  "treatment_escalation_plan",
  "hospital_discharge_summary",
  "hospital_transfer_document",
  "medication_record",
  "prescription",
  "assessment",
  "care_plan",
  "care_plan_review",
  "clinical_letter",
  "gp_letter",
  "consultant_letter",
  "referral",
  "laboratory_result",
  "imaging_result",
  "appointment_document",
  "insurance_document",
  "funding_document",
  "legal_document",
  "representative_authority",
  "power_of_attorney",
  "decision_support_arrangement",
  "guardianship_document",
  "safeguarding_document",
  "complaint_document",
  "property_document",
  "photograph",
  "other",
];
const categories: ResidentDocumentCategory[] = [
  "clinical",
  "care_planning",
  "medical",
  "medication",
  "hospital",
  "legal_and_consent",
  "identity",
  "insurance_and_funding",
  "administrative",
  "contacts_and_representatives",
  "safeguarding",
  "property",
  "correspondence",
  "other",
];
export function ResidentDocuments({
  residentId,
  nursingHomeId,
  state,
  capabilities,
  onUpload,
  onUploadVersion,
  onStatus,
  onOpenSource,
}: {
  residentId: string;
  nursingHomeId: string;
  state: ResidentDocumentState;
  capabilities: string[];
  onUpload: (metadata: UploadDocumentMetadata, file: File) => Promise<void>;
  onUploadVersion: (id: string, file: File) => Promise<void>;
  onStatus: (
    id: string,
    status: "active" | "expired" | "revoked" | "entered_in_error" | "archived",
  ) => void;
  onOpenSource: (route: string) => void;
}) {
  const [category, setCategory] = useState<ResidentDocumentCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const model = useMemo(
    () =>
      getResidentDocuments(state, residentId, nursingHomeId, capabilities, { category, search }),
    [state, residentId, nursingHomeId, capabilities, category, search],
  );
  const versions = selected
    ? state.versions
        .filter((v) => v.documentId === selected)
        .sort((a, b) => b.versionNumber - a.versionNumber)
    : [];
  return (
    <Card>
      <CardHeader className="gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Documents
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Clinical, legal and administrative documents linked to this resident.
          </p>
        </div>
        {capabilities.includes("resident_documents.upload") && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1 h-4 w-4" />
            Upload Document
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents"
          />
          <Select value={category} onValueChange={(v) => setCategory(v as never)}>
            <SelectTrigger className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {labels(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {model.items.length ? (
          <div className="space-y-2">
            {model.items.map(({ document, currentVersion, attention }) => (
              <div key={document.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{document.title}</span>
                      <Badge variant="outline">{labels(document.status)}</Badge>
                      {document.sensitivity !== "standard" && (
                        <Badge variant="secondary">{labels(document.sensitivity)}</Badge>
                      )}
                      {attention && <Badge variant="destructive">{labels(attention)}</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {labels(document.documentType)} · {labels(document.category)} · Version{" "}
                      {currentVersion.versionNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded {new Date(currentVersion.uploadedAt).toLocaleDateString("en-IE")} ·{" "}
                      {(currentVersion.fileSizeBytes / 1024).toFixed(0)} KB · Malware scan not
                      available
                    </div>
                    {document.expiryDate && (
                      <div className="text-xs text-muted-foreground">
                        Expiry {new Date(document.expiryDate).toLocaleDateString("en-IE")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {capabilities.includes("resident_documents.download") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const version = state.versions.find(
                            (v) => v.id === document.currentVersionId,
                          );
                          if (version)
                            try {
                              openResidentFile(version.fileId, version.displayFileName);
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "File unavailable");
                            }
                        }}
                      >
                        Download
                      </Button>
                    )}
                    {document.sourceRoute && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenSource(document.sourceRoute!)}
                      >
                        Open Source
                      </Button>
                    )}
                    {capabilities.includes("resident_documents.view_history") && (
                      <Button size="sm" variant="ghost" onClick={() => setSelected(document.id)}>
                        <History className="mr-1 h-3.5 w-3.5" />
                        History
                      </Button>
                    )}
                    {capabilities.includes("resident_documents.upload_version") && (
                      <label className="inline-flex cursor-pointer items-center rounded-md px-3 text-xs hover:bg-muted">
                        New Version
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f)
                              try {
                                await onUploadVersion(document.id, f);
                                toast.success("New document version uploaded");
                              } catch (error) {
                                toast.error(
                                  error instanceof Error ? error.message : "Upload failed",
                                );
                              }
                          }}
                        />
                      </label>
                    )}
                    {capabilities.includes("resident_documents.change_status") && (
                      <Select onValueChange={(v) => onStatus(document.id, v as never)}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {["active", "expired", "revoked", "entered_in_error", "archived"].map(
                            (s) => (
                              <SelectItem key={s} value={s}>
                                {labels(s)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {search || category !== "all"
              ? "No documents match the selected filters."
              : "No documents have been uploaded for this resident."}
          </p>
        )}
      </CardContent>
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUpload={onUpload} />
      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Previous files remain preserved when a new version is uploaded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  Version {v.versionNumber}
                  {state.documents.find((d) => d.id === selected)?.currentVersionId === v.id
                    ? " · Current"
                    : ""}
                </div>
                <div className="text-muted-foreground">
                  {v.displayFileName} · {new Date(v.uploadedAt).toLocaleString("en-IE")}
                </div>
                <div className="text-xs text-muted-foreground">{labels(v.changeReasonCode)}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
function UploadDialog({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpload: (m: UploadDocumentMetadata, f: File) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResidentDocumentType>("other");
  const [category, setCategory] = useState<ResidentDocumentCategory>("administrative");
  const [sensitivity, setSensitivity] = useState<ResidentDocumentSensitivity>("standard");
  const [source, setSource] = useState<ResidentDocumentSource>("staff_upload");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File>();
  const save = async () => {
    if (!file) return toast.error("Select a file");
    try {
      await onUpload(
        { title, documentType: type, category, sensitivity, source, description },
        file,
      );
      toast.success("Document uploaded");
      onOpenChange(false);
      setTitle("");
      setFile(undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Resident Document</DialogTitle>
          <DialogDescription>
            Classification and sensitivity are required. Uploading does not change clinical or legal
            status.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>File</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>
          <div>
            <Label>Document Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as never)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {labels(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as never)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {labels(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sensitivity</Label>
            <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as never)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["standard", "sensitive", "highly_sensitive"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {labels(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as never)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "staff_upload",
                  "resident_upload",
                  "hospital",
                  "gp",
                  "pharmacy",
                  "family",
                  "nominated_representative",
                  "external_provider",
                  "pre_admission",
                  "other",
                ].map((v) => (
                  <SelectItem key={v} value={v}>
                    {labels(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || !file} onClick={save}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
