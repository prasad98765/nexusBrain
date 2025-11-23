import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Bot, Users, Settings, Workflow, ChevronsLeftRightEllipsis, Activity, MessageCircle, Wallet, FileCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import WebBotChat from "@/components/webbot/WebBotChat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("dashboard");
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  // Fetch workspace balance
  // const { data: balanceData } = useQuery<{ balance: number; workspaceId: string }>({
  //   queryKey: ['/api/workspaces', user?.workspace_id, 'balance'],
  //   // enabled: !!user?.workspace_id,
  //   refetchInterval: 30000, // Refetch every 30 seconds
  // });

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/auth";
  };

  const handleAddBalance = () => {
    setIsBalanceModalOpen(true);
  };

  const handleEmailSupport = () => {
    const email = 'support@nexusaihub.co.in';
    const subject = 'Request to Add Balance';
    const body = 'Hello, I would like to add balance of [enter amount].';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Bar */}
      <header className="w-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="w-full px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-3" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="text-xl font-bold">Nexus AI Hub</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600">
              <Wallet className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">
                ${Number((Math.floor((user?.balance || 0) * 100) / 100).toFixed(2))}
              </span>
            </div>

            {/* Add Balance Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBalance}
              className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
              data-testid="button-add-balance"
            >
              Add Balance
            </Button>

            <span className="text-sm text-slate-300">
              Welcome, {user?.first_name || "User"}!
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header >

      {/* Layout body */}
      < div className="flex h-[calc(100vh-4rem)]" >
        {/* Sidebar */}
        < aside className="w-16 bg-slate-800/50 border-r border-slate-700 h-full flex flex-col items-center py-6 gap-6" >
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

          {/* <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'contacts' ? 'bg-slate-700' : ''
              }`}
            onClick={() => {
              setActive("contacts");
              navigate("/nexus/contacts");
            }}
          >
            <Users className={`h-5 w-5 ${active === 'contacts' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
          </button> */}
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
          <button
            className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'scripts' ? 'bg-slate-700' : ''
              }`}
            onClick={() => {
              setActive("scripts");
              navigate("/nexus/scripts");
            }}
            title="Scripts"
          >
            <FileCode className={`h-5 w-5 ${active === 'scripts' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
          </button>
          <div className="mt-auto flex flex-col gap-4">
            {/* Web Bot Button */}
            <button
              className={`p-3 rounded-lg transition-colors group relative ${isBotOpen ? 'bg-indigo-600' : 'hover:bg-slate-700'
                }`}
              onClick={() => setIsBotOpen(!isBotOpen)}
              title="AI Assistant"
              data-testid="button-toggle-webbot"
            >
              <MessageCircle
                className={`h-5 w-5 ${isBotOpen
                  ? 'text-white'
                  : 'text-slate-400 group-hover:text-slate-200'
                  }`}
              />
              {!isBotOpen && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></span>
              )}
            </button>

            {/* Settings Button */}
            <button
              className={`p-3 rounded-lg hover:bg-slate-700 transition-colors group ${active === 'settings' ? 'bg-slate-700' : ''
                }`}
              onClick={() => {
                setActive("settings");
                navigate("/nexus/settings");
              }}
              title="Settings"
            >
              <Settings className={`h-5 w-5 ${active === 'settings' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
            </button>
            {/* <button className="p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <User className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
            </button> */}
          </div>
        </aside >

        {/* Main Content */}
        < main className="flex-1 px-8 py-6 overflow-y-auto h-full" >
          <Outlet />
        </main >
      </div >

      {/* Web Bot Chat Window */}
      < WebBotChat isOpen={isBotOpen} onClose={() => setIsBotOpen(false)
      } />

      {/* Add Balance Modal */}
      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add Balance</DialogTitle>
            <DialogDescription className="text-slate-400">
              Request to add balance to your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-300">
              If you want to add balance, please send a request to{' '}
              <a
                href="mailto:support@nexusaihub.co.in"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                support@nexusaihub.co.in
              </a>
              {' '}with the amount.
            </p>
            <Button
              onClick={handleEmailSupport}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              data-testid="button-email-support"
            >
              Open Email Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
