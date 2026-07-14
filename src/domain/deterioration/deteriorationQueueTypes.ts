import type { WorkItem } from "@/domain/work";
import type { DeteriorationIssue, DeteriorationIssueStatus, DeteriorationSeverity } from "./deteriorationIssueTypes";

export interface DeteriorationQueueAuthContext {
  nursingHomeId: string;
  wardIds?: string[];
  residentIds?: string[];
  capabilities: string[];
}

export interface DeteriorationQueueFilters {
  statuses?: DeteriorationIssueStatus[];
  severities?: DeteriorationSeverity[];
  issueTypes?: string[];
  includeResolved?: boolean;
}

export interface DeteriorationQueueItem {
  issueId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  issueType: string;
  status: DeteriorationIssueStatus;
  severity: DeteriorationSeverity;
  title: string;
  conciseSummary: string;
  openedAt: string;
  latestClinicalEventAt: string;
  unacknowledged: boolean;
  overdueFollowUp: boolean;
  urgent: boolean;
  outstandingWorkCount: number;
  escalationOpen: boolean;
  nextRequiredAction?: string;
  route: string;
}

export interface DeteriorationReviewQueue {
  items: DeteriorationQueueItem[];
  sections: {
    newConcerns: DeteriorationQueueItem[];
    unacknowledged: DeteriorationQueueItem[];
    urgent: DeteriorationQueueItem[];
    overdueFollowUp: DeteriorationQueueItem[];
    unresolvedEscalation: DeteriorationQueueItem[];
    allUnresolved: DeteriorationQueueItem[];
  };
  counts: {
    total: number;
    critical: number;
    unacknowledged: number;
    overdueFollowUp: number;
    unresolvedEscalation: number;
  };
}

export interface DeteriorationQueueReferences {
  workItems?: WorkItem[];
  openEscalationIssueIds?: Set<string>;
  now: string;
}
export type DeteriorationQueueIssue = DeteriorationIssue;
