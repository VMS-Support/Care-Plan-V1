import type {
  MaintenanceAsset,
  MaintenanceCertificate,
  MaintenanceCertificateAttachment,
  MaintenanceCertificateComplianceStatus,
  MaintenanceCertificateRequirement,
  MaintenanceCertificateSubjectType,
  MaintenanceCertificateTimelineEvent,
  MaintenanceCertificateType,
  MaintenanceCertificateTypeCategory,
  MaintenanceCertificateVersion,
} from "@/lib/care/types";

export const CERTIFICATE_TYPE_CATEGORIES: MaintenanceCertificateTypeCategory[] = ["SAFETY", "SERVICE", "INSPECTION", "LEGAL", "INSURANCE", "CONTRACTOR_CERTIFICATION", "ASSET_COMPLIANCE", "CALIBRATION", "WARRANTY", "OTHER"];
export const CERTIFICATE_SUBJECT_TYPES: MaintenanceCertificateSubjectType[] = ["ASSET", "WORK_ORDER", "SAFETY_INSPECTION", "CONTRACTOR", "HOME", "LOCATION", "OTHER"];

export function certificateComplianceStatus(params: { certificate: MaintenanceCertificate; version?: MaintenanceCertificateVersion; type?: MaintenanceCertificateType; attachments?: MaintenanceCertificateAttachment[]; today?: Date }): MaintenanceCertificateComplianceStatus {
  if (params.certificate.archived || params.certificate.lifecycleStatus === "ARCHIVED") return "NOT_APPLICABLE";
  const version = params.version;
  if (!version || version.status === "DRAFT") return "MISSING";
  if (version.status === "REVOKED") return "REVOKED";
  if (version.status === "SUPERSEDED" || version.status === "ARCHIVED") return "NOT_APPLICABLE";
  const activeAttachments = (params.attachments || []).filter((item) => item.active && !item.removedAt);
  if (params.type?.attachmentRequired && activeAttachments.length === 0) return "MISSING";
  if (!version.expiryDate) return "VALID";
  const days = daysBetween(dateOnly(params.today || new Date()), version.expiryDate);
  if (days < 0) return "EXPIRED";
  if (days <= (params.type?.warningDays ?? 90)) return "EXPIRING_SOON";
  return "VALID";
}

export function versionPresentationStatus(version: MaintenanceCertificateVersion, type?: MaintenanceCertificateType, today = new Date()): MaintenanceCertificateVersion["status"] {
  if (!version.isCurrent || ["DRAFT", "REVOKED", "SUPERSEDED", "ARCHIVED"].includes(version.status)) return version.status;
  if (!version.expiryDate) return "ACTIVE";
  const days = daysBetween(dateOnly(today), version.expiryDate);
  if (days < 0) return "EXPIRED";
  if (days <= (type?.warningDays ?? 90)) return "EXPIRING_SOON";
  return "ACTIVE";
}

export function validateCertificateType(input: Partial<MaintenanceCertificateType>, existing: MaintenanceCertificateType[]) {
  const fieldErrors: Record<string, string> = {};
  if (!input.code?.trim()) fieldErrors.code = "Enter a certificate type code.";
  if (!input.name?.trim()) fieldErrors.name = "Enter a certificate type name.";
  if (!input.category) fieldErrors.category = "Select a category.";
  if (input.code && existing.some((item) => item.id !== input.id && item.code.toLowerCase() === input.code!.trim().toLowerCase())) fieldErrors.code = "Certificate type code already exists.";
  if (!input.applicableSubjectTypes?.length) fieldErrors.applicableSubjectTypes = "Select at least one applicable subject type.";
  if (Number(input.warningDays ?? 0) < 0) fieldErrors.warningDays = "Warning days cannot be negative.";
  if (Number(input.criticalWarningDays ?? 0) < 0) fieldErrors.criticalWarningDays = "Critical warning days cannot be negative.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateCertificateInput(input: Partial<MaintenanceCertificate> & Partial<MaintenanceCertificateVersion>, source: { types: MaintenanceCertificateType[]; attachments?: MaintenanceCertificateAttachment[] }) {
  const fieldErrors: Record<string, string> = {};
  const type = source.types.find((item) => item.id === input.certificateTypeId && item.active && !item.archivedAt);
  if (!type) fieldErrors.certificateTypeId = "Select an active certificate type.";
  if (!input.title?.trim()) fieldErrors.title = "Enter a certificate title.";
  if (!input.subjectType) fieldErrors.subjectType = "Select what this certificate applies to.";
  if (type?.certificateNumberRequired && !input.certificateNumber?.trim()) fieldErrors.certificateNumber = "Certificate number is required for this type.";
  if (type?.issuingOrganisationRequired && !input.issuingOrganisation?.trim()) fieldErrors.issuingOrganisation = "Issuing organisation is required for this type.";
  if (!input.issuedDate) fieldErrors.issuedDate = "Enter the issued date.";
  if (!input.validFromDate) fieldErrors.validFromDate = "Enter the valid-from date.";
  if (type?.expiryRequired && !input.expiryDate) fieldErrors.expiryDate = "Expiry date is required for this type.";
  if (input.validFromDate && input.expiryDate && input.validFromDate > input.expiryDate) fieldErrors.expiryDate = "Expiry date cannot be before the valid-from date.";
  if (input.issuedDate && input.expiryDate && input.issuedDate > input.expiryDate) fieldErrors.issuedDate = "Issued date cannot be after expiry date.";
  if (type?.attachmentRequired && source.attachments && source.attachments.filter((item) => item.active && !item.removedAt).length === 0) fieldErrors.attachments = "Upload the required certificate file.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateRequirement(input: Partial<MaintenanceCertificateRequirement>, types: MaintenanceCertificateType[]) {
  const fieldErrors: Record<string, string> = {};
  if (!input.requirementName?.trim()) fieldErrors.requirementName = "Enter a requirement name.";
  if (!input.certificateTypeId || !types.some((item) => item.id === input.certificateTypeId && item.active)) fieldErrors.certificateTypeId = "Select an active certificate type.";
  if (!input.subjectType) fieldErrors.subjectType = "Select the requirement subject.";
  if (!input.effectiveFrom) fieldErrors.effectiveFrom = "Enter an effective-from date.";
  if (input.effectiveTo && input.effectiveFrom && input.effectiveTo < input.effectiveFrom) fieldErrors.effectiveTo = "Effective-to date cannot be before effective-from.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function missingCertificateRequirements(params: {
  requirements: MaintenanceCertificateRequirement[];
  certificates: MaintenanceCertificate[];
  versions: MaintenanceCertificateVersion[];
  types: MaintenanceCertificateType[];
  assets: MaintenanceAsset[];
  attachments: MaintenanceCertificateAttachment[];
  today?: Date;
}) {
  return params.requirements.filter((requirement) => {
    if (!requirement.active || requirement.archivedAt || requirement.mandatory === false) return false;
    const matching = params.certificates.filter((certificate) => {
      if (certificate.certificateTypeId !== requirement.certificateTypeId || certificate.archived) return false;
      if (certificate.homeId && requirement.homeId && certificate.homeId !== requirement.homeId) return false;
      if (requirement.subjectId) return certificate.primarySubjectId === requirement.subjectId;
      if (requirement.assetCategoryId) {
        const asset = params.assets.find((item) => item.id === certificate.primarySubjectId);
        return certificate.subjectType === "ASSET" && asset?.categoryId === requirement.assetCategoryId;
      }
      return certificate.subjectType === requirement.subjectType || requirement.subjectType === "HOME";
    });
    return !matching.some((certificate) => certificateComplianceStatus({
      certificate,
      version: params.versions.find((item) => item.id === certificate.currentVersionId),
      type: params.types.find((item) => item.id === certificate.certificateTypeId),
      attachments: params.attachments.filter((item) => item.certificateId === certificate.id && item.certificateVersionId === certificate.currentVersionId),
      today: params.today,
    }) === "VALID");
  });
}

export function certificateDashboardMetrics(params: {
  certificates: MaintenanceCertificate[];
  versions: MaintenanceCertificateVersion[];
  types: MaintenanceCertificateType[];
  attachments: MaintenanceCertificateAttachment[];
  requirements: MaintenanceCertificateRequirement[];
  assets: MaintenanceAsset[];
  today?: Date;
}) {
  const active = params.certificates.filter((item) => !item.archived && item.lifecycleStatus !== "ARCHIVED");
  const decorated = active.map((certificate) => ({
    certificate,
    status: certificateComplianceStatus({
      certificate,
      version: params.versions.find((item) => item.id === certificate.currentVersionId),
      type: params.types.find((item) => item.id === certificate.certificateTypeId),
      attachments: params.attachments.filter((item) => item.certificateId === certificate.id && item.certificateVersionId === certificate.currentVersionId),
      today: params.today,
    }),
  }));
  const missing = missingCertificateRequirements(params);
  return {
    total: active.length,
    valid: decorated.filter((item) => item.status === "VALID").length,
    dueSoon: decorated.filter((item) => item.status === "EXPIRING_SOON").length,
    expired: decorated.filter((item) => item.status === "EXPIRED").length,
    missing: missing.length,
    revoked: decorated.filter((item) => item.status === "REVOKED").length,
    archived: params.certificates.filter((item) => item.archived || item.lifecycleStatus === "ARCHIVED").length,
    attachmentGaps: active.filter((certificate) => {
      const type = params.types.find((item) => item.id === certificate.certificateTypeId);
      return type?.attachmentRequired && !params.attachments.some((item) => item.certificateId === certificate.id && item.certificateVersionId === certificate.currentVersionId && item.active && !item.removedAt);
    }).length,
    byType: params.types.map((type) => ({ type, count: active.filter((certificate) => certificate.certificateTypeId === type.id).length })),
  };
}

export function certificateTimeline(params: { certificate: MaintenanceCertificate; versions: MaintenanceCertificateVersion[]; attachments: MaintenanceCertificateAttachment[]; events: MaintenanceCertificateTimelineEvent[] }) {
  return [
    { at: params.certificate.createdAt, user: params.certificate.createdBy, summary: "Certificate created", reference: params.certificate.certificateNumber },
    ...params.versions.map((item) => ({ at: item.recordedAt, user: item.recordedBy, summary: `Version ${item.versionNumber} ${item.status.toLowerCase().replaceAll("_", " ")}`, reference: item.expiryDate ? `Expires ${item.expiryDate}` : "No expiry" })),
    ...params.attachments.filter((item) => item.active).map((item) => ({ at: item.uploadedAt, user: item.uploadedBy, summary: `${item.documentType.replaceAll("_", " ")} uploaded`, reference: item.fileName })),
    ...params.events.map((item) => ({ at: item.eventDate, user: item.userId, summary: item.summary, reference: item.details })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

export function dateOnly(input: string | Date) {
  return new Date(input).toISOString().slice(0, 10);
}

export function daysBetween(a: string | Date, b: string | Date) {
  const start = new Date(dateOnly(a)).getTime();
  const end = new Date(dateOnly(b)).getTime();
  return Math.round((end - start) / 86_400_000);
}
