import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Workspace } from "@shared/schema";
import { ChevronDown, Plus } from "lucide-react";

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

export default function WorkspaceSelector({
  workspaces,
  selectedWorkspaceId,
  onWorkspaceSelect,
}: WorkspaceSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/workspaces", data);
      return response.json();
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      onWorkspaceSelect(newWorkspace.id);
      setIsCreateDialogOpen(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      toast({
        title: "Workspace created",
        description: "Your new workspace has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workspace. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      createWorkspaceMutation.mutate({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || undefined,
      });
    }
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-2 h-auto hover:bg-slate-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-md"></div>
              <span className="font-medium text-slate-900 truncate">
                {selectedWorkspace?.name || "Select Workspace"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => onWorkspaceSelect(workspace.id)}
              className="flex items-center space-x-3 p-3"
            >
              <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-sm"></div>
              <span className="truncate">{workspace.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <Label htmlFor="workspace-description">Description (Optional)</Label>
                  <Textarea
                    id="workspace-description"
                    value={newWorkspaceDescription}
                    onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                    placeholder="Enter workspace description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim() || createWorkspaceMutation.isPending}
                  >
                    {createWorkspaceMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
