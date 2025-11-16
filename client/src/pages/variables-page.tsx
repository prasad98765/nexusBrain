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
import { useAuth } from '@/hooks/useAuth';
import CreateVariableModal from '@/components/variables/CreateVariableModal';

interface Variable {
    id: string;
    name: string;
    description: string;
    format: 'text' | 'number' | 'date' | 'name' | 'email' | 'phone' | 'regex';
    error_message?: string;
    regex_pattern?: string;
    created_at: string;
}

export default function VariablesPage() {
    const { user } = useAuth();
    const [variables, setVariables] = useState<Variable[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formatFilter, setFormatFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingVariable, setEditingVariable] = useState<Variable | null>(null);

    const limit = 10;

    useEffect(() => {
        fetchVariables();
    }, [page, searchTerm, formatFilter]);

    const fetchVariables = async () => {

        setLoading(true);
        try {
            let url = `/api/variables?workspace_id=${user.workspaceId}&page=${page}&limit=${limit}`;

            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }

            if (formatFilter !== 'all') {
                url += `&format=${formatFilter}`;
            }

            const response = await apiClient.get(url);
            const data = await response.json();
            setVariables(data.variables || []);
            setTotalPages(data.total_pages || 1);
            setTotalCount(data.total_count || 0);
        } catch (err) {
            console.error('Failed to fetch variables:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this variable?')) return;

        try {
            await apiClient.delete(`/api/variables/${id}`);
            fetchVariables();
        } catch (err) {
            console.error('Failed to delete variable:', err);
            alert('Failed to delete variable');
        }
    };

    const handleEdit = (variable: Variable) => {
        setEditingVariable(variable);
        setShowCreateModal(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFormatBadgeColor = (format: string) => {
        const colors: Record<string, string> = {
            text: 'bg-blue-900/20 text-blue-400',
            number: 'bg-green-900/20 text-green-400',
            date: 'bg-purple-900/20 text-purple-400',
            name: 'bg-cyan-900/20 text-cyan-400',
            email: 'bg-orange-900/20 text-orange-400',
            phone: 'bg-pink-900/20 text-pink-400',
            regex: 'bg-red-900/20 text-red-400'
        };
        return colors[format] || 'bg-gray-900/20 text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Variables</h1>
                    <p className="text-muted-foreground">
                        Manage variables for workflow input validation
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingVariable(null);
                        setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Variable
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search variables..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={formatFilter}
                    onValueChange={(value) => {
                        setFormatFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Variable Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Format</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex items-center justify-center space-x-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Loading variables...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : variables.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="text-muted-foreground">
                                        <p>No variables found</p>
                                        {!searchTerm && formatFilter === 'all' && (
                                            <p className="text-sm">Create your first variable to get started.</p>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            variables.map((variable) => (
                                <TableRow key={variable.id}>
                                    <TableCell>
                                        <div className="font-medium">{variable.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                                            {variable.description}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={getFormatBadgeColor(variable.format)}
                                        >
                                            {variable.format}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(variable.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(variable)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(variable.id)}
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
                        Page {page} of {totalPages}
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

            {/* Create/Edit Variable Modal */}
            <CreateVariableModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingVariable(null);
                }}
                onSuccess={() => {
                    fetchVariables();
                    setShowCreateModal(false);
                    setEditingVariable(null);
                }}
                editVariable={editingVariable as any}
            />
        </div>
    );
}
