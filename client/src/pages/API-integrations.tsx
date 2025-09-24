import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
// import { LineChart } from '@/components/ui/line-chart';
import { Copy, ExternalLink } from "lucide-react"; // For copy icon

export default function APIIntegrationsPage() {
    const [hasApiKey, setHasApiKey] = useState(false);
    const [apiName, setApiName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('all');
    const [dateRange, setDateRange] = useState('last30');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        // Check if user has API key
        checkExistingApiKey();
    }, []);

    const checkExistingApiKey = async () => {
        // Add your API check logic here
        // setHasApiKey(true/false) based on the response
    };

    const generateApiKey = async () => {
        const generatedKey = 'generated-key-' + Math.random().toString(36).substring(7);
        setApiKey(generatedKey);
        setHasApiKey(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const ApiKeySetup = () => {
        const curlCommand = `curl --location --request POST 'https://api.yourdomain.com/v1/chat/completions' \\
    --header 'Authorization: Bearer ${apiKey}' \\
    --header 'Content-Type: application/json' \\
    --data-raw '{
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Hello!"}]
    }'`;

        return (
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Create API Key</h2>
                <div className="space-y-6">
                    {!apiKey ? (
                        <Button onClick={generateApiKey}>Generate API Key</Button>
                    ) : (
                        <div className="space-y-6">
                            <div className="border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-2">
                                    ⚠️ This API key will only be shown once. Please copy and store it somewhere safe.
                                </p>
                                <div className="bg-secondary p-4 rounded-md flex justify-between items-center">
                                    <code className="font-mono text-sm">{apiKey}</code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(apiKey)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">cURL Example</h3>
                                <div className="bg-secondary p-4 rounded-md relative">
                                    <pre className="font-mono text-sm overflow-x-auto">
                                        {curlCommand}
                                    </pre>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => copyToClipboard(curlCommand)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => setHasApiKey(true)}
                            >
                                Save and Continue
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const LogsTab = () => (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="last30">Last 30 Days</SelectItem>
                        <SelectItem value="last7">Last 7 Days</SelectItem>
                        <SelectItem value="last24">Last 24 Hours</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="high">High Usage</SelectItem>
                        <SelectItem value="low">Low Usage</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Card className="p-4">
                {/* Add your logs table/list component here */}
                <p>API Usage Logs will appear here</p>
            </Card>
        </div>
    );

    const AnalyticsTab = () => (
        <Card className="p-4">
            {/* <LineChart
                data={[]} // Add your analytics data here
                xAxis="date"
                yAxis="usage"
                title="API Usage Analytics"
            /> */}
        </Card>
    );
    const handleViewDocs = () => {
        window.open('/doc/api-reference', '_blank');
    };
    return (
        <div className="space-y-6">
            <div className="w-full bg-slate-800 p-4 rounded-lg flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">API Documentation</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleViewDocs}
                        className="flex items-center gap-2"
                    >
                        View Documentation
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ApiKeySetup />
            {/* {!hasApiKey ? (
                <ApiKeySetup />
            ) : (
                <Tabs defaultValue="logs">
                    <TabsList>
                        <TabsTrigger value="logs">Logs</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>
                    <TabsContent value="logs">
                        <LogsTab />
                    </TabsContent>
                    <TabsContent value="analytics">
                        <AnalyticsTab />
                    </TabsContent>
                </Tabs>
            )} */}
        </div>
    );
}