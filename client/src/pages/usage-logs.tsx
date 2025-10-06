import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from '@/components/ui/label';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Clock,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Database,
  Cpu,
  Calendar,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useModelStore } from '@/store/modelStore';

interface UsageLog {
  id: string;
  tokenId: string;
  endpoint: string;
  model: string;
  modelPermaslug: string;
  provider: string;
  method: string;
  statusCode: number;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  usage: number;
  byokUsageInference: number;
  requests: number;
  generationId: string;
  finishReason: string;
  firstTokenLatency: number;
  throughput: number;
  responseTimeMs: number;
  errorMessage: string;
  ipAddress: string;
  userAgent: string;
  cached: boolean;
  cacheType: string;
  createdAt: string;
}

interface UsageLogsResponse {
  logs: UsageLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProvidersResponse {
  providers: {
    id: string;
    name: string;
    models: {
      id: string;
      name: string;
    }[];
  }[];
}

interface ModelsResponse {
  models: {
    id: string;
    name: string;
    provider: string | null;
  }[];
}

interface LogDetailsModalProps {
  log: UsageLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LogDetailsModal({ log, open, onOpenChange }: LogDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-log-details" style={{ color: "white" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Usage Log Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Information */}
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Request Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <span className="font-mono">{log.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <Badge variant="outline">{log.method}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-mono">{log.model}</span>
                </div>
                {log.modelPermaslug && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model Version:</span>
                    <span className="font-mono text-xs">{log.modelPermaslug}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <Badge variant="secondary">{log.provider}</Badge>
                </div>
                {log.generationId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generation ID:</span>
                    <span className="font-mono text-xs">{log.generationId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Response Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Response Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Code:</span>
                  <Badge variant={log.statusCode === 200 ? 'default' : 'destructive'}>
                    {log.statusCode}
                  </Badge>
                </div>
                {log.finishReason && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Finish Reason:</span>
                    <span>{log.finishReason}</span>
                  </div>
                )}
                {/* <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span>{formatLatency(log.responseTimeMs)}</span>
                </div> */}
                {log.firstTokenLatency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Token:</span>
                    <span>{formatLatency(log.firstTokenLatency * 1000)}</span>
                  </div>
                )}
                {log.throughput && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Throughput:</span>
                    <span>{log.throughput.toFixed(2)} tokens/s</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Usage & Caching */}
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Token Usage
              </h3>
              <div className="space-y-2 text-sm">

                {log.promptTokens && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prompt Tokens:</span>
                    <span>{log.promptTokens.toLocaleString()}</span>
                  </div>
                )}
                {log.completionTokens && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion Tokens:</span>
                    <span>{log.completionTokens.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tokens:</span>
                  <span className="font-semibold">{log.tokensUsed?.toLocaleString()}</span>
                </div>
                {/* {log.reasoningTokens && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reasoning Tokens:</span>
                    <span>{log.reasoningTokens.toLocaleString()}</span>
                  </div>
                )} */}
                {log.usage && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Cost (USD)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 cursor-pointer text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Include platform fee (5.5%)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-semibold">${log.usage.toFixed(6)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Caching Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Caching Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cached:</span>
                  <Badge variant={log.cached ? 'default' : 'secondary'}>
                    {log.cached ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {log.cached && log.cacheType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache Type:</span>
                    <Badge variant="outline">
                      {log.cacheType === 'exact' ? 'Exact Match' : 'Semantic Match'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Client Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created At:</span>
                  <span>{formatDate(log.createdAt)}</span>
                </div>
                {log.userAgent && (
                  <div>
                    <span className="text-muted-foreground">User Agent:</span>
                    <p className="font-mono text-xs mt-1 break-all">{log.userAgent}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {log.errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              Error Message
            </h3>
            <p className="text-sm font-mono">{log.errorMessage}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function UsageLogsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Pagination and filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [model, setModel] = useState('all');
  const [provider, setProvider] = useState('all');
  const [dateRange, setDateRange] = useState('last30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [cached, setCached] = useState('all');
  const [cacheType, setCacheType] = useState('all');
  const [finishReason, setFinishReason] = useState('all');
  const [statusCode, setStatusCode] = useState('all');

  // Modal state
  const [selectedLog, setSelectedLog] = useState<UsageLog | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: logsData, isLoading, error, refetch } = useQuery<UsageLogsResponse>({
    queryKey: [
      'usage-logs',
      {
        page,
        limit,
        model,
        provider,
        dateRange,
        startDate,
        endDate,
        filterType,
        cached,
        cacheType,
        finishReason,
        statusCode,
        workspaceId: user?.workspace_id
      }
    ],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, Record<string, string | number | boolean | undefined>];
      const searchParams = new URLSearchParams();

      // Add all non-empty params to the query string
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'all') {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/api-tokens/usage-logs?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch usage logs');
      }
      return response.json();
    }
  });

  const handleViewDetails = (log: UsageLog) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="default" className="bg-green-600">{statusCode}</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="destructive">{statusCode}</Badge>;
    } else {
      return <Badge variant="secondary">{statusCode}</Badge>;
    }
  };

  const getCacheBadge = (cached: boolean, cacheType: string) => {
    if (!cached) {
      return <Badge variant="outline">No Cache</Badge>;
    }

    const variant = cacheType === 'exact' ? 'default' : 'secondary';
    const icon = cacheType === 'exact' ? '⚡' : '🧠';

    return (
      <Badge variant={variant} className="gap-1">
        <span>{icon}</span>
        {cacheType === 'exact' ? 'Exact' : 'Semantic'}
      </Badge>
    );
  };

  const formatTokens = (tokens: number) => {
    if (!tokens) return '0';
    return tokens.toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Fetch providers and their available models
  const { models, providers, fetchModelsAndProviders } = useModelStore();


  const resetFilters = () => {
    setModel('all');
    setProvider('all');
    setDateRange('last30');
    setStartDate('');
    setEndDate('');
    setFilterType('all');
    setCached('all');
    setCacheType('all');
    setFinishReason('all');
    setStatusCode('all');
    setPage(1);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load usage logs</h2>
          <p className="text-muted-foreground mb-4">There was an error loading your API usage logs.</p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usage Logs</h1>
          <p className="text-muted-foreground">
            View detailed information about your API usage and performance metrics.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            data-testid="button-reset-filters"
          >
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Model Filter */}
          <div>
            <Label htmlFor="model-filter">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model-filter" data-testid="select-model-filter">
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>

                {models?.map((mod: any) => (
                  <SelectItem key={mod.id} value={mod.id}>
                    {mod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider Filter */}
          <div>
            <Label htmlFor="provider-filter">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="provider-filter" data-testid="select-provider-filter">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers?.map((prov: any) => (
                  <SelectItem key={prov.id} value={prov.name}>
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <Label htmlFor="date-range-filter">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="date-range-filter" data-testid="select-date-range-filter">
                <SelectValue placeholder="Last 30 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last24">Last 24 Hours</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cache Status Filter */}
          <div>
            <Label htmlFor="cached-filter">Cache Status</Label>
            <Select value={cached} onValueChange={setCached}>
              <SelectTrigger id="cached-filter" data-testid="select-cached-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Cached</SelectItem>
                <SelectItem value="false">Not Cached</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cache Type Filter */}
          <div>
            <Label htmlFor="cache-type-filter">Cache Type</Label>
            <Select value={cacheType} onValueChange={setCacheType}>
              <SelectTrigger id="cache-type-filter" data-testid="select-cache-type-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="exact">Exact Match</SelectItem>
                <SelectItem value="semantic">Semantic Match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Code Filter */}
          {/* <div>
            <Label htmlFor="status-filter">Status Code</Label>
            <Select value={statusCode} onValueChange={setStatusCode}>
              <SelectTrigger id="status-filter" data-testid="select-status-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="200">200 - Success</SelectItem>
                <SelectItem value="400">400 - Bad Request</SelectItem>
                <SelectItem value="401">401 - Unauthorized</SelectItem>
                <SelectItem value="429">429 - Rate Limited</SelectItem>
                <SelectItem value="500">500 - Server Error</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>
      </div>

      {/* Results Summary */}
      {logsData && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, logsData.total)} of {logsData.total} logs
          </span>
          <div className="flex items-center gap-4">
            <Label htmlFor="limit-select">Per page:</Label>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
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
              <TableHead>Time</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              {/* <TableHead>Status</TableHead> */}
              <TableHead>Tokens</TableHead>
              {/* <TableHead>Duration</TableHead> */}
              <TableHead>Cache</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading usage logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : logsData?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No usage logs found</p>
                    <p className="text-sm">Try adjusting your filters or check back later.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logsData?.logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{log.model}</div>
                      {log.provider && (
                        <Badge variant="outline" className="text-xs">
                          {log.provider}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.provider}</Badge>
                  </TableCell>
                  {/* <TableCell>
                    {getStatusBadge(log.statusCode)}
                  </TableCell> */}
                  <TableCell className="font-mono">
                    {formatTokens(log.tokensUsed)}
                  </TableCell>
                  {/* <TableCell className="font-mono">
                    {formatDuration(log.responseTimeMs)}
                  </TableCell> */}
                  <TableCell>
                    {getCacheBadge(log.cached, log.cacheType)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(log)}
                      data-testid={`button-view-details-${log.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {logsData && logsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {logsData.totalPages}
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
              onClick={() => setPage(Math.min(logsData.totalPages, page + 1))}
              disabled={page === logsData.totalPages}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </div>
  );
}