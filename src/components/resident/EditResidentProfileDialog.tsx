import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Camera, Check, ChevronsUpDown, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Resident, UserProfile } from "@/lib/care/types";
import type { UpdateResidentProfileInput } from "@/lib/care/residentProfile";
import { MARITAL_STATUS_OPTIONS, NATIONALITY_OPTIONS, RELIGION_OPTIONS } from "@/lib/care/residentReferenceData";

const NONE = "__none__";
export type ResidentProfileEditSection = "resident" | "clinical" | "bed" | "team" | "preferences";

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
  registrationNumber: string;
  nationality: string;
  ethnicity: string;
  maritalStatus: string;
  occupation: string;
  phone: string;
  email: string;
  address: string;
  communicationNeeds: string;
  religion: string;
  religionOther: string;
  maritalStatusOther: string;
  nationalityOther: string;
  preferredLanguage: string;
  allergies: string;
  primaryDiagnosis: string;
  medicalHistory: string;
  currentMedication: string;
  consultant: string;
  emergencyContact: string;
  mentalCapacity: Resident["mentalCapacity"];
  admissionDate: string;
  admissionType: NonNullable<Resident["admissionType"]>;
  admissionSource: NonNullable<Resident["admissionSource"]>;
  currentAccommodationStatus: NonNullable<Resident["currentAccommodationStatus"]>;
  readmittedWithin28Days: "yes" | "no";
  dependencyLevel: NonNullable<Resident["dependencyLevel"]>;
  supportLevel: NonNullable<Resident["supportLevel"]>;
  medicalCardNumber: string;
  medicalCardExpiry: string;
  dpsNumber: string;
  dpsExpiry: string;
  ppsNumber: string;
  pensionReference: string;
  hseOffice: string;
  bedType: NonNullable<Resident["bed"]>["bedType"];
  mattressType: NonNullable<Resident["bed"]>["mattressType"];
  bedInstallationDate: string;
  bedReviewDate: string;
  photoUrl: string;
  namedNurseUserId: string;
  namedCarerUserId: string;
  keyWorkerUserId: string;
  gpUserId: string;
  primaryContactId: string;
};

export function EditResidentProfileDialog({
  resident,
  users,
  canEditSensitiveIdentifiers,
  section,
  open,
  onOpenChange,
  onSave,
}: {
  resident: Resident;
  users: UserProfile[];
  canEditSensitiveIdentifiers: boolean;
  section?: ResidentProfileEditSection;
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
    registrationNumber: resident.registrationNumber || "",
    nationality: resident.nationality || "",
    ethnicity: resident.ethnicity || "",
    maritalStatus: resident.maritalStatus || "",
    occupation: resident.occupation || resident.aKeyToMe?.occupation || "",
    phone: resident.phone || "",
    email: resident.email || "",
    address: resident.address || "",
    communicationNeeds: resident.communicationNeeds || "",
    religion: resident.religion || "",
    religionOther: "",
    maritalStatusOther: "",
    nationalityOther: "",
    preferredLanguage: resident.preferredLanguage || "",
    allergies: resident.allergies || "",
    primaryDiagnosis: resident.primaryDiagnosis || "",
    medicalHistory: resident.medicalHistory || "",
    currentMedication: resident.currentMedication || "",
    consultant: resident.consultant || "",
    emergencyContact: resident.emergencyContact || "",
    mentalCapacity: resident.mentalCapacity || "not_assessed",
    admissionDate: resident.admissionDate || "",
    admissionType: resident.admissionType || "long_term",
    admissionSource: resident.admissionSource || "",
    currentAccommodationStatus: resident.currentAccommodationStatus || "permanent",
    readmittedWithin28Days: resident.readmittedWithin28Days ? "yes" : "no",
    dependencyLevel: resident.dependencyLevel || "medium",
    supportLevel: resident.supportLevel || "standard",
    medicalCardNumber: resident.medicalCardNumber || "",
    medicalCardExpiry: resident.medicalCardExpiry || "",
    dpsNumber: resident.dpsNumber || "",
    dpsExpiry: resident.dpsExpiry || "",
    ppsNumber: resident.ppsNumber || "",
    pensionReference: resident.pensionReference || "",
    hseOffice: resident.hseOffice || "",
    bedType: resident.bed?.bedType || "standard",
    mattressType: resident.bed?.mattressType || "standard",
    bedInstallationDate: resident.bed?.installationDate || "",
    bedReviewDate: resident.bed?.reviewDate || "",
    photoUrl: resident.photoUrl || "",
    namedNurseUserId: users.find((item) => item.name === resident.keyWorkers?.namedNurse)?.id || NONE,
    namedCarerUserId: users.find((item) => item.name === resident.keyWorkers?.namedCarer)?.id || NONE,
    keyWorkerUserId: users.find((item) => item.name === resident.keyWorkers?.keyWorker)?.id || NONE,
    gpUserId: users.find((item) => item.name === resident.gp)?.id || NONE,
    primaryContactId: resident.nextOfKinList?.find((item) => item.primaryContact)?.id || NONE,
  });

  const [form, setForm] = useState<FormState>(initial);
  const [baseline, setBaseline] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const dirty = JSON.stringify(form) !== baseline;
  const sectionTitle: Record<ResidentProfileEditSection, string> = { resident: "Resident Information", clinical: "Clinical Summary", bed: "Bed & Accommodation", team: "Healthcare Team", preferences: "Resident Preferences" };
  const show = (...sections: ResidentProfileEditSection[]) => !section || sections.includes(section);

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
    ["residentNumber", "registrationNumber", "medicalCardNumber", "medicalCardExpiry", "dpsNumber", "dpsExpiry", "ppsNumber", "pensionReference"].includes(key) && !canEditSensitiveIdentifiers ? null : (
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
      const { residentNumber, registrationNumber, medicalCardNumber, medicalCardExpiry, dpsNumber, dpsExpiry, ppsNumber, pensionReference, readmittedWithin28Days, religionOther, maritalStatusOther, nationalityOther, bedType, mattressType, bedInstallationDate, bedReviewDate, ...editableForm } = form;
      const payload: UpdateResidentProfileInput = {
        ...editableForm,
        religion: form.religion === "Other" && religionOther.trim() ? religionOther.trim() : form.religion,
        maritalStatus: form.maritalStatus === "Other" && maritalStatusOther.trim() ? maritalStatusOther.trim() : form.maritalStatus,
        nationality: form.nationality === "Other" && nationalityOther.trim() ? nationalityOther.trim() : form.nationality,
        readmittedWithin28Days: readmittedWithin28Days === "yes",
        bed: bedInstallationDate || bedReviewDate ? { bedType, mattressType, installationDate: bedInstallationDate, reviewDate: bedReviewDate } : undefined,
        ...(canEditSensitiveIdentifiers ? { residentNumber, registrationNumber, medicalCardNumber, medicalCardExpiry, dpsNumber, dpsExpiry, ppsNumber, pensionReference } : {}),
        namedNurseUserId: form.namedNurseUserId === NONE ? "" : form.namedNurseUserId,
        keyWorkerUserId: form.keyWorkerUserId === NONE ? "" : form.keyWorkerUserId,
        gpUserId: form.gpUserId === NONE ? "" : form.gpUserId,
        primaryContactId: form.primaryContactId === NONE ? "" : form.primaryContactId,
        reason: "Resident Profile edited",
      };
      const sectionKeys: Record<ResidentProfileEditSection, Array<keyof UpdateResidentProfileInput>> = {
        resident: ["firstName", "middleName", "lastName", "preferredName", "previousSurname", "dob", "gender", "residentNumber", "registrationNumber", "nationality", "ethnicity", "maritalStatus", "occupation", "phone", "email", "address", "admissionDate", "admissionType", "admissionSource", "currentAccommodationStatus", "readmittedWithin28Days", "dependencyLevel", "supportLevel", "medicalCardNumber", "medicalCardExpiry", "dpsNumber", "dpsExpiry", "ppsNumber", "pensionReference", "hseOffice", "reason"],
        clinical: ["primaryDiagnosis", "medicalHistory", "allergies", "mentalCapacity", "communicationNeeds", "reason"],
        bed: ["bed", "reason"],
        team: ["consultant", "namedNurseUserId", "namedCarerUserId", "keyWorkerUserId", "gpUserId", "primaryContactId", "reason"],
        preferences: ["preferredName", "preferredLanguage", "communicationNeeds", "religion", "otherPreferences", "reason"],
      };
      onSave(section ? Object.fromEntries(sectionKeys[section].filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]])) as UpdateResidentProfileInput : payload);
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
          <DialogTitle>{section ? `Edit ${sectionTitle[section]}` : "Edit Resident Profile"}</DialogTitle>
          <DialogDescription>{resident.firstName} {resident.lastName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {show("resident") && <Section title="Profile Photo">
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 rounded-xl">
                <AvatarImage src={form.photoUrl} alt={`${form.firstName} ${form.lastName}`} className="object-cover" />
                <AvatarFallback className="rounded-xl text-xl">
                  {form.firstName[0] || ""}
                  {form.lastName[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Camera className="h-4 w-4" />
                    {photoLoading ? "Processing image..." : "Upload image"}
                    <input type="file" accept="image/*" className="sr-only" disabled={photoLoading} onChange={(event) => handlePhotoFile(event.target.files?.[0])} />
                  </label>
                  {form.photoUrl && <Button variant="outline" type="button" onClick={() => update({ photoUrl: "" })}><X className="mr-2 h-4 w-4" /> Remove</Button>}
                </div>
              </div>
            </div>
          </Section>}

          {show("resident") && <Section title="Personal Information">
            <div className="grid gap-3 md:grid-cols-3">
              {field("firstName", "Legal first name")}
              {field("middleName", "Middle name")}
              {field("lastName", "Legal surname")}
              {field("preferredName", "Preferred name")}
              {field("previousSurname", "Previous surname")}
              {field("dob", "Date of birth", "date")}
              {field("residentNumber", "Resident Identifier")}
              {field("registrationNumber", "Registration Number")}
            </div>
          </Section>}

          {show("resident", "preferences") && <Section title="Personal Background and Communication">
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
              <SearchableSelect label="Nationality" value={form.nationality} options={NATIONALITY_OPTIONS} onChange={(nationality) => update({ nationality })} />
              {form.nationality === "Other" && field("nationalityOther", "Please specify nationality")}
              {field("ethnicity", "Ethnicity")}
              <SearchableSelect label="Marital Status" value={form.maritalStatus} options={MARITAL_STATUS_OPTIONS} onChange={(maritalStatus) => update({ maritalStatus })} />
              {form.maritalStatus === "Other" && field("maritalStatusOther", "Please specify marital status")}
              {field("occupation", "Occupation")}
              {field("preferredLanguage", "Preferred language")}
              <SearchableSelect label="Religion" value={form.religion} options={RELIGION_OPTIONS} onChange={(religion) => update({ religion })} />
              {form.religion === "Other" && field("religionOther", "Please specify religion")}
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
          </Section>}

          {show("resident") && <Section title="Contact Information">
            <div className="grid gap-3 md:grid-cols-2">
              {field("phone", "Resident Phone Number")}
              {field("email", "Email Address", "email")}
              <div className="space-y-1.5 md:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(event) => update({ address: event.target.value })} />
              </div>
            </div>
          </Section>}

          {show("resident") && <Section title="Admission Details">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Admission Date <span className="text-destructive">*</span></Label><Input type="date" value={form.admissionDate} onChange={(event) => update({ admissionDate: event.target.value })} /></div>
              <div className="space-y-1.5"><Label>Admission Type</Label><Select value={form.admissionType} onValueChange={(admissionType) => update({ admissionType: admissionType as FormState["admissionType"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="long_term">Long Term</SelectItem><SelectItem value="short_stay">Short Term</SelectItem><SelectItem value="respite">Respite</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Admission Source</Label><Select value={form.admissionSource || NONE} onValueChange={(admissionSource) => update({ admissionSource: admissionSource === NONE ? "" : admissionSource as FormState["admissionSource"] })}><SelectTrigger><SelectValue placeholder="Not recorded" /></SelectTrigger><SelectContent><SelectItem value={NONE}>Not recorded</SelectItem><SelectItem value="home">Home</SelectItem><SelectItem value="hospital">Acute Hospital</SelectItem><SelectItem value="another_care_home">Another Nursing Home</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Current Accommodation Status</Label><Select value={form.currentAccommodationStatus} onValueChange={(currentAccommodationStatus) => update({ currentAccommodationStatus: currentAccommodationStatus as FormState["currentAccommodationStatus"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="permanent">Permanent placement</SelectItem><SelectItem value="temporary">Temporary placement</SelectItem><SelectItem value="hospital">In hospital</SelectItem><SelectItem value="leave">Temporary leave</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Re-admitted Within 28 Days</Label><Select value={form.readmittedWithin28Days} onValueChange={(readmittedWithin28Days) => update({ readmittedWithin28Days: readmittedWithin28Days as FormState["readmittedWithin28Days"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Current Nursing Home / Facility</Label><Input value={resident.facilityId || "Current ORITAS facility"} disabled /></div>
            </div>
          </Section>}

          {show("resident") && <Section title="Resident Classification">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Dependency Level</Label><Select value={form.dependencyLevel} onValueChange={(dependencyLevel) => update({ dependencyLevel: dependencyLevel as FormState["dependencyLevel"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low Dependency</SelectItem><SelectItem value="medium">Medium Dependency</SelectItem><SelectItem value="high">High Dependency</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Support Level</Label><Select value={form.supportLevel} onValueChange={(supportLevel) => update({ supportLevel: supportLevel as FormState["supportLevel"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minimal">Minimal support</SelectItem><SelectItem value="standard">Standard support</SelectItem><SelectItem value="enhanced">Enhanced support</SelectItem><SelectItem value="one_to_one">One-to-one support</SelectItem></SelectContent></Select></div>
            </div>
          </Section>}

          {show("resident") && <Section title="Healthcare Information">
            <div className="grid gap-3 md:grid-cols-2">
              {field("medicalCardNumber", "Medical Card Number")}
              {field("medicalCardExpiry", "Medical Card Expiry Date", "date")}
              {field("dpsNumber", "DPS Number")}
              {field("dpsExpiry", "DPS Expiry Date", "date")}
              {field("ppsNumber", "PPS Number")}
            </div>
          </Section>}

          {show("resident", "preferences") && <Section title={show("preferences") && !show("resident") ? "Resident Preferences" : "Additional Information"}>
            <div className="grid gap-3 md:grid-cols-2">
              {field("pensionReference", "Pension Reference")}
              {field("hseOffice", "HSE Office / Area")}
            </div>
          </Section>}

          {show("clinical") && <Section title="Clinical Information">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2"><Label>Primary diagnosis</Label><Input value={form.primaryDiagnosis} onChange={(event) => update({ primaryDiagnosis: event.target.value })} placeholder="Primary diagnosis or reason for care" /></div>
              <div className="space-y-1.5"><Label>Consultant</Label><Input value={form.consultant} onChange={(event) => update({ consultant: event.target.value })} placeholder="Consultant name or service" /></div>
              <div className="space-y-1.5"><Label>Emergency contact</Label><Input value={form.emergencyContact} onChange={(event) => update({ emergencyContact: event.target.value })} placeholder="Name and phone number" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Medical history</Label><Textarea value={form.medicalHistory} onChange={(event) => update({ medicalHistory: event.target.value })} rows={3} placeholder="Relevant diagnoses, history and clinical background" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Current medication</Label><Textarea value={form.currentMedication} onChange={(event) => update({ currentMedication: event.target.value })} rows={3} placeholder="Current medication summary" /></div>
              <div className="space-y-1.5"><Label>Mental capacity</Label><Select value={form.mentalCapacity} onValueChange={(mentalCapacity) => update({ mentalCapacity: mentalCapacity as Resident["mentalCapacity"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_assessed">Not assessed</SelectItem><SelectItem value="has_capacity">Has capacity</SelectItem><SelectItem value="lacks_capacity">Lacks capacity</SelectItem><SelectItem value="fluctuating">Fluctuating capacity</SelectItem></SelectContent></Select></div>
            </div>
          </Section>}

          {show("bed") && <Section title="Bed Management">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Bed type</Label><Select value={form.bedType} onValueChange={(bedType) => update({ bedType: bedType as FormState["bedType"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["standard", "low", "profiling", "bariatric", "pressure_relief", "air_mattress", "specialist"].map((value) => <SelectItem key={value} value={value}>{value.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Mattress type</Label><Select value={form.mattressType} onValueChange={(mattressType) => update({ mattressType: mattressType as FormState["mattressType"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["standard", "foam", "dynamic", "air_mattress", "pressure_relieving", "alternating_air", "low_air_loss", "gel"].map((value) => <SelectItem key={value} value={value}>{value.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Installed date</Label><Input type="date" value={form.bedInstallationDate} onChange={(event) => update({ bedInstallationDate: event.target.value })} /></div>
              <div className="space-y-1.5"><Label>Review date</Label><Input type="date" value={form.bedReviewDate} onChange={(event) => update({ bedReviewDate: event.target.value })} /></div>
            </div>
          </Section>}

          {show("team") && <Section title="Professional and Contact Relationships">
            <div className="grid gap-3 md:grid-cols-2">
              <Relationship label="Named Nurse" value={form.namedNurseUserId} onChange={(value) => update({ namedNurseUserId: value })} options={homeUsers.filter((item) => ["nurse", "cnm", "don"].includes(item.role))} />
              <Relationship label="Named Carer" value={form.namedCarerUserId} onChange={(value) => update({ namedCarerUserId: value })} options={homeUsers.filter((item) => ["carer", "nurse"].includes(item.role))} />
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
          </Section>}

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
    <section className="rounded-lg border border-border bg-muted/20 p-4 shadow-sm">
      <h3 className="mb-4 border-b border-border pb-2 text-xl font-semibold leading-7 text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
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

function SearchableSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const values = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="min-h-11 w-full justify-between font-normal">
            <span className="truncate">{value || `Select ${label.toLowerCase()}`}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No matching options.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="not-recorded" onSelect={() => { onChange(""); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${!value ? "opacity-100" : "opacity-0"}`} />Not recorded
                </CommandItem>
                {values.map((option) => (
                  <CommandItem key={option} value={option} onSelect={() => { onChange(option); setOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${value === option ? "opacity-100" : "opacity-0"}`} />{option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
