import type { HandoverNote, OperationalContext, Resident, Role, ShiftDefinition } from "./types";
import type { NursingHomeId, ShiftId, WardId } from "@/types/entityIds";
import { can } from "./permissions";
import { getNextShift, getShiftDateRange, type OperationalContextState } from "./operationalContext";

export type HandoverScope = "resident" | "ward";
export type HandoverCategory =
  | "clinical"
  | "medication"
  | "nutrition"
  | "mobility"
  | "behaviour"
  | "family"
  | "gp_review"
  | "infection"
  | "end_of_life"
  | "safety"
  | "staffing"
  | "equipment"
  | "maintenance"
  | "admission"
  | "return"
  | "operational"
  | "other";
export type HandoverStatus = "draft" | "active" | "acknowledged" | "carried_forward" | "resolved" | "expired" | "cancelled";
export type HandoverPriority = "routine" | "important" | "urgent";

export interface HandoverAcknowledgement {
  id: string;
  handoverId: string;
  userAccountId: string;
  staffMemberId?: string;
  acknowledgedAt: string;
  shiftId: ShiftId | string;
  nursingHomeId: NursingHomeId | string;
  wardId: WardId | string;
}

export interface HandoverPolicy {
  routineExpiresAtShiftEnd: boolean;
  importantRequiresAcknowledgement: boolean;
  urgentRequiresAcknowledgement: boolean;
  unresolvedImportantCarryForward: boolean;
  maximumCarryForwardCount?: number;
}

export const defaultHandoverPolicy: HandoverPolicy = {
  routineExpiresAtShiftEnd: true,
  importantRequiresAcknowledgement: true,
  urgentRequiresAcknowledgement: true,
  unresolvedImportantCarryForward: true,
  maximumCarryForwardCount: 1,
};

export interface HandoverAuthContext {
  userAccountId: string;
  staffMemberId?: string;
  role: Role | string;
  capabilities?: string[];
}

export interface HandoverContextFilters {
  priority?: string;
  category?: string;
  residentId?: string;
  acknowledgement?: "all" | "unread" | "acknowledged";
  mode?: "active" | "history";
  shiftId?: string;
  wardId?: string;
  creator?: string;
  now?: string;
}

export interface ContextualHandover {
  handover: HandoverNote;
  resident?: Resident;
  wardId?: string;
  unread: boolean;
  acknowledgedByCurrentUser: boolean;
  effectiveStatus: HandoverStatus;
}

const legacyShiftToLabel: Record<string, string> = {
  morning: "Day Shift",
  afternoon: "Late Shift",
  night: "Night Shift",
};

const statusMap: Record<string, HandoverStatus> = {
  open: "active",
  active: "active",
  read: "active",
  acknowledged: "acknowledged",
  completed: "resolved",
  closed: "resolved",
  archived: "resolved",
};

export function mapLegacyShiftToShiftId(shifts: ShiftDefinition[], shift?: string) {
  if (!shift) return undefined;
  const label = legacyShiftToLabel[shift] || shift;
  return shifts.find((item) => item.label === label)?.id;
}

export function normaliseHandoverStatus(handover: HandoverNote, now = new Date().toISOString()): HandoverStatus {
  if (handover.recordStatus === "deleted") return "cancelled";
  if (handover.resolvedAt || handover.closedAt || handover.completedAt) return "resolved";
  if (handover.expiresAt && Date.parse(handover.expiresAt) <= Date.parse(now)) return "expired";
  if (handover.status && statusMap[handover.status]) return statusMap[handover.status];
  return "active";
}

export function resolveHandoverContextFields(state: OperationalContextState, handover: HandoverNote) {
  const resident = state.residents.find((item) => item.id === handover.residentId);
  const wardId = handover.wardId || resident?.wardId;
  const nursingHomeId = handover.nursingHomeId || handover.facilityId || resident?.facilityId;
  const shifts = nursingHomeId
    ? state.shiftDefinitions.filter((shift) => shift.nursingHomeId === nursingHomeId && shift.active !== false)
    : [];
  const sourceShiftId = handover.sourceShiftId || mapLegacyShiftToShiftId(shifts, handover.shift);
  const next = sourceShiftId && nursingHomeId ? getNextShift(state, nursingHomeId, sourceShiftId, handover.operationalDate || handover.date.slice(0, 10)) : undefined;
  const targetShiftId = handover.targetShiftId || next?.shift.id || sourceShiftId;
  const targetShift = shifts.find((shift) => shift.id === targetShiftId) || next?.shift || shifts[0];
  const targetRange = targetShift
    ? getShiftDateRange(targetShift, handover.operationalDate || handover.date.slice(0, 10))
    : undefined;
  return {
    resident,
    nursingHomeId,
    wardId,
    scope: handover.scope || "resident",
    category: handover.category || "clinical",
    priority: handover.handoverPriority || (handover.priority === "critical" || handover.priority === "high" ? "urgent" : handover.priority === "medium" ? "important" : "routine"),
    sourceShiftId,
    targetShiftId,
    operationalDate: handover.operationalDate || handover.date.slice(0, 10),
    effectiveFrom: handover.effectiveFrom || targetRange?.start || handover.createdAt || handover.date,
    expiresAt: handover.expiresAt || (targetRange ? targetRange.end : undefined),
  };
}

export function isHandoverAcknowledgedBy(handover: HandoverNote, userName: string, userAccountId: string) {
  const names = Array.isArray(handover.acknowledgedBy) ? handover.acknowledgedBy : handover.acknowledgedBy ? [handover.acknowledgedBy] : [];
  return names.includes(userName) || (handover.handoverAcknowledgements || []).some((ack) => ack.userAccountId === userAccountId);
}

export function isHandoverVisibleInContext(
  state: OperationalContextState,
  handover: HandoverNote,
  context: OperationalContext,
  auth: HandoverAuthContext,
  filters: HandoverContextFilters = {},
) {
  const now = filters.now || new Date().toISOString();
  const fields = resolveHandoverContextFields(state, handover);
  if (!can(auth.role as Role, "handover.view") && !auth.capabilities?.includes("handover.view")) return false;
  if (fields.nursingHomeId !== context.nursingHomeId) return false;
  if (!fields.wardId || !context.wardIds.includes(fields.wardId as WardId)) return false;
  if (filters.wardId && fields.wardId !== filters.wardId) return false;
  if (filters.residentId && handover.residentId !== filters.residentId) return false;
  if (filters.priority && fields.priority !== filters.priority && handover.priority !== filters.priority) return false;
  if (filters.category && fields.category !== filters.category) return false;
  if (fields.targetShiftId && fields.targetShiftId !== (filters.shiftId || context.shiftId)) return false;
  if (fields.operationalDate !== context.operationalDate) return false;
  const status = normaliseHandoverStatus(handover, now);
  if ((filters.mode || "active") === "active" && !["active", "acknowledged", "carried_forward"].includes(status)) return false;
  if ((filters.mode || "active") === "history" && status === "cancelled" && handover.recordStatus !== "deleted") return false;
  if (fields.scope === "resident" && (!handover.residentId || !fields.resident)) return false;
  return true;
}

export function getHandoversForOperationalContext(
  state: OperationalContextState,
  context: OperationalContext,
  auth: HandoverAuthContext,
  filters: HandoverContextFilters = {},
) {
  const userName = (auth as HandoverAuthContext & { userName?: string }).userName || "";
  const seen = new Set<string>();
  const rows: ContextualHandover[] = [];
  for (const handover of state.handovers || []) {
    if (seen.has(handover.id)) continue;
    if (!isHandoverVisibleInContext(state, handover, context, auth, filters)) continue;
    const fields = resolveHandoverContextFields(state, handover);
    const acknowledgedByCurrentUser = isHandoverAcknowledgedBy(handover, userName, auth.userAccountId);
    if (filters.acknowledgement === "unread" && acknowledgedByCurrentUser) continue;
    if (filters.acknowledgement === "acknowledged" && !acknowledgedByCurrentUser) continue;
    seen.add(handover.id);
    rows.push({
      handover,
      resident: fields.resident,
      wardId: fields.wardId,
      unread: !acknowledgedByCurrentUser,
      acknowledgedByCurrentUser,
      effectiveStatus: normaliseHandoverStatus(handover, filters.now),
    });
  }
  return rows.sort((a, b) => {
    const priority = (a.handover.handoverPriority || a.handover.priority || "").localeCompare(b.handover.handoverPriority || b.handover.priority || "");
    if (priority) return priority;
    const ward = String(a.wardId || "").localeCompare(String(b.wardId || ""));
    if (ward) return ward;
    return b.handover.date.localeCompare(a.handover.date) || a.handover.id.localeCompare(b.handover.id);
  });
}
