import type { ShiftDefinition } from "@/lib/care/types";
import type {
  NursingHomeId,
  OccurrenceId,
  RecurrenceRuleId,
  ResidentId,
  ShiftId,
  WardId,
} from "@/types/entityIds";

export type RecurrenceType =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom_interval"
  | "selected_days"
  | "each_shift"
  | "prn"
  | "triggered"
  | "one_off";

export interface RecurrenceRule {
  id: RecurrenceRuleId | string;
  recurrenceType: RecurrenceType;
  active: boolean;
  nursingHomeId: NursingHomeId | string;
  sourceEntityId: string;
  residentId?: ResidentId | string;
  wardId?: WardId | string;
  bedsideCare?: boolean;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  interval?: number;
  selectedDays?: number[];
  monthlyDay?: number;
  monthlyWeekday?: number;
  monthlyWeekOrdinal?: 1 | 2 | 3 | 4 | "last";
  shiftIds?: (ShiftId | string)[];
  customMinutes?: number;
  customHours?: number;
  customDays?: number;
  prnReasonRequired?: boolean;
  triggerEventTypes?: string[];
  generatedHorizonDays?: number;
  maxOccurrences?: number;
  createdByRuleId?: string;
  createdByRuleVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOccurrence {
  id: OccurrenceId | string;
  recurrenceRuleId?: RecurrenceRuleId | string;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  wardId?: WardId | string;
  sourceEntityId: string;
  dueAt: string;
  effectiveDueAt: string;
  occurrenceNumber: number;
  generatedAt: string;
  cancelled: boolean;
  cancellationReason?: string;
  suspended: boolean;
  suspensionReason?: string;
  completed: boolean;
  completedAt?: string;
  triggerEventId?: string;
  triggerId?: string;
  triggerReason?: string;
  shiftId?: ShiftId | string;
  operationalDate?: string;
  timezone: string;
}

export interface GenerateOccurrencesInput {
  rule: RecurrenceRule;
  windowStart: string;
  windowEnd?: string;
  generatedAt?: string;
  shifts?: ShiftDefinition[];
  existingOccurrences?: WorkOccurrence[];
}

export type ResidentSchedulingState =
  | { lifecycleStatus: "active"; presenceStatus: "in_home" }
  | { lifecycleStatus: "active"; presenceStatus: "in_hospital" | "temporarily_absent" }
  | { lifecycleStatus: "discharged" | "deceased" | "inactive"; presenceStatus?: string };
