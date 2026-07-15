import { useCare } from "@/lib/care/store";
import { roleLabels } from "@/lib/care/permissions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import type { Role } from "@/lib/care/types";

const roles: Role[] = ["carer", "nurse", "doctor", "cnm", "don", "group_owner"];

export function RoleSwitcher() {
  const { currentRole, setCurrentRole, currentUserName } = useCare();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{currentUserName}</span>
          <span className="text-xs text-muted-foreground hidden md:inline">· {roleLabels[currentRole]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch active role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map(r => (
          <DropdownMenuItem key={r} onSelect={() => setCurrentRole(r)}>
            <div className="flex flex-col">
              <span className="font-medium">{roleLabels[r]}</span>
              <span className="text-xs text-muted-foreground">{r === currentRole ? "Active" : ""}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
