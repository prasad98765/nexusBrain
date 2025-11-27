import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';

export default function EndNode({ data }: { data: any }) {
  return (
    <div className="bg-slate-700 rounded-lg border border-slate-700 shadow-xl min-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">{data.label || 'Chat Output'}</span>
        </div>
        <button className="text-slate-400 hover:text-slate-200 text-xs">⋮</button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Text</label>
          <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500">
            Response output
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e]"
      />
    </div>
  );
}