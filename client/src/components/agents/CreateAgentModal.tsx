import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, MessageCircle, Phone, Zap, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onAgentCreated: (agentId: string) => void;
}

interface AgentType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  comingSoon?: boolean;
}

export default function CreateAgentModal({ 
  open, 
  onOpenChange, 
  workspaceId,
  onAgentCreated 
}: CreateAgentModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, token } = useAuth();
  const agentTypes: AgentType[] = [
    {
      id: 'web',
      title: 'Web Agent',
      description: 'Create intelligent chatbots for your website with customizable responses and integrations.',
      icon: <MessageCircle className="h-8 w-8" />,
      enabled: true,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Agent',
      description: 'Build automated WhatsApp assistants for customer support and engagement.',
      icon: <Phone className="h-8 w-8" />,
      enabled: false,
      comingSoon: true,
    },
    {
      id: 'voice',
      title: 'Voice Agent',
      description: 'Develop voice-powered AI agents for phone calls and voice interactions.',
      icon: <Zap className="h-8 w-8" />,
      enabled: false,
      comingSoon: true,
    },
  ];

  const createAgentMutation = useMutation({
    mutationFn: async (agentType: string) => {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: agentType,
          workspaceId,
          name: `${agentTypes.find(t => t.id === agentType)?.title} Agent`,
          status: 'draft'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Agent Created',
        description: 'Your agent has been created successfully. Redirecting to customization...',
      });
      onAgentCreated(data.id);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create agent',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectAgent = (agentType: AgentType) => {
    if (!agentType.enabled) return;
    
    setSelectedType(agentType.id);
    createAgentMutation.mutate(agentType.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Bot className="h-7 w-7 text-indigo-400" />
            Create New Agent
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-lg">
            Choose the type of AI agent you want to create for your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          {agentTypes.map((agentType) => (
            <div
              key={agentType.id}
              className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer group ${
                agentType.enabled
                  ? selectedType === agentType.id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-indigo-400 hover:bg-indigo-500/5'
                  : 'border-slate-700 bg-slate-800/50 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => handleSelectAgent(agentType)}
            >
              {/* Coming Soon Badge */}
              {agentType.comingSoon && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                  <Clock className="h-3 w-3 text-orange-400" />
                  <span className="text-xs font-medium text-orange-400">Coming Soon</span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  agentType.enabled 
                    ? 'bg-indigo-500/20 text-indigo-400' 
                    : 'bg-slate-600/50 text-slate-500'
                }`}>
                  {agentType.icon}
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className={`text-xl font-semibold ${
                    agentType.enabled ? 'text-slate-100' : 'text-slate-400'
                  }`}>
                    {agentType.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    agentType.enabled ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {agentType.description}
                  </p>
                </div>

                {agentType.enabled && (
                  <div className="flex items-center">
                    <Button
                      variant={selectedType === agentType.id ? 'default' : 'outline'}
                      size="sm"
                      className={
                        selectedType === agentType.id
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'border-slate-500 text-slate-300 hover:bg-slate-600'
                      }
                      disabled={createAgentMutation.isPending}
                    >
                      {createAgentMutation.isPending && selectedType === agentType.id
                        ? 'Creating...'
                        : selectedType === agentType.id
                        ? 'Selected'
                        : 'Select'
                      }
                    </Button>
                  </div>
                )}
              </div>

              {/* Selection indicator */}
              {agentType.enabled && selectedType === agentType.id && (
                <div className="absolute inset-0 rounded-lg ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800 pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-500">
            More agent types coming soon! Stay tuned for updates.
          </p>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}