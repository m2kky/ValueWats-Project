import { useState, useRef } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import RichTextarea from './RichTextarea';

export default function ActionCard({
  title,
  description,
  enabled,
  setEnabled,
  config,
  setConfig,
  placeholder,
  mentions = [],
  tags = [],
  variables = [],
  onOptimize,
  showTags = false,
  showMentions = false,
  children // For extra config fields like chips or dropdowns
}) {
  return (
    <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 relative ${enabled ? 'border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.05)]' : 'border-white/5 opacity-80'}`}>

      {/* Decorative gradient for enabled state */}
      {enabled && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
      )}

      <div className={`flex items-center justify-between ${enabled ? 'mb-4 border-b border-white/5 pb-4' : ''} transition-all`}>
        <div className="flex-1 pr-6 tracking-wide">
          <h3 className={`text-sm font-black uppercase italic tracking-widest ${enabled ? 'text-indigo-400' : 'text-zinc-500'}`}>
            {title}
          </h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 leading-relaxed">
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

          {children}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
              When and how should this action be performed?
            </label>
            <RichTextarea
              value={config || ''}
              onChange={setConfig}
              placeholder={placeholder || "Describe context criteria..."}
              mentions={mentions}
              tags={tags}
              variables={variables}
              onOptimize={onOptimize}
              showTags={showTags}
              showMentions={showMentions}
            />
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

