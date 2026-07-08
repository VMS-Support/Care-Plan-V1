import type { Role } from "./types";

export const roleLabels: Record<Role, string> = {
  carer: "Carer",
  nurse: "Nurse",
  doctor: "Doctor",
  cnm: "Clinical Nurse Manager",
  don: "Director of Nursing",
};

export const roleDescriptions: Record<Role, string> = {
  carer: "Frontline care: notes, interventions, handovers",
  nurse: "Clinical: assessments, care plans, evaluations",
  doctor: "Medical reviews, MDT meetings, treatment notes",
  cnm: "Administrative oversight and approvals",
  don: "Full system access and governance",
};

export type Permission =
  | "resident.view" | "resident.create" | "resident.edit" | "resident.discharge"
  | "note.create" | "intervention.create" | "handover.create"
  | "visitor.create" | "outing.create" | "task.create"
  | "assessment.view" | "assessment.create" | "assessment.edit"
  | "assessment.review" | "assessment.approve" | "assessment.delete" | "assessment.archive"
  | "assessment.assign" | "assessment.create_revision" | "assessment.comment"
  | "assessment.audit_access" | "assessment.reports" | "assessment.restore"
  | "careplan.view" | "careplan.create" | "careplan.edit"
  | "careplan.review" | "careplan.approve" | "careplan.delete" | "careplan.evaluate" | "careplan.revise"
  | "evaluation.create"
  | "incident.view" | "incident.create" | "incident.manage"
  | "clinical.view" | "mdt.create" | "medical_review.create"
  | "recommendation.create" | "treatment_note.create"
  | "report.view" | "report.manage" | "user.manage" | "permission.manage"
  | "settings.manage" | "audit.view" | "record.delete_with_audit"
  | "compliance.view"
  | "vital.view" | "vital.record" | "vital.edit" | "vital.delete" | "vital.comment"
  | "vital.plan.edit" | "vital.escalate" | "vital.report" | "vital.audit"
  | "observation.view" | "observation.record" | "observation.edit" | "observation.delete"
  | "observation.plan.edit" | "observation.escalate" | "observation.audit"
  | "ops.edit" | "ops.edit_own" | "ops.archive" | "ops.restore" | "ops.delete" | "ops.duplicate";

const matrix: Record<Role, Permission[]> = {
  carer: [
    "resident.view",
    "note.create", "intervention.create", "handover.create",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "careplan.view",
    "vital.view", "vital.record",
    "observation.view", "observation.record",
    "ops.edit_own", "ops.duplicate",
  ],
  nurse: [
    "resident.view", "resident.edit",
    "note.create", "intervention.create", "handover.create",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit", "assessment.review",
    "assessment.create_revision", "assessment.comment", "assessment.archive",
    "careplan.view", "careplan.create", "careplan.edit", "careplan.review", "careplan.evaluate",
    "evaluation.create",
    "incident.view", "incident.create",
    "vital.view", "vital.record", "vital.edit", "vital.comment", "vital.plan.edit", "vital.escalate",
    "observation.view", "observation.record", "observation.edit", "observation.plan.edit", "observation.escalate",
    "ops.edit", "ops.archive", "ops.restore", "ops.duplicate",
  ],
  doctor: [
    "resident.view", "clinical.view",
    "mdt.create", "medical_review.create",
    "recommendation.create", "treatment_note.create",
    "assessment.view", "assessment.comment", "careplan.view",
    "vital.view", "vital.comment", "vital.escalate",
    "observation.view", "observation.escalate",
    "ops.edit_own",
  ],
  cnm: [
    "resident.view", "resident.create", "resident.edit",
    "note.create", "intervention.create", "handover.create",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit",
    "assessment.review", "assessment.approve", "assessment.archive",
    "assessment.assign", "assessment.create_revision", "assessment.comment",
    "assessment.delete", "assessment.restore", "assessment.audit_access", "assessment.reports",
    "careplan.view", "careplan.create", "careplan.edit",
    "careplan.review", "careplan.approve", "careplan.evaluate", "careplan.revise",
    "evaluation.create",
    "incident.view", "incident.create", "incident.manage",
    "report.view", "user.manage", "clinical.view", "mdt.create",
    "compliance.view",
    "vital.view", "vital.record", "vital.edit", "vital.delete", "vital.comment",
    "vital.plan.edit", "vital.escalate", "vital.report", "vital.audit",
    "observation.view", "observation.record", "observation.edit", "observation.delete",
    "observation.plan.edit", "observation.escalate", "observation.audit",
    "ops.edit", "ops.archive", "ops.restore", "ops.delete", "ops.duplicate",
  ],
  don: [
    "resident.view", "resident.create", "resident.edit", "resident.discharge",
    "note.create", "intervention.create", "handover.create",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit",
    "assessment.review", "assessment.approve", "assessment.delete", "assessment.archive",
    "assessment.assign", "assessment.create_revision", "assessment.comment",
    "assessment.restore", "assessment.audit_access", "assessment.reports",
    "careplan.view", "careplan.create", "careplan.edit",
    "careplan.review", "careplan.approve", "careplan.delete", "careplan.evaluate", "careplan.revise",
    "evaluation.create",
    "incident.view", "incident.create", "incident.manage",
    "clinical.view", "mdt.create", "medical_review.create",
    "recommendation.create", "treatment_note.create",
    "report.view", "report.manage",
    "user.manage", "permission.manage", "settings.manage",
    "audit.view", "record.delete_with_audit",
    "compliance.view",
    "vital.view", "vital.record", "vital.edit", "vital.delete", "vital.comment",
    "vital.plan.edit", "vital.escalate", "vital.report", "vital.audit",
    "observation.view", "observation.record", "observation.edit", "observation.delete",
    "observation.plan.edit", "observation.escalate", "observation.audit",
    "ops.edit", "ops.archive", "ops.restore", "ops.delete", "ops.duplicate",
  ],
};

export function can(role: Role, perm: Permission): boolean {
  return matrix[role].includes(perm);
}
export function canAny(role: Role, perms: Permission[]): boolean {
  return perms.some(p => can(role, p));
}

/**
 * Can this user edit a record? Carers/doctors can only edit their own.
 */
export function canEditOpsRecord(role: Role, currentUserName: string, createdBy?: string): boolean {
  if (can(role, "ops.edit")) return true;
  if (can(role, "ops.edit_own") && createdBy === currentUserName) return true;
  return false;
}
