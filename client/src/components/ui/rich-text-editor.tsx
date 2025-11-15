import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Enter text...',
    className = ''
}) => {
    const quillRef = useRef<ReactQuill>(null);


    const modules = useMemo(() => ({
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }]
            ]
        }
    }), []);

    const formats = [
        'bold', 'italic', 'underline',
        'list', 'bullet'
    ];

    return (
        <div className={`rich-text-editor-wrapper ${className}`}>
            <style>{`
                .rich-text-editor-wrapper .ql-toolbar {
                    background: #0f1419;
                    border: 1px solid #374151;
                    border-bottom: none;
                    border-radius: 0.5rem 0.5rem 0 0;
                    padding: 8px;
                }

                .rich-text-editor-wrapper .ql-container {
                    background: #0f1419;
                    border: 1px solid #374151;
                    border-radius: 0 0 0.5rem 0.5rem;
                    color: #e5e7eb;
                    font-family: inherit;
                    min-height: 100px;
                }

                .rich-text-editor-wrapper .ql-editor {
                    min-height: 100px;
                    color: #e5e7eb;
                }

                .rich-text-editor-wrapper .ql-editor.ql-blank::before {
                    color: #6b7280;
                    font-style: normal;
                }

                .rich-text-editor-wrapper .ql-stroke {
                    stroke: #9ca3af !important;
                }

                .rich-text-editor-wrapper .ql-fill {
                    fill: #9ca3af !important;
                }

                .rich-text-editor-wrapper .ql-picker-label {
                    color: #9ca3af !important;
                }

                .rich-text-editor-wrapper .ql-toolbar button:hover,
                .rich-text-editor-wrapper .ql-toolbar button.ql-active {
                    background: #374151;
                    border-radius: 4px;
                }

                .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke,
                .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #e5e7eb !important;
                }

                .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill,
                .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
                    fill: #e5e7eb !important;
                }

                .rich-text-editor-wrapper .ql-editor a {
                    color: #60a5fa;
                }

                .rich-text-editor-wrapper .ql-editor ul,
                .rich-text-editor-wrapper .ql-editor ol {
                    padding-left: 1.5em;
                }

                .rich-text-editor-wrapper .ql-toolbar .ql-formats {
                    margin-right: 8px;
                }

                .rich-text-editor-wrapper .ql-toolbar button.ql-emoji-picker {
                    width: auto;
                }

                .rich-text-editor-wrapper .ql-toolbar button.ql-emoji-picker::before {
                    content: '';
                    display: none;
                }
            `}</style>

            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
        </div>
    );
};
