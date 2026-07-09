import type { Assessment, AssessmentType, CarePlanProblem, ProblemCategory } from "./types";

export type RltDomainId =
  | "safe_environment"
  | "communication"
  | "breathing"
  | "eating_drinking"
  | "elimination"
  | "personal_cleansing_dressing"
  | "body_temperature"
  | "mobilisation"
  | "meaningful_activity"
  | "expressing_sexuality"
  | "sleeping"
  | "dying";

export interface RltDomain {
  id: RltDomainId;
  title: string;
  shortLabel: string;
  description: string;
  examples: string[];
  relatedAssessmentTypes: AssessmentType[];
  relatedRiskTypes: string[];
  commonCareNeeds: string[];
  displayOrder: number;
}

export const RLT_DOMAINS: RltDomain[] = [
  {
    id: "safe_environment",
    title: "Maintaining a Safe Environment",
    shortLabel: "Safety",
    description: "Supporting the resident to remain safe while preserving choice, dignity and independence.",
    examples: ["Falls prevention", "bedrail review", "wandering support", "medication safety"],
    relatedAssessmentTypes: ["falls", "four_at", "abc", "abs"],
    relatedRiskTypes: ["falls", "medication_refusal", "infection", "behaviour", "wandering", "bedrail", "peep"],
    commonCareNeeds: ["Risk of falls", "Risk of harm during periods of distress", "Support required to maintain safety"],
    displayOrder: 1,
  },
  {
    id: "communication",
    title: "Communication",
    shortLabel: "Communication",
    description: "Supporting the resident to express needs, understand information and maintain relationships.",
    examples: ["cognitive support", "sensory aids", "communication preferences", "capacity support"],
    relatedAssessmentTypes: ["mmse", "four_at"],
    relatedRiskTypes: ["cognition", "communication", "sensory"],
    commonCareNeeds: ["Communication support required", "Cognitive impairment affecting understanding"],
    displayOrder: 2,
  },
  {
    id: "breathing",
    title: "Breathing",
    shortLabel: "Breathing",
    description: "Monitoring and supporting respiratory comfort and oxygenation.",
    examples: ["respiratory observations", "oxygen saturation monitoring", "smoking assessment"],
    relatedAssessmentTypes: [],
    relatedRiskTypes: ["respiratory", "smoking", "oxygen_saturation"],
    commonCareNeeds: ["Respiratory monitoring required", "Breathlessness or reduced oxygen saturation"],
    displayOrder: 3,
  },
  {
    id: "eating_drinking",
    title: "Eating and Drinking",
    shortLabel: "Nutrition",
    description: "Supporting safe eating, drinking, nutrition, hydration and weight stability.",
    examples: ["MUST", "MNA", "dysphagia support", "weight monitoring", "fluid intake"],
    relatedAssessmentTypes: ["must", "mna", "nutrition"],
    relatedRiskTypes: ["nutrition", "weight_loss", "dysphagia", "choking", "hydration"],
    commonCareNeeds: ["Risk of malnutrition", "Weight loss", "Dysphagia or choking risk", "Hydration support"],
    displayOrder: 4,
  },
  {
    id: "elimination",
    title: "Elimination",
    shortLabel: "Elimination",
    description: "Supporting bladder and bowel health, continence, comfort and dignity.",
    examples: ["continence support", "bowel monitoring", "urinary symptoms"],
    relatedAssessmentTypes: ["continence"],
    relatedRiskTypes: ["continence", "bowel", "urinary"],
    commonCareNeeds: ["Continence support required", "Bowel management support"],
    displayOrder: 5,
  },
  {
    id: "personal_cleansing_dressing",
    title: "Personal Cleansing and Dressing",
    shortLabel: "Personal Care",
    description: "Supporting personal care, skin integrity, hygiene, dressing and comfort.",
    examples: ["Waterlow", "Norton", "wound care", "skin inspection", "personal care preferences"],
    relatedAssessmentTypes: ["waterlow", "norton", "barthel", "abbey_pain", "pain_chart"],
    relatedRiskTypes: ["pressure_damage", "skin_integrity", "wound", "pain", "personal_care"],
    commonCareNeeds: ["Pressure damage risk", "Skin integrity support", "Pain affecting personal care"],
    displayOrder: 6,
  },
  {
    id: "body_temperature",
    title: "Controlling Body Temperature",
    shortLabel: "Temperature",
    description: "Monitoring signs of infection, raised temperature or clinical deterioration.",
    examples: ["temperature monitoring", "NEWS2", "infection monitoring"],
    relatedAssessmentTypes: ["pinch_me"],
    relatedRiskTypes: ["infection", "temperature", "news2", "clinical_deterioration"],
    commonCareNeeds: ["Infection monitoring required", "Temperature or NEWS2 observation"],
    displayOrder: 7,
  },
  {
    id: "mobilisation",
    title: "Mobilisation",
    shortLabel: "Mobility",
    description: "Supporting safe movement, transfers, posture, mobility and functional independence.",
    examples: ["Barthel Index", "falls assessment", "transfer support", "walking aid use"],
    relatedAssessmentTypes: ["barthel", "falls", "abbey_pain", "pain_chart"],
    relatedRiskTypes: ["falls", "mobility", "transfer", "pain"],
    commonCareNeeds: ["Reduced mobility", "Transfer support required", "Pain affecting movement"],
    displayOrder: 8,
  },
  {
    id: "meaningful_activity",
    title: "Working and Playing / Meaningful Activity",
    shortLabel: "Activity",
    description: "Supporting occupation, recreation, social connection and meaningful daily activity.",
    examples: ["social engagement", "activities", "occupation history", "wellbeing routines"],
    relatedAssessmentTypes: ["gds15", "cornell"],
    relatedRiskTypes: ["social_isolation", "low_mood", "activity", "wellbeing"],
    commonCareNeeds: ["Reduced engagement", "Support to maintain meaningful activity"],
    displayOrder: 9,
  },
  {
    id: "expressing_sexuality",
    title: "Expressing Sexuality",
    shortLabel: "Identity",
    description: "Respecting identity, relationships, privacy, presentation and personal expression.",
    examples: ["privacy", "relationships", "identity", "preferred presentation"],
    relatedAssessmentTypes: [],
    relatedRiskTypes: ["privacy", "identity", "relationship"],
    commonCareNeeds: ["Support required to maintain privacy and identity"],
    displayOrder: 10,
  },
  {
    id: "sleeping",
    title: "Sleeping",
    shortLabel: "Sleep",
    description: "Supporting rest, sleep routines, comfort and night-time wellbeing.",
    examples: ["sleep pattern", "night checks", "comfort routines"],
    relatedAssessmentTypes: [],
    relatedRiskTypes: ["sleep", "night_disturbance"],
    commonCareNeeds: ["Sleep disturbance", "Night-time support required"],
    displayOrder: 11,
  },
  {
    id: "dying",
    title: "Dying",
    shortLabel: "End of Life",
    description: "Supporting comfort, dignity, advance wishes and family communication at end of life.",
    examples: ["advance care planning", "DNAR", "palliative care", "comfort care"],
    relatedAssessmentTypes: [],
    relatedRiskTypes: ["end_of_life", "palliative", "dnar", "advance_care_plan"],
    commonCareNeeds: ["Palliative care need", "End-of-life comfort and dignity support"],
    displayOrder: 12,
  },
];

export const RLT_DOMAIN_BY_ID = RLT_DOMAINS.reduce(
  (map, domain) => ({ ...map, [domain.id]: domain }),
  {} as Record<RltDomainId, RltDomain>,
);

export const CATEGORY_TO_RLT_DOMAIN: Record<ProblemCategory, RltDomainId> = {
  pressure: "personal_cleansing_dressing",
  falls: "safe_environment",
  nutrition: "eating_drinking",
  pain: "personal_cleansing_dressing",
  behaviour: "safe_environment",
  continence: "elimination",
  mobility: "mobilisation",
  cognition: "communication",
  communication: "communication",
  personal_care: "personal_cleansing_dressing",
  mental_health: "meaningful_activity",
  social: "meaningful_activity",
  sleep: "sleeping",
  medication: "safe_environment",
  end_of_life: "dying",
  skin: "personal_cleansing_dressing",
  safeguarding: "safe_environment",
  custom: "safe_environment",
};

export const RLT_DOMAIN_TO_DEFAULT_CATEGORY: Record<RltDomainId, ProblemCategory> = {
  safe_environment: "falls",
  communication: "communication",
  breathing: "custom",
  eating_drinking: "nutrition",
  elimination: "continence",
  personal_cleansing_dressing: "personal_care",
  body_temperature: "custom",
  mobilisation: "mobility",
  meaningful_activity: "social",
  expressing_sexuality: "personal_care",
  sleeping: "sleep",
  dying: "end_of_life",
};

export const ASSESSMENT_TO_RLT_DOMAINS: Record<AssessmentType, RltDomainId[]> = {
  waterlow: ["personal_cleansing_dressing"],
  norton: ["personal_cleansing_dressing"],
  falls: ["safe_environment", "mobilisation"],
  barthel: ["mobilisation", "personal_cleansing_dressing"],
  must: ["eating_drinking"],
  mna: ["eating_drinking"],
  nutrition: ["eating_drinking"],
  abbey_pain: ["personal_cleansing_dressing", "mobilisation"],
  pain_chart: ["personal_cleansing_dressing", "mobilisation"],
  mmse: ["communication"],
  four_at: ["communication", "safe_environment"],
  continence: ["elimination"],
  pinch_me: ["body_temperature"],
  abc: ["safe_environment"],
  abs: ["safe_environment"],
  cornell: ["meaningful_activity"],
  gds15: ["meaningful_activity"],
};

const RISK_TO_RLT_DOMAIN: Record<string, RltDomainId[]> = {
  pressure_damage: ["personal_cleansing_dressing"],
  pressure: ["personal_cleansing_dressing"],
  skin_integrity: ["personal_cleansing_dressing"],
  skin: ["personal_cleansing_dressing"],
  falls: ["safe_environment", "mobilisation"],
  fall: ["safe_environment", "mobilisation"],
  nutrition: ["eating_drinking"],
  weight_loss: ["eating_drinking"],
  weight: ["eating_drinking"],
  medication_refusal: ["safe_environment"],
  medication: ["safe_environment"],
  infection: ["body_temperature"],
  behaviour: ["safe_environment"],
  wandering: ["safe_environment"],
  dysphagia: ["eating_drinking"],
  choking: ["eating_drinking"],
  respiratory: ["breathing"],
  breathing: ["breathing"],
  end_of_life: ["dying"],
  palliative: ["dying"],
  dnar: ["dying"],
  activity: ["meaningful_activity"],
  social: ["meaningful_activity"],
  sleep: ["sleeping"],
};

function normaliseRiskType(riskType: string) {
  return riskType.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function getRltDomainForAssessment(assessmentType?: AssessmentType | string): RltDomain | undefined {
  if (!assessmentType) return undefined;
  const domains = ASSESSMENT_TO_RLT_DOMAINS[assessmentType as AssessmentType];
  return domains?.[0] ? RLT_DOMAIN_BY_ID[domains[0]] : undefined;
}

export function getRltDomainsForAssessment(assessmentType?: AssessmentType | string): RltDomain[] {
  if (!assessmentType) return [];
  return (ASSESSMENT_TO_RLT_DOMAINS[assessmentType as AssessmentType] || []).map((id) => RLT_DOMAIN_BY_ID[id]);
}

export function getRltDomainForRisk(riskType?: string): RltDomain | undefined {
  if (!riskType) return undefined;
  const exact = RISK_TO_RLT_DOMAIN[normaliseRiskType(riskType)];
  if (exact?.[0]) return RLT_DOMAIN_BY_ID[exact[0]];
  const key = normaliseRiskType(riskType);
  const match = Object.entries(RISK_TO_RLT_DOMAIN).find(([riskKey]) => key.includes(riskKey));
  return match?.[1]?.[0] ? RLT_DOMAIN_BY_ID[match[1][0]] : undefined;
}

export function getRltDomainsForRisk(riskType?: string): RltDomain[] {
  if (!riskType) return [];
  const key = normaliseRiskType(riskType);
  const domains = RISK_TO_RLT_DOMAIN[key] || Object.entries(RISK_TO_RLT_DOMAIN).find(([riskKey]) => key.includes(riskKey))?.[1] || [];
  return domains.map((id) => RLT_DOMAIN_BY_ID[id]);
}

export function getRltDomainForCarePlanProblem(problem?: Partial<CarePlanProblem>): RltDomain | undefined {
  if (!problem) return undefined;
  if (problem.rltDomainId && RLT_DOMAIN_BY_ID[problem.rltDomainId]) {
    return RLT_DOMAIN_BY_ID[problem.rltDomainId];
  }
  const byAssessment = getRltDomainForAssessment(problem.sourceAssessmentType);
  if (byAssessment) return byAssessment;
  if (problem.category && CATEGORY_TO_RLT_DOMAIN[problem.category]) {
    return RLT_DOMAIN_BY_ID[CATEGORY_TO_RLT_DOMAIN[problem.category]];
  }
  return getRltDomainForRisk(problem.problemStatement || problem.customCategoryLabel || "");
}

export function getCarePlansGroupedByRltDomain(
  residentId: string,
  carePlanProblems: CarePlanProblem[],
) {
  const groups = new Map<RltDomainId, { domain: RltDomain; carePlans: CarePlanProblem[] }>();
  for (const problem of carePlanProblems) {
    if (problem.residentId !== residentId || problem.status === "archived") continue;
    const domain = getRltDomainForCarePlanProblem(problem);
    if (!domain) continue;
    const existing = groups.get(domain.id);
    if (existing) {
      existing.carePlans.push(problem);
    } else {
      groups.set(domain.id, { domain, carePlans: [problem] });
    }
  }
  return Array.from(groups.values()).sort((a, b) => a.domain.displayOrder - b.domain.displayOrder);
}

export function getResidentRltSummary(
  residentId: string,
  inputs: {
    carePlanProblems?: CarePlanProblem[];
    assessments?: Assessment[];
    riskTypes?: string[];
  },
) {
  const domainIds = new Set<RltDomainId>();
  for (const group of getCarePlansGroupedByRltDomain(residentId, inputs.carePlanProblems || [])) {
    domainIds.add(group.domain.id);
  }
  for (const assessment of inputs.assessments || []) {
    if (assessment.residentId !== residentId || assessment.status === "deleted" || assessment.status === "archived") continue;
    getRltDomainsForAssessment(assessment.type).forEach((domain) => domainIds.add(domain.id));
  }
  for (const riskType of inputs.riskTypes || []) {
    getRltDomainsForRisk(riskType).forEach((domain) => domainIds.add(domain.id));
  }
  const domains = Array.from(domainIds).map((id) => RLT_DOMAIN_BY_ID[id]).sort((a, b) => a.displayOrder - b.displayOrder);
  return {
    domains,
    activeDomainCount: domains.length,
    groupedCarePlans: getCarePlansGroupedByRltDomain(residentId, inputs.carePlanProblems || []),
  };
}
