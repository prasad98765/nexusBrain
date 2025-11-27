import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

interface FormInputData {
    label: string;
    inputType: 'name' | 'email' | 'phone' | 'text';
    questionText: string;
    emoji?: string;
    isBold?: boolean;
    isRequired?: boolean;
}

export default function FormInputNode({ data, selected }: NodeProps<FormInputData>) {
    return (
        <div className={`bg-slate-700 rounded-lg border transition-all shadow-xl min-w-[280px] ${selected ? 'border-blue-500' : 'border-slate-700'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-200">User Input</span>
                </div>
                <div className="flex gap-1">
                    <button className="text-slate-400 hover:text-slate-200 text-xs">
                        ⋮
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                {/* Question Label */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Input Text {data.isRequired && <span className="text-red-400">*</span>}</label>
                    <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300">
                        {data.emoji && <span className="mr-1">{data.emoji}</span>}
                        <span className={data.isBold ? 'font-semibold' : ''}>
                            {data.questionText || 'Type something...'}
                        </span>
                    </div>
                </div>

                {/* Input Type */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Type</label>
                    <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300">
                        {data.inputType}
                    </div>
                </div>
            </div>

            {/* Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e]"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e]"
            />
        </div>
    );
}
