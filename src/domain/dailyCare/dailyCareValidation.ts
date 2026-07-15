import type { WorkItem } from "@/domain/work";
import type { DailyCareDetails } from "./dailyCareDetails";
import type { DailyCareAuthorizationContext, DailyCareOperationalContext, RecordDailyCareCommand } from "./dailyCareTypes";
import { normalizeDailyCareOutcome } from "./dailyCareOutcome";

export function validateRecordDailyCareCommand(command: RecordDailyCareCommand, operational: DailyCareOperationalContext, auth: DailyCareAuthorizationContext, workItems: WorkItem[] = []) {
  if (!auth.capabilities.includes("daily_care.record")) throw new Error("Missing capability: daily_care.record");
  const typeCapability = `daily_care.record_${command.careType}`;
  if (!auth.capabilities.includes(typeCapability)) throw new Error(`Missing capability: ${typeCapability}`);
  const outcome = normalizeDailyCareOutcome(command.status);
  if (outcome === "refused" && !auth.capabilities.includes("daily_care.record_refusal")) throw new Error("Missing capability: daily_care.record_refusal");
  if (outcome === "escalated" && !auth.capabilities.includes("daily_care.record_escalated_outcome")) throw new Error("Missing capability: daily_care.record_escalated_outcome");
  if (!auth.authorisedNursingHomeIds.includes(String(command.nursingHomeId))) throw new Error("Daily Care record is outside the authorised nursing home.");
  if (String(command.nursingHomeId) !== operational.nursingHomeId) throw new Error("Daily Care nursing home does not match the active context.");
  if (auth.residentIds?.length && !auth.residentIds.includes(String(command.residentId))) throw new Error("Resident is outside the authorised scope.");
  if (command.wardId && auth.authorisedWardIds?.length && !auth.authorisedWardIds.includes(String(command.wardId))) throw new Error("Ward is outside the authorised scope.");
  if (!Number.isFinite(Date.parse(command.occurredAt))) throw new Error("Date and Time Care Provided is invalid.");
  if (Date.parse(command.occurredAt) > Date.parse(operational.recordedAt) + 300_000) throw new Error("Daily Care cannot be recorded in the future.");
  if (command.details.type !== command.careType) throw new Error("Daily Care details do not match the selected care type.");
  if (["partially_completed", "unable"].includes(outcome) && !command.statusReason?.trim()) throw new Error("A reason is required for this outcome.");
  if (outcome === "refused" && command.details.type !== "refusal") throw new Error("Refused care must use the structured refusal workflow.");
  if (outcome === "not_required" && (command.source.sourceType === "work_item" || command.relatedWorkItemId) && !command.statusReason?.trim()) throw new Error("A reason is required when source work was expected.");
  if (outcome === "escalated" && (!command.statusReason?.trim() || !command.followUpRequired)) throw new Error("Escalated care requires a concise concern and follow-up.");
  if (command.outcomeReasonCode === "other" && !command.statusReason?.trim()) throw new Error("Other reason requires a concise explanation.");
  if (command.status === "entered_in_error") throw new Error("Use markDailyCareEnteredInError for invalid historical records.");
  if (command.followUpRequired && !command.followUpReason?.trim()) throw new Error("Follow-Up Required needs a reason.");
  validateDetails(command.details);
  if (command.relatedWorkItemId) {
    const work = workItems.find((item) => String(item.id) === String(command.relatedWorkItemId));
    if (work) {
      if (String(work.residentId) !== String(command.residentId)) throw new Error("Linked Work Item belongs to another resident.");
      if (String(work.nursingHomeId) !== String(command.nursingHomeId)) throw new Error("Linked Work Item belongs to another nursing home.");
    }
  }
}

export function validateDetails(details: DailyCareDetails) {
  if (details.type === "personal_care" && !details.careProvided.length) throw new Error("Personal Care requires care provided.");
  if (details.type === "oral_care" && !details.oralCareProvided.length) throw new Error("Oral Care requires care provided.");
  if (details.type === "repositioning" && !details.toPosition.trim()) throw new Error("Repositioning requires a new position.");
  if (details.type === "fluids") {
    if (details.amountOfferedMl !== undefined && details.amountOfferedMl < 0) throw new Error("Amount offered must be non-negative.");
    if (details.amountTakenMl !== undefined && details.amountTakenMl < 0) throw new Error("Amount taken must be non-negative.");
    if (details.amountOfferedMl !== undefined && details.amountTakenMl !== undefined && details.amountTakenMl > details.amountOfferedMl && !details.reasonForReducedIntake?.trim()) throw new Error("Amount taken cannot exceed offered amount without a clear note.");
  }
  if (details.type === "refusal") {
    if (!details.careOffered?.title?.trim()) throw new Error("Refusal requires the care offered.");
    if (details.refusalReason === "other" && !details.refusalReasonText?.trim()) throw new Error("Free text is required for other refusal reason.");
    if (details.residentResponse === "other" && !details.residentResponseText?.trim()) throw new Error("Resident response details are required for Other.");
    if (details.alternativesOffered.some((alternative) => alternative.alternativeType === "other" && !alternative.description?.trim())) throw new Error("Other alternative requires a description.");
    if (details.immediateRiskIdentified && !details.nurseInformed) throw new Error("Immediate risk requires nurse notification.");
    if (details.followUpRequired && !details.followUpReason?.trim() && !details.retryAt) throw new Error("Refusal follow-up requires a reason or retry time.");
  }
  if (details.type === "skin_observation" && (!details.bodyAreasObserved.length || !details.skinState.length)) throw new Error("Skin Observation requires body area and skin state.");
  if (details.type === "activity" && !details.activityName.trim()) throw new Error("Activity name is required.");
  if (details.type === "behaviour" && !details.behaviourObserved.length) throw new Error("Behaviour observed is required.");
}
