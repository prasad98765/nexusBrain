import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bot, Send } from 'lucide-react';

interface AISearchDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AISearchDrawer({ isOpen, onClose }: AISearchDrawerProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setQuery('');
        // Simulate AI API call
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: `AI Response for: "${prev[prev.length - 1].text}"` }]);
            setLoading(false);
        }, 1500);
    };

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="bg-slate-900 border-slate-700 max-w-lg mx-auto">
                <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2 text-white">
                        <Bot className="h-5 w-5 text-indigo-400" /> AI Search
                    </DrawerTitle>
                    <div className="text-slate-400 text-sm mt-1">Ask questions about your contacts. Powered by AI.</div>
                </DrawerHeader>
                <div className="flex flex-col h-[70vh] bg-slate-950/80 rounded-xl shadow-inner">
                    {/* Chat messages area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 mt-8">Ask anything about your contacts...</div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    {msg.role === 'user' ? (
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">U</div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-md">
                                            <Bot className="h-5 w-5 text-indigo-400" />
                                        </div>
                                    )}
                                    {/* Bubble */}
                                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-base shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex items-end gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-md">
                                        <Bot className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div className="max-w-[70%] px-4 py-3 rounded-2xl text-base shadow-lg bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700 flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        AI is thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Input area at bottom */}
                    <form className="p-4 border-t border-slate-700 flex gap-2 bg-slate-900" onSubmit={e => { e.preventDefault(); handleSearch(); }}>
                        <Textarea
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Type your question..."
                            rows={1}
                            className="flex-1 resize-none bg-slate-800 border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 rounded-xl"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
