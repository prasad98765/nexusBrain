/**
 * Creation Mode Modal
 * 
 * Modal that appears when user clicks "Create" to choose between:
 * 1. Assistant - Simple conversational flow
 * 2. Agent - Advanced autonomous AI agent
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageSquare, Bot, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreationModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMode: (mode: 'assistant' | 'agent') => void;
}

export default function CreationModeModal({ isOpen, onClose, onSelectMode }: CreationModeModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-100">
                        Create New Flow
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Choose the type of flow you want to create
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Assistant Option */}
                    <button
                        onClick={() => onSelectMode('assistant')}
                        className="group relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-lg hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 text-left"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg ring-1 ring-blue-500/30 group-hover:ring-blue-500/50 transition-all">
                                <MessageSquare className="h-8 w-8 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">
                                    Assistant Agent
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    A simple conversational assistant that uses guided flow steps. Best for chat-first experiences, FAQs, simple forms, or linear workflows.
                                </p>
                                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                    <span>Get Started</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Feature badges */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                                Simple Flows
                            </span>
                            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                                Chat-First
                            </span>
                            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                                Linear Workflows
                            </span>
                        </div>
                    </button>

                    {/* Agent Option - Coming Soon */}
                    <div className="relative">
                        <button
                            disabled
                            className="group relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-lg text-left w-full cursor-not-allowed opacity-100 overflow-hidden"
                        >
                            {/* Blur effect */}
                            <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/40 z-10"></div>

                            <div className="flex items-start gap-4 relative">
                                <div className="p-3 bg-purple-500/20 rounded-lg ring-1 ring-purple-500/30 transition-all">
                                    <Bot className="h-8 w-8 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-slate-100 mb-2 transition-colors">
                                        Agent
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                        An advanced, autonomous AI agent with decision-making, tool use, knowledge access, and multi-agent delegation. Best for booking, automation, CRM actions, and complex workflows.
                                    </p>
                                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                                        <span>Get Started</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Feature badges */}
                            <div className="mt-4 flex flex-wrap gap-2 relative">
                                <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400">
                                    Autonomous
                                </span>
                                <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400">
                                    Tool Use
                                </span>
                                <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400">
                                    Multi-Agent
                                </span>
                                <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400">
                                    Complex Workflows
                                </span>
                            </div>
                        </button>

                        {/* Coming Soon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <div className="flex flex-col items-center gap-3 bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-6 w-6 text-purple-400 animate-pulse" />
                                    <span className="text-2xl font-bold text-purple-400">Coming Soon</span>
                                </div>
                                <p className="text-sm text-slate-400 text-center max-w-xs">
                                    Advanced autonomous agents are in development
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
