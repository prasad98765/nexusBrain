import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';

export default function StartNode({ data }: { data: any }) {
  return (
    <div className="bg-[#1a1f2e] rounded-lg border border-gray-700 shadow-xl min-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">{data.label || 'Chat Input'}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-200 text-xs">⋮</button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Input Text</label>
          <div className="bg-[#0f1419] border border-gray-700 rounded px-3 py-2 text-sm text-gray-500">
            Hello
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e]"
      />
    </div>
  );
}