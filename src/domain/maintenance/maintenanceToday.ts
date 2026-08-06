import { calculateBedOccupancy } from "./bedOccupancy.ts";
import { certificateDashboardMetrics } from "./certificates.ts";
import { correctiveActionDashboard } from "./correctiveActions.ts";
import { housekeepingDashboardMetrics } from "./housekeeping.ts";
import { projectUnifiedWork, sortUnifiedWork, unifiedWorkCounts } from "./unifiedWork.ts";

export function maintenanceTodayProjection(care: any, homeIds: string[], now = new Date()) {
  const within = (row: any) =>
    homeIds.includes(String(row.homeId || row.facilityId || row.nursingHomeId || ""));
  const work = projectUnifiedWork(care, homeIds, now),
    workCounts = unifiedWorkCounts(work, now.toISOString().slice(0, 10));
  const housekeepingTasks = (care.housekeepingTasks || []).filter(within),
    readiness = (care.housekeepingRoomReadiness || []).filter(within);
  const housekeeping = housekeepingDashboardMetrics({
    templates: (care.housekeepingTemplates || []).filter((x) => !x.homeId || within(x)),
    schedules: (care.housekeepingSchedules || []).filter(within),
    tasks: housekeepingTasks,
    exceptions: (care.housekeepingExceptions || []).filter(within),
    inspections: (care.housekeepingQualityInspections || []).filter(within),
    audits: (care.housekeepingCleaningAudits || []).filter(within),
    readiness,
    today: now,
  });
  const rooms = (care.rooms || []).filter(within),
    roomIds = new Set(rooms.map((x: any) => String(x.id))),
    beds = (care.beds || []).filter((x: any) => roomIds.has(String(x.roomId)));
  const occupancy = calculateBedOccupancy({
    beds,
    assignments: care.bedAssignments || [],
    rooms,
    residents: care.residents || [],
    wings: care.wings || [],
    workOrders: (care.maintenanceWorkOrders || []).filter(within),
    safetyInspections: (care.safetyInspections || []).filter(within),
    registeredCapacity: (care.facilities || [])
      .filter((x: any) => homeIds.includes(x.id))
      .reduce((sum: number, x: any) => sum + Number(x.bedCapacity || 0), 0),
  });
  const certificates = certificateDashboardMetrics({
    certificates: (care.maintenanceCertificates || []).filter((x) => !x.homeId || within(x)),
    versions: care.maintenanceCertificateVersions || [],
    types: care.maintenanceCertificateTypes || [],
    attachments: care.maintenanceCertificateAttachments || [],
    requirements: care.maintenanceCertificateRequirements || [],
    assets: (care.maintenanceAssets || []).filter(within),
    today: now,
  });
  const corrective = correctiveActionDashboard(
    (care.correctiveActions || []).filter(within),
    now.toISOString().slice(0, 10),
  );
  const safety = (care.safetyInspections || []).filter(within),
    planned = (care.plannedMaintenanceOccurrences || []).filter(within),
    today = now.toISOString().slice(0, 10);
  const myWork = sortUnifiedWork(
    work.filter((x) => x.assignedUserId === care.currentUser?.id || Boolean(x.assignedTeamId)),
  ).filter((x) => !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(x.status));
  return {
    work,
    workCounts,
    todaysWork: sortUnifiedWork(
      work.filter((x) => ["DUE_NOW", "DUE_TODAY", "OVERDUE"].includes(x.dueState)),
    ).slice(0, 10),
    myWork: myWork.slice(0, 5),
    myWorkCounts: {
      active: myWork.length,
      overdue: myWork.filter((x) => x.dueState === "OVERDUE").length,
      dueToday: myWork.filter((x) => ["DUE_NOW", "DUE_TODAY"].includes(x.dueState)).length,
    },
    recentlyCompleted: sortUnifiedWork(
      work
        .filter((x) => x.completedAt)
        .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")),
    ).slice(0, 5),
    housekeeping,
    occupancy,
    certificates,
    corrective,
    plannedCompliance: {
      plannedDueToday: planned.filter((x: any) => x.dueDate === today && !x.completedAt).length,
      plannedOverdue: planned.filter((x: any) => x.dueDate < today && !x.completedAt).length,
      failedInspections: safety.filter((x: any) => x.overallResult === "FAIL").length,
      verificationOutstanding: safety.filter(
        (x: any) => x.verificationRequired && x.verificationStatus !== "VERIFIED",
      ).length,
    },
    roomsBlocked: readiness.filter((x: any) => !["READY", "OCCUPIED"].includes(x.readinessStatus))
      .length,
    roomsAwaitingReadiness: readiness.filter((x: any) =>
      ["CLEANING_IN_PROGRESS", "AWAITING_INSPECTION", "FAILED_INSPECTION"].includes(
        x.readinessStatus,
      ),
    ).length,
    contractorBlockers: (care.maintenanceContractors || []).filter((x: any) =>
      ["RESTRICTED", "SUSPENDED", "NON_COMPLIANT"].includes(x.status || x.approvalStatus),
    ).length,
  };
}
