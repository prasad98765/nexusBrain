import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
                                                onClick={() => handleEdit(api.id)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(api.id)}
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
        </div>
    );
}
