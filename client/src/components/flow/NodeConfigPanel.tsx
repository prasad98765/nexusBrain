import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, GripVertical, Upload, Link as LinkIcon, Settings2, Image as ImageIcon, Video, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import VariableSelector from '@/components/variables/VariableSelector';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NodeConfigPanelProps {
    nodeId: string | null;
    nodeType: 'button' | 'input' | 'ai' | null;
    nodeData: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function NodeConfigPanel({ nodeId, nodeType, nodeData, onClose, onSave }: NodeConfigPanelProps) {
    const [config, setConfig] = useState<any>({});
    const [draggedButton, setDraggedButton] = useState<number | null>(null);
    const [mediaUploadType, setMediaUploadType] = useState<'upload' | 'link'>('link');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (nodeData) {
            setConfig({ ...nodeData });
        }
    }, [nodeData]);

    const handleSave = () => {
        onSave(config);
        onClose();
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

    if (!nodeId || !nodeType) return null;

    return (
        <TooltipProvider>
            <div className="fixed right-0 top-0 h-full w-[420px] bg-gradient-to-br from-[#0a0e14] to-[#0f1419] border-l border-gray-700/50 shadow-2xl z-50 flex flex-col backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg ring-1 ring-blue-500/30">
                            <Settings2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-100">
                                {nodeType === 'button' ? 'Button Node' : nodeType === 'input' ? 'Input Node' : 'AI Node'}
                            </h3>
                            <p className="text-xs text-gray-500">Configure node settings</p>
                        </div>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-700/70 rounded-lg transition-all hover:scale-105"
                            >
                                <X className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs">
                            <p>Close panel (Esc)</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {/* Button Node Config */}
                    {nodeType === 'button' && (
                        <>
                            {/* Combined Media Content - Unified UI */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-[#0f1419] to-[#0a0e14] rounded-lg border border-gray-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-gray-200 uppercase tracking-wide">Media Content</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
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
                                        } else {
                                            setConfig({ ...config, media: { type: value as 'image' | 'video' | 'document', url: '' } });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-[#0f1419] border-gray-600/50 text-gray-200 hover:border-gray-500 transition-colors">
                                        <SelectValue placeholder="Select media type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f1419] border-gray-700">
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
                                    </SelectContent>
                                </Select>

                                {config.media && (
                                    <div className="space-y-3 p-3 bg-[#0f1419] border border-gray-700 rounded">
                                        {/* Unified input/upload component */}
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaUploadType('link')}
                                                    className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${mediaUploadType === 'link'
                                                        ? 'bg-blue-600 border-blue-500 text-white'
                                                        : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
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
                                                        : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
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
                                                        className="bg-[#0f1419] border-gray-600/50 text-gray-200 text-sm hover:border-gray-500 focus:border-blue-500 transition-colors"
                                                    />
                                                    {config.media.type === 'document' && (
                                                        <Input
                                                            value={config.media.name || ''}
                                                            onChange={(e) => setConfig({ ...config, media: { ...config.media, name: e.target.value } })}
                                                            placeholder="Document name (optional)"
                                                            className="bg-[#0f1419] border-gray-600/50 text-gray-200 text-sm hover:border-gray-500 focus:border-blue-500 transition-colors"
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
                                                        className="w-full border-gray-600/50 hover:bg-gray-800/50 text-gray-300 hover:border-blue-500 transition-all"
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

                            {/* Bot asks this question with rich text editor */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-[#0f1419] to-[#0a0e14] rounded-lg border border-gray-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="message" className="text-sm font-medium text-gray-200 uppercase tracking-wide">Message Content</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
                                            <p>The question or message shown to users. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.message || ''}
                                    onChange={(value) => setConfig({ ...config, message: value })}
                                    placeholder="What would you like to choose?"
                                />
                                <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
                                    <span className="text-blue-400">#</span> Type # to reference a variable
                                </p>
                            </div>

                            {/* Buttons Section */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-[#0f1419] to-[#0a0e14] rounded-lg border border-gray-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-gray-200 uppercase tracking-wide">Action Buttons</Label>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const newButton = {
                                                id: Date.now().toString(),
                                                label: 'New Button',
                                                actionType: 'connect_to_node' as const,
                                                actionValue: ''
                                            };
                                            setConfig({
                                                ...config,
                                                buttons: [...(config.buttons || []), newButton]
                                            });
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 h-7 text-xs shadow-lg shadow-blue-500/20"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Add Button
                                    </Button>
                                </div>

                                {config.buttons && config.buttons.map((btn: any, idx: number) => (
                                    <div
                                        key={btn.id}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`p-3.5 bg-gradient-to-br from-[#1a1f2e]/80 to-[#151922]/80 border border-gray-600/40 rounded-lg space-y-2.5 cursor-move transition-all hover:border-gray-500/60 ${draggedButton === idx ? 'opacity-50 scale-95 shadow-inner' : 'shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-gray-500 cursor-grab active:cursor-grabbing" />
                                                <span className="text-xs text-gray-400 font-medium">Button {idx + 1}</span>
                                            </div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => {
                                                            setConfig({
                                                                ...config,
                                                                buttons: config.buttons.filter((b: any) => b.id !== btn.id)
                                                            });
                                                        }}
                                                        className="p-1.5 hover:bg-red-900/60 rounded-lg transition-all hover:scale-105"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs">
                                                    <p>Delete button</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>

                                        <Input
                                            value={btn.label}
                                            onChange={(e) => {
                                                const updated = config.buttons.map((b: any) =>
                                                    b.id === btn.id ? { ...b, label: e.target.value } : b
                                                );
                                                setConfig({ ...config, buttons: updated });
                                            }}
                                            placeholder="Button label"
                                            className="bg-[#0f1419] border-gray-600/50 text-gray-200 text-sm hover:border-gray-500 focus:border-blue-500 transition-colors"
                                        />

                                        <Select
                                            value={btn.actionType}
                                            onValueChange={(value) => {
                                                const updated = config.buttons.map((b: any) =>
                                                    b.id === btn.id ? { ...b, actionType: value } : b
                                                );
                                                setConfig({ ...config, buttons: updated });
                                            }}
                                        >
                                            <SelectTrigger className="bg-[#0f1419] border-gray-600/50 text-gray-200 text-sm hover:border-gray-500 transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f1419] border-gray-700">
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
                                                className="bg-[#0f1419] border-gray-600/50 text-gray-200 text-sm hover:border-gray-500 focus:border-blue-500 transition-colors"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Save Response to Variable - At Button Node Level */}
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
                            <div className="space-y-3 p-4 bg-gradient-to-br from-[#0f1419] to-[#0a0e14] rounded-lg border border-gray-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="inputType" className="text-sm font-medium text-gray-200 uppercase tracking-wide">Input Type</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
                                            <p>Select the type of data this input will collect</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Select
                                    value={config.inputType || 'text'}
                                    onValueChange={(value) => setConfig({ ...config, inputType: value })}
                                >
                                    <SelectTrigger className="bg-[#0f1419] border-gray-600/50 text-gray-200 hover:border-gray-500 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f1419] border-gray-700">
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
                            <div className="space-y-3 p-4 bg-gradient-to-br from-[#0f1419] to-[#0a0e14] rounded-lg border border-gray-700/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="placeholder" className="text-sm font-medium text-gray-200 uppercase tracking-wide">Question Text</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
                                            <p>The question shown to users. Use # to reference variables.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <RichTextEditor
                                    value={config.placeholder || ''}
                                    onChange={(value) => setConfig({ ...config, placeholder: value })}
                                    placeholder="Enter your placeholder text..."
                                />
                                <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
                                    <span className="text-blue-400">#</span> Type # to reference a variable
                                </p>
                            </div>

                            {/* Save Response to Variable */}
                            <VariableSelector
                                value={config.save_response_variable_id}
                                onChange={(variableId) => setConfig({ ...config, save_response_variable_id: variableId })}
                                label="Save Response To"
                            />
                        </>
                    )}

                    {/* AI Node (no config for now) */}
                    {nodeType === 'ai' && (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="p-4 bg-gray-800/30 rounded-full mb-4">
                                <Settings2 className="h-10 w-10 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-sm">No configuration required for AI node</p>
                            <p className="text-gray-600 text-xs mt-2">This node processes automatically</p>
                        </div>
                    )}
                </div>

                {/* Footer with Cancel and Save Changes Buttons */}
                <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-gradient-to-r from-[#0f1419] to-[#0a0e14] flex gap-3 backdrop-blur-sm">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 border-gray-600/50 hover:bg-gray-800/70 text-gray-300 hover:border-gray-500 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </TooltipProvider>
    );
}
