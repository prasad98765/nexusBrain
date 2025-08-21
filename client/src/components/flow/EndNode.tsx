import React from 'react';
import { Handle, Position } from 'reactflow';
import { Square } from 'lucide-react';

export default function EndNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-red-500 border-2 border-red-600 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Square className="h-4 w-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-700 border-2 border-white"
      />
    </div>
  );
}