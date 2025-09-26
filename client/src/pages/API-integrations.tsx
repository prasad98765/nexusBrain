import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Copy,
    ExternalLink,
    Key,
    AlertTriangle,
    CheckCircle,
    RotateCcw,
    Eye,
    EyeOff,
    Info,
    Zap,
    Clock,
    BarChart3,
    Settings
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiToken, ApiUsageLog, ApiTokenResponse, InsertApiToken, UsageAnalytics } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

export default function APIIntegrationsPage() {
    const [cachingEnabled, setCachingEnabled] = useState(true);
    const [showNewToken, setShowNewToken] = useState(false);
    const [newTokenValue, setNewTokenValue] = useState('');
    const [selectedModel, setSelectedModel] = useState('all');
    const [dateRange, setDateRange] = useState('last30');
    const [filterType, setFilterType] = useState('all');
    const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
    const { toast } = useToast();
    const { user, token } = useAuth();

    // Queries
    const { data: tokenData, isLoading: tokenLoading, error: tokenError } =
        useQuery<{ tokens: ApiToken[]; hasToken: boolean }>({
            queryKey: ["/api/api-tokens"],
            queryFn: async () => {
                const response = await axios.get<{ tokens: ApiToken[]; hasToken: boolean }>(
                    "/api/api-tokens",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                return response.data;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
        });

    const { data: logsData, isLoading: logsLoading } = useQuery<{
        logs: ApiUsageLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>({
        queryKey: [
            "/api/api-tokens/usage-logs",
            { selectedModel, dateRange, filterType },
        ],
        queryFn: async () => {
            const response = await axios.get<{
                logs: ApiUsageLog[];
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            }>("/api/api-tokens/usage-logs", {
                params: { selectedModel, dateRange, filterType }, // Axios handles query params
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        },
        enabled: tokenData?.hasToken,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const { data: analyticsData } = useQuery<UsageAnalytics>({
        queryKey: ["/api/api-tokens/analytics", { dateRange }],
        queryFn: async () => {
            const response = await axios.get<UsageAnalytics>(
                "/api/api-tokens/analytics",
                {
                    params: { dateRange },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return response.data;
        },
        enabled: tokenData?.hasToken,
        staleTime: 5 * 60 * 1000,
    });
    // call /v1/models api and set model as one set and use this in select model dropdown
    const { data: modelData, isLoading: modelLoading, error: modelError } =
        useQuery<{ models: string[] }>({
            queryKey: ["/api/v1/models"],
            queryFn: async () => {
                const response = await axios.get<{ data: { id: string }[] }>(
                    "/api/v1/models",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                // Extract the object has id and name property
                const models: any = response.data.data.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                }));

                return { models };
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
        });

    console.log("modelData", modelData?.models);

    const modelOptions = modelData?.models || [];
    console.log("modelOptions", modelOptions);


    // Mutations
    const createTokenMutation = useMutation({
        mutationFn: async (data: InsertApiToken) => {
            const response = await axios.post<ApiTokenResponse>(
                "/api/api-tokens",
                data,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return response.data;
        },
        onSuccess: (response) => {
            setNewTokenValue(response.plainToken);
            setShowNewToken(true);
            queryClient.invalidateQueries({ queryKey: ["/api/api-tokens"] });
            toast({
                title: "Token Created Successfully! ✅",
                description:
                    "Your API token has been created. Make sure to copy it now as you won't see it again.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to Create Token",
                description:
                    error.response?.data?.message ||
                    error.message ||
                    "An error occurred while creating the token.",
                variant: "destructive",
            });
        },
    });

    const regenerateTokenMutation = useMutation({
        mutationFn: async ({
            tokenId,
            data,
        }: {
            tokenId: string;
            data: InsertApiToken;
        }) => {
            const response = await axios.post<ApiTokenResponse>(
                `/api/api-tokens/${tokenId}/regenerate`,
                data,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return response.data;
        },
        onSuccess: (response) => {
            setNewTokenValue(response.plainToken);
            setShowNewToken(true);
            setIsRegenerateDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/api-tokens"] });
            toast({
                title: "Token Regenerated Successfully! ✅",
                description:
                    "Your new API token has been created. The old token is now inactive.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to Regenerate Token",
                description:
                    error.response?.data?.message ||
                    error.message ||
                    "An error occurred while regenerating the token.",
                variant: "destructive",
            });
        },
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard! 📋",
            description: "The token has been copied to your clipboard.",
        });
    };

    const handleCreateToken = async () => {
        createTokenMutation.mutate({
            cachingEnabled: cachingEnabled,
            workspaceId: 'temp', // This will be set by the backend from auth
            userId: 'temp' // This will be set by the backend from auth
        });
    };

    const handleRegenerateToken = async () => {
        const existingToken = tokenData?.tokens?.[0];
        if (!existingToken) return;

        regenerateTokenMutation.mutate({
            tokenId: existingToken.id,
            data: {
                cachingEnabled: cachingEnabled,
                workspaceId: 'temp',
                userId: 'temp'
            }
        });
    };

    const hasExistingToken = tokenData?.hasToken;
    const existingToken = tokenData?.tokens?.[0];

    const TokenCreationCard = () => {
        const curlCommand = newTokenValue ? `curl -X POST 'https://nexusai.hub/api/v1/chat/create' \\
  -H 'Authorization: Bearer ${newTokenValue}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "max_tokens": 150
  }'` : '';

        if (showNewToken && newTokenValue) {
            return (
                <Card className="border-green-200 dark:border-green-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            Token Created Successfully!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                                ⚠️ <strong>Important:</strong> This API token will only be shown once. Please copy and store it somewhere safe immediately.
                            </AlertDescription>
                        </Alert>

                        <div className="dark:bg-slate-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium">Your API Token</Label>
                                <Badge variant="secondary" className="text-xs">Only shown once</Badge>
                            </div>
                            <div className="flex items-center gap-2 p-3 dark:bg-slate-900 border rounded-md">
                                <code className="flex-1 font-mono text-sm break-all">{newTokenValue}</code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(newTokenValue)}
                                    data-testid="copy-token"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="flex-1"
                                onClick={() => {
                                    setShowNewToken(false);
                                    setNewTokenValue('');
                                }}
                                data-testid="continue-to-dashboard"
                            >
                                Continue to Dashboard
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.open('/docs/api-reference', '_blank')}
                                data-testid="view-docs"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Docs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-600" />
                        Create Your API Token
                    </CardTitle>
                    <CardDescription>
                        Generate a secure API token to access Nexus AI Hub's powerful AI capabilities. Your token will be unique to your workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Enable Response Caching</Label>
                                    <p className="text-xs text-slate-500">Improve response times and reduce costs</p>
                                </div>
                                <Switch
                                    checked={cachingEnabled}
                                    onCheckedChange={setCachingEnabled}
                                    data-testid="toggle-caching"
                                />
                            </div>

                            <Alert className="border-blue-200 dark:bg-blue-900/20">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-white-700 dark:text-white-400 text-sm">
                                    <strong>Why enable caching?</strong>
                                    <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
                                        <li><strong>Faster responses:</strong> Cached results return instantly</li>
                                        <li><strong>Cost savings:</strong> Avoid duplicate API calls for identical requests</li>
                                        <li><strong>Better performance:</strong> Reduced latency for your users</li>
                                        <li><strong>Rate limit protection:</strong> Helps stay within API rate limits</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            className="w-full"
                            onClick={handleCreateToken}
                            disabled={createTokenMutation.isPending}
                            data-testid="create-token-button"
                        >
                            {createTokenMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Creating Token...
                                </>
                            ) : (
                                <>
                                    <Key className="w-4 h-4 mr-2" />
                                    Create API Token
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="text-center">
                        <Button
                            variant="link"
                            onClick={() => window.open('/docs/api-reference', '_blank')}
                            className="text-sm"
                            data-testid="preview-docs"
                        >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Preview API Documentation
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const TokenManagementHeader = () => {
        if (!existingToken) return null;

        return (
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active Token
                                </Badge>
                                <span className="font-medium">{existingToken.name}</span>
                                <Badge variant={existingToken.cachingEnabled ? 'default' : 'secondary'} className="text-xs">
                                    <Zap className="w-3 h-3 mr-1" />
                                    {existingToken.cachingEnabled ? 'Caching ON' : 'Caching OFF'}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                                Created {new Date(existingToken.createdAt).toLocaleDateString()}
                                {existingToken.lastUsedAt && (
                                    <> • Last used {new Date(existingToken.lastUsedAt).toLocaleDateString()}</>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open('/docs/api-reference', '_blank')}
                                    data-testid="view-docs"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Docs
                                </Button>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" data-testid="regenerate-token">
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Regenerate Token
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Regenerate API Token</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will create a new token and immediately deactivate the current one.
                                            Any applications using the current token will stop working until you update them with the new token.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="new-caching"
                                                checked={cachingEnabled}
                                                onCheckedChange={setCachingEnabled}
                                            />
                                            <Label htmlFor="new-caching">Enable response caching</Label>
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleRegenerateToken}
                                            disabled={regenerateTokenMutation.isPending}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {regenerateTokenMutation.isPending ? 'Regenerating...' : 'Regenerate Token'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const AnalyticsCards = () => {
        if (!analyticsData) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Requests</p>
                                <p className="text-2xl font-bold">{analyticsData.totalRequests?.toLocaleString() || 0}</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Tokens Used</p>
                                <p className="text-2xl font-bold">{analyticsData.totalTokens?.toLocaleString() || 0}</p>
                            </div>
                            <Zap className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Avg Response</p>
                                <p className="text-2xl font-bold">{analyticsData.averageResponseTime || 0}ms</p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Success Rate</p>
                                <p className="text-2xl font-bold">{analyticsData.successRate || 0}%</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const LogsTab = () => {
        if (logsLoading) {
            return (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            );
        }

        const logs = logsData?.logs || [];

        return (
            <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Models</SelectItem>
                            {modelOptions.map((model: any) => (
                                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last30">Last 30 Days</SelectItem>
                            <SelectItem value="last7">Last 7 Days</SelectItem>
                            <SelectItem value="last24">Last 24 Hours</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Requests</SelectItem>
                            <SelectItem value="high">High Usage (1000+ tokens)</SelectItem>
                            <SelectItem value="low">Low Usage (≤100 tokens)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {logs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-medium">Time</th>
                                            <th className="text-left p-3 text-sm font-medium">Endpoint</th>
                                            <th className="text-left p-3 text-sm font-medium">Model</th>
                                            <th className="text-left p-3 text-sm font-medium">Status</th>
                                            <th className="text-left p-3 text-sm font-medium">Tokens</th>
                                            <th className="text-left p-3 text-sm font-medium">Response Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, index) => (
                                            <tr key={log.id} className={index % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50 dark:bg-slate-900'}>
                                                <td className="p-3 text-sm">
                                                    {new Date(log.createdAt).toLocaleDateString()}<br />
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm font-mono">{log.endpoint}</td>
                                                <td className="p-3 text-sm">
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.model}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        className={`text-xs ${log.statusCode === 200
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400'
                                                            }`}
                                                    >
                                                        {log.statusCode}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-sm">{log.tokensUsed?.toLocaleString() || 0}</td>
                                                <td className="p-3 text-sm">{log.responseTimeMs || 0}ms</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-600 mb-2">No API usage yet</h3>
                                <p className="text-sm text-slate-500 mb-4">Start making API calls to see your usage logs here</p>
                                <Button variant="outline" onClick={() => window.open('/docs/api-reference/test', '_blank')}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Try API Testing
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {logs.length > 0 && logsData && logsData.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing {logs.length} of {logsData.total} results
                        </p>
                        <div className="text-sm text-slate-500">
                            Page {logsData.page} of {logsData.totalPages}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const AnalyticsTab = () => {
        if (!analyticsData) {
            return (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Models */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Top Models</CardTitle>
                            <CardDescription>Most used AI models in your workspace</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analyticsData.topModels?.length > 0 ? (
                                    analyticsData.topModels.map((model, index) => (
                                        <div key={model.model} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <span className="text-sm font-medium">{model.model}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">{model.requests} requests</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    #{index + 1}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No data available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Request Activity</CardTitle>
                            <CardDescription>API calls over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analyticsData.requestsOverTime?.length > 0 ? (
                                    analyticsData.requestsOverTime.slice(0, 7).map((item) => (
                                        <div key={item.date} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">{new Date(item.date).toLocaleDateString()}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 bg-indigo-500 rounded-full"
                                                        style={{
                                                            width: `${Math.max((item.requests / Math.max(...analyticsData.requestsOverTime!.map(r => r.requests))) * 100, 5)}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-slate-500">{item.requests}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No data available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    const handleViewDocs = () => {
        window.open('/docs/api-reference', '_blank');
    };

    if (tokenLoading) {
        return (
            <div className="space-y-6">
                <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-lg text-white">
                    <h1 className="text-2xl font-bold">API Integration</h1>
                    <p className="text-indigo-100 mt-1">Manage your API tokens and monitor usage</p>
                </div>
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="space-y-6">
                <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-lg text-white">
                    <h1 className="text-2xl font-bold">API Integration</h1>
                    <p className="text-indigo-100 mt-1">Manage your API tokens and monitor usage</p>
                </div>
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-700 dark:text-red-400">
                        Failed to load token information. Please refresh the page or contact support if the problem persists.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {showNewToken && newTokenValue ? (
                <TokenCreationCard />
            ) : hasExistingToken ? (
                <>
                    <TokenManagementHeader />
                    <AnalyticsCards />
                    <Tabs defaultValue="logs" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="logs" data-testid="logs-tab">Usage Logs</TabsTrigger>
                            <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
                        </TabsList>
                        <TabsContent value="logs">
                            <LogsTab />
                        </TabsContent>
                        <TabsContent value="analytics">
                            <AnalyticsTab />
                        </TabsContent>
                    </Tabs>
                </>
            ) : (
                <TokenCreationCard />
            )}
        </div>
    );
}