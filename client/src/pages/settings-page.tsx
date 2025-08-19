import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Users } from 'lucide-react';
import ContactProperties from './settings/contact-properties';

interface SettingsPageProps {
  workspaceId: string;
}

export default function SettingsPage({ workspaceId }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('contact-properties');

  const tabs = [
    {
      id: 'contact-properties',
      label: 'Contact Properties',
      icon: Users,
      component: ContactProperties
    },
    // Future tabs can be added here
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ContactProperties;

  return (
    <div className="flex h-full">
      {/* Sidebar Menu */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </h2>
          
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ActiveComponent workspaceId={workspaceId} />
      </div>
    </div>
  );
}