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
} from '@heroicons/react/24/outline';

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

  // Active tab in editor
  const [editorTab, setEditorTab] = useState('config');

  // Knowledge Base UI state
  const [kbMode, setKbMode] = useState(null); // null | 'text' | 'file'
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [kbFile, setKbFile] = useState(null);
  const fileInputRef = useRef(null);

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
    setEditorTab('config');
    setView('editor');
  };

  const handleCustomCreate = () => {
    setForm({ ...defaultForm });
    setEditingId(null);
    setChatMessages([]);
    setEditorTab('config');
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
      });
      setEditingId(full.id);
      setChatMessages([]);
      setEditorTab('config');
      setView('editor');
    }
  };

  const handleSave = async () => {
    let result;
    if (editingId) {
      result = await updateAgent(editingId, form);
    } else {
      result = await createAgent({ ...form });
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

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
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
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('list'); fetchAgents(); }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Agent' : 'Create Agent'}
              </h2>
              <p className="text-xs text-gray-400">
                {form.templateType !== 'custom' && `Template: ${form.templateType}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('list'); fetchAgents(); }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.instructions}
              className="btn-primary text-sm"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </div>

        {/* Split Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── LEFT PANEL: Configuration ─── */}
          <div className="w-3/5 overflow-y-auto border-r border-gray-200 bg-gray-50/50">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
              {[
                { id: 'config', label: 'Configuration', icon: Cog6ToothIcon },
                { id: 'knowledge', label: 'Knowledge', icon: BookOpenIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setEditorTab(tab.id);
                    if (tab.id === 'knowledge' && editingId) fetchKnowledge(editingId);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    editorTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {editorTab === 'config' ? (
                <>
                  {/* Agent Name + Description */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-sm font-semibold text-gray-700">Basic Info</h3>
                    </div>
                    <div className="card-body space-y-4">
                      <div>
                        <label className="input-label">Agent Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="input"
                          placeholder="e.g. Sales Agent"
                        />
                      </div>
                      <div>
                        <label className="input-label">Description</label>
                        <input
                          type="text"
                          value={form.description}
                          onChange={e => setForm({ ...form, description: e.target.value })}
                          className="input"
                          placeholder="Brief description of what this agent does"
                        />
                      </div>
                      <div>
                        <label className="input-label">Greeting Message</label>
                        <input
                          type="text"
                          value={form.greeting}
                          onChange={e => setForm({ ...form, greeting: e.target.value })}
                          className="input"
                          placeholder="Hi! How can I help you today?"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-sm font-semibold text-gray-700">Instructions *</h3>
                    </div>
                    <div className="card-body">
                      <textarea
                        value={form.instructions}
                        onChange={e => setForm({ ...form, instructions: e.target.value })}
                        rows={10}
                        className="input font-mono text-sm"
                        placeholder={`Role & Personality:\nYou are a helpful assistant...\n\nBehavior Rules:\n- Always be polite\n- Ask clarifying questions\n\nKnowledge:\n- Product info, FAQs, etc.`}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Define the agent's role, behavior, and knowledge. Be specific for best results.
                      </p>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-sm font-semibold text-gray-700">⚙️ Settings</h3>
                    </div>
                    <div className="card-body space-y-5">
                      {/* Tone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="input-label">Tone</label>
                          <select
                            value={form.tone}
                            onChange={e => setForm({ ...form, tone: e.target.value })}
                            className="input"
                          >
                            {toneOptions.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="input-label">Response Style</label>
                          <select
                            value={form.responseStyle}
                            onChange={e => setForm({ ...form, responseStyle: e.target.value })}
                            className="input"
                          >
                            <option value="concise">Concise</option>
                            <option value="detailed">Detailed</option>
                            <option value="conversational">Conversational</option>
                          </select>
                        </div>
                      </div>

                      {/* Temperature + Max Tokens */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="input-label">
                            Temperature: <span className="text-blue-600 font-mono">{form.temperature}</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={form.temperature}
                            onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Precise</span>
                            <span>Creative</span>
                          </div>
                        </div>
                        <div>
                          <label className="input-label">Max Tokens</label>
                          <input
                            type="number"
                            value={form.maxTokens}
                            onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) || 500 })}
                            className="input"
                            min={50}
                            max={4000}
                          />
                        </div>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="input-label">Priority (higher = preferred)</label>
                        <input
                          type="number"
                          value={form.priority}
                          onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                          className="input w-32"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Follow Up */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-sm font-semibold text-gray-700">🔔 Follow Up</h3>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, followUpEnabled: !form.followUpEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          form.followUpEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          form.followUpEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    {form.followUpEnabled && (
                      <div className="card-body space-y-4">
                        <div>
                          <label className="input-label">Delay (seconds)</label>
                          <input
                            type="number"
                            value={form.followUpDelay}
                            onChange={e => setForm({ ...form, followUpDelay: parseInt(e.target.value) || 300 })}
                            className="input w-32"
                          />
                        </div>
                        <div>
                          <label className="input-label">Follow-up Message</label>
                          <textarea
                            value={form.followUpMessage}
                            onChange={e => setForm({ ...form, followUpMessage: e.target.value })}
                            rows={2}
                            className="input"
                            placeholder="Is there anything else I can help you with?"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Working Hours */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-sm font-semibold text-gray-700">🕐 Working Hours</h3>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, workingHoursEnabled: !form.workingHoursEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          form.workingHoursEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          form.workingHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    {form.workingHoursEnabled && (
                      <div className="card-body space-y-4">
                        <div>
                          <label className="input-label">Out-of-Hours Message</label>
                          <textarea
                            value={form.outOfHoursMessage}
                            onChange={e => setForm({ ...form, outOfHoursMessage: e.target.value })}
                            rows={2}
                            className="input"
                            placeholder="We're currently offline. We'll get back to you during business hours."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ─── Knowledge Base Tab ─── */
                <div className="space-y-4">
                  {/* Add Knowledge Buttons */}
                  {!kbMode && (
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-sm font-semibold text-gray-700">📚 Add Knowledge</h3>
                      </div>
                      <div className="card-body">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setKbMode('text')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-gray-500 hover:text-blue-600"
                          >
                            <DocumentTextIcon className="h-8 w-8" />
                            <span className="text-sm font-medium">Add Text</span>
                            <span className="text-xs text-gray-400">Paste FAQ, docs, or custom content</span>
                          </button>
                          <button
                            onClick={() => { setKbMode('file'); fileInputRef.current?.click(); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-gray-500 hover:text-emerald-600"
                          >
                            <DocumentArrowUpIcon className="h-8 w-8" />
                            <span className="text-sm font-medium">Upload File</span>
                            <span className="text-xs text-gray-400">PDF, TXT, or Markdown files</span>
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt,.md"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file && editingId) {
                              setKbFile(file);
                              await uploadFileKnowledge(editingId, file);
                              setKbFile(null);
                              setKbMode(null);
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Add Text Form */}
                  {kbMode === 'text' && (
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-sm font-semibold text-gray-700">📝 Add Text Knowledge</h3>
                        <button onClick={() => { setKbMode(null); setKbTitle(''); setKbContent(''); }} className="text-gray-400 hover:text-gray-600">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="card-body space-y-3">
                        <div>
                          <label className="input-label">Title *</label>
                          <input
                            type="text"
                            value={kbTitle}
                            onChange={e => setKbTitle(e.target.value)}
                            className="input"
                            placeholder="e.g. Product FAQ, Company Info"
                          />
                        </div>
                        <div>
                          <label className="input-label">Content *</label>
                          <textarea
                            value={kbContent}
                            onChange={e => setKbContent(e.target.value)}
                            rows={8}
                            className="input font-mono text-sm"
                            placeholder="Paste your text content here...\n\nThis will be chunked and embedded for RAG search."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setKbMode(null); setKbTitle(''); setKbContent(''); }} className="btn-secondary text-sm">
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (kbTitle && kbContent && editingId) {
                                await addTextKnowledge(editingId, { title: kbTitle, content: kbContent });
                                setKbTitle('');
                                setKbContent('');
                                setKbMode(null);
                              }
                            }}
                            disabled={!kbTitle || !kbContent || knowledgeLoading}
                            className="btn-primary text-sm"
                          >
                            {knowledgeLoading ? 'Processing...' : 'Add Knowledge'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {kbMode === 'file' && kbFile && knowledgeLoading && (
                    <div className="card">
                      <div className="card-body text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">Processing {kbFile.name}...</p>
                        <p className="text-xs text-gray-400 mt-1">Extracting text, chunking, and generating embeddings</p>
                      </div>
                    </div>
                  )}

                  {/* Knowledge Sources List */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-sm font-semibold text-gray-700">
                        📖 Knowledge Sources ({knowledgeSources.length})
                      </h3>
                      {editingId && (
                        <button
                          onClick={() => fetchKnowledge(editingId)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Refresh"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${knowledgeLoading ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="card-body">
                      {knowledgeLoading && knowledgeSources.length === 0 ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        </div>
                      ) : knowledgeSources.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpenIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No knowledge sources yet</p>
                          <p className="text-xs text-gray-300 mt-1">Add text or upload files above</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {knowledgeSources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                                  source.sourceType === 'file'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {source.sourceType === 'file' ? '📄' : '📝'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">{source.title}</p>
                                  <p className="text-xs text-gray-400">
                                    {source.sourceType} · {Number(source.chunkCount) || 1} chunk{Number(source.chunkCount) !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteKnowledge(editingId, source.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                title="Delete"
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
              )}
            </div>
          </div>

          {/* ─── RIGHT PANEL: Live Test Chat ─── */}
          <div className="w-2/5 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <CpuChipIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {form.name || 'Test Agent'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingId ? 'Live Preview' : 'Save first to test'}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1">
                    {editingId ? 'Type a message below to test your agent' : 'Save the agent first to start testing'}
                  </p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendTest()}
                  disabled={!editingId || chatLoading}
                  placeholder={editingId ? 'Type a test message...' : 'Save agent first'}
                  className="input flex-1"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!editingId || chatLoading || !chatInput.trim()}
                  className="btn-primary px-3"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setChatMessages([])}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1"
                >
                  <ArrowPathIcon className="h-3 w-3" />
                  Clear chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // VIEW: AGENTS LIST (default)
  // ═══════════════════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-500 mt-1">Manage your AI-powered conversation agents</p>
        </div>
        <button onClick={handleCreateNew} className="btn-primary gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Agent
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && agents.length === 0 && (
        <div className="card text-center py-16">
          <CpuChipIcon className="h-16 w-16 text-gray-200 mx-auto mb-5" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No agents yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Create your first AI agent to automate conversations. Choose from templates or build one from scratch.
          </p>
          <button onClick={handleCreateNew} className="btn-primary gap-2">
            <SparklesIcon className="h-5 w-5" />
            Create Your First Agent
          </button>
        </div>
      )}

      {/* Agents Grid */}
      {!loading && agents.length > 0 && (
        <div className="grid gap-4">
          {agents.map(agent => {
            const meta = templateMeta[agent.templateType] || {};
            return (
              <div key={agent.id} className="card hover:shadow-md transition-all duration-200">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    {/* Left: Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        meta.color
                          ? `bg-gradient-to-br ${meta.color} shadow-lg`
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        {meta.emoji || '🤖'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{agent.name}</h3>
                          {agent.templateType && agent.templateType !== 'custom' && (
                            <span className={`badge ${meta.bgLight || 'bg-gray-100 text-gray-600'} text-xs border`}>
                              {agent.templateType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {formatDate(agent.createdAt)}
                          </span>
                          {agent._count && (
                            <span>
                              {agent._count.conversations || 0} conversations
                            </span>
                          )}
                          <span>Priority: {agent.priority}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggle(agent)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          agent.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={agent.isActive ? 'Active' : 'Inactive'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          agent.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <span className={`text-xs font-medium w-14 ${agent.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(agent)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
