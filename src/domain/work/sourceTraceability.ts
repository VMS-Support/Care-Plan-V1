import { getWorkSourceKey } from "./workIdentity";
import type { WorkItem, WorkSourceReference } from "./workTypes";

export interface SourceTraceabilityReferences {
  sourceExists: (source: WorkSourceReference) => boolean;
  parentExists?: (source: WorkSourceReference) => boolean;
  sourceResidentId?: (source: WorkSourceReference) => string | undefined;
  sourceNursingHomeId?: (source: WorkSourceReference) => string | undefined;
}

export interface SourceTraceabilityIssue {
  severity: "critical" | "warning";
  code: string;
  workItemId: string;
  message: string;
}

const parentRequired = new Set([
  "care_action_occurrence",
  "assessment_reminder",
  "incident_followup_task",
  "admission_checklist_item",
  "hospital_return_review",
]);

export function validateWorkSourceTraceability(
  items: WorkItem[],
  references: SourceTraceabilityReferences,
) {
  const issues: SourceTraceabilityIssue[] = [];
  const sourceKeys = new Map<string, string>();
  const add = (item: WorkItem, code: string, message: string) =>
    issues.push({ severity: "critical", code, workItemId: String(item.id), message });
  for (const item of items) {
    const source = item.source;
    if (!source?.sourceType) add(item, "missing_source_type", "Source type is required.");
    if (!source?.sourceEntityId) add(item, "missing_source_id", "Source entity ID is required.");
    if (!source?.sourceModule) add(item, "missing_source_module", "Owning module is required.");
    if (!source?.completionOwner)
      add(item, "missing_completion_owner", "Source completion owner is required.");
    if (!source?.route || source.route === "#")
      add(item, "missing_source_route", "Direct source route is required.");
    if (!source?.createdAt || Number.isNaN(Date.parse(source.createdAt)))
      add(item, "invalid_source_created_at", "Source creation time must be an ISO timestamp.");
    if (!source?.recreationPolicy)
      add(item, "missing_recreation_policy", "Replay/recreation policy is required.");
    if (source && !references.sourceExists(source))
      add(item, "orphan_source", "Referenced source record does not exist.");
    if (
      parentRequired.has(source?.sourceEntityType) &&
      (!source.parentEntityType || !source.parentEntityId)
    )
      add(item, "missing_parent", "This source occurrence requires a parent reference.");
    if (source?.parentEntityId && references.parentExists && !references.parentExists(source))
      add(item, "orphan_parent", "Referenced parent record does not exist.");
    if (
      source?.sourceType === "clinical_rule" &&
      (!source.createdByRuleId || !source.createdByRuleVersion)
    )
      add(item, "missing_rule_origin", "Clinical-rule work requires rule ID and version.");
    if (
      source?.recreationPolicy === "event_replay" &&
      !source.sourceEventId &&
      !source.createdFromEventId
    )
      add(item, "missing_source_event", "Event-replay work requires its creating event ID.");
    const sourceResidentId = source ? references.sourceResidentId?.(source) : undefined;
    if (sourceResidentId && String(item.residentId || "") !== sourceResidentId)
      add(item, "wrong_resident_linkage", "Work Item resident differs from the source resident.");
    const sourceHomeId = source ? references.sourceNursingHomeId?.(source) : undefined;
    if (sourceHomeId && String(item.nursingHomeId) !== sourceHomeId)
      add(item, "cross_home_source", "Work Item and source belong to different nursing homes.");
    if (source) {
      const key = getWorkSourceKey(item.workType, source);
      const previous = sourceKeys.get(key);
      if (previous)
        add(
          item,
          "duplicate_source_occurrence",
          `Source occurrence is already linked to ${previous}.`,
        );
      else sourceKeys.set(key, String(item.id));
    }
  }
  return { valid: issues.length === 0, issues };
}
