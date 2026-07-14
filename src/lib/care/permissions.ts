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
  | "note.create" | "intervention.create" | "handover.view" | "handover.create" | "handover.acknowledge" | "handover.resolve" | "handover.carry_forward" | "handover.view_history" | "handover.manage"
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
  | "assessment_care_guidance.view" | "assessment_care_guidance.acknowledge" | "assessment_care_guidance.action" | "assessment_care_guidance.dismiss" | "assessment_care_guidance.view_history"
  | "rlt_dependency.view" | "rlt_dependency.record" | "rlt_dependency.review" | "rlt_dependency.correct" | "rlt_dependency.view_history"
  | "resident_strength.view" | "resident_strength.create" | "resident_strength.edit" | "resident_strength.review" | "resident_strength.correct" | "resident_strength.view_history"
  | "resident_preference.view" | "resident_preference.create" | "resident_preference.edit" | "resident_preference.review" | "resident_preference.correct" | "resident_preference.view_history" | "resident_preference.view_sensitive" | "resident_preference.view_highly_sensitive" | "resident_preference.manage_accommodation" | "resident_preference.manage_safety_review" | "resident_preference.resolve_conflict"
  | "rlt_overview.view" | "rlt_overview.view_risks" | "rlt_overview.view_care_plans" | "rlt_overview.view_preferences" | "rlt_overview.view_sensitive_preferences"
  | "rlt_timeline.view" | "rlt_timeline.view_sensitive" | "rlt_timeline.view_highly_sensitive" | "rlt_timeline.tag_event" | "rlt_timeline.remove_manual_tag"
  | "care_action.view" | "care_action.create_scheduled" | "care_action.create_prn" | "care_action.create_triggered" | "care_action.create_one_off" | "care_action.invoke_prn" | "care_action.activate_triggered" | "care_action.manage_type"
  | "end_of_life.view" | "end_of_life.view_sensitive" | "end_of_life.view_highly_sensitive" | "end_of_life.create" | "end_of_life.activate" | "end_of_life.review" | "end_of_life.record_wishes" | "end_of_life.view_advance_decisions" | "end_of_life.manage_family_support" | "end_of_life.manage_spiritual_support" | "end_of_life.record_death" | "end_of_life.manage_after_death_care"
  | "resident_profile.view" | "resident_profile.edit" | "resident_profile.edit_identity" | "resident_profile.edit_demographics" | "resident_profile.edit_photo" | "resident_profile.manage_contacts" | "resident_profile.assign_named_nurse" | "resident_profile.assign_key_worker" | "resident_profile.assign_gp" | "resident_profile.view_sensitive_identifiers" | "resident_profile.edit_sensitive_identifiers"
  | "resident_clinical_overview.view" | "resident_clinical_overview.view_assessments" | "resident_clinical_overview.view_risks" | "resident_clinical_overview.view_incidents" | "resident_clinical_overview.view_medication" | "resident_clinical_overview.view_sensitive" | "resident_clinical_overview.view_end_of_life"
  | "resident_work_due.view" | "resident_work_due.open_source" | "resident_work_due.complete" | "resident_work_due.defer" | "resident_work_due.mark_missed"
  | "resident_rlt_overview.view" | "resident_rlt_overview.view_risks" | "resident_rlt_overview.view_care_plans" | "resident_rlt_overview.view_dependency" | "resident_rlt_overview.view_preferences" | "resident_rlt_overview.view_sensitive"
  | "resident_recent_changes.view" | "resident_recent_changes.view_medication" | "resident_recent_changes.view_incidents" | "resident_recent_changes.view_sensitive"
  | "resident_timeline.view" | "resident_timeline.view_sensitive" | "resident_timeline.view_highly_sensitive"
  | "resident_contacts.view" | "resident_contacts.create" | "resident_contacts.edit_relationship" | "resident_contacts.set_primary" | "resident_contacts.manage_authority" | "resident_contacts.view_history" | "resident_contacts.edit_contact"
  | "ops.edit" | "ops.edit_own" | "ops.archive" | "ops.restore" | "ops.delete" | "ops.duplicate";

const matrix: Record<Role, Permission[]> = {
  carer: [
    "resident.view",
    "note.create", "intervention.create", "handover.view", "handover.create", "handover.acknowledge",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "careplan.view",
    "resident_strength.view", "resident_preference.view",
    "care_action.view", "care_action.invoke_prn", "end_of_life.view", "resident_profile.view", "resident_clinical_overview.view",
    "rlt_overview.view", "rlt_overview.view_care_plans", "rlt_overview.view_preferences", "rlt_timeline.view",
    "vital.view", "vital.record",
    "observation.view", "observation.record",
    "ops.edit_own", "ops.duplicate",
  ],
  nurse: [
    "resident.view", "resident.edit",
    "note.create", "intervention.create", "handover.view", "handover.create", "handover.acknowledge", "handover.resolve",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit", "assessment.review",
    "assessment.create_revision", "assessment.comment", "assessment.archive",
    "careplan.view", "careplan.create", "careplan.edit", "careplan.review", "careplan.evaluate",
    "resident_strength.view", "resident_strength.create", "resident_strength.edit", "resident_strength.review", "resident_strength.view_history",
    "resident_preference.view", "resident_preference.create", "resident_preference.edit", "resident_preference.review", "resident_preference.view_history", "resident_preference.view_sensitive", "resident_preference.manage_accommodation", "resident_preference.manage_safety_review",
    "care_action.view", "care_action.create_scheduled", "care_action.create_prn", "care_action.create_triggered", "care_action.create_one_off", "care_action.invoke_prn", "care_action.activate_triggered", "care_action.manage_type",
    "end_of_life.view", "end_of_life.view_sensitive", "end_of_life.view_highly_sensitive", "end_of_life.create", "end_of_life.activate", "end_of_life.review", "end_of_life.record_wishes", "end_of_life.view_advance_decisions", "end_of_life.manage_family_support", "end_of_life.manage_spiritual_support", "end_of_life.record_death", "end_of_life.manage_after_death_care",
    "resident_profile.view", "resident_profile.edit", "resident_profile.edit_identity", "resident_profile.edit_demographics", "resident_profile.manage_contacts", "resident_profile.assign_named_nurse", "resident_profile.assign_key_worker", "resident_profile.assign_gp", "resident_clinical_overview.view", "resident_clinical_overview.view_assessments", "resident_clinical_overview.view_risks", "resident_clinical_overview.view_incidents", "resident_clinical_overview.view_medication", "resident_clinical_overview.view_sensitive", "resident_clinical_overview.view_end_of_life",
    "rlt_overview.view", "rlt_overview.view_risks", "rlt_overview.view_care_plans", "rlt_overview.view_preferences", "rlt_overview.view_sensitive_preferences", "rlt_timeline.view", "rlt_timeline.view_sensitive", "rlt_timeline.tag_event",
    "evaluation.create",
    "incident.view", "incident.create",
    "vital.view", "vital.record", "vital.edit", "vital.comment", "vital.plan.edit", "vital.escalate",
    "observation.view", "observation.record", "observation.edit", "observation.plan.edit", "observation.escalate",
    "ops.edit", "ops.archive", "ops.restore", "ops.duplicate",
  ],
  doctor: [
    "resident.view", "clinical.view",
    "mdt.create", "medical_review.create",
    "recommendation.create", "treatment_note.create", "handover.view",
    "assessment.view", "assessment.comment", "careplan.view",
    "resident_strength.view", "resident_preference.view", "resident_preference.view_sensitive",
    "care_action.view", "care_action.create_scheduled", "care_action.create_prn", "care_action.create_triggered", "care_action.create_one_off", "care_action.invoke_prn", "care_action.activate_triggered", "care_action.manage_type",
    "end_of_life.view", "end_of_life.view_sensitive", "end_of_life.view_highly_sensitive", "end_of_life.create", "end_of_life.activate", "end_of_life.review", "end_of_life.record_wishes", "end_of_life.view_advance_decisions", "end_of_life.manage_family_support", "end_of_life.manage_spiritual_support", "end_of_life.record_death", "end_of_life.manage_after_death_care",
    "resident_profile.view", "resident_profile.edit", "resident_profile.edit_identity", "resident_profile.edit_demographics", "resident_profile.manage_contacts", "resident_profile.assign_gp", "resident_clinical_overview.view", "resident_clinical_overview.view_assessments", "resident_clinical_overview.view_risks", "resident_clinical_overview.view_incidents", "resident_clinical_overview.view_medication", "resident_clinical_overview.view_sensitive", "resident_clinical_overview.view_end_of_life",
    "rlt_overview.view", "rlt_overview.view_risks", "rlt_overview.view_care_plans", "rlt_overview.view_preferences", "rlt_timeline.view", "rlt_timeline.view_sensitive",
    "vital.view", "vital.comment", "vital.escalate",
    "observation.view", "observation.escalate",
    "ops.edit_own",
  ],
  cnm: [
    "resident.view", "resident.create", "resident.edit",
    "note.create", "intervention.create", "handover.view", "handover.create", "handover.acknowledge", "handover.resolve", "handover.carry_forward", "handover.view_history",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit",
    "assessment.review", "assessment.approve", "assessment.archive",
    "assessment.assign", "assessment.create_revision", "assessment.comment",
    "assessment.delete", "assessment.restore", "assessment.audit_access", "assessment.reports",
    "careplan.view", "careplan.create", "careplan.edit",
    "careplan.review", "careplan.approve", "careplan.evaluate", "careplan.revise",
    "resident_strength.view", "resident_strength.create", "resident_strength.edit", "resident_strength.review", "resident_strength.correct", "resident_strength.view_history",
    "resident_preference.view", "resident_preference.create", "resident_preference.edit", "resident_preference.review", "resident_preference.correct", "resident_preference.view_history", "resident_preference.view_sensitive", "resident_preference.view_highly_sensitive", "resident_preference.manage_accommodation", "resident_preference.manage_safety_review", "resident_preference.resolve_conflict",
    "care_action.view", "care_action.create_scheduled", "care_action.create_prn", "care_action.create_triggered", "care_action.create_one_off", "care_action.invoke_prn", "care_action.activate_triggered", "care_action.manage_type",
    "end_of_life.view", "end_of_life.view_sensitive", "end_of_life.view_highly_sensitive", "end_of_life.create", "end_of_life.activate", "end_of_life.review", "end_of_life.record_wishes", "end_of_life.view_advance_decisions", "end_of_life.manage_family_support", "end_of_life.manage_spiritual_support", "end_of_life.record_death", "end_of_life.manage_after_death_care",
    "resident_profile.view", "resident_profile.edit", "resident_profile.edit_identity", "resident_profile.edit_demographics", "resident_profile.edit_photo", "resident_profile.manage_contacts", "resident_profile.assign_named_nurse", "resident_profile.assign_key_worker", "resident_profile.assign_gp", "resident_profile.view_sensitive_identifiers", "resident_profile.edit_sensitive_identifiers", "resident_clinical_overview.view", "resident_clinical_overview.view_assessments", "resident_clinical_overview.view_risks", "resident_clinical_overview.view_incidents", "resident_clinical_overview.view_medication", "resident_clinical_overview.view_sensitive", "resident_clinical_overview.view_end_of_life",
    "rlt_overview.view", "rlt_overview.view_risks", "rlt_overview.view_care_plans", "rlt_overview.view_preferences", "rlt_overview.view_sensitive_preferences", "rlt_timeline.view", "rlt_timeline.view_sensitive", "rlt_timeline.view_highly_sensitive", "rlt_timeline.tag_event", "rlt_timeline.remove_manual_tag",
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
    "note.create", "intervention.create", "handover.view", "handover.create", "handover.acknowledge", "handover.resolve", "handover.carry_forward", "handover.view_history", "handover.manage",
    "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit",
    "assessment.review", "assessment.approve", "assessment.delete", "assessment.archive",
    "assessment.assign", "assessment.create_revision", "assessment.comment",
    "assessment.restore", "assessment.audit_access", "assessment.reports",
    "careplan.view", "careplan.create", "careplan.edit",
    "careplan.review", "careplan.approve", "careplan.delete", "careplan.evaluate", "careplan.revise",
    "resident_strength.view", "resident_strength.create", "resident_strength.edit", "resident_strength.review", "resident_strength.correct", "resident_strength.view_history",
    "resident_preference.view", "resident_preference.create", "resident_preference.edit", "resident_preference.review", "resident_preference.correct", "resident_preference.view_history", "resident_preference.view_sensitive", "resident_preference.view_highly_sensitive", "resident_preference.manage_accommodation", "resident_preference.manage_safety_review", "resident_preference.resolve_conflict",
    "care_action.view", "care_action.create_scheduled", "care_action.create_prn", "care_action.create_triggered", "care_action.create_one_off", "care_action.invoke_prn", "care_action.activate_triggered", "care_action.manage_type",
    "end_of_life.view", "end_of_life.view_sensitive", "end_of_life.view_highly_sensitive", "end_of_life.create", "end_of_life.activate", "end_of_life.review", "end_of_life.record_wishes", "end_of_life.view_advance_decisions", "end_of_life.manage_family_support", "end_of_life.manage_spiritual_support", "end_of_life.record_death", "end_of_life.manage_after_death_care",
    "resident_profile.view", "resident_profile.edit", "resident_profile.edit_identity", "resident_profile.edit_demographics", "resident_profile.edit_photo", "resident_profile.manage_contacts", "resident_profile.assign_named_nurse", "resident_profile.assign_key_worker", "resident_profile.assign_gp", "resident_profile.view_sensitive_identifiers", "resident_profile.edit_sensitive_identifiers", "resident_clinical_overview.view", "resident_clinical_overview.view_assessments", "resident_clinical_overview.view_risks", "resident_clinical_overview.view_incidents", "resident_clinical_overview.view_medication", "resident_clinical_overview.view_sensitive", "resident_clinical_overview.view_end_of_life",
    "rlt_overview.view", "rlt_overview.view_risks", "rlt_overview.view_care_plans", "rlt_overview.view_preferences", "rlt_overview.view_sensitive_preferences", "rlt_timeline.view", "rlt_timeline.view_sensitive", "rlt_timeline.view_highly_sensitive", "rlt_timeline.tag_event", "rlt_timeline.remove_manual_tag",
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
  return Boolean(matrix[role]?.includes(perm));
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
