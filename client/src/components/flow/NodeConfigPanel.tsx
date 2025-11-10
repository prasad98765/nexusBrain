import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, GripVertical, Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        <div className="fixed right-0 top-0 h-full w-[400px] bg-[#1a1f2e] border-l border-gray-700 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#0f1419] flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-200">
                    {nodeType === 'button' ? 'Button Node' : nodeType === 'input' ? 'Input Node' : 'AI Node'}
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                    <X className="h-5 w-5 text-gray-400" />
                </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Button Node Config */}
                {nodeType === 'button' && (
                    <>
                        {/* Combined Media Content - Unified UI */}
                        <div className="space-y-3">
                            <Label className="text-gray-200">Media Content (Optional)</Label>
                            
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
                                <SelectTrigger className="bg-[#0f1419] border-gray-700 text-gray-200">
                                    <SelectValue placeholder="Select media type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1f2e] border-gray-700">
                                    <SelectItem value="none">No Media</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="document">Document</SelectItem>
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
                                                className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                                                    mediaUploadType === 'link'
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
                                                className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                                                    mediaUploadType === 'upload'
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
                                                    className="bg-[#1a1f2e] border-gray-600 text-gray-200 text-sm"
                                                />
                                                {config.media.type === 'document' && (
                                                    <Input
                                                        value={config.media.name || ''}
                                                        onChange={(e) => setConfig({ ...config, media: { ...config.media, name: e.target.value } })}
                                                        placeholder="Document name (optional)"
                                                        className="bg-[#1a1f2e] border-gray-600 text-gray-200 text-sm"
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
                                                    className="w-full border-gray-600 hover:bg-gray-800 text-gray-300"
                                                >
                                                    <Upload className="h-3 w-3 mr-2" />
                                                    {config.media.url ? 'Change File' : 'Upload File'} (Max 2MB)
                                                </Button>
                                                {config.media.url && (
                                                    <div className="text-xs text-green-400 truncate">
                                                        ✓ {config.media.name || 'File uploaded'}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Combined Message Text Input */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-gray-200">Bot asks this question</Label>
                            <Textarea
                                id="message"
                                value={config.message || ''}
                                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                                className="bg-[#0f1419] border-gray-700 text-gray-200 min-h-[100px] resize-none"
                                placeholder="What would you like to choose?"
                            />
                            <p className="text-xs text-gray-500">You can reference a variable by typing #</p>
                        </div>

                        {/* Buttons Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-gray-200">Action Buttons</Label>
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
                                    className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
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
                                    className={`p-3 bg-[#0f1419] border border-gray-700 rounded space-y-2 cursor-move transition-all ${
                                        draggedButton === idx ? 'opacity-50 scale-95' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs text-gray-400">Button {idx + 1}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setConfig({
                                                    ...config,
                                                    buttons: config.buttons.filter((b: any) => b.id !== btn.id)
                                                });
                                            }}
                                            className="p-1 hover:bg-red-900/50 rounded"
                                        >
                                            <Trash2 className="h-3 w-3 text-red-400" />
                                        </button>
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
                                        className="bg-[#1a1f2e] border-gray-700 text-gray-200 text-sm"
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
                                        <SelectTrigger className="bg-[#1a1f2e] border-gray-700 text-gray-200 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1f2e] border-gray-700">
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
                                            className="bg-[#1a1f2e] border-gray-700 text-gray-200 text-sm"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Input Node Config */}
                {nodeType === 'input' && (
                    <>
                        <div>
                            <Label htmlFor="inputType" className="text-gray-200">Input Type</Label>
                            <Select
                                value={config.inputType || 'text'}
                                onValueChange={(value) => setConfig({ ...config, inputType: value })}
                            >
                                <SelectTrigger className="mt-1 bg-[#0f1419] border-gray-700 text-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1f2e] border-gray-700">
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="textarea">Long Text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Combined Placeholder Input */}
                        <div className="space-y-2">
                            <Label htmlFor="placeholder" className="text-gray-200">Bot asks this question</Label>
                            <Textarea
                                id="placeholder"
                                value={config.placeholder || ''}
                                onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
                                className="bg-[#0f1419] border-gray-700 text-gray-200 min-h-[100px] resize-none"
                                placeholder="Enter your placeholder text..."
                            />
                            <p className="text-xs text-gray-500">You can reference a variable by typing #</p>
                        </div>
                    </>
                )}

                {/* AI Node (no config for now) */}
                {nodeType === 'ai' && (
                    <div className="text-center py-8 text-gray-400">
                        <p>No configuration required for AI node</p>
                    </div>
                )}
            </div>

            {/* Footer with Cancel and Save Changes Buttons */}
            <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-[#0f1419] flex gap-2">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-gray-700 hover:bg-gray-800 text-gray-300"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
