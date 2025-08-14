import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Conversation } from "@shared/schema";
import { format } from "date-fns";

interface RightSidebarProps {
  conversationId: string | null;
  workspaceId: string | null;
}

export default function RightSidebar({ conversationId, workspaceId }: RightSidebarProps) {
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/workspaces", workspaceId, "conversations"],
    enabled: !!workspaceId,
  });

  const { data: currentConversation } = useQuery({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  return (
    <div className="hidden lg:block w-80 bg-white border-l border-slate-200 overflow-y-auto">
      <div className="p-6">
        {/* Conversation Info */}
        {currentConversation && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Conversation</h3>
            <div className="text-sm text-slate-500 space-y-1">
              <p>
                Started {format(new Date(currentConversation.createdAt), "MMM d 'at' h:mm a")}
              </p>
              <p>{currentConversation.messages?.length || 0} messages</p>
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Conversations</h4>
          <div className="space-y-2">
            {conversations?.slice(0, 5).map((conv) => (
              <Button
                key={conv.id}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
              >
                <div className="w-full">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {conv.title || "Untitled Conversation"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(conv.updatedAt), "MMM d")}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* AI Models */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-900 mb-3">AI Model</h4>
          <RadioGroup defaultValue="gpt-4" className="space-y-2">
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50">
              <RadioGroupItem value="gpt-4" id="gpt-4" />
              <Label htmlFor="gpt-4" className="flex-1 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-900">GPT-4</p>
                  <p className="text-xs text-slate-500">Most capable model</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50">
              <RadioGroupItem value="gpt-3.5" id="gpt-3.5" />
              <Label htmlFor="gpt-3.5" className="flex-1 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-900">GPT-3.5</p>
                  <p className="text-xs text-slate-500">Faster responses</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usage This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Messages</span>
                <span className="font-medium">127 / 1000</span>
              </div>
              <Progress value={12.7} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Storage</span>
                <span className="font-medium">2.3 GB / 10 GB</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
