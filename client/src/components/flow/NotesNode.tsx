import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { StickyNote, Trash2 } from 'lucide-react';

export interface NotesNodeData {
    content: string;
    width?: number;
    height?: number;
}

export default function NotesNode({ id, data, selected }: NodeProps<NotesNodeData>) {
    const [content, setContent] = useState(data.content || '');
    const [isEditing, setIsEditing] = useState(false);
    const [dimensions, setDimensions] = useState({ width: data.width || 250, height: data.height || 200 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setContent(data.content || '');
    }, [data.content]);

    useEffect(() => {
        if (data.width || data.height) {
            setDimensions({ width: data.width || 250, height: data.height || 200 });
        }
    }, [data.width, data.height]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(content.length, content.length);
        }
    }, [isEditing]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Dispatch event to update node data
        const event = new CustomEvent('updateNodeData', {
            detail: { nodeId: id, data: { content: newContent } }
        });
        window.dispatchEvent(event);
    };

    const handleClick = () => {
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleDelete = () => {
        const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
        window.dispatchEvent(event);
    };

    const handleResize = (event: any, params: any) => {
        const newWidth = params.width;
        const newHeight = params.height;
        setDimensions({ width: newWidth, height: newHeight });
        
        // Update node data with new dimensions
        const updateEvent = new CustomEvent('updateNodeData', {
            detail: { nodeId: id, data: { width: newWidth, height: newHeight } }
        });
        window.dispatchEvent(updateEvent);
    };

    return (
        <div
            className={`bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-lg shadow-lg transition-all relative ${selected ? 'ring-2 ring-yellow-500 shadow-yellow-500/20' : 'shadow-yellow-900/10'
                }`}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                minWidth: 200,
                minHeight: 150,
            }}
            onClick={handleClick}
        >
            {/* Resize handles - only show when selected */}
            {selected && (
                <NodeResizer
                    minWidth={200}
                    minHeight={150}
                    isVisible={selected}
                    lineClassName="border-yellow-600"
                    handleClassName="h-3 w-3 bg-yellow-600 rounded-full"
                    onResize={handleResize}
                />
            )}

            {/* Sticky note header strip */}
            <div className="h-8 bg-yellow-400/40 rounded-t-lg border-b border-yellow-400/50 px-3 flex items-center justify-between">
                <div className="flex items-center">
                    <StickyNote className="h-3.5 w-3.5 text-yellow-700 mr-2" />
                    <span className="text-xs font-medium text-yellow-800">Note</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                    }}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors group"
                    title="Delete Note"
                >
                    <Trash2 className="h-3.5 w-3.5 text-yellow-700 group-hover:text-red-600" />
                </button>
            </div>

            {/* Content area */}
            <div className="p-3 h-[calc(100%-2rem)] overflow-hidden">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onBlur={handleBlur}
                        placeholder="Type your note here..."
                        className="w-full h-full bg-transparent border-none outline-none resize-none text-sm text-yellow-900 placeholder-yellow-600/50 font-handwriting"
                        style={{
                            fontFamily: "'Caveat', 'Comic Sans MS', cursive",
                            fontSize: '15px',
                            lineHeight: '1.6',
                        }}
                    />
                ) : (
                    <div
                        className="w-full h-full text-sm text-yellow-900 whitespace-pre-wrap overflow-auto cursor-text"
                        style={{
                            fontFamily: "'Caveat', 'Comic Sans MS', cursive",
                            fontSize: '15px',
                            lineHeight: '1.6',
                        }}
                    >
                        {content || (
                            <span className="text-yellow-600/50">Click to add note...</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
