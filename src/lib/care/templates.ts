import type { CarePlanTemplate, AssessmentType } from "./types";

export const BUILT_IN_TEMPLATES: CarePlanTemplate[] = [
  {
    id: "tpl-pressure",
    category: "Pressure Area Care",
    title: "Pressure Area Care Plan",
    problemStatement: "Resident is at risk of pressure ulcer development due to reduced mobility, continence and nutritional status.",
    identifiedNeeds: ["Pressure Relief", "Skin Monitoring", "Repositioning", "Nutrition Support"],
    smartGoals: [
      { title: "Maintain skin integrity", description: "Resident will remain free from new pressure damage for 30 days, evidenced by daily skin checks.", targetDays: 30, priority: "high" },
      { title: "Repositioning compliance", description: "Achieve 90%+ compliance with 2-hourly repositioning schedule.", targetDays: 14, priority: "high" },
    ],
    interventions: [
      { name: "Reposition 2-hourly", description: "Alternating left lateral, supine, right lateral. Document on turn chart.", frequency: "2 Hourly", assignedRole: "carer", priority: "high" },
      { name: "Daily skin inspection", description: "Full skin check at personal care. Photograph any concerns.", frequency: "Daily", assignedRole: "nurse", priority: "high" },
      { name: "Pressure-relieving mattress in use", description: "Confirm mattress setting matches weight and risk.", frequency: "Per Shift", assignedRole: "nurse", priority: "medium" },
      { name: "Nutrition & hydration support", description: "Encourage fluids and protein-rich meals.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
    ],
    outcomeMeasures: [
      { name: "Waterlow Score", target: "Reduce by ≥2 at review" },
      { name: "Skin Integrity", target: "No new damage" },
    ],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true,
  },
  {
    id: "tpl-pain",
    category: "Pain Management",
    title: "Pain Management Care Plan",
    problemStatement: "Resident experiences pain that requires monitoring and structured analgesia management.",
    identifiedNeeds: ["Pain Management", "Comfort", "Monitoring"],
    smartGoals: [
      { title: "Reduce pain score", description: "Reduce Abbey Pain Scale to ≤3 within 7 days.", targetDays: 7, priority: "high" },
      { title: "Maintain comfort", description: "Resident reports/displays comfort during personal care episodes.", targetDays: 14, priority: "high" },
    ],
    interventions: [
      { name: "Administer prescribed analgesia", description: "Per MAR chart; document effect.", frequency: "4 Hourly", assignedRole: "nurse", priority: "high" },
      { name: "Reassess pain", description: "Use Abbey Pain Scale; record score & response.", frequency: "4 Hourly", assignedRole: "nurse", priority: "high" },
      { name: "Non-pharmacological comfort", description: "Repositioning, warmth, distraction, family presence.", frequency: "Per Shift", assignedRole: "carer", priority: "medium" },
      { name: "Escalate if uncontrolled", description: "Notify GP if pain remains ≥6 after two analgesic doses.", frequency: "Custom", assignedRole: "nurse", priority: "high" },
    ],
    outcomeMeasures: [
      { name: "Abbey Score", target: "≤3" },
      { name: "Pain Score (0–10)", target: "≤3" },
    ],
    reviewFrequencyDays: 5,
    evaluationFrequencyDays: 10,
    builtIn: true,
  },
  {
    id: "tpl-falls",
    category: "Falls Prevention",
    title: "Falls Prevention Care Plan",
    problemStatement: "Resident is at high risk of falls due to impaired mobility, cognition and/or medication side effects.",
    identifiedNeeds: ["Mobility Assistance", "Safety Monitoring", "Environmental Safety"],
    smartGoals: [
      { title: "Zero unwitnessed falls", description: "No unwitnessed falls within next 30 days.", targetDays: 30, priority: "critical" },
      { title: "Safe transfers", description: "All transfers performed with documented technique.", targetDays: 14, priority: "high" },
    ],
    interventions: [
      { name: "Hourly safety rounds", description: "Check on resident; offer toilet, drink, reposition.", frequency: "Hourly", assignedRole: "carer", priority: "high" },
      { name: "Sensor mat in use", description: "Confirm mat operational at start of every shift.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Footwear & environment check", description: "Non-slip footwear; clear walkways; call bell in reach.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
      { name: "Medication review", description: "Review sedating / hypotensive medications with GP.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" },
    ],
    outcomeMeasures: [
      { name: "Falls Count (30 days)", target: "0" },
      { name: "Falls Risk Score", target: "<6" },
    ],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true,
  },
  {
    id: "tpl-nutrition",
    category: "Nutrition",
    title: "Nutrition Care Plan",
    problemStatement: "Resident is at risk of malnutrition based on weight loss and reduced oral intake.",
    identifiedNeeds: ["Nutrition Support", "Weight Monitoring"],
    smartGoals: [
      { title: "Stabilise weight", description: "Maintain or gain weight over next 4 weeks.", targetDays: 28, priority: "high" },
      { title: "Adequate intake", description: "Achieve ≥75% meal intake on 5 of 7 days.", targetDays: 14, priority: "high" },
    ],
    interventions: [
      { name: "Fortified diet", description: "Offer fortified meals + snacks; respect preferences.", frequency: "Daily", assignedRole: "carer", priority: "high" },
      { name: "Food & fluid chart", description: "Record every meal, snack and fluid intake.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Weekly weight", description: "Weigh same time, same scales, document.", frequency: "Weekly", assignedRole: "nurse", priority: "medium" },
      { name: "Dietitian referral", description: "Refer if MUST ≥2 or weight loss continues.", frequency: "Custom", assignedRole: "nurse", priority: "high" },
    ],
    outcomeMeasures: [
      { name: "Weight (kg)", target: "Stable or +" },
      { name: "MUST Score", target: "≤1" },
      { name: "BMI", target: "≥20" },
    ],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true,
  },
  {
    id: "tpl-hydration",
    category: "Hydration",
    title: "Hydration Care Plan",
    problemStatement: "Resident at risk of dehydration due to reduced oral fluid intake.",
    identifiedNeeds: ["Hydration Support", "Monitoring"],
    smartGoals: [
      { title: "Adequate fluids", description: "Achieve ≥1.5L oral intake daily for 7 consecutive days.", targetDays: 7, priority: "high" },
    ],
    interventions: [
      { name: "Offer fluids hourly", description: "Preferred drinks at reach; assist as needed.", frequency: "Hourly", assignedRole: "carer", priority: "high" },
      { name: "Fluid balance chart", description: "Document intake & output.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
    ],
    outcomeMeasures: [{ name: "Daily fluid intake (ml)", target: "≥1500" }],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true,
  },
  {
    id: "tpl-continence",
    category: "Continence",
    title: "Continence Care Plan",
    problemStatement: "Resident requires structured continence support to maintain dignity and skin integrity.",
    identifiedNeeds: ["Continence Support", "Skin Monitoring", "Toileting"],
    smartGoals: [
      { title: "Reduce episodes", description: "Reduce incontinence episodes by 50% within 4 weeks.", targetDays: 28, priority: "medium" },
      { title: "Skin intact", description: "Maintain intact perineal skin.", targetDays: 30, priority: "high" },
    ],
    interventions: [
      { name: "Scheduled toileting", description: "Offer toilet every 2 hours and after meals.", frequency: "2 Hourly", assignedRole: "carer", priority: "high" },
      { name: "Barrier cream", description: "Apply at every pad change.", frequency: "Per Shift", assignedRole: "carer", priority: "medium" },
      { name: "Continence product fit check", description: "Confirm correct product & size weekly.", frequency: "Weekly", assignedRole: "nurse", priority: "medium" },
    ],
    outcomeMeasures: [
      { name: "Continence Episodes/day", target: "≤2" },
      { name: "Skin Integrity", target: "Intact" },
    ],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true,
  },
  {
    id: "tpl-behaviour",
    category: "Behaviour Support",
    title: "Behaviour Support Plan",
    problemStatement: "Resident displays behaviours of distress that require structured, person-centred support.",
    identifiedNeeds: ["Behaviour Support", "Communication Support", "Safety Monitoring"],
    smartGoals: [
      { title: "Reduce distress episodes", description: "Reduce severe ABS episodes by 50% within 4 weeks.", targetDays: 28, priority: "high" },
    ],
    interventions: [
      { name: "Identify triggers", description: "Use ABC chart for every episode.", frequency: "Custom", assignedRole: "carer", priority: "high" },
      { name: "Person-centred distraction", description: "Use 'A Key To Me' preferred items / music / reminiscence.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "MDT review", description: "Discuss at next MDT; consider psychiatry referral.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" },
    ],
    outcomeMeasures: [
      { name: "ABS Score", target: "<22" },
      { name: "Behaviour Frequency", target: "↓" },
    ],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true,
  },
  {
    id: "tpl-mental-health",
    category: "Mental Health",
    title: "Mental Health Support Plan",
    problemStatement: "Resident shows symptoms of low mood / depression requiring monitoring and support.",
    identifiedNeeds: ["Mental Health", "Social Engagement"],
    smartGoals: [
      { title: "Improve mood", description: "GDS-15 reduced by ≥3 points over 4 weeks.", targetDays: 28, priority: "medium" },
    ],
    interventions: [
      { name: "1:1 supportive conversation", description: "Daily check-in by named carer.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
      { name: "Activity participation", description: "Encourage 2+ meaningful activities per week.", frequency: "Weekly", assignedRole: "carer", priority: "medium" },
      { name: "GP review", description: "If GDS-15 ≥9 escalate to GP.", frequency: "Custom", assignedRole: "nurse", priority: "high" },
    ],
    outcomeMeasures: [{ name: "GDS-15 Score", target: "<5" }],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true,
  },
  {
    id: "tpl-dementia",
    category: "Dementia Care",
    title: "Dementia Care Plan",
    problemStatement: "Resident has cognitive impairment requiring person-centred dementia care.",
    identifiedNeeds: ["Cognitive Support", "Communication Support", "Safety Monitoring"],
    smartGoals: [
      { title: "Maintain orientation", description: "Use reality orientation cues; resident calm at handovers.", targetDays: 28, priority: "medium" },
    ],
    interventions: [
      { name: "Consistent staff allocation", description: "Named carer leads personal care where possible.", frequency: "Daily", assignedRole: "carer", priority: "high" },
      { name: "Reminiscence & sensory activities", description: "Use 'A Key To Me' preferences.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
      { name: "Cognitive reassessment", description: "Repeat MMSE / 4AT at review.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" },
    ],
    outcomeMeasures: [{ name: "MMSE Score", target: "Stable" }, { name: "4AT", target: "<4" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true,
  },
  {
    id: "tpl-communication",
    category: "Communication",
    title: "Communication Support Plan",
    problemStatement: "Resident has communication needs that require structured support to maintain dignity and choice.",
    identifiedNeeds: ["Communication Support"],
    smartGoals: [{ title: "Effective communication", description: "Resident expresses needs/choices at every personal care episode.", targetDays: 14, priority: "medium" }],
    interventions: [
      { name: "Use preferred communication method", description: "Hearing aid in/checked; large print; pictures.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Speak slowly, offer choices", description: "Allow processing time.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
    ],
    outcomeMeasures: [{ name: "Communication effectiveness", target: "Resident responds appropriately" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true,
  },
  {
    id: "tpl-mobility",
    category: "Mobility",
    title: "Mobility Care Plan",
    problemStatement: "Resident requires structured mobility support to maintain function and prevent deterioration.",
    identifiedNeeds: ["Mobility Assistance", "Falls Prevention"],
    smartGoals: [{ title: "Maintain mobility", description: "Resident continues current level of mobility for 4 weeks.", targetDays: 28, priority: "medium" }],
    interventions: [
      { name: "Walking practice", description: "Walk to dining room with 1 assist twice daily.", frequency: "Twice Daily", assignedRole: "carer", priority: "medium" },
      { name: "Physiotherapy programme", description: "Per physio recommendations.", frequency: "Weekly", assignedRole: "nurse", priority: "medium" },
    ],
    outcomeMeasures: [{ name: "Barthel Score", target: "Stable or +" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true,
  },
  {
    id: "tpl-transfer",
    category: "Transfer Assistance",
    title: "Safe Transfer Plan",
    problemStatement: "Resident requires assistance with transfers; safe technique required to prevent injury.",
    identifiedNeeds: ["Transfer Assistance", "Safety Monitoring"],
    smartGoals: [{ title: "Safe transfers", description: "All transfers performed with hoist/2-assist as prescribed.", targetDays: 14, priority: "high" }],
    interventions: [
      { name: "2-assist transfers with hoist", description: "Full sling check before each use.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Manual handling review", description: "Reassess if condition changes.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" },
    ],
    outcomeMeasures: [{ name: "Transfer incidents", target: "0" }],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true,
  },
  {
    id: "tpl-wheelchair",
    category: "Wheelchair Safety",
    title: "Wheelchair Safety Plan",
    problemStatement: "Resident uses a wheelchair and requires safety assessment to prevent injury and pressure damage.",
    identifiedNeeds: ["Wheelchair Safety", "Pressure Relief"],
    smartGoals: [{ title: "Safe wheelchair use", description: "No wheelchair-related incidents over 4 weeks.", targetDays: 28, priority: "high" }],
    interventions: [
      { name: "Cushion in use & in date", description: "Check pressure-relief cushion at start of every shift.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Brake & footplate check", description: "Confirm before every transfer.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
    ],
    outcomeMeasures: [{ name: "Wheelchair incidents", target: "0" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true,
  },
  {
    id: "tpl-bedrail",
    category: "Bed Rail Safety",
    title: "Bed Rail Safety Plan",
    problemStatement: "Bed rails in use; risk/benefit assessment required to ensure safe usage.",
    identifiedNeeds: ["Bed Rail Safety", "Safety Monitoring"],
    smartGoals: [{ title: "Safe rail usage", description: "Bed rails reviewed weekly; no entrapment incidents.", targetDays: 28, priority: "high" }],
    interventions: [
      { name: "Visual rail check", description: "Confirm bumpers in place; gaps within tolerance.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Documented consent / best-interest", description: "Reaffirm at every review.", frequency: "Monthly", assignedRole: "nurse", priority: "high" },
    ],
    outcomeMeasures: [{ name: "Entrapment incidents", target: "0" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true,
  },
  {
    id: "tpl-peep",
    category: "PEEP",
    title: "Personal Emergency Evacuation Plan",
    problemStatement: "Resident requires individual evacuation plan in event of fire/emergency.",
    identifiedNeeds: ["Safety Monitoring"],
    smartGoals: [{ title: "Plan readiness", description: "PEEP rehearsed and known to all staff on shift.", targetDays: 14, priority: "critical" }],
    interventions: [
      { name: "Display PEEP at handover", description: "Refer to PEEP poster at every shift start.", frequency: "Per Shift", assignedRole: "nurse", priority: "high" },
      { name: "Annual rehearsal", description: "Practice evacuation route with resident.", frequency: "Custom", assignedRole: "cnm", priority: "high" },
    ],
    outcomeMeasures: [{ name: "Drill completion", target: "Annual" }],
    reviewFrequencyDays: 90,
    evaluationFrequencyDays: 180,
    builtIn: true,
  },
  {
    id: "tpl-eol",
    category: "End Of Life",
    title: "End of Life Care Plan",
    problemStatement: "Resident is in the last days/weeks of life; comfort and dignity are the priority.",
    identifiedNeeds: ["Pain Management", "Comfort", "Family Communication", "Spiritual Support"],
    smartGoals: [
      { title: "Comfortable, dignified death", description: "Resident remains comfortable; family well-supported.", targetDays: 30, priority: "critical" },
    ],
    interventions: [
      { name: "Anticipatory medications available", description: "Confirm in MAR & stock; review daily.", frequency: "Daily", assignedRole: "nurse", priority: "critical" },
      { name: "Mouth & pressure care", description: "2-hourly mouth care; gentle repositioning.", frequency: "2 Hourly", assignedRole: "carer", priority: "high" },
      { name: "Family present & supported", description: "Open visiting; offer chaplain & refreshments.", frequency: "Daily", assignedRole: "carer", priority: "high" },
    ],
    outcomeMeasures: [{ name: "Comfort", target: "Resident appears comfortable" }],
    reviewFrequencyDays: 1,
    evaluationFrequencyDays: 3,
    builtIn: true,
  },
  {
    id: "tpl-post-fall",
    category: "Post Fall Monitoring",
    title: "Post-Fall Monitoring Plan",
    problemStatement: "Resident has recently fallen; structured monitoring required to detect deterioration.",
    identifiedNeeds: ["Safety Monitoring", "Neurological Observation"],
    smartGoals: [{ title: "Detect deterioration early", description: "Neuro obs completed per schedule; any change escalated immediately.", targetDays: 3, priority: "high" }],
    interventions: [
      { name: "Neurological observations", description: "GCS / pupils / limb power.", frequency: "Hourly", assignedRole: "nurse", priority: "high" },
      { name: "Pain & mobility review", description: "Assess for occult injury at every shift.", frequency: "Per Shift", assignedRole: "nurse", priority: "high" },
    ],
    outcomeMeasures: [{ name: "GCS", target: "Stable" }],
    reviewFrequencyDays: 3,
    evaluationFrequencyDays: 7,
    builtIn: true,
  },
  {
    id: "tpl-skin",
    category: "Skin Integrity",
    title: "Skin Integrity Care Plan",
    problemStatement: "Resident has compromised skin integrity requiring active wound and skin management.",
    identifiedNeeds: ["Skin Monitoring", "Wound Care"],
    smartGoals: [{ title: "Heal / prevent progression", description: "Wound shows healing trend at weekly review.", targetDays: 28, priority: "high" }],
    interventions: [
      { name: "Wound dressing per regime", description: "As per TVN/dressing plan; photograph weekly.", frequency: "Custom", assignedRole: "nurse", priority: "high" },
      { name: "Skin inspection", description: "Daily inspection; document.", frequency: "Daily", assignedRole: "nurse", priority: "high" },
    ],
    outcomeMeasures: [{ name: "Wound size (cm)", target: "↓" }, { name: "Tissue type", target: "Granulating" }],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true,
  },
];

// Map an assessment type + risk to recommended template IDs
export function suggestTemplatesFor(type: AssessmentType, riskLevel: string): string[] {
  const highRisk = riskLevel === "high" || riskLevel === "very_high";
  const moderatePlus = highRisk || riskLevel === "moderate";
  switch (type) {
    case "waterlow":
    case "norton":
      return highRisk ? ["tpl-pressure", "tpl-skin"] : moderatePlus ? ["tpl-pressure"] : [];
    case "abbey_pain":
    case "pain_chart":
      return moderatePlus ? ["tpl-pain"] : [];
    case "must":
    case "mna":
    case "nutrition":
      return highRisk ? ["tpl-nutrition", "tpl-hydration"] : moderatePlus ? ["tpl-nutrition"] : [];
    case "falls":
      return highRisk ? ["tpl-falls", "tpl-post-fall"] : moderatePlus ? ["tpl-falls"] : [];
    case "mmse":
    case "four_at":
      return moderatePlus ? ["tpl-dementia", "tpl-communication"] : [];
    case "continence":
      return moderatePlus ? ["tpl-continence", "tpl-skin"] : [];
    case "abs":
    case "abc":
      return moderatePlus ? ["tpl-behaviour"] : [];
    case "gds15":
    case "cornell":
      return moderatePlus ? ["tpl-mental-health"] : [];
    case "barthel":
      return highRisk ? ["tpl-mobility", "tpl-transfer"] : [];
    default:
      return [];
  }
}
