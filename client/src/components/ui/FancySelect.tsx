import React, { useState, useRef, useEffect } from 'react';

interface FancySelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface FancySelectProps {
    options: FancySelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function FancySelect({ options, value, onChange, placeholder, className }: FancySelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className || ''}`} ref={ref}>
            <button
                type="button"
                className="w-full flex items-center justify-between p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:bg-slate-700 transition-all"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="flex items-center gap-2">
                    {selected?.icon}
                    {selected?.label || placeholder}
                </span>
                <svg className="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute z-10 mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in">
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-indigo-600/20 transition-all ${value === opt.value ? 'bg-indigo-600/10' : ''}`}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                        >
                            <span className="text-lg">{opt.icon}</span>
                            <span className="text-white">{opt.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
