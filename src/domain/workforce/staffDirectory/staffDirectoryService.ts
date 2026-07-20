import type { EmploymentContractType, EmploymentStatus, Facility, HomeAssignment, StaffMember, StaffMemberStatus, UserAccount, UserProfile } from "@/lib/care/types";
import { createStaffMemberId, type NursingHomeId } from "@/types/entityIds";
import { staffInWorkforceScope, type WorkforceAuthorizationContext, type WorkforceScope } from "../workforceScope";
import { STAFF_DIRECTORY_ACTIVE_STATUSES, normaliseStaffStatus } from "./staffMemberStatus";
import { staffDirectoryRowFor, type StaffDirectoryReadModelState, type StaffDirectoryRow } from "./staffDirectoryReadModel";
import { displayGroupForRoleKey, resolveStaffRoleSummary } from "./staffRoleSummaryResolver";
import { activeFromStaffStatus, validateStaffMemberInput, type StaffDirectoryValidationState } from "./staffDirectoryValidation";

export interface StaffDirectoryFilters {
  enterpriseId?: string;
  nursingHomeIds?: string[];
  statuses?: StaffMemberStatus[];
  activeOnly?: boolean;
  roleKeys?: string[];
  roleGroup?: string;
  linkedUserAccount?: "linked" | "not_linked";
  accountStatuses?: UserAccount["accountStatus"][];
  employmentStatuses?: EmploymentStatus[];
  employmentTypes?: EmploymentContractType[];
  departments?: string[];
  search?: string;
}

export interface StaffDirectoryPagination {
  page: number;
  pageSize: number;
}

export type StaffDirectorySortKey = "surname" | "firstName" | "preferredName" | "staffNumber" | "status" | "primaryRole" | "primaryHome" | "updatedAt";
export interface StaffDirectorySort {
  key: StaffDirectorySortKey;
  direction: "asc" | "desc";
}

export interface StaffDirectoryResult {
  rows: StaffDirectoryRow[];
  totalMatching: number;
  page: number;
  pageSize: number;
}

export interface WorkforceDirectoryState extends StaffDirectoryReadModelState, StaffDirectoryValidationState {
  homeAssignments: HomeAssignment[];
  userAccounts: UserAccount[];
  users: UserProfile[];
  facilities: Facility[];
  staffMembers: StaffMember[];
}

const compare = (a: string | undefined, b: string | undefined) => (a || "").localeCompare(b || "", "en", { sensitivity: "base" });

function staffMatchesSearch(staff: StaffMember, row: StaffDirectoryRow, search?: string) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  return [
    staff.staffNumber,
    staff.firstName,
    staff.surname || staff.lastName,
    staff.preferredName,
    row.displayName,
    row.workEmail,
  ].some((value) => (value || "").toLowerCase().includes(q));
}

export function getStaffDirectory(
  state: WorkforceDirectoryState,
  filters: StaffDirectoryFilters,
  pagination: StaffDirectoryPagination,
  sort: StaffDirectorySort,
  authorization: WorkforceAuthorizationContext,
): StaffDirectoryResult {
  if (!authorization.capabilities.includes("staff_directory.view") && !authorization.capabilities.includes("workforce.view")) {
    return { rows: [], totalMatching: 0, page: pagination.page, pageSize: pagination.pageSize };
  }
  const scope: WorkforceScope = {
    enterpriseId: filters.enterpriseId || authorization.scope.enterpriseId,
    nursingHomeIds: filters.nursingHomeIds?.length ? filters.nursingHomeIds : authorization.scope.nursingHomeIds,
  };
  const rows = state.staffMembers
    .filter((staff) => staffInWorkforceScope(staff, scope, state.homeAssignments))
    .map((staff) => ({ staff, row: staffDirectoryRowFor(staff, state, authorization) }))
    .filter(({ staff, row }) => {
      const status = normaliseStaffStatus(staff.status, staff.active);
      if (filters.activeOnly && !STAFF_DIRECTORY_ACTIVE_STATUSES.includes(status)) return false;
      if (filters.statuses?.length && !filters.statuses.includes(status)) return false;
      if (filters.linkedUserAccount === "linked" && !row.linkedUserAccount) return false;
      if (filters.linkedUserAccount === "not_linked" && row.linkedUserAccount) return false;
      if (filters.accountStatuses?.length && !filters.accountStatuses.includes(row.userAccount?.status || "disabled")) return false;
      if (filters.employmentStatuses?.length && !filters.employmentStatuses.includes(row.employmentStatus as EmploymentStatus)) return false;
      if (filters.employmentTypes?.length && !filters.employmentTypes.includes(row.employmentType as EmploymentContractType)) return false;
      if (filters.departments?.length && !filters.departments.includes(row.department || "")) return false;
      if (filters.roleKeys?.length && !filters.roleKeys.includes(row.primaryRole?.key || "")) return false;
      if (filters.roleGroup && displayGroupForRoleKey(row.primaryRole?.key)?.key !== filters.roleGroup) return false;
      return staffMatchesSearch(staff, row, filters.search);
    })
    .sort((a, b) => {
      const dir = sort.direction === "desc" ? -1 : 1;
      if (sort.key === "staffNumber") return compare(a.row.staffNumber, b.row.staffNumber) * dir || compare(a.row.staffMemberId, b.row.staffMemberId);
      if (sort.key === "status") return compare(a.row.statusLabel, b.row.statusLabel) * dir || compare(a.row.staffMemberId, b.row.staffMemberId);
      if (sort.key === "primaryRole") return compare(a.row.primaryRole?.label, b.row.primaryRole?.label) * dir || compare(a.row.staffMemberId, b.row.staffMemberId);
      if (sort.key === "primaryHome") return compare(a.row.primaryHome?.name, b.row.primaryHome?.name) * dir || compare(a.row.staffMemberId, b.row.staffMemberId);
      if (sort.key === "updatedAt") return compare(a.row.updatedAt, b.row.updatedAt) * dir || compare(a.row.staffMemberId, b.row.staffMemberId);
      if (sort.key === "firstName") return compare(a.staff.firstName, b.staff.firstName) * dir || compare(a.staff.surname || a.staff.lastName, b.staff.surname || b.staff.lastName) || compare(a.row.staffMemberId, b.row.staffMemberId);
      if (sort.key === "preferredName") return compare(a.staff.preferredName, b.staff.preferredName) * dir || compare(a.staff.surname || a.staff.lastName, b.staff.surname || b.staff.lastName) || compare(a.row.staffMemberId, b.row.staffMemberId);
      return compare(a.staff.surname || a.staff.lastName, b.staff.surname || b.staff.lastName) * dir || compare(a.staff.firstName, b.staff.firstName) || compare(a.row.staffMemberId, b.row.staffMemberId);
    });
  const start = Math.max(0, pagination.page) * pagination.pageSize;
  return {
    rows: rows.slice(start, start + pagination.pageSize).map((item) => item.row),
    totalMatching: rows.length,
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

export interface SaveStaffMemberInput {
  staffNumber: string;
  firstName: string;
  surname: string;
  preferredName?: string;
  status: StaffMemberStatus;
  primaryNursingHomeId?: string;
  workEmail?: string;
  workPhone?: string;
  personalEmail?: string;
  personalPhone?: string;
  dateOfBirth?: string;
  gender?: StaffMember["gender"];
  nationalityCode?: string;
  nationalityDisplayName?: string;
  address?: StaffMember["address"];
  photoUrl?: string;
  linkedUserAccountId?: string;
  clientRequestId?: string;
}

export function createStaffMemberRecord(state: WorkforceDirectoryState, input: SaveStaffMemberInput, actorUserAccountId: string) {
  const errors = validateStaffMemberInput(state, input);
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const home = state.facilities.find((facility) => facility.id === input.primaryNursingHomeId);
  const staff: StaffMember = {
    id: createStaffMemberId(),
    enterpriseId: home?.enterpriseId,
    primaryNursingHomeId: input.primaryNursingHomeId as NursingHomeId | undefined,
    firstName: input.firstName.trim(),
    lastName: input.surname.trim(),
    surname: input.surname.trim(),
    preferredName: input.preferredName?.trim() || undefined,
    displayName: `${input.preferredName?.trim() || input.firstName.trim()} ${input.surname.trim()}`.trim(),
    staffNumber: input.staffNumber.trim(),
    status: input.status,
    active: activeFromStaffStatus(input.status),
    email: input.workEmail?.trim() || undefined,
    phone: input.workPhone?.trim() || undefined,
    contactDetails: {
      workEmail: input.workEmail?.trim() || undefined,
      workPhone: input.workPhone?.trim() || undefined,
      personalEmail: input.personalEmail?.trim() || undefined,
      personalPhone: input.personalPhone?.trim() || undefined,
      preferredContactMethod: input.workEmail ? "work_email" : input.workPhone ? "work_phone" : undefined,
    },
    dateOfBirth: input.dateOfBirth || undefined,
    gender: input.gender,
    nationalityCode: input.nationalityCode?.trim() || undefined,
    nationalityDisplayName: input.nationalityDisplayName?.trim() || undefined,
    address: input.address,
    photoUrl: input.photoUrl?.trim() || undefined,
    linkedUserAccountId: input.linkedUserAccountId as StaffMember["linkedUserAccountId"],
    createdAt: now,
    updatedAt: now,
    createdBy: actorUserAccountId as StaffMember["createdBy"],
    updatedBy: actorUserAccountId as StaffMember["updatedBy"],
  };
  return staff;
}

export function updateStaffMemberRecord(state: WorkforceDirectoryState, staff: StaffMember, input: Partial<SaveStaffMemberInput>, actorUserAccountId: string) {
  const mergedInput = {
    staffNumber: input.staffNumber ?? staff.staffNumber ?? "",
    firstName: input.firstName ?? staff.firstName,
    surname: input.surname ?? staff.surname ?? staff.lastName,
    status: input.status ?? normaliseStaffStatus(staff.status, staff.active),
    primaryNursingHomeId: input.primaryNursingHomeId ?? (staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : undefined),
    workEmail: input.workEmail ?? staff.contactDetails?.workEmail ?? staff.email,
    workPhone: input.workPhone ?? staff.contactDetails?.workPhone ?? staff.phone,
    personalEmail: input.personalEmail ?? staff.contactDetails?.personalEmail,
    personalPhone: input.personalPhone ?? staff.contactDetails?.personalPhone,
    dateOfBirth: input.dateOfBirth ?? staff.dateOfBirth,
    linkedUserAccountId: input.linkedUserAccountId ?? (staff.linkedUserAccountId ? String(staff.linkedUserAccountId) : undefined),
  };
  const errors = validateStaffMemberInput(state, mergedInput, String(staff.id));
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const home = state.facilities.find((facility) => facility.id === mergedInput.primaryNursingHomeId);
  return {
    ...staff,
    enterpriseId: home?.enterpriseId || staff.enterpriseId,
    primaryNursingHomeId: mergedInput.primaryNursingHomeId as StaffMember["primaryNursingHomeId"],
    firstName: mergedInput.firstName.trim(),
    lastName: mergedInput.surname.trim(),
    surname: mergedInput.surname.trim(),
    preferredName: input.preferredName !== undefined ? input.preferredName?.trim() || undefined : staff.preferredName,
    displayName: `${input.preferredName !== undefined ? input.preferredName?.trim() || mergedInput.firstName.trim() : staff.preferredName || mergedInput.firstName.trim()} ${mergedInput.surname.trim()}`.trim(),
    status: mergedInput.status,
    active: activeFromStaffStatus(mergedInput.status),
    email: mergedInput.workEmail?.trim() || undefined,
    phone: mergedInput.workPhone?.trim() || undefined,
    contactDetails: {
      ...staff.contactDetails,
      workEmail: mergedInput.workEmail?.trim() || undefined,
      workPhone: mergedInput.workPhone?.trim() || undefined,
      personalEmail: mergedInput.personalEmail?.trim() || undefined,
      personalPhone: mergedInput.personalPhone?.trim() || undefined,
    },
    dateOfBirth: mergedInput.dateOfBirth || undefined,
    gender: input.gender !== undefined ? input.gender : staff.gender,
    nationalityCode: input.nationalityCode !== undefined ? input.nationalityCode?.trim() || undefined : staff.nationalityCode,
    nationalityDisplayName: input.nationalityDisplayName !== undefined ? input.nationalityDisplayName?.trim() || undefined : staff.nationalityDisplayName,
    address: input.address !== undefined ? input.address : staff.address,
    photoUrl: input.photoUrl !== undefined ? input.photoUrl?.trim() || undefined : staff.photoUrl,
    linkedUserAccountId: mergedInput.linkedUserAccountId as StaffMember["linkedUserAccountId"],
    updatedAt: now,
    updatedBy: actorUserAccountId as StaffMember["updatedBy"],
  } satisfies StaffMember;
}

export function getStaffProfile(state: WorkforceDirectoryState, staffMemberId: string, authorization: WorkforceAuthorizationContext) {
  const staff = state.staffMembers.find((item) => String(item.id) === staffMemberId);
  if (!staff) return undefined;
  const row = staffDirectoryRowFor(staff, state, authorization);
  const role = resolveStaffRoleSummary({ staff, employmentRecords: state.employmentRecords, roleAssignments: state.roleAssignments, userAccounts: state.userAccounts, users: state.users });
  return { staff, row, role };
}
