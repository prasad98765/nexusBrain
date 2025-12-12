import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Static Fallback UI - No 3D to avoid errors
const StaticAidosVisualization = () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-2xl backdrop-blur-sm relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0">
            <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000 top-1/4 left-1/4" />
            <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000 bottom-1/4 right-1/4" />
        </div>

        <div className="text-center p-8 relative z-10">
            {/* Central Core */}
            <div className="relative mx-auto mb-8">
                <div className="w-40 h-40 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full mx-auto animate-pulse flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-full animate-spin-slow" />
                </div>
                {/* Orbital rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-cyan-500/20 rounded-full animate-spin-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-500/20 rounded-full animate-spin-slower" />
            </div>

            <h3 className="text-white font-bold text-2xl mb-3 animate-fade-in">AIDOS Core</h3>
            <p className="text-base text-slate-300 mb-6 animate-fade-in animation-delay-300">The Intelligent Orchestrator</p>

            {/* Component badges */}
            <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
                {[
                    { label: 'Assistants', color: 'green', delay: '100ms' },
                    { label: 'Agents', color: 'purple', delay: '100ms' },
                    { label: 'Workflows', color: 'indigo', delay: '200ms' },
                    { label: 'Tools & RAG', color: 'pink', delay: '300ms' }
                ].map((item) => (
                    <div
                        key={item.label}
                        className="bg-slate-900/80 rounded-xl p-4 border border-gradient-to-r hover:scale-105 transition-transform duration-300 animate-fade-in"
                        style={{
                            animationDelay: item.delay,
                            borderColor: `var(--${item.color}-700)`
                        }}
                    >
                        <div className={`w-3 h-3 bg-${item.color}-500 rounded-full mx-auto mb-2 animate-pulse`} />
                        <p className="text-sm text-slate-300 font-medium">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Main Component - Using static visualization
export const NeuralAidosCanvas: React.FC = () => {
    return <StaticAidosVisualization />;
};

export default NeuralAidosCanvas;
