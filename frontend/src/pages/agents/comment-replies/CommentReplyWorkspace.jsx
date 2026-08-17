import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../../api/client';

const tabs = ['Overview', 'Comment AI', 'Reply Rules', 'Post Overrides', 'Test Lab'];
const emptyRule = {
  id: null,
  name: '',
  priority: 10,
  matchMode: 'contains_any',
  keywords: '',
  sharedReplies: '',
  facebookReplies: '',
  instagramReplies: '',
  isEnabled: true
};

function splitLines(value) {
  return String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function ruleToDraft(rule) {
  const variants = rule.variants || [];
  return {
    id: rule.id,
    name: rule.name,
    priority: rule.priority,
    matchMode: rule.matchMode,
    keywords: (rule.keywords || []).join('\n'),
    sharedReplies: variants.filter((item) => !item.platform).map((item) => item.body).join('\n'),
    facebookReplies: variants.filter((item) => item.platform === 'facebook').map((item) => item.body).join('\n'),
    instagramReplies: variants.filter((item) => item.platform === 'instagram').map((item) => item.body).join('\n'),
    isEnabled: rule.isEnabled
  };
}

function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().trim();
}

function previewRule(rules, text, platform) {
  const input = normalize(text);
  const matched = [...rules]
    .filter((rule) => rule.isEnabled)
    .sort((a, b) => a.priority - b.priority)
    .find((rule) => {
      const keywords = (rule.keywords || []).map(normalize);
      if (rule.matchMode === 'exact') return keywords.includes(input);
      if (rule.matchMode === 'contains_all') return keywords.every((keyword) => input.includes(keyword));
      return keywords.some((keyword) => input.includes(keyword));
    });
  if (!matched) return null;
  const platformReplies = matched.variants.filter((item) => item.isEnabled && item.platform === platform);
  const sharedReplies = matched.variants.filter((item) => item.isEnabled && !item.platform);
  return { rule: matched, variant: platformReplies[0] || sharedReplies[0] || null };
}

function Metric({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${accent ? 'text-lime-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function CommentReplyWorkspace() {
  const { agentId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [instances, setInstances] = useState([]);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [ruleDraft, setRuleDraft] = useState(emptyRule);
  const [overrideDraft, setOverrideDraft] = useState({ bindingId: '', externalPostId: '', postName: '', mode: 'disabled' });
  const [testInput, setTestInput] = useState({ text: '', platform: 'facebook', customerName: '', postName: '' });
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState({
    aiMode: 'rules_only', commentAiInstructions: '', privateReplyEnabled: false,
    privateReplyInstructions: '', publicAfterPrivateSuccess: true
  });

  const loadWorkspace = useCallback(async () => {
    try {
      const [workspaceResponse, instancesResponse] = await Promise.all([
        api.get(`/agents/${agentId}/comment-replies`),
        api.get('/instances')
      ]);
      setWorkspace(workspaceResponse.data);
      setInstances((instancesResponse.data.instances || []).filter((item) => ['messenger', 'instagram'].includes(item.channelType)));
      return workspaceResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load comment replies');
      return null;
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!workspace?.profile) return;
    setAiDraft({
      aiMode: workspace.profile.aiMode || 'rules_only',
      commentAiInstructions: workspace.profile.commentAiInstructions || '',
      privateReplyEnabled: workspace.profile.privateReplyEnabled === true,
      privateReplyInstructions: workspace.profile.privateReplyInstructions || '',
      publicAfterPrivateSuccess: workspace.profile.publicAfterPrivateSuccess !== false
    });
  }, [workspace]);

  async function ensureProfile(currentWorkspace) {
    if (currentWorkspace?.profile?.id) return currentWorkspace;
    try {
      await api.put(`/agents/${agentId}/comment-replies`, {
        expectedConfigVersion: 0,
        isEnabled: false
      });
    } catch (error) {
      if (error.response?.data?.code !== 'CONFIG_VERSION_CONFLICT') throw error;
    }
    const initialized = await loadWorkspace();
    if (!initialized?.profile?.id) throw new Error('Comment reply profile could not be initialized');
    return initialized;
  }

  async function mutate(request, successMessage, { requiresProfile = false } = {}) {
    setSaving(true);
    try {
      let currentWorkspace = requiresProfile ? await ensureProfile(workspace) : workspace;
      try {
        await request(currentWorkspace.configVersion);
      } catch (error) {
        if (error.response?.data?.code !== 'CONFIG_VERSION_CONFLICT') throw error;
        currentWorkspace = await loadWorkspace();
        if (requiresProfile) currentWorkspace = await ensureProfile(currentWorkspace);
        await request(currentWorkspace.configVersion);
      }
      toast.success(successMessage);
      await loadWorkspace();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Could not save changes');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(isEnabled) {
    await mutate(
      (configVersion) => api.put(`/agents/${agentId}/comment-replies`, {
        expectedConfigVersion: configVersion,
        isEnabled
      }),
      isEnabled ? 'Comment replies enabled' : 'Comment replies paused'
    );
  }

  async function saveAiSettings(event) {
    event.preventDefault();
    await mutate(
      (configVersion) => api.put(`/agents/${agentId}/comment-replies`, {
        expectedConfigVersion: configVersion,
        ...aiDraft
      }),
      'Comment AI settings saved',
      { requiresProfile: true }
    );
  }

  async function runPreview() {
    if (!testInput.text.trim()) return toast.error('Enter a sample comment');
    const binding = workspace.bindings.find((item) => item.provider === testInput.platform);
    if (!binding) return toast.error(`Connect a ${testInput.platform} account first`);
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await api.post(`/agents/${agentId}/comment-replies/preview`, {
        platform: testInput.platform,
        commentText: testInput.text,
        instanceId: binding.instanceId,
        postName: testInput.postName
      });
      setTestResult(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Preview failed');
    } finally {
      setTestLoading(false);
    }
  }

  async function bindInstance() {
    if (!selectedInstance) return toast.error('Choose a Facebook or Instagram channel');
    const saved = await mutate(
      (configVersion) => api.post(`/agents/${agentId}/comment-replies/bindings`, {
        expectedConfigVersion: configVersion,
        instanceId: selectedInstance,
        isEnabled: true
      }),
      'Channel connected',
      { requiresProfile: true }
    );
    if (saved) setSelectedInstance('');
  }

  async function unbind(bindingId) {
    if (!window.confirm('Remove this channel from public comment replies?')) return;
    await mutate(
      (configVersion) => api.delete(`/agents/${agentId}/comment-replies/bindings/${bindingId}`, {
        data: { expectedConfigVersion: configVersion }
      }),
      'Channel removed',
      { requiresProfile: true }
    );
  }

  async function saveRule(event) {
    event.preventDefault();
    const variants = [
      ...splitLines(ruleDraft.sharedReplies).map((body) => ({ body })),
      ...splitLines(ruleDraft.facebookReplies).map((body) => ({ body, platform: 'facebook' })),
      ...splitLines(ruleDraft.instagramReplies).map((body) => ({ body, platform: 'instagram' }))
    ];
    const payload = {
      name: ruleDraft.name.trim(),
      priority: Number(ruleDraft.priority),
      matchMode: ruleDraft.matchMode,
      keywords: splitLines(ruleDraft.keywords.replace(/,/g, '\n')),
      variants,
      isEnabled: ruleDraft.isEnabled
    };
    const saved = await mutate(
      (configVersion) => ruleDraft.id
        ? api.put(`/agents/${agentId}/comment-replies/rules/${ruleDraft.id}`, { ...payload, expectedConfigVersion: configVersion })
        : api.post(`/agents/${agentId}/comment-replies/rules`, { ...payload, expectedConfigVersion: configVersion }),
      ruleDraft.id ? 'Rule updated' : 'Rule created',
      { requiresProfile: true }
    );
    if (saved) setRuleDraft(emptyRule);
  }

  async function deleteRule(ruleId) {
    if (!window.confirm('Delete this reply rule?')) return;
    await mutate(
      (configVersion) => api.delete(`/agents/${agentId}/comment-replies/rules/${ruleId}`, {
        data: { expectedConfigVersion: configVersion }
      }),
      'Rule deleted',
      { requiresProfile: true }
    );
  }

  async function saveOverride(event) {
    event.preventDefault();
    const saved = await mutate(
      (configVersion) => api.post(`/agents/${agentId}/comment-replies/overrides`, {
        expectedConfigVersion: configVersion,
        ...overrideDraft
      }),
      'Post override saved',
      { requiresProfile: true }
    );
    if (saved) setOverrideDraft({ bindingId: '', externalPostId: '', postName: '', mode: 'disabled' });
  }

  async function deleteOverride(overrideId) {
    await mutate(
      (configVersion) => api.delete(`/agents/${agentId}/comment-replies/overrides/${overrideId}`, {
        data: { expectedConfigVersion: configVersion }
      }),
      'Post override removed',
      { requiresProfile: true }
    );
  }

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-xs font-black uppercase tracking-[0.2em] text-lime-300">Loading comment engine...</div>;
  }
  if (!workspace) {
    return <div className="p-10 text-white">Comment Reply workspace is unavailable.</div>;
  }

  const boundIds = new Set(workspace.bindings.map((item) => item.instanceId));
  const availableInstances = instances.filter((item) => !boundIds.has(item.id));
  const readyBindings = workspace.bindings.filter((item) => item.isEnabled && item.permissionState === 'ready').length;
  const activeRules = workspace.rules.filter((item) => item.isEnabled).length;
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(163,230,53,0.08),transparent_32%),linear-gradient(180deg,rgba(28,33,18,0.45),transparent_45%)] px-5 py-8 text-white md:px-10">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl">
        <Link to="/agents" className="mb-7 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-lime-300">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Agents
        </Link>

        <header className="mb-8 flex flex-col gap-5 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-lime-300">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Public Reply Engine</span>
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter md:text-6xl">Comment Replies</h1>
            <p className="mt-3 text-sm text-zinc-500">Agent: <span className="font-bold text-zinc-300">{workspace.agent.name}</span></p>
          </div>
          <button
            disabled={saving}
            onClick={() => saveProfile(!workspace.profile.isEnabled)}
            className={`rounded-2xl px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition ${workspace.profile.isEnabled ? 'border border-rose-400/20 bg-rose-400/5 text-rose-300' : 'bg-lime-300 text-zinc-950 hover:bg-lime-200'}`}
          >
            {workspace.profile.isEnabled ? 'Pause Engine' : 'Enable Engine'}
          </button>
        </header>

        <nav className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-white/5 bg-black/20 p-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition ${activeTab === tab ? 'bg-lime-300 text-zinc-950' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'Overview' && (
          <div className="space-y-7">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Engine" value={workspace.profile.isEnabled ? 'ON' : 'OFF'} accent={workspace.profile.isEnabled} />
              <Metric label="Active Rules" value={activeRules} />
              <Metric label="Ready Channels" value={`${readyBindings}/${workspace.bindings.length}`} />
            </div>
            <section className="rounded-3xl border border-white/5 bg-zinc-950/45 p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-lime-300" />
                <h2 className="text-xl font-black uppercase italic tracking-tight">Connected Accounts</h2>
              </div>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <select value={selectedInstance} onChange={(event) => setSelectedInstance(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white">
                  <option value="">Choose Facebook or Instagram channel</option>
                  {availableInstances.map((instance) => <option key={instance.id} value={instance.id}>{instance.instanceName || instance.phoneNumber} · {instance.channelType}</option>)}
                </select>
                <button disabled={saving || !selectedInstance} onClick={bindInstance} className="rounded-xl bg-lime-300 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-950 disabled:opacity-40">Connect</button>
              </div>
              <div className="grid gap-3">
                {workspace.bindings.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">No public comment channel connected yet.</p>}
                {workspace.bindings.map((binding) => (
                  <div key={binding.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div>
                      <p className="font-bold">{binding.instance?.instanceName || binding.externalAccountId}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">{binding.provider} · permissions: <span className={binding.permissionState === 'ready' ? 'text-lime-300' : 'text-amber-300'}>{binding.permissionState}</span></p>
                    </div>
                    <button onClick={() => unbind(binding.id)} className="rounded-lg p-2 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-300"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-white/5 bg-zinc-950/45 p-6 md:p-8">
              <h2 className="text-xl font-black uppercase italic tracking-tight">Recent Activity</h2>
              <p className="mt-2 text-xs text-zinc-500">Private and public delivery states are tracked independently.</p>
              <div className="mt-5 space-y-3">
                {(workspace.activity || []).length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">No comment decisions yet.</p>}
                {(workspace.activity || []).map((execution) => (
                  <div key={execution.id} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{execution.postName || execution.platform} · {execution.routeSource || 'eligibility'}</p>
                      <span className="text-[9px] font-black uppercase text-zinc-400">{execution.status}{execution.skipReason ? ` · ${execution.skipReason}` : ''}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(execution.deliveries || []).map((delivery) => (
                        <span key={delivery.id} className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${delivery.status === 'succeeded' ? 'bg-lime-300/10 text-lime-300' : delivery.status === 'failed' || delivery.status === 'outcome_unknown' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'}`}>
                          {delivery.kind === 'private_message' ? 'DM' : 'Public'} · {delivery.status}{delivery.attempts ? ` · ${delivery.attempts} attempt${delivery.attempts === 1 ? '' : 's'}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Comment AI' && (
          <form onSubmit={saveAiSettings} className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-white/5 bg-zinc-950/45 p-6 md:p-8">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-300">Read-only decision layer</p>
              <h2 className="mt-2 text-2xl font-black uppercase italic">Comment AI</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Uses this Agent's instructions and knowledge. It cannot run tools, change CRM data, or modify ad accounts.</p>
            </div>
            <label className="block text-sm font-bold text-zinc-300">
              AI mode
              <select aria-label="AI mode" value={aiDraft.aiMode} onChange={(event) => setAiDraft({ ...aiDraft, aiMode: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm">
                <option value="rules_only">Rules only</option>
                <option value="rules_then_ai">Rules, then AI fallback</option>
                <option value="ai_only">AI only</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-300">
              Public comment instructions
              <textarea aria-label="Public comment instructions" rows="7" value={aiDraft.commentAiInstructions} onChange={(event) => setAiDraft({ ...aiDraft, commentAiInstructions: event.target.value })} placeholder="Define tone, when to answer, when to skip, and when a human should review..." className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-normal" />
            </label>
            <div className="rounded-2xl border border-indigo-400/10 bg-indigo-400/[0.04] p-5">
              <label className="flex items-center gap-3 text-sm font-bold text-zinc-200">
                <input aria-label="Enable private message" type="checkbox" checked={aiDraft.privateReplyEnabled} onChange={(event) => setAiDraft({ ...aiDraft, privateReplyEnabled: event.target.checked })} />
                Enable private message
              </label>
              <textarea aria-label="Private message instructions" disabled={!aiDraft.privateReplyEnabled} rows="5" value={aiDraft.privateReplyInstructions} onChange={(event) => setAiDraft({ ...aiDraft, privateReplyInstructions: event.target.value })} placeholder="What should the DM achieve? Which qualifying question should it ask?" className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm disabled:opacity-40" />
              <label className="mt-4 flex items-center gap-3 text-xs font-bold text-zinc-400">
                <input type="checkbox" checked={aiDraft.publicAfterPrivateSuccess} onChange={(event) => setAiDraft({ ...aiDraft, publicAfterPrivateSuccess: event.target.checked })} />
                Publish the public reply only after Meta confirms the DM
              </label>
            </div>
            <button disabled={saving} className="w-full rounded-xl bg-lime-300 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 disabled:opacity-50">Save Comment AI</button>
          </form>
        )}

        {activeTab === 'Reply Rules' && (
          <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="space-y-3">
              <button onClick={() => setRuleDraft(emptyRule)} className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/5 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-lime-300">
                <PlusIcon className="h-4 w-4" /> New Rule
              </button>
              {workspace.rules.map((rule) => (
                <button key={rule.id} onClick={() => setRuleDraft(ruleToDraft(rule))} className={`w-full rounded-2xl border p-5 text-left transition ${ruleDraft.id === rule.id ? 'border-lime-300/40 bg-lime-300/5' : 'border-white/5 bg-black/20 hover:border-white/10'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-black">{rule.name}</p><p className="mt-2 text-xs text-zinc-500">{rule.keywords.join(' · ')}</p></div>
                    <span className={`text-[9px] font-black uppercase ${rule.isEnabled ? 'text-lime-300' : 'text-zinc-600'}`}>{rule.isEnabled ? 'Active' : 'Paused'}</span>
                  </div>
                </button>
              ))}
            </section>
            <form onSubmit={saveRule} className="space-y-5 rounded-3xl border border-white/5 bg-zinc-950/45 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase italic">{ruleDraft.id ? 'Edit Rule' : 'New Rule'}</h2>
                {ruleDraft.id && <button type="button" onClick={() => deleteRule(ruleDraft.id)} className="text-[10px] font-black uppercase text-rose-300">Delete</button>}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <input required value={ruleDraft.name} onChange={(event) => setRuleDraft({ ...ruleDraft, name: event.target.value })} placeholder="Rule name" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
                <input required type="number" min="0" value={ruleDraft.priority} onChange={(event) => setRuleDraft({ ...ruleDraft, priority: event.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" title="Lower priority runs first" />
              </div>
              <select value={ruleDraft.matchMode} onChange={(event) => setRuleDraft({ ...ruleDraft, matchMode: event.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm">
                <option value="contains_any">Contains any keyword</option>
                <option value="contains_all">Contains all keywords</option>
                <option value="exact">Exact phrase</option>
              </select>
              <textarea required rows="4" value={ruleDraft.keywords} onChange={(event) => setRuleDraft({ ...ruleDraft, keywords: event.target.value })} placeholder={'Keywords or phrases\nOne per line'} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <textarea rows="4" value={ruleDraft.sharedReplies} onChange={(event) => setRuleDraft({ ...ruleDraft, sharedReplies: event.target.value })} placeholder={'Shared replies\nOne reply per line'} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <div className="grid gap-4 md:grid-cols-2">
                <textarea rows="4" value={ruleDraft.facebookReplies} onChange={(event) => setRuleDraft({ ...ruleDraft, facebookReplies: event.target.value })} placeholder={'Facebook-only replies\nOptional'} className="w-full rounded-xl border border-blue-400/10 bg-blue-400/5 px-4 py-3 text-sm" />
                <textarea rows="4" value={ruleDraft.instagramReplies} onChange={(event) => setRuleDraft({ ...ruleDraft, instagramReplies: event.target.value })} placeholder={'Instagram-only replies\nOptional'} className="w-full rounded-xl border border-pink-400/10 bg-pink-400/5 px-4 py-3 text-sm" />
              </div>
              <label className="flex items-center gap-3 text-sm text-zinc-400"><input type="checkbox" checked={ruleDraft.isEnabled} onChange={(event) => setRuleDraft({ ...ruleDraft, isEnabled: event.target.checked })} /> Enable this rule</label>
              <button disabled={saving} className="w-full rounded-xl bg-lime-300 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 disabled:opacity-50">Save Rule</button>
            </form>
          </div>
        )}

        {activeTab === 'Post Overrides' && (
          <div className="grid gap-7 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={saveOverride} className="space-y-4 rounded-3xl border border-white/5 bg-zinc-950/45 p-6">
              <h2 className="text-xl font-black uppercase italic">Post Override</h2>
              <select required value={overrideDraft.bindingId} onChange={(event) => setOverrideDraft({ ...overrideDraft, bindingId: event.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm">
                <option value="">Choose connected account</option>
                {workspace.bindings.map((binding) => <option key={binding.id} value={binding.id}>{binding.instance?.instanceName || binding.externalAccountId}</option>)}
              </select>
              <input required value={overrideDraft.externalPostId} onChange={(event) => setOverrideDraft({ ...overrideDraft, externalPostId: event.target.value })} placeholder="Meta Post ID" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <input value={overrideDraft.postName} onChange={(event) => setOverrideDraft({ ...overrideDraft, postName: event.target.value })} placeholder="Post label (optional)" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <select value={overrideDraft.mode} onChange={(event) => setOverrideDraft({ ...overrideDraft, mode: event.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm">
                <option value="disabled">Disable replies on this post</option>
                <option value="inherit">Use the account rules</option>
              </select>
              <button disabled={saving} className="w-full rounded-xl bg-lime-300 px-5 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-950">Save Override</button>
            </form>
            <section className="space-y-3">
              {workspace.overrides.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">No post overrides.</p>}
              {workspace.overrides.map((override) => (
                <div key={override.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-5">
                  <div><p className="font-bold">{override.postName || override.externalPostId}</p><p className="mt-1 text-[10px] uppercase text-zinc-500">{override.mode}</p></div>
                  <button onClick={() => deleteOverride(override.id)} className="p-2 text-zinc-600 hover:text-rose-300"><TrashIcon className="h-4 w-4" /></button>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'Test Lab' && (
          <div className="grid gap-7 lg:grid-cols-2">
            <section className="space-y-4 rounded-3xl border border-white/5 bg-zinc-950/45 p-6">
              <div className="flex items-center gap-3"><BoltIcon className="h-5 w-5 text-lime-300" /><h2 className="text-xl font-black uppercase italic">Safe Preview</h2></div>
              <select value={testInput.platform} onChange={(event) => setTestInput({ ...testInput, platform: event.target.value })} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm"><option value="facebook">Facebook</option><option value="instagram">Instagram</option></select>
              <textarea rows="5" value={testInput.text} onChange={(event) => setTestInput({ ...testInput, text: event.target.value })} placeholder="Write a sample customer comment..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={testInput.customerName} onChange={(event) => setTestInput({ ...testInput, customerName: event.target.value })} placeholder="Customer name" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
                <input value={testInput.postName} onChange={(event) => setTestInput({ ...testInput, postName: event.target.value })} placeholder="Post name" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              </div>
              <button type="button" disabled={testLoading || !testInput.text.trim()} onClick={runPreview} className="w-full rounded-xl bg-lime-300 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 disabled:opacity-40">{testLoading ? 'Analyzing...' : 'Run Safe Preview'}</button>
              <p className="text-xs text-zinc-600">Preview only. Nothing is published and rotation counters do not change.</p>
            </section>
            <section className="rounded-3xl border border-lime-300/10 bg-lime-300/[0.03] p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-300">Result</p>
              {!testResult ? <p className="mt-5 text-sm text-zinc-500">Run a preview to see the selected route and proposed texts.</p> : (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><p className="text-[9px] uppercase text-zinc-500">Route</p><p className="mt-1 font-bold uppercase text-lime-300">{testResult.route}</p></div>
                    <div><p className="text-[9px] uppercase text-zinc-500">Decision</p><p className="mt-1 font-bold">{testResult.decision?.action} · {testResult.decision?.reasonCode}</p></div>
                  </div>
                  {testResult.decision?.privateReply && <div><p className="text-[9px] uppercase text-zinc-500">Private message first</p><p className="mt-2 rounded-2xl bg-indigo-400/5 p-5 leading-7 text-zinc-200">{testResult.decision.privateReply}</p></div>}
                  {testResult.decision?.publicReply && <div><p className="text-[9px] uppercase text-zinc-500">Public reply after confirmation</p><p className="mt-2 rounded-2xl bg-black/25 p-5 leading-7 text-zinc-200">{testResult.decision.publicReply}</p></div>}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
