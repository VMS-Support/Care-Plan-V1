export const DEFAULT_ENTERPRISE_ID = "enterprise-default";
export const BALLYMORE_FACILITY_ID = "facility-ballymore-haven";
export const HAZELWOOD_FACILITY_ID = "facility-hazelwood-care";

export function makeRooms(facilityId = BALLYMORE_FACILITY_ID, count = 72) {
  const shortId = facilityId.replace(/^facility-/, "");
  return Array.from({ length: count }, (_, index) => ({
    id: `r-${shortId}-${index + 1}`,
    facilityId,
    wingId: `w-${Math.floor(index / 12) + 1}`,
    unitId: `u-${Math.floor(index / 12) + 1}`,
    number: String(index + 1),
  }));
}

export function makeResidents(rooms, count = 12, facilityId = BALLYMORE_FACILITY_ID) {
  return Array.from({ length: count }, (_, index) => ({
    id: `R-${String(index + 1).padStart(4, "0")}`,
    facilityId,
    firstName: `Resident${index + 1}`,
    lastName: "Fixture",
    status: "active",
    roomId: rooms[index % rooms.length].id,
    roomNumber: rooms[index % rooms.length].number,
    admissionDate: "2026-01-01",
    bed: {
      bedType: "standard",
      mattressType: "foam",
      installationDate: "2026-01-01",
      reviewDate: "2026-12-31",
    },
  }));
}

export function createFixture(overrides = {}) {
  const rooms = overrides.rooms || makeRooms();
  const residents = overrides.residents || makeResidents(rooms);
  return {
    enterprises: overrides.enterprises || [],
    facilities: overrides.facilities || [
      {
        id: BALLYMORE_FACILITY_ID,
        name: "Ballymore Haven",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
        createdBy: "System",
      },
      {
        id: HAZELWOOD_FACILITY_ID,
        name: "Hazelwood Care",
        status: "active",
        createdAt: "2026-07-06T00:00:00.000Z",
        createdBy: "System",
      },
    ],
    wards: overrides.wards || [],
    rooms,
    beds: overrides.beds || [],
    bedAssignments: overrides.bedAssignments || [],
    residents,
    assessments: overrides.assessments || [],
    carePlans: overrides.carePlans || [],
    carePlanProblems: overrides.carePlanProblems || [],
    problemInterventions: overrides.problemInterventions || [],
    problemReviews: overrides.problemReviews || [],
  };
}

const defaultWardId = (nursingHomeId) => `ward-default-${nursingHomeId}`;
const defaultBedId = (roomId, index) => `bed-${roomId}-${index}`;

export function migrateFixture(source, defaultFacilityId = BALLYMORE_FACILITY_ID) {
  const enterprises = source.enterprises.length
    ? source.enterprises
    : [{
        id: DEFAULT_ENTERPRISE_ID,
        name: "NuCare Organisation",
        active: true,
        createdAt: "2026-07-13T00:00:00.000Z",
        updatedAt: "2026-07-13T00:00:00.000Z",
      }];
  const facilities = source.facilities.map((facility) => ({
    ...facility,
    enterpriseId: facility.enterpriseId || DEFAULT_ENTERPRISE_ID,
  }));
  const wards = [...source.wards];
  for (const facility of facilities) {
    if (!wards.some((ward) => ward.nursingHomeId === facility.id)) {
      wards.push({
        id: defaultWardId(facility.id),
        nursingHomeId: facility.id,
        name: "Main Unit",
        active: true,
        createdAt: "2026-07-13T00:00:00.000Z",
        updatedAt: "2026-07-13T00:00:00.000Z",
      });
    }
  }
  const rooms = source.rooms.map((room) => ({
    ...room,
    facilityId: room.facilityId || defaultFacilityId,
    nursingHomeId: room.nursingHomeId || room.facilityId || defaultFacilityId,
    wardId: room.wardId || defaultWardId(room.facilityId || defaultFacilityId),
    roomNumber: room.roomNumber || room.number,
    name: room.name || `Room ${room.number}`,
    active: room.active !== false,
  }));
  const beds = [...source.beds];
  const assignments = [...source.bedAssignments];
  for (const room of rooms) {
    const activeResidents = source.residents.filter((resident) =>
      resident.status === "active" &&
      (resident.roomId === room.id || resident.roomNumber === room.roomNumber) &&
      (resident.facilityId || defaultFacilityId) === (room.facilityId || defaultFacilityId)
    );
    const requiredBeds = Math.max(1, activeResidents.length);
    for (let index = 1; index <= requiredBeds; index += 1) {
      const bedId = defaultBedId(room.id, index);
      if (!beds.some((bed) => bed.id === bedId)) {
        beds.push({
          id: bedId,
          roomId: room.id,
          label: `Bed ${index}`,
          active: true,
          status: activeResidents[index - 1] ? "occupied" : "available",
        });
      }
    }
    activeResidents.forEach((resident, index) => {
      if (!assignments.some((assignment) => assignment.residentId === resident.id && assignment.status === "active")) {
        assignments.push({
          id: `bed-assignment-${resident.id}`,
          bedId: defaultBedId(room.id, index + 1),
          residentId: resident.id,
          nursingHomeId: room.facilityId || defaultFacilityId,
          startDate: resident.admissionDate,
          status: "active",
        });
      }
    });
  }
  return { ...source, enterprises, facilities, wards, rooms, beds, bedAssignments: assignments };
}

export function validateFixture(state) {
  const roomIds = new Set(state.rooms.map((room) => room.id));
  const wardIds = new Set(state.wards.map((ward) => ward.id));
  const residentIds = new Set(state.residents.map((resident) => resident.id));
  const activeByResident = new Map();
  const activeByBed = new Map();
  for (const assignment of state.bedAssignments.filter((item) => item.status === "active")) {
    activeByResident.set(assignment.residentId, (activeByResident.get(assignment.residentId) || 0) + 1);
    activeByBed.set(assignment.bedId, (activeByBed.get(assignment.bedId) || 0) + 1);
  }
  const orphanClinicalRecords = [
    ...state.assessments.map((record) => ["assessment", record]),
    ...state.carePlans.map((record) => ["carePlan", record]),
    ...state.carePlanProblems.map((record) => ["carePlanProblem", record]),
  ].filter(([, record]) => !residentIds.has(record.residentId)).map(([kind, record]) => `${kind}:${record.id}`);
  const criticalErrors = [
    ...state.rooms.filter((room) => !wardIds.has(room.wardId)).map((room) => `Room without ward: ${room.id}`),
    ...state.beds.filter((bed) => !roomIds.has(bed.roomId)).map((bed) => `Bed without room: ${bed.id}`),
    ...Array.from(activeByResident.entries()).filter(([, count]) => count > 1).map(([id]) => `Multiple active resident assignments: ${id}`),
    ...Array.from(activeByBed.entries()).filter(([, count]) => count > 1).map(([id]) => `Multiple active bed assignments: ${id}`),
    ...orphanClinicalRecords.map((id) => `Orphan clinical record: ${id}`),
  ];
  return {
    enterpriseCount: state.enterprises.length,
    nursingHomeCount: state.facilities.length,
    wardsPerNursingHome: Object.fromEntries(state.facilities.map((facility) => [
      facility.id,
      state.wards.filter((ward) => ward.nursingHomeId === facility.id).length,
    ])),
    roomsWithoutWard: state.rooms.filter((room) => !wardIds.has(room.wardId)).map((room) => room.id),
    bedsWithoutRoom: state.beds.filter((bed) => !roomIds.has(bed.roomId)).map((bed) => bed.id),
    residentsWithoutNursingHome: state.residents.filter((resident) => !resident.facilityId).map((resident) => resident.id),
    activeResidentsWithoutRoomOrBed: state.residents.filter((resident) =>
      resident.status === "active" &&
      !state.bedAssignments.some((assignment) => assignment.residentId === resident.id && assignment.status === "active")
    ).map((resident) => resident.id),
    multipleActiveBedAssignments: criticalErrors.filter((error) => error.startsWith("Multiple active")),
    duplicateRoomNumbersInWard: [],
    orphanClinicalRecords,
    mismatchedNursingHomeScope: [],
    unchangedCarePlanCounts: state.carePlans.length,
    unchangedAssessmentCounts: state.assessments.length,
    unchangedCareActionCounts: state.problemInterventions.length,
    unchangedReviewCounts: state.problemReviews.length,
    criticalErrors,
  };
}
