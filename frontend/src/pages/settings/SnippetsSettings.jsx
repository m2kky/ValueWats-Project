import { useState, useEffect } from 'react';
import {
    PlusIcon, TrashIcon, PencilIcon, XMarkIcon,
    MagnifyingGlassIcon, CommandLineIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function SnippetsSettings() {
    const [snippets, setSnippets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', shortcut: '' });

    useEffect(() => { fetchSnippets(); }, []);

    const fetchSnippets = async () => {
        try {
            const { data } = await api.get('/snippets');
            setSnippets(data.snippets || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/snippets/${editing.id}`, form);
            } else {
                await api.post('/snippets', form);
            }
            setShowModal(false);
            setForm({ title: '', content: '', shortcut: '' });
            setEditing(null);
            fetchSnippets();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (snippet) => {
        setEditing(snippet);
        setForm({ title: snippet.title, content: snippet.content, shortcut: snippet.shortcut || '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this snippet?')) return;
        await api.delete(`/snippets/${id}`);
        fetchSnippets();
    };

    const filtered = snippets.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase()) ||
        (s.shortcut || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Snippets</h1>
                    <p className="text-zinc-500 text-sm font-medium">Pre-written response templates for quick replies</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ title: '', content: '', shortcut: '' }); setShowModal(true); }} className="btn-premium flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Snippet
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search snippets by title, content, or shortcut..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                />
            </div>

            {/* Snippets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <p className="text-zinc-500 col-span-2 text-center py-12">Loading snippets...</p>
                ) : filtered.length === 0 ? (
                    <div className="col-span-2 text-center py-12 glass-card border border-white/5">
                        <DocumentTextIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">No snippets found</p>
                        <p className="text-zinc-600 text-xs mt-1">Create your first quick reply template</p>
                    </div>
                ) : filtered.map(snippet => (
                    <div key={snippet.id} className="glass-card border border-white/5 p-5 group hover:border-indigo-500/20 transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <DocumentTextIcon className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">{snippet.title}</h3>
                                    {snippet.shortcut && (
                                        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg mt-1 inline-block">
                                            {snippet.shortcut}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(snippet)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(snippet.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-3 whitespace-pre-wrap leading-relaxed">{snippet.content}</p>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg relative isolate">
                        <div className="px-6 py-4 border-b border-white/5">
                            <h2 className="text-xl font-black text-white italic tracking-tight uppercase">
                                {editing ? 'Edit Snippet' : 'New Snippet'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Title *</label>
                                <input
                                    type="text" required
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Thank you reply"
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Shortcut</label>
                                <div className="relative">
                                    <CommandLineIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={form.shortcut}
                                        onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))}
                                        placeholder="/thanks"
                                        className="glass-input pl-10 font-mono"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-1">Type this in the chat input to quickly insert the snippet</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Content *</label>
                                <textarea
                                    required rows={5}
                                    value={form.content}
                                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                    placeholder="Thank you for reaching out! How can I help you today? 🙏"
                                    className="glass-input resize-none"
                                />
                                <p className="text-[10px] text-zinc-600 mt-1">
                                    Supports variables: {'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{date.today}}'}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-glass flex-1">Cancel</button>
                                <button type="submit" className="btn-premium flex-1">{editing ? 'Save Changes' : 'Create Snippet'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
