import React, { useRef, useMemo, useState, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface Variable {
    id: string;
    name: string;
    description: string;
    format: string;
}

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
    const [showVariableMenu, setShowVariableMenu] = useState(false);
    const [variableSearch, setVariableSearch] = useState('');
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [variables, setVariables] = useState<Variable[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const variableStartIndex = useRef<number>(-1);

    // Fetch variables
    useEffect(() => {
        const fetchVariables = async () => {
            try {
                console.log('Fetching variables...');
                const response = await apiClient.get('/api/variables?limit=100');
                const data = await response.json();
                console.log('Variables fetched:', data.variables);
                setVariables(data.variables || []);
            } catch (err) {
                console.error('Failed to fetch variables:', err);
            }
        };
        fetchVariables();
    }, []);

    // Filter variables based on search
    const filteredVariables = useMemo(() => {
        if (!variableSearch) {
            console.log('No search term, returning all variables:', variables.length);
            return variables;
        }
        const search = variableSearch.toLowerCase();
        const filtered = variables.filter(v =>
            v.name.toLowerCase().includes(search) ||
            v.description.toLowerCase().includes(search)
        );
        console.log(`Filtered ${filtered.length} variables for search:`, search);
        return filtered;
    }, [variables, variableSearch]);

    // Handle text change and detect '#' trigger
    const handleChange = (content: string) => {
        onChange(content);

        // Use setTimeout to ensure Quill has updated
        setTimeout(() => {
            const quill = quillRef.current?.getEditor();
            if (!quill) return;

            const selection = quill.getSelection();
            if (!selection) return;

            const cursorPosition = selection.index;
            // Remove trailing newline that Quill always adds
            const text = quill.getText(0, cursorPosition).replace(/\n$/, '');
            const lastHashIndex = text.lastIndexOf('#');

            // Debug logging
            console.log('Cursor position:', cursorPosition);
            console.log('Text before cursor:', text);
            console.log('Last # index:', lastHashIndex);

            // Check if we're after a '#' character
            if (lastHashIndex !== -1 && lastHashIndex < text.length) {
                const textAfterHash = text.substring(lastHashIndex + 1);

                console.log('Text after #:', textAfterHash);

                // Only show menu if there's no space after '#'
                if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
                    setVariableSearch(textAfterHash);
                    variableStartIndex.current = lastHashIndex;

                    // Get cursor position for menu placement
                    const bounds = quill.getBounds(cursorPosition);
                    const wrapperRect = quillRef.current?.getEditor()?.root.parentElement?.getBoundingClientRect();

                    // Calculate position relative to editor wrapper (using absolute positioning)
                    const relativeTop = bounds.bottom + 39;

                    // Check if dropdown would go off-screen
                    const dropdownHeight = 256;
                    const editorRect = quill.root.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - (editorRect.top + bounds.bottom);
                    const shouldShowAbove = spaceBelow < dropdownHeight && bounds.top > dropdownHeight;

                    const finalTop = shouldShowAbove
                        ? bounds.top - dropdownHeight - 39
                        : relativeTop;

                    console.log('Menu positioning:', {
                        bounds,
                        relativeTop,
                        spaceBelow,
                        shouldShowAbove,
                        finalTop
                    });

                    setMenuPosition({ top: finalTop, left: 0 });
                    setShowVariableMenu(true);
                    setSelectedIndex(0);

                    console.log('Showing variable menu at:', { top: bounds.bottom, left: bounds.left });
                } else {
                    setShowVariableMenu(false);
                }
            } else {
                setShowVariableMenu(false);
            }
        }, 0);
    };

    // Insert variable
    const insertVariable = (variable: Variable) => {
        const quill = quillRef.current?.getEditor();
        if (!quill || variableStartIndex.current === -1) return;

        const selection = quill.getSelection();
        if (!selection) return;

        // Delete the '#' and search text
        quill.deleteText(variableStartIndex.current, selection.index - variableStartIndex.current);

        // Insert the variable name as a styled span with space after
        quill.insertText(variableStartIndex.current, `#{${variable.name}} `, {
            color: '#60a5fa',
            bold: true
        });

        // Move cursor after the inserted variable and space
        const newPosition = variableStartIndex.current + variable.name.length + 4; // +4 for #{} and space
        quill.setSelection(newPosition, 0);

        setShowVariableMenu(false);
        variableStartIndex.current = -1;
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showVariableMenu) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredVariables.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === 'Enter' && filteredVariables.length > 0) {
                e.preventDefault();
                insertVariable(filteredVariables[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowVariableMenu(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showVariableMenu, filteredVariables, selectedIndex]);

    // Reset selected index when filtered variables change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredVariables]);


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
        <div className={`rich-text-editor-wrapper relative ${className}`}>
            <style>{`
                .rich-text-editor-wrapper .ql-toolbar {
                    background: rgb(30 41 59);
                    border: 1px solid rgb(51 65 85);
                    border-bottom: none;
                    border-radius: 0.5rem 0.5rem 0 0;
                    padding: 8px;
                }

                .rich-text-editor-wrapper .ql-container {
                    background: rgb(30 41 59);
                    border: 1px solid rgb(51 65 85);
                    border-radius: 0 0 0.5rem 0.5rem;
                    color: rgb(226 232 240);
                    font-family: inherit;
                    min-height: 100px;
                }

                .rich-text-editor-wrapper .ql-editor {
                    min-height: 100px;
                    color: rgb(226 232 240);
                }

                .rich-text-editor-wrapper .ql-editor.ql-blank::before {
                    color: rgb(100 116 139);
                    font-style: normal;
                }

                .rich-text-editor-wrapper .ql-stroke {
                    stroke: rgb(148 163 184) !important;
                }

                .rich-text-editor-wrapper .ql-fill {
                    fill: rgb(148 163 184) !important;
                }

                .rich-text-editor-wrapper .ql-picker-label {
                    color: rgb(148 163 184) !important;
                }

                .rich-text-editor-wrapper .ql-toolbar button:hover,
                .rich-text-editor-wrapper .ql-toolbar button.ql-active {
                    background: rgb(51 65 85);
                    border-radius: 4px;
                }

                .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke,
                .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
                    stroke: rgb(226 232 240) !important;
                }

                .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill,
                .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
                    fill: rgb(226 232 240) !important;
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
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />

            {/* Variable Autocomplete Menu */}
            {showVariableMenu && (
                <div
                    className="absolute bg-slate-800 border border-slate-700/50 rounded-lg shadow-2xl w-80 max-h-64 overflow-y-auto z-[9999] left-0 right-0 mx-auto"
                    style={{
                        top: `${menuPosition.top}px`,
                    }}
                    onMouseDown={(e) => {
                        // Prevent losing focus from editor
                        e.preventDefault();
                    }}
                >
                    {filteredVariables.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            No variables found
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredVariables.map((variable, index) => (
                                <div
                                    key={variable.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertVariable(variable);
                                    }}
                                    className={cn(
                                        "px-3 py-2 cursor-pointer transition-colors",
                                        index === selectedIndex
                                            ? "bg-blue-600/20 border-l-2 border-blue-500"
                                            : "hover:bg-slate-700/60"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-200 truncate">
                                                {variable.name}
                                            </div>
                                            {variable.description && (
                                                <div className="text-xs text-slate-500 truncate mt-0.5">
                                                    {variable.description}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 flex-shrink-0">
                                            {variable.format}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};