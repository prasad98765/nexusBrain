import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

interface CreateVariableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editVariable?: Variable | null;
}

interface Variable {
    id?: string;
    name: string;
    description: string;
    format: 'text' | 'number' | 'date' | 'name' | 'email' | 'phone' | 'regex';
    error_message?: string;
    regex_pattern?: string;
}

const ERROR_MESSAGE_REQUIRED_FORMATS = ['email', 'phone', 'number', 'date', 'regex'];

export default function CreateVariableModal({ isOpen, onClose, onSuccess, editVariable }: CreateVariableModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Variable>({
        name: '',
        description: '',
        format: 'text',
        error_message: '',
        regex_pattern: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editVariable) {
            setFormData({
                name: editVariable.name,
                description: editVariable.description,
                format: editVariable.format,
                error_message: editVariable.error_message || '',
                regex_pattern: editVariable.regex_pattern || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                format: 'text',
                error_message: '',
                regex_pattern: ''
            });
        }
        setError('');
    }, [editVariable, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('Variable name is required');
            return;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        // Check if error message is required
        if (ERROR_MESSAGE_REQUIRED_FORMATS.includes(formData.format) && !formData.error_message?.trim()) {
            setError(`Error message is required for ${formData.format} format`);
            return;
        }

        // Check if regex pattern is required
        if (formData.format === 'regex' && !formData.regex_pattern?.trim()) {
            setError('Regex pattern is required for regex format');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                format: formData.format,
                workspace_id: user?.workspaceId,
                ...(ERROR_MESSAGE_REQUIRED_FORMATS.includes(formData.format) && {
                    error_message: formData.error_message?.trim()
                }),
                ...(formData.format === 'regex' && {
                    regex_pattern: formData.regex_pattern?.trim()
                })
            };

            if (editVariable?.id) {
                // Update existing variable
                const response = await apiClient.put(`/api/variables/${editVariable.id}`, payload);
                await response.json();
            } else {
                // Create new variable
                const response = await apiClient.post('/api/variables', payload);
                await response.json();
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save variable');
        } finally {
            setLoading(false);
        }
    };

    const handleFormatChange = (value: string) => {
        setFormData({
            ...formData,
            format: value as Variable['format'],
            // Clear error message and regex if not needed
            error_message: ERROR_MESSAGE_REQUIRED_FORMATS.includes(value) ? formData.error_message : '',
            regex_pattern: value === 'regex' ? formData.regex_pattern : ''
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-[#1a1f2e] rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-200">
                        {editVariable ? 'Edit Variable' : 'Create New Variable'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {/* Variable Name */}
                    <div>
                        <Label htmlFor="name" className="text-gray-200">
                            Variable Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., user_email"
                            className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-gray-200">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what this variable is used for"
                            className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200"
                            rows={3}
                        // required
                        />
                    </div>

                    {/* Format */}
                    <div>
                        <Label htmlFor="format" className="text-gray-200">
                            Format <span className="text-red-400">*</span>
                        </Label>
                        <Select value={formData.format} onValueChange={handleFormatChange}>
                            <SelectTrigger className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1f2e] border-gray-700 z-[200]">
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

                    {/* Error Message (conditional) */}
                    {ERROR_MESSAGE_REQUIRED_FORMATS.includes(formData.format) && (
                        <div>
                            <Label htmlFor="error_message" className="text-gray-200">
                                Error Message <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="error_message"
                                value={formData.error_message}
                                onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
                                placeholder="e.g., Please enter a valid email address"
                                className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200"
                                required
                            />
                        </div>
                    )}

                    {/* Regex Pattern (conditional) */}
                    {formData.format === 'regex' && (
                        <div>
                            <Label htmlFor="regex_pattern" className="text-gray-200">
                                Regex Pattern <span className="text-red-400">*</span>
                            </Label>
                            <Textarea
                                id="regex_pattern"
                                value={formData.regex_pattern}
                                onChange={(e) => setFormData({ ...formData, regex_pattern: e.target.value })}
                                placeholder="Enter the regex pattern (Python syntax)"
                                className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200 font-mono text-sm"
                                rows={2}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Test your pattern at{' '}
                                <a
                                    href="https://regex101.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    regex101.com
                                </a>
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-gray-700 hover:bg-gray-800 text-gray-300"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : editVariable ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
