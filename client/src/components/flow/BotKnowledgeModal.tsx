import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Globe, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BotKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string | null;
  onUpdate: (data: any) => void;
}

interface KnowledgeSource {
  id: string;
  type: 'document' | 'text' | 'website';
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
}

export default function BotKnowledgeModal({ 
  open, 
  onOpenChange, 
  nodeId, 
  onUpdate 
}: BotKnowledgeModalProps) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [manualText, setManualText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload .doc, .pdf, .txt, .csv, or .xls/.xlsx files only.',
          variant: 'destructive',
        });
        return;
      }

      const newSource: KnowledgeSource = {
        id: Date.now().toString(),
        type: 'document',
        title: file.name,
        fileName: file.name,
      };

      setKnowledgeSources((prev) => [...prev, newSource]);
    });
  };

  const addManualText = () => {
    if (!manualText.trim()) return;

    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      type: 'text',
      title: `Manual Text ${knowledgeSources.filter(s => s.type === 'text').length + 1}`,
      content: manualText,
    };

    setKnowledgeSources((prev) => [...prev, newSource]);
    setManualText('');
  };

  const addWebsiteSource = () => {
    if (!websiteUrl.trim()) return;

    try {
      new URL(websiteUrl);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid website URL.',
        variant: 'destructive',
      });
      return;
    }

    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      type: 'website',
      title: websiteUrl,
      url: websiteUrl,
    };

    setKnowledgeSources((prev) => [...prev, newSource]);
    setWebsiteUrl('');
  };

  const removeSource = (id: string) => {
    setKnowledgeSources((prev) => prev.filter((source) => source.id !== id));
  };

  const saveKnowledge = () => {
    onUpdate({ knowledgeSources });
    toast({
      title: 'Knowledge updated',
      description: `Added ${knowledgeSources.length} knowledge source(s) to the node.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Bot Knowledge Sources
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Add knowledge sources to help your bot understand and respond to user queries.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="documents" className="data-[state=active]:bg-slate-600">
              Documents
            </TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-slate-600">
              Manual Text
            </TabsTrigger>
            <TabsTrigger value="website" className="data-[state=active]:bg-slate-600">
              Website
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-4">
                Upload documents (.doc, .pdf, .txt, .csv, .xls/.xlsx)
              </p>
              <input
                type="file"
                multiple
                accept=".doc,.docx,.pdf,.txt,.csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  Choose Files
                </Button>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm text-slate-300 block">Enter knowledge text:</label>
              <textarea
                rows={6}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Enter information you want your bot to know about..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
              />
              <Button onClick={addManualText} disabled={!manualText.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Text
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="website" className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm text-slate-300 block">Website URL to scrape:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <Button onClick={addWebsiteSource} disabled={!websiteUrl.trim()}>
                  <Globe className="h-4 w-4 mr-2" />
                  Add Site
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Knowledge Sources List */}
        {knowledgeSources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300">Added Sources:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {knowledgeSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {source.type === 'document' && <FileText className="h-4 w-4 text-blue-400" />}
                    {source.type === 'text' && <FileText className="h-4 w-4 text-green-400" />}
                    {source.type === 'website' && <Globe className="h-4 w-4 text-orange-400" />}
                    <div>
                      <p className="text-sm text-slate-200">{source.title}</p>
                      <p className="text-xs text-slate-400 capitalize">{source.type}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSource(source.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button onClick={saveKnowledge} className="bg-purple-600 hover:bg-purple-700">
            Save Knowledge ({knowledgeSources.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}