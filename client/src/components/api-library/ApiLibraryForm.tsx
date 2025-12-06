import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Upload, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import VariableInput from '@/components/variables/VariableInput';
import VariableTextarea from '@/components/variables/VariableTextarea';
import VariableSelector from '@/components/variables/VariableSelector';
import { cn } from '@/lib/utils';

interface Header {
    key: string;
    value: string;
}

interface FormField {
    key: string;
    value: string;
    type: 'text' | 'file';
}

interface ResponseMapping {
    object_path: string;
    variable_id: string;
}

interface ApiFormData {
    name: string;
    prompt_instructions: string;
    method: string;
    endpoint: string;
    headers: Header[];
    body_mode: 'raw' | 'form';
    body_raw: string;
    body_form: FormField[];
    retry_enabled: boolean;
    max_retries: number;
    response_mappings: ResponseMapping[];
    account_code?: string;
}

interface ApiLibraryFormProps {
    initialData?: ApiFormData;
    onChange: (data: ApiFormData) => void;
}

const EMPTY_FORM: ApiFormData = {
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
    response_mappings: [],
    account_code: ''
};

export default function ApiLibraryForm({ initialData, onChange }: ApiLibraryFormProps) {
    const [formData, setFormData] = useState<ApiFormData>(initialData || EMPTY_FORM);
    const [expandedSections, setExpandedSections] = useState({
        prompt: false,
        handler: false,
        response: false
    });
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);

            // Only reset accordion state on initial load, not on every data change
            if (!isInitialized) {
                setExpandedSections({
                    prompt: false,
                    handler: false,
                    response: false
                });
                setIsInitialized(true);
            }
        }
    }, [initialData, isInitialized]);

    useEffect(() => {
        // Only propagate changes, don't trigger re-initialization
        onChange(formData);
    }, [formData]);

    const updateField = <K extends keyof ApiFormData>(field: K, value: ApiFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Header management
    const addHeader = () => {
        updateField('headers', [...formData.headers, { key: '', value: '' }]);
    };

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...formData.headers];
        newHeaders[index][field] = value;
        updateField('headers', newHeaders);
    };

    const removeHeader = (index: number) => {
        updateField('headers', formData.headers.filter((_, i) => i !== index));
    };

    // Form field management
    const addFormField = (type: 'text' | 'file') => {
        updateField('body_form', [...formData.body_form, { key: '', value: '', type }]);
    };

    const updateFormField = (index: number, field: 'key' | 'value', value: string) => {
        const newFields = [...formData.body_form];
        newFields[index][field] = value;
        updateField('body_form', newFields);
    };

    const removeFormField = (index: number) => {
        updateField('body_form', formData.body_form.filter((_, i) => i !== index));
    };

    // Response mapping management
    const addResponseMapping = () => {
        updateField('response_mappings', [...formData.response_mappings, { object_path: '', variable_id: '' }]);
    };

    const updateResponseMapping = (index: number, field: 'object_path' | 'variable_id', value: string) => {
        const newMappings = [...formData.response_mappings];
        newMappings[index][field] = value;
        updateField('response_mappings', newMappings);
    };

    const removeResponseMapping = (index: number) => {
        updateField('response_mappings', formData.response_mappings.filter((_, i) => i !== index));
    };

    const SectionHeader = ({ title, section }: { title: string; section: keyof typeof expandedSections }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between py-3 px-4 bg-[#1a1f2e] hover:bg-[#1f2533] transition-colors rounded-lg mb-3"
        >
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">{title}</h3>
            {expandedSections[section] ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
        </button>
    );

    const LabelWithTooltip = ({ label, tooltip }: { label: string; tooltip: string }) => (
        <div className="flex items-center gap-2">
            <Label className="text-gray-200 text-sm font-medium">{label}</Label>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-xs max-w-[280px]">
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* API Name */}
            <div className="space-y-2">
                <LabelWithTooltip
                    label="API Name"
                    tooltip="A descriptive name for this API configuration. This will be used to identify the API in your workflow."
                />
                <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Get Weather Data, Send Email, Create User"
                    className="bg-[#rgb(30 41 59 / 0.5)] border-gray-700 text-gray-200 h-10"
                />
            </div>

            {/* Account Code */}
            <div className="space-y-2">
                <LabelWithTooltip
                    label="Account Code (Optional)"
                    tooltip="Default account identifier or API key used for authentication. Can be overridden with variables."
                />
                <VariableInput
                    value={formData.account_code || ''}
                    onChange={(value) => updateField('account_code', value)}
                    placeholder="Enter account code or use #{account_code}"
                    className="h-10"
                />
            </div>

            {/* Prompt Instructions */}
            <div className="space-y-2">
                <SectionHeader title="Prompt Instructions" section="prompt" />
                {expandedSections.prompt && (
                    <div className="p-5 bg-[#rgb(30 41 59 / 0.5)] rounded-lg border border-gray-700/30 space-y-3">
                        <LabelWithTooltip
                            label="Instruction"
                            tooltip="Write a clear, concise instruction that tells the AI when and how to use this API. Be specific about the purpose and expected outcome."
                        />
                        <VariableTextarea
                            value={formData.prompt_instructions}
                            onChange={(value) => updateField('prompt_instructions', value)}
                            placeholder="Example: Get the current weather forecast for a given location. Use this when the user asks about weather conditions."
                            className="bg-[#1e293a80] border-gray-700 text-gray-200 min-h-[120px]"
                            rows={5}
                        />
                        <p className="text-xs text-gray-500 italic">
                            💡 Tip: Type # to insert variables into your instructions
                        </p>
                    </div>
                )}
            </div>

            {/* Function Handler */}
            <div className="space-y-2">
                <SectionHeader title="HTTP Request Configuration" section="handler" />
                {expandedSections.handler && (
                    <div className="p-5 bg-[#rgb(30 41 59 / 0.5)] rounded-lg border border-gray-700/30 space-y-5">
                        {/* Method */}
                        <div className="space-y-2">
                            <LabelWithTooltip
                                label="HTTP Method"
                                tooltip="Select the HTTP method for this request. GET for retrieving data, POST for creating, PUT for updating."
                            />
                            <div className="grid grid-cols-4 gap-2">
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                                    <button
                                        key={method}
                                        onClick={() => updateField('method', method)}
                                        className={cn(
                                            "px-3 py-2.5 text-sm font-medium rounded transition-colors",
                                            formData.method === method
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "bg-[#1a1f2e] text-gray-400 hover:bg-[#1f2533] hover:text-gray-300"
                                        )}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Endpoint */}
                        <div className="space-y-2">
                            <LabelWithTooltip
                                label="API Endpoint"
                                tooltip="The full URL of the API endpoint. Include protocol (http:// or https://). You can use variables for dynamic URLs."
                            />
                            <VariableInput
                                value={formData.endpoint}
                                onChange={(value) => updateField('endpoint', value)}
                                placeholder="https://api.example.com/v1/resource"
                                className="h-10"
                            />
                        </div>

                        {/* Headers */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <LabelWithTooltip
                                    label="Request Headers"
                                    tooltip="HTTP headers sent with the request. Common headers include Authorization, Content-Type, and Accept."
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={addHeader}
                                    className="h-8 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Header
                                </Button>
                            </div>
                            <div className="space-y-2.5">
                                {formData.headers.map((header, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder="Header name (e.g., Authorization)"
                                            value={header.key}
                                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                            className="flex-1 bg-[#1e293a80] border-gray-700 text-gray-200 text-sm h-10"
                                        />
                                        <VariableInput
                                            placeholder="Header value (e.g., Bearer #{token})"
                                            value={header.value}
                                            onChange={(value) => updateHeader(index, 'value', value)}
                                            className="flex-1 h-10 text-sm"
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeHeader(index)}
                                            className="h-10 w-10 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="space-y-3">
                            <LabelWithTooltip
                                label="Request Body"
                                tooltip="Data sent with the request. Use Raw for JSON/text, or Form for key-value pairs and file uploads."
                            />
                            <RadioGroup
                                value={formData.body_mode}
                                onValueChange={(value) => updateField('body_mode', value as 'raw' | 'form')}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="raw" id="raw" />
                                    <Label htmlFor="raw" className="text-gray-300 text-sm cursor-pointer font-normal">Raw (JSON/Text)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="form" id="form" />
                                    <Label htmlFor="form" className="text-gray-300 text-sm cursor-pointer font-normal">Form Data</Label>
                                </div>
                            </RadioGroup>

                            {formData.body_mode === 'raw' ? (
                                <div className="space-y-2">
                                    <VariableTextarea
                                        value={formData.body_raw}
                                        onChange={(value) => updateField('body_raw', value)}
                                        placeholder='{\n  "key": "value",\n  "user_id": "#{user_id}"\n}'
                                        className="bg-[#1e293a80] border-gray-700 text-gray-200 font-mono text-sm"
                                        rows={8}
                                    />
                                    <p className="text-xs text-gray-500 italic">
                                        💡 Tip: Type # to insert variables. Ensure valid JSON syntax for JSON requests.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addFormField('text')}
                                            className="h-9 text-xs border-gray-700 text-gray-300 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Text Field
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addFormField('file')}
                                            className="h-9 text-xs border-gray-700 text-gray-300 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50"
                                        >
                                            <Upload className="h-3 w-3 mr-1" />
                                            Add File Field
                                        </Button>
                                    </div>
                                    {formData.body_form.map((field, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input
                                                placeholder="Field name"
                                                value={field.key}
                                                onChange={(e) => updateFormField(index, 'key', e.target.value)}
                                                className="flex-1 bg-[#1e293a80] border-gray-700 text-gray-200 text-sm h-10"
                                            />
                                            <VariableInput
                                                placeholder={field.type === 'file' ? 'File path or #{file_var}' : 'Field value or #{variable}'}
                                                value={field.value}
                                                onChange={(value) => updateFormField(index, 'value', value)}
                                                className="flex-1 h-10 text-sm"
                                            />
                                            <span className="text-xs text-gray-500 min-w-[45px] text-center px-2 py-1 bg-[#1a1f2e] rounded">
                                                {field.type}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeFormField(index)}
                                                className="h-10 w-10 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Retry Mechanism */}
                        <div className="pt-4 border-t border-gray-700/50 space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="retry"
                                    checked={formData.retry_enabled}
                                    onCheckedChange={(checked) => updateField('retry_enabled', !!checked)}
                                />
                                <Label htmlFor="retry" className="text-gray-300 text-sm cursor-pointer font-normal">
                                    Enable Retry Mechanism
                                </Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-xs max-w-[280px]">
                                            <p>Automatically retry failed requests. Useful for handling temporary network issues or rate limiting.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            {formData.retry_enabled && (
                                <div className="ml-6 space-y-2">
                                    <Label className="text-gray-200 text-xs font-medium">Maximum Retry Attempts</Label>
                                    <Select
                                        value={formData.max_retries.toString()}
                                        onValueChange={(value) => updateField('max_retries', parseInt(value))}
                                    >
                                        <SelectTrigger className="bg-[#1e293a80] border-gray-700 text-gray-200 w-40 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1f2e] border-gray-700">
                                            <SelectItem value="1">1 retry</SelectItem>
                                            <SelectItem value="2">2 retries</SelectItem>
                                            <SelectItem value="3">3 retries</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Response Mapping */}
            <div className="space-y-2">
                <SectionHeader title="Response Mapping" section="response" />
                {expandedSections.response && (
                    <div className="p-5 bg-[#rgb(30 41 59 / 0.5)] rounded-lg border border-gray-700/30 space-y-4">
                        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-300">
                                Map response data to variables. Use JSON path notation (e.g., result.data.id) to extract specific values from the API response.
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <LabelWithTooltip
                                label="Response Field Mappings"
                                tooltip="Define how API response data should be saved to your variables. The object path uses dot notation to access nested fields."
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={addResponseMapping}
                                className="h-8 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Mapping
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.response_mappings.length === 0 ? (
                                <div className="p-6 border-2 border-dashed border-gray-700 rounded-lg text-center">
                                    <p className="text-sm text-gray-500">
                                        No mappings configured. Click "Add Mapping" or use the Test panel to map response fields.
                                    </p>
                                </div>
                            ) : (
                                formData.response_mappings.map((mapping, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs text-gray-500">Object Path</Label>
                                            <Input
                                                placeholder="e.g., result.data.id or result.name"
                                                value={mapping.object_path}
                                                onChange={(e) => updateResponseMapping(index, 'object_path', e.target.value)}
                                                className="bg-[#1e293a80] border-gray-700 text-gray-200 text-sm h-10"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs text-gray-500">Save to Variable</Label>
                                            <VariableSelector
                                                value={mapping.variable_id}
                                                onChange={(value) => updateResponseMapping(index, 'variable_id', value || '')}
                                                label=""
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeResponseMapping(index)}
                                            className="h-10 w-10 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 mt-6"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
