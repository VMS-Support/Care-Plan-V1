import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { roleLabels } from "@/lib/care/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, LogOut, Settings, Shield, User } from "lucide-react";
import type { Role } from "@/lib/care/types";

export function UserMenu() {
  const { activeFacilityId, currentRole, currentUser, facilities, setCurrentRole, users } = useCare();
  const [switchRoleOpen, setSwitchRoleOpen] = useState(false);
  const initials = currentUser.name.split(" ").map(p => p[0]).slice(0, 2).join("");
  const facilityIds = currentUser.facilityIds?.length
    ? currentUser.facilityIds
    : [currentUser.facilityId || "facility-ballymore-haven"];
  const primaryHome = facilities.find((facility) => facility.id === activeFacilityId) || facilities.find((facility) => facilityIds.includes(facility.id));
  const availableRoles = Array.from(
    new Map(
      users
        .filter((user) => user.status !== "inactive" && (user.facilityIds?.includes(activeFacilityId) || user.facilityId === activeFacilityId))
        .map((user) => [user.role, user.role]),
    ).values(),
  ) as Role[];
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 gap-2 px-2" aria-label={`User profile menu. Current role ${roleLabels[currentRole]}`}>
            <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback></Avatar>
            <div className="hidden xl:flex flex-col items-start leading-tight">
              <span className="text-xs font-medium">{shortName(currentUser.name)}</span>
              <span className="text-[10px] text-muted-foreground">{roleLabels[currentRole]}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-start gap-3">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback></Avatar>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{currentUser.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{roleLabels[currentRole]}</span>
              <span className="block text-xs font-normal text-muted-foreground">{primaryHome?.name || "Primary Home not set"}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{currentUser.email}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4 mr-2" /> View Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/profile"><Settings className="h-4 w-4 mr-2" /> Account Settings</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/profile"><Settings className="h-4 w-4 mr-2" /> Preferences</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setSwitchRoleOpen(true); }}>
            <Shield className="h-4 w-4 mr-2" /> Switch Role
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-muted-foreground"><LogOut className="h-4 w-4 mr-2" /> Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={switchRoleOpen} onOpenChange={setSwitchRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Switch Role</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="text-xs text-muted-foreground">Current role</div>
              <div className="font-medium">{roleLabels[currentRole]}</div>
              <div className="text-xs text-muted-foreground">{primaryHome?.name || "Current Home"}</div>
            </div>
            <div className="space-y-2">
              {availableRoles.length ? availableRoles.map((role) => (
                <button
                  key={role}
                  className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    try {
                      setCurrentRole(role);
                      setSwitchRoleOpen(false);
                    } catch {
                      // setCurrentRole validates through the existing care context.
                    }
                  }}
                >
                  <span>
                    <span className="block font-medium">{roleLabels[role]}</span>
                    <span className="block text-xs text-muted-foreground">{primaryHome?.name || "Authorised Home scope"}</span>
                  </span>
                  {role === currentRole ? <Badge variant="outline"><Check className="mr-1 h-3 w-3" /> Current</Badge> : null}
                </button>
              )) : <div className="rounded-md border p-3 text-sm text-muted-foreground">No additional roles are available for this account.</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts.at(-1)}` : name;
}
