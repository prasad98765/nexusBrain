import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Mic } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onQuickAction: (action: string) => void;
  disabled?: boolean;
}

const quickActions = [
  "Analyze Data",
  "Generate Report", 
  "Summarize Text",
  "Create Presentation",
];

export default function MessageInput({ 
  onSendMessage, 
  onQuickAction, 
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-slate-200 bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-4">
          {/* File Upload Button */}
          <Button 
            type="button"
            variant="ghost"
            size="sm"
            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Ask me anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-12 resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={disabled}
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 bottom-2"
              disabled={!message.trim() || disabled}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Voice Input Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
            disabled={disabled}
          >
            <Mic className="w-5 h-5" />
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => onQuickAction(action)}
              disabled={disabled}
              className="text-slate-600 hover:bg-slate-50"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
