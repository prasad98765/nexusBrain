import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';

export default function InputNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-blue-500 border-2 border-blue-600 min-w-[120px]">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-700 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-700 border-2 border-white"
      />
    </div>
  );
}