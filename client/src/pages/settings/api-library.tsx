import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, RefreshCw, History, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import ApiLibraryDrawer from '@/components/api-library/ApiLibraryDrawer';
import { cn } from '@/lib/utils';

interface ApiConfig {
    id: string;
    name: string;
    method: string;
    endpoint: string;
    prompt_instructions?: string;
    created_at: string;
    updated_at: string;
}

interface ApiLibraryPageProps {
    workspaceId: string;
}

export default function ApiLibraryPage({ workspaceId }: ApiLibraryPageProps) {
    const [apis, setApis] = useState<ApiConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
    const [selectedApiForLogs, setSelectedApiForLogs] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const limit = 10;

    useEffect(() => {
        fetchApis();
    }, [page, searchTerm, methodFilter]);

    const fetchApis = async () => {
        setLoading(true);
        try {
            let url = `/api/api-library?page=${page}&limit=${limit}`;

            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }

            if (methodFilter !== 'all') {
                url += `&method=${methodFilter}`;
            }

            const response = await apiClient.get(url);
            const data = await response.json();
            setApis(data.apis || []);
            setTotalPages(data.total_pages || 1);
            setTotalCount(data.total_count || 0);
        } catch (err) {
            console.error('Failed to fetch APIs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedApiId(null);
        setDrawerOpen(true);
    };

    const handleEdit = (apiId: string) => {
        setSelectedApiId(apiId);
        setDrawerOpen(true);
    };

    const handleViewLogs = (apiId: string) => {
        setSelectedApiForLogs(apiId);
        setLogsDrawerOpen(true);
    };

    const handleDelete = async (apiId: string) => {
        if (!confirm('Are you sure you want to delete this API configuration?')) {
            return;
        }

        try {
            await apiClient.delete(`/api/api-library/${apiId}`);
            fetchApis();
        } catch (err) {
            console.error('Failed to delete API:', err);
            alert('Failed to delete API configuration');
        }
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET':
                return 'bg-green-900/20 text-green-400';
            case 'POST':
                return 'bg-blue-900/20 text-blue-400';
            case 'PUT':
                return 'bg-orange-900/20 text-orange-400';
            case 'PATCH':
                return 'bg-yellow-900/20 text-yellow-400';
            case 'DELETE':
                return 'bg-red-900/20 text-red-400';
            default:
                return 'bg-gray-900/20 text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">API Library</h1>
                    <p className="text-muted-foreground">
                        Create and manage API configurations for external integrations
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create API
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search APIs..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={methodFilter}
                    onValueChange={(value) => {
                        setMethodFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>API Name</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex items-center justify-center space-x-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Loading APIs...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : apis.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="text-muted-foreground">
                                        <p>No APIs found</p>
                                        {!searchTerm && methodFilter === 'all' && (
                                            <p className="text-sm">Create your first API to get started.</p>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            apis.map((api) => (
                                <TableRow key={api.id}>
                                    <TableCell>
                                        <div className="font-medium">{api.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={getMethodColor(api.method)}
                                        >
                                            {api.method}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-mono text-muted-foreground truncate max-w-xs">
                                            {api.endpoint}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                                            {api.prompt_instructions || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(api.updated_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewLogs(api.id)}
                                                title="View Logs"
                                            >
                                                <History className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(api.id)}
                                                title="Edit API"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(api.id)}
                                                className="text-destructive hover:text-destructive"
                                                title="Delete API"
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
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} • {totalCount} total
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
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Drawer */}
            <ApiLibraryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                apiId={selectedApiId}
                onSuccess={fetchApis}
            />

            {/* Logs Drawer */}
            <ApiLogsDrawer
                isOpen={logsDrawerOpen}
                onClose={() => setLogsDrawerOpen(false)}
                apiId={selectedApiForLogs}
            />
        </div>
    );
}

// API Logs Drawer Component
interface ApiLog {
    id: string;
    status_code: number;
    success: boolean;
    duration_ms: number;
    retry_count: number;
    error_message: string | null;
    request_data: any;
    response_data: any;
    created_at: string;
}

interface ApiLogsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    apiId: string | null;
}

function ApiLogsDrawer({ isOpen, onClose, apiId }: ApiLogsDrawerProps) {
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiName, setApiName] = useState('');
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

    useEffect(() => {
        if (isOpen && apiId) {
            fetchLogs();
            fetchApiDetails();
        }
    }, [isOpen, apiId]);

    const fetchLogs = async () => {
        if (!apiId) return;
        
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/api-library/${apiId}/runs`);
            const data = await response.json();
            setLogs(data.runs || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchApiDetails = async () => {
        if (!apiId) return;
        
        try {
            const response = await apiClient.get(`/api/api-library/${apiId}`);
            const data = await response.json();
            setApiName(data.name || 'API');
        } catch (err) {
            console.error('Failed to fetch API details:', err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const toggleLogExpansion = (logId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    // Calculate counts and filter logs
    const { successCount, failedCount, filteredLogs } = useMemo(() => {
        const successCount = logs.filter(log => log.success).length;
        const failedCount = logs.filter(log => !log.success).length;
        
        let filteredLogs = logs;
        if (statusFilter === 'success') {
            filteredLogs = logs.filter(log => log.success);
        } else if (statusFilter === 'failed') {
            filteredLogs = logs.filter(log => !log.success);
        }
        
        return { successCount, failedCount, filteredLogs };
    }, [logs, statusFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            {/* Drawer - Slide from right */}
            <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-card border-l shadow-2xl animate-slide-in-right flex flex-col">
                {/* Header */}
                <div className="p-6 border-b bg-card shrink-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <History className="w-6 h-6" />
                                API Logs
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {apiName} - Execution History
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Stats and Filter */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Count Stats */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border border-green-500/30 rounded-lg">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm font-medium text-green-400">Success: {successCount}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-sm font-medium text-red-400">Failed: {failedCount}</span>
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <div className="flex gap-1">
                                <Button
                                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('all')}
                                    className="text-xs"
                                >
                                    All
                                </Button>
                                <Button
                                    variant={statusFilter === 'success' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('success')}
                                    className="text-xs"
                                >
                                    Success
                                </Button>
                                <Button
                                    variant={statusFilter === 'failed' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('failed')}
                                    className="text-xs"
                                >
                                    Failed
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center space-x-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Loading logs...</span>
                            </div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No execution logs found</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Logs will appear here after the API is executed
                            </p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No logs match the selected filter</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Try selecting a different filter option
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLogs.map((log) => {
                                const isExpanded = expandedLogs.has(log.id);
                                return (
                                    <div
                                        key={log.id}
                                        className="border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                                    >
                                        {/* Header - Always Visible */}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    {/* Status and Time */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <Badge
                                                            className={cn(
                                                                log.success
                                                                    ? 'bg-green-900/20 text-green-400 border-green-500/30'
                                                                    : 'bg-red-900/20 text-red-400 border-red-500/30'
                                                            )}
                                                        >
                                                            {log.success ? '✓ Success' : '✗ Failed'}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            Status: {log.status_code || 'N/A'}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(log.created_at)}
                                                        </span>
                                                    </div>

                                                    {/* Metrics */}
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground">Duration:</span>
                                                            <span className="font-mono font-medium">
                                                                {formatDuration(log.duration_ms)}
                                                            </span>
                                                        </div>
                                                        {log.retry_count > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground">Retries:</span>
                                                                <span className="font-mono font-medium text-orange-400">
                                                                    {log.retry_count}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Error Message */}
                                                    {log.error_message && (
                                                        <div className="mt-3 p-3 bg-red-900/10 border border-red-500/20 rounded">
                                                            <div className="text-xs text-red-400 font-medium mb-1">Error:</div>
                                                            <div className="text-sm text-red-300 font-mono break-all">
                                                                {log.error_message}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expand/Collapse Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleLogExpansion(log.id)}
                                                    className="ml-2"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expandable Details */}
                                        {isExpanded && (
                                            <div className="border-t p-4 space-y-4 bg-slate-900/20">
                                                {/* Request Data */}
                                                {log.request_data && (
                                                    <div>
                                                        <div className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                                            Request
                                                        </div>
                                                        <div className="bg-slate-950/50 border border-slate-700 rounded p-3 overflow-x-auto">
                                                            <pre className="text-xs font-mono text-slate-300">
                                                                {JSON.stringify(log.request_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Response Data */}
                                                {log.response_data && (
                                                    <div>
                                                        <div className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                            Response
                                                        </div>
                                                        <div className="bg-slate-950/50 border border-slate-700 rounded p-3 overflow-x-auto">
                                                            <pre className="text-xs font-mono text-slate-300">
                                                                {JSON.stringify(log.response_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
