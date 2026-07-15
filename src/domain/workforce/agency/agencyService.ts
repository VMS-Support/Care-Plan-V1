import type { AgencyCompany, AgencyRateAgreement, AgencyShiftAssignment, AgencyTimesheet, AgencyWorker, StaffMemberId } from "@/lib/care/types";
import { calculateAgencyTimesheetCost } from "./agencyCostService";

const uuid = () => Math.random().toString(36).slice(2, 10);

export interface CreateAgencyCompanyCommand {
  name: string;
  tradingName?: string;
  supplierReference?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: AgencyCompany["status"];
  approvedSupplier?: boolean;
  defaultCurrencyCode?: string;
  insuranceExpiryDate?: string;
  complianceReviewDate?: string;
  notes?: string;
}

export interface CreateAgencyWorkerCommand {
  staffMemberId: string;
  agencyCompanyId: string;
  agencyWorkerReference?: string;
  primaryRoleKey: string;
  additionalRoleKeys?: string[];
  approvedNursingHomeIds?: string[];
  notes?: string;
}

export interface CreateAgencyRateAgreementCommand {
  agencyCompanyId: string;
  nursingHomeId?: string;
  roleKey: string;
  rateType: AgencyRateAgreement["rateType"];
  hourlyRateMinor: number;
  currencyCode?: string;
  additionalFlatFeeMinor?: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface AssignAgencyWorkerToShiftCommand {
  plannedShiftId?: string;
  rosterShiftRequirementId?: string;
  agencyCompanyId: string;
  agencyWorkerId: string;
  staffMemberId: string;
  nursingHomeId: string;
  wardId?: string;
  roleKey: string;
  startAt: string;
  endAt: string;
  rateAgreementId?: string;
  plannedHours?: number;
}

export interface RecordAgencyTimesheetCommand {
  agencyShiftAssignmentId: string;
  actualStartAt?: string;
  actualEndAt?: string;
  unpaidBreakMinutes?: number;
  hoursWorked: number;
  notes?: string;
}

export function createAgencyCompany(input: CreateAgencyCompanyCommand, actorUserAccountId: string): AgencyCompany {
  const now = new Date().toISOString();
  return {
    id: `agency-company-${uuid()}`,
    name: input.name,
    tradingName: input.tradingName,
    supplierReference: input.supplierReference,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    status: input.status || "active",
    approvedSupplier: input.approvedSupplier ?? true,
    defaultCurrencyCode: input.defaultCurrencyCode || "EUR",
    insuranceExpiryDate: input.insuranceExpiryDate,
    complianceReviewDate: input.complianceReviewDate,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as any,
    updatedByUserAccountId: actorUserAccountId as any,
  };
}

export function createAgencyWorker(input: CreateAgencyWorkerCommand): AgencyWorker {
  const now = new Date().toISOString();
  return {
    id: `agency-worker-${uuid()}`,
    staffMemberId: input.staffMemberId as StaffMemberId,
    agencyCompanyId: input.agencyCompanyId as any,
    agencyWorkerReference: input.agencyWorkerReference,
    status: "active",
    primaryRoleKey: input.primaryRoleKey,
    additionalRoleKeys: input.additionalRoleKeys || [],
    approvedNursingHomeIds: (input.approvedNursingHomeIds || []) as any,
    complianceApproved: false,
    restrictionsPresent: false,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function approveAgencyWorkerCompliance(worker: AgencyWorker, actorUserAccountId: string): AgencyWorker {
  const now = new Date().toISOString();
  return { ...worker, complianceApproved: true, complianceApprovedAt: now, complianceApprovedByUserAccountId: actorUserAccountId as any, updatedAt: now };
}

export function createAgencyRateAgreement(input: CreateAgencyRateAgreementCommand): AgencyRateAgreement {
  if (input.hourlyRateMinor < 0 || (input.additionalFlatFeeMinor || 0) < 0) throw new Error("No approved Agency rate applies to this shift.");
  const now = new Date().toISOString();
  return {
    id: `agency-rate-${uuid()}`,
    agencyCompanyId: input.agencyCompanyId as any,
    nursingHomeId: input.nursingHomeId as any,
    roleKey: input.roleKey,
    rateType: input.rateType,
    hourlyRate: { amountMinor: input.hourlyRateMinor, currencyCode: input.currencyCode || "EUR" },
    additionalFlatFee: input.additionalFlatFeeMinor ? { amountMinor: input.additionalFlatFeeMinor, currencyCode: input.currencyCode || "EUR" } : undefined,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export function approveAgencyRateAgreement(rate: AgencyRateAgreement, actorUserAccountId: string): AgencyRateAgreement {
  const now = new Date().toISOString();
  return { ...rate, status: "approved", approvedAt: now, approvedByUserAccountId: actorUserAccountId as any, updatedAt: now };
}

export function assignAgencyWorkerToShift(input: AssignAgencyWorkerToShiftCommand, context: { company?: AgencyCompany; worker?: AgencyWorker; existingAssignments?: AgencyShiftAssignment[] }) {
  if (!context.company || context.company.status !== "active" || !context.company.approvedSupplier) throw new Error("The Agency assignment could not be saved.");
  if (!context.worker || context.worker.status !== "active") throw new Error("The Agency Worker is not approved for this Nursing Home.");
  if (!context.worker.approvedNursingHomeIds.includes(input.nursingHomeId as any)) throw new Error("The Agency Worker is not approved for this Nursing Home.");
  if (context.worker.primaryRoleKey !== input.roleKey && !context.worker.additionalRoleKeys.includes(input.roleKey)) throw new Error("The Agency assignment could not be saved.");
  if ((context.existingAssignments || []).some((assignment) => assignment.staffMemberId === input.staffMemberId && assignment.status !== "cancelled" && assignment.status !== "entered_in_error" && assignment.startAt < input.endAt && assignment.endAt > input.startAt)) throw new Error("The Agency assignment could not be saved.");
  const now = new Date().toISOString();
  return {
    id: `agency-assignment-${uuid()}`,
    plannedShiftId: input.plannedShiftId as any,
    rosterShiftRequirementId: input.rosterShiftRequirementId as any,
    agencyCompanyId: input.agencyCompanyId as any,
    agencyWorkerId: input.agencyWorkerId as any,
    staffMemberId: input.staffMemberId as any,
    nursingHomeId: input.nursingHomeId as any,
    wardId: input.wardId as any,
    roleKey: input.roleKey,
    startAt: input.startAt,
    endAt: input.endAt,
    status: "confirmed",
    rateAgreementId: input.rateAgreementId as any,
    plannedHours: input.plannedHours,
    competencyReadinessStatus: "unknown",
    trainingReadinessStatus: "unknown",
    registrationReadinessStatus: "unknown",
    createdAt: now,
    updatedAt: now,
  } satisfies AgencyShiftAssignment;
}

export function recordAgencyTimesheet(input: RecordAgencyTimesheetCommand, assignment: AgencyShiftAssignment, rate?: AgencyRateAgreement): AgencyTimesheet {
  const calculation = calculateAgencyTimesheetCost(input, rate);
  const now = new Date().toISOString();
  return {
    id: `agency-timesheet-${uuid()}`,
    agencyShiftAssignmentId: assignment.id,
    agencyCompanyId: assignment.agencyCompanyId,
    agencyWorkerId: assignment.agencyWorkerId,
    staffMemberId: assignment.staffMemberId,
    nursingHomeId: assignment.nursingHomeId,
    wardId: assignment.wardId,
    roleKey: assignment.roleKey,
    shiftStartAt: assignment.startAt,
    shiftEndAt: assignment.endAt,
    actualStartAt: input.actualStartAt,
    actualEndAt: input.actualEndAt,
    unpaidBreakMinutes: input.unpaidBreakMinutes,
    hoursWorked: input.hoursWorked,
    rateAgreementId: rate?.id,
    hourlyRateSnapshot: rate?.hourlyRate,
    flatFeeSnapshot: rate?.additionalFlatFee,
    calculatedCost: calculation.totalCost,
    status: "draft",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function transitionAgencyTimesheet(timesheet: AgencyTimesheet, status: AgencyTimesheet["status"], actorUserAccountId?: string): AgencyTimesheet {
  const now = new Date().toISOString();
  return {
    ...timesheet,
    status,
    submittedAt: status === "submitted" || status === "pending_approval" ? now : timesheet.submittedAt,
    approvedAt: status === "approved" ? now : timesheet.approvedAt,
    approvedByUserAccountId: status === "approved" ? actorUserAccountId as any : timesheet.approvedByUserAccountId,
    approvedCost: status === "approved" ? timesheet.calculatedCost : timesheet.approvedCost,
    updatedAt: now,
  };
}
