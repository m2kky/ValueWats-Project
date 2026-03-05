import { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    MapIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/client';

const EMOJI_OPTIONS = ['🆕', '🔥', '📄', '🎉', '❌', '📌', '💰', '🤝', '📞', '⭐', '🚀', '💎', '🎯', '📧', '🛒'];
const COLOR_OPTIONS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#64748b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#ef4444'];

export default function LifecycleSettings() {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', emoji: '📌', color: '#6366f1' });
    const [showAdd, setShowAdd] = useState(false);
    const [newStage, setNewStage] = useState({ name: '', emoji: '📌', color: '#6366f1' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const { data } = await api.get('/lifecycle');
            setStages(data || []);
        } catch (error) {
            console.error('Failed to fetch lifecycle stages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newStage.name.trim()) return;
        setSaving(true);
        try {
            await api.post('/lifecycle', newStage);
            setNewStage({ name: '', emoji: '📌', color: '#6366f1' });
            setShowAdd(false);
            fetchStages();
        } catch (error) {
            alert('Failed to create stage');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        try {
            await api.put(`/lifecycle/${id}`, editForm);
            setEditingId(null);
            fetchStages();
        } catch (error) {
            alert('Failed to update stage');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this stage? Contacts in this stage will become unassigned.')) return;
        try {
            await api.delete(`/lifecycle/${id}`);
            fetchStages();
        } catch (error) {
            alert('Failed to delete stage');
        }
    };

    const startEdit = (stage) => {
        setEditingId(stage.id);
        setEditForm({ name: stage.name, emoji: stage.emoji || '📌', color: stage.color || '#6366f1' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Lifecycle Stages</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage your sales pipeline and contact phases</p>
                </div>
                <button
                    className="btn-premium flex items-center gap-2"
                    onClick={() => setShowAdd(true)}
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Stage
                </button>
            </div>

            {/* Add New Stage Form */}
            {showAdd && (
                <div className="glass-card p-6 border border-indigo-500/20 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">New Stage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Name</label>
                            <input
                                type="text"
                                value={newStage.name}
                                onChange={e => setNewStage({ ...newStage, name: e.target.value })}
                                placeholder="e.g. Hot Lead"
                                className="glass-input w-full"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Emoji</label>
                            <div className="flex flex-wrap gap-1.5">
                                {EMOJI_OPTIONS.map(e => (
                                    <button
                                        key={e}
                                        onClick={() => setNewStage({ ...newStage, emoji: e })}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${newStage.emoji === e ? 'bg-indigo-500/20 ring-2 ring-indigo-500' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Color</label>
                            <div className="flex flex-wrap gap-1.5">
                                {COLOR_OPTIONS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewStage({ ...newStage, color: c })}
                                        className={`w-8 h-8 rounded-full transition-all ${newStage.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={handleCreate} disabled={saving || !newStage.name.trim()} className="btn-premium disabled:opacity-40">
                            {saving ? 'Creating...' : 'Create Stage'}
                        </button>
                        <button onClick={() => { setShowAdd(false); setNewStage({ name: '', emoji: '📌', color: '#6366f1' }); }} className="btn-glass">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Stages Grid */}
            {loading ? (
                <p className="text-zinc-500 text-center py-12">Loading stages...</p>
            ) : stages.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <MapIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No lifecycle stages created</p>
                    <p className="text-zinc-600 text-xs mt-1">Click "Add Stage" to create your first pipeline step</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stages.map((stage, index) => (
                        <div key={stage.id} className="glass-card p-6 relative group overflow-hidden border-l-4" style={{ borderLeftColor: stage.color || '#6366f1' }}>
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="text-6xl">{stage.emoji || '📌'}</span>
                            </div>

                            {editingId === stage.id ? (
                                /* Edit Mode */
                                <div className="space-y-3 relative z-10">
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="glass-input w-full text-sm"
                                        autoFocus
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {EMOJI_OPTIONS.map(e => (
                                            <button
                                                key={e}
                                                onClick={() => setEditForm({ ...editForm, emoji: e })}
                                                className={`w-6 h-6 rounded text-sm flex items-center justify-center ${editForm.emoji === e ? 'bg-indigo-500/20 ring-1 ring-indigo-500' : 'bg-white/5'}`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {COLOR_OPTIONS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditForm({ ...editForm, color: c })}
                                                className={`w-5 h-5 rounded-full ${editForm.color === c ? 'ring-2 ring-white' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdate(stage.id)} disabled={saving} className="btn-premium text-xs py-1 px-3">
                                            <CheckIcon className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="btn-glass text-xs py-1 px-3">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="text-2xl">{stage.emoji || '📌'}</div>
                                        <div>
                                            <h3 className="font-bold text-white tracking-tight">{stage.name}</h3>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                Stage {index + 1} • {stage._count?.conversations || 0} contacts
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(stage)} className="btn-glass text-[10px] px-3 py-1 uppercase tracking-widest font-black flex items-center gap-1">
                                            <PencilIcon className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(stage.id)} className="btn-glass text-rose-500/50 hover:text-rose-400 text-[10px] px-3 py-1 uppercase tracking-widest font-black flex items-center gap-1">
                                            <TrashIcon className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
