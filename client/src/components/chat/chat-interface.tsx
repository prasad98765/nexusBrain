import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Message from "./message";
import MessageInput from "./message-input";
import { ConversationWithMessages, Message as MessageType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Cpu } from "lucide-react";

interface ChatInterfaceProps {
  workspaceId: string | null;
  conversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
}

export default function ChatInterface({
  workspaceId,
  conversationId,
  onConversationSelect,
}: ChatInterfaceProps) {
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useQuery<ConversationWithMessages>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { title?: string; model?: string }) => {
      const response = await apiRequest("POST", `/api/workspaces/${workspaceId}/conversations`, data);
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "conversations"] });
      onConversationSelect(newConversation.id);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; role: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      setIsTyping(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!workspaceId) {
      toast({
        title: "Error",
        description: "Please select a workspace first.",
        variant: "destructive",
      });
      return;
    }

    if (!conversationId) {
      // Create new conversation first
      const newConv = await createConversationMutation.mutateAsync({
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        model: "gpt-4",
      });
      
      if (newConv) {
        setIsTyping(true);
        sendMessageMutation.mutate({ content, role: "user" });
      }
    } else {
      setIsTyping(true);
      sendMessageMutation.mutate({ content, role: "user" });
    }
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  if (!workspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            No workspace selected
          </h2>
          <p className="text-slate-600">Please select a workspace to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome Message */}
        {!conversationId && (
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="text-slate-700">
                  Hello! I'm your AI assistant. I can help you with analysis, content generation, 
                  data processing, and much more. What would you like to work on today?
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {conversation?.messages?.map((message: MessageType) => (
          <Message key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        onQuickAction={handleQuickAction}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
