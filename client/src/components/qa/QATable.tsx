import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Brain,
  Clock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface QAEntry {
  id: string;
  workspace_id: string;
  model: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

interface QAResponse {
  entries: QAEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface EditPopoverProps {
  entry: QAEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, newAnswer: string) => void;
  isSaving: boolean;
}

function EditAnswerPopover({ entry, open, onOpenChange, onSave, isSaving }: EditPopoverProps) {
  const [editedAnswer, setEditedAnswer] = useState(entry.answer);

  const handleSave = () => {
    if (editedAnswer.trim() !== entry.answer) {
      onSave(entry.id, editedAnswer.trim());
    } else {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setEditedAnswer(entry.answer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-edit-answer-${entry.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[480px] p-6 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        data-testid="popover-edit-answer"
        style={{
          position: 'fixed',
          zIndex: 50,
          color: "white"
        }}
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold">Edit Answer</h4>
              <Badge variant="outline" className="px-2 py-1">
                {entry.model}
              </Badge>
            </div>
            <div className="h-px bg-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Question
            </Label>
            <div className="p-3 bg-muted/50 rounded-lg text-sm border">
              {entry.question}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer-edit" className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              Answer
            </Label>
            <Textarea
              id="answer-edit"
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              placeholder="Enter your revised answer..."
              className="min-h-[150px] text-sm resize-none border-2 focus-visible:ring-2"
              maxLength={10000}
              data-testid="textarea-edit-answer"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Use clear and concise language</span>
              <span>{editedAnswer.length}/10000 characters</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              data-testid="button-cancel-edit"
              className="px-4"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !editedAnswer.trim() || editedAnswer === entry.answer}
              data-testid="button-save-edit"
              className="px-4"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function QATable() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');

  // State for edit popover
  const [editingEntry, setEditingEntry] = useState<QAEntry | null>(null);
  const [editPopoverOpen, setEditPopoverOpen] = useState(false);

  // Fetch Q/A entries
  const { data: qaData, isLoading, error, refetch } = useQuery<QAResponse>({
    queryKey: ['/api/qa/entries', page, limit, modelFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        model: modelFilter,
        search: search,
      });

      const response = await axios.get<QAResponse>(
        `/api/qa/entries?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update answer mutation
  const updateAnswerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const response = await axios.put(
        `/api/qa/entries/${id}`,
        { answer },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qa/entries'] });
      setEditPopoverOpen(false);
      setEditingEntry(null);
      toast({
        title: "Answer Updated Successfully! ✅",
        description: "The answer has been saved to your Q/A database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Answer",
        description: error.response?.data?.error || "An error occurred while updating the answer.",
        variant: "destructive",
      });
    },
  });

  const handleEditAnswer = (entry: QAEntry) => {
    setEditingEntry(entry);
    setEditPopoverOpen(true);
  };

  const handleSaveAnswer = (id: string, newAnswer: string) => {
    updateAnswerMutation.mutate({ id, answer: newAnswer });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleModelFilterChange = (value: string) => {
    setModelFilter(value);
    setPage(1); // Reset to first page when filtering
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1); // Reset to first page when changing limit
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load Q/A data</h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading your Question & Answer data.
        </p>
        <Button onClick={() => refetch()} data-testid="button-retry-qa">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Question & Answer Database</h2>
          <p className="text-muted-foreground">
            View and edit AI-generated answers from your conversations.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Future feature buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  disabled
                  data-testid="button-revise-answer"
                  className="opacity-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Revise Answer
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming Soon - AI-powered answer revision</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  disabled
                  data-testid="button-add-qa"
                  className="opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Q&A
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming Soon - Manual Q&A creation</p>
            </TooltipContent>
          </Tooltip>

          <Button
            onClick={() => refetch()}
            variant="outline"
            data-testid="button-refresh-qa"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search questions and answers..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              data-testid="input-search-qa"
            />
          </div>
        </div>

        <Select value={modelFilter} onValueChange={handleModelFilterChange}>
          <SelectTrigger className="w-48" data-testid="select-model-filter">
            <SelectValue placeholder="Filter by model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
            <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      {qaData && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, qaData.total)} of {qaData.total} Q&A pairs
          </span>
          <div className="flex items-center gap-4">
            <Label htmlFor="limit-select">Per page:</Label>
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-20" id="limit-select" data-testid="select-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead className="w-32">Model</TableHead> */}
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead className="w-32">Updated</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading Q&A data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : qaData?.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No Q&A entries found</p>
                    <p className="text-sm">Try adjusting your filters or start a conversation to generate Q&A data.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              qaData?.entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/50">
                  {/* <TableCell style={{ width: "170px" }}>
                    <Badge variant="secondary">{entry.model}</Badge>
                  </TableCell> */}
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={entry.question}>
                      {truncateText(entry.question, 80)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div
                      className="truncate cursor-pointer hover:text-primary"
                      title="Click to edit answer"
                      onClick={() => handleEditAnswer(entry)}
                    >
                      {truncateText(entry.answer, 120)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.updated_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingEntry?.id === entry.id ? (
                      <EditAnswerPopover
                        entry={entry}
                        open={editPopoverOpen}
                        onOpenChange={setEditPopoverOpen}
                        onSave={handleSaveAnswer}
                        isSaving={updateAnswerMutation.isPending}
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAnswer(entry)}
                        data-testid={`button-edit-answer-${entry.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {qaData && qaData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {qaData.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              data-testid="button-previous-page"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(qaData.totalPages, page + 1))}
              disabled={page === qaData.totalPages}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}