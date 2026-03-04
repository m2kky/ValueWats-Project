import { useState, useEffect } from 'react';
import {
    PlusIcon, TrashIcon, ArrowRightIcon,
    QueueListIcon, BoltIcon, TagIcon, AdjustmentsVerticalIcon
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function LifecycleRules() {
    const [rules, setRules] = useState([]);
    const [stages, setStages] = useState([]);
    const [tags, setTags] = useState([]);
    const [fields, setFields] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ triggerType: 'tag_added', triggerValue: '', targetStageId: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rulesRes, stagesRes, tagsRes, fieldsRes] = await Promise.all([
                api.get('/lifecycle-rules'),
                api.get('/lifecycle/stages'),
                api.get('/tags'),
                api.get('/contact-fields/definitions')
            ]);
            setRules(rulesRes.data);
            setStages(stagesRes.data.stages || []);
            setTags(tagsRes.data.tags || []);
            setFields(fieldsRes.data || []);
        } catch (e) { console.error('Failed to load rules data', e); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lifecycle-rules', form);
            setShowModal(false);
            setForm({ triggerType: 'tag_added', triggerValue: '', targetStageId: '' });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const toggleRule = async (id, isActive) => {
        try {
            await api.put(`/lifecycle-rules/${id}`, { isActive: !isActive });
            fetchData();
        } catch (e) { console.error('Error toggling rule'); }
    };

    const deleteRule = async (id) => {
        if (!window.confirm('Delete this automation rule?')) return;
        try {
            await api.delete(`/lifecycle-rules/${id}`);
            fetchData();
        } catch (e) { console.error('Error deleting rule'); }
    };

    const getTriggerLabel = (type) => {
        switch (type) {
            case 'tag_added': return 'Select Tag';
            case 'tag_removed': return 'Select Tag';
            case 'field_updated': return 'Select Field';
            default: return 'Value';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Stage Automation</h1>
                    <p className="text-zinc-500 text-sm font-medium">Automatically transition contacts to new stages based on triggers.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-premium flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Rule
                </button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <p className="text-zinc-500 text-center py-12">Loading rules...</p>
                ) : rules.length === 0 ? (
                    <div className="text-center py-12 glass-card border border-white/5">
                        <BoltIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">No automation rules yet</p>
                        <p className="text-zinc-600 text-xs mt-1">Create rules to auto-update contact lifecycle stages</p>
                    </div>
                ) : rules.map(rule => (
                    <div key={rule.id} className="glass-card border border-white/5 p-5 hover:border-indigo-500/20 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            {/* Trigger Side */}
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {rule.triggerType.includes('tag') ? <TagIcon className="w-5 h-5" /> : <AdjustmentsVerticalIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{rule.triggerType.replace('_', ' ')}</p>
                                    <p className={`font-bold ${rule.isActive ? 'text-white' : 'text-zinc-500'}`}>{rule.triggerValue}</p>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="hidden sm:flex flex-col items-center px-4">
                                <ArrowRightIcon className={`w-5 h-5 ${rule.isActive ? 'text-indigo-500' : 'text-zinc-700'}`} />
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">MOVE TO</span>
                            </div>

                            {/* Action Side */}
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    <QueueListIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">STAGE</p>
                                    <div className="flex items-center gap-2">
                                        {rule.targetStage?.emoji && <span>{rule.targetStage.emoji}</span>}
                                        <p className={`font-bold ${rule.isActive ? 'text-white' : 'text-zinc-500'}`}>{rule.targetStage?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toggleRule(rule.id, rule.isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${rule.isActive ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <button onClick={() => deleteRule(rule.id)} className="p-2 text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg relative isolate">
                        <div className="px-6 py-4 border-b border-white/5">
                            <h2 className="text-xl font-black text-white italic tracking-tight uppercase">New Automation Rule</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">When</label>
                                <select
                                    value={form.triggerType}
                                    onChange={e => setForm({ ...form, triggerType: e.target.value, triggerValue: '' })}
                                    className="glass-input w-full appearance-none"
                                >
                                    <option value="tag_added">Tag is added</option>
                                    <option value="tag_removed">Tag is removed</option>
                                    <option value="field_updated">Custom field is updated</option>
                                    <option value="conversation_closed">Conversation is closed</option>
                                </select>
                            </div>

                            {form.triggerType !== 'conversation_closed' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">{getTriggerLabel(form.triggerType)}</label>
                                    {form.triggerType.includes('tag') ? (
                                        <select required value={form.triggerValue} onChange={e => setForm({ ...form, triggerValue: e.target.value })} className="glass-input w-full">
                                            <option value="">Select a tag...</option>
                                            {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    ) : (
                                        <select required value={form.triggerValue} onChange={e => setForm({ ...form, triggerValue: e.target.value })} className="glass-input w-full">
                                            <option value="">Select a field...</option>
                                            {fields.map(f => <option key={f.id} value={f.key}>{f.name} ({f.key})</option>)}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Move Contact to Stage</label>
                                <select required value={form.targetStageId} onChange={e => setForm({ ...form, targetStageId: e.target.value })} className="glass-input w-full">
                                    <option value="">Select target stage...</option>
                                    {stages.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-glass flex-1">Cancel</button>
                                <button type="submit" className="btn-premium flex-1">Create Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
