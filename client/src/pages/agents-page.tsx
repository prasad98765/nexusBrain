import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  Bot,
  MessageSquare,
  Phone,
  Code,
  Eye,
  Copy
} from 'lucide-react';
import UniversalTranslator from '@/components/UniversalTranslator';

interface Agent {
  id: string;
  name: string;
  type: 'web' | 'whatsapp' | 'voice';
  description: string;
  status: 'draft' | 'published' | 'archived';
  configuration: any;
  workspaceId: string;
  createdAt?: string;
  updatedAt?: string;
}

const AgentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'web':
      return <Bot className="h-4 w-4" />;
    case 'whatsapp':
      return <MessageSquare className="h-4 w-4" />;
    case 'voice':
      return <Phone className="h-4 w-4" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors = {
    draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    published: 'bg-green-500/10 text-green-500 border-green-500/20',
    archived: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function AgentsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [selectedAgentForEmbed, setSelectedAgentForEmbed] = useState<Agent | null>(null);
  const [translatorOpen, setTranslatorOpen] = useState(false);

  // Fetch agents
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    }
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Success",
        description: "Agent deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive"
      });
    }
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentId, data }: { agentId: string; data: Partial<Agent> }) => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setShowEditDialog(false);
      setEditingAgent(null);
      toast({
        title: "Success",
        description: "Agent updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive"
      });
    }
  });

  // Toggle agent status
  const toggleAgentStatus = (agent: Agent) => {
    const newStatus = agent.status === 'published' ? 'draft' : 'published';
    updateAgentMutation.mutate({
      agentId: agent.id,
      data: { status: newStatus }
    });
  };

  // Filter agents based on search term
  // const filteredAgents = agentsData?.agents?.filter((agent: Agent) =>
  //   agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
  // ) || [];

  // Add Translate Language perdefined hard code card
  const filteredAgents: Agent[] = [
    {
      id: '1',
      name: 'Translate Language',
      type: 'web', // explicitly typed as 'web' | 'whatsapp' | 'voice'
      description: 'A web agent that translates text between multiple languages using AI.',
      status: 'published',
      configuration: {},
      workspaceId: 'workspace_1'
    }
  ]


  // Generate embed script
  const generateEmbedScript = (agent: Agent) => {
    const baseUrl = window.location.origin;
    return `<script src="${baseUrl}/agent.js" 
        data-workspace-id="${agent.workspaceId}" 
        data-agent-id="${agent.id}"></script>`;
  };

  // Copy embed script to clipboard
  const copyEmbedScript = (agent: Agent) => {
    const script = generateEmbedScript(agent);
    navigator.clipboard.writeText(script);
    toast({
      title: "Copied!",
      description: "Embed script copied to clipboard"
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    updateAgentMutation.mutate({
      agentId: editingAgent.id,
      data: {
        name: editingAgent.name,
        description: editingAgent.description
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="agents-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Agents</h1>
        {/* <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          data-testid="button-create-agent"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button> */}
      </div>

      {/* Search */}
      {/* <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search agents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-600 text-white"
          data-testid="input-search-agents"
        />
      </div> */}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent: Agent) => (
          <Card key={agent.id} className="bg-slate-800 border-slate-700" style={{ cursor: 'pointer' }} data-testid={`card-agent-${agent.id}`} onClick={() => {

            setTranslatorOpen(true);

          }}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <AgentTypeIcon type={agent.type} />
                  </div>
                  <div>
                    <CardTitle className="text-white text-sm">{agent.name}</CardTitle>
                  </div>
                </div>
                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-menu-${agent.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem 
                      onClick={() => {
                        setEditingAgent(agent);
                        setShowEditDialog(true);
                      }}
                      data-testid={`button-edit-${agent.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedAgentForEmbed(agent);
                        setShowEmbedDialog(true);
                      }}
                      data-testid={`button-embed-${agent.id}`}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Get Embed Code
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => toggleAgentStatus(agent)}
                      data-testid={`button-toggle-${agent.id}`}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {agent.status === 'published' ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteAgentMutation.mutate(agent.id)}
                      className="text-red-400 focus:text-red-400"
                      data-testid={`button-delete-${agent.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> */}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">{agent.description || 'No description provided'}</p>
              <div className="flex justify-between items-center">
                <StatusBadge status={agent.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No agents found</h3>
          <p className="text-slate-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first agent to get started'}
          </p>
        </div>
      )}

      {/* Edit Agent Dialog */}
      {/* <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Agent</DialogTitle>
          </DialogHeader>
          {editingAgent && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">Name</Label>
                <Input
                  id="name"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="input-edit-name"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-slate-300">Description</Label>
                <Textarea
                  id="description"
                  value={editingAgent.description || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                  data-testid="input-edit-description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={updateAgentMutation.isPending}
                  data-testid="button-save-agent"
                >
                  {updateAgentMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog> */}

      {/* Embed Script Dialog */}
      {/* <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Integration Script</DialogTitle>
          </DialogHeader>
          {selectedAgentForEmbed && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Copy and paste this script into your website's HTML to embed the chatbot:
              </p>
              <div className="relative">
                <pre className="bg-slate-900 p-4 rounded border border-slate-600 text-sm text-slate-300 overflow-x-auto">
                  <code>{generateEmbedScript(selectedAgentForEmbed)}</code>
                </pre>
                <Button
                  onClick={() => copyEmbedScript(selectedAgentForEmbed)}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  variant="outline"
                  data-testid="button-copy-embed"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-slate-400">
                <p className="mb-2">This script will:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Add a floating chatbot icon to your website</li>
                  <li>Open an AI chat interface when clicked</li>
                  <li>Use your custom agent configuration and knowledge base</li>
                  <li>Store conversations for analytics</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog> */}
      {/* Universal Translator Modal */}
      <UniversalTranslator
        isOpen={translatorOpen}
        onClose={() => setTranslatorOpen(false)}
      />
    </div>
  );
}