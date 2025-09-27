import { useState, useEffect, useRef } from 'react';
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
import { Slider } from "@/components/ui/slider";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
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
    Settings,
    Search,
    Filter,
    Download,
    CalendarIcon
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiToken, ApiUsageLog, ApiTokenResponse, InsertApiToken, UsageAnalytics } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import UsageLogsPage from './usage-logs';
import QATable from '@/components/qa/QATable';

export default function APIIntegrationsPage() {
    const [cachingEnabled, setCachingEnabled] = useState(true);
    const [threshold, setThreshold] = useState(50);
    const [showNewToken, setShowNewToken] = useState(false);
    const [newTokenValue, setNewTokenValue] = useState('');
    const [selectedModel, setSelectedModel] = useState('all');
    const [dateRange, setDateRange] = useState('last30');
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();
    const [showFilters, setShowFilters] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
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
            userId: 'temp', // This will be set by the backend from auth
            semanticCacheThreshold: threshold / 100.0
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

                            {cachingEnabled && (
                                <div className="space-y-2">
                                    <Alert className="border-blue-200 dark:bg-blue-900/20" style={{ marginBottom: "20px" }}>
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
                                    <Label className="text-sm font-medium">Semantic Cache Threshold</Label>
                                    <Slider
                                        value={[threshold]}
                                        onValueChange={(v) => setThreshold(v[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Default is 50%. If similarity between queries is greater than{" "}
                                        <strong>{threshold}%</strong>, cached result will be reused.
                                    </p>
                                    <Alert className="border-blue-200 dark:bg-blue-900/20">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription className="text-white-700 dark:text-white-400 text-sm">
                                            <strong>Two caching modes:</strong>
                                            <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
                                                <li>
                                                    <strong>Exact caching:</strong> Identical requests reuse results (no threshold needed).
                                                </li>
                                                <li>
                                                    <strong>Semantic caching:</strong> Similar requests reuse results if above threshold.
                                                </li>
                                            </ul>

                                            <div className="mt-3 text-xs">
                                                <strong>Example:</strong><br />
                                                • With a <code>50%</code> threshold (recommended default),
                                                <em>“What is AI?”</em> and <em>“Explain artificial intelligence”</em> (~80% similar)
                                                will reuse the cached result.<br />
                                                • If you set a lower threshold (e.g., 30%), even loosely related queries may reuse results.<br />
                                                • If you set a higher threshold (e.g., 90%), only very close or identical queries will match —
                                                making it behave closer to exact caching.
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            className="w-full"
                            onClick={() => handleCreateToken()}
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
                            <TabsTrigger value="qa" data-testid="qa-tab">Question & Answer</TabsTrigger>
                        </TabsList>
                        <TabsContent value="logs">
                            <UsageLogsPage />
                        </TabsContent>
                        <TabsContent value="qa">
                            <QATable />
                        </TabsContent>
                    </Tabs>
                </>
            ) : (
                <TokenCreationCard />
            )}
        </div>
    );
}