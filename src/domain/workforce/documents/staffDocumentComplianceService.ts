import type { EmploymentRecord, StaffDocument, StaffDocumentRequirement, StaffDocumentType } from "@/lib/care/types";
import { isCurrentEmployment } from "../employment/employmentStatus";
import { getEffectiveStaffDocumentStatus } from "./staffDocumentService";

export function getExpiringStaffDocuments(documents: StaffDocument[], warningWindow = 30, effectiveAt = new Date().toISOString().slice(0, 10)) {
  return documents.filter((document) => {
    if (!document.expiryDate || document.status === "entered_in_error" || document.status === "superseded") return false;
    const days = Math.ceil((Date.parse(document.expiryDate) - Date.parse(effectiveAt)) / 86400000);
    return days >= 0 && days <= warningWindow;
  });
}

export function getMandatoryDocumentsExpiringMetric(documents: StaffDocument[], warningWindow = 30, effectiveAt = new Date().toISOString().slice(0, 10)) {
  const records = getExpiringStaffDocuments(documents, warningWindow, effectiveAt);
  return { value: records.length, records, route: `/staff-management?documents=expiring&days=${warningWindow}`, generatedAt: new Date().toISOString() };
}

export function getGardaVettingComplianceMetric(input: { documents: StaffDocument[]; documentTypes: StaffDocumentType[]; employmentRecords: EmploymentRecord[]; effectiveAt?: string }) {
  const gardaType = input.documentTypes.find((type) => type.key === "garda_vetting");
  const requiredStaffIds = new Set(input.employmentRecords.filter((record) => isCurrentEmployment(record, input.effectiveAt)).map((record) => String(record.staffMemberId)));
  let valid = 0;
  for (const staffId of requiredStaffIds) {
    if (input.documents.some((document) =>
      String(document.staffMemberId) === staffId &&
      document.documentTypeId === gardaType?.id &&
      document.verificationStatus === "verified" &&
      getEffectiveStaffDocumentStatus(document, input.effectiveAt) === "valid",
    )) valid += 1;
  }
  return {
    numerator: valid,
    denominator: requiredStaffIds.size,
    percentage: requiredStaffIds.size ? Math.round((valid / requiredStaffIds.size) * 100) : undefined,
    value: valid,
    route: "/staff-management?document=garda_vetting",
    generatedAt: new Date().toISOString(),
  };
}

export function getMissingMandatoryStaffDocuments(input: { requirements: StaffDocumentRequirement[]; documents: StaffDocument[]; employmentRecords: EmploymentRecord[] }) {
  const activeEmployment = input.employmentRecords.filter((record) => isCurrentEmployment(record));
  const missing: { staffMemberId: string; documentTypeId: string; employmentRecordId?: string }[] = [];
  for (const requirement of input.requirements.filter((item) => item.active)) {
    for (const record of activeEmployment) {
      if (requirement.roleKey && requirement.roleKey !== record.primaryRoleKey) continue;
      if (requirement.contractType && requirement.contractType !== record.contractType) continue;
      if (requirement.nursingHomeId && requirement.nursingHomeId !== record.primaryNursingHomeId && requirement.nursingHomeId !== record.nursingHomeId) continue;
      const hasDocument = input.documents.some((document) => String(document.staffMemberId) === String(record.staffMemberId) && document.documentTypeId === requirement.documentTypeId && document.status !== "entered_in_error" && document.status !== "superseded");
      if (!hasDocument) missing.push({ staffMemberId: String(record.staffMemberId), documentTypeId: requirement.documentTypeId, employmentRecordId: String(record.id) });
    }
  }
  return missing;
}
