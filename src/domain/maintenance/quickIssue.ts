import type {
  MaintenanceWorkOrder,
  MaintenanceWorkOrderCategory,
  MaintenanceWorkOrderPriority,
} from "@/lib/care/types";
import type { CreateWorkOrderInput, WorkOrderQuery } from "./workOrders.ts";
export type SimpleIssueType =
  | "ELECTRICAL"
  | "PLUMBING"
  | "HEATING"
  | "CALL_BELL"
  | "BED_EQUIPMENT"
  | "ROOM_BUILDING"
  | "CLEANING_SPILL"
  | "FIRE_SAFETY"
  | "WATER_LEAK"
  | "OTHER";
export type ImmediateRiskAnswer = "NO" | "YES" | "NOT_SURE";
const categoryMap: Record<SimpleIssueType, MaintenanceWorkOrderCategory> = {
  ELECTRICAL: "ELECTRICAL",
  PLUMBING: "PLUMBING",
  HEATING: "HEATING_VENTILATION",
  CALL_BELL: "NURSE_CALL",
  BED_EQUIPMENT: "RESIDENT_EQUIPMENT",
  ROOM_BUILDING: "OTHER",
  CLEANING_SPILL: "CLEANING_HOUSEKEEPING_SUPPORT",
  FIRE_SAFETY: "FIRE_SAFETY",
  WATER_LEAK: "WATER_SAFETY",
  OTHER: "OTHER",
};
export function deriveQuickIssue(
  input: {
    homeId: string;
    description: string;
    issueType: SimpleIssueType;
    risk: ImmediateRiskAnswer;
    wardId?: string;
    roomId?: string;
    bedId?: string;
    assetId?: string;
    exactLocation?: string;
  },
  now = new Date(),
): CreateWorkOrderInput {
  const priority: MaintenanceWorkOrderPriority =
    input.risk === "YES" ? "CRITICAL" : input.risk === "NOT_SURE" ? "HIGH" : "MEDIUM";
  const due = new Date(now);
  due.setHours(due.getHours() + (priority === "CRITICAL" ? 2 : priority === "HIGH" ? 8 : 48));
  const first = input.description
    .trim()
    .split(/[.!?\n]/)[0]
    .slice(0, 90);
  return {
    homeId: input.homeId,
    title: first || "Maintenance issue reported",
    description: input.description.trim(),
    type:
      input.issueType === "CLEANING_SPILL"
        ? "HOUSEKEEPING_REQUEST"
        : input.risk === "YES"
          ? "EMERGENCY"
          : "REACTIVE",
    source: "STAFF_REPORT",
    category: categoryMap[input.issueType] || "OTHER",
    priority,
    wardId: input.wardId,
    roomId: input.roomId,
    bedId: input.bedId,
    assetId: input.assetId,
    exactLocation: input.exactLocation,
    dueAt: due.toISOString(),
    immediateRisk: input.risk === "YES",
    residentSafetyImpact: input.risk !== "NO",
    immediateControlSummary:
      input.risk === "YES"
        ? "Urgent review required. Follow the Nursing Home immediate escalation procedure."
        : input.risk === "NOT_SURE"
          ? "Reporter is unsure whether anyone is at immediate risk. Priority review required."
          : undefined,
    verificationRequired: input.risk !== "NO",
    changeReason: "Reported using the short Report an Issue flow",
  };
}
const words = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((x) => x.length > 3),
  );
export function likelyDuplicateIssues(
  existing: MaintenanceWorkOrder[],
  input: CreateWorkOrderInput,
  now = new Date(),
  days = 30,
) {
  const target = words(`${input.title} ${input.description}`);
  return existing
    .filter(
      (x) =>
        x.homeId === input.homeId &&
        !["CLOSED", "CANCELLED", "ENTERED_IN_ERROR"].includes(x.status) &&
        (!input.roomId || String(x.roomId) === String(input.roomId)) &&
        (!input.bedId || String(x.bedId) === String(input.bedId)) &&
        (!input.assetId || x.assetId === input.assetId) &&
        x.category === input.category &&
        (now.getTime() - new Date(x.reportedAt).getTime()) / 86400000 <= days,
    )
    .filter((x) => {
      const source = words(`${x.title} ${x.description}`);
      const overlap = [...target].filter((word) => source.has(word)).length;
      return overlap >= 1 && overlap / Math.max(1, Math.min(target.size, source.size)) >= 0.3;
    });
}
export function workOrderRegisterFilters(input: {
  homeId?: string;
  dueState?: string;
  assignedTo?: string;
  priority?: string;
}): Partial<WorkOrderQuery> {
  const result: Partial<WorkOrderQuery> = {};
  if (input.homeId) result.homeId = input.homeId;
  if (input.dueState === "OVERDUE") {
    result.preset = "overdue";
    result.overdueOnly = true;
  } else if (["DUE_NOW", "DUE_TODAY"].includes(input.dueState || "")) result.preset = "due_today";
  if (input.assignedTo) result.assignedUserId = input.assignedTo;
  if (input.priority && ["CRITICAL", "HIGH", "MEDIUM", "LOW", "ROUTINE"].includes(input.priority))
    result.priority = [input.priority as MaintenanceWorkOrderPriority];
  return result;
}
