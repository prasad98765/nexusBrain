import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare, Variable, Network, Plug } from 'lucide-react';
import { useAuth } from "../hooks/useAuth";
import KnowledgeBasePage from './knowledge-base';
import SystemPromptsPage from './system-prompts';
import ModelSelectionPage from './model-configuration';
import VariablesPage from './variables-page';
import ApiLibraryPage from './settings/api-library';
import IntegrationsPage from './settings/integrations';
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
        <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
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
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Variable className="w-4 h-4" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="api-library" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            API Library
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="w-4 h-4" />
            Integrations
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
        <TabsContent value="variables" className="space-y-4">
          <VariablesPage />
        </TabsContent>

        <TabsContent value="api-library" className="space-y-4">
          <ApiLibraryPage workspaceId={user?.workspaceId || ''} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}