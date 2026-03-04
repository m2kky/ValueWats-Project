import { useState, useEffect } from 'react';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    CpuChipIcon,
    DocumentTextIcon,
    CloudArrowUpIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function AIKnowledgeSettings() {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchKnowledgeSources();
    }, []);

    const fetchKnowledgeSources = async () => {
        setLoading(true);
        try {
            // Create a specific endpoint or use existing logic if it supports fetching all
            // For now, assume we have a workspace-wide GET /agents/knowledge route
            const { data } = await api.get('/agents/knowledge');
            setSources(data.sources || []);
        } catch (e) {
            console.error(e);
            // Fallback empty array if endpoint isn't ready
            setSources([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = sources.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.content?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">AI Knowledge Base</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage text and file knowledge across all AI agents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-glass flex items-center gap-2">
                        <CloudArrowUpIcon className="h-4 w-4" /> Upload Document
                    </button>
                    <button className="btn-premium flex items-center gap-2">
                        <PlusIcon className="h-4 w-4" /> Add Text Source
                    </button>
                </div>
            </div>

            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search knowledge sources by title or content..."
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
                                            {source.agentId && (
                                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                    LINKED TO AGENT
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Temporary icon stub since PlusIcon wasn't imported above to save space
function PlusIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}
