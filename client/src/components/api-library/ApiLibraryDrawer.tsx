import React, { useState, useEffect } from 'react';
import { X, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/apiClient';
import ApiLibraryForm from './ApiLibraryForm';
import JsonResponseViewer from './JsonResponseViewer';
import { cn } from '@/lib/utils';

interface ApiFormData {
    name: string;
    prompt_instructions: string;
    method: string;
    endpoint: string;
    headers: Array<{ key: string; value: string }>;
    body_mode: 'raw' | 'form';
    body_raw: string;
    body_form: Array<{ key: string; value: string; type: 'text' | 'file' }>;
    retry_enabled: boolean;
    max_retries: number;
    response_mappings: Array<{ object_path: string; variable_id: string }>;
}

interface TestResponse {
    success: boolean;
    status_code?: number;
    response?: any;
    error?: string;
    duration_ms?: number;
}

interface ApiLibraryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    apiId?: string | null;
    onSuccess: () => void;
}

export default function ApiLibraryDrawer({ isOpen, onClose, apiId, onSuccess }: ApiLibraryDrawerProps) {
    const [formData, setFormData] = useState<ApiFormData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResponse, setTestResponse] = useState<TestResponse | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [variables, setVariables] = useState<Array<{ id: string; name: string }>>([]);
    const [usedVariables, setUsedVariables] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchVariables();
            if (apiId) {
                loadApi();
            } else {
                setFormData({
                    name: '',
                    prompt_instructions: '',
                    method: 'GET',
                    endpoint: '',
                    headers: [],
                    body_mode: 'raw',
                    body_raw: '',
                    body_form: [],
                    retry_enabled: false,
                    max_retries: 1,
                    response_mappings: []
                });
            }
        }
    }, [isOpen, apiId]);

    const fetchVariables = async () => {
        try {
            const response = await apiClient.get('/api/variables?limit=100');
            const data = await response.json();
            setVariables(data.variables || []);
        } catch (err) {
            console.error('Failed to fetch variables:', err);
        }
    };

    const loadApi = async () => {
        if (!apiId) return;

        setLoading(true);
        try {
            const response = await apiClient.get(`/api/api-library/${apiId}`);
            const data = await response.json();
            setFormData(data);
        } catch (err) {
            console.error('Failed to load API:', err);
        } finally {
            setLoading(false);
        }
    };

    // Extract variable names from text using #{variable_name} pattern
    const extractVariablesFromText = (text: string): string[] => {
        if (!text) return [];
        const regex = /#\{([^}]+)\}/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    };

    // Scan form data to find all used variables
    const scanForUsedVariables = (data: ApiFormData | null): string[] => {
        if (!data) return [];
        
        const varSet = new Set<string>();
        
        // Check endpoint
        extractVariablesFromText(data.endpoint).forEach(v => varSet.add(v));
        
        // Check prompt instructions
        extractVariablesFromText(data.prompt_instructions).forEach(v => varSet.add(v));
        
        // Check headers
        data.headers?.forEach(header => {
            extractVariablesFromText(header.key).forEach(v => varSet.add(v));
            extractVariablesFromText(header.value).forEach(v => varSet.add(v));
        });
        
        // Check body raw
        if (data.body_mode === 'raw') {
            extractVariablesFromText(data.body_raw).forEach(v => varSet.add(v));
        }
        
        // Check body form
        if (data.body_mode === 'form') {
            data.body_form?.forEach(field => {
                extractVariablesFromText(field.key).forEach(v => varSet.add(v));
                extractVariablesFromText(field.value).forEach(v => varSet.add(v));
            });
        }
        
        return Array.from(varSet);
    };

    // Update used variables whenever form data changes
    useEffect(() => {
        const vars = scanForUsedVariables(formData);
        setUsedVariables(vars);
    }, [formData]);

    const handleSave = async () => {
        if (!formData) return;

        setSaving(true);
        try {
            if (apiId) {
                await apiClient.put(`/api/api-library/${apiId}`, formData);
            } else {
                await apiClient.post('/api/api-library', formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save API:', err);
            alert(err.message || 'Failed to save API configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!formData) return;

        if (!formData.name || !formData.endpoint) {
            alert('Please fill in API name and endpoint before testing');
            return;
        }

        setTesting(true);
        setTestResponse(null);

        try {
            // Test without saving - send config data directly to test endpoint
            const response = await apiClient.post('/api/api-library/test', {
                ...formData,
                variable_values: variableValues
            });
            const data = await response.json();
            setTestResponse(data);
        } catch (err: any) {
            setTestResponse({
                success: false,
                error: err.message || 'Test failed'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleAddMapping = (objectPath: string, variableId: string) => {
        if (!formData) return;

        const existing = formData.response_mappings.find(m => m.object_path === objectPath);
        if (existing) {
            // Update existing mapping
            setFormData({
                ...formData,
                response_mappings: formData.response_mappings.map(m =>
                    m.object_path === objectPath ? { ...m, variable_id: variableId } : m
                )
            });
        } else {
            // Add new mapping
            setFormData({
                ...formData,
                response_mappings: [...formData.response_mappings, { object_path: objectPath, variable_id: variableId }]
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="fixed top-0 right-0 h-full w-[calc(100vw-256px)] bg-[#0f1419] shadow-2xl z-50 flex"
                style={{ left: '256px' }}
            >
                {/* Left Panel - Form */}
                <div className="w-1/2 border-r border-gray-700/50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                        <h2 className="text-xl font-semibold text-gray-200">
                            {apiId ? 'Edit API Configuration' : 'Create API Configuration'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={saving || !formData?.name || !formData?.endpoint}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-700/50 rounded transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-gray-400">Loading...</div>
                            </div>
                        ) : formData ? (
                            <ApiLibraryForm
                                initialData={formData}
                                onChange={setFormData}
                            />
                        ) : null}
                    </div>
                </div>

                {/* Right Panel - Test */}
                <div className="w-1/2 flex flex-col bg-[#0a0e14]">
                    {/* Test Header */}
                    <div className="p-6 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Test API</h3>

                        <div className="space-y-3 text-sm text-gray-400">
                            <p>Follow these steps to test your API:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Add test values to variables</li>
                                <li>Click "Test the API"</li>
                                <li>Save the response field as a variable</li>
                            </ol>
                        </div>

                        {/* Variable Test Values */}
                        {usedVariables.length > 0 ? (
                            <div className="mt-4 space-y-2">
                                <Label className="text-gray-200 text-sm">Test Variable Values</Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    {usedVariables.length} variable{usedVariables.length > 1 ? 's' : ''} detected in configuration
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {usedVariables.map((varName) => (
                                        <div key={varName}>
                                            <Label className="text-xs text-gray-400">#{varName}</Label>
                                            <Input
                                                value={variableValues[varName] || ''}
                                                onChange={(e) => setVariableValues(prev => ({
                                                    ...prev,
                                                    [varName]: e.target.value
                                                }))}
                                                placeholder={`Enter value for ${varName}`}
                                                className="h-8 bg-[#0f1419] border-gray-700 text-gray-200 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 p-3 bg-[#1a1f2e] border border-gray-700/50 rounded-lg">
                                <p className="text-xs text-gray-500 text-center">
                                    No variables detected in configuration. Use #{'{'}variable_name{'}'} syntax to add variables.
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={handleTest}
                            disabled={testing || !formData?.name || !formData?.endpoint}
                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            {testing ? 'Testing...' : 'Test the API'}
                        </Button>
                    </div>

                    {/* Test Response */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {testResponse ? (
                            <div className="space-y-4">
                                {/* Status Badge */}
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-sm font-medium",
                                        testResponse.success
                                            ? "bg-green-900/30 text-green-400 border border-green-700/50"
                                            : "bg-red-900/30 text-red-400 border border-red-700/50"
                                    )}>
                                        Status: {testResponse.status_code || 'Error'}
                                    </div>
                                    {testResponse.duration_ms && (
                                        <div className="text-sm text-gray-400">
                                            {testResponse.duration_ms}ms
                                        </div>
                                    )}
                                </div>

                                {/* Error Message */}
                                {testResponse.error && (
                                    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                                        <p className="text-red-400 text-sm">{testResponse.error}</p>
                                    </div>
                                )}

                                {/* JSON Response */}
                                {testResponse.response && (
                                    <div>
                                        <Label className="text-gray-200 mb-2 block">Response</Label>
                                        <JsonResponseViewer
                                            response={testResponse.response}
                                            onAddMapping={handleAddMapping}
                                            existingMappings={formData?.response_mappings || []}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Click "Test the API" to see the response</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
