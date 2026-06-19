import { Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { roleLabels } from "@/lib/care/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

export function UserMenu() {
  const { currentUser } = useCare();
  const initials = currentUser.name.split(" ").map(p => p[0]).slice(0, 2).join("");
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
        <DropdownMenuItem disabled className="text-muted-foreground"><LogOut className="h-4 w-4 mr-2" /> Sign out (demo)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
