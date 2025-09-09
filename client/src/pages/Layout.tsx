import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("dashboard");

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Bar */}
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="w-full px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="text-xl font-bold">Nexus AI Hub</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              Welcome, {user?.first_name || "User"}!
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Layout body */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-16 bg-slate-800/50 border-r border-slate-700 min-h-screen flex flex-col items-center py-6 gap-6">
          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${
              active === "dashboard" ? "bg-slate-700" : ""
            }`}
            onClick={() => {
              setActive("dashboard");
              navigate("/nexus");
            }}
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </button>

          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${
              active === "agents" ? "bg-slate-700" : ""
            }`}
            onClick={() => {
              setActive("agents");
              navigate("/nexus/agents");
            }}
            title="Agents"
          >
            <Bot
              className={`h-5 w-5 ${
                active === "agents"
                  ? "text-indigo-400"
                  : "text-slate-400 group-hover:text-slate-200"
              }`}
            />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
