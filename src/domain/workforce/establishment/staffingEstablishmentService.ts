import type { NursingHomeId, UserAccountId } from "@/types/entityIds";
import type { StaffingEstablishmentLine, StaffingEstablishmentVersion } from "@/lib/care/types";

export interface CreateStaffingEstablishmentDraftCommand {
  nursingHomeId: string;
  versionName: string;
  effectiveFrom: string;
  effectiveTo?: string;
  sourceBudgetReference?: string;
  notes?: string;
  clientRequestId: string;
}

export interface AddStaffingEstablishmentLineCommand {
  establishmentVersionId: string;
  nursingHomeId: string;
  wardId?: string;
  roleKey: string;
  budgetedHeadcount?: number;
  budgetedFte?: number;
  budgetedHoursPerWeek?: number;
  minimumHeadcount?: number;
  minimumRegisteredStaff?: number;
  agencyAllowed?: boolean;
  notes?: string;
  clientRequestId: string;
}

export function createStaffingEstablishmentDraft(command: CreateStaffingEstablishmentDraftCommand, actorUserAccountId: string, versionNumber = 1): StaffingEstablishmentVersion {
  if (!command.versionName.trim() || !command.effectiveFrom) throw new Error("The Staffing Establishment could not be saved.");
  const now = new Date().toISOString();
  return {
    id: `staffing-establishment-${command.clientRequestId || Date.now()}`,
    nursingHomeId: command.nursingHomeId as NursingHomeId,
    versionNumber,
    versionName: command.versionName,
    status: "draft",
    effectiveFrom: command.effectiveFrom,
    effectiveTo: command.effectiveTo,
    sourceBudgetReference: command.sourceBudgetReference,
    notes: command.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
}

export function addStaffingEstablishmentLine(command: AddStaffingEstablishmentLineCommand): StaffingEstablishmentLine {
  if (!command.roleKey || ((command.budgetedHeadcount ?? 0) <= 0 && (command.budgetedFte ?? 0) <= 0 && (command.budgetedHoursPerWeek ?? 0) <= 0)) {
    throw new Error("The Staffing Establishment could not be saved.");
  }
  const now = new Date().toISOString();
  return {
    id: `staffing-establishment-line-${command.clientRequestId || Date.now()}`,
    establishmentVersionId: command.establishmentVersionId,
    nursingHomeId: command.nursingHomeId as NursingHomeId,
    wardId: command.wardId as any,
    roleKey: command.roleKey,
    budgetedHeadcount: command.budgetedHeadcount,
    budgetedFte: command.budgetedFte,
    budgetedHoursPerWeek: command.budgetedHoursPerWeek,
    minimumHeadcount: command.minimumHeadcount,
    minimumRegisteredStaff: command.minimumRegisteredStaff,
    agencyAllowed: Boolean(command.agencyAllowed),
    notes: command.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function approveStaffingEstablishment(version: StaffingEstablishmentVersion, actorUserAccountId: string) {
  const now = new Date().toISOString();
  return { ...version, status: "approved" as const, approvedAt: now, approvedByUserAccountId: actorUserAccountId as UserAccountId, updatedAt: now, updatedByUserAccountId: actorUserAccountId as UserAccountId };
}
