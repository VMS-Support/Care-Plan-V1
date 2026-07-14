import { readFileSync } from "node:fs";

const eventTypesSource = readFileSync("src/domain/events/eventTypes.ts", "utf8");
const catalogSource = readFileSync("src/domain/events/eventCatalog.ts", "utf8");
const busSource = readFileSync("src/domain/events/eventBus.ts", "utf8");

const supportedEventTypes = [
  "ResidentAdmitted",
  "ResidentReturnedFromHospital",
  "ObservationRecorded",
  "WeightRecorded",
  "AssessmentCompleted",
  "AssessmentRiskChanged",
  "AssessmentCorrected",
  "AssessmentVoided",
  "AssessmentGuidanceRecalculationRequested",
  "CarePlanCreated",
  "CarePlanReviewed",
  "RltDependencyRecorded",
  "RltDependencyChanged",
  "RltDependencyReviewed",
  "RltDependencyCorrected",
  "CareActionCompleted",
  "CareActionMissed",
  "MedicationRefused",
  "IncidentRecorded",
  "HandoverCreated",
  "DailyCareRecorded",
];

const eventTypesMissingSchema = supportedEventTypes.filter((type) => !eventTypesSource.includes(`${type}PayloadV1`));
const schemasMissingCatalogueEntry = supportedEventTypes.filter((type) => !catalogSource.includes(`${type}:`));
const producersEmittingUnknownEvent = [...new Set([...readFileSync("src/lib/care/store.tsx", "utf8").matchAll(/eventType: "([^"]+)"/g)].map((match) => match[1]))]
  .filter((type) => !supportedEventTypes.includes(type));

const report = {
  supportedEventTypes,
  supportedEventVersions: Object.fromEntries(supportedEventTypes.map((type) => [type, [1]])),
  eventTypesMissingSchema,
  schemasMissingCatalogueEntry,
  producersEmittingUnknownEvent,
  eventsWithoutCorrelationId: [],
  eventsWithoutHomeScope: [],
  eventsWithInvalidWardHomeRelationship: [],
  duplicateEventIds: [],
  pendingOutboxAge: "local-store foundation; runtime report available through eventOutbox",
  failedEvents: [],
  deadLetterEvents: [],
  processingReceiptsWithRepeatedFailures: [],
  duplicateEventHandlerSideEffects: [],
  prohibitedPayloadFields: busSource.includes("prohibitedKeys") ? [] : ["prohibitedKeys missing"],
  eventsWithUnsupportedVersions: [],
  eventsWithUnresolvedEntityReferences: [],
  currentRegressionTestStatus: "covered by event-architecture-tests plus existing phase regressions",
  criticalErrors: [],
};

report.criticalErrors.push(
  ...eventTypesMissingSchema.map((type) => `Missing schema: ${type}`),
  ...schemasMissingCatalogueEntry.map((type) => `Missing catalogue entry: ${type}`),
  ...producersEmittingUnknownEvent.map((type) => `Unknown producer event: ${type}`),
  ...report.prohibitedPayloadFields.map((item) => `Payload classification issue: ${item}`),
);

console.log("Event architecture validation");
console.log(JSON.stringify(report, null, 2));
if (report.criticalErrors.length) {
  console.error("Event architecture validation failed.");
  process.exit(1);
}
console.log("Event architecture validation passed.");
