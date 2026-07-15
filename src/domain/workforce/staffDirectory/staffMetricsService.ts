import type { StaffMemberStatus } from "@/lib/care/types";
import type { WorkforceAuthorizationContext } from "../workforceScope";
import { getStaffDirectory, type StaffDirectoryFilters, type WorkforceDirectoryState } from "./staffDirectoryService";
import { STAFF_DIRECTORY_ACTIVE_STATUSES, STAFF_DIRECTORY_TOTAL_STATUSES } from "./staffMemberStatus";
import { displayGroupForRoleKey, WORKFORCE_ROLE_DISPLAY_GROUPS } from "./staffRoleSummaryResolver";

export interface WorkforceCountMetric {
  value: number;
  availability: "available" | "permission_restricted" | "error";
  explanation: string;
  route: string;
  generatedAt: string;
}

export interface StaffRoleBreakdownItem {
  roleKey?: string;
  roleLabel: string;
  staffCount: number;
  percentOfTotal: number;
  route: string;
  source: "employment_record" | "clinical_role_assignment" | "user_role" | "legacy" | "not_recorded";
}

function metricCount(state: WorkforceDirectoryState, statuses: StaffMemberStatus[], auth: WorkforceAuthorizationContext) {
  return getStaffDirectory(
    state,
    { statuses },
    { page: 0, pageSize: Number.MAX_SAFE_INTEGER },
    { key: "surname", direction: "asc" },
    auth,
  ).totalMatching;
}

export function getTotalStaffMetric(state: WorkforceDirectoryState, auth: WorkforceAuthorizationContext): WorkforceCountMetric {
  if (!auth.capabilities.includes("staff_directory.view_metrics")) {
    return { value: 0, availability: "permission_restricted", explanation: "Staff metrics are restricted.", route: "/workforce/staff", generatedAt: new Date().toISOString() };
  }
  return {
    value: metricCount(state, STAFF_DIRECTORY_TOTAL_STATUSES, auth),
    availability: "available",
    explanation: "Staff Members with active, on leave, suspended or pre-employment status.",
    route: `/workforce/staff?status=${STAFF_DIRECTORY_TOTAL_STATUSES.join(",")}`,
    generatedAt: new Date().toISOString(),
  };
}

export function getActiveStaffMetric(state: WorkforceDirectoryState, auth: WorkforceAuthorizationContext): WorkforceCountMetric {
  if (!auth.capabilities.includes("staff_directory.view_metrics")) {
    return { value: 0, availability: "permission_restricted", explanation: "Staff metrics are restricted.", route: "/workforce/staff", generatedAt: new Date().toISOString() };
  }
  return {
    value: metricCount(state, STAFF_DIRECTORY_ACTIVE_STATUSES, auth),
    availability: "available",
    explanation: "Staff Members with active or on leave status.",
    route: `/workforce/staff?status=${STAFF_DIRECTORY_ACTIVE_STATUSES.join(",")}`,
    generatedAt: new Date().toISOString(),
  };
}

export function getStaffBreakdownByRole(state: WorkforceDirectoryState, auth: WorkforceAuthorizationContext): StaffRoleBreakdownItem[] {
  if (!auth.capabilities.includes("staff_directory.view_metrics")) return [];
  const directory = getStaffDirectory(
    state,
    { statuses: STAFF_DIRECTORY_TOTAL_STATUSES },
    { page: 0, pageSize: Number.MAX_SAFE_INTEGER },
    { key: "surname", direction: "asc" },
    auth,
  );
  const total = Math.max(directory.totalMatching, 1);
  const byGroup = new Map<string, StaffRoleBreakdownItem>();
  for (const row of directory.rows) {
    const group = displayGroupForRoleKey(row.primaryRole?.key);
    const key = group?.key || row.primaryRole?.key || "not-recorded";
    const label = group?.label || row.primaryRole?.label || "Role Not Recorded";
    const current = byGroup.get(key) || {
      roleKey: row.primaryRole?.key,
      roleLabel: label,
      staffCount: 0,
      percentOfTotal: 0,
      route: `/workforce/staff?${group ? `roleGroup=${group.key}` : `role=${row.primaryRole?.key || "not-recorded"}`}`,
      source: row.primaryRole?.source || "not_recorded",
    };
    current.staffCount += 1;
    byGroup.set(key, current);
  }
  for (const group of WORKFORCE_ROLE_DISPLAY_GROUPS) {
    if (!byGroup.has(group.key)) {
      byGroup.set(group.key, { roleKey: group.includedRoleKeys[0], roleLabel: group.label, staffCount: 0, percentOfTotal: 0, route: `/workforce/staff?roleGroup=${group.key}`, source: "not_recorded" });
    }
  }
  return Array.from(byGroup.values())
    .map((item) => ({ ...item, percentOfTotal: Math.round((item.staffCount / total) * 100) }))
    .sort((a, b) => {
      const ao = WORKFORCE_ROLE_DISPLAY_GROUPS.find((group) => group.label === a.roleLabel)?.displayOrder || 99;
      const bo = WORKFORCE_ROLE_DISPLAY_GROUPS.find((group) => group.label === b.roleLabel)?.displayOrder || 99;
      return ao - bo || a.roleLabel.localeCompare(b.roleLabel);
    });
}

export function filtersFromSearchParams(search: URLSearchParams): StaffDirectoryFilters {
  return {
    search: search.get("q") || undefined,
    statuses: search.get("status")?.split(",").filter(Boolean) as StaffMemberStatus[] | undefined,
    roleKeys: search.get("role") ? [search.get("role")!] : undefined,
    roleGroup: search.get("roleGroup") || undefined,
  };
}
