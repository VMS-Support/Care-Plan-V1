import type { AssessmentType } from "./types";

type Result = {
  totalScore: number;
  interpretation: string;
  riskLevel: "low" | "moderate" | "high" | "very_high" | "none";
};

// Generic uniform scorer for items with options [value,label]
function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

// Barthel ----------------------------------------------------------
export const barthelItems = [
  { key: "feeding", label: "Feeding", options: [[0, "Unable"], [5, "Needs help"], [10, "Independent"]] },
  { key: "bathing", label: "Bathing", options: [[0, "Dependent"], [5, "Independent"]] },
  { key: "grooming", label: "Grooming", options: [[0, "Needs help"], [5, "Independent"]] },
  { key: "dressing", label: "Dressing", options: [[0, "Dependent"], [5, "Needs help"], [10, "Independent"]] },
  { key: "bowels", label: "Bowels", options: [[0, "Incontinent"], [5, "Occasional accident"], [10, "Continent"]] },
  { key: "bladder", label: "Bladder", options: [[0, "Incontinent"], [5, "Occasional"], [10, "Continent"]] },
  { key: "toilet", label: "Toilet Use", options: [[0, "Dependent"], [5, "Needs help"], [10, "Independent"]] },
  { key: "transfers", label: "Transfers", options: [[0, "Unable"], [5, "Major help"], [10, "Minor help"], [15, "Independent"]] },
  { key: "mobility", label: "Mobility", options: [[0, "Immobile"], [5, "Wheelchair"], [10, "Walks with help"], [15, "Independent"]] },
  { key: "stairs", label: "Stairs", options: [[0, "Unable"], [5, "Needs help"], [10, "Independent"]] },
] as const;

export function scoreBarthel(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Independent";
  let riskLevel: Result["riskLevel"] = "low";
  if (total <= 4) { interpretation = "Total Dependency"; riskLevel = "very_high"; }
  else if (total <= 8) { interpretation = "Severe Dependency"; riskLevel = "high"; }
  else if (total <= 11) { interpretation = "Moderate Dependency"; riskLevel = "moderate"; }
  else if (total <= 19) { interpretation = "Mild Dependency"; riskLevel = "low"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Waterlow ---------------------------------------------------------
export const waterlowItems = [
  { key: "build", label: "Build / Weight for Height", options: [[0, "Average"], [1, "Above average"], [2, "Obese"], [3, "Below average"]] },
  { key: "skin", label: "Skin Type", options: [[0, "Healthy"], [1, "Tissue paper / dry"], [2, "Oedematous / clammy"], [3, "Discoloured / broken"]] },
  { key: "age", label: "Age", options: [[1, "14-49"], [2, "50-64"], [3, "65-74"], [4, "75-80"], [5, "81+"]] },
  { key: "sex", label: "Sex", options: [[1, "Male"], [2, "Female"]] },
  { key: "continence", label: "Continence", options: [[0, "Complete / catheterised"], [1, "Occasional incontinence"], [2, "Cath / incontinent faeces"], [3, "Doubly incontinent"]] },
  { key: "mobility", label: "Mobility", options: [[0, "Fully mobile"], [1, "Restless / fidgety"], [2, "Apathetic"], [3, "Restricted"], [4, "Bedbound / chairbound"], [5, "Inert / traction"]] },
  { key: "nutrition", label: "Nutrition / Appetite", options: [[0, "Average"], [1, "Poor"], [2, "NG tube / fluids only"], [3, "NBM / anorexic"]] },
  { key: "neuro", label: "Neurological Deficit", options: [[0, "None"], [4, "Diabetes / MS / CVA"], [5, "Motor / sensory"], [6, "Paraplegia"]] },
  { key: "specialRisk", label: "Special Risks (tissue malnutrition)", options: [[0, "None"], [5, "Smoking"], [8, "Cardiac failure / anaemia"], [8, "Terminal cachexia"]] },
  { key: "medication", label: "Medication", options: [[0, "None"], [4, "Steroids / cytotoxics / anti-inflammatory"]] },
] as const;

export function scoreWaterlow(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Low Risk";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 20) { interpretation = "Very High Risk"; riskLevel = "very_high"; }
  else if (total >= 15) { interpretation = "High Risk"; riskLevel = "high"; }
  else if (total >= 10) { interpretation = "At Risk"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Abbey ------------------------------------------------------------
export const abbeyItems = [
  { key: "vocalisation", label: "Vocalisation (whimpering, groaning, crying)" },
  { key: "facial", label: "Facial Expression (tense, frowning, grimacing)" },
  { key: "bodyLanguage", label: "Body Language (fidgeting, rocking, guarding)" },
  { key: "behavioural", label: "Behavioural Change (confusion, refusing food)" },
  { key: "physiological", label: "Physiological Change (temp, pulse, BP)" },
  { key: "physical", label: "Physical Change (skin tears, contractures)" },
] as const;
export const abbeyScale = [[0, "Absent"], [1, "Mild"], [2, "Moderate"], [3, "Severe"]] as const;

export function scoreAbbey(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "No Pain";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 14) { interpretation = "Severe Pain"; riskLevel = "very_high"; }
  else if (total >= 8) { interpretation = "Moderate Pain"; riskLevel = "high"; }
  else if (total >= 3) { interpretation = "Mild Pain"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// MNA --------------------------------------------------------------
export const mnaItems = [
  { key: "foodIntake", label: "Food intake decline (3 months)", options: [[0, "Severe"], [1, "Moderate"], [2, "No decline"]] },
  { key: "weightLoss", label: "Weight loss (3 months)", options: [[0, ">3 kg"], [1, "Unknown"], [2, "1–3 kg"], [3, "No loss"]] },
  { key: "mobility", label: "Mobility", options: [[0, "Bed/chair bound"], [1, "Out of bed but no outings"], [2, "Goes out"]] },
  { key: "stress", label: "Psychological stress / acute disease", options: [[0, "Yes"], [2, "No"]] },
  { key: "neuro", label: "Neuropsychological problems", options: [[0, "Severe dementia/depression"], [1, "Mild dementia"], [2, "None"]] },
  { key: "bmi", label: "BMI", options: [[0, "<19"], [1, "19–<21"], [2, "21–<23"], [3, "≥23"]] },
] as const;

export function scoreMNA(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Normal nutritional status";
  let riskLevel: Result["riskLevel"] = "low";
  if (total < 17) { interpretation = "Malnourished"; riskLevel = "very_high"; }
  else if (total <= 23.5) { interpretation = "At risk of malnutrition"; riskLevel = "high"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Norton -----------------------------------------------------------
export const nortonItems = [
  { key: "physical", label: "Physical Condition", options: [[1, "Very bad"], [2, "Poor"], [3, "Fair"], [4, "Good"]] },
  { key: "mental", label: "Mental State", options: [[1, "Stuporous"], [2, "Confused"], [3, "Apathetic"], [4, "Alert"]] },
  { key: "activity", label: "Activity", options: [[1, "Bedfast"], [2, "Chairfast"], [3, "Walks with help"], [4, "Ambulant"]] },
  { key: "mobility", label: "Mobility", options: [[1, "Immobile"], [2, "Very limited"], [3, "Slightly limited"], [4, "Full"]] },
  { key: "incontinence", label: "Incontinence", options: [[1, "Doubly incontinent"], [2, "Usually urinary"], [3, "Occasional"], [4, "Continent"]] },
] as const;

export function scoreNorton(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Low risk";
  let riskLevel: Result["riskLevel"] = "low";
  if (total <= 12) { interpretation = "Very high risk"; riskLevel = "very_high"; }
  else if (total <= 14) { interpretation = "High risk"; riskLevel = "high"; }
  else if (total <= 17) { interpretation = "Medium risk"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Nutrition Care Plan ---------------------------------------------
export const nutritionItems = [
  { key: "weightTrend", label: "Weight trend (3 months)", options: [[0, "Stable / gaining"], [1, "Minor loss"], [2, "Moderate loss"], [3, "Significant loss"]] },
  { key: "bmi", label: "BMI", options: [[0, "≥23"], [1, "21–<23"], [2, "19–<21"], [3, "<19"]] },
  { key: "diet", label: "Diet texture", options: [[0, "Normal"], [1, "Soft"], [2, "Pureed"], [3, "NBM"]] },
  { key: "fluidIntake", label: "Fluid intake", options: [[0, "Adequate"], [1, "Moderate"], [2, "Poor"], [3, "Very poor"]] },
  { key: "swallowing", label: "Swallowing", options: [[0, "No difficulty"], [1, "Mild"], [2, "Moderate"], [3, "Severe / SLT"]] },
  { key: "preferences", label: "Food preferences honoured", options: [[0, "Yes"], [1, "Partially"], [2, "No"]] },
] as const;

export function scoreNutrition(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Adequate nutrition";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 12) { interpretation = "Critical — dietitian referral"; riskLevel = "very_high"; }
  else if (total >= 8) { interpretation = "High nutritional risk"; riskLevel = "high"; }
  else if (total >= 4) { interpretation = "Moderate nutritional risk"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// PINCH ME ---------------------------------------------------------
export const pinchMeItems = [
  { key: "pain", label: "Pain" },
  { key: "infection", label: "Infection" },
  { key: "nutrition", label: "Nutrition" },
  { key: "constipation", label: "Constipation" },
  { key: "hydration", label: "Hydration" },
  { key: "medication", label: "Medication" },
  { key: "environment", label: "Environment" },
] as const;
export const pinchMeScale = [[0, "No concern"], [1, "Possible"], [2, "Likely"], [3, "Confirmed"]] as const;

export function scorePinchMe(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Stable";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 12) { interpretation = "Acute deterioration — escalate"; riskLevel = "very_high"; }
  else if (total >= 7) { interpretation = "Significant concerns"; riskLevel = "high"; }
  else if (total >= 3) { interpretation = "Monitor closely"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// MMSE -------------------------------------------------------------
export const mmseItems = [
  { key: "orientationTime", label: "Orientation to Time (year, season, date, day, month)", options: [[0, "0/5"], [1, "1/5"], [2, "2/5"], [3, "3/5"], [4, "4/5"], [5, "5/5"]] },
  { key: "orientationPlace", label: "Orientation to Place (country, county, town, building, floor)", options: [[0, "0/5"], [1, "1/5"], [2, "2/5"], [3, "3/5"], [4, "4/5"], [5, "5/5"]] },
  { key: "registration", label: "Registration (3 objects)", options: [[0, "0/3"], [1, "1/3"], [2, "2/3"], [3, "3/3"]] },
  { key: "attention", label: "Attention/Calculation (serial 7s or WORLD backwards)", options: [[0, "0/5"], [1, "1/5"], [2, "2/5"], [3, "3/5"], [4, "4/5"], [5, "5/5"]] },
  { key: "recall", label: "Recall (3 objects)", options: [[0, "0/3"], [1, "1/3"], [2, "2/3"], [3, "3/3"]] },
  { key: "naming", label: "Naming (pen, watch)", options: [[0, "0/2"], [1, "1/2"], [2, "2/2"]] },
  { key: "repetition", label: "Repetition (no ifs, ands, or buts)", options: [[0, "Unable"], [1, "Correct"]] },
  { key: "command", label: "3-stage command", options: [[0, "0/3"], [1, "1/3"], [2, "2/3"], [3, "3/3"]] },
  { key: "reading", label: "Reading & follow (close your eyes)", options: [[0, "Unable"], [1, "Correct"]] },
  { key: "writing", label: "Writing a sentence", options: [[0, "Unable"], [1, "Correct"]] },
  { key: "copying", label: "Copying design (intersecting pentagons)", options: [[0, "Unable"], [1, "Correct"]] },
] as const;

export function scoreMMSE(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Normal cognitive function";
  let riskLevel: Result["riskLevel"] = "low";
  if (total <= 9) { interpretation = "Severe cognitive impairment"; riskLevel = "very_high"; }
  else if (total <= 17) { interpretation = "Moderate cognitive impairment"; riskLevel = "high"; }
  else if (total <= 23) { interpretation = "Mild cognitive impairment"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// 4AT --------------------------------------------------------------
export const fourATItems = [
  { key: "alertness", label: "Alertness", options: [[0, "Normal"], [4, "Abnormal (drowsy/agitated)"]] },
  { key: "amt4", label: "AMT4 (age, DOB, place, year)", options: [[0, "No mistakes"], [1, "1 mistake"], [2, "2+ mistakes / untestable"]] },
  { key: "attention", label: "Attention (months backwards from December)", options: [[0, "≥7 correct"], [1, "<7 / refuses"], [2, "Untestable"]] },
  { key: "acuteChange", label: "Acute change or fluctuating course", options: [[0, "No"], [4, "Yes"]] },
] as const;

export function scoreFourAT(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Delirium unlikely";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 4) { interpretation = "Possible delirium ± cognitive impairment — urgent review"; riskLevel = "very_high"; }
  else if (total >= 1) { interpretation = "Possible cognitive impairment"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// GDS-15 -----------------------------------------------------------
export const gds15Items = [
  { key: "q1", label: "Are you basically satisfied with your life?", inverted: true },
  { key: "q2", label: "Have you dropped many of your activities & interests?" },
  { key: "q3", label: "Do you feel your life is empty?" },
  { key: "q4", label: "Do you often get bored?" },
  { key: "q5", label: "Are you in good spirits most of the time?", inverted: true },
  { key: "q6", label: "Are you afraid something bad will happen to you?" },
  { key: "q7", label: "Do you feel happy most of the time?", inverted: true },
  { key: "q8", label: "Do you often feel helpless?" },
  { key: "q9", label: "Do you prefer to stay in rather than going out?" },
  { key: "q10", label: "Do you feel you have more memory problems than most?" },
  { key: "q11", label: "Do you think it's wonderful to be alive now?", inverted: true },
  { key: "q12", label: "Do you feel worthless the way you are now?" },
  { key: "q13", label: "Do you feel full of energy?", inverted: true },
  { key: "q14", label: "Do you feel your situation is hopeless?" },
  { key: "q15", label: "Do you think most people are better off than you?" },
] as const;

export function scoreGDS15(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Normal";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 12) { interpretation = "Severe depression"; riskLevel = "very_high"; }
  else if (total >= 9) { interpretation = "Moderate depression"; riskLevel = "high"; }
  else if (total >= 5) { interpretation = "Mild depression"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Cornell Scale ----------------------------------------------------
export const cornellItems = [
  { key: "anxiety", label: "Anxiety (anxious expression, worrying)" },
  { key: "sadness", label: "Sadness (sad expression, tearfulness)" },
  { key: "lackReactivity", label: "Lack of reactivity to pleasant events" },
  { key: "irritability", label: "Irritability" },
  { key: "agitation", label: "Agitation (restlessness, hand-wringing)" },
  { key: "retardation", label: "Retardation (slow movement, speech, reaction)" },
  { key: "physicalComplaints", label: "Multiple physical complaints" },
  { key: "lossInterest", label: "Loss of interest in usual activities" },
  { key: "appetiteLoss", label: "Appetite loss" },
  { key: "weightLoss", label: "Weight loss" },
  { key: "lackEnergy", label: "Lack of energy" },
  { key: "diurnal", label: "Diurnal variation (worse in morning)" },
  { key: "earlyWaking", label: "Early-morning waking" },
  { key: "multipleAwakenings", label: "Multiple awakenings during sleep" },
  { key: "suicidal", label: "Suicidal ideation" },
  { key: "lowSelfEsteem", label: "Poor self-esteem" },
  { key: "pessimism", label: "Pessimism" },
  { key: "moodDelusions", label: "Mood-congruent delusions" },
] as const;
export const cornellScale = [[0, "Absent"], [1, "Mild/intermittent"], [2, "Severe"]] as const;

export function scoreCornell(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "No depression";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 13) { interpretation = "Definite depression"; riskLevel = "very_high"; }
  else if (total >= 8) { interpretation = "Probable depression"; riskLevel = "high"; }
  return { totalScore: total, interpretation, riskLevel };
}

// MUST -------------------------------------------------------------
export const mustItems = [
  { key: "bmi", label: "BMI score", options: [[0, ">20"], [1, "18.5–20"], [2, "<18.5"]] },
  { key: "weightLoss", label: "Unplanned weight loss in past 3–6 months", options: [[0, "<5%"], [1, "5–10%"], [2, ">10%"]] },
  { key: "acuteDisease", label: "Acutely ill & no nutritional intake >5 days", options: [[0, "No"], [2, "Yes"]] },
] as const;

export function scoreMUST(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Low risk";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 2) { interpretation = "High risk — refer dietitian"; riskLevel = "high"; }
  else if (total === 1) { interpretation = "Medium risk — observe & document intake"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Continence Assessment -------------------------------------------
export const continenceItems = [
  { key: "urinary", label: "Urinary continence", options: [[0, "Continent"], [1, "Occasional"], [2, "Frequent"], [3, "Total"]] },
  { key: "bowel", label: "Bowel continence", options: [[0, "Continent"], [1, "Occasional"], [2, "Frequent"], [3, "Total"]] },
  { key: "frequency", label: "Frequency of episodes", options: [[0, "Rare"], [1, "Weekly"], [2, "Daily"], [3, "Multiple daily"]] },
  { key: "nocturia", label: "Nocturia", options: [[0, "None"], [1, "1x"], [2, "2x"], [3, "3+ per night"]] },
  { key: "skin", label: "Perineal skin condition", options: [[0, "Intact"], [1, "Reddened"], [2, "Excoriated"], [3, "Broken"]] },
  { key: "mobility", label: "Mobility impact on toileting", options: [[0, "Independent"], [1, "Supervised"], [2, "Assisted"], [3, "Dependent"]] },
  { key: "cognition", label: "Cognitive impact on toileting", options: [[0, "Intact"], [1, "Mild"], [2, "Moderate"], [3, "Severe"]] },
] as const;

export function scoreContinence(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Continent / low risk";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 16) { interpretation = "Complex continence needs"; riskLevel = "very_high"; }
  else if (total >= 10) { interpretation = "High continence risk"; riskLevel = "high"; }
  else if (total >= 5) { interpretation = "Moderate continence risk"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Pain Chart (0–10) -----------------------------------------------
export const painChartItems = [
  { key: "severity", label: "Pain severity (0–10)", options: Array.from({ length: 11 }, (_, i) => [i, String(i)]) },
  { key: "frequency", label: "Frequency", options: [[0, "Never"], [1, "Occasional"], [2, "Frequent"], [3, "Constant"]] },
  { key: "effectiveness", label: "Pain relief effectiveness", options: [[0, "Full relief"], [1, "Partial"], [2, "Minimal"], [3, "No relief"]] },
] as const;

export function scorePainChart(s: Record<string, number>): Result {
  const sev = s.severity || 0;
  const total = sev + (s.frequency || 0) + (s.effectiveness || 0);
  let interpretation = "Pain controlled";
  let riskLevel: Result["riskLevel"] = "low";
  if (sev >= 7 || total >= 10) { interpretation = "Severe pain — escalate"; riskLevel = "very_high"; }
  else if (sev >= 4 || total >= 6) { interpretation = "Moderate pain"; riskLevel = "high"; }
  else if (sev >= 1) { interpretation = "Mild pain"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Falls Assessment -------------------------------------------------
export const fallsItems = [
  { key: "history", label: "Previous fall in last 12 months", options: [[0, "No"], [3, "Yes"]] },
  { key: "medication", label: "Sedatives / antihypertensives / 4+ meds", options: [[0, "No"], [2, "Yes"]] },
  { key: "vision", label: "Visual impairment", options: [[0, "None"], [2, "Significant"]] },
  { key: "mobility", label: "Mobility/gait/balance impaired", options: [[0, "Stable"], [3, "Unsteady"]] },
  { key: "cognition", label: "Cognitive impairment", options: [[0, "None"], [2, "Yes"]] },
  { key: "continence", label: "Urinary urgency/incontinence", options: [[0, "No"], [2, "Yes"]] },
  { key: "footwear", label: "Inappropriate footwear/foot problems", options: [[0, "No"], [1, "Yes"]] },
  { key: "environment", label: "Environmental hazards", options: [[0, "None"], [2, "Present"]] },
] as const;

export function scoreFalls(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Low falls risk";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 10) { interpretation = "Very high falls risk"; riskLevel = "very_high"; }
  else if (total >= 6) { interpretation = "High falls risk"; riskLevel = "high"; }
  else if (total >= 3) { interpretation = "Moderate falls risk"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// ABS — Agitated Behaviour Scale ----------------------------------
export const absItems = [
  { key: "shortAttention", label: "Short attention span / distractibility" },
  { key: "impulsive", label: "Impulsive / impatient" },
  { key: "uncooperative", label: "Uncooperative / resistive to care" },
  { key: "violentSelf", label: "Violent/threatening to self" },
  { key: "violentOther", label: "Violent/threatening to others or property" },
  { key: "explosive", label: "Explosive/unpredictable anger" },
  { key: "rocking", label: "Rocking, rubbing, moaning, repetitive behaviour" },
  { key: "pulling", label: "Pulling at tubes/restraints" },
  { key: "wandering", label: "Wandering" },
  { key: "restless", label: "Restlessness, pacing, excessive movement" },
  { key: "repetitive", label: "Repetitive speech" },
  { key: "rapidSpeech", label: "Rapid, loud or excessive speech" },
  { key: "moodSwings", label: "Sudden mood changes" },
  { key: "crying", label: "Easily initiated / prolonged crying or laughing" },
] as const;
export const absScale = [[1, "Absent"], [2, "Slight"], [3, "Moderate"], [4, "Extreme"]] as const;

export function scoreABS(s: Record<string, number>): Result {
  const total = sumScores(s);
  let interpretation = "Normal";
  let riskLevel: Result["riskLevel"] = "low";
  if (total >= 35) { interpretation = "Severe agitation"; riskLevel = "very_high"; }
  else if (total >= 28) { interpretation = "Moderate agitation"; riskLevel = "high"; }
  else if (total >= 22) { interpretation = "Mild agitation"; riskLevel = "moderate"; }
  return { totalScore: total, interpretation, riskLevel };
}

// ABC Tool — not scored (event log) -------------------------------
export const abcItems = [
  { key: "severity", label: "Severity", options: [[1, "Mild"], [2, "Moderate"], [3, "Severe"], [4, "Critical"]] },
  { key: "duration", label: "Duration", options: [[1, "<5 min"], [2, "5–15 min"], [3, "15–60 min"], [4, ">60 min"]] },
] as const;

export function scoreABC(s: Record<string, number>): Result {
  const total = sumScores(s);
  let riskLevel: Result["riskLevel"] = "low";
  let interpretation = "Recorded";
  if ((s.severity || 0) >= 3) { interpretation = "Significant behavioural episode"; riskLevel = "high"; }
  if ((s.severity || 0) === 4) { interpretation = "Critical behavioural episode"; riskLevel = "very_high"; }
  return { totalScore: total, interpretation, riskLevel };
}

// Dispatcher -------------------------------------------------------
export function scoreAssessment(type: AssessmentType, scores: Record<string, number>): Result {
  switch (type) {
    case "barthel": return scoreBarthel(scores);
    case "waterlow": return scoreWaterlow(scores);
    case "abbey_pain": return scoreAbbey(scores);
    case "mna": return scoreMNA(scores);
    case "norton": return scoreNorton(scores);
    case "nutrition": return scoreNutrition(scores);
    case "pinch_me": return scorePinchMe(scores);
    case "mmse": return scoreMMSE(scores);
    case "four_at": return scoreFourAT(scores);
    case "gds15": return scoreGDS15(scores);
    case "cornell": return scoreCornell(scores);
    case "must": return scoreMUST(scores);
    case "continence": return scoreContinence(scores);
    case "pain_chart": return scorePainChart(scores);
    case "falls": return scoreFalls(scores);
    case "abs": return scoreABS(scores);
    case "abc": return scoreABC(scores);
  }
}

export const assessmentMeta: Record<AssessmentType, { name: string; description: string; category: string; max?: number }> = {
  barthel: { name: "Barthel Index", description: "Activities of daily living", category: "Functional", max: 100 },
  waterlow: { name: "Waterlow", description: "Pressure ulcer risk", category: "Skin", max: 60 },
  abbey_pain: { name: "Abbey Pain Scale", description: "Pain in non-verbal residents", category: "Pain", max: 18 },
  mna: { name: "MNA", description: "Mini Nutritional Assessment", category: "Nutrition", max: 14 },
  norton: { name: "Norton", description: "Pressure ulcer risk (Norton)", category: "Skin", max: 20 },
  nutrition: { name: "Nutrition Care Plan", description: "Composite nutritional review", category: "Nutrition" },
  pinch_me: { name: "PINCH ME", description: "Acute deterioration screen", category: "Clinical" },
  mmse: { name: "MMSE", description: "Mini-Mental State Examination", category: "Cognition", max: 30 },
  four_at: { name: "4AT", description: "Delirium screening", category: "Cognition", max: 12 },
  gds15: { name: "GDS-15", description: "Geriatric Depression Scale", category: "Mental Health", max: 15 },
  cornell: { name: "Cornell Scale", description: "Depression in dementia", category: "Mental Health", max: 38 },
  must: { name: "MUST", description: "Malnutrition Universal Screening Tool", category: "Nutrition", max: 6 },
  continence: { name: "Continence", description: "Urinary & bowel continence", category: "Continence" },
  pain_chart: { name: "Pain Chart", description: "0–10 pain monitoring", category: "Pain" },
  falls: { name: "Falls Risk", description: "Multifactorial falls assessment", category: "Safety" },
  abs: { name: "Agitated Behaviour Scale", description: "Behavioural agitation", category: "Behaviour", max: 56 },
  abc: { name: "ABC Tool", description: "Antecedent / Behaviour / Consequence log", category: "Behaviour" },
};

export const assessmentItems: Record<AssessmentType, ReadonlyArray<any>> = {
  barthel: barthelItems,
  waterlow: waterlowItems,
  abbey_pain: abbeyItems,
  mna: mnaItems,
  norton: nortonItems,
  nutrition: nutritionItems,
  pinch_me: pinchMeItems,
  mmse: mmseItems,
  four_at: fourATItems,
  gds15: gds15Items,
  cornell: cornellItems,
  must: mustItems,
  continence: continenceItems,
  pain_chart: painChartItems,
  falls: fallsItems,
  abs: absItems,
  abc: abcItems,
};

export function uniformScale(type: AssessmentType): ReadonlyArray<readonly [number, string]> | null {
  if (type === "abbey_pain") return abbeyScale;
  if (type === "pinch_me") return pinchMeScale;
  if (type === "cornell") return cornellScale;
  if (type === "abs") return absScale;
  if (type === "gds15") return [[0, "No"], [1, "Yes"]] as const;
  return null;
}
