import { Bot, Construction } from "lucide-react";

interface ComingSoonProps {
    title?: string;
}

export function ComingSoon({ title = "Coming Soon" }: ComingSoonProps) {
    return (
        <div className="absolute inset-0 left-16 top-16 backdrop-blur-md bg-slate-900/50 z-40 flex items-center justify-center">
            <div className="text-center space-y-4 bg-slate-800/90 p-8 rounded-xl border border-slate-700 shadow-2xl transform transition-all">
                <Construction className="w-16 h-16 mx-auto text-indigo-400 animate-pulse" />
                <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
                <p className="text-slate-400">We're working hard to bring you something amazing!</p>
            </div>
        </div>
    );
}
