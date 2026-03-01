import { useState, useEffect, useRef } from 'react';
import useAgents from '../hooks/useAgents';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  CpuChipIcon,
  SparklesIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import ActionCard from '../components/ActionCard';

// ─── Template metadata (emoji + descriptions) ───
const templateMeta = {
  receptionist: {
    emoji: '👋',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 border-violet-200',
    description: 'Greets visitors, answers FAQs, and routes conversations to the right team.',
  },
  sales: {
    emoji: '🛍️',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 border-emerald-200',
    description: 'Qualifies leads, presents products, and guides customers through the sales funnel.',
  },
  support: {
    emoji: '🛠️',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 border-blue-200',
    description: 'Handles technical issues, troubleshoots problems, and escalates when needed.',
  },
};

const toneOptions = [
  { value: 'professional', label: '💼 Professional' },
  { value: 'friendly', label: '😊 Friendly' },
  { value: 'casual', label: '🤙 Casual' },
  { value: 'formal', label: '🎩 Formal' },
];

const defaultForm = {
  name: '',
  description: '',
  instructions: '',
  templateType: 'custom',
  tone: 'professional',
  responseStyle: 'concise',
  temperature: 0.7,
  maxTokens: 500,
  greeting: '',
  useHistory: true,
  historyLength: 10,
  followUpEnabled: false,
  followUpDelay: 300,
  followUpMessage: '',
  workingHoursEnabled: false,
  workingHours: null,
  outOfHoursMessage: '',
  isActive: true,
  priority: 0,
  aiModel: 'deepseek-chat',

  // Phase 4: Groups & Actions
  allowGroupResponse: false,
  allowedGroups: [], // as array
  allowedGroupsText: '', // for textarea input
  actionConfig: {},
};

export default function Agents() {
  const {
    agents, templates, loading, saving,
    fetchAgents, fetchAgent, createAgent, updateAgent,
    deleteAgent, fetchTemplates,
    testChat, toggleAgent,
    knowledgeSources, knowledgeLoading,
    fetchKnowledge, addTextKnowledge, uploadFileKnowledge, deleteKnowledge,
  } = useAgents();

  // Views: 'list' | 'templates' | 'editor'
  const [view, setView] = useState('list');
  const [form, setForm] = useState({ ...defaultForm });
  const [editingId, setEditingId] = useState(null);

  // Test Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // editorTab removed — all sections on single page

  const [kbMode, setKbMode] = useState(null); // null | 'text' | 'file'
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [kbFile, setKbFile] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Handlers ───

  const handleCreateNew = () => {
    fetchTemplates();
    setView('templates');
  };

  const handleSelectTemplate = async (templateName) => {
    const t = templates[templateName];
    if (t) {
      setForm({
        ...defaultForm,
        ...t,
        templateType: templateName,
      });
    } else {
      setForm({ ...defaultForm });
    }
    setEditingId(null);
    setChatMessages([]);
    setView('editor');
  };

  const handleCustomCreate = () => {
    setForm({ ...defaultForm });
    setEditingId(null);
    setChatMessages([]);
    setView('editor');
  };

  const handleEdit = async (agent) => {
    const full = await fetchAgent(agent.id);
    if (full) {
      setForm({
        name: full.name || '',
        description: full.description || '',
        instructions: full.instructions || '',
        templateType: full.templateType || 'custom',
        tone: full.tone || 'professional',
        responseStyle: full.responseStyle || 'concise',
        temperature: full.temperature ?? 0.7,
        maxTokens: full.maxTokens ?? 500,
        greeting: full.greeting || '',
        useHistory: full.useHistory ?? true,
        historyLength: full.historyLength ?? 10,
        followUpEnabled: full.followUpEnabled ?? false,
        followUpDelay: full.followUpDelay ?? 300,
        followUpMessage: full.followUpMessage || '',
        workingHoursEnabled: full.workingHoursEnabled ?? false,
        workingHours: full.workingHours,
        outOfHoursMessage: full.outOfHoursMessage || '',
        isActive: full.isActive ?? true,
        priority: full.priority ?? 0,
        aiModel: full.aiModel || full.model || 'deepseek-chat',

        // Phase 4
        allowGroupResponse: full.allowGroupResponse ?? false,
        allowedGroups: full.allowedGroups || [],
        allowedGroupsText: (full.allowedGroups || []).join('\n'),
        actionConfig: full.actionConfig || {},
      });
      setEditingId(full.id);
      setChatMessages([]);
      if (full.id) fetchKnowledge(full.id);
      setView('editor');
    }
  };

  const handleSave = async () => {
    const data = {
      ...form,
      priority: Number(form.priority),
      temperature: Number(form.temperature),
      maxTokens: Number(form.maxTokens),
      followUpDelay: Number(form.followUpDelay),
      allowedGroups: form.allowedGroupsText.split('\n').map(g => g.trim()).filter(g => g),
    };
    delete data.allowedGroupsText; // don't send to API

    let result;
    if (editingId) {
      result = await updateAgent(editingId, data);
    } else {
      result = await createAgent({ ...data });
    }
    if (result) {
      await fetchAgents();
      setView('list');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    await deleteAgent(id);
  };

  const handleToggle = async (agent) => {
    await toggleAgent(agent.id, agent.isActive);
  };

  const handleSendTest = async () => {
    if (!chatInput.trim() || !editingId) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await testChat(editingId, userMsg);
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.response || res.message || 'No response' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error getting response' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // VIEW: TEMPLATES GALLERY
  // ═══════════════════════════════════════════════════
  if (view === 'templates') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Agents
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h1>
          <p className="text-gray-500 text-lg">Start with a pre-configured agent or create your own from scratch.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(templateMeta).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => handleSelectTemplate(key)}
              disabled={saving}
              className="group card border hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-1"
            >
              <div className="p-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {meta.emoji}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">{key}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{meta.description}</p>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                  Use Template
                  <SparklesIcon className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Agent Card */}
        <div className="text-center">
          <button
            onClick={handleCustomCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Create Custom Agent
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // VIEW: AGENT EDITOR (Split Layout)
  // ═══════════════════════════════════════════════════
  if (view === 'editor') {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-zinc-950/60 backdrop-blur-2xl border-b border-white/5 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setView('list'); fetchAgents(); }}
              className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight italic uppercase">
                {editingId ? 'MODULE CONFIGURATION' : 'INITIALIZE MODULE'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(71,37,244,0.5)]"></span>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {form.templateType !== 'custom' ? `PRE-BUILT: ${form.templateType}` : 'REBOOT SYSTEM'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setView('list'); fetchAgents(); }}
              className="px-5 py-2 text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
            >
              ABORT
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.instructions}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-6 py-2.5 rounded-xl text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
            >
              {saving ? 'UPLOADING...' : editingId ? 'DEPLOY MODULE' : 'INITIALIZE'}
            </button>
          </div>
        </div>

        {/* Split Content */}
        <div className="flex flex-1 overflow-hidden bg-zinc-950/20">
          {/* ─── LEFT PANEL: All Sections (Single Page) ─── */}
          <div className="w-3/5 overflow-y-auto border-r border-white/5 custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Agent Name + Description */}
              <div className="glass-card p-6 border border-white/5 group bg-zinc-900/40">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(71,37,244,0.5)]"></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest italic">MODULE IDENTITY</h3>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">Callsign *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      placeholder="e.g. VANTAGE PROTOCOL"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">Objective</label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-medium"
                        placeholder="Directive summary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">Neutral Greeting</label>
                      <input
                        type="text"
                        value={form.greeting}
                        onChange={e => setForm({ ...form, greeting: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-medium"
                        placeholder="Awaiting input..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="glass-card p-6 border border-white/5 bg-zinc-900/40">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                  <div className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest italic">LOGIC DIRECTIVES *</h3>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
                  <textarea
                    value={form.instructions}
                    onChange={e => setForm({ ...form, instructions: e.target.value })}
                    rows={12}
                    className="relative w-full bg-[#0c0c0e] border border-white/5 rounded-xl p-5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-mono leading-relaxed custom-scrollbar"
                    placeholder={`# ROLE\nYou are a high-level enterprise strategist...\n\n# PARAMETERS\n- Maintain total professionalism\n- Analyze user intent before responding`}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  <SparklesIcon className="w-3 h-3 text-indigo-400" />
                  Higher precision yields superior results
                </div>
              </div>

              {/* Settings */}
              <div className="glass-card p-6 border border-white/5 bg-zinc-900/40">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest italic">BEHAVIORAL PARAMETERS</h3>
                </div>

                <div className="space-y-8">
                  {/* Tone & Style */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Neural Tone</label>
                      <select
                        value={form.tone}
                        onChange={e => setForm({ ...form, tone: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-bold cursor-pointer"
                      >
                        {toneOptions.map(t => (
                          <option key={t.value} value={t.value} className="bg-zinc-900 text-white">{t.label.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Response Verbosity</label>
                      <select
                        value={form.responseStyle}
                        onChange={e => setForm({ ...form, responseStyle: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-bold cursor-pointer"
                      >
                        <option value="concise" className="bg-zinc-900">CONCISE</option>
                        <option value="detailed" className="bg-zinc-900">DETAILED</option>
                        <option value="conversational" className="bg-zinc-900">CONVERSATIONAL</option>
                      </select>
                    </div>
                  </div>

                  {/* Temperature + Max Tokens */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entropy (Temp)</label>
                        <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{form.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={form.temperature}
                        onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                        <span>Precision</span>
                        <span>Creativity</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Token Cap</label>
                      <input
                        type="number"
                        value={form.maxTokens}
                        onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) || 500 })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-mono"
                        min={50}
                        max={4000}
                      />
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Process Priority</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={form.priority}
                        onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all w-32 font-mono"
                        min={0}
                      />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase italic">Higher values receive routing preference</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Chat Control (Phase 4) */}
              <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 ${form.allowGroupResponse ? 'border-indigo-500/30' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full shadow-[0_0_8px_rgba(71,37,244,0.5)] transition-colors ${form.allowGroupResponse ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4 text-indigo-400" /> MULTI-CHANNEL SYNC
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, allowGroupResponse: !form.allowGroupResponse })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.allowGroupResponse ? 'bg-indigo-600 shadow-[0_0_15px_rgba(71,37,244,0.4)]' : 'bg-zinc-800'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${form.allowGroupResponse ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
                {form.allowGroupResponse && (
                  <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex gap-3">
                      <span className="text-indigo-400">⚡</span>
                      <span>HYPER-VOLUME MODE: ENSURE WHITELIST COMPLIANCE TO PREVENT BUFFER OVERFLOW</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Allowed Channel IDs (JIDS)</label>
                      <textarea
                        value={form.allowedGroupsText}
                        onChange={e => setForm({ ...form, allowedGroupsText: e.target.value })}
                        rows={3}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/30 transition-all font-mono custom-scrollbar"
                        placeholder={`123456789@g.us\n987654321@g.us`}
                      />
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Enter one Group JID per line. Empty = Global Unrestricted (NOT RECOMMENDED)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow Up */}
              <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 ${form.followUpEnabled ? 'border-amber-500/30' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-colors ${form.followUpEnabled ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-amber-500" /> RETENTION AUTOMATION
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, followUpEnabled: !form.followUpEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.followUpEnabled ? 'bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-zinc-800'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${form.followUpEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
                {form.followUpEnabled && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Activation Delay (SEC)</label>
                        <input
                          type="number"
                          value={form.followUpDelay}
                          onChange={e => setForm({ ...form, followUpDelay: parseInt(e.target.value) || 300 })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/30 transition-all font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Retention Script</label>
                      <textarea
                        value={form.followUpMessage}
                        onChange={e => setForm({ ...form, followUpMessage: e.target.value })}
                        rows={2}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/30 transition-all font-medium italic"
                        placeholder="Is there anything else optimal to address?"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 ${form.workingHoursEnabled ? 'border-rose-500/30' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-colors ${form.workingHoursEnabled ? 'bg-rose-500' : 'bg-zinc-700'}`}></div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                      <ShieldCheckIcon className="h-4 w-4 text-rose-500" /> OPERATIONAL WINDOWS
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, workingHoursEnabled: !form.workingHoursEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.workingHoursEnabled ? 'bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-zinc-800'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${form.workingHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
                {form.workingHoursEnabled && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Offline Deflection Script</label>
                      <textarea
                        value={form.outOfHoursMessage}
                        onChange={e => setForm({ ...form, outOfHoursMessage: e.target.value })}
                        rows={2}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-500/30 transition-all font-medium italic"
                        placeholder="Module currently in cold storage. Response expected during operational peak."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ═══ SYNAPTIC CAPABILITIES (Actions) ═══ */}
              <div className="space-y-8">
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 flex gap-4 backdrop-blur-sm shadow-[0_0_20px_rgba(71,37,244,0.05)]">
                  <SparklesIcon className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest italic">SYNAPTIC CAPABILITIES</h4>
                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest leading-relaxed">
                      DEFINE NEURAL TRIGGERS AND EXTERNAL INTERFACING RULES. AGENT WILL EXECUTE THESE ACTIONS BASED ON PROBABILISTIC INTENT ANALYSIS.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <ActionCard
                    title="TERMINATE SESSION"
                    description="ALLOW MODULE TO CLOSE CONVERSATIONS UPON OBJECTIVE COMPLETION."
                    enabled={form.actionConfig?.closeConversation?.enabled || false}
                    setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, closeConversation: { ...f.actionConfig.closeConversation, enabled: val } } }))}
                    config={form.actionConfig?.closeConversation?.instructions || ''}
                    setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, closeConversation: { ...f.actionConfig.closeConversation, instructions: val } } }))}
                    placeholder="CRITERIA: USER SIGN-OFF, RESOLVED QUERY, OR END-OF-FLOW..."
                  />

                  <ActionCard
                    title="ROUTING PROTOCOL"
                    description="ENABLE HAND-OFF TO HUMAN OPERATORS OR SPECIALIZED SUB-MODULES."
                    enabled={form.actionConfig?.assignAgent?.enabled || false}
                    setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, assignAgent: { ...f.actionConfig.assignAgent, enabled: val } } }))}
                    config={form.actionConfig?.assignAgent?.instructions || ''}
                    setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, assignAgent: { ...f.actionConfig.assignAgent, instructions: val } } }))}
                    placeholder="IF: TECHNICAL ANOMALY DETECTED -> ROUTE TO SUPPORT_TIER_2..."
                  />

                  <ActionCard
                    title="IDENTITY INDEXING"
                    description="EXTRACT ENTITIES AND UPDATE CONTACT METADATA IN REAL-TIME."
                    enabled={form.actionConfig?.updateFields?.enabled || false}
                    setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateFields: { ...f.actionConfig.updateFields, enabled: val } } }))}
                    config={form.actionConfig?.updateFields?.instructions || ''}
                    setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateFields: { ...f.actionConfig.updateFields, instructions: val } } }))}
                    placeholder="FIELDS TO SYNC: EMAIL, PHONE_ORIGIN, CORPORATE_ID..."
                  />

                  <ActionCard
                    title="STAGE TRANSITION"
                    description="AUTONOMOUSLY SHIFT CONTACTS THROUGH THE CONVERSION PIPELINE."
                    enabled={form.actionConfig?.updateLifecycle?.enabled || false}
                    setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateLifecycle: { ...f.actionConfig.updateLifecycle, enabled: val } } }))}
                    config={form.actionConfig?.updateLifecycle?.instructions || ''}
                    setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateLifecycle: { ...f.actionConfig.updateLifecycle, instructions: val } } }))}
                    placeholder="UPON HIGH_INTENT DETECTION -> TRIGGER STAGE: QUALIFIED_LEAD..."
                  />

                  <ActionCard
                    title="WORKFLOW INJECTION"
                    description="TRIGGER EXTERNAL AUTOMATION CHAINS (WEBHOOKS/ZAPIER)."
                    enabled={form.actionConfig?.triggerWorkflow?.enabled || false}
                    setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, triggerWorkflow: { ...f.actionConfig.triggerWorkflow, enabled: val } } }))}
                    config={form.actionConfig?.triggerWorkflow?.instructions || ''}
                    placeholder="POST-ONBOARDING: TRIGGER GOOGLE_SHEET_APPEND..."
                  />
                </div>
              </div>

              {/* ═══ NEURAL INDEXING (Knowledge Base) ═══ */}
              <div className="space-y-8">
                {/* Add Knowledge Buttons */}
                {!kbMode && (
                  <div className="glass-card p-6 border border-white/5 bg-zinc-900/40">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                      <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest italic">NEURAL INDEXING</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <button
                        onClick={() => setKbMode('text')}
                        className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group active:scale-95"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(71,37,244,0.1)]">
                          <DocumentTextIcon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="text-center">
                          <span className="block text-xs font-black text-white uppercase tracking-widest mb-1">STRING INPUT</span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">PASTE RAW DIRECTIVES OR FAQS</span>
                        </div>
                      </button>

                      <label className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group cursor-pointer active:scale-95">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.txt,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) setKbFile(file);
                            setKbMode('file');
                          }}
                        />
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                          <CloudArrowUpIcon className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div className="text-center">
                          <span className="block text-xs font-black text-white uppercase tracking-widest mb-1">DATA INJECTION</span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">UPLOAD PDF OR TEXT CORPUS</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Knowledge Form: Text */}
                {kbMode === 'text' && (
                  <div className="glass-card p-6 border border-white/5 bg-zinc-900/40 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">STRING BUFFER</h4>
                      <button onClick={() => setKbMode(null)} className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">ABORT_STREAM</button>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="DATA_TITLE"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500/40"
                        value={kbTitle}
                        onChange={e => setKbTitle(e.target.value)}
                      />
                      <textarea
                        placeholder="RAW_CONTENT_STREAM..."
                        rows={6}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-medium text-white outline-none focus:border-indigo-500/40 custom-scrollbar"
                        value={kbContent}
                        onChange={e => setKbContent(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          addTextKnowledge(editingId, { title: kbTitle, content: kbContent });
                          setKbMode(null);
                          setKbTitle('');
                          setKbContent('');
                        }}
                        disabled={!kbTitle || !kbContent || knowledgeLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        {knowledgeLoading ? 'VECTORIZING...' : 'INJECT KERNEL'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Knowledge Form: File */}
                {kbMode === 'file' && (
                  <div className="glass-card p-6 border border-white/5 bg-zinc-900/40 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">DATA PACKET READY</h4>
                      <button onClick={() => { setKbMode(null); setKbFile(null); }} className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">ABORT_UPLOAD</button>
                    </div>
                    <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 bg-white/5">
                      <DocumentIcon className="h-10 w-10 text-emerald-400/40" />
                      <div className="text-center">
                        <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{kbFile?.name}</p>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{(kbFile?.size / 1024).toFixed(1)} KB READY FOR INJECTION</p>
                      </div>
                      <button
                        onClick={() => {
                          uploadFileKnowledge(editingId, kbFile);
                          setKbMode(null);
                          setKbFile(null);
                        }}
                        disabled={knowledgeLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all mt-4"
                      >
                        {knowledgeLoading ? 'VECTORIZING...' : 'INJECT KERNEL'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Knowledge Sources List */}
                <div className="glass-card border border-white/5 bg-zinc-900/40 divide-y divide-white/5">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-zinc-500 rounded-full"></div>
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">
                        NEURAL KERNELS ({knowledgeSources.length})
                      </h3>
                    </div>
                    {editingId && (
                      <button
                        onClick={() => fetchKnowledge(editingId)}
                        className="p-1 text-zinc-500 hover:text-white transition-colors"
                        title="Refresh"
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${knowledgeLoading ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    {knowledgeLoading && knowledgeSources.length === 0 ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
                      </div>
                    ) : knowledgeSources.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                        <BookOpenIcon className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">ZERO KERNELS DETECTED</p>
                        <p className="text-[8px] font-bold text-zinc-700 mt-1 uppercase tracking-tighter">INJECT DATA SOURCES TO ENABLE RAG CAPABILITIES</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {knowledgeSources.map(source => (
                          <div key={source.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${source.sourceType === 'file'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                {source.sourceType === 'file' ? '📄' : '📝'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate uppercase tracking-tight">{source.title}</p>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                                  {source.sourceType} • {Number(source.chunkCount) || 1} SECTORS
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteKnowledge(editingId, source.id)}
                              className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Purge"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ─── RIGHT PANEL: Live Test Chat ─── */}
          <div className="w-2/5 flex flex-col bg-[#08080a]">
            {/* Chat Header */}
            < div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl" >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-[10px] bg-[#0c0c0e] flex items-center justify-center">
                      <CpuChipIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0c0c0e] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest italic truncate max-w-[150px]">
                    {form.name || 'UNNAMED_ENTITY'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">PREVIEW_MODE</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse border border-red-500/50"></div>
                <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">STAGING</span>
              </div>
            </div >

            {/* Chat Messages */}
            < div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(71,37,244,0.03),transparent)]" >
              {
                chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-500/40" />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">NEURAL LINK STANDBY</h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter leading-relaxed">
                      DEPLOY MODULE OR SAVE ASSETS TO INITIALIZE LIVE INTERFACING PROTOCOL.
                    </p>
                  </div>
                )
              }
              {
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`relative max-w-[85%] px-5 py-3.5 text-xs font-medium leading-relaxed
                    ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-indigo-500/10 border border-indigo-400/20'
                        : 'bg-[#121215] border border-white/5 text-zinc-300 rounded-2xl rounded-tl-none'
                      }`}>
                      {msg.role === 'assistant' && (
                        <div className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center">
                          <CpuChipIcon className="w-2 h-2 text-indigo-400" />
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))
              }
              {
                chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#121215] border border-white/5 rounded-2xl rounded-tl-none px-5 py-4">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )
              }
              <div ref={chatEndRef} />
            </div >

            {/* Chat Input */}
            < div className="p-6 border-t border-white/5 bg-zinc-950/40 backdrop-blur-xl" >
              <div className="relative group">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendTest()}
                  disabled={!editingId || chatLoading}
                  placeholder={editingId ? 'SEND COMMAND...' : 'SAVE MODULE TO TEST'}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-xs font-bold text-white outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-zinc-700"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!editingId || chatLoading || !chatInput.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <PaperAirplaneIcon className="h-4 w-4 text-white" />
                </button>
              </div>
              {
                chatMessages.length > 0 && (
                  <button
                    onClick={() => setChatMessages([])}
                    className="mt-4 px-3 py-1.5 rounded-lg text-[9px] font-black text-zinc-600 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] transition-all flex items-center gap-2 mx-auto"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Flush Neural Link
                  </button>
                )
              }
            </div >
          </div >
        </div >
      </div >
    );
  }

  // ═══════════════════════════════════════════════════
  // VIEW: AGENTS LIST (default)
  // ═══════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]"></div>
            <CpuChipIcon className="h-8 w-8 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              NEURAL <span className="text-indigo-500">LAB</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              Core System Management • {agents.length || 0} Modules Active
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl text-xs font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-95 overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          <PlusIcon className="h-5 w-5 relative z-10" />
          <span className="relative z-10">INITIALIZE NEW MODULE</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scanning Neural Network...</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="glass-card text-center py-24 border border-white/5 bg-zinc-900/40">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
              <CpuChipIcon className="h-10 w-10 text-zinc-800" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3">SYSTEM VACUUM</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">
              NO ACTIVE NEURAL ENTITIES DETECTED. INITIALIZE A PROTOCOL TO COMMENCE OPERATIONS.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-10 inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest border border-white/5 transition-all active:scale-95"
            >
              <SparklesIcon className="h-5 w-5 text-indigo-400" />
              BEGIN INITIALIZATION
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => {
              const meta = templateMeta[agent.templateType] || {};
              return (
                <div key={agent.id} className="glass-card group hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-1 bg-zinc-900/40 overflow-hidden relative border border-white/5 flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-6 flex gap-2 child-opacity-0 group-hover:child-opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(agent); }}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      title="RECONFIGURE"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(agent.id); }}
                      className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="PURGE"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-8 pb-0">
                    <div className="flex items-start gap-5 mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg relative ${meta.color
                        ? `bg-gradient-to-br ${meta.color}`
                        : 'bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10'
                        }`}>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{meta.emoji || '👾'}</span>
                      </div>
                      <div className="min-w-0 pr-12">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-xl font-black text-white truncate uppercase italic tracking-tighter leading-none">{agent.name}</h3>
                          {agent.templateType && agent.templateType !== 'custom' && (
                            <span className="inline-flex text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] py-0.5 border-b border-indigo-500/20 w-fit">
                              {agent.templateType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                        <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">CONVERSATIONS</span>
                        <span className="text-sm font-black text-white">{agent._count?.conversations || 0}</span>
                      </div>
                      <div className="p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                        <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">PRIORITY_RANK</span>
                        <span className="text-sm font-black text-white italic">LVL_{agent.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto p-8 pt-0 border-t border-white/5 bg-zinc-950/20 flex items-center justify-between group/status h-20">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">MODULE_STATUS</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${agent.isActive ? 'text-green-500' : 'text-zinc-600'}`}>
                          {agent.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(agent)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${agent.isActive
                        ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                        : 'bg-zinc-800'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${agent.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
