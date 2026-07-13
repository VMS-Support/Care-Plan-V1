import type {
  AuditAction,
  AuditFieldChange,
  AuditLog,
  AuditRecord,
  AuditSource,
  Facility,
  StaffMember,
  UserAccount,
  UserProfile,
  Ward,
} from "./types";
import { asAuditRecordId, asNursingHomeId, asStaffMemberId, asUserAccountId, asWardId } from "@/types/entityIds";
import { roleToRoleKey } from "./staffAccess";

const AUDIT_SCHEMA_VERSION = 1;
const PROHIBITED_FIELD_PATTERN = /(password|token|secret|credential|auth|session)$/i;

export interface AuditState {
  auditLogs: AuditLog[];
  auditRecords: AuditRecord[];
  users: UserProfile[];
  userAccounts: UserAccount[];
  staffMembers: StaffMember[];
  facilities: Facility[];
  wards: Ward[];
}

export interface AuditActorContext {
  user?: UserProfile;
  userAccountId?: string;
  staffMemberId?: string;
  displayName?: string;
}

export interface AuditScopeContext {
  nursingHomeId?: string;
  wardId?: string;
  residentId?: string;
  roomId?: string;
  bedId?: string;
  enterpriseId?: string;
}

export interface RecordAuditInput {
  id?: string;
  occurredAt?: string;
  recordedAt?: string;
  effectiveAt?: string;
  actorType?: AuditRecord["actorType"];
  actor?: AuditActorContext;
  action: AuditAction;
  entityType: string;
  entityId: string;
  parentEntityType?: string;
  parentEntityId?: string;
  summary?: string;
  changes?: AuditFieldChange[];
  reasonCode?: string;
  reasonText?: string;
  source?: AuditSource;
  scope?: AuditScopeContext;
  requestId?: string;
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

const displayAction = (action: AuditAction) => action.replace(/_/g, " ");

export function requiresAuditReason(action: AuditAction | string, entityType: string) {
  const highImpactActions = new Set(["delete", "inactivate", "void", "correct", "discontinue", "dismiss", "defer", "cancel", "discharge", "mark_deceased", "grant_permission", "deny_permission"]);
  const highImpactEntities = new Set(["resident", "assessment", "observation", "care_plan", "care_action", "risk", "clinical_alert", "appointment", "document", "permission", "role_assignment"]);
  return highImpactActions.has(action) || highImpactEntities.has(entityType) && ["delete", "inactivate", "void", "correct", "cancel"].includes(action);
}

export function buildFieldChanges(before: Record<string, unknown>, after: Record<string, unknown>, labels: Record<string, string> = {}) {
  return Object.keys(after)
    .filter((field) => !PROHIBITED_FIELD_PATTERN.test(field))
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map((field) => ({
      field,
      displayName: labels[field],
      previousValue: before[field],
      newValue: after[field],
      dataClassification: "standard" as const,
    }));
}

const redactChanges = (changes: AuditFieldChange[] = []) =>
  changes
    .filter((change) => !PROHIBITED_FIELD_PATTERN.test(change.field))
    .map((change) => ({
      ...change,
      previousValue: PROHIBITED_FIELD_PATTERN.test(change.displayName || "") ? "[redacted]" : change.previousValue,
      newValue: PROHIBITED_FIELD_PATTERN.test(change.displayName || "") ? "[redacted]" : change.newValue,
    }));

export function recordAuditEvent(input: RecordAuditInput): AuditRecord {
  const now = new Date().toISOString();
  const changes = redactChanges(input.changes).filter((change) => JSON.stringify(change.previousValue) !== JSON.stringify(change.newValue));
  if (input.action === "update" && changes.length === 0) {
    throw new Error("Update audit events require at least one meaningful changed field.");
  }
  if (requiresAuditReason(input.action, input.entityType) && !input.reasonCode && !input.reasonText) {
    throw new Error(`Audit reason required for ${input.action} ${input.entityType}.`);
  }
  const user = input.actor?.user;
  const userAccountId = input.actor?.userAccountId || user?.id;
  const staffMemberId = input.actor?.staffMemberId || (user ? `staff-${user.id}` : undefined);
  const actorDisplayName = input.actor?.displayName || user?.name;
  const summary =
    input.summary ||
    `${input.entityType.replace(/_/g, " ")} ${displayAction(input.action)}${changes.length === 1 ? `: ${changes[0].displayName || changes[0].field}` : ""}.`;

  return {
    id: asAuditRecordId(input.id || `audit-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    occurredAt: input.occurredAt || now,
    recordedAt: input.recordedAt || now,
    effectiveAt: input.effectiveAt,
    actorType: input.actorType || (userAccountId ? "user" : "system"),
    actorUserAccountId: userAccountId ? asUserAccountId(userAccountId) : undefined,
    actorStaffMemberId: staffMemberId ? asStaffMemberId(staffMemberId) : undefined,
    actorDisplayName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    parentEntityType: input.parentEntityType,
    parentEntityId: input.parentEntityId,
    enterpriseId: input.scope?.enterpriseId as AuditRecord["enterpriseId"],
    nursingHomeId: input.scope?.nursingHomeId ? asNursingHomeId(input.scope.nursingHomeId) : undefined,
    wardId: input.scope?.wardId ? asWardId(input.scope.wardId) : undefined,
    roomId: input.scope?.roomId as AuditRecord["roomId"],
    bedId: input.scope?.bedId as AuditRecord["bedId"],
    residentId: input.scope?.residentId as AuditRecord["residentId"],
    summary,
    changes: changes.length ? changes : undefined,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    source: input.source || "user_interface",
    requestId: input.requestId,
    correlationId: input.correlationId,
    sessionId: input.sessionId,
    metadata: input.metadata,
    schemaVersion: AUDIT_SCHEMA_VERSION,
  };
}

export const recordCreateAudit = (input: Omit<RecordAuditInput, "action">) => recordAuditEvent({ ...input, action: "create" });
export const recordUpdateAudit = (input: Omit<RecordAuditInput, "action">) => recordAuditEvent({ ...input, action: "update" });
export const recordStateTransitionAudit = (input: Omit<RecordAuditInput, "action"> & { action: AuditAction }) => recordAuditEvent(input);
export const recordSecurityAudit = (input: Omit<RecordAuditInput, "source">) => recordAuditEvent({ ...input, source: "system" });
export const recordMigrationAudit = (input: Omit<RecordAuditInput, "action" | "source" | "actorType">) => recordAuditEvent({ ...input, action: "migrate", source: "migration", actorType: "migration" });
export const recordExportAudit = (input: Omit<RecordAuditInput, "action">) => recordAuditEvent({ ...input, action: "export" });

export function migrateLegacyAuditRecords(state: AuditState): AuditRecord[] {
  const existingIds = new Set(state.auditRecords.map((record) => record.id));
  const canonical = [...state.auditRecords];
  for (const log of state.auditLogs) {
    const id = asAuditRecordId(`audit-record-legacy-${log.id}`);
    if (existingIds.has(id)) continue;
    const user = state.users.find((candidate) => candidate.name === log.user);
    canonical.push({
      id,
      occurredAt: log.timestamp,
      recordedAt: log.timestamp,
      actorType: user ? "user" : "anonymous",
      actorUserAccountId: user ? asUserAccountId(user.id) : undefined,
      actorStaffMemberId: user ? asStaffMemberId(`staff-${user.id}`) : undefined,
      actorDisplayName: log.user,
      action: "update",
      entityType: log.entityType || "legacy_record",
      entityId: log.entity,
      nursingHomeId: log.facilityId ? asNursingHomeId(log.facilityId) : undefined,
      summary: log.action,
      changes: log.before || log.after ? [{ field: "legacyValue", previousValue: log.before, newValue: log.after, dataClassification: "standard" }] : undefined,
      reasonText: log.reason,
      source: "user_interface",
      metadata: { legacyAuditLog: log, legacyRoleKey: log.role ? roleToRoleKey(log.role) : undefined },
      schemaVersion: AUDIT_SCHEMA_VERSION,
    });
  }
  return canonical;
}

export function getAuditForEntity(state: AuditState, entityType: string, entityId: string) {
  return state.auditRecords.filter((record) => record.entityType === entityType && record.entityId === entityId);
}

export function getAuditForResident(state: AuditState, residentId: string) {
  return state.auditRecords.filter((record) => record.residentId === residentId || record.entityId === residentId);
}

export function getAuditForUser(state: AuditState, userAccountId: string) {
  return state.auditRecords.filter((record) => record.actorUserAccountId === userAccountId);
}

export function getAuditForNursingHome(state: AuditState, nursingHomeId: string) {
  return state.auditRecords.filter((record) => record.nursingHomeId === nursingHomeId);
}

export function getAuditForWard(state: AuditState, wardId: string) {
  return state.auditRecords.filter((record) => record.wardId === wardId);
}

export interface AuditSearchFilters {
  dateFrom?: string;
  dateTo?: string;
  actorUserAccountId?: string;
  action?: string;
  entityType?: string;
  residentId?: string;
  nursingHomeId?: string;
  wardId?: string;
  reasonCode?: string;
  source?: string;
  correlationId?: string;
  page?: number;
  pageSize?: number;
}

export function searchAudit(state: AuditState, filters: AuditSearchFilters = {}) {
  const pageSize = filters.pageSize || 50;
  const page = filters.page || 1;
  const records = state.auditRecords
    .filter((record) => !filters.dateFrom || record.occurredAt >= filters.dateFrom)
    .filter((record) => !filters.dateTo || record.occurredAt <= filters.dateTo)
    .filter((record) => !filters.actorUserAccountId || record.actorUserAccountId === filters.actorUserAccountId)
    .filter((record) => !filters.action || record.action === filters.action)
    .filter((record) => !filters.entityType || record.entityType === filters.entityType)
    .filter((record) => !filters.residentId || record.residentId === filters.residentId)
    .filter((record) => !filters.nursingHomeId || record.nursingHomeId === filters.nursingHomeId)
    .filter((record) => !filters.wardId || record.wardId === filters.wardId)
    .filter((record) => !filters.reasonCode || record.reasonCode === filters.reasonCode)
    .filter((record) => !filters.source || record.source === filters.source)
    .filter((record) => !filters.correlationId || record.correlationId === filters.correlationId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return { records: records.slice((page - 1) * pageSize, page * pageSize), total: records.length, page, pageSize };
}

export function validateAuditFramework(state: AuditState) {
  const ids = new Set<string>();
  const duplicateAuditIds: string[] = [];
  for (const record of state.auditRecords) {
    if (ids.has(record.id)) duplicateAuditIds.push(record.id);
    ids.add(record.id);
  }
  const userIds = new Set(state.userAccounts.map((account) => account.id));
  const homeIds = new Set(state.facilities.map((facility) => facility.id));
  const wardById = new Map(state.wards.map((ward) => [ward.id, ward]));
  const recordsWithoutActorOrSystemSource = state.auditRecords.filter((record) => record.actorType === "user" && !record.actorUserAccountId).map((record) => record.id);
  const recordsWithoutEntityId = state.auditRecords.filter((record) => !record.entityId).map((record) => record.id);
  const recordsWithInvalidHomeWardScope = state.auditRecords
    .filter((record) => (record.nursingHomeId && !homeIds.has(record.nursingHomeId)) || (record.wardId && wardById.get(record.wardId)?.nursingHomeId !== record.nursingHomeId))
    .map((record) => record.id);
  const auditRecordsContainingProhibitedFields = state.auditRecords
    .filter((record) => record.changes?.some((change) => PROHIBITED_FIELD_PATTERN.test(change.field) || PROHIBITED_FIELD_PATTERN.test(change.displayName || "")))
    .map((record) => record.id);
  const unresolvedActorReferences = state.auditRecords.filter((record) => record.actorUserAccountId && !userIds.has(record.actorUserAccountId)).map((record) => record.id);
  const recordsWithoutSchemaVersion = state.auditRecords.filter((record) => !record.schemaVersion).map((record) => record.id);
  const criticalErrors = [
    ...duplicateAuditIds.map((id) => `Duplicate audit ID: ${id}`),
    ...recordsWithoutActorOrSystemSource.map((id) => `User audit without actor: ${id}`),
    ...recordsWithoutEntityId.map((id) => `Audit without entity ID: ${id}`),
    ...recordsWithInvalidHomeWardScope.map((id) => `Invalid audit scope: ${id}`),
    ...auditRecordsContainingProhibitedFields.map((id) => `Prohibited audit field: ${id}`),
    ...unresolvedActorReferences.map((id) => `Unresolved audit actor: ${id}`),
    ...recordsWithoutSchemaVersion.map((id) => `Audit without schema version: ${id}`),
  ];
  return {
    auditRecordCount: state.auditRecords.length,
    recordsWithoutActorOrSystemSource,
    recordsWithoutEntityId,
    recordsWithInvalidHomeWardScope,
    duplicateAuditIds,
    auditRecordsContainingProhibitedFields,
    mutableDeletedLegacyRecords: [],
    unresolvedActorReferences,
    unknownActionValues: [],
    recordsWithoutSchemaVersion,
    changedClinicalEntitiesWithNoAuditCoverage: [],
    criticalErrors,
  };
}
