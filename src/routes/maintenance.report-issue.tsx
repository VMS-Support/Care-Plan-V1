import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2 } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  deriveQuickIssue,
  likelyDuplicateIssues,
  type ImmediateRiskAnswer,
  type SimpleIssueType,
} from "@/domain/maintenance/quickIssue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MaintenanceWorkOrder } from "@/lib/care/types";

export const Route = createFileRoute("/maintenance/report-issue")({
  head: () => ({ meta: [{ title: "Report an Issue - ORITAS" }] }),
  component: ReportIssue,
});
const issueTypes: Array<[SimpleIssueType, string]> = [
  ["ELECTRICAL", "Electrical"],
  ["PLUMBING", "Plumbing"],
  ["HEATING", "Heating"],
  ["CALL_BELL", "Call Bell"],
  ["BED_EQUIPMENT", "Bed or Equipment"],
  ["ROOM_BUILDING", "Room or Building"],
  ["CLEANING_SPILL", "Cleaning or Spill"],
  ["FIRE_SAFETY", "Fire Safety"],
  ["WATER_LEAK", "Water Leak"],
  ["OTHER", "Other"],
];
function ReportIssue() {
  const care = useCare();
  const homes = care.facilities.filter((home) =>
    care.canAccess("maintenance.work_orders.create", { nursingHomeId: home.id }),
  );
  const [step, setStep] = useState<"FORM" | "REVIEW" | "DUPLICATE" | "SUCCESS">("FORM");
  const [created, setCreated] = useState<MaintenanceWorkOrder>();
  const [duplicate, setDuplicate] = useState<MaintenanceWorkOrder>();
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    homeId:
      homes.length === 1
        ? homes[0].id
        : care.activeFacilityId && homes.some((x) => x.id === care.activeFacilityId)
          ? care.activeFacilityId
          : "",
    wardId: "",
    roomId: "",
    bedId: "",
    assetId: "",
    exactLocation: "",
    description: "",
    issueType: "OTHER" as SimpleIssueType,
    risk: "" as ImmediateRiskAnswer | "",
  });
  const rooms = care.rooms.filter(
    (x) =>
      String(x.facilityId || x.nursingHomeId) === form.homeId &&
      (!form.wardId || String(x.wardId) === form.wardId),
  );
  const beds = care.beds.filter((x) => String(x.roomId) === form.roomId && x.active);
  const assets = care.maintenanceAssets.filter(
    (x) => x.homeId === form.homeId && (!form.roomId || String(x.roomId) === form.roomId),
  );
  const input = () => deriveQuickIssue({ ...form, risk: form.risk as ImmediateRiskAnswer });
  const review = () => {
    if (!form.homeId) return setError("Select a Nursing Home.");
    if (!form.roomId && !form.exactLocation.trim()) return setError("Tell us where the issue is.");
    if (!form.description.trim()) return setError("Describe what is wrong.");
    if (!form.risk) return setError("Tell us whether anyone may be at immediate risk.");
    setError("");
    const match = likelyDuplicateIssues(care.maintenanceWorkOrders, input())[0];
    if (match) {
      setDuplicate(match);
      setStep("DUPLICATE");
    } else setStep("REVIEW");
  };
  const submit = () => {
    try {
      const record = care.addMaintenanceWorkOrder(input());
      if (file)
        care.addWorkOrderAttachment(record.id, {
          originalFileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          category: "PHOTO",
          photoCategory: "BEFORE",
          description: "Photograph supplied when the issue was reported",
          clientRequestId: `quick-issue-photo:${record.id}:${file.name}`,
        });
      setCreated(record);
      setStep("SUCCESS");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The issue could not be submitted.");
      setStep("FORM");
    }
  };
  if (!homes.length)
    return (
      <main className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-base">
            You do not have permission to report an issue.
          </CardContent>
        </Card>
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 pb-28 md:p-8">
      <header>
        <Link
          to="/maintenance/work"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Work
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Report an Issue</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Tell the maintenance team what is wrong. You do not need to know technical details.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-base text-red-900"
        >
          {error}
        </div>
      )}
      {step === "FORM" && (
        <Card>
          <CardContent className="space-y-6 p-5 md:p-7">
            {homes.length > 1 && (
              <Field label="Nursing Home">
                <select
                  className="h-12 w-full rounded-md border bg-background px-3 text-base"
                  value={form.homeId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      homeId: e.target.value,
                      wardId: "",
                      roomId: "",
                      bedId: "",
                      assetId: "",
                    })
                  }
                >
                  <option value="">Select Nursing Home</option>
                  {homes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div>
              <h2 className="text-xl font-semibold">Where is the issue?</h2>
              <p className="text-base text-muted-foreground">
                Choose a room, or type the location if it is somewhere else.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Wing or Unit">
                <select
                  className="h-12 w-full rounded-md border bg-background px-3 text-base"
                  value={form.wardId}
                  onChange={(e) =>
                    setForm({ ...form, wardId: e.target.value, roomId: "", bedId: "" })
                  }
                >
                  <option value="">Any wing</option>
                  {care.wards
                    .filter((x) => x.facilityId === form.homeId)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Room or Area">
                <select
                  className="h-12 w-full rounded-md border bg-background px-3 text-base"
                  value={form.roomId}
                  onChange={(e) =>
                    setForm({ ...form, roomId: e.target.value, bedId: "", assetId: "" })
                  }
                >
                  <option value="">Select room</option>
                  {rooms.map((x) => (
                    <option key={x.id} value={String(x.id)}>
                      {x.name || `Room ${x.number}`}
                    </option>
                  ))}
                </select>
              </Field>
              {form.roomId && (
                <>
                  <Field label="Bed (optional)">
                    <select
                      className="h-12 w-full rounded-md border bg-background px-3 text-base"
                      value={form.bedId}
                      onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                    >
                      <option value="">No bed selected</option>
                      {beds.map((x) => (
                        <option key={x.id} value={String(x.id)}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Asset (optional)">
                    <select
                      className="h-12 w-full rounded-md border bg-background px-3 text-base"
                      value={form.assetId}
                      onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                    >
                      <option value="">No asset selected</option>
                      {assets.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.assetName}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}
              <Field label="Exact location (optional)">
                <Input
                  className="h-12 text-base"
                  value={form.exactLocation}
                  onChange={(e) => setForm({ ...form, exactLocation: e.target.value })}
                  placeholder="For example: beside the dining-room entrance"
                />
              </Field>
            </div>
            <Field label="What type of issue is it?">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {issueTypes.map(([value, label]) => (
                  <Button
                    type="button"
                    key={value}
                    variant={form.issueType === value ? "default" : "outline"}
                    className="h-14 whitespace-normal"
                    onClick={() => setForm({ ...form, issueType: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="What is wrong?">
              <Textarea
                className="min-h-36 text-base"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the problem, such as “The call bell in Room 3 is not working.”"
              />
            </Field>
            <Field label="Add a photograph (optional)">
              <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-md border border-dashed px-4 text-base font-medium focus-within:ring-2 focus-within:ring-ring">
                <Camera className="mr-2 h-5 w-5" />
                {file ? file.name : "Choose or take a photograph"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>
            </Field>
            <Field label="Is anyone at immediate risk?">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["NO", "No"],
                    ["YES", "Yes"],
                    ["NOT_SURE", "Not sure"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    type="button"
                    size="lg"
                    key={value}
                    variant={form.risk === value ? "default" : "outline"}
                    onClick={() => setForm({ ...form, risk: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {form.risk === "YES" && (
                <p className="mt-3 rounded-md bg-red-50 p-3 text-base text-red-900">
                  <AlertTriangle className="mr-2 inline h-5 w-5" />
                  Follow the Nursing Home’s immediate escalation procedure. Do not rely only on this
                  report in an emergency.
                </p>
              )}
            </Field>
            <Button className="h-14 w-full text-lg" onClick={review}>
              Review Issue
            </Button>
          </CardContent>
        </Card>
      )}
      {step === "REVIEW" && (
        <Review form={form} care={care} file={file} submit={submit} back={() => setStep("FORM")} />
      )}{" "}
      {step === "DUPLICATE" && duplicate && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-2xl font-semibold">A similar issue may already be reported</h2>
            <div className="rounded-lg border p-4">
              <strong>
                {duplicate.workOrderNumber} — {duplicate.title}
              </strong>
              <p className="mt-1 text-base text-muted-foreground">Status: {duplicate.status}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button size="lg" asChild>
                <Link
                  to="/maintenance/work-orders/$workOrderId"
                  params={{ workOrderId: duplicate.id }}
                >
                  View Existing Work Order
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  care.addWorkOrderNote(duplicate.id, {
                    noteType: "GENERAL",
                    content: `Additional report: ${form.description}`,
                    clientRequestId: `quick-issue-note:${duplicate.id}:${Date.now()}`,
                  });
                  if (file)
                    care.addWorkOrderAttachment(duplicate.id, {
                      originalFileName: file.name,
                      mimeType: file.type || "application/octet-stream",
                      size: file.size,
                      category: "PHOTO",
                      photoCategory: "DAMAGE",
                      description: "Additional photograph supplied by the reporter",
                      clientRequestId: `quick-issue-existing-photo:${duplicate.id}:${file.name}:${file.size}`,
                    });
                  setCreated(duplicate);
                  setStep("SUCCESS");
                }}
              >
                Add Information to Existing
              </Button>
              <Button size="lg" variant="outline" onClick={() => setStep("REVIEW")}>
                Report as a Separate Issue
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setStep("FORM")}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === "SUCCESS" && created && (
        <Card>
          <CardContent className="space-y-5 p-7 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-700" />
            <h2 className="text-2xl font-semibold">Issue reported successfully</h2>
            <div className="text-lg">
              <strong>Work Order: {created.workOrderNumber}</strong>
              <br />
              Status: {created.status}
            </div>
            <p className="text-base">What happens next: The maintenance team has been notified.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="lg" asChild>
                <Link
                  to="/maintenance/work-orders/$workOrderId"
                  params={{ workOrderId: created.id }}
                >
                  View Work Order
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setCreated(undefined);
                  setFile(undefined);
                  setForm({ ...form, description: "", risk: "" });
                  setStep("FORM");
                }}
              >
                Report Another Issue
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/maintenance/work">Return to Work</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
function Review({ form, care, file, submit, back }: any) {
  const room = care.rooms.find((x: any) => String(x.id) === form.roomId);
  const ward = care.wards.find((x: any) => String(x.id) === form.wardId);
  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold">Review your report</h2>
        <dl className="space-y-4 text-base">
          <Item
            label="Location"
            value={[room?.name || room?.number, ward?.name, form.exactLocation]
              .filter(Boolean)
              .join(", ")}
          />
          <Item label="Issue" value={form.description} />
          <Item
            label="Immediate risk"
            value={form.risk === "NOT_SURE" ? "Not sure" : form.risk === "YES" ? "Yes" : "No"}
          />
          <Item label="Photograph" value={file ? "1 attached" : "None attached"} />
        </dl>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="lg" variant="outline" onClick={back}>
            Go Back
          </Button>
          <Button size="lg" onClick={submit}>
            Submit Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="block space-y-2">
      <span className="text-base font-semibold">{label}</span>
      {children}
    </label>
  );
}
function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd className="mt-1 text-muted-foreground">{value || "Not provided"}</dd>
    </div>
  );
}
