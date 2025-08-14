import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import WorkspaceSelector from "@/components/workspace/workspace-selector";
import { Workspace } from "@shared/schema";
import { 
  Zap, 
  MessageSquare, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

const navigationItems = [
  { icon: MessageSquare, label: "AI Chat", href: "#", active: true },
  { icon: FileText, label: "Documents", href: "#" },
  { icon: Users, label: "Team", href: "#" },
  { icon: BarChart3, label: "Analytics", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

export default function Sidebar({
  workspaces,
  selectedWorkspaceId,
  onWorkspaceSelect,
  mobileMenuOpen,
  onMobileMenuClose,
}: SidebarProps) {
  const { user } = useAuth();
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={onMobileMenuClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">NexusAI</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onMobileMenuClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Workspace Selector */}
          <div className="px-4 py-3 border-b border-slate-200">
            <WorkspaceSelector
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              onWorkspaceSelect={onWorkspaceSelect}
            />
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors",
                  item.active
                    ? "text-primary bg-primary/10"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 mr-3",
                  item.active ? "text-primary" : "text-slate-400 group-hover:text-slate-500"
                )} />
                {item.label}
              </a>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="User profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"
                  }
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
