import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Resident, UserProfile } from "@/lib/care/types";
import type { UpdateResidentProfileInput } from "@/lib/care/residentProfile";

const NONE = "__none__";

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  previousSurname: string;
  dob: string;
  gender: Resident["gender"];
  pronouns: string;
  residentNumber: string;
  nationality: string;
  phone: string;
  email: string;
  address: string;
  communicationNeeds: string;
  religion: string;
  preferredLanguage: string;
  allergies: string;
  photoUrl: string;
  namedNurseUserId: string;
  keyWorkerUserId: string;
  gpUserId: string;
  primaryContactId: string;
};

export function EditResidentProfileDialog({
  resident,
  users,
  canEditSensitiveIdentifiers,
  open,
  onOpenChange,
  onSave,
}: {
  resident: Resident;
  users: UserProfile[];
  canEditSensitiveIdentifiers: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: UpdateResidentProfileInput) => void;
}) {
  const initial = (): FormState => ({
    firstName: resident.firstName,
    middleName: resident.middleName || "",
    lastName: resident.lastName,
    preferredName: resident.preferredName || "",
    previousSurname: resident.previousSurname || "",
    dob: resident.dob,
    gender: resident.gender,
    pronouns: resident.pronouns || "",
    residentNumber: resident.residentNumber || resident.externalResidentId || "",
    nationality: resident.nationality || "",
    phone: resident.phone || "",
    email: resident.email || "",
    address: resident.address || "",
    communicationNeeds: resident.communicationNeeds || "",
    religion: resident.religion || "",
    preferredLanguage: resident.preferredLanguage || "",
    allergies: resident.allergies || "",
    photoUrl: resident.photoUrl || "",
    namedNurseUserId: users.find((item) => item.name === resident.keyWorkers?.namedNurse)?.id || NONE,
    keyWorkerUserId: users.find((item) => item.name === resident.keyWorkers?.keyWorker)?.id || NONE,
    gpUserId: users.find((item) => item.name === resident.gp)?.id || NONE,
    primaryContactId: resident.nextOfKinList?.find((item) => item.primaryContact)?.id || NONE,
  });

  const [form, setForm] = useState<FormState>(initial);
  const [baseline, setBaseline] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const dirty = JSON.stringify(form) !== baseline;

  useEffect(() => {
    if (open) {
      const next = initial();
      setForm(next);
      setBaseline(JSON.stringify(next));
    }
  }, [open, resident]);

  const homeUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          item.status === "active" &&
          (item.facilityId === resident.facilityId || item.facilityIds?.includes(resident.facilityId || "")),
      ),
    [users, resident.facilityId],
  );

  const close = () => {
    if (!dirty || typeof window === "undefined" || window.confirm("Discard unsaved resident profile changes?")) {
      onOpenChange(false);
    }
  };

  const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const field = (key: keyof FormState, label: string, type = "text") =>
    key === "residentNumber" && !canEditSensitiveIdentifiers ? null : (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Input type={type} value={String(form[key] || "")} onChange={(event) => update({ [key]: event.target.value })} />
      </div>
    );

  const imageToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Unable to load image"));
        image.onload = () => {
          const maxSize = 320;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Unable to process image"));
            return;
          }
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        image.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });

  const handlePhotoFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Choose an image smaller than 8 MB");
      return;
    }
    setPhotoLoading(true);
    try {
      update({ photoUrl: await imageToDataUrl(file) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process image");
    } finally {
      setPhotoLoading(false);
    }
  };

  const save = () => {
    try {
      const { residentNumber, ...editableForm } = form;
      onSave({
        ...editableForm,
        ...(canEditSensitiveIdentifiers ? { residentNumber } : {}),
        namedNurseUserId: form.namedNurseUserId === NONE ? "" : form.namedNurseUserId,
        keyWorkerUserId: form.keyWorkerUserId === NONE ? "" : form.keyWorkerUserId,
        gpUserId: form.gpUserId === NONE ? "" : form.gpUserId,
        primaryContactId: form.primaryContactId === NONE ? "" : form.primaryContactId,
        reason: "Resident Profile edited",
      });
      setBaseline(JSON.stringify(form));
      onOpenChange(false);
      toast.success("Resident Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update Resident Profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resident Profile</DialogTitle>
          <DialogDescription>Update resident identity, contact information, photo, allergies and professional relationships.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Section title="Profile Photo">
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 rounded-xl">
                <AvatarImage src={form.photoUrl} alt={`${form.firstName} ${form.lastName}`} className="object-cover" />
                <AvatarFallback className="rounded-xl text-xl">
                  {form.firstName[0] || ""}
                  {form.lastName[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input value={form.photoUrl} onChange={(event) => update({ photoUrl: event.target.value })} placeholder="Paste image URL or upload a file" />
                  <Button variant="outline" type="button" onClick={() => update({ photoUrl: "" })}>
                    <X className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                  <Camera className="h-4 w-4" />
                  {photoLoading ? "Processing image..." : "Upload image"}
                  <input type="file" accept="image/*" className="sr-only" disabled={photoLoading} onChange={(event) => handlePhotoFile(event.target.files?.[0])} />
                </label>
              </div>
            </div>
          </Section>

          <Section title="Identity">
            <div className="grid gap-3 md:grid-cols-3">
              {field("firstName", "Legal first name")}
              {field("middleName", "Middle name")}
              {field("lastName", "Legal surname")}
              {field("preferredName", "Preferred name")}
              {field("previousSurname", "Previous surname")}
              {field("dob", "Date of birth", "date")}
              {field("residentNumber", "Resident number")}
            </div>
          </Section>

          <Section title="Personal and Clinical Summary">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(value) => update({ gender: value as Resident["gender"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field("pronouns", "Pronouns")}
              {field("nationality", "Nationality")}
              {field("phone", "Phone")}
              {field("email", "Email", "email")}
              {field("preferredLanguage", "Preferred language")}
              {field("religion", "Religion")}
              <div className="space-y-1.5 md:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(event) => update({ address: event.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label>Allergies</Label>
                <Textarea
                  value={form.allergies}
                  onChange={(event) => update({ allergies: event.target.value })}
                  placeholder="No known drug allergies, or list allergies separated by commas"
                />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label>Communication needs</Label>
                <Textarea value={form.communicationNeeds} onChange={(event) => update({ communicationNeeds: event.target.value })} />
              </div>
            </div>
          </Section>

          <Section title="Professional and Contact Relationships">
            <div className="grid gap-3 md:grid-cols-2">
              <Relationship label="Named Nurse" value={form.namedNurseUserId} onChange={(value) => update({ namedNurseUserId: value })} options={homeUsers.filter((item) => ["nurse", "cnm", "don"].includes(item.role))} />
              <Relationship label="Key Worker" value={form.keyWorkerUserId} onChange={(value) => update({ keyWorkerUserId: value })} options={homeUsers} />
              <Relationship label="GP" value={form.gpUserId} onChange={(value) => update({ gpUserId: value })} options={homeUsers.filter((item) => item.role === "doctor")} />
              <div className="space-y-1.5">
                <Label>Primary Contact</Label>
                <Select value={form.primaryContactId} onValueChange={(value) => update({ primaryContactId: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not assigned</SelectItem>
                    {resident.nextOfKinList?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {item.relationship}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Managed through source workflows</p>
            <p className="text-muted-foreground">Current placement, DNAR and advance directives, isolation, dependency, assessments, Care Plans and medication are managed in their own workflows.</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>Cancel</Button>
          <Button type="button" disabled={!dirty || photoLoading} onClick={save}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Relationship({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: UserProfile[] }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Not assigned</SelectItem>
          {options.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name} - {item.role.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
