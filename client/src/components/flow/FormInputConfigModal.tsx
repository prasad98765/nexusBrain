import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface FormInputData {
    label: string;
    inputType: 'name' | 'email' | 'phone' | 'text';
    questionText: string;
    emoji?: string;
    isBold?: boolean;
    isRequired?: boolean;
}

interface FormInputConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: FormInputData;
    onSave: (data: FormInputData) => void;
}

export default function FormInputConfigModal({
    open,
    onOpenChange,
    initialData,
    onSave,
}: FormInputConfigModalProps) {
    const [inputType, setInputType] = useState<'name' | 'email' | 'phone' | 'text'>(
        initialData?.inputType || 'text'
    );
    const [questionText, setQuestionText] = useState(initialData?.questionText || '');
    const [emoji, setEmoji] = useState(initialData?.emoji || '');
    const [isBold, setIsBold] = useState(initialData?.isBold || false);
    const [isRequired, setIsRequired] = useState<boolean>(initialData?.isRequired !== undefined ? initialData.isRequired : true);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            setInputType(initialData.inputType);
            setQuestionText(initialData.questionText);
            setEmoji(initialData.emoji || '');
            setIsBold(initialData.isBold || false);
            setIsRequired(initialData.isRequired !== undefined ? initialData.isRequired : true);
        }
    }, [initialData]);

    const handleSave = () => {
        onSave({
            label: 'Input Node',
            inputType,
            questionText,
            emoji,
            isBold,
            isRequired,
        });
        onOpenChange(false);
    };

    const handleEmojiSelect = (emojiData: EmojiClickData) => {
        setEmoji(emojiData.emoji);
        setEmojiPickerOpen(false);
    };

    const getPlaceholderText = () => {
        switch (inputType) {
            case 'name':
                return 'Please enter your name';
            case 'email':
                return 'Please enter your email address';
            case 'phone':
                return 'Please enter your phone number';
            default:
                return 'Enter your response...';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-slate-100">Configure Input Node</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Set up the form input field for collecting user information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Input Type Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="input-type" className="text-slate-200">Input Type</Label>
                        <Select value={inputType} onValueChange={(value: any) => setInputType(value)}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone Number</SelectItem>
                                <SelectItem value="text">Custom Text</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-2">
                        <Label htmlFor="question-text" className="text-slate-200">Question / Label Text</Label>
                        <Input
                            id="question-text"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder={getPlaceholderText()}
                            className="bg-slate-700 border-slate-600 text-slate-100"
                        />
                    </div>

                    {/* Emoji Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="emoji" className="text-slate-200">Emoji (Optional)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="emoji"
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                placeholder="Select or type emoji"
                                className="flex-1 bg-slate-700 border-slate-600 text-slate-100"
                                maxLength={2}
                            />
                            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-slate-600 hover:bg-slate-700"
                                    >
                                        <Smile className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-slate-600" align="end">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiSelect}
                                        width={320}
                                        height={400}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Bold Text Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                        <div>
                            <Label className="text-slate-200">Bold Text</Label>
                            <p className="text-xs text-slate-500">Make the question text bold</p>
                        </div>
                        <Switch
                            checked={isBold}
                            onCheckedChange={setIsBold}
                        />
                    </div>

                    {/* Required Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                        <div>
                            <Label className="text-slate-200">Required Field</Label>
                            <p className="text-xs text-slate-500">User must fill this field</p>
                        </div>
                        <Switch
                            checked={isRequired}
                            onCheckedChange={setIsRequired}
                        />
                    </div>

                    {/* Preview */}
                    <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
                        <Label className="text-slate-200 text-xs">Preview</Label>
                        <div className="bg-slate-800 p-3 rounded border border-slate-600">
                            <div className="flex items-center gap-2 mb-2">
                                {emoji && <span>{emoji}</span>}
                                <span className={`text-sm text-slate-200 ${isBold ? 'font-bold' : ''}`}>
                                    {questionText || getPlaceholderText()}
                                </span>
                                {isRequired && <span className="text-red-400 text-sm">*</span>}
                            </div>
                            <Input
                                placeholder={`Enter ${inputType}...`}
                                disabled
                                className="bg-slate-700 border-slate-600 text-slate-400 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-slate-600 hover:bg-slate-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        Save Configuration
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
