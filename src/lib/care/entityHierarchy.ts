import { z } from "zod";
import type {
  Bed,
  BedAssignment,
  Enterprise,
  Facility,
  Resident,
  Room,
  Ward,
} from "./types";
import {
  asBedAssignmentId,
  asBedId,
  asEnterpriseId,
  asNursingHomeId,
  asRoomId,
  asWardId,
  type BedId,
  type EnterpriseId,
  type NursingHomeId,
  type RoomId,
  type WardId,
} from "@/types/entityIds";

export const DEFAULT_ENTERPRISE_ID = asEnterpriseId("enterprise-default");
export const DEFAULT_ENTERPRISE_NAME = "NuCare Organisation";
const MIGRATION_TIMESTAMP = "2026-07-13T00:00:00.000Z";

export interface EntityHierarchyState {
  enterprises: Enterprise[];
  facilities: Facility[];
  wings: { id: string; facilityId?: string; name: string; floor?: string; kind: "wing" | "unit" }[];
  rooms: Room[];
  residents: Resident[];
  wards: Ward[];
  beds: Bed[];
  bedAssignments: BedAssignment[];
}

export interface MigrationCounts {
  enterprisesBefore: number;
  enterprisesAfter: number;
  nursingHomesBefore: number;
  nursingHomesAfter: number;
  wardsBefore: number;
  wardsAfter: number;
  roomsBefore: number;
  roomsAfter: number;
  bedsBefore: number;
  bedsAfter: number;
  bedAssignmentsBefore: number;
  bedAssignmentsAfter: number;
  residentsBefore: number;
  residentsAfter: number;
}

export interface EntityHierarchyMigrationResult<T extends EntityHierarchyState> {
  store: T;
  counts: MigrationCounts;
}

export const enterpriseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
});

export const nursingHomeSchema = z.object({
  id: z.string().min(1),
  enterpriseId: z.string().min(1),
  name: z.string().min(1),
});

export const wardSchema = z.object({
  id: z.string().min(1),
  nursingHomeId: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
});

export const roomSchema = z.object({
  id: z.string().min(1),
  wardId: z.string().min(1),
  name: z.string().optional(),
  number: z.string().optional(),
  roomNumber: z.string().optional(),
}).refine((room) => !!(room.name || room.number || room.roomNumber), {
  message: "Room requires a name, number, or roomNumber.",
});

export const bedSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  label: z.string().min(1),
  active: z.boolean(),
});

export const bedAssignmentSchema = z.object({
  id: z.string().min(1),
  bedId: z.string().min(1),
  residentId: z.string().min(1),
  nursingHomeId: z.string().min(1),
  startDate: z.string().min(1),
  status: z.enum(["active", "ended"]),
});

const nursingHomeIdForFacility = (facilityId: string) => asNursingHomeId(facilityId);
const defaultWardId = (nursingHomeId: NursingHomeId) => asWardId(`ward-default-${nursingHomeId}`);
const roomWardId = (room: Room, fallbackFacilityId: string) =>
  defaultWardId(nursingHomeIdForFacility(room.facilityId || fallbackFacilityId));
const defaultBedId = (roomId: string, bedNumber: number) => asBedId(`bed-${roomId}-${bedNumber}`);
const defaultAssignmentId = (residentId: string) => asBedAssignmentId(`bed-assignment-${residentId}`);

export function migrateEntityHierarchy<T extends EntityHierarchyState>(
  source: T,
  defaultFacilityId: string,
): EntityHierarchyMigrationResult<T> {
  const before: MigrationCounts = {
    enterprisesBefore: source.enterprises?.length || 0,
    enterprisesAfter: 0,
    nursingHomesBefore: source.facilities.length,
    nursingHomesAfter: 0,
    wardsBefore: source.wards?.length || 0,
    wardsAfter: 0,
    roomsBefore: source.rooms.length,
    roomsAfter: 0,
    bedsBefore: source.beds?.length || 0,
    bedsAfter: 0,
    bedAssignmentsBefore: source.bedAssignments?.length || 0,
    bedAssignmentsAfter: 0,
    residentsBefore: source.residents.length,
    residentsAfter: 0,
  };

  const enterprises = (source.enterprises?.length ? source.enterprises : [
    {
      id: DEFAULT_ENTERPRISE_ID,
      name: DEFAULT_ENTERPRISE_NAME,
      active: true,
      createdAt: MIGRATION_TIMESTAMP,
      updatedAt: MIGRATION_TIMESTAMP,
    },
  ]).map((enterprise) => ({ ...enterprise, active: enterprise.active !== false }));

  const facilities = source.facilities.map((facility) => ({
    ...facility,
    enterpriseId: facility.enterpriseId || enterprises[0].id,
    updatedAt: facility.updatedAt || facility.createdAt || MIGRATION_TIMESTAMP,
  }));

  const existingWards = source.wards || [];
  const wardsByHome = new Map<string, Ward[]>();
  for (const ward of existingWards) {
    const list = wardsByHome.get(ward.nursingHomeId) || [];
    list.push(ward);
    wardsByHome.set(ward.nursingHomeId, list);
  }

  const wards = [...existingWards];
  for (const facility of facilities) {
    const nursingHomeId = nursingHomeIdForFacility(facility.id);
    if (!wardsByHome.get(nursingHomeId)?.length) {
      wards.push({
        id: defaultWardId(nursingHomeId),
        nursingHomeId,
        name: "Main Unit",
        code: "MAIN",
        description: "Default ward created by the canonical hierarchy migration.",
        active: true,
        displayOrder: 0,
        createdAt: MIGRATION_TIMESTAMP,
        updatedAt: MIGRATION_TIMESTAMP,
      });
    }
  }

  const rooms = source.rooms.map((room) => {
    const nursingHomeId = room.nursingHomeId || nursingHomeIdForFacility(room.facilityId || defaultFacilityId);
    return {
      ...room,
      id: asRoomId(String(room.id)),
      facilityId: room.facilityId || defaultFacilityId,
      nursingHomeId,
      wardId: room.wardId || roomWardId(room, defaultFacilityId),
      name: room.name || `Room ${room.number}`,
      roomNumber: room.roomNumber || room.number,
      active: room.active !== false,
      createdAt: room.createdAt || MIGRATION_TIMESTAMP,
      updatedAt: room.updatedAt || MIGRATION_TIMESTAMP,
    };
  });

  const beds = [...(source.beds || [])];
  const assignments = [...(source.bedAssignments || [])];
  const bedRoomKeys = new Set(beds.map((bed) => `${bed.roomId}:${bed.label}`));
  const assignmentResidentIds = new Set(assignments.filter((item) => item.status === "active").map((item) => item.residentId));

  for (const room of rooms) {
    const activeResidents = source.residents.filter(
      (resident) =>
        resident.status === "active" &&
        (resident.roomId === room.id || (!resident.roomId && resident.roomNumber === room.roomNumber)) &&
        (resident.facilityId || defaultFacilityId) === (room.facilityId || defaultFacilityId),
    );
    const requiredBeds = Math.max(1, activeResidents.length);
    for (let index = 1; index <= requiredBeds; index += 1) {
      const key = `${room.id}:Bed ${index}`;
      if (!bedRoomKeys.has(key)) {
        beds.push({
          id: defaultBedId(String(room.id), index),
          roomId: asRoomId(String(room.id)),
          label: `Bed ${index}`,
          active: true,
          status: activeResidents[index - 1] ? "occupied" : "available",
          bedType: activeResidents[index - 1]?.bed?.bedType,
          mattressType: activeResidents[index - 1]?.bed?.mattressType,
          installedDate: activeResidents[index - 1]?.bed?.installationDate,
          reviewDate: activeResidents[index - 1]?.bed?.reviewDate,
          createdAt: MIGRATION_TIMESTAMP,
          updatedAt: MIGRATION_TIMESTAMP,
        });
        bedRoomKeys.add(key);
      }
    }

    activeResidents.forEach((resident, index) => {
      if (assignmentResidentIds.has(resident.id)) return;
      const bedId = defaultBedId(String(room.id), index + 1);
      assignments.push({
        id: defaultAssignmentId(resident.id),
        bedId,
        residentId: resident.id,
        nursingHomeId: room.nursingHomeId || nursingHomeIdForFacility(room.facilityId || defaultFacilityId),
        startDate: resident.admissionDate || MIGRATION_TIMESTAMP.slice(0, 10),
        status: "active",
        assignmentReason: "Initial hierarchy migration from resident room assignment.",
        createdAt: MIGRATION_TIMESTAMP,
        updatedAt: MIGRATION_TIMESTAMP,
      });
      assignmentResidentIds.add(resident.id);
    });
  }

  const migrated = {
    ...source,
    enterprises,
    facilities,
    wards,
    rooms,
    beds,
    bedAssignments: assignments,
  };

  return {
    store: migrated,
    counts: {
      ...before,
      enterprisesAfter: enterprises.length,
      nursingHomesAfter: facilities.length,
      wardsAfter: wards.length,
      roomsAfter: rooms.length,
      bedsAfter: beds.length,
      bedAssignmentsAfter: assignments.length,
      residentsAfter: source.residents.length,
    },
  };
}

export function getEnterpriseById(state: EntityHierarchyState, id: EnterpriseId | string) {
  return state.enterprises.find((enterprise) => enterprise.id === id);
}

export function getNursingHomeById(state: EntityHierarchyState, id: NursingHomeId | string) {
  return state.facilities.find((facility) => facility.id === id);
}

export function getWardsForNursingHome(state: EntityHierarchyState, nursingHomeId: NursingHomeId | string, includeInactive = false) {
  return state.wards.filter((ward) => ward.nursingHomeId === nursingHomeId && (includeInactive || ward.active));
}

export function getWardById(state: EntityHierarchyState, id: WardId | string) {
  return state.wards.find((ward) => ward.id === id);
}

export function getRoomsForWard(state: EntityHierarchyState, wardId: WardId | string, includeInactive = false) {
  return state.rooms.filter((room) => room.wardId === wardId && (includeInactive || room.active !== false));
}

export function getRoomById(state: EntityHierarchyState, id: RoomId | string) {
  return state.rooms.find((room) => room.id === id);
}

export function getBedsForRoom(state: EntityHierarchyState, roomId: RoomId | string, includeInactive = false) {
  return state.beds.filter((bed) => bed.roomId === roomId && (includeInactive || bed.active));
}

export function getBedById(state: EntityHierarchyState, id: BedId | string) {
  return state.beds.find((bed) => bed.id === id);
}

export function getResidentCurrentPlacement(state: EntityHierarchyState, residentId: string) {
  const resident = state.residents.find((item) => item.id === residentId);
  if (!resident) return undefined;
  const assignment = state.bedAssignments.find((item) => item.residentId === residentId && item.status === "active");
  const bed = assignment ? getBedById(state, assignment.bedId) : undefined;
  const room = bed ? getRoomById(state, bed.roomId) : resident.roomId ? getRoomById(state, resident.roomId) : state.rooms.find((item) => item.roomNumber === resident.roomNumber);
  const ward = room?.wardId ? getWardById(state, room.wardId) : undefined;
  const nursingHomeId = assignment?.nursingHomeId || room?.nursingHomeId || asNursingHomeId(resident.facilityId || "");
  const nursingHome = nursingHomeId ? getNursingHomeById(state, nursingHomeId) : undefined;
  const enterprise = nursingHome?.enterpriseId ? getEnterpriseById(state, nursingHome.enterpriseId) : undefined;
  return { resident, assignment, bed, room, ward, nursingHome, enterprise };
}

export function getResidentCurrentBed(state: EntityHierarchyState, residentId: string) {
  return getResidentCurrentPlacement(state, residentId)?.bed;
}

export function getResidentCurrentRoom(state: EntityHierarchyState, residentId: string) {
  return getResidentCurrentPlacement(state, residentId)?.room;
}

export function getResidentCurrentWard(state: EntityHierarchyState, residentId: string) {
  return getResidentCurrentPlacement(state, residentId)?.ward;
}

export function getResidentCurrentNursingHome(state: EntityHierarchyState, residentId: string) {
  return getResidentCurrentPlacement(state, residentId)?.nursingHome;
}

export function getResidentsForWard(state: EntityHierarchyState, wardId: WardId | string) {
  const roomIds = new Set(getRoomsForWard(state, wardId).map((room) => room.id));
  return state.residents.filter((resident) => {
    const placement = getResidentCurrentPlacement(state, resident.id);
    return placement?.room && roomIds.has(placement.room.id);
  });
}

export function getResidentsForRoom(state: EntityHierarchyState, roomId: RoomId | string) {
  return state.residents.filter((resident) => getResidentCurrentPlacement(state, resident.id)?.room?.id === roomId);
}

export function getResidentsForNursingHome(state: EntityHierarchyState, nursingHomeId: NursingHomeId | string) {
  return state.residents.filter((resident) => (resident.facilityId || "") === nursingHomeId);
}

export interface EntityHierarchyValidationReport {
  enterpriseCount: number;
  nursingHomeCount: number;
  wardsPerNursingHome: Record<string, number>;
  roomsWithoutWard: string[];
  bedsWithoutRoom: string[];
  residentsWithoutNursingHome: string[];
  activeResidentsWithoutRoomOrBed: string[];
  multipleActiveBedAssignments: string[];
  duplicateRoomNumbersInWard: string[];
  orphanClinicalRecords: string[];
  mismatchedNursingHomeScope: string[];
  criticalErrors: string[];
}

export function validateEntityHierarchy(
  state: EntityHierarchyState & {
    assessments?: { id: string; residentId: string; facilityId?: string }[];
    carePlanProblems?: { id: string; residentId: string; facilityId?: string }[];
  },
): EntityHierarchyValidationReport {
  const nursingHomeIds = new Set(state.facilities.map((facility) => facility.id));
  const wardIds = new Set(state.wards.map((ward) => ward.id));
  const roomIds = new Set(state.rooms.map((room) => room.id));
  const residentById = new Map(state.residents.map((resident) => [resident.id, resident]));
  const activeAssignmentsByResident = new Map<string, number>();
  const activeAssignmentsByBed = new Map<string, number>();

  for (const assignment of state.bedAssignments.filter((item) => item.status === "active")) {
    activeAssignmentsByResident.set(assignment.residentId, (activeAssignmentsByResident.get(assignment.residentId) || 0) + 1);
    activeAssignmentsByBed.set(assignment.bedId, (activeAssignmentsByBed.get(assignment.bedId) || 0) + 1);
  }

  const wardsPerNursingHome = Object.fromEntries(
    state.facilities.map((facility) => [
      facility.id,
      state.wards.filter((ward) => ward.nursingHomeId === facility.id).length,
    ]),
  );

  const duplicateRoomNumbersInWard: string[] = [];
  const seenRoomNumbers = new Set<string>();
  for (const room of state.rooms) {
    const key = `${room.wardId}:${room.roomNumber || room.number}`;
    if (seenRoomNumbers.has(key)) duplicateRoomNumbersInWard.push(String(room.id));
    seenRoomNumbers.add(key);
  }

  const orphanClinicalRecords: string[] = [];
  const mismatchedNursingHomeScope: string[] = [];
  for (const [name, records] of [
    ["assessment", state.assessments || []],
    ["carePlanProblem", state.carePlanProblems || []],
  ] as const) {
    for (const record of records) {
      const resident = residentById.get(record.residentId);
      if (!resident) {
        orphanClinicalRecords.push(`${name}:${record.id}`);
      } else if (record.facilityId && resident.facilityId && record.facilityId !== resident.facilityId) {
        mismatchedNursingHomeScope.push(`${name}:${record.id}`);
      }
    }
  }

  const report: EntityHierarchyValidationReport = {
    enterpriseCount: state.enterprises.length,
    nursingHomeCount: state.facilities.length,
    wardsPerNursingHome,
    roomsWithoutWard: state.rooms.filter((room) => !room.wardId || !wardIds.has(room.wardId)).map((room) => String(room.id)),
    bedsWithoutRoom: state.beds.filter((bed) => !roomIds.has(bed.roomId)).map((bed) => String(bed.id)),
    residentsWithoutNursingHome: state.residents.filter((resident) => !resident.facilityId || !nursingHomeIds.has(resident.facilityId)).map((resident) => resident.id),
    activeResidentsWithoutRoomOrBed: state.residents
      .filter((resident) => resident.status === "active" && !getResidentCurrentPlacement(state, resident.id)?.room)
      .map((resident) => resident.id),
    multipleActiveBedAssignments: [
      ...Array.from(activeAssignmentsByResident.entries()).filter(([, count]) => count > 1).map(([id]) => `resident:${id}`),
      ...Array.from(activeAssignmentsByBed.entries()).filter(([, count]) => count > 1).map(([id]) => `bed:${id}`),
    ],
    duplicateRoomNumbersInWard,
    orphanClinicalRecords,
    mismatchedNursingHomeScope,
    criticalErrors: [],
  };

  report.criticalErrors = [
    ...report.roomsWithoutWard.map((id) => `Room without ward: ${id}`),
    ...report.bedsWithoutRoom.map((id) => `Bed without room: ${id}`),
    ...report.residentsWithoutNursingHome.map((id) => `Resident without nursing home: ${id}`),
    ...report.multipleActiveBedAssignments.map((id) => `Multiple active bed assignments: ${id}`),
    ...report.orphanClinicalRecords.map((id) => `Orphan clinical record: ${id}`),
    ...report.mismatchedNursingHomeScope.map((id) => `Mismatched nursing-home scope: ${id}`),
  ];

  return report;
}
