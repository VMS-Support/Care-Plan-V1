import type { RltDomainId } from "@/lib/care/rlt";
import type { DailyCareOutcome, DailyCareParticipationLevel, DailyCareType } from "../dailyCareTypes";

export type DailyCareReportType =
  | "food"
  | "fluids"
  | "toileting"
  | "adl"
  | "repositioning"
  | "refusal"
  | "behaviour"
  | "sleep";

export type DailyCareReportSortField =
  | "resident"
  | "ward"
  | "occurredAt"
  | "recordedAt"
  | "careType"
  | "outcome"
  | "staffMember";

export interface DailyCareReportFilters {
  nursingHomeIds?: string[];
  wardIds?: string[];
  residentIds?: string[];
  roomIds?: string[];
  bedIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  shiftIds?: string[];
  careTypes?: DailyCareType[];
  staffMemberIds?: string[];
  outcomes?: DailyCareOutcome[];
  followUpRequired?: boolean;
  escalationPresent?: boolean;
  rltDomainIds?: RltDomainId[];
  includeEnteredInError?: boolean;
  includeCorrectedRecords?: boolean;
}

export interface DailyCareReportPagination {
  pageIndex?: number;
  pageSize?: number;
}

export interface DailyCareReportSorting {
  field?: DailyCareReportSortField;
  direction?: "asc" | "desc";
}

export interface DailyCareReportOptions {
  filters?: DailyCareReportFilters;
  pagination?: DailyCareReportPagination;
  sorting?: DailyCareReportSorting;
  groupBy?: string[];
}

export interface DailyCareReportResidentContext {
  residentId: string;
  displayName: string;
  roomNumber?: string;
  nursingHomeId?: string;
  wardId?: string;
  roomId?: string;
  bedId?: string;
}

export interface DailyCareReportWardContext {
  wardId: string;
  name: string;
}

export interface DailyCareReportRoomContext {
  roomId: string;
  label: string;
}

export interface DailyCareReportBedContext {
  bedId: string;
  label: string;
}

export interface DailyCareReportStaffContext {
  staffMemberId: string;
  displayName: string;
}

export interface DailyCareReportSourceContext {
  residents?: DailyCareReportResidentContext[];
  wards?: DailyCareReportWardContext[];
  rooms?: DailyCareReportRoomContext[];
  beds?: DailyCareReportBedContext[];
  staffMembers?: DailyCareReportStaffContext[];
  escalations?: Array<{ id: string; sourceDailyCareRecordIds: string[]; status?: string }>;
  trendEvaluations?: Array<{ trendType: string; evidenceRecordIds: string[]; status: string }>;
}

export interface DailyCareReportCommonRow {
  id: string;
  residentId: string;
  resident: string;
  nursingHomeId: string;
  wardId?: string;
  ward?: string;
  roomId?: string;
  room?: string;
  bedId?: string;
  bed?: string;
  occurredAt: string;
  recordedAt: string;
  shiftId?: string;
  careType: DailyCareType;
  careTypeLabel: string;
  outcome: DailyCareOutcome;
  participation: DailyCareParticipationLevel;
  deliveredByStaffMemberId?: string;
  deliveredBy?: string;
  recordedByStaffMemberId?: string;
  recordedBy?: string;
  hasNotes: boolean;
  hasEscalation: boolean;
  followUpRequired: boolean;
  hasLinkedWorkItem: boolean;
  rltDomainIds: RltDomainId[];
  status: string;
}

export interface FoodReportRow extends DailyCareReportCommonRow {
  reportType: "food";
  mealType?: string;
  intake?: string;
  assistance?: string;
  swallowingConcern?: boolean;
  reducedIntake?: boolean;
  refusal?: boolean;
}

export interface FluidReportRow extends DailyCareReportCommonRow {
  reportType: "fluids";
  drinkType?: string;
  amountOfferedMl?: number;
  amountTakenMl?: number;
  intakeEstimate?: string;
  consistency?: string;
  assistance?: string;
  swallowingConcern?: boolean;
  reducedIntake?: boolean;
  measuredTotalMl?: number;
}

export interface ToiletingReportRow extends DailyCareReportCommonRow {
  reportType: "toileting";
  toiletingMethod?: string;
  urine?: boolean;
  bowelMotion?: boolean;
  assistance?: string[];
  continenceState?: string;
  productChanged?: boolean;
  skinCareProvided?: boolean;
  discomfortObserved?: boolean;
}

export interface AdlReportRow extends DailyCareReportCommonRow {
  reportType: "adl";
  completionStatus: DailyCareOutcome;
  assistance?: string | string[];
  refusal?: boolean;
  trendIndicators: string[];
}

export interface RepositioningReportRow extends DailyCareReportCommonRow {
  reportType: "repositioning";
  fromPosition?: string;
  toPosition?: string;
  equipmentUsed?: string[];
  comfortAfter?: boolean;
  skinConcern?: boolean;
  missed?: boolean;
  partial?: boolean;
}

export interface RefusalReportRow extends DailyCareReportCommonRow {
  reportType: "refusal";
  careOffered?: string;
  refusedCareType?: string;
  reason?: string;
  alternativesOffered?: string[];
  acceptedAlternative?: boolean;
  nurseInformed?: boolean;
  escalationRequired?: boolean;
  retryAt?: string;
}

export interface BehaviourReportRow extends DailyCareReportCommonRow {
  reportType: "behaviour";
  behaviourObserved?: string[];
  triggers?: string[];
  interventions?: string[];
  response?: string;
  riskIndicators?: boolean;
  restrictivePractice?: boolean;
}

export interface SleepReportRow extends DailyCareReportCommonRow {
  reportType: "sleep";
  sleepState?: string;
  durationMinutes?: number;
  wakingEpisodes?: number;
  interventions?: string[];
  distressIndicator?: boolean;
  alteredSleepTrend?: boolean;
}

export type DailyCareReportRow =
  | FoodReportRow
  | FluidReportRow
  | ToiletingReportRow
  | AdlReportRow
  | RepositioningReportRow
  | RefusalReportRow
  | BehaviourReportRow
  | SleepReportRow;

export interface DailyCareReportGroup {
  key: string;
  label: string;
  count: number;
  followUpCount: number;
  escalationCount: number;
}

export interface DailyCareReportResult<TRow extends DailyCareReportRow = DailyCareReportRow> {
  reportType: DailyCareReportType;
  rows: TRow[];
  total: number;
  pageIndex: number;
  pageSize: number;
  groups: DailyCareReportGroup[];
}

export const DAILY_CARE_REPORT_LABELS: Record<DailyCareReportType, string> = {
  food: "Food Report",
  fluids: "Fluid Report",
  toileting: "Toileting Report",
  adl: "ADL Report",
  repositioning: "Repositioning Report",
  refusal: "Refusal Report",
  behaviour: "Behaviour Report",
  sleep: "Sleep Report",
};
