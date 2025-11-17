import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    response_mappings: []
};

export default function ApiLibraryForm({ initialData, onChange }: ApiLibraryFormProps) {
    const [formData, setFormData] = useState<ApiFormData>(initialData || EMPTY_FORM);
    const [expandedSections, setExpandedSections] = useState({
        prompt: true,
        handler: true,
        response: false
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    useEffect(() => {
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
            className="w-full flex items-center justify-between py-3 px-4 bg-[#1a1f2e] hover:bg-[#1f2533] transition-colors rounded-lg"
        >
            <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
            {expandedSections[section] ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
        </button>
    );

    return (
        <div className="space-y-4">
            {/* API Name */}
            <div>
                <Label className="text-gray-200">API Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Get Weather Data"
                    className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200"
                />
            </div>

            {/* Prompt Instructions */}
            <div className="space-y-2">
                <SectionHeader title="Prompt Instructions" section="prompt" />
                {expandedSections.prompt && (
                    <div className="p-4 bg-[#0f1419] rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">
                            Write a clear instruction that tells the AI what this function should do.
                        </p>
                        <VariableTextarea
                            value={formData.prompt_instructions}
                            onChange={(value) => updateField('prompt_instructions', value)}
                            placeholder="Get the current weather in a given location"
                            className="bg-[#0a0e14] border-gray-700 text-gray-200 min-h-[100px]"
                            rows={4}
                        />
                    </div>
                )}
            </div>

            {/* Function Handler */}
            <div className="space-y-2">
                <SectionHeader title="Function Handler" section="handler" />
                {expandedSections.handler && (
                    <div className="p-4 bg-[#0f1419] rounded-lg space-y-4">
                        <p className="text-xs text-gray-400">
                            Use JavaScript or HTTP requests to define what the function should do when triggered.
                        </p>
                        {/* HTTP Request Tab */}
                        <div className="space-y-4">
                            {/* Method */}
                            <div className="grid grid-cols-4 gap-2">
                                {['GET', 'POST', 'PUT'].map((method) => (
                                    <button
                                        key={method}
                                        onClick={() => updateField('method', method)}
                                        className={cn(
                                            "px-3 py-2 text-sm font-medium rounded transition-colors",
                                            formData.method === method
                                                ? "bg-blue-600 text-white"
                                                : "bg-[#1a1f2e] text-gray-400 hover:bg-[#1f2533]"
                                        )}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>

                            {/* Endpoint */}
                            <div>
                                <Label className="text-gray-200 text-xs">Endpoint</Label>
                                <VariableInput
                                    value={formData.endpoint}
                                    onChange={(value) => updateField('endpoint', value)}
                                    placeholder="https://"
                                    className="mt-1"
                                />
                            </div>

                            {/* Headers */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-gray-200 text-xs">HEADER</Label>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={addHeader}
                                        className="h-7 text-xs text-gray-400 hover:text-gray-200"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add key
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {formData.headers.map((header, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="Enter key"
                                                value={header.key}
                                                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                                className="flex-1 bg-[#0a0e14] border-gray-700 text-gray-200 text-sm h-9"
                                            />
                                            <VariableInput
                                                placeholder="Enter value or #variable#"
                                                value={header.value}
                                                onChange={(value) => updateHeader(index, 'value', value)}
                                                className="flex-1 h-9 text-sm"
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeHeader(index)}
                                                className="h-9 w-9 p-0 text-gray-400 hover:text-red-400"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Body */}
                            <div>
                                <Label className="text-gray-200 text-xs">BODY</Label>
                                <RadioGroup
                                    value={formData.body_mode}
                                    onValueChange={(value) => updateField('body_mode', value as 'raw' | 'form')}
                                    className="flex gap-4 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="raw" id="raw" />
                                        <Label htmlFor="raw" className="text-gray-300 text-sm cursor-pointer">Raw</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="form" id="form" />
                                        <Label htmlFor="form" className="text-gray-300 text-sm cursor-pointer">Form</Label>
                                    </div>
                                </RadioGroup>

                                {formData.body_mode === 'raw' ? (
                                    <VariableTextarea
                                        value={formData.body_raw}
                                        onChange={(value) => updateField('body_raw', value)}
                                        placeholder="Enter raw body (supports # for variables)"
                                        className="mt-2 bg-[#0a0e14] border-gray-700 text-gray-200 font-mono text-sm"
                                        rows={6}
                                    />
                                ) : (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addFormField('text')}
                                                className="h-8 text-xs border-gray-700 text-gray-300"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Text
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addFormField('file')}
                                                className="h-8 text-xs border-gray-700 text-gray-300"
                                            >
                                                <Upload className="h-3 w-3 mr-1" />
                                                Add File
                                            </Button>
                                        </div>
                                        {formData.body_form.map((field, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Key"
                                                    value={field.key}
                                                    onChange={(e) => updateFormField(index, 'key', e.target.value)}
                                                    className="flex-1 bg-[#0a0e14] border-gray-700 text-gray-200 text-sm h-9"
                                                />
                                                <VariableInput
                                                    placeholder={field.type === 'file' ? 'File path' : 'Value'}
                                                    value={field.value}
                                                    onChange={(value) => updateFormField(index, 'value', value)}
                                                    className="flex-1 h-9 text-sm"
                                                />
                                                <span className="text-xs text-gray-500 min-w-[40px]">{field.type}</span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeFormField(index)}
                                                    className="h-9 w-9 p-0 text-gray-400 hover:text-red-400"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Retry Mechanism */}
                            <div className="pt-2 border-t border-gray-700/50">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="retry"
                                        checked={formData.retry_enabled}
                                        onCheckedChange={(checked) => updateField('retry_enabled', !!checked)}
                                    />
                                    <Label htmlFor="retry" className="text-gray-300 text-sm cursor-pointer">
                                        Enable Retry Mechanism
                                    </Label>
                                </div>
                                {formData.retry_enabled && (
                                    <div className="mt-2">
                                        <Label className="text-gray-200 text-xs">Max Retries</Label>
                                        <Select
                                            value={formData.max_retries.toString()}
                                            onValueChange={(value) => updateField('max_retries', parseInt(value))}
                                        >
                                            <SelectTrigger className="mt-1 bg-[#0a0e14] border-gray-700 text-gray-200 w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1a1f2e] border-gray-700">
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Response */}
            <div className="space-y-2">
                <SectionHeader title="RESPONSE" section="response" />
                {expandedSections.response && (
                    <div className="p-4 bg-[#0f1419] rounded-lg">
                        <p className="text-xs text-gray-400 mb-3">
                            Saves the response received from the API.
                        </p>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-gray-200 text-xs">Object Path → Variable</Label>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={addResponseMapping}
                                className="h-7 text-xs text-gray-400 hover:text-gray-200"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add key
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {formData.response_mappings.map((mapping, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        placeholder="result"
                                        value={mapping.object_path}
                                        onChange={(e) => updateResponseMapping(index, 'object_path', e.target.value)}
                                        className="flex-1 bg-[#0a0e14] border-gray-700 text-gray-200 text-sm h-9"
                                    />
                                    <div className="flex-1">
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
                                        className="h-9 w-9 p-0 text-gray-400 hover:text-red-400"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
