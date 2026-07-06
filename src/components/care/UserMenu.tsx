import { Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { roleLabels } from "@/lib/care/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Check, LogOut, Settings, User } from "lucide-react";

export function UserMenu() {
  const { activeFacilityId, currentUser, facilities, setActiveFacilityId } = useCare();
  const initials = currentUser.name.split(" ").map(p => p[0]).slice(0, 2).join("");
  const facilityIds = currentUser.facilityIds?.length
    ? currentUser.facilityIds
    : [currentUser.facilityId || "facility-ballymore-haven"];
  const availableFacilities = facilities.filter((facility) => facilityIds.includes(facility.id));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback></Avatar>
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-xs font-medium">{currentUser.name}</span>
            <span className="text-[10px] text-muted-foreground">{roleLabels[currentUser.role]}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground -mt-1">{currentUser.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4 mr-2" /> My Profile</Link></DropdownMenuItem>
        <DropdownMenuItem disabled><Settings className="h-4 w-4 mr-2" /> Preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Building2 className="h-4 w-4 mr-2" />
            Switch Nursing Home
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {availableFacilities.map((facility) => (
              <DropdownMenuItem
                key={facility.id}
                onSelect={() => setActiveFacilityId(facility.id)}
                className="flex items-center justify-between"
              >
                <span>{facility.name}</span>
                {facility.id === activeFacilityId ? <Check className="h-4 w-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem disabled className="text-muted-foreground"><LogOut className="h-4 w-4 mr-2" /> Sign out (demo)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
