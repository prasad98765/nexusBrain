import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, GripVertical, Upload, Link as LinkIcon, Settings2, Image as ImageIcon, Video, FileText, Info, ExternalLink, Database, Eye, CheckSquare, Square, Loader2, RefreshCw, Sparkles, Search, Globe, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import VariableSelector from '@/components/variables/VariableSelector';
import { Slider } from '@/components/ui/slider';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import ApiLibraryDrawer from '@/components/api-library/ApiLibraryDrawer';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NodeConfigPanelProps {
    nodeId: string | null;
    nodeType: 'button' | 'input' | 'ai' | 'apiLibrary' | 'knowledgeBase' | 'engine' | 'condition' | 'interactiveList' | 'simpleMessage' | null;
    nodeData: any;
    onClose: () => void;
    onSave: (data: any) => void;
    agentType?: 'agent' | 'assistant' | null;
}

// Validation constants for Interactive Node
const INTERACTIVE_NODE_LIMITS = {
    MESSAGE_MAX_LENGTH: 1024,
    FOOTER_MAX_LENGTH: 60,
    MEDIA_TEXT_MAX_LENGTH: 20,
    BUTTON_TITLE_MAX_LENGTH: 20,
    MIN_BUTTONS: 1,
    MAX_BUTTONS: 3,
};

// Validation constants for Interactive List Node
const INTERACTIVE_LIST_LIMITS = {
    MESSAGE_MAX_LENGTH: 1024,
    HEADER_TEXT_MAX_LENGTH: 60,
    BUTTON_LIST_TITLE_MAX_LENGTH: 20,
    SECTION_NAME_MAX_LENGTH: 24,
    FOOTER_MAX_LENGTH: 60,
    MAX_SECTIONS: 10,
    MAX_BUTTONS_PER_SECTION: 10,
    BUTTON_TITLE_MAX_LENGTH: 20,
};

// Validation constants for Input Node
const INPUT_NODE_LIMITS = {
    QUESTION_TEXT_MAX_LENGTH: 1024,
};

// Helper function to strip HTML tags for character counting
const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// Helper function to get character count color
const getCounterColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'text-red-400';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-slate-400';
};

export default function NodeConfigPanel({ nodeId, nodeType, nodeData, onClose, onSave, agentType }: NodeConfigPanelProps) {
    const [config, setConfig] = useState<any>({});
    const [draggedButton, setDraggedButton] = useState<number | null>(null);
    const [mediaUploadType, setMediaUploadType] = useState<'upload' | 'link'>('link');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Interactive List Node states
    const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});
    const [draggedSection, setDraggedSection] = useState<number | null>(null);
    const [draggedButtonInSection, setDraggedButtonInSection] = useState<{ sectionId: string; buttonIndex: number } | null>(null);

    // API Library states
    const [apiLibraries, setApiLibraries] = useState<any[]>([]);
    const [loadingApis, setLoadingApis] = useState(false);
    const [isApiDrawerOpen, setIsApiDrawerOpen] = useState(false);
    const [editingApiId, setEditingApiId] = useState<string | null>(null);

    // Knowledge Base states
    const [kbDocuments, setKbDocuments] = useState<any[]>([]);
    const [loadingKbDocs, setLoadingKbDocs] = useState(false);
    const [kbViewTab, setKbViewTab] = useState<'file' | 'text' | 'url'>('file');
    const [kbUploadTab, setKbUploadTab] = useState<'file' | 'text' | 'url'>('file');
    const [selectedKbDocs, setSelectedKbDocs] = useState<string[]>([]);
    const [kbRawText, setKbRawText] = useState('');
    const [kbTextTitle, setKbTextTitle] = useState('');
    const [kbUploading, setKbUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const kbFileInputRef = useRef<HTMLInputElement>(null);
    // URL crawl states
    const [kbCrawlUrl, setKbCrawlUrl] = useState('');
    const [kbCrawling, setKbCrawling] = useState(false);
    const [crawlLimitReached, setCrawlLimitReached] = useState(false);
    const [kbCrawlMode, setKbCrawlMode] = useState<'single' | 'multi'>('single');

    // AI Model states
    const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelSearchOpen, setModelSearchOpen] = useState(false);

    useEffect(() => {
        if (nodeData) {
            // Initialize config with nodeData
            const initialConfig = { ...nodeData };

            // Ensure sections are properly set for Interactive List
            if (nodeType === 'interactiveList') {
                // If sections don't exist or are empty, create default section with one button
                if (!nodeData.sections || nodeData.sections.length === 0) {
                    initialConfig.sections = []
                } else {
                    initialConfig.sections = nodeData.sections;
                }
            }

            setConfig(initialConfig);

            // Initialize selected documents from saved config
            if (nodeType === 'knowledgeBase' && nodeData.selectedDocuments) {
                const savedFilenames = nodeData.selectedDocuments.map((doc: any) => doc.filename);
                setSelectedKbDocs(savedFilenames);
            }
        }
        // Fetch API libraries when API Library node is opened
        if (nodeType === 'apiLibrary') {
            fetchApiLibraries();
        }
        // Fetch KB documents when Knowledge Base node is opened
        if (nodeType === 'knowledgeBase') {
            fetchKbDocuments();
        }
        // Fetch models when AI node is opened
        if (nodeType === 'ai') {
            fetchModels();
        }
    }, [nodeData, nodeType]);

    const fetchApiLibraries = async () => {
        setLoadingApis(true);
        try {
            const response = await apiClient.get('/api/api-library?limit=100');
            if (response.ok) {
                const data = await response.json();
                setApiLibraries(data.apis || []);
            }
        } catch (error) {
            console.error('Failed to fetch API libraries:', error);
            toast({
                title: 'Error',
                description: 'Failed to load API libraries',
                variant: 'destructive',
            });
        } finally {
            setLoadingApis(false);
        }
    };

    const handleApiSelection = (apiId: string) => {
        const selectedApi = apiLibraries.find(api => api.id === apiId);
        if (selectedApi) {
            setConfig({
                ...config,
                apiLibraryId: apiId,
                apiName: selectedApi.name,
                apiMethod: selectedApi.method,
            });
        }
    };

    const handleApiDrawerSuccess = () => {
        fetchApiLibraries();
        setIsApiDrawerOpen(false);
        setEditingApiId(null);
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

    // AI Model functions
    const fetchModels = async () => {
        setLoadingModels(true);
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
                description: 'Failed to load available models',
                variant: 'destructive',
            });
        } finally {
            setLoadingModels(false);
        }
    };

    const isFileUpload = (filename: string) => {
        const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'pptx', 'csv'];
        const extension = filename.split('.').pop()?.toLowerCase();
        return extension && ALLOWED_EXTENSIONS.includes(extension);
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
        if (selectedKbDocs.length === filteredKbDocuments.length) {
            // Deselect all from current filter
            const filenames = filteredKbDocuments.map(doc => doc.filename);
            setSelectedKbDocs(prev => prev.filter(f => !filenames.includes(f)));
        } else {
            // Select all from current filter
            const allFilenames = filteredKbDocuments.map(doc => doc.filename);
            setSelectedKbDocs(prev => {
                const combined = [...prev];
                allFilenames.forEach(f => {
                    if (!combined.includes(f)) {
                        combined.push(f);
                    }
                });
                return combined;
            });
        }
    };

    const handleKbFileUpload = async () => {
        if (selectedFiles.length === 0) return;

        setKbUploading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/rag/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (response.ok) {
                toast({
                    title: '✅ Upload Successful',
                    description: 'Files uploaded and indexed',
                });
                setSelectedFiles([]);
                if (kbFileInputRef.current) {
                    kbFileInputRef.current.value = '';
                }
                setTimeout(() => {
                    fetchKbDocuments();
                }, 500);
            } else {
                toast({
                    title: 'Upload Failed',
                    description: 'Failed to upload documents',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Network Error',
                description: 'Failed to connect to server',
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
            const response = await fetch('/api/rag/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: kbRawText,
                    title: kbTextTitle || 'Raw Text',
                }),
            });

            if (response.ok) {
                toast({
                    title: '✅ Text Indexed',
                    description: 'Content indexed successfully',
                });
                setKbRawText('');
                setKbTextTitle('');
                setTimeout(() => {
                    fetchKbDocuments();
                }, 500);
            } else {
                toast({
                    title: 'Upload Failed',
                    description: 'Failed to index text',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Network Error',
                description: 'Failed to connect to server',
                variant: 'destructive',
            });
        } finally {
            setKbUploading(false);
        }
    };

    const handleKbUrlCrawl = async () => {
        if (!kbCrawlUrl.trim()) return;

        // Validate URL format
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
            const response = await fetch('/api/rag/crawl-url', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: kbCrawlUrl,
                    mode: kbCrawlMode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (kbCrawlMode === 'single') {
                    toast({
                        title: '✅ URL Crawled',
                        description: `Content indexed into ${data.chunks} chunks`,
                    });
                    setKbCrawlUrl('');
                    setTimeout(() => {
                        fetchKbDocuments();
                    }, 500);
                } else {
                    toast({
                        title: '🔄 Crawl Started',
                        description: 'Crawling all pages from the website. Check back in a few minutes.',
                    });
                    setKbCrawlUrl('');
                    setTimeout(() => {
                        fetchKbDocuments();
                    }, 5000);
                }
            } else {
                if (response.status === 403) {
                    setCrawlLimitReached(true);
                }
                toast({
                    title: 'Crawl Failed',
                    description: data.message || data.error || 'Failed to crawl URL',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Network Error',
                description: 'Failed to connect to server',
                variant: 'destructive',
            });
        } finally {
            setKbCrawling(false);
        }
    };

    // Validation function for Interactive Node
    const validateInteractiveNode = (): string[] => {
        const errors: string[] = [];

        // Validate message content length
        const messageText = stripHtmlTags(config.message || '');
        if (messageText.length > INTERACTIVE_NODE_LIMITS.MESSAGE_MAX_LENGTH) {
            errors.push(`Message content exceeds ${INTERACTIVE_NODE_LIMITS.MESSAGE_MAX_LENGTH} characters (current: ${messageText.length})`);
        }

        // Validate footer length if present
        if (config.footer && config.footer.length > INTERACTIVE_NODE_LIMITS.FOOTER_MAX_LENGTH) {
            errors.push(`Footer exceeds ${INTERACTIVE_NODE_LIMITS.FOOTER_MAX_LENGTH} characters (current: ${config.footer.length})`);
        }

        // Validate media text content
        if (config.media) {
            const mediaType = config.media.type;
            const mediaText = config.media.text || '';

            // If media type is 'text', text content is required
            if (mediaType === 'text') {
                if (!mediaText || !mediaText.trim()) {
                    errors.push('Text content is required when media type is "Text Content"');
                } else if (mediaText.length > INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH) {
                    errors.push(`Media text content exceeds ${INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH} characters (current: ${mediaText.length})`);
                }
            }
            // For other media types, text is optional but still has character limit
            else if (mediaText && mediaText.length > INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH) {
                errors.push(`Media text content exceeds ${INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH} characters (current: ${mediaText.length})`);
            }
        }

        // Validate buttons
        const buttons = config.buttons || [];
        if (buttons.length < INTERACTIVE_NODE_LIMITS.MIN_BUTTONS) {
            errors.push(`At least ${INTERACTIVE_NODE_LIMITS.MIN_BUTTONS} button is required`);
        }
        if (buttons.length > INTERACTIVE_NODE_LIMITS.MAX_BUTTONS) {
            errors.push(`Maximum ${INTERACTIVE_NODE_LIMITS.MAX_BUTTONS} buttons allowed (current: ${buttons.length})`);
        }

        // Validate each button title
        buttons.forEach((btn: any, idx: number) => {
            if (!btn.label || btn.label.trim().length === 0) {
                errors.push(`Button ${idx + 1} must have a title`);
            } else if (btn.label.length > INTERACTIVE_NODE_LIMITS.BUTTON_TITLE_MAX_LENGTH) {
                errors.push(`Button ${idx + 1} title exceeds ${INTERACTIVE_NODE_LIMITS.BUTTON_TITLE_MAX_LENGTH} characters (current: ${btn.label.length})`);
            }
        });

        return errors;
    };

    // Validation function for Input Node
    const validateInputNode = (): string[] => {
        const errors: string[] = [];

        // Validate question text length
        const questionText = stripHtmlTags(config.placeholder || '');
        if (questionText.length > INPUT_NODE_LIMITS.QUESTION_TEXT_MAX_LENGTH) {
            errors.push(`Question text exceeds ${INPUT_NODE_LIMITS.QUESTION_TEXT_MAX_LENGTH} characters (current: ${questionText.length})`);
        }

        return errors;
    };

    // Validation function for Interactive List Node
    const validateInteractiveListNode = (): string[] => {
        const errors: string[] = [];

        // Validate message content length
        const messageText = stripHtmlTags(config.message || '');
        if (messageText.length > INTERACTIVE_LIST_LIMITS.MESSAGE_MAX_LENGTH) {
            errors.push(`Message content exceeds ${INTERACTIVE_LIST_LIMITS.MESSAGE_MAX_LENGTH} characters (current: ${messageText.length})`);
        }

        // Validate header text length if present
        if (config.headerText && config.headerText.length > INTERACTIVE_LIST_LIMITS.HEADER_TEXT_MAX_LENGTH) {
            errors.push(`Header text exceeds ${INTERACTIVE_LIST_LIMITS.HEADER_TEXT_MAX_LENGTH} characters (current: ${config.headerText.length})`);
        }

        // Validate button list title
        if (config.buttonListTitle && config.buttonListTitle.length > INTERACTIVE_LIST_LIMITS.BUTTON_LIST_TITLE_MAX_LENGTH) {
            errors.push(`Button list title exceeds ${INTERACTIVE_LIST_LIMITS.BUTTON_LIST_TITLE_MAX_LENGTH} characters (current: ${config.buttonListTitle.length})`);
        }

        // Validate footer length if present
        if (config.footer && config.footer.length > INTERACTIVE_LIST_LIMITS.FOOTER_MAX_LENGTH) {
            errors.push(`Footer exceeds ${INTERACTIVE_LIST_LIMITS.FOOTER_MAX_LENGTH} characters (current: ${config.footer.length})`);
        }

        // Validate sections
        const sections = config.sections || [];
        if (sections.length === 0) {
            errors.push('At least 1 section is required');
        }
        if (sections.length > INTERACTIVE_LIST_LIMITS.MAX_SECTIONS) {
            errors.push(`Maximum ${INTERACTIVE_LIST_LIMITS.MAX_SECTIONS} sections allowed (current: ${sections.length})`);
        }

        // Validate each section
        sections.forEach((section: any, sectionIdx: number) => {
            if (!section.sectionName || section.sectionName.trim().length === 0) {
                errors.push(`Section ${sectionIdx + 1} must have a name`);
            } else if (section.sectionName.length > INTERACTIVE_LIST_LIMITS.SECTION_NAME_MAX_LENGTH) {
                errors.push(`Section ${sectionIdx + 1} name exceeds ${INTERACTIVE_LIST_LIMITS.SECTION_NAME_MAX_LENGTH} characters (current: ${section.sectionName.length})`);
            }

            // Validate buttons in section
            const buttons = section.buttons || [];
            if (buttons.length > INTERACTIVE_LIST_LIMITS.MAX_BUTTONS_PER_SECTION) {
                errors.push(`Section ${sectionIdx + 1} exceeds ${INTERACTIVE_LIST_LIMITS.MAX_BUTTONS_PER_SECTION} buttons (current: ${buttons.length})`);
            }

            buttons.forEach((btn: any, btnIdx: number) => {
                if (!btn.label || btn.label.trim().length === 0) {
                    errors.push(`Section ${sectionIdx + 1}, Button ${btnIdx + 1} must have a title`);
                } else if (btn.label.length > INTERACTIVE_LIST_LIMITS.BUTTON_TITLE_MAX_LENGTH) {
                    errors.push(`Section ${sectionIdx + 1}, Button ${btnIdx + 1} title exceeds ${INTERACTIVE_LIST_LIMITS.BUTTON_TITLE_MAX_LENGTH} characters`);
                }
            });
        });

        return errors;
    };

    const handleSave = () => {
        // Validate Interactive Node before saving
        if (nodeType === 'button') {
            const errors = validateInteractiveNode();
            if (errors.length > 0) {
                setValidationErrors(errors);
                toast({
                    title: 'Validation Failed',
                    description: errors[0],
                    variant: 'destructive',
                });
                return;
            }
        }

        // Validate Input Node before saving
        if (nodeType === 'input') {
            const errors = validateInputNode();
            if (errors.length > 0) {
                setValidationErrors(errors);
                toast({
                    title: 'Validation Failed',
                    description: errors[0],
                    variant: 'destructive',
                });
                return;
            }
        }

        // Validate Interactive List Node before saving
        if (nodeType === 'interactiveList') {
            const errors = validateInteractiveListNode();
            if (errors.length > 0) {
                setValidationErrors(errors);
                toast({
                    title: 'Validation Failed',
                    description: errors[0],
                    variant: 'destructive',
                });
                return;
            }
        }

        // Clear validation errors
        setValidationErrors([]);

        if (nodeType === 'knowledgeBase') {
            // Save selected documents with their metadata
            const selectedDocsData = kbDocuments.filter(doc =>
                selectedKbDocs.includes(doc.filename)
            ).map(doc => ({
                filename: doc.filename,
                chunks: doc.chunks,
                timestamp: doc.timestamp
            }));

            onSave({
                ...config,
                selectedDocuments: selectedDocsData,
                documentCount: selectedDocsData.length
            });
        } else {
            onSave(config);
        }
        // Don't close panel - user can close manually or it will auto-save on close
    };

    // Handle file upload with 2MB size limit
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size must be less than 2MB');
            return;
        }

        let mediaType: 'image' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
            mediaType = 'image';
        } else if (file.type.startsWith('video/')) {
            mediaType = 'video';
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setConfig({
                ...config,
                media: {
                    type: mediaType,
                    url: base64,
                    name: file.name
                }
            });
        };
        reader.readAsDataURL(file);
    };

    // Handle drag and drop for buttons
    const handleDragStart = (index: number) => {
        setDraggedButton(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedButton === null || draggedButton === index) return;

        const buttons = [...config.buttons];
        const draggedItem = buttons[draggedButton];
        buttons.splice(draggedButton, 1);
        buttons.splice(index, 0, draggedItem);

        setConfig({ ...config, buttons });
        setDraggedButton(index);
    };

    const handleDragEnd = () => {
        setDraggedButton(null);
    };

    // Drag and drop handlers for Interactive List sections
    const handleSectionDragStart = (index: number) => {
        setDraggedSection(index);
    };

    const handleSectionDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedSection === null || draggedSection === index) return;

        const sections = [...config.sections];
        const draggedItem = sections[draggedSection];
        sections.splice(draggedSection, 1);
        sections.splice(index, 0, draggedItem);

        setConfig({ ...config, sections });
        setDraggedSection(index);
    };

    const handleSectionDragEnd = () => {
        setDraggedSection(null);
    };

    // Drag and drop handlers for buttons within sections
    const handleButtonInSectionDragStart = (sectionId: string, buttonIndex: number) => {
        setDraggedButtonInSection({ sectionId, buttonIndex });
    };

    const handleButtonInSectionDragOver = (e: React.DragEvent, sectionId: string, buttonIndex: number) => {
        e.preventDefault();
        if (!draggedButtonInSection || draggedButtonInSection.sectionId !== sectionId || draggedButtonInSection.buttonIndex === buttonIndex) return;

        const sections = config.sections.map((s: any) => {
            if (s.id === sectionId) {
                const buttons = [...s.buttons];
                const draggedItem = buttons[draggedButtonInSection.buttonIndex];
                buttons.splice(draggedButtonInSection.buttonIndex, 1);
                buttons.splice(buttonIndex, 0, draggedItem);
                return { ...s, buttons };
            }
            return s;
        });

        setConfig({ ...config, sections });
        setDraggedButtonInSection({ sectionId, buttonIndex });
    };

    const handleButtonInSectionDragEnd = () => {
        setDraggedButtonInSection(null);
    };

    // Toggle section collapse state
    const toggleSectionCollapse = (sectionId: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    if (!nodeId || !nodeType) return null;

    return (
        <TooltipProvider>
            <div className="fixed right-0 top-0 h-full w-[420px] bg-gradient-to-br from-slate-900 to-slate-800 border-l border-slate-700/50 shadow-2xl z-50 flex flex-col backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg ring-1 ring-blue-500/30">
                            <Settings2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-100">
                                {nodeType === 'button' ? 'Interactive Node' : nodeType === 'input' ? 'Input Node' : nodeType === 'ai' ? 'AI Node' : nodeType === 'apiLibrary' ? 'API Library Node' : nodeType === 'interactiveList' ? 'Interactive List Node' : nodeType === 'simpleMessage' ? 'Message Node' : 'Knowledge Base Node'}
                            </h3>
                            <p className="text-xs text-slate-500">Configure node settings</p>
                        </div>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => {
                                    handleSave();
                                    onClose();
                                }}
                                className="p-2 hover:bg-slate-700/70 rounded-lg transition-all hover:scale-105"
                            >
                                <X className="h-5 w-5 text-slate-400 hover:text-slate-200" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                            <p>Close panel (changes saved automatically)</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {/* Button Node Config */}
                    {nodeType === 'button' && (
                        <>
                            {/* Combined Media Content - Unified UI */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">Header Content</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Add images, videos, or documents to your message</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <Select
                                    value={config.media?.type || 'none'}
                                    onValueChange={(value) => {
                                        if (value === 'none') {
                                            const { media, ...rest } = config;
                                            setConfig(rest);
                                        } else if (value === 'text') {
                                            setConfig({ ...config, media: { type: value as 'text', text: '' } });
                                        } else {
                                            setConfig({ ...config, media: { type: value as 'image' | 'video' | 'document', url: '' } });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-600/50 text-slate-200 hover:border-slate-500 transition-colors">
                                        <SelectValue placeholder="Select media type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="none">No Media</SelectItem>
                                        <SelectItem value="image">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                                                Image
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="video">
                                            <div className="flex items-center gap-2">
                                                <Video className="h-3.5 w-3.5 text-purple-400" />
                                                Video
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="document">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5 text-orange-400" />
                                                Document
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="text">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5 text-green-400" />
                                                Text Content
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {config.media && config.media.type !== 'text' && (
                                    <div className="space-y-3 p-3 bg-slate-800 border border-slate-700 rounded">
                                        {/* Unified input/upload component */}
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaUploadType('link')}
                                                    className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${mediaUploadType === 'link'
                                                        ? 'bg-blue-600 border-blue-500 text-white'
                                                        : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                >
                                                    <LinkIcon className="h-3 w-3 inline mr-1" />
                                                    Link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaUploadType('upload')}
                                                    className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${mediaUploadType === 'upload'
                                                        ? 'bg-blue-600 border-blue-500 text-white'
                                                        : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                >
                                                    <Upload className="h-3 w-3 inline mr-1" />
                                                    Upload
                                                </button>
                                            </div>

                                            {mediaUploadType === 'link' ? (
                                                <>
                                                    <Input
                                                        value={config.media.url || ''}
                                                        onChange={(e) => setConfig({ ...config, media: { ...config.media, url: e.target.value } })}
                                                        placeholder="Enter media URL"
                                                        className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                                    />
                                                    {config.media.type === 'document' && (
                                                        <Input
                                                            value={config.media.name || ''}
                                                            onChange={(e) => setConfig({ ...config, media: { ...config.media, name: e.target.value } })}
                                                            placeholder="Document name (optional)"
                                                            className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept={config.media.type === 'image' ? 'image/*' : config.media.type === 'video' ? 'video/*' : '*/*'}
                                                        onChange={handleFileUpload}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full border-slate-600/50 hover:bg-slate-800/50 text-slate-300 hover:border-blue-500 transition-all"
                                                    >
                                                        <Upload className="h-3.5 w-3.5 mr-2" />
                                                        {config.media.url ? 'Change File' : 'Upload File'} (Max 2MB)
                                                    </Button>
                                                    {config.media.url && (
                                                        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 px-3 py-2 rounded-md border border-green-700/30">
                                                            <span className="text-lg">✓</span>
                                                            <span className="truncate">{config.media.name || 'File uploaded'}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Media Text Content */}
                            {config.media && (
                                <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="mediaText" className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                            {config.media.type === 'text' ? 'Text Content' : 'Media Text Content (Optional)'}
                                        </Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                <p>{config.media.type === 'text' ? 'Text content for the media section' : 'Optional text caption for your media'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        value={config.media.text || ''}
                                        onChange={(e) => setConfig({ ...config, media: { ...config.media, text: e.target.value } })}
                                        placeholder={config.media.type === 'text' ? 'Enter text content...' : 'Media caption...'}
                                        maxLength={INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH}
                                        className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                    />
                                    <span className={`text-xs ${getCounterColor((config.media.text || '').length, INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH)}`}>
                                        {(config.media.text || '').length}/{INTERACTIVE_NODE_LIMITS.MEDIA_TEXT_MAX_LENGTH}
                                    </span>
                                </div>
                            )}
                            {/* Bot asks this question with rich text editor */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="message" className="text-sm font-medium text-slate-200 uppercase tracking-wide">Message Content</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>The question or message shown to users. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.message || ''}
                                    onChange={(value) => setConfig({ ...config, message: value })}
                                    placeholder="What would you like to choose?"
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <p className="text-slate-500 italic flex items-center gap-1.5">
                                        <span className="text-blue-400">#</span> Type # to reference a variable
                                    </p>
                                    <span className={getCounterColor(stripHtmlTags(config.message || '').length, INTERACTIVE_NODE_LIMITS.MESSAGE_MAX_LENGTH)}>
                                        {stripHtmlTags(config.message || '').length}/{INTERACTIVE_NODE_LIMITS.MESSAGE_MAX_LENGTH}
                                    </span>
                                </div>
                            </div>

                            {/* Footer Text Field */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="footer" className="text-sm font-medium text-slate-200 uppercase tracking-wide">Footer Text (Optional)</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Optional footer text displayed at the bottom</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    value={config.footer || ''}
                                    onChange={(e) => setConfig({ ...config, footer: e.target.value })}
                                    placeholder="Footer text..."
                                    maxLength={INTERACTIVE_NODE_LIMITS.FOOTER_MAX_LENGTH}
                                    className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                />
                                <span className={`text-xs ${getCounterColor((config.footer || '').length, INTERACTIVE_NODE_LIMITS.FOOTER_MAX_LENGTH)}`}>
                                    {(config.footer || '').length}/{INTERACTIVE_NODE_LIMITS.FOOTER_MAX_LENGTH}
                                </span>
                            </div>

                            {/* Buttons Section */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Action Buttons ({config.buttons?.length || 0}/{INTERACTIVE_NODE_LIMITS.MAX_BUTTONS})
                                    </Label>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const currentButtons = config.buttons || [];
                                            if (currentButtons.length >= INTERACTIVE_NODE_LIMITS.MAX_BUTTONS) {
                                                toast({
                                                    title: 'Maximum Buttons Reached',
                                                    description: `You can only have ${INTERACTIVE_NODE_LIMITS.MAX_BUTTONS} buttons maximum`,
                                                    variant: 'destructive',
                                                });
                                                return;
                                            }
                                            const newButton = {
                                                id: Date.now().toString(),
                                                label: 'New Button',
                                                actionType: 'connect_to_node' as const,
                                                actionValue: ''
                                            };
                                            setConfig({
                                                ...config,
                                                buttons: [...currentButtons, newButton]
                                            });
                                        }}
                                        disabled={(config.buttons?.length || 0) >= INTERACTIVE_NODE_LIMITS.MAX_BUTTONS}
                                        className="bg-blue-600 hover:bg-blue-700 h-7 text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Add Button
                                    </Button>
                                </div>

                                {(!config.buttons || config.buttons.length === 0) && (
                                    <div className="text-center py-4 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                                        ⚠️ At least {INTERACTIVE_NODE_LIMITS.MIN_BUTTONS} button is required
                                    </div>
                                )}

                                {config.buttons && config.buttons.map((btn: any, idx: number) => (
                                    <div
                                        key={btn.id}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`p-3.5 bg-gradient-to-br from-slate-700/80 to-slate-800/80 border border-slate-600/40 rounded-lg space-y-2.5 cursor-move transition-all hover:border-slate-500/60 ${draggedButton === idx ? 'opacity-50 scale-95 shadow-inner' : 'shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-slate-500 cursor-grab active:cursor-grabbing" />
                                                <span className="text-xs text-slate-400 font-medium">Button {idx + 1}</span>
                                            </div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => {
                                                            const updatedButtons = config.buttons.filter((b: any) => b.id !== btn.id);
                                                            if (updatedButtons.length < INTERACTIVE_NODE_LIMITS.MIN_BUTTONS) {
                                                                toast({
                                                                    title: 'Cannot Delete',
                                                                    description: `At least ${INTERACTIVE_NODE_LIMITS.MIN_BUTTONS} button is required`,
                                                                    variant: 'destructive',
                                                                });
                                                                return;
                                                            }
                                                            setConfig({
                                                                ...config,
                                                                buttons: updatedButtons
                                                            });
                                                        }}
                                                        className="p-1.5 hover:bg-red-900/60 rounded-lg transition-all hover:scale-105"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                                                    <p>Delete button</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-400">Display Text</Label>
                                                <Input
                                                    value={btn.label}
                                                    onChange={(e) => {
                                                        const updated = config.buttons.map((b: any) =>
                                                            b.id === btn.id ? { ...b, label: e.target.value } : b
                                                        );
                                                        setConfig({ ...config, buttons: updated });
                                                    }}
                                                    placeholder="Button text shown to user"
                                                    maxLength={INTERACTIVE_NODE_LIMITS.BUTTON_TITLE_MAX_LENGTH}
                                                    className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                                />
                                                <span className={`text-xs ${getCounterColor((btn.label || '').length, INTERACTIVE_NODE_LIMITS.BUTTON_TITLE_MAX_LENGTH)}`}>
                                                    {(btn.label || '').length}/{INTERACTIVE_NODE_LIMITS.BUTTON_TITLE_MAX_LENGTH}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs text-slate-400">Value (Optional)</Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 text-slate-500 cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                            <p>Value stored in variable when clicked. If empty, uses display text.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Input
                                                    value={btn.value || ''}
                                                    onChange={(e) => {
                                                        const updated = config.buttons.map((b: any) =>
                                                            b.id === btn.id ? { ...b, value: e.target.value } : b
                                                        );
                                                        setConfig({ ...config, buttons: updated });
                                                    }}
                                                    placeholder="Value to store (defaults to display text)"
                                                    maxLength={INTERACTIVE_NODE_LIMITS.BUTTON_TITLE_MAX_LENGTH}
                                                    className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                                />
                                                <span className="text-xs text-slate-500 italic">
                                                    {btn.value ? `Will store: "${btn.value}"` : `Will store: "${btn.label || 'button text'}"`}
                                                </span>
                                            </div>
                                        </div>

                                        <Select
                                            value={btn.actionType}
                                            onValueChange={(value) => {
                                                const updated = config.buttons.map((b: any) =>
                                                    b.id === btn.id ? { ...b, actionType: value } : b
                                                );
                                                setConfig({ ...config, buttons: updated });
                                            }}
                                        >
                                            <SelectTrigger className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                <SelectItem value="connect_to_node">Connect to Node</SelectItem>
                                                <SelectItem value="call_number">Call Number</SelectItem>
                                                <SelectItem value="send_email">Send Email</SelectItem>
                                                <SelectItem value="open_url">Open URL</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {btn.actionType !== 'connect_to_node' && (
                                            <Input
                                                value={btn.actionValue || ''}
                                                onChange={(e) => {
                                                    const updated = config.buttons.map((b: any) =>
                                                        b.id === btn.id ? { ...b, actionValue: e.target.value } : b
                                                    );
                                                    setConfig({ ...config, buttons: updated });
                                                }}
                                                placeholder={
                                                    btn.actionType === 'call_number' ? 'Phone number' :
                                                        btn.actionType === 'send_email' ? 'Email address' :
                                                            'URL'
                                                }
                                                className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-blue-500 transition-colors"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Save Response to Variable - At Interactive Node Level */}
                            <VariableSelector
                                value={config.save_response_variable_id}
                                onChange={(variableId) => setConfig({ ...config, save_response_variable_id: variableId })}
                                label="Save Response To"
                            />
                        </>
                    )}

                    {/* Interactive List Node Config */}
                    {nodeType === 'interactiveList' && (
                        <>
                            {/* Header Text (Optional, Text Only, Max 60 chars) */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Header Text (Optional)
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Text-only header (no media). Maximum 60 characters. Can be left empty.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    value={config.headerText || ''}
                                    onChange={(e) => setConfig({ ...config, headerText: e.target.value })}
                                    placeholder="Header text (optional)..."
                                    maxLength={INTERACTIVE_LIST_LIMITS.HEADER_TEXT_MAX_LENGTH}
                                    className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-purple-500 transition-colors"
                                />
                                <span className={`text-xs ${getCounterColor((config.headerText || '').length, INTERACTIVE_LIST_LIMITS.HEADER_TEXT_MAX_LENGTH)}`}>
                                    {(config.headerText || '').length}/{INTERACTIVE_LIST_LIMITS.HEADER_TEXT_MAX_LENGTH}
                                </span>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="message" className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Message Content
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>The main message shown to users. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.message || ''}
                                    onChange={(value) => setConfig({ ...config, message: value })}
                                    placeholder="Enter your message..."
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <p className="text-slate-500 italic flex items-center gap-1.5">
                                        <span className="text-purple-400">#</span> Type # to reference a variable
                                    </p>
                                    <span className={getCounterColor(stripHtmlTags(config.message || '').length, INTERACTIVE_LIST_LIMITS.MESSAGE_MAX_LENGTH)}>
                                        {stripHtmlTags(config.message || '').length}/{INTERACTIVE_LIST_LIMITS.MESSAGE_MAX_LENGTH}
                                    </span>
                                </div>
                            </div>

                            {/* Button List Title */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Button List Title
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Title for the button sections list. Maximum 20 characters.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    value={config.buttonListTitle || 'Options'}
                                    onChange={(e) => setConfig({ ...config, buttonListTitle: e.target.value })}
                                    placeholder="Button list title..."
                                    maxLength={INTERACTIVE_LIST_LIMITS.BUTTON_LIST_TITLE_MAX_LENGTH}
                                    className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-purple-500 transition-colors"
                                />
                                <span className={`text-xs ${getCounterColor((config.buttonListTitle || '').length, INTERACTIVE_LIST_LIMITS.BUTTON_LIST_TITLE_MAX_LENGTH)}`}>
                                    {(config.buttonListTitle || '').length}/{INTERACTIVE_LIST_LIMITS.BUTTON_LIST_TITLE_MAX_LENGTH}
                                </span>
                            </div>

                            {/* Sections Management */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Sections ({config.sections?.length || 0}/{INTERACTIVE_LIST_LIMITS.MAX_SECTIONS})
                                    </Label>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const sections = config.sections || [];
                                            if (sections.length >= INTERACTIVE_LIST_LIMITS.MAX_SECTIONS) {
                                                toast({
                                                    title: 'Maximum Sections Reached',
                                                    description: `You can only have ${INTERACTIVE_LIST_LIMITS.MAX_SECTIONS} sections maximum`,
                                                    variant: 'destructive',
                                                });
                                                return;
                                            }
                                            const newSection = {
                                                id: `section-${Date.now()}`,
                                                sectionName: `Section ${sections.length + 1}`,
                                                buttons: []
                                            };
                                            setConfig({
                                                ...config,
                                                sections: [...sections, newSection]
                                            });
                                        }}
                                        disabled={(config.sections?.length || 0) >= INTERACTIVE_LIST_LIMITS.MAX_SECTIONS}
                                        className="bg-purple-600 hover:bg-purple-700 h-7 text-xs shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Add Section
                                    </Button>
                                </div>

                                {(!config.sections || config.sections.length === 0) && (
                                    <div className="text-center py-4 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                                        ⚠️ At least 1 section is required
                                    </div>
                                )}

                                {config.sections && config.sections.map((section: any, sectionIdx: number) => {
                                    const isCollapsed = collapsedSections[section.id] || false;

                                    return (
                                        <div
                                            key={section.id}
                                            draggable
                                            onDragStart={() => handleSectionDragStart(sectionIdx)}
                                            onDragOver={(e) => handleSectionDragOver(e, sectionIdx)}
                                            onDragEnd={handleSectionDragEnd}
                                            className={`p-3.5 bg-gradient-to-br from-slate-700/80 to-slate-800/80 border border-slate-600/40 rounded-lg space-y-3 transition-all ${draggedSection === sectionIdx ? 'opacity-50' : 'opacity-100'
                                                } cursor-move hover:border-purple-500/50`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-slate-500" />
                                                    <button
                                                        onClick={() => toggleSectionCollapse(section.id)}
                                                        className="p-1 hover:bg-slate-600/50 rounded transition-all"
                                                        type="button"
                                                    >
                                                        <ChevronDown className={`h-3.5 w-3.5 text-purple-400 transition-transform ${isCollapsed ? '-rotate-90' : ''
                                                            }`} />
                                                    </button>
                                                    <span className="text-xs text-slate-400 font-medium">Section {sectionIdx + 1}</span>
                                                </div>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => {
                                                                const updatedSections = config.sections.filter((s: any) => s.id !== section.id);
                                                                setConfig({
                                                                    ...config,
                                                                    sections: updatedSections
                                                                });
                                                            }}
                                                            className="p-1.5 hover:bg-red-900/60 rounded-lg transition-all hover:scale-105"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                                                        <p>Delete section</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>

                                            {!isCollapsed && (
                                                <>

                                                    {/* Section Name */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-slate-400">Section Name</Label>
                                                        <Input
                                                            value={section.sectionName}
                                                            onChange={(e) => {
                                                                const updated = config.sections.map((s: any) =>
                                                                    s.id === section.id ? { ...s, sectionName: e.target.value } : s
                                                                );
                                                                setConfig({ ...config, sections: updated });
                                                            }}
                                                            placeholder="Section name"
                                                            maxLength={INTERACTIVE_LIST_LIMITS.SECTION_NAME_MAX_LENGTH}
                                                            className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-purple-500 transition-colors"
                                                        />
                                                        <span className={`text-xs ${getCounterColor((section.sectionName || '').length, INTERACTIVE_LIST_LIMITS.SECTION_NAME_MAX_LENGTH)}`}>
                                                            {(section.sectionName || '').length}/{INTERACTIVE_LIST_LIMITS.SECTION_NAME_MAX_LENGTH}
                                                        </span>
                                                    </div>

                                                    {/* Buttons in Section */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs text-slate-400">Buttons ({section.buttons?.length || 0}/{INTERACTIVE_LIST_LIMITS.MAX_BUTTONS_PER_SECTION})</Label>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    const buttons = section.buttons || [];
                                                                    if (buttons.length >= INTERACTIVE_LIST_LIMITS.MAX_BUTTONS_PER_SECTION) {
                                                                        toast({
                                                                            title: 'Maximum Buttons Reached',
                                                                            description: `Maximum ${INTERACTIVE_LIST_LIMITS.MAX_BUTTONS_PER_SECTION} buttons per section`,
                                                                            variant: 'destructive',
                                                                        });
                                                                        return;
                                                                    }
                                                                    const newButton = {
                                                                        id: `btn-${Date.now()}`,
                                                                        label: 'New Button',
                                                                        actionType: 'connect_to_node' as const,
                                                                        actionValue: ''
                                                                    };
                                                                    const updated = config.sections.map((s: any) =>
                                                                        s.id === section.id ? { ...s, buttons: [...buttons, newButton] } : s
                                                                    );
                                                                    setConfig({ ...config, sections: updated });
                                                                }}
                                                                disabled={(section.buttons?.length || 0) >= INTERACTIVE_LIST_LIMITS.MAX_BUTTONS_PER_SECTION}
                                                                className="bg-purple-600 hover:bg-purple-700 h-6 text-xs px-2"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add Button
                                                            </Button>
                                                        </div>

                                                        {section.buttons && section.buttons.map((btn: any, btnIdx: number) => (
                                                            <div
                                                                key={btn.id}
                                                                draggable
                                                                onDragStart={() => handleButtonInSectionDragStart(section.id, btnIdx)}
                                                                onDragOver={(e) => handleButtonInSectionDragOver(e, section.id, btnIdx)}
                                                                onDragEnd={handleButtonInSectionDragEnd}
                                                                className={`p-2.5 bg-slate-800/60 border border-slate-600/40 rounded-md space-y-2 transition-all ${draggedButtonInSection?.sectionId === section.id && draggedButtonInSection?.buttonIndex === btnIdx ? 'opacity-50' : 'opacity-100'
                                                                    } cursor-move hover:border-purple-500/30`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <GripVertical className="h-3 w-3 text-slate-500" />
                                                                        <span className="text-xs text-slate-500">Button {btnIdx + 1}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const updatedButtons = section.buttons.filter((b: any) => b.id !== btn.id);
                                                                            const updated = config.sections.map((s: any) =>
                                                                                s.id === section.id ? { ...s, buttons: updatedButtons } : s
                                                                            );
                                                                            setConfig({ ...config, sections: updated });
                                                                        }}
                                                                        className="p-1 hover:bg-red-900/60 rounded transition-all"
                                                                    >
                                                                        <Trash2 className="h-3 w-3 text-red-400" />
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs text-slate-400">Display Text</Label>
                                                                        <Input
                                                                            value={btn.label}
                                                                            onChange={(e) => {
                                                                                const updatedButtons = section.buttons.map((b: any) =>
                                                                                    b.id === btn.id ? { ...b, label: e.target.value } : b
                                                                                );
                                                                                const updated = config.sections.map((s: any) =>
                                                                                    s.id === section.id ? { ...s, buttons: updatedButtons } : s
                                                                                );
                                                                                setConfig({ ...config, sections: updated });
                                                                            }}
                                                                            placeholder="Button text shown to user"
                                                                            maxLength={INTERACTIVE_LIST_LIMITS.BUTTON_TITLE_MAX_LENGTH}
                                                                            className="bg-slate-800 border-slate-600/50 text-slate-200 text-xs hover:border-slate-500 focus:border-purple-500 transition-colors"
                                                                        />
                                                                        <span className={`text-xs ${getCounterColor((btn.label || '').length, INTERACTIVE_LIST_LIMITS.BUTTON_TITLE_MAX_LENGTH)}`}>
                                                                            {(btn.label || '').length}/{INTERACTIVE_LIST_LIMITS.BUTTON_TITLE_MAX_LENGTH}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label className="text-xs text-slate-400">Value (Optional)</Label>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Info className="h-3 w-3 text-slate-500 cursor-help" />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                                                    <p>Value stored in variable when clicked. If empty, uses display text.</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </div>
                                                                        <Input
                                                                            value={btn.value || ''}
                                                                            onChange={(e) => {
                                                                                const updatedButtons = section.buttons.map((b: any) =>
                                                                                    b.id === btn.id ? { ...b, value: e.target.value } : b
                                                                                );
                                                                                const updated = config.sections.map((s: any) =>
                                                                                    s.id === section.id ? { ...s, buttons: updatedButtons } : s
                                                                                );
                                                                                setConfig({ ...config, sections: updated });
                                                                            }}
                                                                            placeholder="Value to store (defaults to display text)"
                                                                            maxLength={INTERACTIVE_LIST_LIMITS.BUTTON_TITLE_MAX_LENGTH}
                                                                            className="bg-slate-800 border-slate-600/50 text-slate-200 text-xs hover:border-slate-500 focus:border-purple-500 transition-colors"
                                                                        />
                                                                        <span className="text-xs text-slate-500 italic">
                                                                            {btn.value ? `Will store: "${btn.value}"` : `Will store: "${btn.label || 'button text'}"`}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <Select
                                                                    value={btn.actionType}
                                                                    onValueChange={(value) => {
                                                                        const updatedButtons = section.buttons.map((b: any) =>
                                                                            b.id === btn.id ? { ...b, actionType: value } : b
                                                                        );
                                                                        const updated = config.sections.map((s: any) =>
                                                                            s.id === section.id ? { ...s, buttons: updatedButtons } : s
                                                                        );
                                                                        setConfig({ ...config, sections: updated });
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="bg-slate-800 border-slate-600/50 text-slate-200 text-xs hover:border-slate-500 transition-colors">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-slate-800 border-slate-700">
                                                                        <SelectItem value="connect_to_node">Connect to Node</SelectItem>
                                                                        <SelectItem value="call_number">Call Number</SelectItem>
                                                                        <SelectItem value="send_email">Send Email</SelectItem>
                                                                        <SelectItem value="open_url">Open URL</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                {btn.actionType !== 'connect_to_node' && (
                                                                    <Input
                                                                        value={btn.actionValue || ''}
                                                                        onChange={(e) => {
                                                                            const updatedButtons = section.buttons.map((b: any) =>
                                                                                b.id === btn.id ? { ...b, actionValue: e.target.value } : b
                                                                            );
                                                                            const updated = config.sections.map((s: any) =>
                                                                                s.id === section.id ? { ...s, buttons: updatedButtons } : s
                                                                            );
                                                                            setConfig({ ...config, sections: updated });
                                                                        }}
                                                                        placeholder={
                                                                            btn.actionType === 'call_number' ? 'Phone number' :
                                                                                btn.actionType === 'send_email' ? 'Email address' :
                                                                                    'URL'
                                                                        }
                                                                        className="bg-slate-800 border-slate-600/50 text-slate-200 text-xs hover:border-slate-500 focus:border-purple-500 transition-colors"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer Text */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Footer Text (Optional)
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Optional footer text. Maximum 60 characters.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    value={config.footer || ''}
                                    onChange={(e) => setConfig({ ...config, footer: e.target.value })}
                                    placeholder="Footer text..."
                                    maxLength={INTERACTIVE_LIST_LIMITS.FOOTER_MAX_LENGTH}
                                    className="bg-slate-800 border-slate-600/50 text-slate-200 text-sm hover:border-slate-500 focus:border-purple-500 transition-colors"
                                />
                                <span className={`text-xs ${getCounterColor((config.footer || '').length, INTERACTIVE_LIST_LIMITS.FOOTER_MAX_LENGTH)}`}>
                                    {(config.footer || '').length}/{INTERACTIVE_LIST_LIMITS.FOOTER_MAX_LENGTH}
                                </span>
                            </div>

                            {/* Save Response to Variable */}
                            <VariableSelector
                                value={config.save_response_variable_id}
                                onChange={(variableId) => setConfig({ ...config, save_response_variable_id: variableId })}
                                label="Save Response To"
                            />
                        </>
                    )}

                    {/* Input Node Config */}
                    {nodeType === 'input' && (
                        <>
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="inputType" className="text-sm font-medium text-slate-200 uppercase tracking-wide">Input Type</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Select the type of data this input will collect</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Select
                                    value={config.inputType || 'text'}
                                    onValueChange={(value) => setConfig({ ...config, inputType: value })}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-600/50 text-slate-200 hover:border-slate-500 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="name">Name</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="textarea">Long Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bot asks this question with rich text editor */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="placeholder" className="text-sm font-medium text-slate-200 uppercase tracking-wide">Question Text</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>The question shown to users. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.placeholder || ''}
                                    onChange={(value) => setConfig({ ...config, placeholder: value })}
                                    placeholder="Enter your placeholder text..."
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <p className="text-slate-500 italic flex items-center gap-1.5">
                                        <span className="text-blue-400">#</span> Type # to reference a variable
                                    </p>
                                    <span className={getCounterColor(stripHtmlTags(config.placeholder || '').length, INPUT_NODE_LIMITS.QUESTION_TEXT_MAX_LENGTH)}>
                                        {stripHtmlTags(config.placeholder || '').length}/{INPUT_NODE_LIMITS.QUESTION_TEXT_MAX_LENGTH}
                                    </span>
                                </div>
                            </div>

                            {/* Save Response to Variable */}
                            <VariableSelector
                                value={config.save_response_variable_id}
                                onChange={(variableId) => setConfig({ ...config, save_response_variable_id: variableId })}
                                label="Save Response To"
                            />
                        </>
                    )}

                    {/* Simple Message Node Config */}
                    {nodeType === 'simpleMessage' && (
                        <>
                            {/* Message Content with Variable Referencing */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="message" className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Message Content
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>The message shown to users. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.message || ''}
                                    onChange={(value) => setConfig({ ...config, message: value })}
                                    placeholder="Enter your message content..."
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <p className="text-slate-500 italic flex items-center gap-1.5">
                                        <span className="text-amber-400">#</span> Type # to reference a variable
                                    </p>
                                    <span className={getCounterColor(stripHtmlTags(config.message || '').length, INPUT_NODE_LIMITS.QUESTION_TEXT_MAX_LENGTH)}>
                                        {stripHtmlTags(config.message || '').length}/{INPUT_NODE_LIMITS.QUESTION_TEXT_MAX_LENGTH}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* AI Node (no config for now) */}
                    {/* {nodeType === 'ai' && (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="p-4 bg-slate-800/30 rounded-full mb-4">
                                <Settings2 className="h-10 w-10 text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-sm">No configuration required for AI node</p>
                            <p className="text-slate-600 text-xs mt-2">This node processes automatically</p>
                        </div>
                    )} */}

                    {/* API Library Node Config */}
                    {nodeType === 'apiLibrary' && (
                        <>
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="apiSelect" className="text-sm font-medium text-slate-200 uppercase tracking-wide">Select API</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Choose an existing API or create a new one</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Select
                                    value={config.apiLibraryId || 'none'}
                                    onValueChange={(value) => {
                                        if (value === 'create-new') {
                                            setIsApiDrawerOpen(true);
                                            setEditingApiId(null);
                                        } else if (value === 'none') {
                                            setConfig({ ...config, apiLibraryId: null, apiName: '', apiMethod: '' });
                                        } else {
                                            handleApiSelection(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-600/50 text-slate-200 hover:border-slate-500 transition-colors">
                                        <SelectValue placeholder="Select an API" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="none" className="text-slate-400 italic">No API Selected</SelectItem>
                                        <SelectItem value="create-new" className="text-emerald-400 font-medium">
                                            <div className="flex items-center gap-2">
                                                <ExternalLink className="h-3 w-3" />
                                                Create New API
                                            </div>
                                        </SelectItem>
                                        {loadingApis ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : (
                                            apiLibraries.map((api) => (
                                                <SelectItem key={api.id} value={api.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                                            {api.method}
                                                        </span>
                                                        {api.name}
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Display Selected API Details */}
                            {config.apiLibraryId && (
                                <div className="space-y-3 p-4 bg-gradient-to-br from-emerald-900/10 to-emerald-800/5 rounded-lg border border-emerald-700/30 shadow-inner">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium text-emerald-300 uppercase tracking-wide">Selected API</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingApiId(config.apiLibraryId);
                                                setIsApiDrawerOpen(true);
                                            }}
                                            className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">API Name</label>
                                            <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300">
                                                {config.apiName || 'N/A'}
                                            </div>
                                        </div>
                                        {config.apiMethod && (
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Method</label>
                                                <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2">
                                                    <span className="text-emerald-400 font-mono font-semibold text-sm">
                                                        {config.apiMethod}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* API Library Drawer */}
                            <ApiLibraryDrawer
                                isOpen={isApiDrawerOpen}
                                onClose={() => {
                                    setIsApiDrawerOpen(false);
                                    setEditingApiId(null);
                                }}
                                apiId={editingApiId}
                                onSuccess={handleApiDrawerSuccess}
                                fullWidth={true}
                            />
                        </>
                    )}

                    {/* Knowledge Base Node Config */}
                    {nodeType === 'knowledgeBase' && (
                        <>
                            {/* Document Selection Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide flex items-center gap-2">
                                        <Database className="h-4 w-4 text-purple-400" />
                                        Knowledge Base Documents
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => fetchKbDocuments()}
                                        className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* View Tabs */}
                                <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700/50">
                                    <button
                                        onClick={() => setKbViewTab('file')}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${kbViewTab === 'file'
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                                        Files
                                    </button>
                                    <button
                                        onClick={() => setKbViewTab('text')}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${kbViewTab === 'text'
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                                        Plain Text
                                    </button>
                                    <button
                                        onClick={() => setKbViewTab('url')}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${kbViewTab === 'url'
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <Globe className="h-3.5 w-3.5 inline mr-1.5" />
                                        URLs
                                    </button>
                                </div>

                                {/* Select All */}
                                <div className="flex items-center justify-between p-2 bg-gradient-to-br from-purple-900/10 to-purple-800/5 rounded-lg border border-purple-700/30">
                                    <span className="text-xs text-purple-300">
                                        {selectedKbDocs.length} / {filteredKbDocuments.length} selected
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleKbSelectAll}
                                        className="h-7 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                    >
                                        {selectedKbDocs.length === filteredKbDocuments.length && filteredKbDocuments.length > 0 ? (
                                            <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Deselect All</>
                                        ) : (
                                            <><Square className="h-3.5 w-3.5 mr-1" /> Select All</>
                                        )}
                                    </Button>
                                </div>

                                {/* Document List */}
                                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                    {loadingKbDocs ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                                        </div>
                                    ) : filteredKbDocuments.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            No {kbViewTab === 'file' ? 'files' : kbViewTab === 'text' ? 'plain text entries' : 'URL crawls'} found
                                        </div>
                                    ) : (
                                        filteredKbDocuments.map((doc) => {
                                            const isSelected = selectedKbDocs.includes(doc.filename);
                                            return (
                                                <div
                                                    key={doc.filename}
                                                    onClick={() => handleKbDocToggle(doc.filename)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                        ? 'bg-purple-900/20 border-purple-500/50 shadow-lg'
                                                        : 'bg-slate-800 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30'
                                                        }`}
                                                >
                                                    <div className="flex-shrink-0">
                                                        {isSelected ? (
                                                            <CheckSquare className="h-4 w-4 text-purple-400" />
                                                        ) : (
                                                            <Square className="h-4 w-4 text-slate-500" />
                                                        )}
                                                    </div>
                                                    {doc.filename.startsWith('url_crawl_') ? (
                                                        <Globe className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                                    ) : (
                                                        <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
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
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-700/50"></div>

                            {/* Upload New Documents */}
                            <div className="space-y-4">
                                <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-emerald-400" />
                                    Add New Documents
                                </Label>

                                {/* Upload Tabs */}
                                <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700/50">
                                    <button
                                        onClick={() => setKbUploadTab('file')}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${kbUploadTab === 'file'
                                            ? 'bg-emerald-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setKbUploadTab('text')}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${kbUploadTab === 'text'
                                            ? 'bg-emerald-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        Paste Text
                                    </button>
                                    <button
                                        onClick={() => setKbUploadTab('url')}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${kbUploadTab === 'url'
                                            ? 'bg-emerald-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <Globe className="h-3.5 w-3.5 inline mr-1.5" />
                                        Crawl URL
                                    </button>
                                </div>

                                {/* File Upload */}
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
                                            id="kb-file-upload"
                                            multiple
                                        />
                                        <label
                                            htmlFor="kb-file-upload"
                                            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
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

                                {/* Text Upload */}
                                {kbUploadTab === 'text' && (
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs text-slate-400 mb-1.5 block">Title (optional)</Label>
                                            <Input
                                                value={kbTextTitle}
                                                onChange={(e) => setKbTextTitle(e.target.value)}
                                                placeholder="Document title"
                                                className="bg-slate-800 border-slate-600/50 text-slate-200"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-slate-400 mb-1.5 block">Content</Label>
                                            <Textarea
                                                value={kbRawText}
                                                onChange={(e) => setKbRawText(e.target.value)}
                                                placeholder="Paste your text content here..."
                                                className="bg-slate-800 border-slate-600/50 text-slate-200 min-h-[120px]"
                                            />
                                        </div>
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

                                {/* URL Crawl */}
                                {kbUploadTab === 'url' && (
                                    <div className="space-y-3">
                                        {crawlLimitReached ? (
                                            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-medium text-orange-300">URL Crawl Limit Reached</h4>
                                                        <p className="text-xs text-slate-400">
                                                            You have already crawled one URL. To crawl additional URLs, please contact us at{' '}
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
                                                <div>
                                                    <Label className="text-xs text-slate-400 mb-1.5 block">Crawl Mode</Label>
                                                    <div className="flex gap-2 mb-3">
                                                        <button
                                                            onClick={() => setKbCrawlMode('single')}
                                                            disabled={kbCrawling}
                                                            className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${kbCrawlMode === 'single'
                                                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                                } ${kbCrawling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            Single Page
                                                        </button>
                                                        <button
                                                            onClick={() => setKbCrawlMode('multi')}
                                                            disabled={kbCrawling}
                                                            className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${kbCrawlMode === 'multi'
                                                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                                                } ${kbCrawling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            All Pages
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-400 mb-1.5 block">Website URL</Label>
                                                    <Input
                                                        value={kbCrawlUrl}
                                                        onChange={(e) => setKbCrawlUrl(e.target.value)}
                                                        placeholder="https://example.com"
                                                        className="bg-slate-800 border-slate-600/50 text-slate-200"
                                                        disabled={kbCrawling}
                                                    />
                                                </div>
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
                                                <p className="text-xs text-slate-500 text-center">
                                                    {kbCrawlMode === 'single'
                                                        ? 'Crawl a single page immediately'
                                                        : 'Crawl all pages from the website (async)'
                                                    }
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* AI Node Config */}
                    {nodeType === 'ai' && (
                        <>
                            {/* Model Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-400" />
                                        Model Selection
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Choose the AI model for processing</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between bg-slate-800 border-slate-600/50 text-slate-200 hover:bg-slate-700 hover:border-slate-500"
                                        >
                                            {config.model ? (
                                                <span className="truncate">{availableModels.find(m => m.id === config.model)?.name || config.model}</span>
                                            ) : (
                                                <span className="text-slate-500">Select model...</span>
                                            )}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[380px] p-0 bg-slate-800 border-slate-700/50" align="start">
                                        <Command className="bg-slate-800">
                                            <CommandInput
                                                placeholder="Search models..."
                                                className="h-9 bg-slate-800 border-b border-slate-700/30 text-slate-200"
                                            />
                                            <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                                                <CommandEmpty className="text-slate-400 text-sm py-6 text-center">
                                                    {loadingModels ? 'Loading models...' : 'No models found.'}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {availableModels.map((model) => (
                                                        <CommandItem
                                                            key={model.id}
                                                            value={model.name}
                                                            onSelect={() => {
                                                                setConfig({ ...config, model: model.id });
                                                                setModelSearchOpen(false);
                                                            }}
                                                            className="cursor-pointer px-3 py-2 text-slate-200 hover:bg-slate-700"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium">{model.name}</div>
                                                                <div className="text-xs text-slate-500">{model.id}</div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Max Tokens */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Max Tokens: {config.maxTokens || 300}
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Maximum number of tokens to generate in the response</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Slider
                                    value={[config.maxTokens || 300]}
                                    onValueChange={(v) => setConfig({ ...config, maxTokens: v[0] })}
                                    min={50}
                                    max={4000}
                                    step={50}
                                    className="py-2"
                                />
                                <p className="text-xs text-slate-500">Range: 50 - 4000 tokens</p>
                            </div>

                            {/* Temperature */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">
                                        Temperature: {config.temperature !== undefined ? config.temperature : 0.7}
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Controls randomness: 0 = deterministic, 1 = very random</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Slider
                                    value={[config.temperature !== undefined ? config.temperature : 0.7]}
                                    onValueChange={(v) => setConfig({ ...config, temperature: v[0] })}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    className="py-2"
                                />
                                <p className="text-xs text-slate-500">Range: 0.0 (focused) - 1.0 (creative)</p>
                            </div>

                            {/* System Prompt */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">System Prompt</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Instructions that guide the AI's behavior. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.systemPrompt || ''}
                                    onChange={(value) => setConfig({ ...config, systemPrompt: value })}
                                    placeholder="You are a helpful assistant..."
                                />
                                <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                                    <span className="text-blue-400">#</span> Type # to reference a variable
                                </p>
                            </div>

                            {/* Question Input - Only show when agentType is 'assistant' */}
                            {agentType === 'assistant' && (
                                <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">Question</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                <p>The question or prompt to send to the AI model</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Textarea
                                        value={config.question || ''}
                                        onChange={(e) => setConfig({ ...config, question: e.target.value })}
                                        placeholder="Enter your question here..."
                                        className="bg-slate-700 border-slate-600 text-slate-200 min-h-[100px]"
                                        rows={4}
                                    />
                                    <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                                        <span className="text-blue-400">#</span> Type # to reference a variable
                                    </p>
                                </div>
                            )}

                            {/* Save Response to Variable */}
                            <VariableSelector
                                value={config.save_response_variable_id}
                                onChange={(variableId) => setConfig({ ...config, save_response_variable_id: variableId })}
                                label="Save Response To"
                            />
                        </>
                    )}

                    {/* Engine Node Config */}
                    {nodeType === 'engine' && (
                        <>
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-full mb-4 ring-1 ring-orange-500/20">
                                    <Settings2 className="h-10 w-10 text-orange-400" />
                                </div>
                                <h3 className="text-slate-200 font-semibold mb-2">Engine Node</h3>
                                <p className="text-slate-400 text-sm">Execution endpoint for the flow</p>
                                <p className="text-slate-600 text-xs mt-2">This node automatically processes all collected data and generates the final output</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Auto-save notice */}
                <div className="flex-shrink-0 p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm">
                    <p className="text-xs text-slate-400 text-center italic">
                        Changes are saved automatically. Click the Save button in the toolbar to persist your flow.
                    </p>
                </div>
            </div>
        </TooltipProvider>
    );
}
