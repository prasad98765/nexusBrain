import { Message as MessageType } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Copy, Cpu } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const { user } = useAuth();
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  if (isUser) {
    return (
      <div className="flex items-start space-x-4 flex-row-reverse space-x-reverse">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt="User avatar"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-slate-600">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </span>
          </div>
        )}
        <div className="flex-1 max-w-3xl">
          <div className="bg-primary text-white rounded-2xl p-4 shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">
            {format(new Date(message.createdAt), "h:mm a")}
          </p>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="flex items-start space-x-4">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              {format(new Date(message.createdAt), "h:mm a")}
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 p-1">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 p-1">
                <ThumbsDown className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-slate-600 p-1"
                onClick={handleCopy}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
