import type { Facility, StaffMember, StaffMemberStatus, UserAccount } from "@/lib/care/types";
import { normaliseStaffStatus } from "./staffMemberStatus";

export interface StaffDirectoryValidationState {
  staffMembers: StaffMember[];
  userAccounts: UserAccount[];
  facilities: Facility[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,}$/;
const VALID_STATUSES: StaffMemberStatus[] = ["pre_employment", "active", "on_leave", "suspended", "inactive", "left_employment", "deceased"];

export function validateStaffNumberUnique(state: StaffDirectoryValidationState, staffNumber: string, enterpriseId?: string, excludeStaffMemberId?: string) {
  const normalised = staffNumber.trim().toLowerCase();
  return !state.staffMembers.some(
    (staff) =>
      String(staff.id) !== excludeStaffMemberId &&
      (staff.staffNumber || "").trim().toLowerCase() === normalised &&
      (!enterpriseId || !staff.enterpriseId || String(staff.enterpriseId) === enterpriseId),
  );
}

export function validateStaffMemberInput(state: StaffDirectoryValidationState, input: {
  staffNumber: string;
  firstName: string;
  surname: string;
  status?: StaffMemberStatus;
  primaryNursingHomeId?: string;
  dateOfBirth?: string;
  nationalityCode?: string;
  workEmail?: string;
  personalEmail?: string;
  workPhone?: string;
  personalPhone?: string;
  linkedUserAccountId?: string;
}, excludeStaffMemberId?: string) {
  const errors: string[] = [];
  if (!input.staffNumber.trim()) errors.push("Staff Number is required.");
  const home = input.primaryNursingHomeId ? state.facilities.find((facility) => facility.id === input.primaryNursingHomeId) : undefined;
  if (input.staffNumber.trim() && !validateStaffNumberUnique(state, input.staffNumber, home?.enterpriseId ? String(home.enterpriseId) : undefined, excludeStaffMemberId)) {
    errors.push("A Staff Member with this Staff Number already exists.");
  }
  if (!input.firstName.trim()) errors.push("First Name is required.");
  if (!input.surname.trim()) errors.push("Surname is required.");
  if (input.status && !VALID_STATUSES.includes(input.status)) errors.push("Staff status is invalid.");
  if (input.primaryNursingHomeId && !home) errors.push("You do not have access to manage staff for this Nursing Home.");
  if (input.dateOfBirth) {
    const parsed = Date.parse(input.dateOfBirth);
    if (Number.isNaN(parsed) || input.dateOfBirth.length !== 10) errors.push("Date of Birth must be a valid date.");
    if (parsed > Date.now()) errors.push("Date of Birth cannot be in the future.");
  }
  if (input.nationalityCode && !/^[A-Z]{2,3}$/.test(input.nationalityCode)) errors.push("Nationality code must be a valid country code.");
  for (const value of [input.workEmail, input.personalEmail].filter(Boolean)) {
    if (value && !EMAIL_RE.test(value)) errors.push("Email address format is invalid.");
  }
  for (const value of [input.workPhone, input.personalPhone].filter(Boolean)) {
    if (value && !PHONE_RE.test(value)) errors.push("Phone number format is invalid.");
  }
  if (input.linkedUserAccountId) {
    const account = state.userAccounts.find((item) => String(item.id) === input.linkedUserAccountId);
    if (!account) errors.push("Linked User Account does not exist.");
    if (account?.staffMemberId && String(account.staffMemberId) !== excludeStaffMemberId) {
      errors.push("This User Account is already linked to another Staff Member.");
    }
  }
  return errors;
}

export function activeFromStaffStatus(status: StaffMemberStatus) {
  return ["active", "on_leave"].includes(normaliseStaffStatus(status));
}
