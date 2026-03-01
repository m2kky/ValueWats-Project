import { useState, useRef } from 'react';
import { Switch } from '@headlessui/react';
import { SparklesIcon, CommandLineIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const VARIABLES = [
  { label: 'Contact Name', value: '{{contact.name}}' },
  { label: 'Phone Number', value: '{{contact.phone}}' },
  { label: 'User ID', value: '{{contact.id}}' },
  { label: 'Lifecycle Stage', value: '{{contact.lifecycleStage}}' },
  { label: 'Agent Name', value: '{{agent.name}}' },
  { label: 'Date', value: '{{date.today}}' },
];

export default function ActionCard({
  title,
  description,
  enabled,
  setEnabled,
  config,
  setConfig,
  placeholder
}) {
  const [showVariables, setShowVariables] = useState(false);
  const textareaRef = useRef(null);

  const insertVariable = (variable) => {
    if (!textareaRef.current) return;

    // Fallback if config is undefined when trying to substring
    const currentConfig = config || '';
    const start = textareaRef.current.selectionStart || currentConfig.length;
    const end = textareaRef.current.selectionEnd || currentConfig.length;

    const newText = currentConfig.substring(0, start) + variable + currentConfig.substring(end);

    // Safely update config if setter exists
    if (setConfig) {
      setConfig(newText);
    }

    setShowVariables(false);

    // Reset cursor position after a tick to let react re-render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + variable.length;
        textareaRef.current.focus();
      }
    }, 10);
  };

  return (
    <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 relative overflow-hidden ${enabled ? 'border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.05)]' : 'border-white/5 opacity-80'}`}>

      {/* Decorative gradient for enabled state */}
      {enabled && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
      )}

      <div className={`flex items-center justify-between ${enabled ? 'mb-4 border-b border-white/5 pb-4' : ''} transition-all`}>
        <div className="flex-1 pr-6 tracking-wide">
          <h3 className={`text-sm font-black uppercase italic tracking-widest ${enabled ? 'text-indigo-400' : 'text-zinc-500'}`}>
            {title}
          </h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${enabled ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-zinc-800'
            }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${enabled ? 'translate-x-[22px]' : 'translate-x-1'
            }`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex justify-between items-end mt-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
              When and how should this action be performed?
            </label>
            <button className="text-[10px] font-bold text-indigo-400/50 hover:text-indigo-400 flex items-center gap-1 uppercase tracking-widest transition-colors">
              <SparklesIcon className="h-3 w-3" /> Optimize
            </button>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={config || ''}
              onChange={(e) => setConfig && setConfig(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 focus:bg-zinc-900/60 transition-all font-mono custom-scrollbar resize-y"
              placeholder={placeholder || "Describe context criteria..."}
            />

            <div className="absolute top-2 right-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVariables(!showVariables)}
                  className="p-1.5 text-zinc-500 hover:text-indigo-400 bg-zinc-950/80 border border-white/10 rounded-lg hover:border-indigo-500/30 transition-all"
                  title="Insert Variable"
                >
                  <CommandLineIcon className="h-4 w-4" />
                </button>

                {showVariables && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                    <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 bg-zinc-950/50">
                      Inject Variable
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {VARIABLES.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => insertVariable(v.value)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-500/10 transition-colors flex items-center justify-between group"
                        >
                          <span className="font-bold text-zinc-300 group-hover:text-indigo-300">{v.label}</span>
                          <code className="text-[10px] text-zinc-600 group-hover:text-indigo-500 opacity-75">{v.value}</code>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
            <InformationCircleIcon className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest leading-relaxed">
              The agent will intelligently decide when to trigger this based on your instructions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
