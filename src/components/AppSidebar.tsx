import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Ticket, Wallet, SlidersHorizontal, CalendarDays, Utensils, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/formulas", icon: Ticket, label: "Formules" },
  { to: "/budget", icon: Wallet, label: "Budget" },
  { to: "/simulation", icon: SlidersHorizontal, label: "Simulation" },
  { to: "/logistics", icon: CalendarDays, label: "Logistique" },
  { to: "/crm", icon: Users, label: "CRM" },
];

interface AppSidebarProps {
  onSignOut?: () => void;
  userEmail?: string;
}

export default function AppSidebar({ onSignOut, userEmail }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 lg:w-56 flex-col bg-sidebar sidebar-transition border-r border-sidebar-border">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Utensils className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="hidden lg:block text-sm font-semibold text-sidebar-foreground tracking-tight">
          EventEngine
        </span>
      </div>
      <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-sidebar-foreground">
              {userEmail?.[0]?.toUpperCase() ?? "G"}
            </span>
          </div>
          <span className="hidden lg:block text-xs text-sidebar-muted truncate">
            {userEmail ?? "Gala 2026"}
          </span>
        </div>
        {onSignOut && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="w-full justify-start text-sidebar-muted hover:text-destructive px-2"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block ml-2">Déconnexion</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
