import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListOrdered,
  FileSpreadsheet,
  PlusCircle,
  Settings,
  User,
  CreditCard,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useNotifications } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}

const NavItem = ({ icon: Icon, label, href, active, collapsed, badge }: NavItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={collapsed ? 100 : 1000}>
        <TooltipTrigger asChild>
          <Link
            to={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 group",
              active
                ? "bg-teal-700 text-white shadow-inner"
                : "text-teal-100 hover:bg-teal-700 hover:text-white"
            )}
            aria-label={label}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                  active ? "text-white" : "text-teal-200 group-hover:text-white"
                )}
              />
              {badge && badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs font-bold animate-pulse"
                >
                  {badge > 99 ? '99+' : badge}
                </Badge>
              )}
            </div>
            <span
              className={cn(
                "transition-all duration-300 flex items-center justify-between w-full",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              {label}
              {badge && badge > 0 && !collapsed && (
                <Badge
                  variant="destructive"
                  className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs font-bold animate-pulse"
                >
                  {badge > 99 ? '99+' : badge}
                </Badge>
              )}
            </span>
          </Link>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="bg-teal-800 text-white rounded-lg p-2">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  // Animation mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load collapse state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); // Redirect to homepage
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r border-teal-500/20 bg-gradient-to-b from-teal-600 to-teal-700 text-white transition-all duration-300 ease-in-out shadow-lg",
        collapsed ? "w-[70px]" : "w-[260px] md:w-[280px]"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo & collapse button */}
      <div
        className={cn(
          "flex items-center h-16 px-4 transition-all duration-300",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {!collapsed && (
            <h1 className="text-2xl font-bold tracking-tight animate-fade-in">
              BakraMandi360
            </h1>
          )}
          {collapsed && (
            <span className="text-2xl font-bold tracking-tight">BM</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-teal-200 hover:bg-teal-800 hover:text-white transition-colors duration-200"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 pt-4 overflow-auto scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-teal-700">
        <nav className="space-y-1 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/admin"
            active={location.pathname === "/admin"}
            collapsed={collapsed}
          />
          
          <NavItem
            icon={ListOrdered}
            label="My Listings"
            href="/admin/listings"
            active={location.pathname === "/admin/listings"}
            collapsed={collapsed}
          />
          <NavItem
            icon={PlusCircle}
            label="Add Listings"
            href="/admin/addlistings"
            active={location.pathname === "/admin/add-listing"}
            collapsed={collapsed}
          />
          <NavItem
            icon={FileSpreadsheet}
            label="Sales History"
            href="/admin/sales"
            active={location.pathname === "/admin/sales"}
            collapsed={collapsed}
          />
          <NavItem
            icon={CreditCard}
            label="Payments"
            href="/admin/payments"
            active={location.pathname === "/admin/payments"}
            collapsed={collapsed}
          />
          <NavItem
            icon={Bell}
            label="Notifications"
            href="/admin/notifications"
            active={location.pathname === "/admin/notifications"}
            collapsed={collapsed}
            badge={unreadCount}
          />
        </nav>

        <Separator className="my-4 bg-teal-500/30" />

        <nav className="space-y-1 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <NavItem
            icon={Settings}
            label="Settings"
            href="/admin/settings"
            active={location.pathname === "/admin/settings"}
            collapsed={collapsed}
          />
          <NavItem
            icon={User}
            label="Profile"
            href="/admin/profile"
            active={location.pathname === "/admin/profile"}
            collapsed={collapsed}
          />
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-2 mt-auto animate-fade-up" style={{ animationDelay: "150ms" }}>
        <NavItem
          icon={Home}
          label="Back to Home"
          href="/"
          active={false}
          collapsed={collapsed}
        />
        <Button
          variant="ghost"
          className={cn(
            "w-full mt-2 text-teal-100 hover:bg-teal-800 hover:text-red-400 flex items-center gap-3 transition-all duration-300",
            collapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "transition-all duration-300",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
}