import type { ObservationEscalationStatus } from "./observationEntryTypes";
import type { ObservationSetType, ObservationType, ResidentObservationRecord } from "./observationTypes";

export interface ResidentObservationHistoryFilters {
  observationSetTypes?: ObservationSetType[];
  observationTypes?: ObservationType[];
  dateFrom?: string;
  dateTo?: string;
  interpretations?: Array<"within_expected_range" | "review_recommended" | "urgent_review" | "critical" | "not_interpreted">;
  clinicallySignificantOnly?: boolean;
  escalationStatuses?: ObservationEscalationStatus[];
  observedByStaffMemberIds?: string[];
  recordedByStaffMemberIds?: string[];
  sourceTypes?: string[];
  recordStatuses?: ResidentObservationRecord["status"][];
}

export interface ObservationHistoryAuthorization {
  nursingHomeId: string;
  residentIds: string[];
  capabilities: string[];
  canAccessSource?: (record: ResidentObservationRecord) => boolean;
}

export interface ObservationHistoryPage {
  records: ResidentObservationRecord[];
  nextCursor?: string;
  totalMatching: number;
}

export type ObservationExportFormat = "csv" | "xlsx" | "pdf";
export interface ResidentObservationExportRequest {
  residentId: string;
  nursingHomeId: string;
  format: ObservationExportFormat;
  filters: ResidentObservationHistoryFilters;
  includeSummary: boolean;
  includeComponents: boolean;
  includeNotes: boolean;
  includeEscalation: boolean;
  includeCorrectedRecords: boolean;
  includeEnteredInError: boolean;
  timezone: string;
}
