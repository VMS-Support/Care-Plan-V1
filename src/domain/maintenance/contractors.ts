import type {
  MaintenanceContractor,
  MaintenanceContractorBusinessType,
  MaintenanceContractorContact,
  MaintenanceContractorHomeAssociation,
  MaintenanceContractorServiceArea,
  MaintenanceContractorStatus,
} from "@/lib/care/types";

export const CONTRACTOR_BUSINESS_TYPES: MaintenanceContractorBusinessType[] = ["LIMITED_COMPANY", "SOLE_TRADER", "PARTNERSHIP", "PUBLIC_BODY", "CHARITY", "INDEPENDENT_PROFESSIONAL", "OTHER"];
export const CONTRACTOR_STATUSES: MaintenanceContractorStatus[] = ["DRAFT", "ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"];

const STATUS_TRANSITIONS: Record<MaintenanceContractorStatus, MaintenanceContractorStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["INACTIVE", "SUSPENDED", "ARCHIVED"],
  INACTIVE: ["ACTIVE", "ARCHIVED"],
  SUSPENDED: ["ACTIVE", "INACTIVE", "ARCHIVED"],
  ARCHIVED: ["INACTIVE"],
};

export function nextContractorReference(contractors: MaintenanceContractor[]) {
  const highest = contractors.reduce((max, item) => {
    const match = item.contractorReference.match(/CON-(\d+)/i);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0);
  return `CON-${String(highest + 1).padStart(6, "0")}`;
}

export function contractorDisplayName(contractor: MaintenanceContractor) {
  return contractor.tradingName?.trim() || contractor.legalName;
}

export function contractorProfileCompleteness(contractor: MaintenanceContractor) {
  const checks = [
    contractor.legalName,
    contractor.businessType,
    contractor.generalEmail || contractor.mainPhone || contractor.emergencyPhone,
    contractor.primaryContactName,
    contractor.primaryContactEmail || contractor.primaryContactPhone,
    contractor.addressLine1,
    contractor.townCity,
    contractor.countryCode,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function validateContractorInput(input: Partial<MaintenanceContractor>) {
  const fieldErrors: Record<string, string> = {};
  if (!input.legalName?.trim()) fieldErrors.legalName = "Legal name is required.";
  if (input.legalName && input.legalName.trim().length > 180) fieldErrors.legalName = "Legal name is too long.";
  if (input.tradingName && input.tradingName.trim().length > 180) fieldErrors.tradingName = "Trading name is too long.";
  if (!input.businessType || !CONTRACTOR_BUSINESS_TYPES.includes(input.businessType)) fieldErrors.businessType = "Select a valid business type.";
  if (input.website && !/^https?:\/\/[^\s.]+\.[^\s]+/i.test(input.website.trim())) fieldErrors.website = "Enter a valid website URL starting with http:// or https://.";
  if (input.generalEmail && !isEmail(input.generalEmail)) fieldErrors.generalEmail = "Enter a valid general email.";
  if (input.primaryContactEmail && !isEmail(input.primaryContactEmail)) fieldErrors.primaryContactEmail = "Enter a valid primary contact email.";
  for (const key of ["mainPhone", "alternativePhone", "emergencyPhone", "primaryContactPhone"] as const) {
    const value = input[key];
    if (value && !/^[+()0-9\s-]{6,30}$/.test(value.trim())) fieldErrors[key] = "Enter a valid phone number.";
  }
  if (input.countryCode && !/^[A-Z]{2}$/i.test(input.countryCode.trim())) fieldErrors.countryCode = "Use a two-letter country code.";
  if (input.status === "ACTIVE" && !(input.generalEmail || input.mainPhone || input.emergencyPhone)) fieldErrors.contact = "Active contractors require at least one company contact method.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function potentialContractorDuplicates(input: Partial<MaintenanceContractor>, contractors: MaintenanceContractor[]) {
  const legal = normalise(input.legalName);
  const trading = normalise(input.tradingName);
  const reg = normalise(input.companyRegistrationNumber);
  if (!legal && !trading && !reg) return [];
  return contractors.filter((item) => {
    if (item.id === input.id || item.archived) return false;
    const sameRegistration = reg && normalise(item.companyRegistrationNumber) === reg;
    const sameLegal = legal && normalise(item.legalName) === legal;
    const sameTrading = trading && normalise(item.tradingName) === trading;
    return Boolean(sameRegistration || sameLegal || sameTrading);
  });
}

export function canTransitionContractorStatus(from: MaintenanceContractorStatus, to: MaintenanceContractorStatus) {
  return STATUS_TRANSITIONS[from]?.includes(to) || from === to;
}

export function contractorDashboardMetrics(contractors: MaintenanceContractor[], associations: MaintenanceContractorHomeAssociation[] = [], contacts: MaintenanceContractorContact[] = [], serviceAreas: MaintenanceContractorServiceArea[] = []) {
  const activeRows = contractors.filter((item) => !item.archived);
  const hasPrimary = (contractorId: string) => contacts.some((item) => item.contractorId === contractorId && item.active && !item.archivedAt && item.isPrimary);
  const hasActiveAssociation = (contractorId: string) => associations.some((association) => association.contractorId === contractorId && association.active);
  const hasActiveServiceArea = (contractorId: string) => serviceAreas.some((item) => item.contractorId === contractorId && item.active && !item.archivedAt);
  return {
    total: activeRows.length,
    draft: activeRows.filter((item) => item.status === "DRAFT").length,
    active: activeRows.filter((item) => item.status === "ACTIVE").length,
    inactive: activeRows.filter((item) => item.status === "INACTIVE").length,
    suspended: activeRows.filter((item) => item.status === "SUSPENDED").length,
    archived: contractors.filter((item) => item.archived || item.status === "ARCHIVED").length,
    incompleteProfiles: activeRows.filter((item) => contractorProfileCompleteness(item) < 100).length,
    withPrimaryContact: activeRows.filter((item) => item.primaryContactName || hasPrimary(item.id)).length,
    withoutPrimaryContact: activeRows.filter((item) => !(item.primaryContactName || hasPrimary(item.id))).length,
    withHomeAssociation: activeRows.filter((item) => hasActiveAssociation(item.id)).length,
    withoutHomeAssociation: activeRows.filter((item) => !hasActiveAssociation(item.id)).length,
    emergencyCallout: activeRows.filter((item) => serviceAreas.some((area) => area.contractorId === item.id && area.active && area.emergencyCalloutAvailable)).length,
    outOfHours: activeRows.filter((item) => serviceAreas.some((area) => area.contractorId === item.id && area.active && area.outOfHoursAvailable)).length,
    remoteSupport: activeRows.filter((item) => serviceAreas.some((area) => area.contractorId === item.id && area.active && area.remoteSupportAvailable)).length,
    withoutServiceArea: activeRows.filter((item) => !hasActiveServiceArea(item.id)).length,
  };
}

export function contractorTimelineSummary(action: string, contractor: MaintenanceContractor, details?: string) {
  const name = contractorDisplayName(contractor);
  if (action === "CONTRACTOR_CREATED") return `Contractor ${name} created as ${contractor.status.toLowerCase()}.`;
  if (action === "CONTRACTOR_UPDATED") return `Contractor ${name} updated.`;
  if (action === "CONTRACTOR_ARCHIVED") return `Contractor ${name} archived.`;
  if (action === "CONTRACTOR_RESTORED") return `Contractor ${name} restored.`;
  if (action.includes("STATUS")) return `Contractor status changed to ${contractor.status.toLowerCase()}.`;
  return details || `Contractor ${name} changed.`;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalise(value?: string) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() || "";
}
