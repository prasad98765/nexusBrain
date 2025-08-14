import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Bell } from "lucide-react";

interface TopBarProps {
  onMobileMenuToggle: () => void;
}

export default function TopBar({ onMobileMenuToggle }: TopBarProps) {
  return (
    <div className="flex-shrink-0 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Page Title */}
        <div className="flex-1 md:flex-initial">
          <h1 className="text-lg font-semibold text-slate-900">AI Chat Assistant</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search conversations..."
              className="w-64 pl-10"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </Button>

          {/* Logout */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/api/logout'}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
