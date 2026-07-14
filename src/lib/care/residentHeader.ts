import type { Bed, BedAssignment, Resident, Room, UserProfile, Ward } from "./types";
import { RLT_DEPENDENCY_LABELS, RLT_DEPENDENCY_LEVELS, type RltDependencyLevel, type RltDependencyState } from "./rltDependency";
import type { EndOfLifeState } from "./endOfLifePathway";
import type { ResidentContactsViewModel } from "./residentContacts";

export interface ResidentHeaderAllergySummary { allergyId: string; substance: string; reaction?: string; severity?: "mild" | "moderate" | "severe" | "life_threatening" | "unknown"; status: "active"; sourceRoute?: string; }
export interface ResidentProfessionalSummary { id: string; displayName: string; roleLabel?: string; phone?: string; email?: string; active: boolean; sourceRoute?: string; }
export interface ResidentContactSummary { contactId: string; displayName: string; relationship?: string; phone?: string; email?: string; nominatedRepresentative: boolean; powerOfAttorney?: boolean; sourceRoute?: string; }
export interface ResidentHeaderViewModel {
  residentId: string;
  nursingHomeId: string;
  photo?: { url?: string; altText: string; updatedAt?: string };
  identity: { legalFirstName: string; legalMiddleName?: string; legalLastName: string; preferredName?: string; displayName: string; legalDisplayName: string; dateOfBirth?: string; age?: number; residentNumber?: string };
  currentPlacement: { wardId?: string; wardName?: string; roomId?: string; roomLabel?: string; bedId?: string; bedLabel?: string; presenceStatus: "in_home" | "temporarily_absent" | "hospital" | "discharged" | "deceased" | "unknown" };
  allergies: ResidentHeaderAllergySummary[];
  allergyStatus: "active" | "no_known_allergies" | "not_recorded";
  advanceCare: { dnarStatus: "recorded" | "not_recorded" | "under_review" | "revoked" | "unknown"; advanceDirectiveStatus: "available" | "not_available" | "under_review" | "unknown"; treatmentEscalationPlanStatus?: "available" | "not_available" | "under_review" | "unknown"; sourceRecordIds: string[] };
  isolation: { status: "active" | "not_active" | "not_recorded"; active: boolean; type?: string; precautions?: string[]; startedAt?: string; reviewDate?: string };
  dependency: { summaryLabel: string; highestCurrentLevel?: RltDependencyLevel; domainsRecorded: number; domainsUnassessed: number };
  namedNurse?: ResidentProfessionalSummary;
  keyWorker?: ResidentProfessionalSummary;
  gp?: ResidentProfessionalSummary;
  primaryContact?: ResidentContactSummary;
  lifecycleStatus: string;
  updatedAt: string;
}

export interface ResidentHeaderData { residents: Resident[]; wards: Ward[]; rooms: Room[]; beds: Bed[]; bedAssignments: BedAssignment[]; users: UserProfile[]; dependencyState: RltDependencyState; endOfLifeState: EndOfLifeState; contacts?: ResidentContactsViewModel; }
export interface ResidentHeaderAuthorization { nursingHomeId: string; capabilities: string[]; generatedAt?: string; }

const clean = (value?: string) => value?.trim() || undefined;
const professional = (value: string | undefined, roleLabel: string, users: UserProfile[]): ResidentProfessionalSummary | undefined => { const name = clean(value); if (!name) return undefined; const user = users.find((item) => item.name === name && item.status === "active"); return { id: user?.id || `legacy:${roleLabel.toLowerCase().replace(/\s/g, "-")}:${name.toLowerCase().replace(/\s/g, "-")}`, displayName: name, roleLabel, phone: user?.phone, email: user?.email, active: Boolean(user || name), sourceRoute: "/profile" }; };
const presence = (resident: Resident): ResidentHeaderViewModel["currentPlacement"]["presenceStatus"] => resident.deceasedDate || resident.lifecycleStatus === "deceased" ? "deceased" : resident.lifecycleStatus === "discharged" ? "discharged" : resident.presenceStatus === "in_hospital" ? "hospital" : resident.presenceStatus === "temporarily_absent" ? "temporarily_absent" : resident.presenceStatus === "in_home" ? "in_home" : "unknown";

export function getResidentHeader(data: ResidentHeaderData, residentId: string, authorization: ResidentHeaderAuthorization): ResidentHeaderViewModel {
  if (!authorization.capabilities.includes("resident_profile.view")) throw new Error("Missing capability: resident_profile.view");
  const resident = data.residents.find((item) => item.id === residentId);
  if (!resident) throw new Error("Resident not found.");
  const homeId = resident.facilityId || authorization.nursingHomeId;
  if (homeId !== authorization.nursingHomeId) throw new Error("Resident is outside the authorised nursing home.");
  const assignment = data.bedAssignments.filter((item) => item.residentId === residentId && item.nursingHomeId === homeId && item.status === "active").sort((a, b) => (b.startDateTime || b.startDate).localeCompare(a.startDateTime || a.startDate))[0];
  const bed = assignment ? data.beds.find((item) => item.id === assignment.bedId) : undefined;
  const room = data.rooms.find((item) => item.id === (assignment?.roomId || bed?.roomId || resident.roomId));
  const ward = data.wards.find((item) => item.id === (assignment?.wardId || room?.wardId));
  const legalDisplayName = [resident.firstName, resident.middleName, resident.lastName].filter(Boolean).join(" ");
  const preferredName = clean(resident.preferredName);
  const displayName = preferredName ? `${preferredName} ${resident.lastName}` : legalDisplayName;
  const rawAllergies = clean(resident.allergies);
  const noKnown = Boolean(rawAllergies && /^(nka|nkda|no known allergies|none)$/i.test(rawAllergies));
  const allergies = !rawAllergies || noKnown ? [] : rawAllergies.split(/[;,]/).map((value, index) => ({ allergyId: `legacy-allergy:${resident.id}:${index + 1}`, substance: value.trim(), severity: "unknown" as const, status: "active" as const, sourceRoute: `/residents/${resident.id}?careSection=overview` })).filter((item) => item.substance);
  const dependencies = data.dependencyState.records.filter((item) => item.residentId === residentId && item.nursingHomeId === homeId && item.status === "current");
  const levels = [...new Set(dependencies.map((item) => item.dependencyLevel))];
  const highest = dependencies.map((item) => item.dependencyLevel).sort((a, b) => RLT_DEPENDENCY_LEVELS.indexOf(b) - RLT_DEPENDENCY_LEVELS.indexOf(a))[0];
  const dependencyLabel = !dependencies.length ? "Not Yet Recorded" : levels.length === 1 ? RLT_DEPENDENCY_LABELS[levels[0]] : "Varies by Activity of Living";
  const canAdvance = authorization.capabilities.includes("end_of_life.view_highly_sensitive");
  const decisions = canAdvance ? data.endOfLifeState.advanceDecisions.filter((item) => item.residentId === residentId && !["expired"].includes(item.status)) : [];
  const decisionStatus = (type: "dnar" | "advance_directive" | "treatment_escalation_plan") => { const record = decisions.find((item) => item.decisionType === type); return record?.status === "under_review" ? "under_review" : record?.status === "revoked" ? "revoked" : record ? "available" : undefined; };
  const dnar = canAdvance ? decisionStatus("dnar") : undefined;
  const advance = canAdvance ? decisionStatus("advance_directive") : undefined;
  const escalation = canAdvance ? decisionStatus("treatment_escalation_plan") : undefined;
  const primary = resident.nextOfKinList?.find((item) => item.primaryContact);
  return {
    residentId, nursingHomeId: homeId,
    photo: resident.photoUrl ? { url: resident.photoUrl, altText: `Portrait of ${displayName}`, updatedAt: resident.profileUpdatedAt } : { altText: `Portrait placeholder for ${displayName}` },
    identity: { legalFirstName: resident.firstName, legalMiddleName: resident.middleName, legalLastName: resident.lastName, preferredName, displayName, legalDisplayName, dateOfBirth: resident.dob, age: resident.dob ? Math.max(0, new Date().getFullYear() - new Date(resident.dob).getFullYear() - (new Date() < new Date(new Date().getFullYear(), new Date(resident.dob).getMonth(), new Date(resident.dob).getDate()) ? 1 : 0)) : undefined, residentNumber: authorization.capabilities.includes("resident_profile.view_sensitive_identifiers") ? resident.residentNumber || resident.externalResidentId : undefined },
    currentPlacement: { wardId: ward?.id, wardName: ward?.name, roomId: room?.id as string | undefined, roomLabel: room?.roomNumber || room?.number || resident.roomNumber || undefined, bedId: bed?.id, bedLabel: bed?.label, presenceStatus: presence(resident) },
    allergies, allergyStatus: allergies.length ? "active" : noKnown ? "no_known_allergies" : "not_recorded",
    advanceCare: { dnarStatus: !canAdvance ? "unknown" : dnar === "under_review" ? "under_review" : dnar === "revoked" ? "revoked" : dnar === "available" || resident.dnarStatus === "yes" ? "recorded" : resident.dnarStatus === "no" ? "not_recorded" : "unknown", advanceDirectiveStatus: !canAdvance ? "unknown" : advance === "under_review" ? "under_review" : advance === "available" ? "available" : "not_available", treatmentEscalationPlanStatus: !canAdvance ? "unknown" : escalation === "under_review" ? "under_review" : escalation === "available" ? "available" : "not_available", sourceRecordIds: decisions.map((item) => item.id) },
    isolation: { status: "not_recorded", active: false },
    dependency: { summaryLabel: dependencyLabel, highestCurrentLevel: highest, domainsRecorded: dependencies.length, domainsUnassessed: Math.max(0, 12 - dependencies.length) },
    namedNurse: professional(resident.keyWorkers?.namedNurse, "Named Nurse", data.users), keyWorker: professional(resident.keyWorkers?.keyWorker, "Key Worker", data.users), gp: data.contacts?.primary.gp ? { id: data.contacts.primary.gp.contactId, displayName: data.contacts.primary.gp.displayName, roleLabel: "GP", phone: data.contacts.primary.gp.phone || data.contacts.primary.gp.mobile, email: data.contacts.primary.gp.email, active: data.contacts.primary.gp.active, sourceRoute: data.contacts.primary.gp.route } : professional(resident.gp, "GP", data.users),
    primaryContact: data.contacts?.primary.firstContact ? { contactId: data.contacts.primary.firstContact.contactId, displayName: data.contacts.primary.firstContact.displayName, relationship: data.contacts.primary.firstContact.relationshipToResident, phone: data.contacts.primary.firstContact.mobile || data.contacts.primary.firstContact.phone, email: data.contacts.primary.firstContact.email, nominatedRepresentative: Boolean(data.contacts.primary.nominatedRepresentative?.contactId === data.contacts.primary.firstContact.contactId), powerOfAttorney: data.contacts.primary.firstContact.authorityLabel?.includes("Power of Attorney"), sourceRoute: data.contacts.primary.firstContact.route } : primary ? { contactId: primary.id, displayName: primary.name, relationship: primary.relationship, phone: primary.mobile || primary.phone, email: primary.email, nominatedRepresentative: primary.legalRepresentative, powerOfAttorney: primary.powerOfAttorney, sourceRoute: `/residents/${resident.id}?careSection=nok` } : undefined,
    lifecycleStatus: resident.lifecycleStatus || resident.residentType || resident.status,
    updatedAt: resident.profileUpdatedAt || resident.lifecycleUpdatedAt || resident.admissionDate || authorization.generatedAt || new Date().toISOString(),
  };
}

export const RESIDENT_HEADER_QUERY_KEY = (residentId: string, nursingHomeId: string, capabilityVersion: string) => ["resident-header", 1, residentId, nursingHomeId, capabilityVersion] as const;
