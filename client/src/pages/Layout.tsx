import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Bot, Users, Settings, Workflow, ChevronsLeftRightEllipsis, Activity, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import WebBotChat from "@/components/webbot/WebBotChat";

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("dashboard");
  const [isBotOpen, setIsBotOpen] = useState(false);

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
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-16 bg-slate-800/50 border-r border-slate-700 h-full flex flex-col items-center py-6 gap-6">
          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === "dashboard" ? "bg-slate-700" : ""
              }`}
            onClick={() => {
              setActive("dashboard");
              navigate("/nexus");
            }}
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </button>

          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === "agents" ? "bg-slate-700" : ""
              }`}
            onClick={() => {
              setActive("agents");
              navigate("/nexus/agents");
            }}
            title="Agents"
          >
            <Bot
              className={`h-5 w-5 ${active === "agents"
                ? "text-indigo-400"
                : "text-slate-400 group-hover:text-slate-200"
                }`}
            />
          </button>

          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'contacts' ? 'bg-slate-700' : ''
              }`}
            onClick={() => {
              setActive("contacts");
              navigate("/nexus/contacts");
            }}
          >
            <Users className={`h-5 w-5 ${active === 'contacts' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
          </button>
          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'flow-builder' ? 'bg-slate-700' : ''
              }`}
            onClick={() => {
              setActive("flow-builder");
              navigate("/nexus/flow-builder");
            }}
          >
            <Workflow className={`h-5 w-5 ${active === 'flow-builder' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
          </button>
          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'API-integrations' ? 'bg-slate-700' : ''
              }`}
            onClick={() => {
              setActive("API-integrations");
              navigate("/nexus/api-integrations");
            }}
          >
            <ChevronsLeftRightEllipsis className={`h-5 w-5 ${active === 'API-integrations' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
          </button>
          <div className="mt-auto flex flex-col gap-4">
            {/* Web Bot Button */}
            <button
              className={`p-3 rounded-lg transition-colors group relative ${
                isBotOpen ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
              onClick={() => setIsBotOpen(!isBotOpen)}
              title="AI Assistant"
              data-testid="button-toggle-webbot"
            >
              <MessageCircle
                className={`h-5 w-5 ${
                  isBotOpen
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!isBotOpen && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></span>
              )}
            </button>
            
            {/* <button
              className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'settings' ? 'bg-slate-700' : ''
                }`}
              onClick={() => {
                setActive("settings");
                navigate("/nexus/settings");
              }}
            >
              <Settings className={`h-5 w-5 ${active === 'settings' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
            </button> */}
            {/* <button className="p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <User className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
            </button> */}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-6 overflow-y-auto h-full">
          <Outlet />
        </main>
      </div>

      {/* Web Bot Chat Window */}
      <WebBotChat isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}
