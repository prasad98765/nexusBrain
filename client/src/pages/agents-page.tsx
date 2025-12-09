export default function AgentsPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Agents</h1>
                    <p className="text-slate-400 mt-1">Intelligent agents for autonomous task execution</p>
                </div>
            </div>

            {/* Placeholder content */}
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">⚡</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Agents</h2>
                    <p className="text-slate-400 max-w-md">
                        Autonomous AI agents are coming soon. Build intelligent agents with advanced capabilities.
                    </p>
                </div>
            </div>
        </div>
    );
}
