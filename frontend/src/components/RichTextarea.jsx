import { useState, useRef, useMemo, useCallback } from 'react';
import {
  SparklesIcon,
  CommandLineIcon,
  TagIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_VARIABLES = [
  { label: 'Contact ID', value: '{{contact.id}}' },
  { label: 'Contact Name', value: '{{contact.name}}' },
  { label: 'Contact First Name', value: '{{contact.firstName}}' },
  { label: 'Contact Last Name', value: '{{contact.lastName}}' },
  { label: 'Contact Email', value: '{{contact.email}}' },
  { label: 'Contact Phone', value: '{{contact.phone}}' },
  { label: 'Lifecycle Stage', value: '{{contact.lifecycleStage}}' },
  { label: 'Agent Name', value: '{{agent.name}}' },
  { label: 'Agent ID', value: '{{agent.id}}' },
  { label: 'Date Today', value: '{{date.today}}' },
  { label: 'Date Time', value: '{{date.now}}' },
  { label: 'Dollar Contact Email', value: '$contact.email' },
  { label: 'Dollar Contact Name', value: '$contact.name' },
];

const TYPE_META = {
  mention: {
    icon: UserGroupIcon,
    title: 'Select Mention',
    empty: 'No matching mentions',
  },
  variable: {
    icon: CommandLineIcon,
    title: 'Select Variable',
    empty: 'No matching variables',
  },
  tag: {
    icon: TagIcon,
    title: 'Select Tag',
    empty: 'No matching tags',
  },
};

const normalizeItems = (items = [], type) => {
  return items
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item, value: item, type };
      }

      const label = item.label || item.name || item.value || '';
      const value = item.value || item.token || label;
      const subtitle = item.subtitle || item.description || item.group || '';
      const searchText = [label, value, subtitle, item.search || '']
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return { label, value, subtitle, type, searchText };
    })
    .filter((item) => item.label && item.value);
};

export default function RichTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  mentions = [],
  tags = [],
  variables = DEFAULT_VARIABLES,
  onOptimize,
  showTags = false,
  showMentions = false,
}) {
  const textareaRef = useRef(null);

  const [suggestion, setSuggestion] = useState(null); // { type, filter, index, start }
  const [picker, setPicker] = useState({ open: false, type: 'variable', query: '', index: 0 });

  const mentionItems = useMemo(() => normalizeItems(mentions, 'mention'), [mentions]);
  const tagItems = useMemo(() => normalizeItems(tags, 'tag'), [tags]);
  const variableItems = useMemo(() => {
    const merged = [...DEFAULT_VARIABLES, ...(variables || [])];
    const seen = new Set();

    return normalizeItems(merged, 'variable').filter((item) => {
      const key = `${item.label}::${item.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [variables]);

  const typeItems = useMemo(() => ({
    mention: mentionItems,
    tag: tagItems,
    variable: variableItems,
  }), [mentionItems, tagItems, variableItems]);

  const pickerTypes = useMemo(() => {
    const types = [];
    if (showMentions) types.push('mention');
    types.push('variable');
    if (showTags) types.push('tag');
    return types;
  }, [showMentions, showTags]);

  const getTriggerInfo = (text, cursorPosition) => {
    const textBeforeCursor = text.substring(0, cursorPosition);

    const variableBraceMatch = textBeforeCursor.match(/\{\{([a-zA-Z0-9_.-]*)$/);
    if (variableBraceMatch) {
      return { type: 'variable', filter: variableBraceMatch[1], start: variableBraceMatch.index };
    }

    const variableDollarMatch = textBeforeCursor.match(/\$([a-zA-Z_][a-zA-Z0-9_.-]*)$/);
    if (variableDollarMatch) {
      return { type: 'variable', filter: variableDollarMatch[1], start: variableDollarMatch.index };
    }

    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.\- ]*)$/);
    if (mentionMatch) {
      return { type: 'mention', filter: mentionMatch[1], start: mentionMatch.index };
    }

    const tagMatch = textBeforeCursor.match(/%([a-zA-Z0-9_.-]*)$/);
    if (tagMatch) {
      return { type: 'tag', filter: tagMatch[1], start: tagMatch.index };
    }

    return null;
  };

  const filterOptions = useCallback((type, rawQuery) => {
    const query = String(rawQuery || '').trim().toLowerCase();
    const list = typeItems[type] || [];

    if (!query) return list;

    return list.filter((item) => {
      if (item.searchText) return item.searchText.includes(query);
      return item.label.toLowerCase().includes(query) || item.value.toLowerCase().includes(query);
    });
  }, [typeItems]);

  const renderHighlightedText = () => {
    if (!value) return null;
    const regex = /(\{\{[^}]+\}\}|\$[a-zA-Z_][a-zA-Z0-9_.-]*|%[a-zA-Z0-9_.-]+|@[a-zA-Z0-9_.\- ]+)/g;
    const parts = value.split(regex);
    
    return parts.map((part, i) => {
      if (part.match(regex)) {
        let label = part;
        let colorClass = 'bg-zinc-500/20 text-zinc-300';
        
        if (part.startsWith('{{') || part.startsWith('$')) {
          colorClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
          const item = typeItems.variable?.find(v => v.value === part);
          if (item) label = item.label;
        } else if (part.startsWith('%')) {
          colorClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
          const item = typeItems.tag?.find(t => t.value === part);
          if (item) label = item.label;
        } else if (part.startsWith('@')) {
          colorClass = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
          const item = typeItems.mention?.find(m => m.value === part);
          if (item) label = item.label;
        }

        return (
          <span key={i} className={`inline-block px-1.5 py-0.5 rounded-md text-xs font-bold mx-0.5 shadow-sm ${colorClass}`}>
            {label}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleInput = (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;

    onChange && onChange(text);

    const info = getTriggerInfo(text, cursor);
    if (info) {
      setSuggestion({ ...info, index: 0 });
      setPicker((prev) => ({ ...prev, open: false }));
      return;
    }

    setSuggestion(null);
  };

  const insertOption = useCallback((optionValue) => {
    if (!textareaRef.current) return;

    const current = value || '';
    const cursor = textareaRef.current.selectionStart;

    let start = cursor;
    let end = cursor;

    if (suggestion) {
      start = suggestion.start;
      end = cursor;
    }

    const nextValue = current.slice(0, start) + optionValue + current.slice(end);
    onChange && onChange(nextValue);

    setSuggestion(null);
    setPicker((prev) => ({ ...prev, open: false, query: '', index: 0 }));

    setTimeout(() => {
      if (!textareaRef.current) return;
      const nextCursor = start + optionValue.length;
      textareaRef.current.focus();
      textareaRef.current.selectionStart = nextCursor;
      textareaRef.current.selectionEnd = nextCursor;
    }, 0);
  }, [onChange, value, suggestion]);

  const suggestionOptions = suggestion ? filterOptions(suggestion.type, suggestion.filter) : [];

  const pickerOptions = useMemo(() => {
    if (!picker.open) return [];
    return filterOptions(picker.type, picker.query);
  }, [picker, filterOptions]);

  const handleKeyDown = (e) => {
    if (suggestion) {
      if (suggestionOptions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestion((prev) => ({ ...prev, index: (prev.index + 1) % suggestionOptions.length }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestion((prev) => ({ ...prev, index: (prev.index - 1 + suggestionOptions.length) % suggestionOptions.length }));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertOption(suggestionOptions[suggestion.index]?.value || suggestionOptions[0].value);
      } else if (e.key === 'Escape') {
        setSuggestion(null);
      }
      return;
    }

    if (!picker.open) return;

    if (e.key === 'ArrowDown' && pickerOptions.length > 0) {
      e.preventDefault();
      setPicker((prev) => ({ ...prev, index: (prev.index + 1) % pickerOptions.length }));
    } else if (e.key === 'ArrowUp' && pickerOptions.length > 0) {
      e.preventDefault();
      setPicker((prev) => ({ ...prev, index: (prev.index - 1 + pickerOptions.length) % pickerOptions.length }));
    } else if ((e.key === 'Enter' || e.key === 'Tab') && pickerOptions.length > 0) {
      e.preventDefault();
      insertOption(pickerOptions[picker.index]?.value || pickerOptions[0].value);
    } else if (e.key === 'Escape') {
      setPicker((prev) => ({ ...prev, open: false, query: '', index: 0 }));
    }
  };

  const openPicker = (type) => {
    const normalizedType = pickerTypes.includes(type) ? type : (pickerTypes[0] || 'variable');
    textareaRef.current?.focus();
    setSuggestion(null);
    setPicker({ open: true, type: normalizedType, query: '', index: 0 });
  };

  const renderOption = (opt, index, isActive, onClick) => (
    <button
      key={`${opt.type}-${opt.value}-${index}`}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 transition-colors ${isActive
        ? 'bg-indigo-500/20 text-indigo-300'
        : 'hover:bg-white/5 text-zinc-300'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold truncate">{opt.label}</span>
        <code className={`text-[10px] shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
          {opt.value}
        </code>
      </div>
      {opt.subtitle && <p className="text-[10px] text-zinc-500 mt-1 truncate">{opt.subtitle}</p>}
    </button>
  );

  return (
    <div className="relative w-full">
      <div className="relative group">
        <div className="relative w-full rounded-xl overflow-hidden border border-white/5 bg-[#0c0c0e]/80 focus-within:border-indigo-500/30 focus-within:bg-zinc-950/90 transition-all">
          {/* Highlight Overlay */}
          <div 
            className="absolute inset-0 p-4 text-sm font-mono leading-relaxed pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-zinc-200"
            aria-hidden="true"
            style={{ 
              top: textareaRef.current ? -textareaRef.current.scrollTop : 0 
            }}
          >
            {!value ? <span className="text-zinc-700">{placeholder}</span> : renderHighlightedText()}
          </div>
          
          <textarea
            ref={textareaRef}
            value={value}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onScroll={(e) => {
              // Force re-render on scroll to sync overlay position
              if (textareaRef.current) {
                e.target.previousSibling.style.top = `-${e.target.scrollTop}px`;
              }
            }}
            onBlur={() => setTimeout(() => setSuggestion(null), 150)}
            rows={rows}
            className="relative w-full p-4 text-sm font-mono leading-relaxed text-transparent bg-transparent caret-white outline-none resize-y custom-scrollbar"
            spellCheck={false}
          />
        </div>

        {suggestion && suggestionOptions.length > 0 && (
          <div className="absolute z-[9999] bottom-full left-0 mb-3 w-[360px] max-w-full bg-[#18181b] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 bg-zinc-950/50 flex items-center gap-2">
              {(() => {
                const Icon = TYPE_META[suggestion.type].icon;
                return <Icon className="h-3 w-3" />;
              })()}
              {TYPE_META[suggestion.type].title}
            </div>
            <div className="max-h-56 overflow-y-auto custom-scrollbar">
              {suggestionOptions.map((opt, index) => {
                const isActive = index === suggestion.index;
                return renderOption(opt, index, isActive, () => insertOption(opt.value));
              })}
            </div>
          </div>
        )}

        {picker.open && (
          <div className="absolute z-[9999] bottom-full left-0 mb-3 w-[420px] max-w-full bg-[#18181b] border border-white/10 rounded-xl shadow-[0_24px_56px_rgba(0,0,0,0.55)] overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-zinc-950/50">
              {pickerTypes.map((type) => {
                const Icon = TYPE_META[type].icon;
                const active = picker.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setPicker((prev) => ({ ...prev, type, index: 0, query: '' }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${active
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-b border-white/5">
              <input
                type="text"
                value={picker.query}
                onChange={(event) => setPicker((prev) => ({ ...prev, query: event.target.value, index: 0 }))}
                placeholder="Search"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              />
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {pickerOptions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-zinc-500">{TYPE_META[picker.type].empty}</p>
              ) : (
                pickerOptions.map((opt, index) => {
                  const isActive = index === picker.index;
                  return renderOption(opt, index, isActive, () => insertOption(opt.value));
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-2">
          {showMentions && (
            <button
              type="button"
              onClick={() => openPicker('mention')}
              className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
              title="Mention Agent/User"
            >
              <UserGroupIcon className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => openPicker('variable')}
            className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
            title="Insert Variable"
          >
            <CommandLineIcon className="h-4 w-4" />
          </button>

          {showTags && (
            <button
              type="button"
              onClick={() => openPicker('tag')}
              className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
              title="Insert Tag"
            >
              <TagIcon className="h-4 w-4" />
            </button>
          )}

          <div className="h-4 w-px bg-white/5 mx-1" />

          <div className="flex items-center gap-1 group cursor-default hover:bg-white/5 rounded-lg px-2 py-1 transition-all">
            <span className="text-[10px] font-black text-zinc-600 group-hover:text-zinc-400 uppercase tracking-widest">Type @, %, {'{{'}, or $</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/help/ai-agents/actions"
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
