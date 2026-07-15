import type { RltDomainId } from "@/lib/care/rlt";
import type { DailyCareDetails } from "./dailyCareDetails";
import type { DailyCareType } from "./dailyCareTypes";

const base: Record<DailyCareType, RltDomainId[]> = {
  personal_care: ["personal_cleansing_dressing"],
  dressing: ["personal_cleansing_dressing"],
  oral_care: ["personal_cleansing_dressing"],
  toileting: ["elimination"],
  continence: ["elimination"],
  repositioning: ["mobilisation"],
  food: ["eating_drinking"],
  fluids: ["eating_drinking"],
  mobility: ["mobilisation"],
  comfort: [],
  sleep: ["sleeping"],
  mood: ["communication"],
  behaviour: ["communication"],
  activity: ["meaningful_activity"],
  refusal: [],
  skin_observation: ["personal_cleansing_dressing"],
};

export function resolveDailyCareRltDomains(careType: DailyCareType, details: DailyCareDetails, sourceDomainIds: RltDomainId[] = []): RltDomainId[] {
  const mapped = new Set<RltDomainId>([...base[careType], ...sourceDomainIds]);
  if (details.type === "oral_care" && details.oralCondition?.includes("swallowing_concern")) mapped.add("eating_drinking");
  if (details.type === "continence" && details.skinCareProvided) mapped.add("personal_cleansing_dressing");
  if (details.type === "repositioning" && (details.skinObserved || details.skinConcernObserved)) mapped.add("personal_cleansing_dressing");
  if (details.type === "mobility" && details.nearFallOrSafetyConcern) mapped.add("safe_environment");
  if (details.type === "behaviour" && details.riskToSelfOrOthers) mapped.add("safe_environment");
  if (details.type === "skin_observation" && (details.skinState.includes("pressure_concern") || details.skinState.includes("broken_skin"))) mapped.add("safe_environment");
  return [...mapped];
}
