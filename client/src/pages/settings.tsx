import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare } from 'lucide-react';
import { useAuth } from "../hooks/useAuth";
import KnowledgeBasePage from './knowledge-base';
import SystemPromptsPage from './system-prompts';
import ModelSelectionPage from './model-configuration';
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('knowledge-base');
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your AI system configuration and knowledge base
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="system-prompts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            System Prompts
          </TabsTrigger>
          <TabsTrigger value="model-selection" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Model Selection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base" className="space-y-4">
          <KnowledgeBasePage />
        </TabsContent>

        <TabsContent value="system-prompts" className="space-y-4">
          <SystemPromptsPage />
        </TabsContent>
        <TabsContent value="model-selection" className="space-y-4">
          <ModelSelectionPage workspaceId={user?.workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}