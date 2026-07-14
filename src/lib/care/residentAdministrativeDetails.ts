import type { Resident } from "./types";
import type { ResidentContactsViewModel } from "./residentContacts";
import type { ResidentDocumentListItem } from "./residentDocuments";
export interface ResidentAdministrativeDetailsViewModel {
  residentId: string;
  nursingHomeId: string;
  generatedAt: string;
  cacheKey: string;
  identification: {
    legalName: string;
    preferredName?: string;
    previousSurname?: string;
    dateOfBirth: string;
    residentNumber?: string;
    gender: string;
    nationality?: string;
    preferredLanguage?: string;
    religion?: string;
  };
  admissionAndRegistration: {
    admissionDate: string;
    admissionType?: string;
    admittedFrom?: string;
    residentStatus: string;
    presenceStatus?: string;
  };
  residentContactDetails: { address?: string; phone?: string; email?: string };
  fundingAndInsurance?: { provider?: string; maskedPolicyNumber?: string; expiryDate?: string };
  contractAndAccommodation?: {
    status?: string;
    signedDate?: string;
    reviewDate?: string;
    accommodationType?: string;
    roomCategory?: string;
  };
  medicalCards?: {
    medicalCardStatus?: string;
    maskedMedicalCardNumber?: string;
    medicalCardExpiry?: string;
    gpVisitCardStatus?: string;
    maskedGpVisitCardNumber?: string;
    gpVisitCardExpiry?: string;
  };
  representatives: {
    firstContact?: string;
    nominatedRepresentative?: string;
    authorityDocumentAvailable: boolean;
  };
  internalReferences?: {
    residentNumber?: string;
    legacyReference?: string;
    hospitalNumber?: string;
  };
  administrativeDocuments: ResidentDocumentListItem[];
  attention: string[];
}
const mask = (value?: string) =>
  value ? `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}` : undefined;
export function getResidentAdministrativeDetails(input: {
  resident: Resident;
  nursingHomeId: string;
  contacts: ResidentContactsViewModel;
  documents: ResidentDocumentListItem[];
  capabilities: string[];
}): ResidentAdministrativeDetailsViewModel {
  if (!input.capabilities.includes("resident_administration.view"))
    throw new Error("Missing capability: resident_administration.view");
  const r = input.resident;
  const identifiers = input.capabilities.includes("resident_administration.view_identifiers");
  const insurance =
    input.capabilities.includes("resident_administration.view_insurance") &&
    r.healthInsuranceProvider
      ? {
          provider: r.healthInsuranceProvider,
          maskedPolicyNumber: identifiers
            ? r.healthInsurancePolicyNumber
            : mask(r.healthInsurancePolicyNumber),
          expiryDate: r.healthInsuranceExpiry,
        }
      : undefined;
  const medical =
    input.capabilities.includes("resident_administration.view_insurance") &&
    (r.medicalCardNumber || r.gpVisitCardNumber)
      ? {
          medicalCardStatus: r.medicalCardNumber ? "Recorded" : undefined,
          maskedMedicalCardNumber: identifiers ? r.medicalCardNumber : mask(r.medicalCardNumber),
          medicalCardExpiry: r.medicalCardExpiry,
          gpVisitCardStatus: r.gpVisitCardNumber ? "Recorded" : undefined,
          maskedGpVisitCardNumber: identifiers ? r.gpVisitCardNumber : mask(r.gpVisitCardNumber),
          gpVisitCardExpiry: r.gpVisitCardExpiry,
        }
      : undefined;
  const now = Date.now();
  const attention = [
    insurance?.expiryDate && Date.parse(insurance.expiryDate) < now + 30 * 86400000
      ? "Health Insurance review is due."
      : "",
    medical?.medicalCardExpiry && Date.parse(medical.medicalCardExpiry) < now + 30 * 86400000
      ? "Medical Card expires within 30 days."
      : "",
    medical?.gpVisitCardExpiry && Date.parse(medical.gpVisitCardExpiry) < now
      ? "GP Visit Card has expired."
      : "",
    ...input.documents
      .filter((item) => item.attention)
      .map((item) => `${item.document.title} requires administrative review.`),
  ].filter(Boolean);
  return {
    residentId: r.id,
    nursingHomeId: input.nursingHomeId,
    generatedAt: new Date().toISOString(),
    cacheKey: JSON.stringify([
      "resident-administration",
      1,
      r.id,
      input.nursingHomeId,
      "capabilities-v1",
    ]),
    identification: {
      legalName: [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
      preferredName: r.preferredName,
      previousSurname: r.previousSurname,
      dateOfBirth: r.dob,
      residentNumber: identifiers ? r.residentNumber : mask(r.residentNumber),
      gender: r.gender,
      nationality: r.nationality,
      preferredLanguage: r.preferredLanguage,
      religion: r.religion,
    },
    admissionAndRegistration: {
      admissionDate: r.admissionDate,
      admissionType: r.admissionType,
      admittedFrom: r.admissionSource,
      residentStatus: r.lifecycleStatus || r.status,
      presenceStatus: r.presenceStatus,
    },
    residentContactDetails: { address: r.address, phone: r.phone, email: r.email },
    fundingAndInsurance: insurance,
    medicalCards: medical,
    representatives: {
      firstContact: input.contacts.primary.firstContact?.displayName,
      nominatedRepresentative: input.contacts.primary.nominatedRepresentative?.displayName,
      authorityDocumentAvailable: input.documents.some((item) =>
        ["representative_authority", "power_of_attorney", "guardianship_document"].includes(
          item.document.documentType,
        ),
      ),
    },
    internalReferences: input.capabilities.includes(
      "resident_administration.view_internal_references",
    )
      ? {
          residentNumber: identifiers ? r.residentNumber : mask(r.residentNumber),
          legacyReference: identifiers ? r.externalResidentId : mask(r.externalResidentId),
          hospitalNumber: identifiers ? r.hospitalNumber : mask(r.hospitalNumber),
        }
      : undefined,
    administrativeDocuments: input.documents,
    attention,
  };
}
