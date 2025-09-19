import React, { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FancySelect from '@/components/ui/FancySelect';

interface LLMSettingsProps {
    workspaceId: string;
}

interface LLMConfig {
    provider: string;
    model: string;
    apiKey: string;
}
const providers = {
    'openai': {
        label: 'OpenAI',
        models: [
            { id: 'gpt-4', label: 'GPT-4' },
            { id: 'gpt-4-32k', label: 'GPT-4 32K' },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
            { id: 'text-davinci-003', label: 'Davinci 003' },
            { id: 'text-curie-001', label: 'Curie 001' },
            { id: 'text-babbage-001', label: 'Babbage 001' },
            { id: 'text-ada-001', label: 'Ada 001' }
        ]
    },
    'anthropic': {
        label: 'Anthropic',
        models: [
            { id: 'claude-3', label: 'Claude 3' },
            { id: 'claude-2', label: 'Claude 2' },
            { id: 'claude-1', label: 'Claude 1' },
            { id: 'claude-instant-1', label: 'Claude Instant 1' }
        ]
    },
    'cohere': {
        label: 'Cohere',
        models: [
            { id: 'command-xlarge', label: 'Command XLarge' },
            { id: 'command-large', label: 'Command Large' },
            { id: 'command-medium', label: 'Command Medium' },
            { id: 'command-r', label: 'Command R' },
            { id: 'command-r+', label: 'Command R+' }
        ]
    },
    'ai21': {
        label: 'AI21',
        models: [
            { id: 'j1-jumbo', label: 'J1 Jumbo' },
            { id: 'j1-large', label: 'J1 Large' },
            { id: 'j1-grande', label: 'J1 Grande' }
        ]
    },
    'huggingface': {
        label: 'HuggingFace',
        models: [
            { id: 'llama-2-70b', label: 'LLaMA 2 70B' },
            { id: 'llama-2-13b', label: 'LLaMA 2 13B' },
            { id: 'flan-t5-xxl', label: 'FLAN-T5 XXL' }
        ]
    }
};


export default function LLMSettings({ workspaceId }: LLMSettingsProps) {
    const [config, setConfig] = useState<LLMConfig>({
        provider: 'openai',
        model: 'gpt-4-1106-preview',
        apiKey: ''
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    useEffect(() => {
        fetchConfig();
    }, [workspaceId]);

    const fetchConfig = async () => {
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/llm-config`);
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching LLM config:', error);
            // toast('Failed to load LLM configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/llm-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                // toast.success('LLM configuration saved successfully');
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving LLM config:', error);
            // toast.error('Failed to save LLM configuration');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">LLM Configuration</h2>

            <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                    <label className="text-sm font-medium">LLM Provider</label>
                    <FancySelect
                        options={Object.entries(providers).map(([key, { label }]) => ({ value: key, label }))}
                        value={config.provider}
                        onChange={(value) => {
                            setConfig(prev => ({
                                ...prev,
                                provider: value,
                                model: providers[value as keyof typeof providers].models[0].id
                            }));
                        }}
                        placeholder="Select provider"
                        className="mb-2"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    {/* use Fany Selct */}
                    <FancySelect
                        options={providers[config.provider as keyof typeof providers].models.map(model => ({ value: model.id, label: model.label }))}
                        value={config.model}
                        onChange={(value) => setConfig({ ...config, model: value })}
                        placeholder="Select model"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">API Key</label>
                    <div className="relative">
                        <Input
                            type={showApiKey ? "text" : "password"}
                            value={config.apiKey}
                            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder={`Enter your ${providers[config.provider as keyof typeof providers].label} API key`}
                            className="pr-10 h-[42px] border-2 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showApiKey ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Your API key will be securely stored and encrypted
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    className="mt-6"
                    disabled={!config.apiKey.trim()}
                >
                    Save Configuration
                </Button>
            </div>
        </div>
    );
}
