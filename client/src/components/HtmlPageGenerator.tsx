import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  Send,
  Copy,
  Download,
  Save,
  RefreshCw,
  History,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Square,
  User,
  Bot,
  X,
  Check,
  AlertCircle,
  Info,
  Clock,
  FileText,
  Loader2,
  ArrowUp,
  Share2,
  Edit,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface HtmlProject {
  id: string;
  timestamp: number;
  prompt: string;
  htmlContent: string;
  conversation: Message[];
}

interface HtmlPageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HtmlPageGenerator({ isOpen, onClose }: HtmlPageGeneratorProps) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HtmlProject[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('html_page_history_v1');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (error) {
        console.error('Failed to parse HTML page history:', error);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('html_page_history_v1', JSON.stringify(history));
  }, [history]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // Update preview when HTML content changes
  useEffect(() => {
    if (previewRef.current && htmlContent) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const generateHtmlFromPrompt = async (prompt: string) => {
    setIsGenerating(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: Date.now()
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setConversation(prev => [...prev, userMessage, assistantMessage]);
    setCurrentStreamingId(assistantMessage.id);

    // Simulate LLM streaming response
    const mockHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Page</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .card {
            background: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .button {
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Beautiful Generated Page</h1>
        <div class="card">
            <h2>Generated from your prompt: "${prompt}"</h2>
            <p>This is a beautiful responsive web page created by Nexus AI Hub's HTML Generator. The page includes modern styling, gradients, and interactive elements.</p>
            <button class="button">Interactive Button</button>
        </div>
        <div class="card">
            <h3>Features Included:</h3>
            <ul>
                <li>Responsive design</li>
                <li>Modern CSS styling</li>
                <li>Gradient backgrounds</li>
                <li>Glass morphism effects</li>
                <li>Interactive elements</li>
            </ul>
        </div>
    </div>
    <script>
        document.querySelector('.button').addEventListener('click', function() {
            alert('Hello from Nexus AI Hub! This page was generated from your prompt.');
        });
    </script>
</body>
</html>`;

    let currentContent = '';
    const words = mockHtmlTemplate.split('');

    for (let i = 0; i < words.length; i++) {
      if (!isGenerating) break; // Allow stopping generation

      currentContent += words[i];
      setStreamingContent(currentContent);

      // Update the conversation with streaming content
      setConversation(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: `\`\`\`html\n${currentContent}\n\`\`\`` }
          : msg
      ));

      // Random delay to simulate realistic streaming
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
    }

    // Finalize streaming
    setConversation(prev => prev.map(msg =>
      msg.id === assistantMessage.id
        ? { ...msg, content: `\`\`\`html\n${currentContent}\n\`\`\``, isStreaming: false }
        : msg
    ));

    setHtmlContent(currentContent);
    setStreamingContent('');
    setCurrentStreamingId(null);
    setIsGenerating(false);

    showFeedback('success', 'HTML page generated successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isGenerating) return;

    const prompt = currentInput.trim();
    setCurrentInput('');
    await generateHtmlFromPrompt(prompt);
  };

  const stopGeneration = () => {
    setIsGenerating(false);
    setCurrentStreamingId(null);
    showFeedback('info', 'Generation stopped');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      showFeedback('success', 'HTML copied to clipboard!');
    }).catch(() => {
      showFeedback('error', 'Failed to copy HTML');
    });
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-page-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('success', 'HTML file downloaded!');
  };

  const handleSave = () => {
    if (conversation.length === 0 || !htmlContent) {
      showFeedback('error', 'Nothing to save');
      return;
    }

    const userPrompts = conversation.filter(msg => msg.type === 'user').map(msg => msg.content);
    const mainPrompt = userPrompts[0] || 'Generated HTML Page';

    const newProject: HtmlProject = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: mainPrompt,
      htmlContent,
      conversation: [...conversation]
    };

    setHistory(prev => [newProject, ...prev.slice(0, 9)]); // Keep last 10
    showFeedback('success', 'Project saved to history!');
  };

  const handleReset = () => {
    setConversation([]);
    setHtmlContent('');
    setStreamingContent('');
    setCurrentInput('');
    showFeedback('info', 'Editor reset');
  };

  const loadFromHistory = (project: HtmlProject) => {
    setConversation(project.conversation);
    setHtmlContent(project.htmlContent);
    setShowHistory(false);
    showFeedback('success', 'Project loaded from history');
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(project => project.id !== id));
    showFeedback('success', 'Project deleted from history');
  };

  const handleCodeEdit = (newCode: string) => {
    setHtmlContent(newCode);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPreviewStyles = () => {
    switch (previewMode) {
      case 'mobile':
        return 'w-80 h-96';
      case 'tablet':
        return 'w-96 h-[500px]';
      default:
        return 'w-full h-full';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">HTML Page Generator</h1>
            <p className="text-sm text-slate-400">Powered by Nexus AI Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className={`mx-4 mt-2 p-3 rounded-lg flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            feedback.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
          {feedback.type === 'success' && <Check className="h-4 w-4" />}
          {feedback.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {feedback.type === 'info' && <Info className="h-4 w-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Chat Interface */}
        <div className="w-1/2 flex flex-col border-r border-slate-700">
          {/* Chat Messages */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {conversation.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Code2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">HTML Page Generator</h3>
                    <p className="text-slate-400 max-w-md">
                      Describe the webpage you want to create and I'll generate beautiful HTML for you!
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    Example: "Create a modern landing page for a coffee shop"
                  </div>
                </div>
              </div>
            ) : (
              conversation.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                      ? 'bg-slate-600'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`p-3 rounded-lg ${message.type === 'user'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800/80 text-slate-200'
                      }`}>
                      {message.content.startsWith('```html') ? (
                        <div className="space-y-2">
                          <div className="text-sm text-slate-400">Generated HTML:</div>
                          <pre className="text-xs bg-slate-900/50 p-3 rounded overflow-x-auto">
                            <code>{message.content.replace(/```html\n?/, '').replace(/\n?```$/, '')}</code>
                          </pre>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.isStreaming && (
                        <div className="flex items-center gap-2 mt-2 text-indigo-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Generating...</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Describe the HTML page you want to create..."
                  disabled={isGenerating}
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                  data-testid="prompt-input"
                />
                {isGenerating ? (
                  <Button
                    type="button"
                    onClick={stopGeneration}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/20"
                    data-testid="stop-button"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!currentInput.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white disabled:opacity-50"
                    data-testid="send-button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{currentInput.length} characters</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!htmlContent}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    data-testid="save-button"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    data-testid="reset-button"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Preview & Editor */}
        <div className="w-1/2 flex flex-col">
          {/* Preview Controls */}
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Preview:</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                    className={`text-slate-400 hover:text-white ${previewMode === 'desktop' ? 'bg-slate-700 text-white' : ''}`}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                    className={`text-slate-400 hover:text-white ${previewMode === 'tablet' ? 'bg-slate-700 text-white' : ''}`}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                    className={`text-slate-400 hover:text-white ${previewMode === 'mobile' ? 'bg-slate-700 text-white' : ''}`}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                  className="text-slate-400 hover:text-white"
                >
                  {showCodeEditor ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!htmlContent}
                  className="text-slate-400 hover:text-white"
                  data-testid="copy-button"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!htmlContent}
                  className="text-slate-400 hover:text-white"
                  data-testid="download-button"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col">
            <div className={`${showCodeEditor ? 'h-1/2' : 'h-full'} flex items-center justify-center bg-slate-800/30 p-4`}>
              {htmlContent ? (
                <div className={`bg-white rounded-lg shadow-xl ${getPreviewStyles()}`}>
                  <iframe
                    ref={previewRef}
                    className="w-full h-full rounded-lg"
                    title="HTML Preview"
                    sandbox="allow-scripts"
                    data-testid="preview-iframe"
                    srcDoc={htmlContent}
                  />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Live Preview</h3>
                    <p className="text-slate-400">Your generated HTML will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Code Editor */}
            {showCodeEditor && (
              <div className="h-1/2 border-t border-slate-700">
                <div className="h-full flex flex-col">
                  <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">HTML Code</span>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {htmlContent.length} characters
                    </Badge>
                  </div>
                  <Textarea
                    ref={codeEditorRef}
                    value={htmlContent}
                    onChange={(e) => handleCodeEdit(e.target.value)}
                    placeholder="Generated HTML will appear here... You can edit it directly."
                    className="flex-1 bg-slate-900/50 border-0 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:ring-0 resize-none rounded-none"
                    data-testid="code-editor"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 border-l border-slate-700 bg-slate-800/50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                Project History
              </h3>
              <Badge variant="outline" className="text-slate-400 border-slate-600">
                {history.length}/10
              </Badge>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No projects yet</p>
                <p className="text-sm text-slate-500 mt-1">Your HTML projects will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((project) => (
                  <Card key={project.id} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{formatTimestamp(project.timestamp)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFromHistory(project.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-slate-800/80 p-2 rounded text-sm text-slate-300">
                          <span className="text-indigo-400">Prompt:</span> {project.prompt.length > 80
                            ? `${project.prompt.substring(0, 80)}...`
                            : project.prompt}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadFromHistory(project)}
                          className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(project.htmlContent);
                            showFeedback('success', 'HTML copied to clipboard!');
                          }}
                          className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                        >
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([project.htmlContent], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `project-${project.id}.html`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            showFeedback('success', 'Project downloaded!');
                          }}
                          className="text-slate-400 hover:text-white hover:bg-slate-600 text-xs px-2 py-1 h-6"
                        >
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}