import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare } from 'lucide-react';
import KnowledgeBasePage from './knowledge-base';
import SystemPromptsPage from './system-prompts';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('knowledge-base');

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
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="system-prompts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            System Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base" className="space-y-6">
          <KnowledgeBasePage />
        </TabsContent>

        <TabsContent value="system-prompts" className="space-y-6">
          <SystemPromptsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}