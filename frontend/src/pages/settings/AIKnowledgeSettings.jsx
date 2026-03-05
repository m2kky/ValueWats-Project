import { useState, useEffect } from 'react';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    CpuChipIcon,
    DocumentTextIcon,
    CloudArrowUpIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function AIKnowledgeSettings() {
    const [sources, setSources] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [showTextModal, setShowTextModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Text form
    const [textForm, setTextForm] = useState({ agentId: '', title: '', content: '', category: '' });

    // File form
    const [fileForm, setFileForm] = useState({ agentId: '', category: '' });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [knowledgeRes, agentsRes] = await Promise.all([
                api.get('/agents/knowledge'),
                api.get('/agents'),
            ]);
            setSources(knowledgeRes.data.sources || []);
            setAgents(agentsRes.data || []);
        } catch (e) {
            console.error(e);
            setSources([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddText = async () => {
        if (!textForm.agentId || !textForm.title.trim() || !textForm.content.trim()) {
            alert('Please select an agent and fill in title and content');
            return;
        }
        setSaving(true);
        try {
            await api.post(`/agents/${textForm.agentId}/knowledge/text`, {
                title: textForm.title,
                content: textForm.content,
                category: textForm.category || undefined,
            });
            setShowTextModal(false);
            setTextForm({ agentId: '', title: '', content: '', category: '' });
            fetchData();
        } catch (e) {
            alert('Failed to add text source: ' + (e.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    const handleUploadFile = async () => {
        if (!fileForm.agentId || !selectedFile) {
            alert('Please select an agent and a file');
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('file', selectedFile);
            if (fileForm.category) fd.append('category', fileForm.category);
            await api.post(`/agents/${fileForm.agentId}/knowledge/file`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setShowUploadModal(false);
            setFileForm({ agentId: '', category: '' });
            setSelectedFile(null);
            fetchData();
        } catch (e) {
            alert('Failed to upload: ' + (e.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (source) => {
        if (!source.agentId || !source.id) return;
        if (!window.confirm(`Delete "${source.title}"? This will remove all chunks.`)) return;
        try {
            await api.delete(`/agents/${source.agentId}/knowledge/${source.id}`);
            fetchData();
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const filtered = sources.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.agentName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">AI Knowledge Base</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage text and file knowledge across all AI agents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowUploadModal(true)} className="btn-glass flex items-center gap-2">
                        <CloudArrowUpIcon className="h-4 w-4" /> Upload Document
                    </button>
                    <button onClick={() => setShowTextModal(true)} className="btn-premium flex items-center gap-2">
                        <PlusIcon className="h-4 w-4" /> Add Text Source
                    </button>
                </div>
            </div>

            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search knowledge sources by title or agent..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                />
            </div>

            <div className="glass-card border border-white/5 p-1">
                {loading ? (
                    <p className="text-zinc-500 text-center py-12">Scanning Neural Indexes...</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpenIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No knowledge sources found</p>
                        <p className="text-zinc-600 text-xs mt-1">Inject data to enable Retrieval-Augmented Generation</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filtered.map(source => (
                            <div key={source.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${source.sourceType === 'file'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                        {source.sourceType === 'file' ? <DocumentTextIcon className="w-5 h-5" /> : <CpuChipIcon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">{source.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {source.sourceType} • {Number(source.chunkCount) || 1} Chunks
                                            </span>
                                            {source.agentName && (
                                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                    🤖 {source.agentName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(source)} className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Text Source Modal */}
            {showTextModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Add Text Source</h2>
                            <button onClick={() => setShowTextModal(false)} className="text-zinc-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Agent *</label>
                            <select
                                value={textForm.agentId}
                                onChange={e => setTextForm({ ...textForm, agentId: e.target.value })}
                                className="glass-input w-full"
                            >
                                <option value="">Select Agent...</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Title *</label>
                            <input
                                type="text"
                                value={textForm.title}
                                onChange={e => setTextForm({ ...textForm, title: e.target.value })}
                                placeholder="e.g. Company FAQ"
                                className="glass-input w-full"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Category</label>
                            <input
                                type="text"
                                value={textForm.category}
                                onChange={e => setTextForm({ ...textForm, category: e.target.value })}
                                placeholder="e.g. FAQ, Product, Pricing"
                                className="glass-input w-full"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Content *</label>
                            <textarea
                                rows={6}
                                value={textForm.content}
                                onChange={e => setTextForm({ ...textForm, content: e.target.value })}
                                placeholder="Paste your knowledge text here..."
                                className="glass-input w-full resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleAddText} disabled={saving} className="btn-premium flex-1 disabled:opacity-40">
                                {saving ? 'Saving...' : 'Add Source'}
                            </button>
                            <button onClick={() => setShowTextModal(false)} className="btn-glass flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Document Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Upload Document</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-zinc-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Agent *</label>
                            <select
                                value={fileForm.agentId}
                                onChange={e => setFileForm({ ...fileForm, agentId: e.target.value })}
                                className="glass-input w-full"
                            >
                                <option value="">Select Agent...</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Category</label>
                            <input
                                type="text"
                                value={fileForm.category}
                                onChange={e => setFileForm({ ...fileForm, category: e.target.value })}
                                placeholder="e.g. Policies, Guides"
                                className="glass-input w-full"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">File (.pdf, .txt, .md) *</label>
                            <input
                                type="file"
                                accept=".pdf,.txt,.md"
                                onChange={e => setSelectedFile(e.target.files[0])}
                                className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 file:transition-colors file:cursor-pointer"
                            />
                            {selectedFile && (
                                <p className="text-xs text-zinc-400 mt-2">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleUploadFile} disabled={saving} className="btn-premium flex-1 disabled:opacity-40">
                                {saving ? 'Uploading...' : 'Upload'}
                            </button>
                            <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="btn-glass flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
