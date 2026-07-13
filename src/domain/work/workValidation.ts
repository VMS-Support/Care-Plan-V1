import { getWorkSourceKey } from "./workIdentity";
import type { WorkItem, WorkProjectionState } from "./workTypes";

export interface WorkValidationReferenceData {
  sourceExists?: (item: WorkItem) => boolean;
  residentHomeById?: Map<string, string>;
  wardHomeById?: Map<string, string>;
  inactiveResidentIds?: Set<string>;
}
export interface WorkValidationIssue {
  severity: "critical" | "warning";
  code: string;
  workItemId?: string;
  message: string;
}
export function validateWorkItemModel(
  state: WorkProjectionState,
  refs: WorkValidationReferenceData = {},
) {
  const issues: WorkValidationIssue[] = [];
  const keys = new Map<string, string>();
  const add = (
    severity: WorkValidationIssue["severity"],
    code: string,
    item: WorkItem,
    message: string,
  ) => issues.push({ severity, code, workItemId: String(item.id), message });
  for (const item of state.workItems) {
    if (!item.source?.sourceEntityId || !item.source.sourceEntityType)
      add("critical", "missing_source", item, "Stable source reference is required.");
    if (refs.sourceExists && !refs.sourceExists(item))
      add("critical", "orphan_source", item, "Source record does not exist.");
    const key = getWorkSourceKey(item.workType, item.source);
    const previous = keys.get(key);
    if (previous)
      add(
        "critical",
        "duplicate_source_key",
        item,
        `Duplicate source key also used by ${previous}.`,
      );
    else keys.set(key, String(item.id));
    if (
      item.residentId &&
      refs.residentHomeById?.get(String(item.residentId)) !== undefined &&
      refs.residentHomeById.get(String(item.residentId)) !== String(item.nursingHomeId)
    )
      add("critical", "resident_home_mismatch", item, "Resident belongs to another home.");
    if (
      item.wardId &&
      refs.wardHomeById?.get(String(item.wardId)) !== undefined &&
      refs.wardHomeById.get(String(item.wardId)) !== String(item.nursingHomeId)
    )
      add("critical", "ward_home_mismatch", item, "Ward belongs to another home.");
    if (
      item.assignment.assignedWardId &&
      refs.wardHomeById?.get(String(item.assignment.assignedWardId)) !== undefined &&
      refs.wardHomeById.get(String(item.assignment.assignedWardId)) !== String(item.nursingHomeId)
    )
      add("critical", "cross_home_assignment", item, "Assigned ward belongs to another home.");
    if (
      item.persistedStatus === "completed" &&
      (!item.completion?.evidenceEntityId || !item.completion.evidenceEntityType)
    )
      add("critical", "completed_without_evidence", item, "Completion evidence is required.");
    if (item.persistedStatus === "missed" && !item.missed?.reasonCode)
      add("critical", "missed_without_reason", item, "Missed reason is required.");
    if (item.persistedStatus === "deferred" && !item.deferral?.deferredUntil)
      add("critical", "deferred_without_date", item, "Deferred until is required.");
    if (item.persistedStatus === "cancelled" && !item.cancellation?.reasonCode)
      add("critical", "cancelled_without_reason", item, "Cancellation reason is required.");
    if (item.persistedStatus === "not_applicable" && !item.notApplicable?.reasonCode)
      add("critical", "not_applicable_without_reason", item, "Not-applicable reason is required.");
    if (
      item.residentId &&
      refs.inactiveResidentIds?.has(String(item.residentId)) &&
      !["completed", "missed", "cancelled", "not_applicable"].includes(item.persistedStatus)
    )
      add("critical", "active_work_inactive_resident", item, "Inactive resident has active work.");
    if (!item.source.route)
      add("warning", "missing_route", item, "Work item has no drill-down route.");
    if (
      item.workType === "handover_acknowledgement" &&
      (!item.shiftId || !item.assignment.assignedUserAccountId)
    )
      add(
        "critical",
        "invalid_handover_acknowledgement",
        item,
        "Handover acknowledgement requires target shift and user.",
      );
  }
  const critical = issues.filter((issue) => issue.severity === "critical");
  return {
    valid: critical.length === 0,
    issues,
    summary: {
      workItems: state.workItems.length,
      transitions: state.workStatusTransitions.length,
      events: state.workEvents?.length || 0,
      critical: critical.length,
      warnings: issues.length - critical.length,
      byType: Object.fromEntries(
        [...new Set(state.workItems.map((item) => item.workType))].map((type) => [
          type,
          state.workItems.filter((item) => item.workType === type).length,
        ]),
      ),
      byPersistedStatus: Object.fromEntries(
        [...new Set(state.workItems.map((item) => item.persistedStatus))].map((status) => [
          status,
          state.workItems.filter((item) => item.persistedStatus === status).length,
        ]),
      ),
    },
  };
}
