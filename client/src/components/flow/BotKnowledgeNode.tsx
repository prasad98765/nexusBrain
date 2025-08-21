import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Settings } from 'lucide-react';

export default function BotKnowledgeNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-purple-500 border-2 border-purple-600 min-w-[140px] cursor-pointer hover:bg-purple-600 transition-colors">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
        <Settings className="h-3 w-3 text-purple-200 ml-auto" />
      </div>
      {data.knowledgeSources && (
        <div className="mt-1 text-xs text-purple-200">
          {data.knowledgeSources.length} source(s)
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-700 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-700 border-2 border-white"
      />
    </div>
  );
}