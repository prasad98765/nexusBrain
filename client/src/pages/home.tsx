import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import ContactsTable from "@/components/contacts/ContactsTable";
import SettingsPage from "@/pages/settings-page";
import CustomizeAgent from "@/pages/customize-agent";
import FlowBuilder from "@/pages/flow-builder";
import AgentsPage from "@/pages/agents-page";

export default function Home() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<
    "dashboard" | "contacts" | "settings" | "customize-agent" | "flow-builder" | "agents"
  >("dashboard");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [typedText, setTypedText] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);

  const heroText = "Welcome to Nexus AI Hub – Your All-in-One AI Superpower";

  // Typing animation effect
  useEffect(() => {
    if (typeIndex < heroText.length) {
      const timeout = setTimeout(() => {
        setTypedText((prev) => prev + heroText[typeIndex]);
        setTypeIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [typeIndex, heroText]);

  const handleAgentCreated = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveView("customize-agent");
  };

  const handleBackFromCustomize = () => {
    setActiveView("dashboard");
    setSelectedAgentId(null);
  };

  const handleCreateFlow = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveView("flow-builder");
  };

  const handleBackFromFlow = () => {
    setActiveView("customize-agent");
  };

  return (
    <div className="w-full h-full flex items-center justify-center" >
      {activeView === "dashboard" ? (
        <div className="flex flex-col items-center justify-center text-center relative" style={{ backgroundColor: 'var(--sidebar)' }}>
          {/* Hero Section */}
          <div className="max-w-4xl space-y-8 z-10" style={{ backgroundColor: "rgb(15 23 42 / var(--tw-bg-opacity, 1))" }}>
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
                  {typedText}
                </span>
                <span className="animate-pulse">|</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
                <Zap className="inline h-5 w-5 mr-2 text-yellow-400" />
                Powered by LangChain, Nexus AI Hub brings all AI tools into one place to make
                your life easier, faster, and smarter.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 text-lg"
              >
                Watch Interactive Demo
              </Button>
            </div>
          </div>

          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      ) : activeView === "contacts" ? (
        <ContactsTable
          workspaceId={user?.workspaceId || "default"}
          onSettingsClick={() => setActiveView("settings")}
        />
      ) : activeView === "settings" ? (
        <SettingsPage workspaceId={user?.workspaceId || "default"} />
      ) : activeView === "customize-agent" ? (
        <CustomizeAgent
          agentId={selectedAgentId || undefined}
          onBackClick={handleBackFromCustomize}
          onCreateFlow={handleCreateFlow}
        />
      ) : activeView === "flow-builder" ? (
        <FlowBuilder agentId={selectedAgentId || ""} onBackClick={handleBackFromFlow} />
      ) : activeView === "agents" ? (
        <AgentsPage />
      ) : null}
    </div>
  );
}
