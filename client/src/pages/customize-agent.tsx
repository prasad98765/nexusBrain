import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, Settings, Palette, Code, Share, Workflow } from 'lucide-react';

interface CustomizeAgentProps {
  agentId?: string;
  onBackClick: () => void;
  onCreateFlow: (agentId: string) => void;
}

export default function CustomizeAgent({ agentId, onBackClick, onCreateFlow }: CustomizeAgentProps) {
  return (
    <div className="min-h-full bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-indigo-400" />
              <h1 className="text-2xl font-bold">Customize Your Web Agent</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-indigo-500 text-indigo-400 hover:bg-indigo-600 hover:text-white"
              onClick={() => agentId && onCreateFlow(agentId)}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Create Flow
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Preview
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save & Deploy
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Left Sidebar - Configuration Options */}
        <aside className="w-80 bg-slate-800/30 border-r border-slate-700 p-6">
          <div className="space-y-6">
            {/* Agent Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                Agent Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Agent Name</label>
                  <input
                    type="text"
                    defaultValue="My Web Agent"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Description</label>
                  <textarea
                    rows={3}
                    defaultValue="A helpful AI assistant for my website visitors."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-400" />
                Appearance
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Theme Color</label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg cursor-pointer border-2 border-indigo-400"></div>
                    <div className="w-8 h-8 bg-blue-500 rounded-lg cursor-pointer border-2 border-transparent hover:border-slate-500"></div>
                    <div className="w-8 h-8 bg-purple-500 rounded-lg cursor-pointer border-2 border-transparent hover:border-slate-500"></div>
                    <div className="w-8 h-8 bg-green-500 rounded-lg cursor-pointer border-2 border-transparent hover:border-slate-500"></div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Position</label>
                  <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none">
                    <option>Bottom Right</option>
                    <option>Bottom Left</option>
                    <option>Center</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Behavior */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400" />
                Behavior
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Auto-greet visitors</span>
                  <input type="checkbox" defaultChecked className="text-indigo-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Show typing indicator</span>
                  <input type="checkbox" defaultChecked className="text-indigo-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Initial Message</label>
                  <textarea
                    rows={2}
                    defaultValue="Hi! How can I help you today?"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Integration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-400" />
                Integration
              </h3>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                <Share className="h-4 w-4 mr-2" />
                Get Embed Code
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-200">Agent Preview</h2>
                <p className="text-slate-400">See how your agent will appear to visitors on your website</p>
              </div>

              {/* Mock Website Preview */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Mock Website Header */}
                <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="ml-4 text-sm text-slate-400">https://yourwebsite.com</div>
                  </div>
                </div>

                {/* Mock Website Content */}
                <div className="relative p-8 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 min-h-[400px]">
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Welcome to Your Website</h1>
                    <p className="text-lg text-slate-600">
                      This is a preview of how your AI agent will appear on your website.
                      The chat widget will be positioned according to your settings.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="font-semibold mb-2">Feature One</h3>
                        <p className="text-slate-600">Sample content for your website.</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="font-semibold mb-2">Feature Two</h3>
                        <p className="text-slate-600">More sample content here.</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Widget Preview */}
                  <div className="absolute bottom-6 right-6">
                    <div className="bg-indigo-600 hover:bg-indigo-700 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-105">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Chat Window Preview (shown expanded) */}
                  <div className="absolute bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bot className="h-5 w-5 text-white" />
                        <span className="text-white font-medium">My Web Agent</span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-3">
                        <Bot className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div className="bg-slate-100 p-3 rounded-lg text-sm">
                          Hi! How can I help you today?
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-indigo-600 text-white p-3 rounded-lg text-sm max-w-xs">
                          Can you tell me about your services?
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span>Agent is typing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}