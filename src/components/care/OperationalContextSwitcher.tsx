import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, Clock, MapPinned } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function OperationalContextSwitcher() {
  const {
    facilities,
    operationalContext,
    getStaffAccessibleHomes,
    getCurrentStaffMember,
    getStaffAccessibleWards,
    getWardsForNursingHome,
    getResidentsForNursingHome,
    getConfiguredShifts,
    canSelectMultipleWards,
    switchNursingHome,
    selectSingleWard,
    selectMultipleWards,
    selectAllAuthorisedWards,
    setOperationalShift,
  } = useCare();
  const [draftWardIds, setDraftWardIds] = useState<string[]>(operationalContext.wardIds);
  const staff = getCurrentStaffMember();
  const homeIds = staff ? getStaffAccessibleHomes(staff.id) : [operationalContext.nursingHomeId];
  const homes = facilities.filter((facility) => homeIds.includes(facility.id as any));
  const wards = staff ? getStaffAccessibleWards(staff.id, operationalContext.nursingHomeId) : operationalContext.wardIds;
  const wardOptions = getWardsForNursingHome(operationalContext.nursingHomeId).filter((ward) => wards.includes(ward.id as any));
  const residentCountByWard = useMemo(() => {
    const residents = getResidentsForNursingHome(operationalContext.nursingHomeId);
    return new Map(wardOptions.map((ward) => [ward.id, residents.filter((resident) => resident.wardId === ward.id).length]));
  }, [getResidentsForNursingHome, operationalContext.nursingHomeId, wardOptions]);
  const multiWardAllowed = canSelectMultipleWards();
  const currentWardLabel =
    operationalContext.wardSelectionMode === "all_authorised"
      ? "All Authorised Wards"
      : operationalContext.wardIds.length > 1
        ? `${operationalContext.wardIds.length} wards`
      : wardOptions.find((ward) => operationalContext.wardIds.includes(ward.id as any))?.name || "Ward";
  const shifts = getConfiguredShifts(operationalContext.nursingHomeId);

  return (
    <div className="hidden lg:flex items-center gap-2">
      {homes.length > 1 ? (
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
      ) : (
        <Badge variant="outline" className="h-8 gap-1 rounded-md px-2 font-normal">
          <MapPinned className="h-3.5 w-3.5" />
          {homes[0]?.name || "Home"}
        </Badge>
      )}
      <DropdownMenu onOpenChange={(open) => open && setDraftWardIds(operationalContext.wardIds)}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-44 justify-start px-2 text-xs">
            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            <span className="truncate">{currentWardLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Ward Context</DropdownMenuLabel>
          {multiWardAllowed && (
            <>
              <DropdownMenuItem onSelect={(event) => { event.preventDefault(); selectAllAuthorisedWards(); }}>
                All Authorised Wards
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {wardOptions.map((ward) => {
            const checked = draftWardIds.includes(ward.id);
            return (
              <DropdownMenuCheckboxItem
                key={ward.id}
                checked={checked}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => {
                  if (!multiWardAllowed) {
                    selectSingleWard(ward.id);
                    return;
                  }
                  setDraftWardIds((current) =>
                    checked ? current.filter((id) => id !== ward.id) : [...new Set([...current, ward.id])],
                  );
                }}
              >
                <span className="flex flex-1 items-center justify-between gap-3">
                  <span className="truncate">{ward.name}</span>
                  <span className="text-xs text-muted-foreground">{residentCountByWard.get(ward.id) || 0} residents</span>
                </span>
              </DropdownMenuCheckboxItem>
            );
          })}
          {multiWardAllowed && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={draftWardIds.length === 0}
                onSelect={() => draftWardIds.length === 1 ? selectSingleWard(draftWardIds[0]) : selectMultipleWards(draftWardIds)}
              >
                Apply {draftWardIds.length} ward{draftWardIds.length === 1 ? "" : "s"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Select value={operationalContext.shiftId} onValueChange={setOperationalShift}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {shifts.map((shift) => (
            <SelectItem key={shift.id} value={shift.id}>{shift.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
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
