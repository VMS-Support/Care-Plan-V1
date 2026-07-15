import type { StaffDocument, StaffDocumentType, StaffMember } from "@/lib/care/types";
import { maskSensitiveReference } from "./staffDocumentTypes";
import { getEffectiveStaffDocumentStatus } from "./staffDocumentService";

export interface StaffDocumentViewModel {
  staffDocumentId: string;
  staffMemberId: string;
  staffDisplayName: string;
  employmentRecordId?: string;
  documentType: { id: string; key: string; name: string; category: string };
  title?: string;
  referenceNumberDisplay?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  effectiveStatus: string;
  verificationStatus: StaffDocument["verificationStatus"];
  daysUntilExpiry?: number;
  daysUntilReview?: number;
  fileAvailable: boolean;
  allowedActions: { open: boolean; download: boolean; verify: boolean; renew: boolean; replace: boolean; enterInError: boolean };
  route: string;
}

const daysUntil = (date?: string, effectiveAt = new Date().toISOString().slice(0, 10)) =>
  date ? Math.ceil((Date.parse(date) - Date.parse(effectiveAt)) / 86400000) : undefined;

export function staffDocumentViewModel(document: StaffDocument, input: { staffMembers: StaffMember[]; documentTypes: StaffDocumentType[]; capabilities: string[]; effectiveAt?: string }): StaffDocumentViewModel {
  const staff = input.staffMembers.find((item) => String(item.id) === String(document.staffMemberId));
  const type = input.documentTypes.find((item) => item.id === document.documentTypeId);
  const canViewSensitive = !type?.sensitive || input.capabilities.includes("staff_document.view_sensitive");
  return {
    staffDocumentId: String(document.id),
    staffMemberId: String(document.staffMemberId),
    staffDisplayName: staff?.displayName || "Staff Member",
    employmentRecordId: document.employmentRecordId ? String(document.employmentRecordId) : undefined,
    documentType: { id: document.documentTypeId, key: type?.key || "other", name: type?.name || "Document", category: type?.category || "other" },
    title: document.title,
    referenceNumberDisplay: canViewSensitive ? document.referenceNumber : maskSensitiveReference(document.referenceNumber),
    issueDate: document.issueDate,
    expiryDate: document.expiryDate,
    reviewDate: document.reviewDate,
    effectiveStatus: getEffectiveStaffDocumentStatus(document, input.effectiveAt).replaceAll("_", " "),
    verificationStatus: document.verificationStatus,
    daysUntilExpiry: daysUntil(document.expiryDate, input.effectiveAt),
    daysUntilReview: daysUntil(document.reviewDate, input.effectiveAt),
    fileAvailable: Boolean(document.fileId),
    allowedActions: {
      open: input.capabilities.includes("staff_document.view"),
      download: input.capabilities.includes("staff_document.download"),
      verify: input.capabilities.includes("staff_document.verify"),
      renew: input.capabilities.includes("staff_document.renew"),
      replace: input.capabilities.includes("staff_document.replace"),
      enterInError: input.capabilities.includes("staff_document.enter_in_error"),
    },
    route: `/workforce/staff/${document.staffMemberId}`,
  };
}
