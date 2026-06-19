import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react";
import type {
  Resident, Assessment, CarePlan, Intervention, DailyNote, Evaluation,
  Alert, Task, AuditLog, Role, Incident, MDTNote, Visitor, Outing, HandoverNote,
  NextOfKin, Wing, Unit, Room, UserProfile,
  CarePlanEvaluation, CarePlanReview,
  InterventionLog, ReadReceipt, CarePlanTemplate,
  Observation, WeightRecord, FluidRecord, FoodRecord, PainRecord,
  SleepRecord, BowelRecord, BehaviourRecord, IncidentAction, ShiftSummary,
  TimelineEvent, TimelineEventType,
  ResidentCarePlan, CarePlanProblem, ProblemGoal, ProblemIntervention,
  ProblemInterventionLog, ProblemEvaluation, ProblemReview,
  ProblemHistoryEntry, ProblemHistoryAction, AssessmentSuggestion,
  ProblemCategory, ProblemRiskLevel, FrequencyType,
  AssessmentAuditEntry, AssessmentComment, AssessmentReviewTriggerEvent,
  ReviewTriggerType, AssessmentType,
  VitalSign, VitalAuditEntry, ObservationPlan, ObservationPlanItem,
  ClinicalAlert, ClinicalEscalationNote,
  ClinicalObservation, ObservationKind, ObservationSchedule, ObservationScheduleItem, ObservationAuditEntry,
} from "./types";
import { derivedAlertsForResident } from "./vitals";
import { scoreAssessment } from "./scoring";
import { BUILT_IN_TEMPLATES } from "./templates";
import { migrateLegacy, suggestionsForAssessment, newId } from "./problems";
import { categoryFor, computeNextReviewDate, TRIGGER_TO_TYPES } from "./assessments";


let _uidSeq = 0;
const uid = () => `id-${(++_uidSeq).toString(36).padStart(6, "0")}`;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const phoneFor = (seed: number) => `07${String(100000000 + ((seed * 2654435761) % 900000000)).padStart(9, "0")}`;

// ============ Wings / Units / Rooms ============
const WINGS_SEED: Wing[] = [
  { id: "w-oak",     name: "Oak Wing",         floor: "Ground", kind: "wing" },
  { id: "w-maple",   name: "Maple Wing",       floor: "Ground", kind: "wing" },
  { id: "w-ash",     name: "Ash Wing",         floor: "First",  kind: "wing" },
  { id: "w-willow",  name: "Willow Wing",      floor: "First",  kind: "wing" },
  { id: "w-memory",  name: "Memory Care Unit", floor: "Ground", kind: "unit" },
  { id: "w-respite", name: "Respite Unit",     floor: "First",  kind: "unit" },
];
const UNITS_SEED: Unit[] = WINGS_SEED.map(w => ({ id: `u-${w.id}`, wingId: w.id, name: w.name }));

function seedRooms(): Room[] {
  const rooms: Room[] = [];
  WINGS_SEED.forEach((w, wi) => {
    const start = wi * 10 + 1;
    for (let i = 0; i < 12; i++) {
      const num = String(start + i);
      rooms.push({ id: `r-${w.id}-${num}`, wingId: w.id, unitId: `u-${w.id}`, number: num });
    }
  });
  return rooms;
}

// ============ Users ============
function seedUsers(): UserProfile[] {
  return [
    { id: "u-1", name: "C. Adeyemi", role: "carer", email: "c.adeyemi@carepath.org", phone: "07700 900101", department: "Care", assignedWings: ["w-oak"], employeeNumber: "EMP-1001", startDate: "2021-03-14", lastLogin: daysAgo(0), status: "active", avatarSeed: "CarerAde", notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false } },
    { id: "u-2", name: "T. Brooks", role: "carer", email: "t.brooks@carepath.org", phone: "07700 900102", department: "Care", assignedWings: ["w-maple"], employeeNumber: "EMP-1002", startDate: "2022-08-02", lastLogin: daysAgo(1), status: "active", avatarSeed: "CarerBro", notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false } },
    { id: "u-3", name: "J. Roberts", role: "nurse", email: "j.roberts@carepath.org", phone: "07700 900103", department: "Nursing", assignedWings: ["w-oak", "w-maple"], employeeNumber: "EMP-2001", startDate: "2019-01-10", lastLogin: daysAgo(0), status: "active", avatarSeed: "NurseRob", notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false } },
    { id: "u-4", name: "L. Mensah", role: "nurse", email: "l.mensah@carepath.org", phone: "07700 900104", department: "Nursing", assignedWings: ["w-ash", "w-willow"], employeeNumber: "EMP-2002", startDate: "2020-06-22", lastLogin: daysAgo(0), status: "active", avatarSeed: "NurseMen", notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false } },
    { id: "u-5", name: "Dr. S. Patel", role: "doctor", email: "s.patel@nhs.uk", phone: "0207 555 0100", department: "Medical", assignedWings: [], employeeNumber: "MED-3001", startDate: "2015-09-01", lastLogin: daysAgo(2), status: "active", avatarSeed: "DocPatel", notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: true } },
    { id: "u-6", name: "M. O'Brien", role: "cnm", email: "m.obrien@carepath.org", phone: "07700 900201", department: "Management", assignedWings: [], employeeNumber: "EMP-3001", startDate: "2018-04-19", lastLogin: daysAgo(0), status: "active", avatarSeed: "CnmObrien", notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false } },
    { id: "u-7", name: "L. Hartley", role: "don", email: "l.hartley@carepath.org", phone: "07700 900301", department: "Executive", assignedWings: [], employeeNumber: "EMP-4001", startDate: "2014-11-30", lastLogin: daysAgo(0), status: "active", avatarSeed: "DonHart", notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false } },
  ];
}

const firstNames = ["Margaret", "Albert", "Doris", "Henry", "Ethel", "Frank", "Vera", "George", "Joan", "Stanley", "Edith", "Reginald"];
const lastNames = ["Thompson", "Whitaker", "Bennett", "Holloway", "Pemberton", "Ashcroft", "Crawford", "Linfield", "Pritchard", "Holbrook", "Sinclair", "Marlowe"];
const diagnoses = [
  "Alzheimer's disease, hypertension",
  "Vascular dementia, type 2 diabetes",
  "Parkinson's disease",
  "Chronic obstructive pulmonary disease",
  "Stroke (left CVA), atrial fibrillation",
  "Osteoarthritis, mild cognitive impairment",
  "Heart failure, chronic kidney disease",
  "Dementia (mixed), osteoporosis",
  "Multiple sclerosis (advanced)",
  "End-stage renal disease",
  "Lewy body dementia, hypothyroidism",
  "Frailty syndrome, recurrent UTIs",
];
const residentTypes: any[] = ["active", "active", "active", "active_respite", "active", "active", "inactive_respite", "active", "active_respite", "active", "active", "active"];
const bedTypesSeed: any[] = ["standard", "profiling", "pressure_relief", "low", "standard", "air_mattress", "specialist", "standard", "profiling", "pressure_relief", "profiling", "standard"];
const mattressSeed: any[] = ["foam", "alternating_air", "low_air_loss", "foam", "standard", "alternating_air", "gel", "foam", "alternating_air", "low_air_loss", "alternating_air", "foam"];

function seedNok(lastName: string, idx: number): NextOfKin[] {
  return [
    {
      id: `nok-${idx}-1`,
      name: `${["Sarah", "James", "Emily", "Robert"][idx % 4]} ${lastName}`,
      relationship: "Daughter",
      phone: "0207 555 0100",
      mobile: phoneFor(idx * 7 + 1),
      email: `${lastName.toLowerCase()}.family@example.com`,
      address: "12 Oak Lane, London",
      primaryContact: true, emergencyContact: true,
      powerOfAttorney: idx % 2 === 0, legalRepresentative: false,
      notes: "Primary point of contact for care decisions.",
    },
  ];
}

function seedResidents(rooms: Room[]): Resident[] {
  return firstNames.map((fn, i) => {
    const room = rooms[i % rooms.length];
    return {
      id: `R-${String(i + 1).padStart(4, "0")}`,
      firstName: fn,
      lastName: lastNames[i],
      dob: new Date(1935 + i, (i * 3) % 12, ((i * 7) % 27) + 1).toISOString().slice(0, 10),
      gender: i % 3 === 0 ? "male" : "female",
      roomNumber: room.number,
      wingId: room.wingId,
      unitId: room.unitId,
      roomId: room.id,
      admissionDate: daysAgo(60 + i * 30).slice(0, 10),
      primaryDiagnosis: diagnoses[i],
      medicalHistory: "Hypertension, previous hip replacement (2019), cataract surgery.",
      allergies: i % 4 === 0 ? "Penicillin" : "No known drug allergies",
      gp: ["Dr. S. Patel", "Dr. M. Khan", "Dr. R. Evans", "Dr. C. Hughes"][i % 4],
      consultant: ["Dr. J. Mitchell (Geriatrics)", "Dr. A. Sharma (Cardiology)", "Dr. P. O'Neill (Neurology)"][i % 3],
      nextOfKin: `${["Sarah", "James", "Emily", "Robert"][i % 4]} ${lastNames[i]} (daughter)`,
      nextOfKinList: seedNok(lastNames[i], i),
      emergencyContact: phoneFor(i * 13 + 3),
      communicationNeeds: i % 3 === 0 ? "Hearing aid (right ear), speak clearly" : "No additional needs",
      religion: ["Church of England", "Catholic", "None", "Methodist"][i % 4],
      preferredLanguage: "English",
      mentalCapacity: i % 3 === 0 ? "lacks_capacity" : i % 3 === 1 ? "fluctuating" : "has_capacity",
      endOfLife: i === 9,
      currentMedication: "Ramipril 5mg OD, Atorvastatin 20mg ON, Donepezil 10mg ON, Paracetamol 1g PRN",
      status: "active",
      residentType: residentTypes[i],
      bed: {
        bedType: bedTypesSeed[i],
        mattressType: mattressSeed[i],
        installationDate: daysAgo(180 - i * 10).slice(0, 10),
        reviewDate: daysAhead(90 + i * 5).slice(0, 10),
      },
      keyWorkers: {
        namedNurse: ["J. Roberts (RN)", "L. Mensah (RN)"][i % 2],
        namedCarer: ["C. Adeyemi", "T. Brooks"][i % 2],
        keyWorker: ["A. Garcia", "S. Williams", "D. Foster"][i % 3],
      },
      lastGpReview: daysAgo(20 + i * 3).slice(0, 10),
      lastMdtReview: daysAgo(40 + i * 4).slice(0, 10),
      photoSeed: `${fn}${lastNames[i]}`,
      aKeyToMe: i % 2 === 0 ? {
        lifeHistory: `Born and raised in ${["Manchester", "Liverpool", "Cardiff"][i % 3]}. Worked as a ${["teacher", "nurse", "engineer", "shopkeeper"][i % 4]} for 35 years.`,
        occupation: ["Retired teacher", "Retired nurse", "Retired engineer", "Retired shopkeeper"][i % 4],
        family: "Two children, four grandchildren. Family visit weekly.",
        hobbies: "Reading, gardening, jigsaw puzzles, classical music.",
        likes: "Tea with two sugars, classical music, sunny days, family photos.",
        dislikes: "Loud noises, being rushed, cold rooms.",
        foodPreferences: "Light meals, prefers fish, dislikes strong cheese.",
        dailyRoutine: "Likes a quiet morning, reads paper, afternoon nap after lunch.",
        comfortItems: "Photograph album, knitted blanket from her mother.",
        triggers: "Being told what to do without explanation.",
        whatMakesMeHappy: "Family visits, classical music on the radio.",
        whatUpsetsMe: "Loud arguments, missing my afternoon tea.",
        bestWayToSupport: "Speak slowly, give choices, allow time to respond. Use her name often.",
      } : undefined,
    } as Resident;
  });
}

function seedData() {
  const wings = WINGS_SEED;
  const units = UNITS_SEED;
  const rooms = seedRooms();
  const users = seedUsers();
  const residents = seedResidents(rooms);
  const assessments: Assessment[] = [];
  const carePlans: CarePlan[] = [];
  const interventions: Intervention[] = [];
  const notes: DailyNote[] = [];
  const evaluations: Evaluation[] = [];
  const carePlanEvaluations: CarePlanEvaluation[] = [];
  const carePlanReviews: CarePlanReview[] = [];
  const alerts: Alert[] = [];
  const tasks: Task[] = [];
  const incidents: Incident[] = [];
  const mdtNotes: MDTNote[] = [];
  const visitors: Visitor[] = [];
  const outings: Outing[] = [];
  const handovers: HandoverNote[] = [];

  residents.forEach((r, i) => {
    const baseAssessment = (extra: Partial<Assessment> & { type?: AssessmentType }): Partial<Assessment> => {
      const type = extra.type as AssessmentType | undefined;
      const cat = type ? categoryFor(type) : undefined;
      // Stagger review dates so some are due/overdue
      const offset = ((i + (type?.length ?? 3)) % 50) - 20; // -20..+29
      return {
        assessor: "J. Roberts (RN)", assessorRole: "nurse",
        status: "completed", version: 1, locked: true,
        category: cat,
        reviewFrequency: "monthly" as const,
        reviewTriggers: ["routine" as const],
        reviewDate: daysAhead(7 + offset).slice(0, 10),
        nextReassessmentDate: daysAhead(offset).slice(0, 10),
        lockedBy: "J. Roberts (RN)", lockedAt: daysAgo(5).toString(),
        auditTrail: [
          { id: `aud-${i}-c-${type ?? "x"}`, action: "created", byUserId: "u-3", byUserName: "J. Roberts (RN)", byRole: "nurse", at: daysAgo(10).toString() },
          { id: `aud-${i}-d-${type ?? "x"}`, action: "completed", byUserId: "u-3", byUserName: "J. Roberts (RN)", byRole: "nurse", at: daysAgo(10).toString() },
          { id: `aud-${i}-l-${type ?? "x"}`, action: "locked", byUserId: "u-3", byUserName: "J. Roberts (RN)", byRole: "nurse", at: daysAgo(10).toString() },
        ],
        clinicalComments: [],
        linkedProblemIds: [],
        ...extra,
      };
    };

    const bScores = {
      feeding: [10, 5, 0, 10, 5, 0, 5, 10, 5, 0, 5, 10][i], bathing: [5, 0, 0, 5, 0, 0, 5, 0, 5, 0, 5, 5][i],
      grooming: [5, 0, 5, 5, 0, 5, 0, 5, 0, 0, 5, 5][i], dressing: [10, 5, 0, 10, 0, 5, 5, 0, 5, 0, 5, 10][i],
      bowels: [10, 5, 0, 10, 5, 5, 5, 0, 5, 0, 5, 10][i], bladder: [10, 5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 10][i],
      toilet: [10, 5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 10][i], transfers: [15, 5, 0, 10, 5, 10, 5, 0, 5, 0, 10, 15][i],
      mobility: [15, 5, 0, 10, 0, 10, 5, 0, 5, 0, 10, 15][i], stairs: [10, 0, 0, 5, 0, 5, 0, 0, 0, 0, 5, 10][i],
    };
    const b = scoreAssessment("barthel", bScores);
    assessments.push({ id: uid(), residentId: r.id, type: "barthel", date: daysAgo(20 - i % 10).slice(0, 10), scores: bScores, ...b, ...baseAssessment({ type: "barthel" }) } as Assessment);

    const wScores = {
      build: i % 3, skin: i % 4, age: i < 5 ? 3 : 5, sex: 2, continence: i % 4,
      mobility: i % 5, nutrition: i % 3, neuro: i % 2 === 0 ? 4 : 0,
      specialRisk: i === 9 ? 8 : 0, medication: i % 3 === 0 ? 4 : 0,
    };
    const w = scoreAssessment("waterlow", wScores);
    assessments.push({ id: uid(), residentId: r.id, type: "waterlow", date: daysAgo(15 - i % 5).slice(0, 10), scores: wScores, ...w, ...baseAssessment({ type: "waterlow" }) } as Assessment);

    const aScores = {
      vocalisation: [0, 1, 2, 0, 3, 1, 0, 2, 1, 3, 1, 0][i], facial: [1, 1, 2, 0, 3, 2, 0, 2, 1, 3, 1, 0][i],
      bodyLanguage: [0, 2, 1, 0, 2, 1, 1, 2, 0, 3, 1, 0][i], behavioural: [0, 1, 2, 0, 2, 1, 0, 1, 1, 2, 0, 0][i],
      physiological: [0, 1, 1, 0, 2, 0, 0, 1, 1, 2, 0, 0][i], physical: [0, 0, 1, 0, 2, 1, 0, 1, 0, 2, 0, 0][i],
    };
    const a = scoreAssessment("abbey_pain", aScores);
    assessments.push({ id: uid(), residentId: r.id, type: "abbey_pain", date: daysAgo(10 - i % 5).slice(0, 10), scores: aScores, ...a, ...baseAssessment({ type: "abbey_pain", assessor: "L. Mensah (RN)" }) } as Assessment);

    if (i % 2 === 0) {
      const mScores = { foodIntake: i % 3, weightLoss: (i + 1) % 4, mobility: i % 3, stress: i % 2 === 0 ? 0 : 2, neuro: i % 3, bmi: i % 4 };
      const m = scoreAssessment("mna", mScores);
      assessments.push({ id: uid(), residentId: r.id, type: "mna", date: daysAgo(12).slice(0, 10), scores: mScores, ...m, ...baseAssessment({ type: "mna" }) } as Assessment);
    }
    if (i % 3 === 0) {
      const mmseScores = { orientationTime: 3, orientationPlace: 4, registration: 2, attention: 2, recall: 1, naming: 2, repetition: 1, command: 2, reading: 1, writing: 0, copying: 0 };
      const mmseR = scoreAssessment("mmse", mmseScores);
      assessments.push({ id: uid(), residentId: r.id, type: "mmse", date: daysAgo(18).slice(0, 10), scores: mmseScores, ...mmseR, ...baseAssessment({ type: "mmse" }) } as Assessment);
    }
    if (i % 4 === 0) {
      const fallsScores = { history: 3, medication: 2, vision: 0, mobility: 3, cognition: 2, continence: 0, footwear: 0, environment: 0 };
      const fR = scoreAssessment("falls", fallsScores);
      assessments.push({ id: uid(), residentId: r.id, type: "falls", date: daysAgo(9).slice(0, 10), scores: fallsScores, ...fR, ...baseAssessment({ type: "falls" }) } as Assessment);
    }

    // Care plans triggered by assessments
    if (w.riskLevel === "high" || w.riskLevel === "very_high") {
      carePlans.push({
        id: uid(), residentId: r.id, title: "Pressure Area Care Plan",
        category: "Pressure Area Care",
        problem: "High risk of pressure ulcer development (Waterlow " + w.totalScore + ")",
        problemStatement: "Resident at " + w.interpretation + " due to immobility, incontinence and reduced nutrition.",
        goal: "Maintain skin integrity; no new pressure damage at next review.",
        identifiedNeeds: ["Pressure Relief", "Skin Monitoring", "Nutrition Support"],
        interventions: ["Reposition 2-hourly", "Daily skin inspection", "Pressure-relieving mattress", "Nutritional support"],
        assignedStaff: "Care team", frequency: "Every 2 hours",
        reviewDate: daysAhead(7).slice(0, 10),
        evaluationDate: daysAhead(14).slice(0, 10),
        status: "active", priority: w.riskLevel === "very_high" ? "critical" : "high",
        createdAt: daysAgo(14), createdBy: "J. Roberts (RN)",
        version: 1,
      });
      alerts.push({ id: uid(), residentId: r.id, title: "Waterlow score " + w.totalScore, description: w.interpretation + " - review pressure care.", priority: w.riskLevel === "very_high" ? "critical" : "high", createdAt: daysAgo(2), acknowledged: false });
    }
    if (a.totalScore >= 8) {
      carePlans.push({
        id: uid(), residentId: r.id, title: "Pain Management Care Plan",
        category: "Pain Management",
        problem: "Abbey Pain Scale " + a.totalScore + " — " + a.interpretation,
        goal: "Reduce pain to mild/none within 7 days.",
        identifiedNeeds: ["Pain Management"],
        interventions: ["Administer analgesia as prescribed", "Reassess pain 4-hourly", "Non-pharmacological comfort", "Notify GP if no improvement"],
        assignedStaff: "Nursing team", frequency: "4-hourly",
        reviewDate: daysAhead(5).slice(0, 10),
        evaluationDate: daysAhead(10).slice(0, 10),
        status: "active", priority: a.totalScore >= 14 ? "critical" : "high",
        createdAt: daysAgo(7), createdBy: "L. Mensah (RN)",
        version: 1,
      });
    }

    for (let k = 0; k < 3; k++) {
      interventions.push({
        id: uid(), residentId: r.id, date: daysAgo(k).slice(0, 10),
        staff: ["C. Adeyemi", "T. Brooks", "M. Singh"][k % 3],
        intervention: ["Repositioned (left lateral)", "Pain relief (Paracetamol 1g)", "Hydration encouraged 200ml"][k],
        outcome: ["Settled comfortably", "Pain reduced", "Drank willingly"][k],
        residentResponse: ["Comfortable", "Calmer", "Engaged"][k],
        followUpRequired: k === 1,
      });
    }

    for (let k = 0; k < 2; k++) {
      notes.push({
        id: uid(), residentId: r.id, date: daysAgo(k).slice(0, 10),
        staff: ["C. Adeyemi", "T. Brooks"][k % 2],
        shift: (["morning", "afternoon"] as const)[k % 2],
        observation: "Settled day. Engaged in activities. Ate well at lunch.",
        mood: (["happy", "calm", "anxious", "withdrawn"] as const)[(i + k) % 4],
        foodIntake: (["full", "most", "half"] as const)[k % 3],
        fluidIntake: (["good", "moderate", "poor"] as const)[k % 3],
        sleep: (["good", "broken", "good"] as const)[k % 3],
        behaviour: "No concerns observed.",
      });
    }

    tasks.push({
      id: uid(), residentId: r.id, title: "Reposition resident",
      assignedTo: "Care team", dueDate: daysAhead(0).slice(0, 10),
      status: i % 3 === 0 ? "overdue" : "pending",
    });

    if (i % 3 === 0) {
      incidents.push({
        id: uid(), residentId: r.id, date: daysAgo(5 + i).slice(0, 10),
        type: "fall", severity: i === 3 ? "high" : "moderate",
        description: "Unwitnessed fall in bedroom — found on floor beside bed.",
        immediateAction: "Neurological obs commenced; GP informed; no injury noted.",
        reportedBy: "T. Brooks (Carer)", witnessedBy: "",
        followUpRequired: true, status: "under_investigation",
      });
    }
    if (i % 2 === 0) {
      mdtNotes.push({
        id: uid(), residentId: r.id, date: daysAgo(14 + i).slice(0, 10),
        attendees: "Dr. Patel (GP), J. Roberts (RN), Family",
        discussion: "Reviewed care plan, medication efficacy and falls risk.",
        recommendations: "Continue current plan, repeat MNA in 4 weeks.",
        followUpDate: daysAhead(28).slice(0, 10),
        authoredBy: "Dr. S. Patel", role: "doctor",
      });
    }
    if (i % 2 === 1) {
      visitors.push({
        id: uid(), residentId: r.id, date: daysAgo(1).slice(0, 10),
        visitorName: `${["Sarah", "James", "Emily"][i % 3]} ${r.lastName}`,
        relationship: "Daughter", arrivalTime: "14:00", departureTime: "15:30",
        notes: "Brought flowers; resident in good spirits.", signedInBy: "Reception",
      });
    }
    if (i % 4 === 0) {
      outings.push({
        id: uid(), residentId: r.id, date: daysAgo(7).slice(0, 10),
        destination: "Local park", accompaniedBy: "C. Adeyemi & family",
        departureTime: "10:00", returnTime: "12:30",
        transportMethod: "Wheelchair accessible van",
        notes: "Enjoyed fresh air; no incidents.", riskAssessmentCompleted: true,
      });
    }
    handovers.push({
      id: uid(), residentId: r.id, date: daysAgo(0).slice(0, 10), shift: "morning",
      staff: "C. Adeyemi", summary: "Settled. Ate breakfast. Repositioned 2-hourly.",
      outstandingActions: "Awaiting GP review re: paracetamol dosing.",
    });
  });

  // ---- Phase 5 seed: charts & observations ----
  const observations: Observation[] = [];
  const weights: WeightRecord[] = [];
  const fluids: FluidRecord[] = [];
  const foods: FoodRecord[] = [];
  const pains: PainRecord[] = [];
  const sleeps: SleepRecord[] = [];
  const bowels: BowelRecord[] = [];
  const behaviours: BehaviourRecord[] = [];
  const incidentActions: IncidentAction[] = [];
  const shiftSummaries: ShiftSummary[] = [];
  const timelineEvents: TimelineEvent[] = [];

  residents.forEach((r, i) => {
    // 6 weight records over time (trend)
    for (let w = 5; w >= 0; w--) {
      const base = 62 + (i % 5) * 3;
      weights.push({
        id: uid(), residentId: r.id, date: daysAgo(w * 14).slice(0, 10),
        weightKg: +(base - w * 0.4 + (i % 3) * 0.2).toFixed(1),
        staff: "J. Roberts (RN)",
      });
    }
    // fluids today (3 entries)
    for (let k = 0; k < 3; k++) {
      fluids.push({
        id: uid(), residentId: r.id, date: daysAgo(0).slice(0, 10),
        time: ["08:00", "12:30", "17:00"][k],
        amountMl: [200, 250, 180][k],
        type: ["Water", "Tea", "Juice"][k], route: "oral",
        staff: ["C. Adeyemi", "T. Brooks", "C. Adeyemi"][k],
      });
    }
    // food today (3 meals)
    (["breakfast", "lunch", "dinner"] as const).forEach((meal, mi) => {
      foods.push({
        id: uid(), residentId: r.id, date: daysAgo(0).slice(0, 10),
        meal, intake: (["full", "most", "half", "little"] as const)[(i + mi) % 4],
        staff: "C. Adeyemi",
      });
    });
    // pain — last 5 days
    for (let p = 4; p >= 0; p--) {
      pains.push({
        id: uid(), residentId: r.id, date: daysAgo(p).slice(0, 10),
        time: "10:00", score: ((i + p) % 6), staff: "J. Roberts (RN)",
      });
    }
    // sleep — last 5 nights
    for (let s = 4; s >= 0; s--) {
      sleeps.push({
        id: uid(), residentId: r.id, date: daysAgo(s).slice(0, 10),
        hoursSlept: 5 + ((i + s) % 4),
        quality: (["good", "broken", "poor"] as const)[(i + s) % 3],
        staff: "Night Team",
      });
    }
    // observation today
    observations.push({
      id: uid(), residentId: r.id, date: daysAgo(0).slice(0, 10), time: "09:30",
      staff: "C. Adeyemi", role: "carer",
      mood: (["happy", "calm", "anxious"] as const)[i % 3],
      mobility: (["independent", "assistance", "hoist"] as const)[i % 3],
      pain: i % 4, sleep: "good", appetite: "most", hydration: "good",
      behaviour: "Settled.",
    });
  });

  // ---- Phase 6 seed: Vital Signs ----
  const vitals: VitalSign[] = [];
  const observationPlans: ObservationPlan[] = [];
  const clinicalAlerts: ClinicalAlert[] = [];

  residents.forEach((r, i) => {
    // assign a default height to each resident
    (r as any).heightCm = 158 + (i % 7) * 4;
    // Seed 12 vital entries over the last 60 days
    for (let k = 11; k >= 0; k--) {
      const d = new Date(Date.now() - k * 5 * 86400000);
      const date = d.toISOString().slice(0, 10);
      const time = ["08:30", "14:00", "20:00"][k % 3];
      const recordedAt = new Date(d.setHours(+time.slice(0, 2), +time.slice(3))).toISOString();
      const tempDrift = (k % 4 === 0 && i === 1) ? 38.6 : 36.5 + ((i + k) % 9) * 0.1;
      const sysDrift = 110 + ((i + k) % 30);
      const news2Drift = (i === 2 && k <= 2);
      const vid = `v-${r.id}-${k}`;
      vitals.push({
        id: vid,
        residentId: r.id, date, time, recordedAt,
        temperature: +tempDrift.toFixed(1),
        pulse: 70 + ((i + k) % 20) + (news2Drift ? 25 : 0),
        respiratoryRate: 14 + ((i + k) % 5) + (news2Drift ? 8 : 0),
        systolicBP: news2Drift ? 95 : sysDrift,
        diastolicBP: 70 + ((i + k) % 12),
        spo2: news2Drift ? 90 : 96 + ((i + k) % 3),
        onOxygen: news2Drift,
        oxygenLpm: news2Drift ? 2 : undefined,
        bloodGlucose: i % 3 === 0 ? +(5.5 + ((i + k) % 7) * 0.4).toFixed(1) : undefined,
        weight: k % 3 === 0 ? +(62 + (i % 5) * 3 - k * 0.25).toFixed(1) : undefined,
        height: undefined,
        painScore: (i + k) % 8,
        consciousness: "A",
        fluidIntakeMl: 200 + ((i + k) % 5) * 100,
        fluidOutputMl: 180 + ((i + k) % 5) * 90,
        recordedByUserId: "u-3", recordedByName: "J. Roberts (RN)", recordedByRole: "nurse",
        deviceUsed: k % 4 === 0 ? "Welch Allyn Connex" : undefined,
        createdAt: recordedAt,
        auditTrail: [{
          id: `va-${vid}`, action: "created", byUserId: "u-3", byUserName: "J. Roberts (RN)",
          byRole: "nurse", at: recordedAt,
        }],
      });
    }
    // Observation plan
    observationPlans.push({
      residentId: r.id,
      updatedAt: daysAgo(30),
      updatedByName: "M. O'Brien (CNM)",
      items: [
        { id: `op-${r.id}-1`, type: "temperature", frequency: "daily", required: true },
        { id: `op-${r.id}-2`, type: "bloodPressure", frequency: "weekly", required: true },
        { id: `op-${r.id}-3`, type: "weight", frequency: "weekly", required: true },
        { id: `op-${r.id}-4`, type: "pulse", frequency: "daily", required: true },
        { id: `op-${r.id}-5`, type: "spo2", frequency: "daily", required: false },
        { id: `op-${r.id}-6`, type: "news2", frequency: "prn", required: true },
        ...(i % 3 === 0 ? [{ id: `op-${r.id}-7`, type: "bloodGlucose" as const, frequency: "daily" as const, required: true }] : []),
        ...(i % 4 === 0 ? [{ id: `op-${r.id}-8`, type: "fluidBalance" as const, frequency: "daily" as const, required: true }] : []),
        { id: `op-${r.id}-9`, type: "painScore", frequency: "daily", required: false },
      ],
    });
  });

  // Derive seed clinical alerts from seeded vitals (persisted so ack/dismiss survives)
  residents.forEach(r => {
    const rv = vitals.filter(v => v.residentId === r.id);
    const seeds = derivedAlertsForResident(rv, r);
    seeds.forEach((s, idx) => {
      clinicalAlerts.push({
        id: `ca-${r.id}-${idx}`,
        residentId: r.id,
        type: s.type, severity: s.severity,
        title: s.title, message: s.message, recommendation: s.recommendation,
        sourceVitalId: s.sourceVitalId,
        createdAt: new Date().toISOString(),
        acknowledged: false,
        escalations: [],
      });
    });
  });

  // ---- Migrate legacy care plans into unified resident-care-plan / problems model ----
  const migrated = migrateLegacy(carePlans, carePlanEvaluations, carePlanReviews, [] as InterventionLog[]);

  // Seed AssessmentSuggestions for completed assessments that have not already triggered a problem
  const assessmentSuggestions: AssessmentSuggestion[] = [];
  for (const a of assessments) {
    if (a.status === "deleted" || a.status === "archived") continue;
    const sugs = suggestionsForAssessment(a);
    for (const s of sugs) {
      // skip if a problem already exists for this resident with that category sourced from this assessment
      if (migrated.carePlanProblems.some(p => p.residentId === a.residentId && p.category === s.category && p.sourceAssessmentId === a.id)) continue;
      assessmentSuggestions.push({
        ...s, id: newId("sug"), createdAt: new Date().toISOString(), status: "pending",
      });
    }
  }

  return {
    wings, units, rooms, users,
    residents, assessments, carePlans, interventions, notes, evaluations,
    carePlanEvaluations, carePlanReviews,
    alerts, tasks, auditLogs: [] as AuditLog[],
    incidents, mdtNotes, visitors, outings, handovers,
    interventionLogs: [] as InterventionLog[],
    readReceipts: [] as ReadReceipt[],
    carePlanTemplates: BUILT_IN_TEMPLATES.map(t => ({ ...t, editable: true })) as CarePlanTemplate[],
    observations, weights, fluids, foods, pains, sleeps, bowels, behaviours,
    incidentActions, shiftSummaries, timelineEvents,
    // unified model
    residentCarePlans: migrated.residentCarePlans,
    carePlanProblems: migrated.carePlanProblems,
    problemGoals: migrated.problemGoals,
    problemInterventions: migrated.problemInterventions,
    problemInterventionLogs: migrated.problemInterventionLogs,
    problemEvaluations: migrated.problemEvaluations,
    problemReviews: migrated.problemReviews,
    problemHistory: migrated.problemHistory,
    assessmentSuggestions,
    legacyCarePlanIdToProblemId: migrated.legacyCarePlanIdToProblemId,
    assessmentTriggerEvents: [] as AssessmentReviewTriggerEvent[],
    vitals,
    observationPlans,
    clinicalAlerts,
    clinicalObservations: [] as ClinicalObservation[],
    observationSchedules: [] as ObservationSchedule[],
  };
}


type Store = ReturnType<typeof seedData>;

// ============ Global Filter ============
export interface CareFilter {
  wingId?: string;
  unitId?: string;
  roomId?: string;
  residentId?: string;
  status?: string;
}

interface CareCtx extends Store {
  currentRole: Role;
  setCurrentRole: (r: Role) => void;
  currentUserName: string;
  currentUser: UserProfile;
  setCurrentUserId: (id: string) => void;
  updateUser: (id: string, patch: Partial<UserProfile>) => void;
  // filter
  filter: CareFilter;
  setFilter: (f: CareFilter) => void;
  filteredResidentIds: string[];
  // residents
  addResident: (r: Omit<Resident, "id" | "photoSeed">) => Resident;
  updateResident: (id: string, patch: Partial<Resident>) => void;
  addNextOfKin: (residentId: string, nok: Omit<NextOfKin, "id">) => void;
  updateNextOfKin: (residentId: string, id: string, patch: Partial<NextOfKin>) => void;
  removeNextOfKin: (residentId: string, id: string) => void;
  // assessments
  addAssessment: (a: Omit<Assessment, "id">) => Assessment;
  updateAssessment: (id: string, patch: Partial<Assessment>) => void;
  completeAssessment: (id: string) => void;
  createAssessmentRevision: (id: string, reason: string) => Assessment | undefined;
  assignAssessment: (id: string, input: { userId: string; userName: string; role: Role; dueDate: string }) => void;
  archiveAssessment: (id: string, reason: string) => void;
  restoreAssessment: (id: string) => void;
  softDeleteAssessment: (id: string, reason: string) => void;
  addAssessmentComment: (id: string, body: string) => void;
  fireReviewTrigger: (input: { residentId: string; trigger: ReviewTriggerType; sourceModule: AssessmentReviewTriggerEvent["sourceModule"]; sourceRecordId?: string; note?: string }) => void;
  // care plans
  addCarePlan: (c: Omit<CarePlan, "id" | "createdAt">) => CarePlan;
  updateCarePlan: (id: string, patch: Partial<CarePlan>) => void;
  reviseCarePlan: (id: string, reason: string) => CarePlan | undefined;
  addCarePlanEvaluation: (e: Omit<CarePlanEvaluation, "id">) => CarePlanEvaluation;
  addCarePlanReview: (r: Omit<CarePlanReview, "id">) => CarePlanReview;
  addCarePlanFromTemplate: (templateId: string, residentId: string, assessment?: Assessment) => CarePlan | undefined;
  saveCarePlanTemplate: (t: CarePlanTemplate) => void;
  deleteCarePlanTemplate: (id: string) => void;
  // intervention logs
  addInterventionLog: (l: Omit<InterventionLog, "id">) => InterventionLog;
  // read receipts
  recordReadReceipt: (entityType: ReadReceipt["entityType"], entityId: string) => void;
  // misc
  addIntervention: (i: Omit<Intervention, "id">) => Intervention;
  addNote: (n: Omit<DailyNote, "id">) => DailyNote;
  addEvaluation: (e: Omit<Evaluation, "id">) => Evaluation;
  acknowledgeAlert: (id: string) => void;
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "acknowledged">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addTask: (t: Omit<Task, "id">) => Task;
  addIncident: (i: Omit<Incident, "id">) => Incident;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
  archiveIncident: (id: string) => void;
  restoreIncident: (id: string) => void;
  softDeleteIncident: (id: string, reason: string) => void;
  duplicateIncident: (id: string) => Incident | undefined;
  closeIncident: (id: string) => void;
  reopenIncident: (id: string) => void;
  submitIncident: (id: string) => void;

  addMDTNote: (m: Omit<MDTNote, "id">) => MDTNote;

  addVisitor: (v: Omit<Visitor, "id">) => Visitor;
  updateVisitor: (id: string, patch: Partial<Visitor>) => void;
  archiveVisitor: (id: string) => void;
  restoreVisitor: (id: string) => void;
  softDeleteVisitor: (id: string, reason: string) => void;
  cancelVisitor: (id: string, reason: string) => void;
  completeVisitor: (id: string) => void;

  addOuting: (o: Omit<Outing, "id">) => Outing;
  updateOuting: (id: string, patch: Partial<Outing>) => void;
  archiveOuting: (id: string) => void;
  restoreOuting: (id: string) => void;
  softDeleteOuting: (id: string, reason: string) => void;
  recordOutingDeparture: (id: string, time: string) => void;
  recordOutingReturn: (id: string, time: string, outcome?: string) => void;
  cancelOuting: (id: string, reason: string) => void;
  closeOuting: (id: string) => void;

  addHandover: (h: Omit<HandoverNote, "id">) => HandoverNote;
  updateHandover: (id: string, patch: Partial<HandoverNote>) => void;
  archiveHandover: (id: string) => void;
  restoreHandover: (id: string) => void;
  softDeleteHandover: (id: string, reason: string) => void;
  acknowledgeHandover: (id: string) => void;
  completeHandover: (id: string) => void;
  closeHandover: (id: string) => void;
  duplicateHandover: (id: string) => HandoverNote | undefined;
  logAudit: (a: Omit<AuditLog, "id" | "timestamp">) => void;
  // Phase 5 charts
  addObservation: (o: Omit<Observation, "id">) => Observation;
  addWeight: (w: Omit<WeightRecord, "id">) => WeightRecord;
  addFluid: (f: Omit<FluidRecord, "id">) => FluidRecord;
  addFood: (f: Omit<FoodRecord, "id">) => FoodRecord;
  addPain: (p: Omit<PainRecord, "id">) => PainRecord;
  addSleep: (s: Omit<SleepRecord, "id">) => SleepRecord;
  addBowel: (b: Omit<BowelRecord, "id">) => BowelRecord;
  addBehaviour: (b: Omit<BehaviourRecord, "id">) => BehaviourRecord;
  addIncidentAction: (a: Omit<IncidentAction, "id">) => IncidentAction;
  generateShiftSummary: (date: string, shift: ShiftSummary["shift"]) => ShiftSummary;
  // ---------- Unified Care Plan / Problems ----------
  ensureResidentCarePlan: (residentId: string) => ResidentCarePlan;
  addProblem: (input: {
    residentId: string; category: ProblemCategory; customCategoryLabel?: string;
    problemStatement: string; riskLevel: ProblemRiskLevel;
    evaluationDate?: string; reviewDate?: string;
    sourceAssessmentId?: string; sourceAssessmentType?: any;
  }) => CarePlanProblem;
  updateProblem: (id: string, patch: Partial<CarePlanProblem>, reason?: string) => void;
  resolveProblem: (id: string, reason: string) => void;
  reopenProblem: (id: string, reason: string) => void;
  archiveProblem: (id: string, reason: string) => void;
  addGoal: (problemId: string, statement: string, targetDate?: string) => ProblemGoal;
  updateGoal: (id: string, patch: Partial<ProblemGoal>) => void;
  removeGoal: (id: string) => void;
  addProblemIntervention: (input: {
    problemId: string; name: string; description?: string;
    frequencyType: FrequencyType; frequencyValue?: number; frequencyInstructions?: string;
    assignedRole?: Role; assignedStaffId?: string; assignedStaffName?: string;
  }) => ProblemIntervention;
  updateProblemIntervention: (id: string, patch: Partial<ProblemIntervention>, reason?: string) => void;
  discontinueProblemIntervention: (id: string, reason: string) => void;
  logProblemIntervention: (input: {
    interventionId: string; outcome: ProblemInterventionLog["outcome"];
    residentResponse?: string; comments?: string;
  }) => ProblemInterventionLog;
  addProblemEvaluation: (input: Omit<ProblemEvaluation, "id" | "evaluatorId" | "evaluatorName" | "role" | "date"> & { date?: string }) => ProblemEvaluation;
  addProblemReview: (input: Omit<ProblemReview, "id" | "reviewedById" | "reviewedByName" | "role">) => ProblemReview;
  acceptSuggestion: (id: string, edits?: { problemStatement?: string; riskLevel?: ProblemRiskLevel; category?: ProblemCategory }) => CarePlanProblem | undefined;
  rejectSuggestion: (id: string, reason: string) => void;
  // Vital Signs (legacy combined form)
  recordVital: (input: Omit<VitalSign, "id" | "recordedByUserId" | "recordedByName" | "recordedByRole" | "createdAt" | "auditTrail"> & { recordedAt?: string }) => VitalSign;
  updateVital: (id: string, patch: Partial<VitalSign>, reason: string) => void;
  softDeleteVital: (id: string, reason: string) => void;
  // Observation Plan (legacy)
  setObservationPlan: (residentId: string, items: ObservationPlanItem[]) => void;
  // Clinical Alerts
  acknowledgeClinicalAlert: (id: string) => void;
  dismissClinicalAlert: (id: string) => void;
  addClinicalEscalationNote: (alertId: string, actionTaken: string) => void;
  regenerateClinicalAlertsForResident: (residentId: string) => void;
  // Phase 7: Modular Clinical Observations
  recordObservation: (input: {
    residentId: string; kind: ObservationKind; date?: string; time?: string;
    data: Record<string, any>; notes?: string;
  }) => ClinicalObservation;
  updateObservation: (id: string, patch: { data?: Record<string, any>; notes?: string }, reason: string) => void;
  softDeleteObservation: (id: string, reason: string) => void;
  setObservationSchedule: (residentId: string, items: ObservationScheduleItem[]) => void;
}


const Ctx = createContext<CareCtx | null>(null);

export function CareProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => seedData());
  const [currentUserId, setCurrentUserId] = useState<string>("u-3"); // J. Roberts (Nurse)
  const [filter, setFilter] = useState<CareFilter>({});

  const currentUser = useMemo(
    () => store.users.find(u => u.id === currentUserId) || store.users[0],
    [store.users, currentUserId],
  );
  const currentRole = currentUser.role;
  const currentUserName = currentUser.name;

  const setCurrentRole = useCallback((r: Role) => {
    const user = store.users.find(u => u.role === r);
    if (user) setCurrentUserId(user.id);
  }, [store.users]);

  const logAudit = useCallback((a: Omit<AuditLog, "id" | "timestamp">) => {
    setStore(s => ({ ...s, auditLogs: [{ ...a, id: uid(), timestamp: new Date().toISOString() }, ...s.auditLogs].slice(0, 500) }));
  }, []);

  const filteredResidentIds = useMemo(() => {
    return store.residents.filter(r => {
      if (filter.residentId && r.id !== filter.residentId) return false;
      if (filter.roomId && r.roomId !== filter.roomId) return false;
      if (filter.unitId && r.unitId !== filter.unitId) return false;
      if (filter.wingId && r.wingId !== filter.wingId) return false;
      if (filter.status && (r.residentType || r.status) !== filter.status) return false;
      return true;
    }).map(r => r.id);
  }, [store.residents, filter]);

  const api = useMemo<CareCtx>(() => ({
    ...store, currentRole, setCurrentRole, currentUserName, currentUser, setCurrentUserId,
    filter, setFilter, filteredResidentIds,
    updateUser: (id, patch) => setStore(s => ({ ...s, users: s.users.map(u => u.id === id ? { ...u, ...patch } : u) })),
    addResident: (r) => {
      const id = `R-${String(store.residents.length + 1).padStart(4, "0")}`;
      const resident: Resident = { ...r, id, photoSeed: r.firstName + r.lastName };
      setStore(s => ({ ...s, residents: [...s.residents, resident] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Created resident", entity: id });
      return resident;
    },
    updateResident: (id, patch) => {
      setStore(s => ({ ...s, residents: s.residents.map(r => r.id === id ? { ...r, ...patch } : r) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated resident", entity: id });
    },
    addNextOfKin: (residentId, nok) => setStore(s => ({
      ...s, residents: s.residents.map(r => r.id === residentId
        ? { ...r, nextOfKinList: [...(r.nextOfKinList || []), { ...nok, id: uid() }] }
        : r),
    })),
    updateNextOfKin: (residentId, id, patch) => setStore(s => ({
      ...s, residents: s.residents.map(r => r.id === residentId
        ? { ...r, nextOfKinList: (r.nextOfKinList || []).map(n => n.id === id ? { ...n, ...patch } : n) }
        : r),
    })),
    removeNextOfKin: (residentId, id) => setStore(s => ({
      ...s, residents: s.residents.map(r => r.id === residentId
        ? { ...r, nextOfKinList: (r.nextOfKinList || []).filter(n => n.id !== id) }
        : r),
    })),
    addAssessment: (a) => {
      const now = new Date().toISOString();
      const isCompleted = (a.status || "completed") === "completed";
      const audit: AssessmentAuditEntry[] = [
        ...(a.auditTrail || []),
        { id: uid(), action: "created", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
      ];
      if (isCompleted) {
        audit.push({ id: uid(), action: "completed", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now });
        audit.push({ id: uid(), action: "locked", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now });
      }
      const item: Assessment = {
        ...a, id: uid(),
        status: a.status || "completed",
        version: a.version || 1,
        category: a.category || (a.type ? categoryFor(a.type) : undefined),
        reviewFrequency: a.reviewFrequency || "monthly",
        reviewTriggers: a.reviewTriggers || ["routine"],
        locked: isCompleted ? true : !!a.locked,
        lockedAt: isCompleted ? now : a.lockedAt,
        lockedBy: isCompleted ? currentUserName : a.lockedBy,
        nextReassessmentDate: a.nextReassessmentDate || (a.reviewFrequency ? computeNextReviewDate(a.reviewFrequency, a.customReviewDays) : undefined),
        auditTrail: audit,
        clinicalComments: a.clinicalComments || [],
        linkedProblemIds: a.linkedProblemIds || [],
      };
      setStore(s => ({ ...s, assessments: [item, ...s.assessments] }));
      // Emit timeline event
      const ev: TimelineEvent = {
        id: uid(), residentId: a.residentId, type: "assessment.created",
        title: `${a.type.replace("_", " ")} assessment ${isCompleted ? "completed" : "started"}`,
        description: isCompleted ? `Score ${a.totalScore} · ${a.interpretation}` : "Draft saved",
        linkedRecordId: item.id, linkedRecordKind: "assessment",
        createdAt: now, createdBy: currentUserName, role: currentRole,
      };
      setStore(s => ({ ...s, timelineEvents: [ev, ...s.timelineEvents] }));
      logAudit({ user: currentUserName, role: currentRole, action: `Created ${a.type} assessment`, entity: a.residentId });
      return item;
    },
    updateAssessment: (id, patch) => {
      const existing = store.assessments.find(x => x.id === id);
      if (existing?.locked && !patch.status && !patch.linkedProblemIds && !patch.clinicalComments && !patch.linkedIncidentIds) {
        // Block content edits on locked assessments — caller should use createAssessmentRevision
        logAudit({ user: currentUserName, role: currentRole, action: "Blocked edit on locked assessment", entity: id, reason: "Assessment is locked; create a revision" });
        return;
      }
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        assessments: s.assessments.map(a => {
          if (a.id !== id) return a;
          const audit = [
            ...(a.auditTrail || []),
            { id: uid(), action: "edited" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
          ];
          return { ...a, ...patch, auditTrail: audit };
        }),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated assessment", entity: id });
    },
    completeAssessment: (id) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        assessments: s.assessments.map(a => {
          if (a.id !== id) return a;
          const audit = [
            ...(a.auditTrail || []),
            { id: uid(), action: "completed" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
            { id: uid(), action: "locked" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
          ];
          return {
            ...a, status: "completed", locked: true,
            lockedAt: now, lockedBy: currentUserName,
            nextReassessmentDate: a.nextReassessmentDate || (a.reviewFrequency ? computeNextReviewDate(a.reviewFrequency, a.customReviewDays) : undefined),
            auditTrail: audit,
          };
        }),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Completed & locked assessment", entity: id });
    },
    createAssessmentRevision: (id, reason) => {
      const prior = store.assessments.find(a => a.id === id);
      if (!prior) return undefined;
      const now = new Date().toISOString();
      const newId2 = uid();
      const revision: Assessment = {
        ...prior, id: newId2,
        status: "draft", locked: false,
        version: (prior.version || 1) + 1,
        previousVersionId: prior.id,
        supersedesId: prior.id,
        revisionReason: reason,
        date: now,
        assessor: currentUserName, assessorRole: currentRole,
        lockedAt: undefined, lockedBy: undefined,
        auditTrail: [
          { id: uid(), action: "created", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason, fromVersionId: prior.id },
        ],
        clinicalComments: [],
      };
      setStore(s => ({
        ...s,
        assessments: [revision, ...s.assessments.map(a => a.id === id
          ? {
              ...a, supersededById: newId2,
              auditTrail: [
                ...(a.auditTrail || []),
                { id: uid(), action: "revised" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason },
                { id: uid(), action: "superseded" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
              ],
            }
          : a),
        ],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Created assessment revision", entity: newId2, reason });
      return revision;
    },
    assignAssessment: (id, input) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        assessments: s.assessments.map(a => a.id === id
          ? {
              ...a,
              assignedToUserId: input.userId, assignedToName: input.userName, assignedToRole: input.role,
              assignedAt: now, assignedBy: currentUserName, dueDate: input.dueDate,
              auditTrail: [
                ...(a.auditTrail || []),
                { id: uid(), action: "assigned" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason: `Assigned to ${input.userName} (${input.role}), due ${input.dueDate}` },
              ],
            }
          : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: `Assigned assessment to ${input.userName}`, entity: id });
    },
    archiveAssessment: (id, reason) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        assessments: s.assessments.map(a => a.id === id
          ? {
              ...a, status: "archived", archivedBy: currentUserName, archivedAt: now, archivedReason: reason,
              auditTrail: [
                ...(a.auditTrail || []),
                { id: uid(), action: "archived" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason },
              ],
            }
          : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Archived assessment", entity: id, reason });
    },
    restoreAssessment: (id) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        assessments: s.assessments.map(a => a.id === id
          ? {
              ...a, status: "completed", restoredBy: currentUserName, restoredAt: now,
              archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined,
              auditTrail: [
                ...(a.auditTrail || []),
                { id: uid(), action: "restored" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
              ],
            }
          : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Restored assessment", entity: id });
    },
    softDeleteAssessment: (id, reason) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s, assessments: s.assessments.map(a => a.id === id
          ? {
              ...a, status: "deleted", deletedBy: currentUserName, deletedAt: now, deletedReason: reason,
              auditTrail: [
                ...(a.auditTrail || []),
                { id: uid(), action: "deleted" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason },
              ],
            }
          : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted assessment (soft)", entity: id, reason });
    },
    addAssessmentComment: (id, body) => {
      const now = new Date().toISOString();
      const comment: AssessmentComment = {
        id: uid(), authorId: currentUser.id, authorName: currentUserName, role: currentRole, at: now, body,
      };
      setStore(s => ({
        ...s,
        assessments: s.assessments.map(a => a.id === id
          ? {
              ...a,
              clinicalComments: [...(a.clinicalComments || []), comment],
              auditTrail: [
                ...(a.auditTrail || []),
                { id: uid(), action: "commented" as const, byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now },
              ],
            }
          : a),
      }));
    },
    fireReviewTrigger: (input) => {
      const affected = TRIGGER_TO_TYPES[input.trigger] || [];
      const ev: AssessmentReviewTriggerEvent = {
        id: uid(), residentId: input.residentId, trigger: input.trigger,
        sourceModule: input.sourceModule, sourceRecordId: input.sourceRecordId,
        at: new Date().toISOString(), byUserName: currentUserName,
        affectedAssessmentTypes: affected, note: input.note,
      };
      setStore(s => ({ ...s, assessmentTriggerEvents: [ev, ...s.assessmentTriggerEvents] }));
      // Find latest completed assessments matching trigger types and queue alerts
      const resident = store.residents.find(r => r.id === input.residentId);
      const residentName = resident ? `${resident.firstName} ${resident.lastName}` : "Resident";
      for (const t of affected) {
        const latest = store.assessments.find(a => a.residentId === input.residentId && a.type === t && a.status === "completed");
        if (latest) {
          setStore(s => ({
            ...s,
            alerts: [{
              id: uid(), residentId: input.residentId,
              title: `${t.replace("_", " ")} reassessment required`,
              description: `${input.trigger.replace(/_/g, " ")} → reassess ${t.replace("_", " ")} for ${residentName}`,
              priority: "high" as const,
              createdAt: new Date().toISOString(), acknowledged: false,
              linkedAssessmentId: latest.id,
            }, ...s.alerts],
          }));
        }
      }
      logAudit({ user: currentUserName, role: currentRole, action: `Triggered reassessment: ${input.trigger}`, entity: input.residentId, reason: input.note });
    },
    addCarePlan: (c) => {
      const item: CarePlan = { ...c, id: uid(), createdAt: new Date().toISOString(), createdBy: currentUserName, version: c.version || 1, status: c.status || "active" };
      setStore(s => ({ ...s, carePlans: [item, ...s.carePlans] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Created care plan", entity: item.id });
      return item;
    },
    updateCarePlan: (id, patch) => {
      setStore(s => ({ ...s, carePlans: s.carePlans.map(c => c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : c) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated care plan", entity: id });
    },
    reviseCarePlan: (id, reason) => {
      const prior = store.carePlans.find(c => c.id === id);
      if (!prior) return undefined;
      const newPlan: CarePlan = {
        ...prior, id: uid(), version: (prior.version || 1) + 1,
        supersedesId: prior.id, revisionReason: reason,
        createdAt: new Date().toISOString(), createdBy: currentUserName, status: "active",
      };
      setStore(s => ({
        ...s,
        carePlans: [newPlan, ...s.carePlans.map(c => c.id === id ? { ...c, status: "superseded" as const } : c)],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Revised care plan", entity: id, reason });
      return newPlan;
    },
    addCarePlanEvaluation: (e) => {
      const item: CarePlanEvaluation = { ...e, id: uid() };
      setStore(s => ({ ...s, carePlanEvaluations: [item, ...s.carePlanEvaluations] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Care plan evaluation", entity: e.carePlanId });
      return item;
    },
    addCarePlanReview: (r) => {
      const item: CarePlanReview = { ...r, id: uid() };
      setStore(s => ({ ...s, carePlanReviews: [item, ...s.carePlanReviews] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Care plan review", entity: r.carePlanId });
      return item;
    },
    addCarePlanFromTemplate: (templateId, residentId, assessment) => {
      const t = store.carePlanTemplates.find(x => x.id === templateId);
      if (!t) return undefined;
      const now = new Date();
      const dayStr = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);
      const goals = t.smartGoals.map((g, i) => ({
        id: `g-${uid()}-${i}`, title: g.title, description: g.description,
        priority: g.priority, status: "not_started" as const,
        targetDate: dayStr(g.targetDays), expectedOutcome: g.description,
      }));
      const interventionsSpec = t.interventions.map((it, i) => ({
        id: `i-${uid()}-${i}`, name: it.name, description: it.description,
        frequency: it.frequency, assignedRole: it.assignedRole,
        startDate: dayStr(0), reviewDate: dayStr(t.reviewFrequencyDays),
        priority: it.priority, status: "pending" as const,
      }));
      const outcomeMeasures = t.outcomeMeasures.map((o, i) => ({
        id: `o-${uid()}-${i}`, name: o.name, target: o.target, dateMeasured: dayStr(0),
        trend: "stable" as const,
      }));
      const newPlan: CarePlan = {
        id: uid(), residentId, title: t.title, category: t.category,
        problem: t.problemStatement,
        problemStatement: t.problemStatement,
        goal: t.smartGoals[0]?.description || "Address identified needs.",
        identifiedNeeds: t.identifiedNeeds,
        interventions: t.interventions.map(i => `${i.name} (${i.frequency})`),
        goals, interventionsSpec, outcomeMeasures,
        assignedStaff: "Care team", frequency: t.interventions[0]?.frequency || "Per care plan",
        reviewDate: dayStr(t.reviewFrequencyDays),
        evaluationDate: dayStr(t.evaluationFrequencyDays),
        status: "active",
        priority: assessment?.riskLevel === "very_high" ? "critical"
          : assessment?.riskLevel === "high" ? "high" : "medium",
        createdAt: now.toISOString(), createdBy: currentUserName,
        version: 1, templateId,
        linkedAssessmentId: assessment?.id,
        assessmentScoreSnapshot: assessment ? {
          type: assessment.type, totalScore: assessment.totalScore,
          riskLevel: assessment.riskLevel, date: assessment.date,
          interpretation: assessment.interpretation,
        } : undefined,
      };
      setStore(s => ({ ...s, carePlans: [newPlan, ...s.carePlans] }));
      logAudit({ user: currentUserName, role: currentRole, action: `Created care plan from template '${t.title}'`, entity: newPlan.id });
      return newPlan;
    },
    saveCarePlanTemplate: (t) => {
      setStore(s => ({
        ...s,
        carePlanTemplates: s.carePlanTemplates.some(x => x.id === t.id)
          ? s.carePlanTemplates.map(x => x.id === t.id ? t : x)
          : [...s.carePlanTemplates, t],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: `Saved template '${t.title}'`, entity: t.id });
    },
    deleteCarePlanTemplate: (id) => {
      setStore(s => ({ ...s, carePlanTemplates: s.carePlanTemplates.filter(t => t.id !== id || t.builtIn) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted template", entity: id });
    },
    addInterventionLog: (l) => {
      const item: InterventionLog = { ...l, id: uid() };
      setStore(s => ({ ...s, interventionLogs: [item, ...s.interventionLogs] }));
      logAudit({ user: currentUserName, role: currentRole, action: `Logged intervention: ${l.outcome}`, entity: l.carePlanId });
      return item;
    },
    recordReadReceipt: (entityType, entityId) => {
      setStore(s => {
        // dedupe per user per entity
        const exists = s.readReceipts.find(r => r.entityId === entityId && r.userId === currentUser.id);
        if (exists) return s;
        const item: ReadReceipt = {
          id: uid(), entityType, entityId,
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          timestamp: new Date().toISOString(),
        };
        return { ...s, readReceipts: [item, ...s.readReceipts] };
      });
    },
    addIntervention: (i) => { const item = { ...i, id: uid() }; setStore(s => ({ ...s, interventions: [item, ...s.interventions] })); return item; },
    addNote: (n) => { const item = { ...n, id: uid() }; setStore(s => ({ ...s, notes: [item, ...s.notes] })); return item; },
    addEvaluation: (e) => { const item = { ...e, id: uid() }; setStore(s => ({ ...s, evaluations: [item, ...s.evaluations] })); return item; },
    acknowledgeAlert: (id) => setStore(s => ({ ...s, alerts: s.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a) })),
    addAlert: (a) => setStore(s => ({ ...s, alerts: [{ ...a, id: uid(), createdAt: new Date().toISOString(), acknowledged: false }, ...s.alerts] })),
    updateTask: (id, patch) => setStore(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t) })),
    addTask: (t) => { const item = { ...t, id: uid() }; setStore(s => ({ ...s, tasks: [item, ...s.tasks] })); return item; },
    // -------------------- INCIDENTS --------------------
    addIncident: (i) => {
      const item: Incident = {
        ...i, id: uid(),
        recordStatus: i.recordStatus || "active",
        createdAt: i.createdAt || new Date().toISOString(),
        createdBy: i.createdBy || currentUserName,
        createdByRole: i.createdByRole || currentRole,
        status: i.status || "open",
      };
      const ev: TimelineEvent = { id: uid(), residentId: i.residentId, type: "incident.created", title: `Incident: ${i.type.replace("_", " ")} (${i.severity})`, description: i.description, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "incident", priority: i.severity === "critical" ? "critical" : i.severity === "high" ? "high" : "medium" };
      setStore(s => ({ ...s, incidents: [item, ...s.incidents], timelineEvents: [ev, ...s.timelineEvents] }));
      logAudit({ user: currentUserName, role: currentRole, action: `Created incident (${item.status})`, entity: item.id, after: JSON.stringify({ type: i.type, severity: i.severity }) });
      return item;
    },
    updateIncident: (id, patch) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated incident", entity: id, after: JSON.stringify(patch) });
    },
    archiveIncident: (id) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, recordStatus: "archived" as const, archivedAt: new Date().toISOString(), archivedBy: currentUserName } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Archived incident", entity: id });
    },
    restoreIncident: (id) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, recordStatus: "active" as const, archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Restored incident", entity: id });
    },
    softDeleteIncident: (id, reason) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, recordStatus: "deleted" as const, deletedAt: new Date().toISOString(), deletedBy: currentUserName, deletedReason: reason } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted incident (soft)", entity: id, reason });
    },
    duplicateIncident: (id) => {
      const src = store.incidents.find(i => i.id === id);
      if (!src) return undefined;
      const copy: Incident = { ...src, id: uid(), date: new Date().toISOString().slice(0, 10), status: "draft", recordStatus: "active", createdAt: new Date().toISOString(), createdBy: currentUserName, createdByRole: currentRole, updatedAt: undefined, updatedBy: undefined, archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined, closedAt: undefined, closedBy: undefined, reopenedAt: undefined, reopenedBy: undefined };
      setStore(s => ({ ...s, incidents: [copy, ...s.incidents] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Duplicated incident", entity: copy.id, reason: `Copied from ${id}` });
      return copy;
    },
    closeIncident: (id) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, status: "closed" as const, closedAt: new Date().toISOString(), closedBy: currentUserName } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Closed incident", entity: id });
    },
    reopenIncident: (id) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, status: "open" as const, reopenedAt: new Date().toISOString(), reopenedBy: currentUserName, closedAt: undefined, closedBy: undefined } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Reopened incident", entity: id });
    },
    submitIncident: (id) => {
      setStore(s => ({ ...s, incidents: s.incidents.map(i => i.id === id ? { ...i, status: "open" as const, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : i) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Submitted incident draft", entity: id });
    },

    addMDTNote: (m) => { const item = { ...m, id: uid() }; setStore(s => ({ ...s, mdtNotes: [item, ...s.mdtNotes] })); return item; },

    // -------------------- VISITORS --------------------
    addVisitor: (v) => {
      const item: Visitor = { ...v, id: uid(), recordStatus: v.recordStatus || "active", status: v.status || "checked_in", createdAt: v.createdAt || new Date().toISOString(), createdBy: v.createdBy || currentUserName, createdByRole: v.createdByRole || currentRole };
      const ev: TimelineEvent = { id: uid(), residentId: v.residentId, type: "visitor.logged", title: `Visitor: ${v.visitorName} (${v.relationship})`, description: v.notes, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "visitor" };
      setStore(s => ({ ...s, visitors: [item, ...s.visitors], timelineEvents: [ev, ...s.timelineEvents] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Created visitor", entity: item.id, after: JSON.stringify({ visitor: v.visitorName }) });
      return item;
    },
    updateVisitor: (id, patch) => {
      setStore(s => ({ ...s, visitors: s.visitors.map(v => v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : v) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated visitor", entity: id, after: JSON.stringify(patch) });
    },
    archiveVisitor: (id) => {
      setStore(s => ({ ...s, visitors: s.visitors.map(v => v.id === id ? { ...v, recordStatus: "archived" as const, archivedAt: new Date().toISOString(), archivedBy: currentUserName } : v) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Archived visitor", entity: id });
    },
    restoreVisitor: (id) => {
      setStore(s => ({ ...s, visitors: s.visitors.map(v => v.id === id ? { ...v, recordStatus: "active" as const, archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined } : v) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Restored visitor", entity: id });
    },
    softDeleteVisitor: (id, reason) => {
      setStore(s => ({ ...s, visitors: s.visitors.map(v => v.id === id ? { ...v, recordStatus: "deleted" as const, deletedAt: new Date().toISOString(), deletedBy: currentUserName, deletedReason: reason } : v) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted visitor (soft)", entity: id, reason });
    },
    cancelVisitor: (id, reason) => {
      setStore(s => ({ ...s, visitors: s.visitors.map(v => v.id === id ? { ...v, status: "cancelled" as const, cancelledReason: reason, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : v) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Cancelled visit", entity: id, reason });
    },
    completeVisitor: (id) => {
      setStore(s => ({ ...s, visitors: s.visitors.map(v => v.id === id ? { ...v, status: "completed" as const, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : v) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Completed visit", entity: id });
    },

    // -------------------- OUTINGS --------------------
    addOuting: (o) => {
      const item: Outing = { ...o, id: uid(), recordStatus: o.recordStatus || "active", status: o.status || "planned", createdAt: o.createdAt || new Date().toISOString(), createdBy: o.createdBy || currentUserName, createdByRole: o.createdByRole || currentRole };
      const ev: TimelineEvent = { id: uid(), residentId: o.residentId, type: "outing.started", title: `Outing: ${o.destination}`, description: o.notes, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "outing" };
      setStore(s => ({ ...s, outings: [item, ...s.outings], timelineEvents: [ev, ...s.timelineEvents] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Created outing", entity: item.id, after: JSON.stringify({ destination: o.destination }) });
      return item;
    },
    updateOuting: (id, patch) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated outing", entity: id, after: JSON.stringify(patch) });
    },
    archiveOuting: (id) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, recordStatus: "archived" as const, archivedAt: new Date().toISOString(), archivedBy: currentUserName } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Archived outing", entity: id });
    },
    restoreOuting: (id) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, recordStatus: "active" as const, archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Restored outing", entity: id });
    },
    softDeleteOuting: (id, reason) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, recordStatus: "deleted" as const, deletedAt: new Date().toISOString(), deletedBy: currentUserName, deletedReason: reason } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted outing (soft)", entity: id, reason });
    },
    recordOutingDeparture: (id, time) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, departureTime: time, status: "departed" as const, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: `Outing departure recorded (${time})`, entity: id });
    },
    recordOutingReturn: (id, time, outcome) => {
      setStore(s => {
        const o = s.outings.find(x => x.id === id);
        const ev: TimelineEvent | null = o ? { id: uid(), residentId: o.residentId, type: "outing.returned", title: `Outing return: ${o.destination}`, description: outcome, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: id, linkedRecordKind: "outing" } : null;
        return {
          ...s,
          outings: s.outings.map(x => x.id === id ? { ...x, returnTime: time, outcomeNotes: outcome ?? x.outcomeNotes, status: "returned" as const, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : x),
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
        };
      });
      logAudit({ user: currentUserName, role: currentRole, action: `Outing return recorded (${time})`, entity: id });
    },
    cancelOuting: (id, reason) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, status: "cancelled" as const, cancelledReason: reason, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Cancelled outing", entity: id, reason });
    },
    closeOuting: (id) => {
      setStore(s => ({ ...s, outings: s.outings.map(o => o.id === id ? { ...o, status: "closed" as const, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : o) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Closed outing", entity: id });
    },

    // -------------------- HANDOVERS --------------------
    addHandover: (h) => {
      const item: HandoverNote = { ...h, id: uid(), recordStatus: h.recordStatus || "active", status: h.status || "open", createdAt: h.createdAt || new Date().toISOString(), createdBy: h.createdBy || currentUserName, createdByRole: h.createdByRole || currentRole };
      const ev: TimelineEvent = { id: uid(), residentId: h.residentId, type: "handover.created", title: `Handover (${h.shift})`, description: h.summary, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "handover", priority: h.priority };
      setStore(s => ({ ...s, handovers: [item, ...s.handovers], timelineEvents: [ev, ...s.timelineEvents] }));
      logAudit({ user: currentUserName, role: currentRole, action: `Created handover (${item.shift})`, entity: item.id });
      return item;
    },
    updateHandover: (id, patch) => {
      setStore(s => ({ ...s, handovers: s.handovers.map(h => h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : h) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated handover", entity: id, after: JSON.stringify(patch) });
    },
    archiveHandover: (id) => {
      setStore(s => ({ ...s, handovers: s.handovers.map(h => h.id === id ? { ...h, recordStatus: "archived" as const, archivedAt: new Date().toISOString(), archivedBy: currentUserName } : h) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Archived handover", entity: id });
    },
    restoreHandover: (id) => {
      setStore(s => ({ ...s, handovers: s.handovers.map(h => h.id === id ? { ...h, recordStatus: "active" as const, archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined } : h) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Restored handover", entity: id });
    },
    softDeleteHandover: (id, reason) => {
      setStore(s => ({ ...s, handovers: s.handovers.map(h => h.id === id ? { ...h, recordStatus: "deleted" as const, deletedAt: new Date().toISOString(), deletedBy: currentUserName, deletedReason: reason } : h) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted handover (soft)", entity: id, reason });
    },
    acknowledgeHandover: (id) => {
      setStore(s => {
        const h = s.handovers.find(x => x.id === id);
        const ev: TimelineEvent | null = h ? { id: uid(), residentId: h.residentId, type: "handover.acknowledged", title: `Handover acknowledged (${h.shift})`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: id, linkedRecordKind: "handover" } : null;
        return {
          ...s,
          handovers: s.handovers.map(x => x.id === id ? { ...x, acknowledgedBy: currentUserName, acknowledgedAt: new Date().toISOString(), status: "acknowledged" as const } : x),
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
        };
      });
      logAudit({ user: currentUserName, role: currentRole, action: "Acknowledged handover", entity: id });
    },
    completeHandover: (id) => {
      setStore(s => ({ ...s, handovers: s.handovers.map(h => h.id === id ? { ...h, status: "completed" as const, completedAt: new Date().toISOString(), completedBy: currentUserName } : h) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Completed handover", entity: id });
    },
    closeHandover: (id) => {
      setStore(s => ({ ...s, handovers: s.handovers.map(h => h.id === id ? { ...h, status: "closed" as const, closedAt: new Date().toISOString(), closedBy: currentUserName } : h) }));
      logAudit({ user: currentUserName, role: currentRole, action: "Closed handover", entity: id });
    },
    duplicateHandover: (id) => {
      const src = store.handovers.find(h => h.id === id);
      if (!src) return undefined;
      const copy: HandoverNote = { ...src, id: uid(), date: new Date().toISOString().slice(0, 10), status: "open", recordStatus: "active", createdAt: new Date().toISOString(), createdBy: currentUserName, createdByRole: currentRole, acknowledgedAt: undefined, acknowledgedBy: undefined, completedAt: undefined, completedBy: undefined, closedAt: undefined, closedBy: undefined, archivedAt: undefined, archivedBy: undefined, deletedAt: undefined, deletedBy: undefined, deletedReason: undefined, updatedAt: undefined, updatedBy: undefined };
      setStore(s => ({ ...s, handovers: [copy, ...s.handovers] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Duplicated handover", entity: copy.id, reason: `Copied from ${id}` });
      return copy;
    },
    addObservation: (o) => {
      const item: Observation = { ...o, id: uid() };
      const ev: TimelineEvent = { id: uid(), residentId: o.residentId, type: "chart.observation", title: "Observation recorded", description: o.comments || o.behaviour, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "observation" };
      setStore(s => ({ ...s, observations: [item, ...s.observations], timelineEvents: [ev, ...s.timelineEvents] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Recorded observation", entity: o.residentId });
      return item;
    },
    addWeight: (w) => {
      const item: WeightRecord = { ...w, id: uid() };
      const ev: TimelineEvent = { id: uid(), residentId: w.residentId, type: "chart.weight", title: `Weight ${w.weightKg} kg`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "weight" };
      // Auto alert: >5% loss vs earliest in last 90 days
      const prior = store.weights.filter(x => x.residentId === w.residentId);
      const baseline = prior.length ? prior[prior.length - 1].weightKg : w.weightKg;
      const pct = baseline ? ((baseline - w.weightKg) / baseline) * 100 : 0;
      let newAlerts: Alert[] = [];
      if (pct >= 5) newAlerts.push({ id: uid(), residentId: w.residentId, title: `Weight loss ${pct.toFixed(1)}%`, description: `From ${baseline}kg → ${w.weightKg}kg`, priority: pct >= 10 ? "critical" : "high", createdAt: new Date().toISOString(), acknowledged: false });
      setStore(s => ({ ...s, weights: [item, ...s.weights], timelineEvents: [ev, ...s.timelineEvents], alerts: [...newAlerts, ...s.alerts] }));
      return item;
    },
    addFluid: (f) => {
      const item: FluidRecord = { ...f, id: uid() };
      setStore(s => {
        const totalToday = [item, ...s.fluids].filter(x => x.residentId === f.residentId && x.date === f.date).reduce((sum, x) => sum + x.amountMl, 0);
        let newAlerts: Alert[] = [];
        const dayDone = new Date(f.date).getTime() < new Date().setHours(0, 0, 0, 0);
        if (dayDone && totalToday < 1200 && !s.alerts.some(a => a.residentId === f.residentId && a.title.includes("Hydration") && !a.acknowledged)) {
          newAlerts.push({ id: uid(), residentId: f.residentId, title: "Hydration below target", description: `${totalToday}ml on ${f.date}`, priority: "high", createdAt: new Date().toISOString(), acknowledged: false });
        }
        const ev: TimelineEvent = { id: uid(), residentId: f.residentId, type: "chart.fluid", title: `Fluid ${f.amountMl}ml ${f.type}`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "fluid" };
        return { ...s, fluids: [item, ...s.fluids], timelineEvents: [ev, ...s.timelineEvents], alerts: [...newAlerts, ...s.alerts] };
      });
      return item;
    },
    addFood: (f) => {
      const item: FoodRecord = { ...f, id: uid() };
      setStore(s => {
        const recent = [item, ...s.foods].filter(x => x.residentId === f.residentId).slice(0, 3);
        const allPoor = recent.length >= 3 && recent.every(x => x.intake === "little" || x.intake === "none");
        let newAlerts: Alert[] = [];
        if (allPoor && !s.alerts.some(a => a.residentId === f.residentId && a.title.includes("Nutrition") && !a.acknowledged)) {
          newAlerts.push({ id: uid(), residentId: f.residentId, title: "Nutrition concern", description: "3 consecutive poor intakes", priority: "high", createdAt: new Date().toISOString(), acknowledged: false });
        }
        const ev: TimelineEvent = { id: uid(), residentId: f.residentId, type: "chart.food", title: `${f.meal}: ${f.intake}`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "food" };
        return { ...s, foods: [item, ...s.foods], timelineEvents: [ev, ...s.timelineEvents], alerts: [...newAlerts, ...s.alerts] };
      });
      return item;
    },
    addPain: (p) => {
      const item: PainRecord = { ...p, id: uid() };
      setStore(s => {
        const last = s.pains.filter(x => x.residentId === p.residentId).slice(0, 2);
        let newAlerts: Alert[] = [];
        if (p.score >= 7 || (last[0] && p.score > last[0].score + 2)) {
          newAlerts.push({ id: uid(), residentId: p.residentId, title: `Pain ${p.score}/10`, description: p.location ? `Location: ${p.location}` : "Pain escalation", priority: p.score >= 8 ? "critical" : "high", createdAt: new Date().toISOString(), acknowledged: false });
        }
        const ev: TimelineEvent = { id: uid(), residentId: p.residentId, type: "chart.pain", title: `Pain ${p.score}/10`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "pain" };
        return { ...s, pains: [item, ...s.pains], timelineEvents: [ev, ...s.timelineEvents], alerts: [...newAlerts, ...s.alerts] };
      });
      return item;
    },
    addSleep: (sl) => {
      const item: SleepRecord = { ...sl, id: uid() };
      const ev: TimelineEvent = { id: uid(), residentId: sl.residentId, type: "chart.sleep", title: `Sleep ${sl.hoursSlept}h (${sl.quality})`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "sleep" };
      setStore(s => ({ ...s, sleeps: [item, ...s.sleeps], timelineEvents: [ev, ...s.timelineEvents] }));
      return item;
    },
    addBowel: (b) => {
      const item: BowelRecord = { ...b, id: uid() };
      const ev: TimelineEvent = { id: uid(), residentId: b.residentId, type: "chart.bowel", title: `Bowel (Bristol ${b.bristolType})`, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "bowel" };
      setStore(s => ({ ...s, bowels: [item, ...s.bowels], timelineEvents: [ev, ...s.timelineEvents] }));
      return item;
    },
    addBehaviour: (b) => {
      const item: BehaviourRecord = { ...b, id: uid() };
      const ev: TimelineEvent = { id: uid(), residentId: b.residentId, type: "chart.behaviour", title: b.behaviour, description: b.intervention, createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole, linkedRecordId: item.id, linkedRecordKind: "behaviour" };
      setStore(s => ({ ...s, behaviours: [item, ...s.behaviours], timelineEvents: [ev, ...s.timelineEvents] }));
      return item;
    },
    addIncidentAction: (a) => {
      const item: IncidentAction = { ...a, id: uid() };
      setStore(s => ({ ...s, incidentActions: [item, ...s.incidentActions] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Incident follow-up action", entity: a.incidentId });
      return item;
    },
    generateShiftSummary: (date, shift) => {
      const dayNotes = store.notes.filter(n => n.date.slice(0, 10) === date && n.shift === shift);
      const dayInter = store.interventionLogs.filter(l => l.date === date && l.outcome === "completed");
      const dayTasks = store.tasks.filter(t => t.dueDate.slice(0, 10) === date && t.status === "completed");
      const dayInc = store.incidents.filter(i => i.date.slice(0, 10) === date);
      const dayAlerts = store.alerts.filter(a => a.createdAt.slice(0, 10) === date);
      const outstandingTasks = store.tasks.filter(t => t.status !== "completed").length;
      const outstandingHandovers = store.handovers.filter(h => h.status !== "acknowledged" && h.status !== "closed").length;
      const residentsSeen = new Set(dayNotes.map(n => n.residentId)).size;
      const item: ShiftSummary = {
        id: uid(), date, shift, generatedAt: new Date().toISOString(), generatedBy: currentUserName,
        residentsSeen, notesAdded: dayNotes.length,
        interventionsCompleted: dayInter.length, tasksCompleted: dayTasks.length,
        incidents: dayInc.length, alerts: dayAlerts.length,
        outstandingTasks, outstandingHandovers,
      };
      setStore(s => ({ ...s, shiftSummaries: [item, ...s.shiftSummaries] }));
      return item;
    },
    logAudit,

    // ============ Unified Care Plan / Problems ============
    ensureResidentCarePlan: (residentId) => {
      const existing = store.residentCarePlans.find(p => p.residentId === residentId && p.status === "active");
      if (existing) return existing;
      const item: ResidentCarePlan = {
        id: newId("rcp"), residentId, status: "active",
        createdAt: new Date().toISOString(), createdBy: currentUserName,
      };
      setStore(s => ({ ...s, residentCarePlans: [item, ...s.residentCarePlans] }));
      logAudit({ user: currentUserName, role: currentRole, action: "Created resident care plan", entity: item.id });
      return item;
    },

    addProblem: (input) => {
      // ensure resident care plan exists
      let rcp = store.residentCarePlans.find(p => p.residentId === input.residentId && p.status === "active");
      let rcpId = rcp?.id;
      const newRcp: ResidentCarePlan | null = !rcp ? {
        id: newId("rcp"), residentId: input.residentId, status: "active",
        createdAt: new Date().toISOString(), createdBy: currentUserName,
      } : null;
      if (newRcp) rcpId = newRcp.id;

      const item: CarePlanProblem = {
        id: newId("prob"), residentCarePlanId: rcpId!, residentId: input.residentId,
        category: input.category, customCategoryLabel: input.customCategoryLabel,
        problemStatement: input.problemStatement, riskLevel: input.riskLevel,
        sourceAssessmentId: input.sourceAssessmentId, sourceAssessmentType: input.sourceAssessmentType,
        createdBy: currentUserName, createdAt: new Date().toISOString(),
        evaluationDate: input.evaluationDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        reviewDate: input.reviewDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        status: "active",
      };
      const hist: ProblemHistoryEntry = {
        id: newId("hist"), problemId: item.id, timestamp: item.createdAt,
        userId: currentUser.id, userName: currentUserName, role: currentRole,
        action: "created",
      };
      const ev: TimelineEvent = {
        id: newId("tle"), residentId: input.residentId, type: "careplan.created",
        title: `Care plan problem added: ${input.problemStatement.slice(0, 60)}`,
        createdAt: item.createdAt, createdBy: currentUserName, role: currentRole,
        linkedRecordId: item.id, linkedRecordKind: "care_plan_problem",
      };
      setStore(s => ({
        ...s,
        residentCarePlans: newRcp ? [newRcp, ...s.residentCarePlans] : s.residentCarePlans,
        carePlanProblems: [item, ...s.carePlanProblems],
        problemHistory: [hist, ...s.problemHistory],
        timelineEvents: [ev, ...s.timelineEvents],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Added care plan problem", entity: item.id });
      return item;
    },

    updateProblem: (id, patch, reason) => {
      const before = store.carePlanProblems.find(p => p.id === id);
      setStore(s => ({
        ...s,
        carePlanProblems: s.carePlanProblems.map(p => p.id === id ? { ...p, ...patch } : p),
        problemHistory: [{
          id: newId("hist"), problemId: id, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "updated", reason,
          oldValue: before ? JSON.stringify({ riskLevel: before.riskLevel, evaluationDate: before.evaluationDate, reviewDate: before.reviewDate }) : undefined,
          newValue: JSON.stringify(patch),
        }, ...s.problemHistory],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Updated care plan problem", entity: id, reason });
    },

    resolveProblem: (id, reason) => {
      const now = new Date().toISOString();
      const prob = store.carePlanProblems.find(p => p.id === id);
      setStore(s => ({
        ...s,
        carePlanProblems: s.carePlanProblems.map(p => p.id === id ? { ...p, status: "resolved" as const, resolvedAt: now, resolvedBy: currentUserName, resolvedReason: reason, riskLevel: "resolved" as const } : p),
        problemHistory: [{
          id: newId("hist"), problemId: id, timestamp: now,
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "resolved", reason,
        }, ...s.problemHistory],
        timelineEvents: prob ? [{
          id: newId("tle"), residentId: prob.residentId, type: "careplan.reviewed",
          title: `Problem resolved: ${prob.problemStatement.slice(0, 60)}`,
          createdAt: now, createdBy: currentUserName, role: currentRole,
          linkedRecordId: id, linkedRecordKind: "care_plan_problem",
        }, ...s.timelineEvents] : s.timelineEvents,
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Resolved problem", entity: id, reason });
    },

    reopenProblem: (id, reason) => {
      setStore(s => ({
        ...s,
        carePlanProblems: s.carePlanProblems.map(p => p.id === id ? { ...p, status: "active" as const, resolvedAt: undefined, resolvedBy: undefined, resolvedReason: undefined } : p),
        problemHistory: [{
          id: newId("hist"), problemId: id, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "reopened", reason,
        }, ...s.problemHistory],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Reopened problem", entity: id, reason });
    },

    archiveProblem: (id, reason) => {
      setStore(s => ({
        ...s,
        carePlanProblems: s.carePlanProblems.map(p => p.id === id ? { ...p, status: "archived" as const } : p),
        problemHistory: [{
          id: newId("hist"), problemId: id, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "archived", reason,
        }, ...s.problemHistory],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Archived problem", entity: id, reason });
    },

    addGoal: (problemId, statement, targetDate) => {
      const item: ProblemGoal = {
        id: newId("goal"), problemId, statement, targetDate,
        status: "active", createdAt: new Date().toISOString(), createdBy: currentUserName,
      };
      setStore(s => ({
        ...s,
        problemGoals: [item, ...s.problemGoals],
        problemHistory: [{
          id: newId("hist"), problemId, timestamp: item.createdAt,
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "goal_added", newValue: statement,
        }, ...s.problemHistory],
      }));
      return item;
    },

    updateGoal: (id, patch) => {
      setStore(s => ({
        ...s,
        problemGoals: s.problemGoals.map(g => g.id === id ? { ...g, ...patch } : g),
      }));
      const g = store.problemGoals.find(x => x.id === id);
      if (g) {
        setStore(s => ({
          ...s,
          problemHistory: [{
            id: newId("hist"), problemId: g.problemId, timestamp: new Date().toISOString(),
            userId: currentUser.id, userName: currentUserName, role: currentRole,
            action: "goal_edited", newValue: JSON.stringify(patch),
          }, ...s.problemHistory],
        }));
      }
    },

    removeGoal: (id) => {
      const g = store.problemGoals.find(x => x.id === id);
      setStore(s => ({
        ...s,
        problemGoals: s.problemGoals.filter(x => x.id !== id),
        problemHistory: g ? [{
          id: newId("hist"), problemId: g.problemId, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "goal_removed", oldValue: g.statement,
        }, ...s.problemHistory] : s.problemHistory,
      }));
    },

    addProblemIntervention: (input) => {
      const prob = store.carePlanProblems.find(p => p.id === input.problemId);
      const item: ProblemIntervention = {
        id: newId("int"), problemId: input.problemId,
        residentId: prob?.residentId || "",
        name: input.name, description: input.description,
        frequencyType: input.frequencyType, frequencyValue: input.frequencyValue,
        frequencyInstructions: input.frequencyInstructions,
        assignedRole: input.assignedRole, assignedStaffId: input.assignedStaffId,
        assignedStaffName: input.assignedStaffName,
        status: "active", createdAt: new Date().toISOString(), createdBy: currentUserName,
      };
      setStore(s => ({
        ...s,
        problemInterventions: [item, ...s.problemInterventions],
        problemHistory: [{
          id: newId("hist"), problemId: input.problemId, timestamp: item.createdAt,
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "intervention_added", newValue: input.name,
        }, ...s.problemHistory],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: `Added intervention: ${input.name}`, entity: input.problemId });
      return item;
    },

    updateProblemIntervention: (id, patch, reason) => {
      const before = store.problemInterventions.find(i => i.id === id);
      setStore(s => ({
        ...s,
        problemInterventions: s.problemInterventions.map(i => i.id === id ? { ...i, ...patch } : i),
        problemHistory: before ? [{
          id: newId("hist"), problemId: before.problemId, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: (patch.frequencyType || patch.frequencyValue || patch.frequencyInstructions) ? "frequency_changed" : "updated",
          reason, newValue: JSON.stringify(patch),
        }, ...s.problemHistory] : s.problemHistory,
      }));
    },

    discontinueProblemIntervention: (id, reason) => {
      const before = store.problemInterventions.find(i => i.id === id);
      setStore(s => ({
        ...s,
        problemInterventions: s.problemInterventions.map(i => i.id === id ? { ...i, status: "discontinued" as const } : i),
        problemHistory: before ? [{
          id: newId("hist"), problemId: before.problemId, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "intervention_removed", reason, oldValue: before.name,
        }, ...s.problemHistory] : s.problemHistory,
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Discontinued intervention", entity: id, reason });
    },

    // CHANGE 7 — fan-out to timeline + daily notes + audit
    logProblemIntervention: (input) => {
      const intv = store.problemInterventions.find(i => i.id === input.interventionId);
      if (!intv) throw new Error("Intervention not found");
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toTimeString().slice(0, 5);
      const hour = now.getHours();
      const shift: DailyNote["shift"] = hour < 14 ? "morning" : hour < 22 ? "afternoon" : "night";

      const noteId = newId("note");
      const logId = newId("plog");

      const note: DailyNote = {
        id: noteId, residentId: intv.residentId, date, staff: currentUserName, shift,
        observation: `${intv.name}: ${input.outcome.replace("_", " ")}${input.comments ? " — " + input.comments : ""}`,
        mood: "calm", foodIntake: "most", fluidIntake: "good", sleep: "good",
        behaviour: input.residentResponse || "",
        linkedCarePlanId: intv.problemId,
        linkedProblemId: intv.problemId,
        linkedInterventionId: intv.id,
        linkedInterventionLogId: logId,
      };

      const log: ProblemInterventionLog = {
        id: logId, interventionId: intv.id, problemId: intv.problemId, residentId: intv.residentId,
        date, time, staffId: currentUser.id, staffName: currentUserName, role: currentRole,
        outcome: input.outcome, residentResponse: input.residentResponse, comments: input.comments,
        linkedDailyNoteId: noteId,
      };

      const ev: TimelineEvent = {
        id: newId("tle"), residentId: intv.residentId, type: "intervention.logged",
        title: `${intv.name} — ${input.outcome.replace("_", " ")}`,
        description: input.comments,
        createdAt: now.toISOString(), createdBy: currentUserName, role: currentRole,
        linkedRecordId: log.id, linkedRecordKind: "problem_intervention_log",
      };

      const hist: ProblemHistoryEntry = {
        id: newId("hist"), problemId: intv.problemId, timestamp: now.toISOString(),
        userId: currentUser.id, userName: currentUserName, role: currentRole,
        action: "intervention_logged", newValue: `${intv.name}: ${input.outcome}`,
      };

      setStore(s => ({
        ...s,
        problemInterventionLogs: [log, ...s.problemInterventionLogs],
        notes: [note, ...s.notes],
        timelineEvents: [ev, ...s.timelineEvents],
        problemHistory: [hist, ...s.problemHistory],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: `Logged intervention: ${input.outcome}`, entity: log.id });
      return log;
    },

    addProblemEvaluation: (input) => {
      const item: ProblemEvaluation = {
        ...input,
        id: newId("eval"),
        date: input.date || new Date().toISOString(),
        evaluatorId: currentUser.id, evaluatorName: currentUserName, role: currentRole,
      };
      const prob = store.carePlanProblems.find(p => p.id === input.problemId);
      const ev: TimelineEvent | null = prob ? {
        id: newId("tle"), residentId: prob.residentId, type: "careplan.evaluated",
        title: `Evaluation: ${input.progress}`, description: input.summary,
        createdAt: item.date, createdBy: currentUserName, role: currentRole,
        linkedRecordId: item.id, linkedRecordKind: "problem_evaluation",
      } : null;
      setStore(s => ({
        ...s,
        problemEvaluations: [item, ...s.problemEvaluations],
        timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
        problemHistory: [{
          id: newId("hist"), problemId: input.problemId, timestamp: item.date,
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "evaluation_added", newValue: input.progress,
        }, ...s.problemHistory],
        // bump evaluation date
        carePlanProblems: input.nextEvaluationDate
          ? s.carePlanProblems.map(p => p.id === input.problemId ? { ...p, evaluationDate: input.nextEvaluationDate! } : p)
          : s.carePlanProblems,
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Added evaluation", entity: input.problemId });
      return item;
    },

    addProblemReview: (input) => {
      const item: ProblemReview = {
        ...input, id: newId("rev"),
        reviewedById: currentUser.id, reviewedByName: currentUserName, role: currentRole,
      };
      const prob = store.carePlanProblems.find(p => p.id === input.problemId);
      const ev: TimelineEvent | null = prob ? {
        id: newId("tle"), residentId: prob.residentId, type: "careplan.reviewed",
        title: `Review: ${input.outcome}`, description: input.comments,
        createdAt: new Date().toISOString(), createdBy: currentUserName, role: currentRole,
        linkedRecordId: item.id, linkedRecordKind: "problem_review",
      } : null;
      setStore(s => ({
        ...s,
        problemReviews: [item, ...s.problemReviews],
        timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
        problemHistory: [{
          id: newId("hist"), problemId: input.problemId, timestamp: new Date().toISOString(),
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "review_added", newValue: input.outcome,
        }, ...s.problemHistory],
        carePlanProblems: input.nextReviewDate
          ? s.carePlanProblems.map(p => p.id === input.problemId ? { ...p, reviewDate: input.nextReviewDate! } : p)
          : s.carePlanProblems,
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Added formal review", entity: input.problemId });
      return item;
    },

    acceptSuggestion: (id, edits) => {
      const sug = store.assessmentSuggestions.find(s => s.id === id);
      if (!sug) return undefined;
      // create problem via same logic as addProblem
      const rcp = store.residentCarePlans.find(p => p.residentId === sug.residentId && p.status === "active");
      let rcpId = rcp?.id;
      const newRcp: ResidentCarePlan | null = !rcp ? {
        id: newId("rcp"), residentId: sug.residentId, status: "active",
        createdAt: new Date().toISOString(), createdBy: currentUserName,
      } : null;
      if (newRcp) rcpId = newRcp.id;
      const problem: CarePlanProblem = {
        id: newId("prob"), residentCarePlanId: rcpId!, residentId: sug.residentId,
        category: edits?.category || sug.category,
        problemStatement: edits?.problemStatement || sug.problemStatement,
        riskLevel: edits?.riskLevel || sug.riskLevel,
        sourceAssessmentId: sug.assessmentId, sourceAssessmentType: sug.assessmentType,
        createdBy: currentUserName, createdAt: new Date().toISOString(),
        evaluationDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        reviewDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        status: "active",
      };
      setStore(s => ({
        ...s,
        residentCarePlans: newRcp ? [newRcp, ...s.residentCarePlans] : s.residentCarePlans,
        carePlanProblems: [problem, ...s.carePlanProblems],
        assessmentSuggestions: s.assessmentSuggestions.map(x => x.id === id ? {
          ...x, status: edits ? "edited" as const : "accepted" as const, acceptedAsProblemId: problem.id,
        } : x),
        problemHistory: [{
          id: newId("hist"), problemId: problem.id, timestamp: problem.createdAt,
          userId: currentUser.id, userName: currentUserName, role: currentRole,
          action: "created", reason: `Accepted from ${sug.assessmentType} assessment suggestion`,
        }, ...s.problemHistory],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Accepted assessment suggestion", entity: problem.id });
      return problem;
    },

    rejectSuggestion: (id, reason) => {
      setStore(s => ({
        ...s,
        assessmentSuggestions: s.assessmentSuggestions.map(x => x.id === id ? { ...x, status: "rejected" as const, rejectedReason: reason } : x),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Rejected assessment suggestion", entity: id, reason });
    },

    // ---------------- Vital Signs ----------------
    recordVital: (input) => {
      const now = new Date().toISOString();
      const recordedAt = input.recordedAt || now;
      const item: VitalSign = {
        ...input,
        id: uid(),
        recordedByUserId: currentUser.id,
        recordedByName: currentUserName,
        recordedByRole: currentRole,
        createdAt: now,
        recordedAt,
        auditTrail: [{
          id: uid(), action: "created", byUserId: currentUser.id, byUserName: currentUserName,
          byRole: currentRole, at: now,
        }],
      };
      // Derive new alerts (replace existing un-acknowledged alerts for this resident)
      const residentVitals = [item, ...store.vitals.filter(v => v.residentId === input.residentId)];
      const resident = store.residents.find(r => r.id === input.residentId);
      const seeds = derivedAlertsForResident(residentVitals, resident);
      const keepAlerts = store.clinicalAlerts.filter(a => a.residentId !== input.residentId || a.acknowledged);
      const newAlerts: ClinicalAlert[] = seeds.map((s, idx) => ({
        id: uid(), residentId: input.residentId,
        type: s.type, severity: s.severity, title: s.title, message: s.message, recommendation: s.recommendation,
        sourceVitalId: s.sourceVitalId, createdAt: now, acknowledged: false, escalations: [],
      }));
      // Timeline event
      const ev: TimelineEvent = {
        id: uid(), residentId: input.residentId, type: "intervention.logged",
        title: `Vital signs recorded`,
        description: `By ${currentUserName}`,
        linkedRecordId: item.id, linkedRecordKind: "observation" as any,
        createdAt: now, createdBy: currentUserName, role: currentRole,
      };
      setStore(s => ({
        ...s,
        vitals: [item, ...s.vitals],
        clinicalAlerts: [...newAlerts, ...keepAlerts],
        timelineEvents: [ev, ...s.timelineEvents],
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Recorded vital signs", entity: item.id });
      return item;
    },

    updateVital: (id, patch, reason) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        vitals: s.vitals.map(v => v.id === id ? {
          ...v, ...patch,
          modifiedAt: now, modifiedByUserId: currentUser.id, modifiedByName: currentUserName, modifiedReason: reason,
          auditTrail: [
            ...v.auditTrail,
            { id: uid(), action: "edited" as const, byUserId: currentUser.id, byUserName: currentUserName,
              byRole: currentRole, at: now, reason, patchSummary: Object.keys(patch).join(", ") },
          ],
        } : v),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Edited vital signs", entity: id, reason });
    },

    softDeleteVital: (id, reason) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        vitals: s.vitals.map(v => v.id === id ? {
          ...v, deletedAt: now, deletedByUserId: currentUser.id, deletedByName: currentUserName, deletedReason: reason,
          auditTrail: [
            ...v.auditTrail,
            { id: uid(), action: "deleted" as const, byUserId: currentUser.id, byUserName: currentUserName,
              byRole: currentRole, at: now, reason },
          ],
        } : v),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted vital signs", entity: id, reason });
    },

    setObservationPlan: (residentId, items) => {
      const now = new Date().toISOString();
      setStore(s => {
        const exists = s.observationPlans.some(p => p.residentId === residentId);
        const plan: ObservationPlan = { residentId, items, updatedAt: now, updatedByName: currentUserName };
        return {
          ...s,
          observationPlans: exists
            ? s.observationPlans.map(p => p.residentId === residentId ? plan : p)
            : [...s.observationPlans, plan],
        };
      });
      logAudit({ user: currentUserName, role: currentRole, action: "Updated observation plan", entity: residentId });
    },

    acknowledgeClinicalAlert: (id) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        clinicalAlerts: s.clinicalAlerts.map(a => a.id === id
          ? { ...a, acknowledged: true, acknowledgedBy: currentUserName, acknowledgedAt: now }
          : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Acknowledged clinical alert", entity: id });
    },

    dismissClinicalAlert: (id) => {
      setStore(s => ({
        ...s,
        clinicalAlerts: s.clinicalAlerts.map(a => a.id === id ? { ...a, dismissedAt: new Date().toISOString() } : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Dismissed clinical alert", entity: id });
    },

    addClinicalEscalationNote: (alertId, actionTaken) => {
      const now = new Date().toISOString();
      const note: ClinicalEscalationNote = {
        id: uid(), alertId, actionTaken,
        enteredByUserId: currentUser.id, enteredByName: currentUserName, enteredByRole: currentRole, at: now,
      };
      setStore(s => ({
        ...s,
        clinicalAlerts: s.clinicalAlerts.map(a => a.id === alertId
          ? { ...a, escalations: [...a.escalations, note] }
          : a),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Added escalation note", entity: alertId });
    },

    regenerateClinicalAlertsForResident: (residentId) => {
      const rv = store.vitals.filter(v => v.residentId === residentId);
      const resident = store.residents.find(r => r.id === residentId);
      const seeds = derivedAlertsForResident(rv, resident);
      const keep = store.clinicalAlerts.filter(a => a.residentId !== residentId || a.acknowledged);
      const newAlerts: ClinicalAlert[] = seeds.map(s => ({
        id: uid(), residentId,
        type: s.type, severity: s.severity, title: s.title, message: s.message, recommendation: s.recommendation,
        sourceVitalId: s.sourceVitalId, createdAt: new Date().toISOString(), acknowledged: false, escalations: [],
      }));
      setStore(s => ({ ...s, clinicalAlerts: [...newAlerts, ...keep] }));
    },

    // ---- Phase 7: Modular Clinical Observations ----
    recordObservation: (input) => {
      const now = new Date();
      const date = input.date ?? now.toISOString().slice(0, 10);
      const time = input.time ?? now.toTimeString().slice(0, 5);
      const recordedAt = new Date(`${date}T${time}:00`).toISOString();
      const item: ClinicalObservation = {
        id: uid(),
        residentId: input.residentId, kind: input.kind, date, time, recordedAt,
        data: input.data, notes: input.notes,
        recordedByUserId: currentUser.id, recordedByName: currentUserName, recordedByRole: currentRole,
        createdAt: now.toISOString(),
        auditTrail: [{ id: uid(), action: "created", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now.toISOString() }],
      };
      setStore(s => ({ ...s, clinicalObservations: [item, ...s.clinicalObservations] }));
      logAudit({ user: currentUserName, role: currentRole, action: `Recorded ${input.kind} observation`, entity: input.residentId });
      return item;
    },
    updateObservation: (id, patch, reason) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        clinicalObservations: s.clinicalObservations.map(o => o.id === id ? {
          ...o,
          data: patch.data ?? o.data,
          notes: patch.notes ?? o.notes,
          modificationReason: reason,
          modifiedAt: now, modifiedByName: currentUserName,
          auditTrail: [...o.auditTrail, { id: uid(), action: "edited", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason }],
        } : o),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Edited observation", entity: id, reason });
    },
    softDeleteObservation: (id, reason) => {
      const now = new Date().toISOString();
      setStore(s => ({
        ...s,
        clinicalObservations: s.clinicalObservations.map(o => o.id === id ? {
          ...o, deletedAt: now, deletedByName: currentUserName, deletedReason: reason,
          auditTrail: [...o.auditTrail, { id: uid(), action: "deleted", byUserId: currentUser.id, byUserName: currentUserName, byRole: currentRole, at: now, reason }],
        } : o),
      }));
      logAudit({ user: currentUserName, role: currentRole, action: "Deleted observation", entity: id, reason });
    },
    setObservationSchedule: (residentId, items) => {
      const now = new Date().toISOString();
      setStore(s => {
        const exists = s.observationSchedules.some(p => p.residentId === residentId);
        const sched: ObservationSchedule = { residentId, items, updatedAt: now, updatedByName: currentUserName };
        return {
          ...s,
          observationSchedules: exists
            ? s.observationSchedules.map(p => p.residentId === residentId ? sched : p)
            : [...s.observationSchedules, sched],
        };
      });
      logAudit({ user: currentUserName, role: currentRole, action: "Updated observation schedule", entity: residentId });
    },
  }), [store, logAudit, currentRole, currentUserName, currentUser, filter, filteredResidentIds, setCurrentRole]);


  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCare must be used within CareProvider");
  return ctx;
}

export function age(dob: string) {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
}

export function initials(first: string, last: string) {
  return (first[0] || "") + (last[0] || "");
}

// Helper: filter any array by residentId using current filter
export function useFilteredByResident<T extends { residentId?: string }>(items: T[]): T[] {
  const { filteredResidentIds, filter } = useCare();
  if (!filter.wingId && !filter.unitId && !filter.roomId && !filter.residentId && !filter.status) return items;
  const set = new Set(filteredResidentIds);
  return items.filter(i => i.residentId === undefined || set.has(i.residentId));
}
