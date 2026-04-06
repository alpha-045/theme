import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRole } from "@/contexts/RoleContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const AppHeader = () => {
  const { role } = useRole();
  const initials = role === "admin" ? "AD" : role === "operative" ? "OP" : "CL";

  return (
    <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default AppHeader;
