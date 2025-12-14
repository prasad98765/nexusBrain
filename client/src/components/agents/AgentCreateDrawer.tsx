import React, { useState } from 'react';
import { X, Sparkles, Plus, Settings2, Plug, Network, Phone, Wrench, Edit, ChevronRight, FileText, Globe, CheckSquare, Square, Loader2, Upload, AlertCircle, Database, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import ApiLibraryDrawer from '@/components/api-library/ApiLibraryDrawer';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { EnhancePromptResponse } from '@shared/schema';

interface AgentTool {
    id: string;
    type: 'api' | 'integration' | 'mcp';
    apiId?: string;
    apiName?: string;
    llmDescription?: string;
}

interface Model {
    id: string;
    name: string;
}

interface KnowledgeBaseDocument {
    filename: string;
    chunks: number;
    timestamp?: string;
}

interface CapabilityConfig {
    enabled: boolean;
    llmDescription?: string;
}

interface ConnectFlowConfig {
    enabled: boolean;
    flowId?: string;
    flowName?: string;
    llmDescription?: string;
}

interface AgentCreateDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        promptInstructions: string;
        tools: AgentTool[];
        knowledgeBase: boolean;
        selectedKbDocs?: string[];
        buttons: CapabilityConfig;
        cards: CapabilityConfig;
        carousels: CapabilityConfig;
        callForward: boolean;
        webSearch: CapabilityConfig;
        connectFlow: ConnectFlowConfig;
    }) => void;
    existingData?: {
        name?: string;
        promptInstructions?: string;
        tools?: AgentTool[];
        knowledgeBase?: boolean;
        selectedKbDocs?: string[];
        buttons?: CapabilityConfig;
        cards?: CapabilityConfig;
        carousels?: CapabilityConfig;
        callForward?: boolean;
        webSearch?: CapabilityConfig;
        connectFlow?: ConnectFlowConfig;
    };
}

const PROMPT_TEMPLATES = [
    {
        id: 'customer-support',
        name: 'Customer support specialist',
        icon: '🎧',
        prompt: `<p><strong>As your dedicated appointment scheduling assistant for AcmeWellness, I am Lilly. My role is to efficiently schedule, confirm, reschedule, or cancel appointments while ensuring patients receive clear information and a smooth booking experience.</strong></p>

<p><strong>🔹 Voice & Persona</strong></p>
<ul>
  <li>Sound friendly, organized, and efficient</li>
  <li>Maintain a warm but professional tone</li>
  <li>Be patient and reassuring, especially with elderly or confused callers</li>
  <li>Project confidence and competence in managing appointments</li>
</ul>

<p><strong>🔹 Speech Style Guidelines</strong></p>
<ul>
  <li>Use clear and concise language with natural contractions</li>
  <li>Speak at a measured pace, especially when confirming dates and times</li>
  <li>Use conversational phrases like “Let me check that for you” or “Just a moment while I look at the schedule”</li>
  <li>Pronounce medical terms and provider names clearly</li>
</ul>

<p><strong>🔹 Conversation Introduction</strong></p>
<ul>
  <li>Begin with: “This is Lilly, your scheduling assistant from AcmeWellness. How may I help you today?”</li>
  <li>If an appointment need is stated immediately, respond politely and proceed to collect details</li>
</ul>

<p><strong>🔹 Appointment Type Identification</strong></p>
<ul>
  <li>Ask what type of appointment the patient needs</li>
  <li>Confirm provider preference or first available option</li>
  <li>Identify whether the patient is new or returning</li>
  <li>Assess urgency (routine vs urgent)</li>
</ul>

<p><strong>🔹 Scheduling Process</strong></p>
<ul>
  <li>Collect required patient details based on new or returning status</li>
  <li>Offer only 2–3 appointment time options at once</li>
  <li>Confirm the selected date, time, provider, and appointment type clearly</li>
  <li>Provide arrival time and preparation instructions</li>
</ul>

<p><strong>🔹 Confirmation & Wrap-Up</strong></p>
<ul>
  <li>Repeat appointment details for confirmation</li>
  <li>Explain appointment duration and expectations</li>
  <li>Offer reminder notifications via call or text</li>
  <li>Close the conversation politely and professionally</li>
</ul>

<p><strong>🔹 Policies & Expectations</strong></p>
<ul>
  <li>New patients must arrive 20 minutes early</li>
  <li>Returning patients should arrive 15 minutes early</li>
  <li>24-hour notice required for cancellations to avoid fees</li>
  <li>15-minute grace period before rescheduling may be required</li>
</ul>

<p><strong>🔹 Primary Objective</strong></p>
<ul>
  <li>Ensure accurate scheduling</li>
  <li>Match patients with appropriate care efficiently</li>
  <li>Provide a clear, calm, and positive experience</li>
</ul>
`
    },
    {
        id: 'appointment-booking',
        name: 'Appointment specialist',
        icon: '📅',
        prompt: `<p><strong>As your dedicated appointment scheduling assistant for AcmeWellness, I am Lilly. My role is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth and reassuring booking experience.</strong></p>

<p><strong>🔹 Identity & Purpose</strong></p>
<ul>
  <li>Act as the primary scheduling assistant for AcmeWellness</li>
  <li>Efficiently handle appointment scheduling, rescheduling, confirmations, and cancellations</li>
  <li>Ensure patients receive accurate information and a smooth booking experience</li>
</ul>

<p><strong>🔹 Voice & Persona</strong></p>
<ul>
  <li>Sound friendly, organized, and efficient</li>
  <li>Maintain a warm yet professional tone throughout the conversation</li>
  <li>Be patient and supportive, especially with elderly or confused callers</li>
  <li>Project confidence and competence when managing the scheduling system</li>
</ul>

<p><strong>🔹 Speech Characteristics</strong></p>
<ul>
  <li>Use clear, concise language with natural contractions</li>
  <li>Speak at a measured pace, especially when confirming dates and times</li>
  <li>Use conversational phrases such as “Let me check that for you” or “Just a moment while I look at the schedule”</li>
  <li>Pronounce medical terms and provider names clearly and correctly</li>
</ul>

<p><strong>🔹 Conversation Introduction</strong></p>
<ul>
  <li>Begin with: “This is Lilly, your scheduling assistant from AcmeWellness. How may I help you today?”</li>
  <li>If an appointment need is mentioned immediately, acknowledge and proceed to collect information</li>
</ul>

<p><strong>🔹 Appointment Type Determination</strong></p>
<ul>
  <li>Identify the type of appointment the patient wants to schedule</li>
  <li>Confirm provider preference or first available option</li>
  <li>Determine whether the patient is new or returning</li>
  <li>Assess urgency (routine vs urgent concern)</li>
</ul>

<p><strong>🔹 Scheduling Process</strong></p>
<ul>
  <li>Collect patient information based on new or returning status</li>
  <li>Offer no more than 2–3 available appointment time options at once</li>
  <li>Confirm appointment type, provider, date, and time explicitly</li>
  <li>Provide clear arrival time and preparation instructions</li>
</ul>

<p><strong>🔹 Confirmation & Wrap-Up</strong></p>
<ul>
  <li>Summarize all appointment details clearly for confirmation</li>
  <li>Explain appointment duration and expectations</li>
  <li>Offer reminder notifications via call or text message</li>
  <li>Close the conversation politely and professionally</li>
</ul>

<p><strong>🔹 Response Guidelines</strong></p>
<ul>
  <li>Keep responses concise and focused on scheduling tasks</li>
  <li>Explicitly confirm dates, times, and provider names</li>
  <li>Ask only one question at a time</li>
  <li>Use phonetic spelling for name verification when needed</li>
</ul>

<p><strong>🔹 New Patient Scheduling</strong></p>
<ul>
  <li>Explain first-visit procedures and arrival expectations</li>
  <li>Collect full name, date of birth, contact information, and reason for visit</li>
  <li>Inform patients to bring insurance card and photo ID</li>
  <li>Set clear expectations about appointment duration and process</li>
</ul>

<p><strong>🔹 Urgent Appointment Handling</strong></p>
<ul>
  <li>Briefly assess symptoms to determine urgency</li>
  <li>Redirect true emergencies to immediate medical care</li>
  <li>Check same-day availability for urgent care needs</li>
  <li>Offer next-best alternatives if same-day slots are unavailable</li>
</ul>

<p><strong>🔹 Rescheduling Requests</strong></p>
<ul>
  <li>Verify patient identity and locate existing appointment</li>
  <li>Confirm which appointment needs rescheduling</li>
  <li>Offer 2–3 alternative time slots</li>
  <li>Cancel the original appointment and confirm the new one clearly</li>
</ul>

<p><strong>🔹 Insurance & Payment Information</strong></p>
<ul>
  <li>Confirm acceptance of major insurance plans</li>
  <li>Direct patients to their insurance provider for coverage details</li>
  <li>Explain copay and billing expectations</li>
  <li>Provide self-pay rate information when applicable</li>
</ul>

<p><strong>🔹 Knowledge Base Awareness</strong></p>
<ul>
  <li>Understand appointment types and their durations</li>
  <li>Be aware of provider availability and clinic hours</li>
  <li>Know preparation requirements for different services</li>
</ul>

<p><strong>🔹 Policies & Expectations</strong></p>
<ul>
  <li>New patients must arrive 20 minutes early</li>
  <li>Returning patients must arrive 15 minutes early</li>
  <li>24-hour notice required to avoid cancellation fees</li>
  <li>15-minute grace period before rescheduling may be required</li>
</ul>

<p><strong>🔹 Call Management</strong></p>
<ul>
  <li>Politely notify callers when checking schedules</li>
  <li>Explain delays caused by technical issues</li>
  <li>Handle multiple scheduling requests one at a time</li>
</ul>

<p><strong>🔹 Primary Objective</strong></p>
<ul>
  <li>Match patients with appropriate care efficiently</li>
  <li>Ensure scheduling accuracy at all times</li>
  <li>Provide a calm, reassuring, and professional experience</li>
</ul>
`
    },
    //     {
    //         id: 'information-collector',
    //         name: 'Information collector specialist',
    //         icon: '💡',
    //         prompt: `You are a systematic information collector specialist. Your task is to:

    // - Gather required information from users step by step
    // - Ask clear, concise questions
    // - Validate and confirm collected data
    // - Organize information in a structured format
    // - Ensure data completeness before submission

    // Be thorough yet efficient in your information collection process.`
    //     },
    //     {
    //         id: 'lead-qualification',
    //         name: 'Lead qualification specialist',
    //         icon: '🔍',
    //         prompt: `You are a skilled lead qualification specialist. Your objectives are to:

    // - Identify potential customers and their needs
    // - Ask qualifying questions to assess fit
    // - Understand budget, timeline, and decision-making process
    // - Score leads based on qualification criteria
    // - Route qualified leads appropriately

    // Focus on building rapport while efficiently qualifying prospects.`
    //     }
];

export function AgentCreateDrawer({ isOpen, onClose, onSave, existingData }: AgentCreateDrawerProps) {
    const [name, setName] = useState(existingData?.name || '');
    const [promptInstructions, setPromptInstructions] = useState(existingData?.promptInstructions || '');
    const [tools, setTools] = useState<AgentTool[]>(existingData?.tools || []);
    const [knowledgeBase, setKnowledgeBase] = useState(existingData?.knowledgeBase || false);
    const [buttons, setButtons] = useState<CapabilityConfig>(existingData?.buttons || { enabled: false });
    const [cards, setCards] = useState<CapabilityConfig>(existingData?.cards || { enabled: false });
    const [carousels, setCarousels] = useState<CapabilityConfig>(existingData?.carousels || { enabled: false });
    const [callForward, setCallForward] = useState(existingData?.callForward || false);
    const [webSearch, setWebSearch] = useState<CapabilityConfig>(existingData?.webSearch || { enabled: false });
    const [connectFlow, setConnectFlow] = useState<ConnectFlowConfig>(existingData?.connectFlow || { enabled: false });

    const [toolPopoverOpen, setToolPopoverOpen] = useState(false);
    const [apiSelectModalOpen, setApiSelectModalOpen] = useState(false);
    const [selectedApiForConfig, setSelectedApiForConfig] = useState<string | null>(null);
    const [llmDescription, setLlmDescription] = useState('');
    const [apiLibraryDrawerOpen, setApiLibraryDrawerOpen] = useState(false);
    const [availableApis, setAvailableApis] = useState<any[]>([]);
    const [editingTool, setEditingTool] = useState<AgentTool | null>(null);
    const [modelModalOpen, setModelModalOpen] = useState(false);
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-4o-mini');
    const [temperature, setTemperature] = useState<number>(0.3);
    const [maxTokens, setMaxTokens] = useState<number>(5000);
    const [isEnhancing, setIsEnhancing] = useState(false);

    // Capability description modals
    const [capabilityModalOpen, setCapabilityModalOpen] = useState(false);
    const [currentCapability, setCurrentCapability] = useState<'buttons' | 'cards' | 'carousels' | 'webSearch' | null>(null);
    const [tempCapabilityDescription, setTempCapabilityDescription] = useState('');

    // Connect Flow modal
    const [connectFlowModalOpen, setConnectFlowModalOpen] = useState(false);
    const [availableFlows, setAvailableFlows] = useState<any[]>([]);
    const [tempFlowId, setTempFlowId] = useState<string>('');
    const [tempFlowDescription, setTempFlowDescription] = useState('');

    // Knowledge Base states
    const [kbDocuments, setKbDocuments] = useState<KnowledgeBaseDocument[]>([]);
    const [selectedKbDocs, setSelectedKbDocs] = useState<string[]>([]);
    const [loadingKbDocs, setLoadingKbDocs] = useState(false);
    const [kbViewTab, setKbViewTab] = useState<'file' | 'text' | 'url'>('file');
    const [kbUploadTab, setKbUploadTab] = useState<'file' | 'text' | 'url'>('file');
    const [kbUploading, setKbUploading] = useState(false);
    const [kbCrawling, setKbCrawling] = useState(false);
    const [kbRawText, setKbRawText] = useState('');
    const [kbTextTitle, setKbTextTitle] = useState('');
    const [kbCrawlUrl, setKbCrawlUrl] = useState('');
    const [kbCrawlMode, setKbCrawlMode] = useState<'single' | 'multi'>('multi');
    const [crawlLimitReached, setCrawlLimitReached] = useState(false);
    const kbFileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [kbModalOpen, setKbModalOpen] = useState(false);

    // Update state when existingData changes (for edit mode)
    React.useEffect(() => {
        if (existingData) {
            setName(existingData.name || '');
            setPromptInstructions(existingData.promptInstructions || '');
            setTools(existingData.tools || []);
            setKnowledgeBase(existingData.knowledgeBase || false);
            setSelectedKbDocs(existingData.selectedKbDocs || []);
            setButtons(existingData.buttons || { enabled: false });
            setCards(existingData.cards || { enabled: false });
            setCarousels(existingData.carousels || { enabled: false });
            setCallForward(existingData.callForward || false);
            setWebSearch(existingData.webSearch || { enabled: false });
            setConnectFlow(existingData.connectFlow || { enabled: false });
        } else {
            // Reset to defaults when creating new agent
            setName('');
            setPromptInstructions('');
            setTools([]);
            setKnowledgeBase(false);
            setSelectedKbDocs([]);
            setButtons({ enabled: false });
            setCards({ enabled: false });
            setCarousels({ enabled: false });
            setCallForward(false);
            setWebSearch({ enabled: false });
            setConnectFlow({ enabled: false });
        }
    }, [existingData]);

    // Fetch available APIs - also refetch when drawer opens or when coming back from API creation
    React.useEffect(() => {
        if (isOpen || apiSelectModalOpen) {
            fetchAvailableApis();
        }
    }, [isOpen, apiSelectModalOpen]);

    // Fetch available models when model modal opens
    React.useEffect(() => {
        if (modelModalOpen) {
            fetchAvailableModels();
        }
    }, [modelModalOpen]);

    // Fetch KB documents when knowledge base is enabled
    React.useEffect(() => {
        if (knowledgeBase && isOpen) {
            fetchKbDocuments();
        }
    }, [knowledgeBase, isOpen]);

    const fetchAvailableApis = async () => {
        try {
            const response = await apiClient.get('/api/api-library?limit=100');
            if (response.ok) {
                const data = await response.json();
                setAvailableApis(data.apis || []);
            }
        } catch (error) {
            console.error('Failed to fetch API libraries:', error);
            toast({
                title: 'Error',
                description: 'Failed to load API libraries',
                variant: 'destructive',
            });
        } finally {
            // setLoadingApis(false);
        }
    };

    const fetchAvailableModels = async () => {
        try {
            const response = await apiClient.get('/api/v1/models');
            if (response.ok) {
                const data = await response.json();
                const models = data.data?.map((model: any) => ({
                    id: model.id,
                    name: model.name || model.id
                })) || [];
                setAvailableModels(models);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            toast({
                title: 'Error',
                description: 'Failed to load models',
                variant: 'destructive',
            });
        }
    };

    // Knowledge Base functions
    const fetchKbDocuments = async () => {
        setLoadingKbDocs(true);
        try {
            const response = await apiClient.get('/api/rag/documents');
            if (response.ok) {
                const data = await response.json();
                setKbDocuments(data.documents || []);
            }
            // Also check crawl limit
            const crawlResponse = await apiClient.get('/api/rag/crawled-urls');
            if (crawlResponse.ok) {
                const crawlData = await crawlResponse.json();
                setCrawlLimitReached(crawlData.limit_reached || false);
            }
        } catch (error) {
            console.error('Failed to fetch KB documents:', error);
            toast({
                title: 'Error',
                description: 'Failed to load knowledge base documents',
                variant: 'destructive',
            });
        } finally {
            setLoadingKbDocs(false);
        }
    };

    const isFileUpload = (filename: string) => {
        const fileExtensions = ['.pdf', '.docx', '.txt', '.pptx', '.csv'];
        return fileExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    const filteredKbDocuments = kbDocuments.filter(doc => {
        if (kbViewTab === 'file') {
            return isFileUpload(doc.filename);
        } else if (kbViewTab === 'text') {
            return !isFileUpload(doc.filename) && !doc.filename.startsWith('url_crawl_');
        } else if (kbViewTab === 'url') {
            return doc.filename.startsWith('url_crawl_');
        }
        return false;
    });

    const handleKbDocToggle = (filename: string) => {
        setSelectedKbDocs(prev => {
            if (prev.includes(filename)) {
                return prev.filter(f => f !== filename);
            } else {
                return [...prev, filename];
            }
        });
    };

    const handleKbSelectAll = () => {
        if (selectedKbDocs.length === filteredKbDocuments.length && filteredKbDocuments.length > 0) {
            setSelectedKbDocs([]);
        } else {
            setSelectedKbDocs(filteredKbDocuments.map(doc => doc.filename));
        }
    };

    const handleKbFileUpload = async () => {
        if (selectedFiles.length === 0) return;

        setKbUploading(true);
        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await apiClient.post('/api/rag/upload', formData);

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: `${selectedFiles.length} file(s) uploaded successfully`,
                });
                setSelectedFiles([]);
                if (kbFileInputRef.current) {
                    kbFileInputRef.current.value = '';
                }
                fetchKbDocuments();
            } else {
                const data = await response.json();
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to upload files',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to upload files:', error);
            toast({
                title: 'Error',
                description: 'Failed to upload files',
                variant: 'destructive',
            });
        } finally {
            setKbUploading(false);
        }
    };

    const handleKbTextUpload = async () => {
        if (!kbRawText.trim()) return;

        setKbUploading(true);
        try {
            const response = await apiClient.post('/api/rag/index-text', {
                text: kbRawText,
                title: kbTextTitle || undefined
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Text indexed successfully',
                });
                setKbRawText('');
                setKbTextTitle('');
                fetchKbDocuments();
            } else {
                const data = await response.json();
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to index text',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to index text:', error);
            toast({
                title: 'Error',
                description: 'Failed to index text',
                variant: 'destructive',
            });
        } finally {
            setKbUploading(false);
        }
    };

    const handleKbUrlCrawl = async () => {
        if (!kbCrawlUrl.trim()) return;

        if (!kbCrawlUrl.startsWith('http://') && !kbCrawlUrl.startsWith('https://')) {
            toast({
                title: 'Invalid URL',
                description: 'URL must start with http:// or https://',
                variant: 'destructive',
            });
            return;
        }

        setKbCrawling(true);
        try {
            const response = await apiClient.post('/api/rag/crawl-url', {
                url: kbCrawlUrl,
                mode: kbCrawlMode
            });

            const data = await response.json();
            if (response.ok) {
                toast({
                    title: 'Success',
                    description: data.message || 'URL crawled successfully',
                });
                setKbCrawlUrl('');
                fetchKbDocuments();
            } else {
                if (response.status === 403) {
                    setCrawlLimitReached(true);
                }
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to crawl URL',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to crawl URL:', error);
            toast({
                title: 'Error',
                description: 'Failed to crawl URL',
                variant: 'destructive',
            });
        } finally {
            setKbCrawling(false);
        }
    };

    const handleEnhanceWithAI = async () => {
        if (!promptInstructions.trim()) {
            toast({
                title: "Error",
                description: "Please enter a prompt to enhance",
                variant: "destructive",
            });
            return;
        }

        setIsEnhancing(true);
        try {
            const response = await apiClient.post('/api/system_prompts/enhance', {
                prompt: promptInstructions
            });

            if (!response.ok) {
                throw new Error('Failed to enhance prompt');
            }

            const data: EnhancePromptResponse = await response.json();
            setPromptInstructions(data.enhanced_prompt);

            toast({
                title: "Success",
                description: "Prompt enhanced successfully!",
            });
        } catch (error) {
            console.error('Error enhancing prompt:', error);
            toast({
                title: "Error",
                description: "Failed to enhance prompt. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleTemplateSelect = (template: typeof PROMPT_TEMPLATES[0]) => {
        setPromptInstructions(template.prompt);
        if (!name) {
            setName(template.name);
        }
    };

    const handleAddApiTool = () => {
        setToolPopoverOpen(false);
        setApiSelectModalOpen(true);
    };

    const handleApiSelect = (apiId: string) => {
        const api = availableApis.find(a => a.id === apiId);
        setSelectedApiForConfig(apiId);
        setLlmDescription('');
    };

    const handleSaveApiTool = () => {
        if (!selectedApiForConfig) return;

        const api = availableApis.find(a => a.id === selectedApiForConfig);

        if (editingTool) {
            // Update existing tool
            setTools(tools.map(t =>
                t.id === editingTool.id
                    ? { ...t, apiId: selectedApiForConfig, apiName: api?.name || 'Unnamed API', llmDescription }
                    : t
            ));
            setEditingTool(null);
        } else {
            // Add new tool
            const newTool: AgentTool = {
                id: `tool-${Date.now()}`,
                type: 'api',
                apiId: selectedApiForConfig,
                apiName: api?.name || 'Unnamed API',
                llmDescription: llmDescription
            };
            setTools([...tools, newTool]);
        }

        setApiSelectModalOpen(false);
        setSelectedApiForConfig(null);
        setLlmDescription('');
    };

    const handleRemoveTool = (toolId: string) => {
        setTools(tools.filter(t => t.id !== toolId));
    };

    const handleEditTool = (tool: AgentTool) => {
        setEditingTool(tool);
        setSelectedApiForConfig(tool.apiId || null);
        setLlmDescription(tool.llmDescription || '');
        setApiSelectModalOpen(true);
    };

    // Capability handlers
    const handleCapabilityToggle = (capability: 'buttons' | 'cards' | 'carousels' | 'webSearch', checked: boolean) => {
        if (checked) {
            // Open modal to get LLM description
            setCurrentCapability(capability);
            setTempCapabilityDescription('');
            setCapabilityModalOpen(true);
        } else {
            // Disable capability
            switch (capability) {
                case 'buttons':
                    setButtons({ enabled: false });
                    break;
                case 'cards':
                    setCards({ enabled: false });
                    break;
                case 'carousels':
                    setCarousels({ enabled: false });
                    break;
                case 'webSearch':
                    setWebSearch({ enabled: false });
                    break;
            }
        }
    };

    const handleSaveCapability = () => {
        if (!currentCapability) return;

        const config: CapabilityConfig = {
            enabled: true,
            llmDescription: tempCapabilityDescription
        };

        switch (currentCapability) {
            case 'buttons':
                setButtons(config);
                break;
            case 'cards':
                setCards(config);
                break;
            case 'carousels':
                setCarousels(config);
                break;
            case 'webSearch':
                setWebSearch(config);
                break;
        }

        setCapabilityModalOpen(false);
        setCurrentCapability(null);
        setTempCapabilityDescription('');
    };

    // Connect Flow handlers
    const fetchAvailableFlows = async () => {
        try {
            const response = await apiClient.get('/api/flow-agents?page=1&limit=100');
            if (response.ok) {
                const data = await response.json();
                setAvailableFlows(data.agents || []);
            }
        } catch (error) {
            console.error('Failed to fetch flows:', error);
            toast({
                title: 'Error',
                description: 'Failed to load flows',
                variant: 'destructive',
            });
        }
    };

    const handleConnectFlowToggle = (checked: boolean) => {
        if (checked) {
            // Open modal to select flow and get description
            fetchAvailableFlows();
            setTempFlowId(connectFlow.flowId || '');
            setTempFlowDescription(connectFlow.llmDescription || '');
            setConnectFlowModalOpen(true);
        } else {
            // Disable connect flow
            setConnectFlow({ enabled: false });
        }
    };

    const handleEditConnectFlow = () => {
        // Open modal with existing data for editing
        fetchAvailableFlows();
        setTempFlowId(connectFlow.flowId || '');
        setTempFlowDescription(connectFlow.llmDescription || '');
        setConnectFlowModalOpen(true);
    };

    const handleSaveConnectFlow = () => {
        if (!tempFlowId) {
            toast({
                title: 'Error',
                description: 'Please select a flow',
                variant: 'destructive',
            });
            return;
        }

        const selectedFlow = availableFlows.find(f => f.id === tempFlowId);
        setConnectFlow({
            enabled: true,
            flowId: tempFlowId,
            flowName: selectedFlow?.name || '',
            llmDescription: tempFlowDescription
        });

        setConnectFlowModalOpen(false);
        setTempFlowId('');
        setTempFlowDescription('');
    };

    const handleSave = async () => {
        // First, create or update the system prompt
        try {
            // Create or update system prompt with agent name as title
            const systemPromptData = {
                title: name,
                prompt: promptInstructions,
                is_active: false // Don't auto-activate agent prompts
            };

            // Try to find existing system prompt with this agent name
            const existingPromptsResponse = await apiClient.get(`/api/system_prompts?search=${encodeURIComponent(name)}&limit=100`);

            if (existingPromptsResponse.ok) {
                const existingData = await existingPromptsResponse.json();
                const existingPrompt = existingData.prompts?.find((p: any) => p.title === name);

                if (existingPrompt) {
                    // Update existing system prompt
                    await apiClient.put(`/api/system_prompts/${existingPrompt.id}`, systemPromptData);
                } else {
                    // Create new system prompt
                    await apiClient.post('/api/system_prompts', systemPromptData);
                }
            }
        } catch (error) {
            console.error('Failed to create/update system prompt:', error);
            // Don't block agent save if system prompt fails
        }

        // Then save the agent
        onSave({
            name,
            promptInstructions,
            tools,
            knowledgeBase,
            selectedKbDocs,
            buttons,
            cards,
            carousels,
            callForward,
            webSearch,
            connectFlow
        });
    };

    const handleCreateNewApi = () => {
        setApiSelectModalOpen(false);
        setApiLibraryDrawerOpen(true);
    };

    const handleApiCreated = () => {
        setApiLibraryDrawerOpen(false);
        // Refetch the APIs list
        fetchAvailableApis();
        // Reopen the API selection modal after a short delay to allow the drawer to close
        setTimeout(() => {
            setApiSelectModalOpen(true);
        }, 300);
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} >
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[90vw] bg-slate-900 border-slate-700 overflow-y-auto p-0"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <SheetHeader className="px-6 py-4 border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-slate-100 text-xl flex items-center gap-2">
                                    {existingData ? 'Edit Agent' : 'Provide information'}
                                </SheetTitle>
                                <SheetDescription className="text-slate-400">
                                    Configure your AI agent with instructions and tools
                                </SheetDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    className="bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                                    onClick={() => setModelModalOpen(true)}
                                >
                                    Model
                                    <ChevronRight className="h-3 w-3" />
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                        {/* Left Side - Instructions */}
                        <div className="space-y-6">
                            <div>
                                <Label className="text-sm font-medium text-slate-200 mb-2 block">
                                    Agent Name
                                </Label>
                                <Input
                                    placeholder="Enter agent name..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-slate-200"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-medium text-slate-200">System Prompt</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs max-w-[250px]">
                                                    <p>Type <span className="font-mono bg-slate-700 px-1 rounded">#</span> to insert variables into your prompt</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEnhanceWithAI}
                                        disabled={isEnhancing || !promptInstructions?.trim()}
                                        className="flex items-center gap-2"
                                        style={{ color: "white" }}
                                    >
                                        {isEnhancing ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        Enhance with AI
                                    </Button>
                                </div>
                                <RichTextEditor
                                    value={promptInstructions}
                                    onChange={(value) => setPromptInstructions(value)}
                                    placeholder="Enter your system prompt here... (Type # to insert variables)"
                                    className="min-h-[400px]"
                                />
                            </div>

                            {/* Prompt Templates */}
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Quick Templates</Label>
                                <div className="flex flex-wrap gap-2">
                                    {PROMPT_TEMPLATES.map((template) => (
                                        <Button
                                            key={template.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTemplateSelect(template)}
                                            className="text-xs border-slate-600 hover:border-slate-500 hover:bg-slate-800 text-slate-300"
                                        >
                                            <span className="mr-1">{template.icon}</span>
                                            {template.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Added Tools List */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium text-slate-200">Added Tools</Label>
                                    <Popover open={toolPopoverOpen} onOpenChange={setToolPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-slate-800"
                                            >
                                                <Plus className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56 bg-slate-800 border-slate-700 p-2">
                                            <div className="space-y-1">
                                                <Button
                                                    variant="ghost"
                                                    disabled
                                                    className="w-full justify-start text-slate-500 hover:bg-slate-700/50"
                                                >
                                                    <Plug className="h-4 w-4 mr-2" />
                                                    Integration
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    disabled
                                                    className="w-full justify-start text-slate-500 hover:bg-slate-700/50"
                                                >
                                                    <Network className="h-4 w-4 mr-2" />
                                                    MCP
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleAddApiTool}
                                                    className="w-full justify-start text-slate-200 hover:bg-slate-700"
                                                >
                                                    <Settings2 className="h-4 w-4 mr-2" />
                                                    API call
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>


                                {/* Added Tools List */}
                                <div className="space-y-2">
                                    {tools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/15 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <Settings2 className="h-4 w-4 text-blue-400" />
                                                <div className="flex-1">
                                                    <div className="text-sm text-slate-200 font-medium">{tool.apiName}</div>
                                                    {tool.llmDescription && (
                                                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                                            {tool.llmDescription}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                                                    API
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditTool(tool)}
                                                    className="h-7 w-7 p-0 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveTool(tool.id)}
                                                    className="h-7 w-7 p-0 hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {tools.length === 0 && (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            No tools added yet. Use the 'Add Tool' button above.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Capabilities Toggles */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-slate-200">Capabilities</Label>

                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-200">Knowledge base</span>
                                    </div>
                                    <Switch
                                        checked={knowledgeBase}
                                        onCheckedChange={setKnowledgeBase}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                </div>

                                {/* Knowledge Base - Selected Documents Display */}
                                {knowledgeBase && (
                                    <div className="space-y-3 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                                Selected Documents
                                            </Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    fetchKbDocuments();
                                                    setKbModalOpen(true);
                                                }}
                                                className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                            >
                                                <Database className="h-3 w-3 mr-1" />
                                                Manage Documents
                                            </Button>
                                        </div>

                                        {selectedKbDocs.length === 0 ? (
                                            <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">
                                                No documents selected. Click "Manage Documents" to select.
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                                {selectedKbDocs.map((filename) => {
                                                    const doc = kbDocuments.find(d => d.filename === filename);
                                                    return (
                                                        <div
                                                            key={filename}
                                                            className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700/50 rounded-md"
                                                        >
                                                            {filename.startsWith('url_crawl_') ? (
                                                                <Globe className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                                                            ) : (
                                                                <FileText className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-slate-300 truncate">{filename}</p>
                                                                {doc && <p className="text-xs text-slate-500">{doc.chunks} chunks</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="text-sm text-slate-300">Buttons</span>
                                    <Switch
                                        checked={buttons.enabled}
                                        onCheckedChange={(checked) => handleCapabilityToggle('buttons', checked)}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="text-sm text-slate-300">Cards</span>
                                    <Switch
                                        checked={cards.enabled}
                                        onCheckedChange={(checked) => handleCapabilityToggle('cards', checked)}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="text-sm text-slate-300">Carousels</span>
                                    <Switch
                                        checked={carousels.enabled}
                                        onCheckedChange={(checked) => handleCapabilityToggle('carousels', checked)}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="text-sm text-slate-300">Web search</span>
                                    <Switch
                                        checked={webSearch.enabled}
                                        onCheckedChange={(checked) => handleCapabilityToggle('webSearch', checked)}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Exit conditions placeholder */}
                            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Connect Flow</span>
                                    <Switch
                                        checked={connectFlow.enabled}
                                        onCheckedChange={handleConnectFlowToggle}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                </div>
                                {connectFlow.enabled && connectFlow.flowName && (
                                    <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-md">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-blue-400 font-medium">{connectFlow.flowName}</p>
                                                {connectFlow.llmDescription && (
                                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{connectFlow.llmDescription}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleEditConnectFlow}
                                                className="h-6 w-6 p-0 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 flex-shrink-0"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50 backdrop-blur">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!name || !promptInstructions}
                        >
                            {existingData ? 'Update Agent' : 'Create Agent'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* API Selection Modal */}
            <Dialog open={apiSelectModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setEditingTool(null);
                    setSelectedApiForConfig(null);
                    setLlmDescription('');
                }
                setApiSelectModalOpen(open);
            }}>
                <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">
                            {editingTool ? 'Edit API Tool' : 'Select API Tool'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingTool ? 'Update the API configuration and description' : 'Choose an API from your library or create a new one'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm text-slate-300 mb-2 block">API tool</Label>
                            <Select value={selectedApiForConfig || ''} onValueChange={handleApiSelect}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Select an API" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {availableApis.map((api) => (
                                        <SelectItem key={api.id} value={api.id} className="text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <Wrench className="h-3 w-3" />
                                                {api.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                    <div className="border-t border-slate-700 mt-1 pt-1">
                                        <Button
                                            variant="ghost"
                                            onClick={handleCreateNewApi}
                                            className="w-full justify-start text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create new API
                                        </Button>
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedApiForConfig && (
                            <div>
                                <Label className="text-sm text-slate-300 mb-2 flex items-center justify-between">
                                    <span>LLM description</span>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-xs text-blue-400 hover:text-blue-300 h-auto p-0"
                                    >
                                        Edit source
                                    </Button>
                                </Label>
                                <Textarea
                                    placeholder="Describe this tool so the LLM knows how and when to use it..."
                                    value={llmDescription}
                                    onChange={(e) => setLlmDescription(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-slate-200 min-h-[120px]"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setApiSelectModalOpen(false);
                                    setSelectedApiForConfig(null);
                                    setLlmDescription('');
                                }}
                                className="border-slate-600 text-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveApiTool}
                                disabled={!selectedApiForConfig}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {editingTool ? 'Update Tool' : 'Add Tool'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* API Library Drawer for creating new API */}
            {apiLibraryDrawerOpen && (
                <ApiLibraryDrawer
                    isOpen={apiLibraryDrawerOpen}
                    onClose={() => setApiLibraryDrawerOpen(false)}
                    onSuccess={handleApiCreated}
                    fullWidth={true}
                />
            )}

            {/* Model Selection Modal */}
            <Dialog open={modelModalOpen} onOpenChange={setModelModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">Prompt settings</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Configure AI model and parameters for this agent
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div>
                            <Label className="text-sm text-slate-400 mb-2 block">Overrides</Label>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-slate-200 mb-3 block">AI model</Label>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                                    {availableModels.map((model) => (
                                        <SelectItem key={model.id} value={model.id} className="text-slate-200">
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium text-slate-200">Temperature</Label>
                                <span className="text-sm text-slate-400">{temperature}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">Deterministic</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                />
                                <span className="text-xs text-slate-500">Random</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setModelModalOpen(false)}
                                className="border-slate-600 text-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    setModelModalOpen(false);
                                    toast({
                                        title: 'Model settings updated',
                                        description: `Using ${selectedModel} with temperature ${temperature}`,
                                    });
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Knowledge Base Modal */}
            <Dialog open={kbModalOpen} onOpenChange={setKbModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100 text-xl">Knowledge Base Documents</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Select documents to include in your agent's knowledge base
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                        {/* View Tabs */}
                        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <button
                                onClick={() => setKbViewTab('file')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${kbViewTab === 'file'
                                    ? 'bg-slate-700 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                Files
                            </button>
                            <button
                                onClick={() => setKbViewTab('text')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${kbViewTab === 'text'
                                    ? 'bg-slate-700 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                Text
                            </button>
                            <button
                                onClick={() => setKbViewTab('url')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${kbViewTab === 'url'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                <Globe className="h-4 w-4 inline mr-2" />
                                URLs
                            </button>
                        </div>

                        {/* Select All */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                            <span className="text-sm text-slate-300">
                                {selectedKbDocs.length} / {filteredKbDocuments.length} selected
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleKbSelectAll}
                                className="h-8 px-3 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                            >
                                {selectedKbDocs.length === filteredKbDocuments.length && filteredKbDocuments.length > 0 ? (
                                    <><CheckSquare className="h-4 w-4 mr-2" /> Deselect All</>
                                ) : (
                                    <><Square className="h-4 w-4 mr-2" /> Select All</>
                                )}
                            </Button>
                        </div>

                        {/* Document List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {loadingKbDocs ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                                </div>
                            ) : filteredKbDocuments.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No {kbViewTab === 'file' ? 'files' : kbViewTab === 'text' ? 'plain text entries' : 'URL crawls'} found</p>
                                </div>
                            ) : (
                                filteredKbDocuments.map((doc) => {
                                    const isSelected = selectedKbDocs.includes(doc.filename);
                                    return (
                                        <div
                                            key={doc.filename}
                                            onClick={() => handleKbDocToggle(doc.filename)}
                                            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                                ? 'bg-purple-900/20 border-purple-500/50 shadow-md'
                                                : 'bg-slate-900/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                {isSelected ? (
                                                    <CheckSquare className="h-5 w-5 text-purple-400" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-slate-500" />
                                                )}
                                            </div>
                                            {doc.filename.startsWith('url_crawl_') ? (
                                                <Globe className="h-5 w-5 text-purple-400 flex-shrink-0" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-purple-400 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-200 truncate font-medium">{doc.filename}</p>
                                                <p className="text-xs text-slate-500">{doc.chunks} chunks</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-700/50"></div>

                        {/* Upload New Documents */}
                        {/* <div className="space-y-4">
                            <Label className="text-sm font-medium text-slate-300 uppercase tracking-wide flex items-center gap-2">
                                <Upload className="h-4 w-4 text-emerald-400" />
                                Add New Documents
                            </Label>

                            <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <button
                                    onClick={() => setKbUploadTab('file')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${kbUploadTab === 'file'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    Upload
                                </button>
                                <button
                                    onClick={() => setKbUploadTab('text')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${kbUploadTab === 'text'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    Text
                                </button>
                                <button
                                    onClick={() => setKbUploadTab('url')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${kbUploadTab === 'url'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <Globe className="h-4 w-4 inline mr-2" />
                                    URL
                                </button>
                            </div>

                            {kbUploadTab === 'file' && (
                                <div className="space-y-3">
                                    <input
                                        ref={kbFileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.txt,.pptx,.csv"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setSelectedFiles(files);
                                        }}
                                        className="hidden"
                                        multiple
                                    />
                                    <label
                                        onClick={() => kbFileInputRef.current?.click()}
                                        className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
                                    >
                                        <Upload className="h-5 w-5 text-slate-400" />
                                        <span className="text-sm text-slate-300">
                                            {selectedFiles.length > 0
                                                ? `${selectedFiles.length} file(s) selected`
                                                : 'Click to upload files'}
                                        </span>
                                    </label>
                                    {selectedFiles.length > 0 && (
                                        <Button
                                            onClick={handleKbFileUpload}
                                            disabled={kbUploading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {kbUploading ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                                            ) : (
                                                <><Upload className="h-4 w-4 mr-2" /> Upload Files</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {kbUploadTab === 'text' && (
                                <div className="space-y-3">
                                    <Input
                                        value={kbTextTitle}
                                        onChange={(e) => setKbTextTitle(e.target.value)}
                                        placeholder="Title (optional)"
                                        className="bg-slate-800 border-slate-600/50 text-slate-200"
                                    />
                                    <Textarea
                                        value={kbRawText}
                                        onChange={(e) => setKbRawText(e.target.value)}
                                        placeholder="Paste your text content here..."
                                        className="bg-slate-800 border-slate-600/50 text-slate-200 min-h-[120px]"
                                    />
                                    <Button
                                        onClick={handleKbTextUpload}
                                        disabled={kbUploading || !kbRawText.trim()}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {kbUploading ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Indexing...</>
                                        ) : (
                                            <><Upload className="h-4 w-4 mr-2" /> Index Text</>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {kbUploadTab === 'url' && (
                                <div className="space-y-3">
                                    {crawlLimitReached ? (
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-orange-300">URL Crawl Limit Reached</h4>
                                                    <p className="text-sm text-slate-400">
                                                        Contact{' '}
                                                        <a
                                                            href="mailto:support@nexusaihub.co.in"
                                                            className="text-orange-400 hover:text-orange-300 underline"
                                                        >
                                                            support@nexusaihub.co.in
                                                        </a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-3 mb-3">
                                                <button
                                                    onClick={() => setKbCrawlMode('single')}
                                                    disabled={kbCrawling}
                                                    className={`flex-1 px-4 py-2.5 text-sm rounded-lg border transition-all ${kbCrawlMode === 'single'
                                                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        } ${kbCrawling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    Single Page
                                                </button>
                                                <button
                                                    onClick={() => setKbCrawlMode('multi')}
                                                    disabled={kbCrawling}
                                                    className={`flex-1 px-4 py-2.5 text-sm rounded-lg border transition-all ${kbCrawlMode === 'multi'
                                                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        } ${kbCrawling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    All Pages
                                                </button>
                                            </div>
                                            <Input
                                                value={kbCrawlUrl}
                                                onChange={(e) => setKbCrawlUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                className="bg-slate-800 border-slate-600/50 text-slate-200"
                                                disabled={kbCrawling}
                                            />
                                            <Button
                                                onClick={handleKbUrlCrawl}
                                                disabled={kbCrawling || !kbCrawlUrl.trim()}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                {kbCrawling ? (
                                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Crawling...</>
                                                ) : (
                                                    <><Globe className="h-4 w-4 mr-2" /> Crawl Website</>
                                                )}
                                            </Button>
                                            <p className="text-sm text-slate-500 text-center">
                                                {kbCrawlMode === 'single'
                                                    ? 'Crawl a single page immediately'
                                                    : 'Crawl all pages from the website'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div> */}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-700/50">
                        <Button
                            variant="outline"
                            onClick={() => setKbModalOpen(false)}
                            className="border-slate-600 text-slate-300"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Capability Description Modal */}
            <Dialog open={capabilityModalOpen} onOpenChange={setCapabilityModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">
                            Configure {currentCapability && currentCapability.charAt(0).toUpperCase() + currentCapability.slice(1)}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Provide a description for the LLM to understand when and how to use this capability
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm text-slate-300 mb-2 block">LLM Description</Label>
                            <Textarea
                                placeholder="Describe when and how the LLM should use this capability..."
                                value={tempCapabilityDescription}
                                onChange={(e) => setTempCapabilityDescription(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-slate-200 min-h-[120px]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCapabilityModalOpen(false);
                                    setCurrentCapability(null);
                                    setTempCapabilityDescription('');
                                }}
                                className="border-slate-600 text-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveCapability}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Connect Flow Modal */}
            <Dialog open={connectFlowModalOpen} onOpenChange={setConnectFlowModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">Connect to Agentic Flow</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Select a flow and provide a description for when the LLM should route to it
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm text-slate-300 mb-2 block">Select Flow</Label>
                            <Select value={tempFlowId} onValueChange={setTempFlowId}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Choose an agentic flow" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {availableFlows.map((flow) => (
                                        <SelectItem key={flow.id} value={flow.id} className="text-slate-200">
                                            <div className="flex flex-col">
                                                <span>{flow.name}</span>
                                                {flow.description && (
                                                    <span className="text-xs text-slate-400">{flow.description}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm text-slate-300 mb-2 block">LLM Description</Label>
                            <Textarea
                                placeholder="Describe when the LLM should route to this flow..."
                                value={tempFlowDescription}
                                onChange={(e) => setTempFlowDescription(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-slate-200 min-h-[120px]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setConnectFlowModalOpen(false);
                                    setTempFlowId('');
                                    setTempFlowDescription('');
                                }}
                                className="border-slate-600 text-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveConnectFlow}
                                disabled={!tempFlowId}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}