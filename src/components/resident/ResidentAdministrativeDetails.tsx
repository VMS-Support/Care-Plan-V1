import { useState } from "react";
import { AlertCircle, ChevronDown, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResidentAdministrativeDetailsViewModel } from "@/lib/care/residentAdministrativeDetails";
const Field = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  ) : null;
export function ResidentAdministrativeDetails({
  model,
  canEdit,
  onEdit,
  onOpenContacts,
}: {
  model: ResidentAdministrativeDetailsViewModel;
  canEdit: boolean;
  onEdit: () => void;
  onOpenContacts: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Resident Details
            {model.attention.length > 0 && (
              <Badge variant="outline" className="text-amber-700">
                <AlertCircle className="mr-1 h-3 w-3" />
                {model.attention.length} attention
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Personal, admission, classification and healthcare information.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          View Resident Details
          <ChevronDown
            className={`ml-1 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-5">
          {model.attention.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {model.attention.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Group title="Personal Information">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Legal Name" value={model.identification.legalName} />
                <Field label="Preferred Name" value={model.identification.preferredName} />
                <Field label="Date of Birth" value={model.identification.dateOfBirth} />
                <Field label="Resident Identifier" value={model.identification.residentNumber} />
                <Field label="Registration Number" value={model.identification.registrationNumber} />
                <Field label="Gender" value={model.identification.gender} />
                <Field label="Nationality" value={model.identification.nationality} />
                <Field label="Ethnicity" value={model.identification.ethnicity} />
                <Field label="Religion" value={model.identification.religion} />
                <Field label="Marital Status" value={model.identification.maritalStatus} />
                <Field label="Occupation" value={model.identification.occupation} />
                <Field label="Language" value={model.identification.preferredLanguage} />
              </div>
            </Group>
            <Group title="Admission Details">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Admission Date"
                  value={model.admissionAndRegistration.admissionDate}
                />
                <Field
                  label="Admission Type"
                  value={model.admissionAndRegistration.admissionType}
                />
                <Field label="Admission Source" value={model.admissionAndRegistration.admittedFrom} />
                <Field
                  label="Current Status"
                  value={model.admissionAndRegistration.residentStatus}
                />
                <Field label="Current Accommodation Status" value={model.admissionAndRegistration.currentAccommodationStatus} />
                <Field label="Re-admitted Within 28 Days" value={model.admissionAndRegistration.readmittedWithin28Days} />
                <Field label="Nursing Home / Facility" value={model.admissionAndRegistration.nursingHomeFacility} />
              </div>
            </Group>
            <Group title="Contact Information">
              <Field label="Address" value={model.residentContactDetails.address} />
              <Field label="Phone" value={model.residentContactDetails.phone} />
              <Field label="Email" value={model.residentContactDetails.email} />
            </Group>
            <Group title="Resident Classification">
              <Field label="Dependency Level" value={model.residentClassification.dependencyLevel} />
              <Field label="Support Level" value={model.residentClassification.supportLevel} />
            </Group>
            <Group title="Administrative Representatives">
              <Field label="First Contact" value={model.representatives.firstContact} />
              <Field
                label="Nominated Representative"
                value={model.representatives.nominatedRepresentative}
              />
              <div className="mt-2">
                <Button size="sm" variant="link" className="px-0" onClick={onOpenContacts}>
                  Open Contacts and Representatives
                </Button>
              </div>
            </Group>
            {model.fundingAndInsurance ? (
              <Group title="Funding and Insurance">
                <Field label="Provider" value={model.fundingAndInsurance.provider} />
                <Field label="Policy Number" value={model.fundingAndInsurance.maskedPolicyNumber} />
                <Field label="Expiry" value={model.fundingAndInsurance.expiryDate} />
              </Group>
            ) : (
              <Group title="Funding and Insurance">
                <p className="text-sm text-muted-foreground">
                  Health Insurance details have not been recorded.
                </p>
              </Group>
            )}
            {model.medicalCards ? (
              <Group title="Healthcare Information">
                <Field label="Medical Card" value={model.medicalCards.maskedMedicalCardNumber} />
                <Field label="Medical Card Expiry" value={model.medicalCards.medicalCardExpiry} />
                <Field label="DPS Number" value={model.healthcareIdentifiers?.maskedDpsNumber} />
                <Field label="DPS Expiry" value={model.healthcareIdentifiers?.dpsExpiry} />
                <Field label="PPS Number" value={model.healthcareIdentifiers?.maskedPpsNumber} />
              </Group>
            ) : (
              <Group title="Healthcare Information">
                <p className="text-sm text-muted-foreground">
                  Healthcare identifiers have not been recorded.
                </p>
              </Group>
            )}
            <Group title="Additional Information">
              <Field label="Pension Reference" value={model.additionalInformation?.maskedPensionReference} />
              <Field label="HSE Office / Area" value={model.additionalInformation?.hseOffice} />
            </Group>
          </div>
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit Administrative Details
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-lg border p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
