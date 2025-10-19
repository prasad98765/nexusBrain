import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Users, Cpu, Bot, Key, Database, Network, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import ContactProperties from './settings/contact-properties';
import LLMSettings from './settings/llm-settings';
import ModelConfiguration from './model-configuration';

interface TabButtonProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

interface SettingsPageProps {
  workspaceId: string;
}

export default function SettingsPage({ workspaceId }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('llm-settings');

  const TabButton: React.FC<TabButtonProps> = ({ active, icon: Icon, onClick }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ease-in-out",
        "hover:bg-slate-700/50 relative group",
        active ? "text-white shadow-md" : "text-slate-300"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn(
          "h-5 w-5 transition-transform duration-200",
          active ? "text-white" : "text-slate-400",
          "group-hover:scale-110"
        )} />
        {/* <span className="font-medium">{label}</span> */}
      </div>
      {active && (
        <div className="absolute inset-y-0 left-0 w-1 bg-indigo-400 rounded-full" />
      )}
    </button>
  );

  const tabs = [
    {
      id: 'llm-settings',
      label: 'Language Models',
      icon: Bot,
      component: LLMSettings,
      description: 'Configure AI model settings'
    },
    // {
    //   id: 'model-configuration',
    //   label: 'Model Configuration',
    //   icon: Layers,
    //   component: ModelConfiguration,
    //   description: 'Configure models for specific categories'
    // },
    // Commented out but keeping for future reference
    // {
    //   id: 'contact-properties',
    //   label: 'Contact Properties',
    //   icon: Users,
    //   component: ContactProperties,
    //   description: 'Manage contact information fields'
    // }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ContactProperties;

  return (
    <div className="flex h-full">
      {/* Sidebar Menu */}
      <div className="bg-slate-800/95 border-r border-slate-700 p-6 backdrop-blur-sm">
        <div className="space-y-6">


          <div className="space-y-1">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                icon={tab.icon}
                // label={tab.label}
                onClick={() => setActiveTab(tab.id)} label={''} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-900/50">
        <div className="mx-auto">
          <ActiveComponent workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}