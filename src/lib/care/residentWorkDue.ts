import { buildWorkQueueReadModel, WORK_QUEUE_READ_MODEL_VERSION } from "@/domain/work/workQueueReadModel";
import type { WorkQueueReferenceData } from "@/domain/work/workQueue";
import type { WorkAuthContext, WorkItem, WorkPriority, WorkQueueItem, WorkType } from "@/domain/work/workTypes";
import type { OperationalContext } from "./types";
import { RLT_DOMAIN_BY_ID, type RltDomainId } from "./rlt";

export type ResidentWorkDueSectionKey = "overdue" | "due_now" | "next_four_hours" | "today";
export interface ResidentWorkDueItem {
  workItemId: string;
  workType: WorkType;
  title: string;
  summary?: string;
  originalDueAt?: string;
  effectiveDueAt?: string;
  displayStatus: "scheduled" | "due_soon" | "due_now" | "overdue" | "in_progress" | "deferred";
  dueDescription: string;
  priority: WorkPriority;
  clinicalUrgency?: "routine" | "time_sensitive" | "urgent_review" | "immediate";
  source: WorkQueueItem["source"];
  assignment: { assignmentType: WorkQueueItem["assignment"]["assignmentType"]; displayLabel: string };
  rltDomain?: { rltDomainId: RltDomainId; displayName: string };
  allowedActions: { open: boolean; start: boolean; complete: boolean; defer: boolean; markMissed: boolean; markNotApplicable: boolean; cancel: boolean };
}
export interface ResidentWorkDueSection { key: ResidentWorkDueSectionKey; label: string; count: number; items: ResidentWorkDueItem[]; hasMore: boolean; }
export interface ResidentWorkDueViewModel {
  residentId: string;
  nursingHomeId: string;
  generatedAt: string;
  cacheKey: string;
  summary: { overdue: number; dueNow: number; nextFourHours: number; today: number; totalActive: number };
  sections: { overdue: ResidentWorkDueSection; dueNow: ResidentWorkDueSection; nextFourHours: ResidentWorkDueSection; today: ResidentWorkDueSection };
}
export interface ResidentWorkDueData {
  items: WorkItem[];
  references: WorkQueueReferenceData;
  sourceExists?: (item: WorkItem) => boolean;
  sourceIsActive?: (item: WorkItem) => boolean;
  resolvePersonLabel?: (staffMemberId?: string, userAccountId?: string) => string | undefined;
}

const mapDisplayStatus = (row: WorkQueueItem): ResidentWorkDueItem["displayStatus"] => row.displayStatus === "overdue" ? "overdue" : row.displayStatus === "due_now" ? "due_now" : row.displayStatus === "in_progress" ? "in_progress" : row.displayStatus === "deferred" ? "deferred" : ["next_hour", "next_four_hours", "due_today"].includes(row.displayStatus) ? "due_soon" : "scheduled";
const mapRow = (row: WorkQueueItem, item: WorkItem, capabilities: string[]): ResidentWorkDueItem => {
  const domainId = item.careContext?.rltDomainId;
  const domain = domainId && domainId in RLT_DOMAIN_BY_ID ? RLT_DOMAIN_BY_ID[domainId as RltDomainId] : undefined;
  return {
    workItemId: row.workItemId, workType: row.workType, title: row.title, summary: row.summary,
    originalDueAt: row.originalDueAt, effectiveDueAt: row.effectiveDueAt, displayStatus: mapDisplayStatus(row), dueDescription: row.dueDescription || "Due time recorded", priority: row.priority, clinicalUrgency: row.clinicalUrgency,
    source: row.source, assignment: { assignmentType: row.assignment.assignmentType, displayLabel: row.assignmentLabel || row.assignment.label || "Unassigned" },
    rltDomain: domain ? { rltDomainId: domain.id, displayName: domain.title } : undefined,
    allowedActions: {
      open: capabilities.includes("resident_work_due.open_source") && row.allowedActions.open,
      start: capabilities.includes("resident_work_due.open_source") && row.allowedActions.start,
      complete: capabilities.includes("resident_work_due.complete") && row.allowedActions.complete,
      defer: capabilities.includes("resident_work_due.defer") && row.allowedActions.defer,
      markMissed: capabilities.includes("resident_work_due.mark_missed") && row.allowedActions.markMissed,
      markNotApplicable: row.allowedActions.markNotApplicable,
      cancel: row.allowedActions.cancel,
    },
  };
};

export function getResidentWorkDue(data: ResidentWorkDueData, residentId: string, operationalContext: OperationalContext, authorization: WorkAuthContext): ResidentWorkDueViewModel {
  if (!authorization.capabilities.includes("resident_work_due.view")) throw new Error("Missing capability: resident_work_due.view");
  const resident = data.references.residents.find((item) => String(item.id) === residentId);
  if (!resident) throw new Error("Resident not found.");
  const nursingHomeId = String(resident.facilityId || operationalContext.nursingHomeId);
  if (nursingHomeId !== String(operationalContext.nursingHomeId) || !authorization.authorisedNursingHomeIds.includes(nursingHomeId)) throw new Error("Resident is outside the authorised nursing home.");
  // Resident access is the scope here. Include home wards so a recent move does not
  // hide source work still carrying the previous ward, while bedside eligibility
  // continues to be enforced from the resident's current presence and placement.
  const homeWardIds = data.references.wards.filter((ward) => String(ward.nursingHomeId) === nursingHomeId).map((ward) => String(ward.id));
  const residentContext: OperationalContext = { ...operationalContext, wardSelectionMode: homeWardIds.length > 1 ? "multiple" : "single", wardIds: [...new Set(homeWardIds)] };
  const residentAuthorization: WorkAuthContext = { ...authorization, authorisedWardIds: [...new Set(homeWardIds)] };
  const queue = buildWorkQueueReadModel(residentContext, residentAuthorization, {
    items: data.items,
    references: data.references,
    filters: { residentId, mode: "active", dueSections: ["overdue", "dueNow", "nextFourHours", "today"] },
    pagination: { pageSize: 500 },
    capabilityVersion: "resident-work-due-v1",
    sourceExists: data.sourceExists,
    sourceIsActive: data.sourceIsActive,
    residentAllowed: (candidateId) => candidateId === residentId && resident.lifecycleStatus === "active" && resident.presenceStatus === "in_home" && Boolean(resident.roomId || resident.roomNumber),
    resolvePersonLabel: data.resolvePersonLabel,
  });
  const itemById = new Map(data.items.map((item) => [String(item.id), item]));
  const used = new Set<string>();
  const select = (rows: WorkQueueItem[]) => rows.filter((row) => !used.has(row.workItemId) && itemById.has(row.workItemId)).map((row) => { used.add(row.workItemId); return mapRow(row, itemById.get(row.workItemId)!, authorization.capabilities); });
  const overdue = select(queue.sections.overdue.items);
  const dueNow = select(queue.sections.dueNow.items);
  const nextFourHours = select(queue.sections.nextFourHours.items);
  const today = select(queue.sections.today.items);
  const section = (key: ResidentWorkDueSectionKey, label: string, items: ResidentWorkDueItem[], hasMore: boolean): ResidentWorkDueSection => ({ key, label, count: items.length, items, hasMore });
  const sections = {
    overdue: section("overdue", "Overdue", overdue, queue.sections.overdue.hasMore),
    dueNow: section("due_now", "Due Now", dueNow, queue.sections.dueNow.hasMore),
    nextFourHours: section("next_four_hours", "Next 4 Hours", nextFourHours, queue.sections.nextFourHours.hasMore),
    today: section("today", "Due Today", today, queue.sections.today.hasMore),
  };
  return { residentId, nursingHomeId, generatedAt: queue.generatedAt, cacheKey: JSON.stringify(["resident-work-due", WORK_QUEUE_READ_MODEL_VERSION, residentId, nursingHomeId, operationalContext.operationalDate, operationalContext.shiftId, operationalContext.timezone, "resident-work-due-v1"]), summary: { overdue: overdue.length, dueNow: dueNow.length, nextFourHours: nextFourHours.length, today: today.length, totalActive: queue.summary.totalActive }, sections };
}
