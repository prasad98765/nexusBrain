import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';

interface Variable {
    id: string;
    name: string;
    description: string;
    format: string;
}

interface VariableInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function VariableInput({ value, onChange, placeholder, className }: VariableInputProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [menuPosition, setMenuPosition] = useState({ top: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const variableStartIndex = useRef<number>(-1);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch variables
    useEffect(() => {
        const fetchVariables = async () => {
            try {
                const response = await apiClient.get('/api/variables?limit=100');
                const data = await response.json();
                setVariables(data.variables || []);
            } catch (err) {
                console.error('Failed to fetch variables:', err);
            }
        };
        fetchVariables();
    }, []);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        const cursorPosition = e.target.selectionStart || 0;
        const textBeforeCursor = newValue.substring(0, cursorPosition);
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');

        if (lastHashIndex !== -1) {
            const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);

            // Only show menu if there's no space after #
            if (!textAfterHash.includes(' ')) {
                setSearchTerm(textAfterHash);
                variableStartIndex.current = lastHashIndex;

                // Filter variables
                const search = textAfterHash.toLowerCase();
                const filtered = variables.filter(v =>
                    v.name.toLowerCase().includes(search) ||
                    v.description.toLowerCase().includes(search)
                );
                setFilteredVariables(filtered);

                // Calculate cursor position within input for accurate dropdown placement
                if (inputRef.current) {
                    const input = inputRef.current;
                    const rect = input.getBoundingClientRect();

                    // Create a temporary span to measure text width up to cursor
                    const span = document.createElement('span');
                    const computedStyle = window.getComputedStyle(input);

                    // Copy input styles to span for accurate measurement
                    span.style.position = 'absolute';
                    span.style.visibility = 'hidden';
                    span.style.whiteSpace = 'pre';
                    span.style.font = computedStyle.font;
                    span.style.padding = computedStyle.padding;
                    span.style.border = computedStyle.border;

                    // Set text up to cursor position
                    span.textContent = textBeforeCursor;
                    document.body.appendChild(span);

                    // Get width of text before cursor
                    const textWidth = span.getBoundingClientRect().width;
                    document.body.removeChild(span);

                    // Calculate horizontal position
                    // Add padding-left from computed style
                    const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
                    let leftPosition = rect.left + paddingLeft + textWidth;

                    // Ensure dropdown doesn't go off-screen on the right
                    const dropdownWidth = 320; // w-80 = 320px
                    const viewportWidth = window.innerWidth;
                    if (leftPosition + dropdownWidth > viewportWidth) {
                        leftPosition = viewportWidth - dropdownWidth - 10;
                    }

                    setMenuPosition({
                        top: rect.bottom + 4,
                        // left: leftPosition
                    });
                }

                setShowMenu(true);
                setSelectedIndex(0);
            } else {
                setShowMenu(false);
            }
        } else {
            setShowMenu(false);
        }
    };

    // Insert variable
    const insertVariable = (variable: Variable) => {
        if (!inputRef.current || variableStartIndex.current === -1) return;

        const cursorPosition = inputRef.current.selectionStart || 0;
        const beforeHash = value.substring(0, variableStartIndex.current);
        const afterCursor = value.substring(cursorPosition);

        const newValue = `${beforeHash}#{${variable.name}} ${afterCursor}`;
        onChange(newValue);

        setShowMenu(false);
        variableStartIndex.current = -1;

        // Set cursor position after variable
        setTimeout(() => {
            if (inputRef.current) {
                const newPosition = variableStartIndex.current + variable.name.length + 4; // +4 for #{} and space
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showMenu) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < filteredVariables.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && filteredVariables.length > 0) {
            e.preventDefault();
            insertVariable(filteredVariables[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowMenu(false);
        }
    };

    // Close menu when clicking outside or update position on scroll
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showMenu && !inputRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        const updatePosition = (e: Event) => {
            if (showMenu && inputRef.current) {
                // Check if scroll is happening inside the dropdown menu
                if (menuRef.current && menuRef.current.contains(e.target as Node)) {
                    // Ignore scroll events from within the dropdown
                    return;
                }

                const input = inputRef.current;
                const rect = input.getBoundingClientRect();

                // Create a temporary span to measure text width up to cursor
                const span = document.createElement('span');
                const computedStyle = window.getComputedStyle(input);

                // Copy input styles to span for accurate measurement
                span.style.position = 'absolute';
                span.style.visibility = 'hidden';
                span.style.whiteSpace = 'pre';
                span.style.font = computedStyle.font;
                span.style.padding = computedStyle.padding;
                span.style.border = computedStyle.border;

                // Get current cursor position
                const cursorPosition = input.selectionStart || 0;
                const textBeforeCursor = input.value.substring(0, cursorPosition);

                // Set text up to cursor position
                span.textContent = textBeforeCursor;
                document.body.appendChild(span);

                // Get width of text before cursor
                const textWidth = span.getBoundingClientRect().width;
                document.body.removeChild(span);

                // Calculate horizontal position
                const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
                let leftPosition = rect.left + paddingLeft + textWidth;

                // Ensure dropdown doesn't go off-screen on the right
                const dropdownWidth = 320;
                const viewportWidth = window.innerWidth;
                if (leftPosition + dropdownWidth > viewportWidth) {
                    leftPosition = viewportWidth - dropdownWidth - 10;
                }

                setMenuPosition({
                    top: rect.bottom + 4,
                    // left: leftPosition
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        // Update position on scroll to keep dropdown aligned with input
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [showMenu]);

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn("bg-[#0f1419] border-gray-700 text-gray-200", className)}
            />

            {/* Variable Autocomplete Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="fixed bg-[#0f1419] border border-gray-700/50 rounded-lg shadow-2xl w-80 max-h-64 overflow-y-auto z-[9999]"
                    style={{
                        top: `${menuPosition.top}px`,
                        // left: `${menuPosition.left}px`,
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {filteredVariables.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No variables found
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredVariables.map((variable, index) => (
                                <div
                                    key={variable.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertVariable(variable);
                                    }}
                                    className={cn(
                                        "px-3 py-2 cursor-pointer transition-colors",
                                        index === selectedIndex
                                            ? "bg-blue-600/20 border-l-2 border-blue-500"
                                            : "hover:bg-[#1a1f2e]/60"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-200 truncate">
                                                {variable.name}
                                            </div>
                                            {/* {variable.description && (
                                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                                    {variable.description}
                                                </div>
                                            )} */}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400 flex-shrink-0">
                                            {variable.format}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
