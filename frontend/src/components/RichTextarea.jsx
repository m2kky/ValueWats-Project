import { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon, CommandLineIcon, TagIcon, UserGroupIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const DEFAULT_VARIABLES = [
    { label: 'Contact Name', value: '{{contact.name}}' },
    { label: 'Phone Number', value: '{{contact.phone}}' },
    { label: 'User ID', value: '{{contact.id}}' },
    { label: 'Lifecycle Stage', value: '{{contact.lifecycleStage}}' },
    { label: 'Agent Name', value: '{{agent.name}}' },
    { label: 'Date', value: '{{date.today}}' },
];

export default function RichTextarea({
    value,
    onChange,
    placeholder,
    rows = 4,
    mentions = [], // array of { label, value }
    tags = [],     // array of { label, value }
    variables = DEFAULT_VARIABLES,
    onOptimize,
    showTags = false,
    showMentions = false,
}) {
    const [suggestion, setSuggestion] = useState(null); // { type, filter, index, x, y }
    const textareaRef = useRef(null);
    const containerRef = useRef(null);

    const getTriggerInfo = (text, cursorPosition) => {
        const textBeforeCursor = text.substring(0, cursorPosition);

        // Check for Mentions (@)
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
        if (mentionMatch) return { type: 'mention', filter: mentionMatch[1], start: mentionMatch.index };

        // Check for Tags (%)
        const tagMatch = textBeforeCursor.match(/%(\w*)$/);
        if (tagMatch) return { type: 'tag', filter: tagMatch[1], start: tagMatch.index };

        // Check for Variables ({{)
        const varMatch = textBeforeCursor.match(/\{\{([\w.]*)$/);
        if (varMatch) return { type: 'variable', filter: varMatch[1], start: varMatch.index };

        return null;
    };

    const handleInput = (e) => {
        const text = e.target.value;
        const cursor = e.target.selectionStart;
        onChange && onChange(text);

        const info = getTriggerInfo(text, cursor);
        if (info) {
            // For simplicity, we'll show the popup near the bottom of the textarea or fixed for now
            // In a real premium app, we'd use a caret-position library, but we'll start with 
            // a clean floating list at the bottom of the container.
            setSuggestion({ ...info, index: 0 });
        } else {
            setSuggestion(null);
        }
    };

    const insertOption = useCallback((optionValue, triggerType) => {
        if (!textareaRef.current) return;

        const text = value || '';
        const cursor = textareaRef.current.selectionStart;
        const info = getTriggerInfo(text, cursor);

        if (!info) return;

        const start = info.start;
        const end = cursor;

        const newText = text.substring(0, start) + optionValue + text.substring(end);
        onChange && onChange(newText);
        setSuggestion(null);

        // Reposition cursor
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = start + optionValue.length;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
                textareaRef.current.focus();
            }
        }, 10);
    }, [value, onChange]);

    const handleKeyDown = (e) => {
        if (!suggestion) return;

        const options = getFilteredOptions();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestion(s => ({ ...s, index: (s.index + 1) % options.length }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestion(s => ({ ...s, index: (s.index - 1 + options.length) % options.length }));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (options.length > 0) {
                e.preventDefault();
                insertOption(options[suggestion.index].value, suggestion.type);
            }
        } else if (e.key === 'Escape') {
            setSuggestion(null);
        }
    };

    const getFilteredOptions = () => {
        if (!suggestion) return [];
        let list = [];
        if (suggestion.type === 'mention') list = mentions;
        if (suggestion.type === 'tag') list = tags;
        if (suggestion.type === 'variable') list = variables;

        return list.filter(item =>
            item.label.toLowerCase().includes(suggestion.filter.toLowerCase()) ||
            item.value.toLowerCase().includes(suggestion.filter.toLowerCase())
        );
    };

    const filteredOptions = getFilteredOptions();

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative group">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setTimeout(() => setSuggestion(null), 200)}
                    rows={rows}
                    className="w-full bg-[#0c0c0e]/80 border border-white/5 rounded-xl p-4 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 focus:bg-zinc-950/90 transition-all font-mono leading-relaxed custom-scrollbar placeholder:text-zinc-700 resize-y"
                    placeholder={placeholder}
                />

                {/* Floating Suggestions */}
                {suggestion && filteredOptions.length > 0 && (
                    <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 bg-zinc-950/50 flex items-center gap-2">
                            {suggestion.type === 'mention' && <UserGroupIcon className="h-3 w-3" />}
                            {suggestion.type === 'tag' && <TagIcon className="h-3 w-3" />}
                            {suggestion.type === 'variable' && <CommandLineIcon className="h-3 w-3" />}
                            Suggestions
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                                    onClick={() => insertOption(opt.value, suggestion.type)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between group ${i === suggestion.index ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-zinc-400'
                                        }`}
                                >
                                    <span className="font-bold">{opt.label}</span>
                                    <code className={`text-[10px] opacity-70 ${i === suggestion.index ? 'text-indigo-400' : 'text-zinc-600'}`}>
                                        {opt.value}
                                    </code>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-2">
                    {showMentions && (
                        <button
                            type="button"
                            onClick={() => { textareaRef.current?.focus(); handleInput({ target: { value: value + '@', selectionStart: value.length + 1 } }); }}
                            className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Mention Agent/Team"
                        >
                            <UserGroupIcon className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { textareaRef.current?.focus(); handleInput({ target: { value: value + '{{', selectionStart: value.length + 2 } }); }}
                        className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Insert Variable"
                    >
                        <CommandLineIcon className="h-4 w-4" />
                    </button>
                    {showTags && (
                        <button
                            type="button"
                            onClick={() => { textareaRef.current?.focus(); handleInput({ target: { value: value + '%', selectionStart: value.length + 1 } }); }}
                            className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Insert Tag"
                        >
                            <TagIcon className="h-4 w-4" />
                        </button>
                    )}

                    <div className="h-4 w-px bg-white/5 mx-1"></div>

                    <div className="flex items-center gap-1 group cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1 transition-all">
                        <span className="text-[10px] font-black text-zinc-600 group-hover:text-zinc-400 uppercase tracking-widest">Add prompt templates</span>
                        <svg className="w-2.5 h-2.5 text-zinc-600 group-hover:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="https://respond.io/help/ai-agent-actions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-zinc-600 hover:text-indigo-400 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                    >
                        <QuestionMarkCircleIcon className="h-3 w-3" />
                        Learn how to write this
                    </a>

                    <button
                        type="button"
                        onClick={onOptimize}
                        className="text-[10px] font-black text-indigo-400/60 hover:text-indigo-400 flex items-center gap-1.5 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                        <SparklesIcon className="h-3.5 w-3.5" />
                        Optimize
                    </button>
                </div>
            </div>
        </div>
    );
}
