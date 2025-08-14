import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import RightSidebar from "@/components/layout/right-sidebar";
import ChatInterface from "@/components/chat/chat-interface";
import { Workspace } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });

  // Auto-select first workspace if none selected
  if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
    setSelectedWorkspaceId(workspaces[0].id);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        workspaces={workspaces || []}
        selectedWorkspaceId={selectedWorkspaceId}
        onWorkspaceSelect={setSelectedWorkspaceId}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <div className="flex-1 flex overflow-hidden">
          <ChatInterface
            workspaceId={selectedWorkspaceId}
            conversationId={selectedConversationId}
            onConversationSelect={setSelectedConversationId}
          />
          
          <RightSidebar
            conversationId={selectedConversationId}
            workspaceId={selectedWorkspaceId}
          />
        </div>
      </div>
    </div>
  );
}
