import type { WorkItem, WorkType } from "./workTypes";

export interface WorkTypeHandler {
  workType: WorkType;
  sourceCapability: string;
  openLabel: string;
  getRoute(item: WorkItem): string;
  supportsStart(item: WorkItem): boolean;
  supportsDirectCompletion(item: WorkItem): boolean;
  supportsDeferral(item: WorkItem): boolean;
  supportsMissed(item: WorkItem): boolean;
  supportsCancellation(item: WorkItem): boolean;
  supportsNotApplicable(item: WorkItem): boolean;
}
const handler = (
  workType: WorkType,
  sourceCapability: string,
  openLabel: string,
  options: Partial<Record<"start" | "direct" | "defer" | "miss" | "cancel" | "na", boolean>> = {},
): WorkTypeHandler => ({
  workType,
  sourceCapability,
  openLabel,
  getRoute: (item) => item.source.route || "#",
  supportsStart: () => options.start !== false,
  supportsDirectCompletion: () => options.direct === true,
  supportsDeferral: () => options.defer !== false,
  supportsMissed: () => options.miss !== false,
  supportsCancellation: () => options.cancel === true,
  supportsNotApplicable: () => options.na !== false,
});
export const WORK_TYPE_HANDLERS: Record<WorkType, WorkTypeHandler> = {
  care_action: handler("care_action", "care_action.complete", "Open Care Action", {
    direct: false,
    cancel: false,
  }),
  general_task: handler("general_task", "task.complete", "Open Task", {
    direct: true,
    cancel: true,
  }),
  observation: handler("observation", "observation.record", "Record Observation", {
    direct: false,
    cancel: false,
  }),
  assessment: handler("assessment", "assessment.complete", "Start Assessment", {
    direct: false,
    cancel: false,
  }),
  appointment: handler("appointment", "appointment.update", "Open Appointment", {
    direct: false,
    cancel: true,
  }),
  care_plan_review: handler("care_plan_review", "care_plan.review", "Review Care Plan", {
    direct: false,
    cancel: false,
  }),
  referral: handler("referral", "referral.update", "Open Referral", {
    direct: false,
    cancel: true,
  }),
  documentation: handler("documentation", "documentation.create", "Complete Documentation", {
    direct: false,
    cancel: true,
  }),
  handover_acknowledgement: handler(
    "handover_acknowledgement",
    "handover.acknowledge",
    "Acknowledge",
    { start: false, direct: false, defer: false, miss: false, cancel: false, na: false },
  ),
};
export const getWorkTypeHandler = (workType: WorkType) => WORK_TYPE_HANDLERS[workType];
