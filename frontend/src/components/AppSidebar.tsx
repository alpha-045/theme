import {
  Home,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  FileText,
  Shield,
  Wrench,
  CheckCircle,
  LogOut,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const roleMenus: Record<UserRole, { title: string; url: string; icon: LucideIcon }[]> = {
  client: [
    { title: "Browse Services", url: "/client", icon: Home },
    { title: "My Orders", url: "/client/orders", icon: ShoppingCart },
  ],
  operative: [
    { title: "Dashboard", url: "/operative", icon: BarChart3 },
    { title: "My Services", url: "/operative/services", icon: Wrench },
    { title: "Incoming Orders", url: "/operative/incoming", icon: ClipboardList },
    { title: "Order Management", url: "/operative/orders", icon: CheckCircle },
  ],
  admin: [
    { title: "Dashboard", url: "/admin", icon: BarChart3 },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "All Orders", url: "/admin/orders", icon: Package },
    { title: "Services", url: "/admin/services", icon: Shield },
    { title: "Categories", url: "/admin/categories", icon: FileText },
  ],
};

const roleLabels: Record<UserRole, string> = {
  client: "Client",
  operative: "Operative",
  admin: "Admin",
};

const AppSidebar = () => {
  const { role, logout } = useRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const items = roleMenus[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 py-4 mb-2">
              <h2 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">
                DEV<span className="text-sidebar-primary">201</span>
              </h2>
              <p className="text-xs text-sidebar-muted mt-0.5">Cooperative Platform</p>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-4 mb-2">
              <span className="text-lg font-bold text-sidebar-primary">S</span>
            </div>
          )}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-wider">
            {!collapsed && roleLabels[role] + " Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/client" || item.url === "/operative" || item.url === "/admin"}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>




      {!collapsed && (
        <div className="px-3 pb-4 flex justify-between items-center">

          {/* Profile Button */}
          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-md text-sidebar-muted hover:text-sidebar-foreground transition"
            aria-label="Profile"
          >
            <User size={18} />
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="p-2 rounded-md text-red-400 hover:text-red-600 transition"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>

        </div>
      )}

    </Sidebar>
  );
};

export default AppSidebar;
