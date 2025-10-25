import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    RadialBarChart,
    RadialBar,
    LabelList,
} from 'recharts';
import {
    CalendarIcon,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Clock,
    Zap,
    AlertTriangle,
    Database,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    BarChart3,
    PieChart as PieChartIcon,
    Settings,
    Filter,
    CheckCircle,
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useModelStore } from '@/store/modelStore';

// Premium gradient color schemes
const GRADIENT_COLORS = {
    purple: ['#a855f7', '#7c3aed', '#6d28d9'],
    blue: ['#3b82f6', '#2563eb', '#1d4ed8'],
    green: ['#10b981', '#059669', '#047857'],
    orange: ['#f59e0b', '#d97706', '#b45309'],
    pink: ['#ec4899', '#db2777', '#be185d'],
    cyan: ['#06b6d4', '#0891b2', '#0e7490'],
};

const CHART_COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

interface DateRange {
    from: Date;
    to: Date;
}

interface AnalyticsFilters {
    dateRange: DateRange;
    workspace_id?: string;
    provider?: string;
    model?: string;
    cached?: boolean;
    rag?: boolean;
    // interval: 'day' | 'week' | 'month';
}

export default function AnalyticsDashboard() {
    const { toast } = useToast();
    const { token } = useAuth();

    // Date presets
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    // Filters
    // const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');
    const [provider, setProvider] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [cachedFilter, setCachedFilter] = useState<boolean | undefined>(undefined);
    const [ragFilter, setRagFilter] = useState<boolean | undefined>(undefined);
    const { models, providers, fetchModelsAndProviders } = useModelStore();

    // Build query params
    const queryParams = useMemo(() => {
        // Helper function to format date in local timezone as YYYY-MM-DD
        const formatDateLocal = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const params = new URLSearchParams({
            start_date: formatDateLocal(dateRange.from),
            end_date: formatDateLocal(dateRange.to),
            // interval,
        });

        if (provider) params.append('provider', provider);
        if (model) params.append('model', model);
        if (cachedFilter !== undefined) params.append('cached', String(cachedFilter));
        if (ragFilter !== undefined) params.append('rag', String(ragFilter));

        return params.toString();
    }, [dateRange, provider, model, cachedFilter, ragFilter]);

    // API Queries
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['analytics-overview', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/overview?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: trends, isLoading: trendsLoading } = useQuery({
        queryKey: ['analytics-trends', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/trends?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: models_list } = useQuery({
        queryKey: ['analytics-models', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/models?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // sort as per requests
            return response.data.sort((a: any, b: any) => b.requests - a.requests);;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: providers_list } = useQuery({
        queryKey: ['analytics-providers', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/providers?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: errors } = useQuery({
        queryKey: ['analytics-errors', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/errors?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: caching } = useQuery({
        queryKey: ['analytics-caching', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/caching?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: performance } = useQuery({
        queryKey: ['analytics-performance', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/performance?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: endpoints } = useQuery({
        queryKey: ['analytics-endpoints', queryParams],
        queryFn: async () => {
            const response = await axios.get(
                `/api/analytics/endpoints?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Export CSV
    const handleExport = async () => {
        try {
            const response = await axios.get(
                `/api/analytics/export?${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: "Export Successful",
                description: "Analytics data has been exported to CSV.",
            });
        } catch (error) {
            toast({
                title: "Export Failed",
                description: "Failed to export analytics data.",
                variant: "destructive",
            });
        }
    };

    // Format numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
        return num.toFixed(0);
    };

    const formatCurrency = (num: number) => {
        return `$${num.toFixed(4)}`;
    };

    const formatPercentage = (num: number) => {
        return `${(num * 100).toFixed(2)}%`;
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Filters Card with Glass Effect */}
            {/* Enhanced Filters Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/5 border-2 border-primary/20 shadow-2xl backdrop-blur-xl">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black,transparent)]" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-48 translate-x-48" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-48 -translate-x-48" />

                    <CardHeader className="relative border-b border-primary/20 bg-primary/5 backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
                                        <Filter className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                                            Advanced Filters
                                            <div className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full border border-primary/30">
                                                CONTROLS
                                            </div>
                                        </h2>
                                        <p className="text-muted-foreground text-sm">
                                            Customize your analytics view with powerful filtering options
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleExport}
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/30"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="relative p-6">
                        {/* Filters Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {/* Date Range */}
                            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                    <Label className="text-sm font-semibold text-card-foreground">Date Range</Label>
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal text-sm border-dashed",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="center">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={(range) => {
                                                if (range?.from && range?.to) {
                                                    setDateRange({ from: range.from, to: range.to });
                                                } else if (range?.from) {
                                                    // When only start date is selected, use it for both start and end
                                                    setDateRange({ from: range.from, to: range.from });
                                                }
                                            }}
                                            numberOfMonths={2}
                                            className="flex gap-4"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3 text-xs"
                                        onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                                    >
                                        Last 7 days
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3 text-xs"
                                        onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                                    >
                                        Last 30 days
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3 text-xs"
                                        onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
                                    >
                                        Last 90 days
                                    </Button>
                                </div>
                            </div>

                            {/* Time Interval */}
                            {/* <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <Label className="text-sm font-semibold text-card-foreground">Time Interval</Label>
                                </div>
                                <Select value={interval} onValueChange={(v: any) => setInterval(v)}>
                                    <SelectTrigger className="h-9 border-dashed">
                                        <SelectValue placeholder="Select interval" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">📅 Daily</SelectItem>
                                        <SelectItem value="week">📊 Weekly</SelectItem>
                                        <SelectItem value="month">📈 Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Data aggregation period
                                </p>
                            </div> */}

                            {/* Provider Filter */}
                            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300">
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-green-500" />
                                    <Label className="text-sm font-semibold text-card-foreground">Provider</Label>
                                </div>
                                <Select value={provider || "all"} onValueChange={(v) => setProvider(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-9 border-dashed">
                                        <SelectValue placeholder="All providers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* <SelectItem value="all">🌐 All Providers</SelectItem>
                                        <SelectItem value="OpenAI">🤖 OpenAI</SelectItem>
                                        <SelectItem value="Anthropic">🧠 Anthropic</SelectItem>
                                        <SelectItem value="Google">🔍 Google</SelectItem> */}
                                        <SelectItem value="all">All Providers</SelectItem>
                                        {providers.map((provider: any) => (
                                            <SelectItem key={provider.name} value={provider.name}>
                                                {provider.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Filter by AI provider
                                </p>
                            </div>

                            {/* Advanced Options */}
                            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-500" />
                                    <Label className="text-sm font-semibold text-card-foreground">Options</Label>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                                        <Label className="text-xs font-medium cursor-pointer flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            Cached Only
                                        </Label>
                                        <Switch
                                            checked={cachedFilter === true}
                                            onCheckedChange={(checked) => setCachedFilter(checked ? true : undefined)}
                                            className="scale-75"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                                        <Label className="text-xs font-medium cursor-pointer flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            RAG Only
                                        </Label>
                                        <Switch
                                            checked={ragFilter === true}
                                            onCheckedChange={(checked) => setRagFilter(checked ? true : undefined)}
                                            className="scale-75"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Premium Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Requests Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    formatNumber(overview?.total_requests || 0)
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    API Calls
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                in selected period
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Total Tokens Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground"> Total Tokens</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Database className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    formatNumber(overview?.total_tokens || 0)
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1">
                                    <Progress
                                        value={overview?.total_tokens ? Math.min((overview.total_tokens / 10000000) * 100, 100) : 0}
                                        className="h-1.5 bg-muted"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Avg: {formatNumber(overview?.avg_tokens_per_request || 0)} per request
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Total Cost Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-muted-foreground"> {cachedFilter ? "Saved Cost" : "Total Cost"}</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    formatCurrency(cachedFilter ? overview?.cached_savings_usd || 0 : overview?.total_cost_usd || 0)
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    USD
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Total spending
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Avg Latency Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-muted-foreground">Avg Latency</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    `${overview?.avg_latency_ms?.toFixed(0) || 0}ms`
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Response
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Average response time
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Cache Hit Rate Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-muted-foreground">Cache Hit Rate</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    formatPercentage(overview?.cache_hit_rate || 0)
                                )}
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Hit Rate</span>
                                    <span>{((overview?.cache_hit_rate || 0) * 100).toFixed(1)}%</span>
                                </div>
                                <Progress
                                    value={(overview?.cache_hit_rate || 0) * 100}
                                    className="h-2 bg-muted"
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2">
                                Cached responses
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* RAG Usage Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-muted-foreground">RAG Usage</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    formatPercentage(overview?.rag_usage_rate || 0)
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                                    <Database className="w-3 h-3 mr-1" />
                                    Context
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                With document context
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Error Rate Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                >
                    <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-muted-foreground">Error Rate</CardTitle>
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-destructive" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-card-foreground">
                                {overviewLoading ? (
                                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                ) : (
                                    formatPercentage(overview?.error_rate || 0)
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0">
                                    {(overview?.error_rate || 0) < 0.05 ? (
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                    ) : (
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                    )}
                                    Errors
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Failed requests
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Premium Charts Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Usage Trends - Area Chart */}
                <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-purple-200/20 dark:border-purple-800/20">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-primary/80 to-primary rounded-lg">
                                <BarChart3 className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-card-foreground">
                                    Usage Trends
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">Requests and tokens over time</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trends || []}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                                    stroke="#FFFFFF"
                                    tick={{ fill: '#FFFFFF' }}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#FFFFFF"
                                    tick={{ fill: '#FFFFFF' }}
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="#a855f7"
                                    fillOpacity={1}
                                    fill="url(#colorRequests)"
                                    strokeWidth={3}
                                    name="Requests"
                                    animationDuration={1500}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="tokens"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorTokens)"
                                    strokeWidth={3}
                                    name="Tokens"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Cost Trends - Gradient Line Chart */}
                <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-green-200/20 dark:border-green-800/20">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-primary/80 to-primary rounded-lg">
                                <DollarSign className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-card-foreground">
                                    Cost Trends
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">Spending over time</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trends || []}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                                    stroke="#FFFFFF"
                                    tick={{ fill: '#FFFFFF' }}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#FFFFFF"
                                    tick={{ fill: '#FFFFFF' }}
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="cost_usd"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorCost)"
                                    strokeWidth={3}
                                    name="Cost (USD)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Premium Models & Providers Charts */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Top Models - 3D Style Bar Chart */}
                <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary rounded-lg">
                                    <Activity className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-card-foreground">
                                        Top Models
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">Usage by model</CardDescription>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                                Top 10
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={(models_list || []).slice(0, 10)}>
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                                <XAxis
                                    dataKey="model"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    stroke="#FFFFFF"
                                    tick={{ fill: '#FFFFFF' }}
                                    style={{ fontSize: '11px' }}
                                />
                                <YAxis
                                    stroke="#FFFFFF"
                                    tick={{ fill: '#FFFFFF' }}
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    formatter={(value: any) => formatNumber(value)}
                                    contentStyle={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #000000',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: '#000000'
                                    }}
                                    labelStyle={{ color: '#000000' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar
                                    dataKey="requests"
                                    fill="url(#colorBar)"
                                    name="Requests"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Provider Distribution - Enhanced Pie Chart */}
                <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary rounded-lg">
                                <PieChartIcon className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-card-foreground">
                                    Provider Distribution
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">Cost by provider</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={(providers_list || []).slice(0, 7)}
                                    dataKey="cost_usd"
                                    nameKey="provider"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, provider, cost_usd }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text
                                                x={x}
                                                y={y}
                                                fill="#FFFFFF"
                                                textAnchor={x > cx ? 'start' : 'end'}
                                                dominantBaseline="central"
                                                fontSize="12"
                                                fontWeight="500"
                                            >
                                                {`${provider}: ${formatCurrency(cost_usd)}`}
                                            </text>
                                        );
                                    }}
                                    labelLine={false}
                                    animationDuration={1500}
                                >
                                    {(providers_list || []).map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            style={{
                                                filter: `drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))`,
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                        border: '1px solid #FFFFFF',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: '#FFFFFF'
                                    }}
                                    labelStyle={{
                                        color: '#FFFFFF'
                                    }}
                                    itemStyle={{
                                        color: '#FFFFFF'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Premium Tables Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* Top Errors Table */}
                <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-destructive/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-destructive rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-card-foreground">
                                    Top Errors
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">Most frequent error messages</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-white">Error Message</TableHead>
                                    <TableHead className="text-right text-white">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(errors?.top_errors || []).map((error: any, index: number) => (
                                    <TableRow key={index} className="border-border hover:bg-white/10">
                                        <TableCell className="font-medium text-white">{error.message}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="destructive" className="bg-destructive/10 text-white border-white">
                                                {error.count}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!errors?.top_errors || errors.top_errors.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-primary/10 rounded-full">
                                                    <CheckCircle className="w-8 h-8 text-primary" />
                                                </div>
                                                <p className="text-sm text-primary font-medium">No errors found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Slowest Models Table */}
                <Card className="relative overflow-hidden border-0 bg-card backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary rounded-lg">
                                <Clock className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-card-foreground">
                                    Slowest Models
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">Models with highest latency</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-white">Model</TableHead>
                                    <TableHead className="text-right text-white">Avg Latency</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(performance?.slowest_models || []).map((model: any, index: number) => (
                                    <TableRow key={index} className="border-border hover:bg-white/10">
                                        <TableCell className="font-medium text-white">{model.model}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="bg-primary/10 text-white border-white">
                                                {model.avg_latency.toFixed(0)}ms
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!performance?.slowest_models || performance.slowest_models.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-white">
                                            No data available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Premium Endpoint Usage Table */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                <Card className="relative overflow-hidden border border-0 bg-card backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
                                <Activity className="w-4 h-4 text-card-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-card-foreground">
                                    Endpoint Usage
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">API endpoint statistics and performance</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-white">Endpoint</TableHead>
                                    <TableHead className="text-right text-white">Requests</TableHead>
                                    <TableHead className="text-right text-white">Tokens</TableHead>
                                    <TableHead className="text-right text-white">Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(endpoints || []).map((endpoint: any, index: number) => (
                                    <TableRow key={index} className="border-border hover:bg-white/10">
                                        <TableCell className="font-medium text-white">
                                            <code className="text-xs bg-muted px-2 py-1 rounded text-white">
                                                {endpoint.endpoint}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="bg-primary/10 text-white border-white">
                                                {formatNumber(endpoint.requests)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="bg-primary/10 text-white border-white">
                                                {formatNumber(endpoint.tokens)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="bg-primary/10 text-white border-white">
                                                {formatCurrency(endpoint.cost_usd)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!endpoints || endpoints.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-white">
                                            No endpoint data available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Premium Caching Performance Card */}
            {
                caching && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                    >
                        <Card className="relative overflow-hidden bg-card border-border backdrop-blur-sm hover:bg-accent/50 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                            <CardHeader className="border-b border-purple-200/20 dark:border-purple-800/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-3 bg-primary rounded-xl">
                                            <Zap className="w-5 h-5 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-card-foreground">
                                                Caching Performance
                                            </CardTitle>
                                            <CardDescription className="text-sm text-muted-foreground">Cache hit rates and latency improvements</CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary text-primary-foreground border-0">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Optimized
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Exact Cache Hits */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                                        <div className="relative bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-medium text-white">Exact Cache Hits</p>
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white">
                                                {caching.exact_cache_hits || 0}
                                            </p>
                                            <Progress
                                                value={((caching.exact_cache_hits || 0) / ((caching.exact_cache_hits || 0) + (caching.semantic_cache_hits || 0) + (caching.non_cached_requests || 0))) * 100}
                                                className="h-1 mt-2 bg-muted"
                                            />
                                        </div>
                                    </div>

                                    {/* Semantic Cache Hits */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                                        <div className="relative bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-medium text-white">Semantic Cache Hits</p>
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white">
                                                {caching.semantic_cache_hits || 0}
                                            </p>
                                            <Progress
                                                value={((caching.semantic_cache_hits || 0) / ((caching.exact_cache_hits || 0) + (caching.semantic_cache_hits || 0) + (caching.non_cached_requests || 0))) * 100}
                                                className="h-1 mt-2 bg-muted"
                                            />
                                        </div>
                                    </div>

                                    {/* Avg Latency (Cached) */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                                        <div className="relative bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-medium text-white">Avg Latency (Cached)</p>
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white">
                                                {caching.avg_latency_cached?.toFixed(0) || 0}ms
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <TrendingDown className="w-3 h-3 text-primary" />
                                                <span className="text-xs text-white font-medium">Fast</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Avg Latency (Uncached) */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                                        <div className="relative bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-medium text-white">Avg Latency (Uncached)</p>
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white">
                                                {caching.avg_latency_uncached?.toFixed(0) || 0}ms
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <span className="text-xs text-white">Standard</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cache Savings Highlight */}
                                <div className="mt-6 p-4 bg-muted rounded-xl border border-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">Total Token Savings</p>
                                            <p className="text-2xl font-bold text-white mt-1">
                                                {formatNumber(caching.token_savings || 0)} tokens
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-white">Cache Hit Rate</p>
                                            <p className="text-2xl font-bold text-white mt-1">
                                                {formatPercentage(caching.cache_hit_rate || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            }
        </div >
    );
}
