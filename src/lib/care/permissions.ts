import type { Role } from "./types";

export const roleLabels: Record<Role, string> = {
  carer: "Carer",
  nurse: "Nurse",
  doctor: "Doctor",
  cnm: "Clinical Nurse Manager",
  don: "Director of Nursing",
  group_owner: "Group Owner",
};

export const roleDescriptions: Record<Role, string> = {
  carer: "Frontline care: notes, interventions, handovers",
  nurse: "Clinical: assessments, care plans, evaluations",
  doctor: "Medical reviews, MDT meetings, treatment notes",
  cnm: "Administrative oversight and approvals",
  don: "Full system access and governance",
  group_owner: "Enterprise access across all nursing homes",
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
  | "settings.manage" | "audit.view" | "record.delete_with_audit" | "finance.view"
  | "compliance.view"
  | "vital.view" | "vital.record" | "vital.edit" | "vital.delete" | "vital.comment"
  | "vital.plan.edit" | "vital.escalate" | "vital.report" | "vital.audit"
  | "observation.view" | "observation.record" | "observation.edit" | "observation.delete"
  | "observation.plan.edit" | "observation.escalate" | "observation.audit"
  | "observations.view" | "observations.record" | "observations.record_full_set" | "observations.record_news2" | "observations.record_pain" | "observations.record_weight" | "observations.record_blood_glucose" | "observations.record_neurological" | "observations.correct" | "observations.enter_in_error" | "observations.view_history" | "observations.view_charts" | "observations.view_sensitive" | "observations.manage_schedule" | "observations.override_interpretation"
  | "observations.view_summary" | "observations.view_trends" | "observations.view_notes" | "observations.view_escalation" | "observations.view_corrections" | "observations.view_entered_in_error" | "observations.export" | "observations.export_notes" | "observations.export_corrected" | "observations.export_entered_in_error" | "observations.record_for_another_staff_member" | "observations.record_escalation" | "observations.record_temperature" | "observations.record_pulse" | "observations.record_respirations" | "observations.record_blood_pressure" | "observations.record_spo2"
  | "weight_intelligence.view" | "weight_intelligence.view_history" | "weight_intelligence.view_comparisons" | "weight_intelligence.view_reports" | "weight_intelligence.export_reports" | "weight_intelligence.manage_schedule"
  | "weight_concern.view" | "weight_concern.acknowledge" | "weight_concern.escalate" | "weight_concern.resolve" | "weight_concern.dismiss" | "weight_concern.recalculate" | "weight_concern.view_don_attention" | "weight_concern.view_cnm_queue"
  | "assessment.must.view" | "assessment.must.record"
  | "clinical_follow_up.view" | "clinical_follow_up.create_manual" | "clinical_follow_up.manage_policy" | "clinical_follow_up.approve_policy" | "clinical_follow_up.reassign" | "clinical_follow_up.complete"
  | "clinical_escalation.view" | "clinical_escalation.record" | "clinical_escalation.edit_draft" | "clinical_escalation.complete" | "clinical_escalation.view_sensitive"
  | "clinical_transfer_decision.record" | "clinical_transfer_decision.view"
  | "deterioration_queue.view" | "deterioration_queue.view_multi_ward" | "deterioration_queue.acknowledge" | "deterioration_queue.start_review" | "deterioration_queue.reassign" | "deterioration_queue.escalate" | "deterioration_queue.resolve" | "deterioration_queue.dismiss"
  | "stop_and_watch.submit" | "stop_and_watch.view" | "stop_and_watch.acknowledge" | "stop_and_watch.review" | "stop_and_watch.escalate" | "stop_and_watch.resolve"
  | "daily_care.view" | "daily_care.record" | "daily_care.bedside_view" | "daily_care.bedside_record" | "daily_care.view_ward_residents" | "daily_care.record_quick" | "daily_care.record_detailed" | "daily_care.record_personal_care" | "daily_care.record_dressing" | "daily_care.record_oral_care" | "daily_care.record_toileting" | "daily_care.record_continence" | "daily_care.record_repositioning" | "daily_care.record_food" | "daily_care.record_fluids" | "daily_care.record_mobility" | "daily_care.record_comfort" | "daily_care.record_sleep" | "daily_care.record_mood" | "daily_care.record_behaviour" | "daily_care.record_activity" | "daily_care.record_refusal" | "daily_care.record_skin_observation" | "daily_care.record_escalated_outcome" | "daily_care.notify_nurse" | "daily_care.create_follow_up" | "daily_care.create_refusal_follow_up" | "daily_care.escalate_refusal" | "daily_care.view_refusal" | "daily_care.correct_refusal" | "daily_care.enter_refusal_in_error" | "daily_care.view_rlt_mapping" | "daily_care.correct" | "daily_care.enter_in_error" | "daily_care.view_sensitive" | "daily_care.record_for_another_staff_member"
  | "daily_care_trends.view" | "daily_care_trends.evaluate" | "daily_care_trends.view_sensitive" | "daily_care_trends.manage_policy" | "daily_care_trends.approve_policy"
  | "daily_care_reports.view" | "daily_care_reports.export" | "daily_care_reports.view_behaviour" | "daily_care_reports.view_refusals" | "daily_care_reports.view_sleep" | "daily_care_reports.view_all_wards" | "daily_care_reports.view_multiple_homes"
  | "hca_escalation.submit" | "hca_escalation.view_own" | "hca_escalation.view_ward" | "hca_escalation.acknowledge" | "hca_escalation.review" | "hca_escalation.reassign" | "hca_escalation.complete" | "hca_escalation.dismiss"
  | "resident_baseline.view" | "resident_baseline.view_source" | "resident_baseline.create" | "resident_baseline.edit_draft" | "resident_baseline.submit_approval" | "resident_baseline.approve" | "resident_baseline.review" | "resident_baseline.supersede" | "resident_baseline.revoke" | "resident_baseline.correct" | "resident_baseline.view_history" | "resident_baseline.manage_oxygen_target"
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
  | "resident_documents.view" | "resident_documents.upload" | "resident_documents.edit_metadata" | "resident_documents.upload_version" | "resident_documents.download" | "resident_documents.view_history" | "resident_documents.change_status" | "resident_documents.delete_draft" | "resident_documents.view_sensitive" | "resident_documents.view_highly_sensitive" | "resident_documents.manage_access" | "resident_documents.view_legal" | "resident_documents.view_safeguarding" | "resident_documents.view_medication"
  | "resident_administration.view" | "resident_administration.edit" | "resident_administration.view_identifiers" | "resident_administration.edit_identifiers" | "resident_administration.view_funding" | "resident_administration.edit_funding_metadata" | "resident_administration.view_contract" | "resident_administration.edit_contract_metadata" | "resident_administration.view_insurance" | "resident_administration.edit_insurance" | "resident_administration.view_property_summary" | "resident_administration.view_internal_references"
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
  group_owner: [],
};

export function can(role: Role, perm: Permission): boolean {
  if (role === "group_owner") return true;
  if (perm.startsWith("resident_baseline.")) {
    if (["resident_baseline.view", "resident_baseline.view_history"].includes(perm)) return true;
    if (["resident_baseline.view_source", "resident_baseline.create", "resident_baseline.edit_draft", "resident_baseline.submit_approval"].includes(perm)) return role !== "carer";
    if (["resident_baseline.approve", "resident_baseline.review", "resident_baseline.supersede", "resident_baseline.revoke", "resident_baseline.correct", "resident_baseline.manage_oxygen_target"].includes(perm)) return role === "cnm" || role === "don" || role === "doctor";
  }
  if (perm.startsWith("observations.")) {
    const clinical = role === "nurse" || role === "cnm" || role === "don";
    if (["observations.view", "observations.view_history", "observations.view_summary", "observations.view_trends", "observations.view_charts"].includes(perm)) return true;
    if (["observations.view_notes", "observations.view_escalation", "observations.view_corrections"].includes(perm)) return role !== "carer";
    if (["observations.view_entered_in_error", "observations.export", "observations.export_notes", "observations.export_corrected", "observations.export_entered_in_error"].includes(perm)) return role === "cnm" || role === "don";
    if (["observations.record", "observations.record_pain", "observations.record_weight", "observations.record_blood_glucose"].includes(perm)) return role !== "doctor";
    if (perm === "observations.record_neurological" || perm === "observations.record_full_set" || perm === "observations.record_news2") return clinical;
    if (["observations.record_temperature", "observations.record_pulse", "observations.record_respirations", "observations.record_blood_pressure", "observations.record_spo2"].includes(perm)) return role !== "doctor";
    if (perm === "observations.record_for_another_staff_member" || perm === "observations.record_escalation") return clinical;
    if (perm === "observations.view_sensitive") return role !== "carer";
    if (perm === "observations.correct" || perm === "observations.enter_in_error" || perm === "observations.manage_schedule") return clinical;
    if (perm === "observations.override_interpretation") return role === "cnm" || role === "don";
  }
  if (perm.startsWith("weight_intelligence.")) {
    if (["weight_intelligence.view", "weight_intelligence.view_history"].includes(perm)) return true;
    if (perm === "weight_intelligence.view_comparisons") return role !== "carer";
    if (["weight_intelligence.view_reports", "weight_intelligence.export_reports"].includes(perm)) return role === "cnm" || role === "don";
    if (perm === "weight_intelligence.manage_schedule") return role === "nurse" || role === "cnm" || role === "don";
  }
  if (perm.startsWith("weight_concern.")) {
    if (perm === "weight_concern.view") return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
    if (perm === "weight_concern.acknowledge") return role === "nurse" || role === "cnm" || role === "don";
    if (["weight_concern.escalate", "weight_concern.resolve", "weight_concern.dismiss"].includes(perm)) return role === "doctor" || role === "cnm" || role === "don";
    if (perm === "weight_concern.recalculate") return role === "cnm" || role === "don";
    if (perm === "weight_concern.view_don_attention") return role === "don";
    if (perm === "weight_concern.view_cnm_queue") return role === "cnm" || role === "don";
  }
  if (perm.startsWith("assessment.must.")) return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
  if (perm.startsWith("clinical_follow_up.")) {
    if (perm === "clinical_follow_up.view") return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
    if (["clinical_follow_up.create_manual", "clinical_follow_up.reassign", "clinical_follow_up.complete"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
    if (perm === "clinical_follow_up.manage_policy") return role === "cnm" || role === "don";
    if (perm === "clinical_follow_up.approve_policy") return role === "don";
  }
  if (perm.startsWith("clinical_escalation.")) {
    if (perm === "clinical_escalation.view") return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
    if (["clinical_escalation.record", "clinical_escalation.edit_draft", "clinical_escalation.complete"].includes(perm)) return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
    if (perm === "clinical_escalation.view_sensitive") return role === "doctor" || role === "cnm" || role === "don";
  }
  if (perm.startsWith("clinical_transfer_decision.")) return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
  if (perm.startsWith("deterioration_queue.")) {
    if (perm === "deterioration_queue.view") return role === "nurse" || role === "doctor" || role === "cnm" || role === "don";
    if (perm === "deterioration_queue.view_multi_ward") return role === "cnm" || role === "don";
    if (["deterioration_queue.acknowledge", "deterioration_queue.start_review"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
    if (["deterioration_queue.reassign", "deterioration_queue.escalate", "deterioration_queue.resolve", "deterioration_queue.dismiss"].includes(perm)) return role === "cnm" || role === "don" || role === "doctor";
  }
  if (perm.startsWith("stop_and_watch.")) {
    if (["stop_and_watch.submit", "stop_and_watch.view"].includes(perm)) return role === "carer" || role === "nurse" || role === "cnm" || role === "don";
    if (["stop_and_watch.acknowledge", "stop_and_watch.review", "stop_and_watch.escalate", "stop_and_watch.resolve"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
  }
  if (perm.startsWith("daily_care.")) {
    if (["daily_care.view", "daily_care.record", "daily_care.bedside_view", "daily_care.bedside_record", "daily_care.view_ward_residents", "daily_care.record_quick"].includes(perm)) return role === "carer" || role === "nurse" || role === "cnm" || role === "don";
    if (perm === "daily_care.record_for_another_staff_member") return role === "nurse" || role === "cnm" || role === "don";
    if (["daily_care.record_detailed", "daily_care.record_escalated_outcome", "daily_care.escalate_refusal", "daily_care.view_rlt_mapping"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
    if (["daily_care.notify_nurse", "daily_care.create_follow_up", "daily_care.create_refusal_follow_up", "daily_care.view_refusal"].includes(perm)) return role === "carer" || role === "nurse" || role === "cnm" || role === "don";
    if (perm.startsWith("daily_care.record_")) return role === "carer" || role === "nurse" || role === "cnm" || role === "don";
    if (["daily_care.correct", "daily_care.enter_in_error", "daily_care.view_sensitive", "daily_care.correct_refusal", "daily_care.enter_refusal_in_error"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
  }
  if (perm.startsWith("daily_care_trends.")) {
    if (["daily_care_trends.view", "daily_care_trends.evaluate"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
    if (["daily_care_trends.view_sensitive", "daily_care_trends.manage_policy", "daily_care_trends.approve_policy"].includes(perm)) return role === "cnm" || role === "don";
  }
  if (perm.startsWith("daily_care_reports.")) {
    if (perm === "daily_care_reports.view") return role === "carer" || role === "nurse" || role === "cnm" || role === "don";
    if (["daily_care_reports.view_behaviour", "daily_care_reports.view_refusals", "daily_care_reports.view_sleep"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
    if (["daily_care_reports.export", "daily_care_reports.view_all_wards", "daily_care_reports.view_multiple_homes"].includes(perm)) return role === "cnm" || role === "don";
  }
  if (perm.startsWith("hca_escalation.")) {
    if (["hca_escalation.submit", "hca_escalation.view_own"].includes(perm)) return role === "carer" || role === "nurse" || role === "cnm" || role === "don";
    if (["hca_escalation.view_ward", "hca_escalation.acknowledge", "hca_escalation.review", "hca_escalation.complete"].includes(perm)) return role === "nurse" || role === "cnm" || role === "don";
    if (["hca_escalation.reassign", "hca_escalation.dismiss"].includes(perm)) return role === "cnm" || role === "don";
  }
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
