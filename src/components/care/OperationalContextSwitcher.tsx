import { CalendarDays, Clock, MapPinned } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function OperationalContextSwitcher() {
  const {
    facilities,
    operationalContext,
    getStaffAccessibleHomes,
    getCurrentStaffMember,
    getStaffAccessibleWards,
    getWardsForNursingHome,
    getConfiguredShifts,
    switchNursingHome,
    selectSingleWard,
    selectAllAuthorisedWards,
  } = useCare();
  const staff = getCurrentStaffMember();
  const homeIds = staff ? getStaffAccessibleHomes(staff.id) : [operationalContext.nursingHomeId];
  const homes = facilities.filter((facility) => homeIds.includes(facility.id as any));
  const wards = staff ? getStaffAccessibleWards(staff.id, operationalContext.nursingHomeId) : operationalContext.wardIds;
  const wardOptions = getWardsForNursingHome(operationalContext.nursingHomeId).filter((ward) => wards.includes(ward.id as any));
  const currentWardLabel =
    operationalContext.wardSelectionMode === "all_authorised"
      ? "All Wards"
      : wardOptions.find((ward) => operationalContext.wardIds.includes(ward.id as any))?.name || "Ward";
  const shifts = getConfiguredShifts(operationalContext.nursingHomeId);

  return (
    <div className="hidden lg:flex items-center gap-2">
      <Select value={operationalContext.nursingHomeId} onValueChange={switchNursingHome}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <MapPinned className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {homes.map((home) => (
            <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={operationalContext.wardSelectionMode === "all_authorised" ? "__all__" : operationalContext.wardIds[0]}
        onValueChange={(value) => value === "__all__" ? selectAllAuthorisedWards() : selectSingleWard(value)}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder={currentWardLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Wards</SelectItem>
          {wardOptions.map((ward) => (
            <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge variant="outline" className="h-8 gap-1 rounded-md px-2 font-normal">
        <Clock className="h-3.5 w-3.5" />
        {shifts.find((shift) => shift.id === operationalContext.shiftId)?.label || operationalContext.shiftLabel}
      </Badge>
      <Badge variant="outline" className="h-8 gap-1 rounded-md px-2 font-normal">
        <CalendarDays className="h-3.5 w-3.5" />
        {operationalContext.operationalDate}
      </Badge>
      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled>
        {operationalContext.effectiveRoleKey}
      </Button>
    </div>
  );
}
