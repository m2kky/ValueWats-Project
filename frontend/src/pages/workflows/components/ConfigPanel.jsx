import { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getActionMeta, getTriggerMeta, TRIGGER_TYPES } from '../nodeTypes';
import api from '../../../api/client'; // Adjust path if needed

export default function ConfigPanel({ node, nodes = [], onUpdate, onDelete, onClose }) {
  const [config, setConfig] = useState({});
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stages, setStages] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [fields, setFields] = useState([]);

  // Fetch contextual data when panel opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, agentsRes, stagesRes, workflowsRes, fieldsRes] = await Promise.all([
          api.get('/team').catch(() => ({ data: { members: [] } })),
          api.get('/agents').catch(() => ({ data: { agents: [] } })),
          api.get('/chat/lifecycle-stages').catch(() => ({ data: { stages: [] } })),
          api.get('/workflows').catch(() => ({ data: { workflows: [] } })),
          api.get('/contact-fields/definitions').catch(() => ({ data: { fields: [] } }))
        ]);
        if (usersRes.data?.members) setUsers(usersRes.data.members);
        if (agentsRes.data?.agents) setAgents(agentsRes.data.agents);
        if (stagesRes.data?.stages) setStages(stagesRes.data.stages);
        if (workflowsRes.data?.workflows) setWorkflows(workflowsRes.data.workflows);
        if (fieldsRes.data?.fields) setFields(fieldsRes.data.fields);
      } catch (err) {
        console.error('Failed to fetch config panel data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (node) {
      setConfig(node.data?.config || {});
    }
  }, [node?.id, node?.data?.config]);

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
            <div className="mt-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Headers (JSON)</label>
              <textarea
                value={config.headers || ''}
                onChange={(e) => handleSave('headers', e.target.value)}
                placeholder='{"Authorization": "Bearer token..."}'
                rows={3}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/30 placeholder:text-zinc-700 resize-y font-mono"
              />
            </div>
          </>
        )}

        {/* ─── Branch Config ─── */}
        {node.data?.actionType === 'branch' && (
          <div className="space-y-4">
            {(node.data.branches || []).map((branch, index) => (
              <div key={branch.id} className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={branch.label}
                    onChange={(e) => {
                      const newBranches = [...node.data.branches];
                      newBranches[index].label = e.target.value;
                      onUpdate(node.id, { branches: newBranches });
                    }}
                    className="bg-transparent text-sm font-bold text-amber-400 outline-none w-32 border-b border-dashed border-amber-500/30 focus:border-amber-500"
                    placeholder="Branch Name"
                  />
                  <button
                    onClick={() => {
                      const newBranches = node.data.branches.filter((_, i) => i !== index);
                      onUpdate(node.id, { branches: newBranches });
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400"
                    title="Remove branch"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Condition Builder */}
                <div className="space-y-2 mt-2">
                  {(branch.conditions || []).map((cond, cIdx) => (
                    <div key={cIdx} className="space-y-1 p-2 bg-black/40 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Condition {cIdx + 1}</span>
                        <button
                          onClick={() => {
                            const newBranches = [...node.data.branches];
                            newBranches[index].conditions = newBranches[index].conditions.filter((_, i) => i !== cIdx);
                            onUpdate(node.id, { branches: newBranches });
                          }}
                          className="text-zinc-600 hover:text-red-400"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        value={cond.left || ''}
                        onChange={(e) => {
                          const newBranches = [...node.data.branches];
                          newBranches[index].conditions[cIdx].left = e.target.value;
                          onUpdate(node.id, { branches: newBranches });
                        }}
                        placeholder="{{contact.name}} or Text"
                        className="w-full bg-zinc-800/50 border border-white/5 rounded px-2 py-1 text-xs text-zinc-300 outline-none focus:border-amber-500/50 font-mono"
                      />
                      
                      <select
                        value={cond.operator || 'equals'}
                        onChange={(e) => {
                          const newBranches = [...node.data.branches];
                          newBranches[index].conditions[cIdx].operator = e.target.value;
                          onUpdate(node.id, { branches: newBranches });
                        }}
                        className="w-full bg-zinc-800/50 border border-white/5 rounded px-2 py-1 text-xs text-amber-300/80 outline-none focus:border-amber-500/50"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Does not equal</option>
                        <option value="contains">Contains</option>
                        <option value="not_contains">Does not contain</option>
                        <option value="exists">Is set (Exists)</option>
                        <option value="not_exists">Is empty</option>
                        <option value="gt">Greater than</option>
                        <option value="lt">Less than</option>
                      </select>

                      {!['exists', 'not_exists'].includes(cond.operator) && (
                        <input
                          type="text"
                          value={cond.right || ''}
                          onChange={(e) => {
                            const newBranches = [...node.data.branches];
                            newBranches[index].conditions[cIdx].right = e.target.value;
                            onUpdate(node.id, { branches: newBranches });
                          }}
                          placeholder="Value to compare..."
                          className="w-full bg-zinc-800/50 border border-white/5 rounded px-2 py-1 text-xs text-zinc-300 outline-none focus:border-amber-500/50 font-mono"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newBranches = [...node.data.branches];
                      if (!newBranches[index].conditions) newBranches[index].conditions = [];
                      newBranches[index].conditions.push({ left: '', operator: 'equals', right: '' });
                      onUpdate(node.id, { branches: newBranches });
                    }}
                    className="text-[10px] uppercase font-bold tracking-widest text-amber-500/70 hover:text-amber-400 mt-2 block"
                  >
                    + Add Condition
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => {
                const newBranches = [...(node.data.branches || [])];
                const nextNum = newBranches.length + 1;
                newBranches.push({ id: `${node.id}_b${Date.now()}`, label: `Branch ${nextNum}`, conditions: [] });
                onUpdate(node.id, { branches: newBranches });
              }}
              className="w-full py-2 border border-dashed border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              + Add Branch
            </button>
          </div>
        )}

        {/* ─── Assign To Config ─── */}
        {node.data?.actionType === 'assign_to' && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Assign Strategy</label>
              <select
                value={config.assignType || 'user'}
                onChange={(e) => handleSave('assignType', e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                <option value="user">Specific User</option>
                <option value="ai_agent">AI Agent</option>
              </select>
            </div>
            
            {/* Dynamic Dropdown based on Assign Strategy */}
            {config.assignType === 'user' && (
              <div className="mt-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Select User</label>
                <select
                  value={config.userId || ''}
                  onChange={(e) => handleSave('userId', e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
                >
                  <option value="" disabled>Choose a user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            
            {config.assignType === 'ai_agent' && (
              <div className="mt-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Select AI Agent</label>
                <select
                  value={config.agentId || ''}
                  onChange={(e) => handleSave('agentId', e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
                >
                  <option value="" disabled>Choose an AI agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* ─── AI Agent Handoff Config ─── */}
        {node.data?.actionType === 'ai_agent' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Select AI Agent</label>
            <select
              value={config.agentId || ''}
              onChange={(e) => handleSave('agentId', e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
            >
              <option value="" disabled>Choose an AI agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ─── Update Lifecycle Config ─── */}
        {node.data?.actionType === 'update_lifecycle' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">New Lifecycle Stage</label>
            <select
              value={config.stageId || ''}
              onChange={(e) => handleSave('stageId', e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
            >
              <option value="" disabled>Select stage...</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ─── Update Contact Field Config ─── */}
        {node.data?.actionType === 'update_field' && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Field</label>
              <select
                value={config.field || ''}
                onChange={(e) => handleSave('field', e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              >
                <option value="" disabled>Select a field...</option>
                <optgroup label="Standard Fields">
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                </optgroup>
                <optgroup label="Custom Fields">
                  {fields.map((f) => (
                    <option key={f.key} value={`custom.${f.key}`}>{f.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => handleSave('value', e.target.value)}
                placeholder="New value (supports variables like {{contact.name}})"
                className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
              />
            </div>
          </>
        )}

        {/* ─── Update Tag Config ─── */}
        {node.data?.actionType === 'update_tag' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Tag Name</label>
            <input
              type="text"
              value={config.tag || ''}
              onChange={(e) => handleSave('tag', e.target.value)}
              placeholder="e.g. vip, support, sales"
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
            />
          </div>
        )}

        {/* ─── Add Comment / Close Conversation Config ─── */}
        {(node.data?.actionType === 'add_comment' || node.data?.actionType === 'close_conversation') && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
              {node.data.actionType === 'add_comment' ? 'Internal Note' : 'Closing Summary (Optional)'}
            </label>
            <textarea
              value={config.comment || ''}
              onChange={(e) => handleSave('comment', e.target.value)}
              placeholder="Add your note here..."
              rows={4}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 resize-y"
            />
          </div>
        )}

        {/* ─── Trigger Workflow Config ─── */}
        {node.data?.actionType === 'trigger_workflow' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Select Workflow</label>
            <select
              value={config.workflowId || ''}
              onChange={(e) => handleSave('workflowId', e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
            >
              <option value="" disabled>Choose a workflow...</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ─── Jump To Config ─── */}
        {node.data?.actionType === 'jump_to' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Select Target Step</label>
            <select
              value={config.targetNodeId || ''}
              onChange={(e) => handleSave('targetNodeId', e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30"
            >
              <option value="" disabled>Choose a step to jump to...</option>
              {nodes
                .filter(n => n.id !== node.id) // Can't jump to self
                .map((n) => (
                <option key={n.id} value={n.id}>{n.data?.label || n.data?.actionType || n.type} ({n.id})</option>
              ))}
            </select>
          </div>
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
