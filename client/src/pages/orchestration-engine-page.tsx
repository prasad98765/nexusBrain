import { Network, Bot, Workflow, ArrowRight } from 'lucide-react';

export default function OrchestrationEnginePage() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Orchestration Engine</h1>
                    <p className="text-slate-400 mt-1">Central control system for managing agents and flows</p>
                </div>
            </div>

            {/* Coming Soon Content */}
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="max-w-2xl w-full">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                            <Network className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Orchestration Engine</h2>
                        <p className="text-slate-300 text-lg mb-2">
                            Coming Soon
                        </p>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            A powerful orchestration layer that connects and coordinates your agents and flows for seamless automation.
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg ring-1 ring-orange-500/30">
                                    <Bot className="h-6 w-6 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">Agent Control</h3>
                                    <p className="text-sm text-slate-400">
                                        Centrally manage and coordinate multiple AI agents
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg ring-1 ring-orange-500/30">
                                    <Workflow className="h-6 w-6 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">Flow Orchestration</h3>
                                    <p className="text-sm text-slate-400">
                                        Connect and execute complex workflow sequences
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg ring-1 ring-orange-500/30">
                                    <Network className="h-6 w-6 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">Smart Routing</h3>
                                    <p className="text-sm text-slate-400">
                                        Intelligent routing between agents and flows
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg ring-1 ring-orange-500/30">
                                    <ArrowRight className="h-6 w-6 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">Real-time Monitoring</h3>
                                    <p className="text-sm text-slate-400">
                                        Track and monitor execution in real-time
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                        <p className="text-sm text-slate-300 text-center">
                            <span className="font-semibold text-orange-400">Note:</span> The Orchestration Engine will serve as the central hub,
                            connecting your agents and flows to create powerful automation workflows.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
