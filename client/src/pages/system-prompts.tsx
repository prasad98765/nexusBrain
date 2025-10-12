import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Power,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SystemPrompt, SystemPromptsResponse, EnhancePromptResponse } from '@shared/schema';
function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, isDeleting }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; isDeleting: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="w-[350px] p-6 text-center" style={{ color: "white" }}>
        <Trash2 className="w-10 h-10 mx-auto mb-4 text-destructive" />
        <h4 className="text-lg font-semibold mb-2">Are you sure you want to delete this Prompt</h4>
        <p className="text-muted-foreground mb-6">This action cannot be undone.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} data-testid="button-cancel-delete">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} data-testid="button-confirm-delete">
            {isDeleting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
interface SystemPromptFormData {
  title: string;
  prompt: string;
  is_active: boolean;
}

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: SystemPrompt;
  onSave: (data: SystemPromptFormData) => void;
  isLoading: boolean;
}

function PromptModal({ open, onOpenChange, prompt, onSave, isLoading }: PromptModalProps) {
  console.log("prompt", prompt);

  const [formData, setFormData] = useState<SystemPromptFormData>({
    title: prompt?.title || '',
    prompt: prompt?.prompt || '',
    is_active: prompt?.is_active || false,
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      title: prompt?.title || '',
      prompt: prompt?.prompt || '',
      is_active: prompt?.is_active || false,
    })
  }, [prompt])

  const handleEnhance = async () => {
    if (!formData.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to enhance",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/system_prompts/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: formData.prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data: EnhancePromptResponse = await response.json();
      setFormData(prev => ({ ...prev, prompt: data.enhanced_prompt }));

      toast({
        title: "Success",
        description: "Prompt enhanced successfully!",
      });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: "Error",
        description: "Failed to enhance prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData?.title?.trim() || !formData?.prompt?.trim()) {
      toast({
        title: "Error",
        description: "Title and prompt are required",
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
    setFormData({ title: '', prompt: '', is_active: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ color: "white" }}>
        <DialogHeader>
          <DialogTitle>
            {prompt ? 'Edit System Prompt' : 'Create New System Prompt'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter prompt title..."
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                disabled={isEnhancing || !formData?.prompt?.trim()}
                className="flex items-center gap-2"
              >
                {isEnhancing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Enhance with AI
              </Button>
            </div>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="Enter your system prompt here..."
              rows={8}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isActive">Set as active prompt</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {prompt ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                prompt ? 'Update Prompt' : 'Create Prompt'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SystemPromptsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<SystemPrompt | null>(null);

  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system prompts
  const { data: promptsData, isLoading, error } = useQuery<SystemPromptsResponse>({
    queryKey: ['system-prompts', { search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/system_prompts?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system prompts');
      }

      return response.json();
    },
  });

  // Create prompt mutation
  const createMutation = useMutation({
    mutationFn: async (data: SystemPromptFormData) => {
      const response = await fetch('/api/system_prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          prompt: data.prompt,
          is_active: data.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      setModalOpen(false);
      toast({
        title: "Success",
        description: "System prompt created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update prompt mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SystemPromptFormData }) => {
      const response = await fetch(`/api/system_prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          prompt: data.prompt,
          is_active: data.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      setModalOpen(false);
      setEditingPrompt(undefined);
      toast({
        title: "Success",
        description: "System prompt updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete prompt mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system_prompts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      toast({
        title: "Success",
        description: "System prompt deleted successfully!",
      });
      setDeleteDialogOpen(false)
      setDeletingEntry(null);

    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setDeleteDialogOpen(false)
      setDeletingEntry(null);
    },
  });

  // Activate prompt mutation
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system_prompts/${id}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      toast({
        title: "Success",
        description: "System prompt activated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: SystemPromptFormData) => {
    if (editingPrompt) {
      updateMutation.mutate({ id: editingPrompt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setModalOpen(true);
  };

  const handleDeletionConfirm = (data: SystemPrompt) => {
    setDeletingEntry(data);
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (deletingEntry) {
      deleteMutation.mutate(deletingEntry.id);
    }
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load system prompts</h2>
          <p className="text-muted-foreground">There was an error loading your system prompts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Prompts</h1>
          <p className="text-muted-foreground">
            Manage AI system prompts for better responses
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPrompt(undefined);
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Prompt
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading system prompts...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : promptsData?.prompts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="text-muted-foreground">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No system prompts found</p>
                    <p className="text-sm">Create your first prompt to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              promptsData?.prompts.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{prompt.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {prompt.prompt}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                      {prompt.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(prompt.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(prompt)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!prompt.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivate(prompt.id)}
                          disabled={activateMutation.isPending}
                          title="Activate this prompt"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletionConfirm(prompt)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {promptsData && promptsData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {promptsData.pagination.pages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(promptsData.pagination.pages, page + 1))}
              disabled={page === promptsData.pagination.pages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <PromptModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        prompt={editingPrompt}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={false}
      />
    </div>
  );
}