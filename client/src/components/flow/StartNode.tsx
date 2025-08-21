import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

export default function StartNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-green-500 border-2 border-green-600 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-700 border-2 border-white"
      />
    </div>
  );
}