import { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getActionMeta, getTriggerMeta, TRIGGER_TYPES } from '../nodeTypes';

export default function ConfigPanel({ node, onUpdate, onDelete, onClose }) {
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (node) {
      setConfig(node.data?.config || {});
    }
  }, [node?.id]);

  if (!node) return null;

  const isTrigger = node.type === 'trigger';
  const meta = isTrigger ? getTriggerMeta(node.data?.triggerType) : getActionMeta(node.data?.actionType);
  const Icon = meta.icon;
  const color = isTrigger ? '#f43f5e' : (meta.color || '#6366f1');

  const handleSave = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(node.id, { config: newConfig });
  };

  return (
    <div className="w-[360px] shrink-0 bg-[#0c0c0e] border-l border-white/5 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-zinc-200 truncate">{meta.label}</h3>
          <p className="text-[10px] text-zinc-500">{meta.description || 'Configure this step'}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Config Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* ─── Trigger Config ─── */}
        {isTrigger && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Trigger Type</label>
              <select
                value={node.data?.triggerType || 'conversation_opened'}
                onChange={(e) => onUpdate(node.id, { triggerType: e.target.value })}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                {TRIGGER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Description</label>
              <input
                type="text"
                value={node.data?.description || ''}
                onChange={(e) => onUpdate(node.id, { description: e.target.value })}
                placeholder="Optional description..."
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700"
              />
            </div>
          </>
        )}

        {/* ─── Send Message Config ─── */}
        {node.data?.actionType === 'send_message' && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Channel</label>
              <select
                value={config.channel || 'last_interacted'}
                onChange={(e) => handleSave('channel', e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                <option value="last_interacted">Last Interacted Channel</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="messenger">Messenger</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Message Content</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => handleSave('message', e.target.value)}
                placeholder="Type your message... Use {{contact.name}} for variables"
                rows={4}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700 resize-y"
              />
            </div>
          </>
        )}

        {/* ─── Ask Question Config ─── */}
        {node.data?.actionType === 'ask_question' && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Question Text</label>
              <textarea
                value={config.question || ''}
                onChange={(e) => handleSave('question', e.target.value)}
                placeholder="What would you like to ask?"
                rows={3}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700 resize-y"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Save Reply To</label>
              <input
                type="text"
                value={config.saveToVariable || ''}
                onChange={(e) => handleSave('saveToVariable', e.target.value)}
                placeholder="e.g. {{contact.email}}"
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Validation</label>
              <select
                value={config.validation || 'none'}
                onChange={(e) => handleSave('validation', e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                <option value="none">No validation</option>
                <option value="email">Must be email</option>
                <option value="phone">Must be phone number</option>
                <option value="number">Must be a number</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Timeout (minutes)</label>
              <input
                type="number"
                value={config.timeoutMinutes || 60}
                onChange={(e) => handleSave('timeoutMinutes', parseInt(e.target.value) || 60)}
                min={1}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              />
            </div>
          </>
        )}

        {/* ─── Wait Config ─── */}
        {node.data?.actionType === 'wait' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Duration</label>
              <input
                type="number"
                value={config.duration || 5}
                onChange={(e) => handleSave('duration', parseInt(e.target.value) || 5)}
                min={1}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Unit</label>
              <select
                value={config.unit || 'minutes'}
                onChange={(e) => handleSave('unit', e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

        {/* ─── HTTP Request Config ─── */}
        {node.data?.actionType === 'http_request' && (
          <>
            <div className="flex gap-3">
              <div className="w-24">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Method</label>
                <select
                  value={config.method || 'GET'}
                  onChange={(e) => handleSave('method', e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">URL</label>
                <input
                  type="text"
                  value={config.url || ''}
                  onChange={(e) => handleSave('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700 font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Request Body (JSON)</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => handleSave('body', e.target.value)}
                placeholder='{"key": "{{contact.name}}"}'
                rows={4}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700 resize-y font-mono"
              />
            </div>
          </>
        )}

        {/* ─── Branch Config ─── */}
        {node.data?.actionType === 'branch' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              Configure branches in the node inspector. Each branch can have multiple conditions based on contact fields, tags, or variables.
            </p>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-[11px] text-amber-400/80">
                <strong>Tip:</strong> An "Else" branch is automatically added as a fallback for unmatched conditions.
              </p>
            </div>
          </div>
        )}

        {/* ─── Assign To Config ─── */}
        {node.data?.actionType === 'assign_to' && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Assign To</label>
              <select
                value={config.assignType || 'user'}
                onChange={(e) => handleSave('assignType', e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                <option value="user">Specific User</option>
                <option value="team">Team (Round Robin)</option>
                <option value="ai_agent">AI Agent</option>
              </select>
            </div>
          </>
        )}

        {/* ─── Generic Label for all node types ─── */}
        {!isTrigger && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Step Label</label>
            <input
              type="text"
              value={node.data?.label || ''}
              onChange={(e) => onUpdate(node.id, { label: e.target.value })}
              placeholder={meta.label}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700"
            />
          </div>
        )}
      </div>

      {/* Footer — Delete */}
      {!isTrigger && (
        <div className="px-4 py-3 border-t border-white/5">
          <button
            onClick={() => onDelete(node.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-xs font-bold"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Step
          </button>
        </div>
      )}
    </div>
  );
}
