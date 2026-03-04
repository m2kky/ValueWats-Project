import { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    TagIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function TagSettings() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTagName, setNewTagName] = useState('');

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const { data } = await api.get('/tags'); // Assuming this endpoint exists, or standardizing it
            setTags(data.tags || []);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTagName) return;
        try {
            await api.post('/tags', { name: newTagName });
            setNewTagName('');
            fetchTags();
        } catch (error) {
            alert('Error creating tag');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this tag? It will be removed from all contacts.')) return;
        try {
            await api.delete(`/tags/${id}`);
            fetchTags();
        } catch (error) {
            alert('Error deleting tag');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Tags</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage labels for contacts and conversations</p>
                </div>
            </div>

            <div className="glass-card p-6">
                <form onSubmit={handleCreate} className="flex gap-3 mb-8">
                    <div className="relative flex-1">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name (e.g. VIP, Black Friday)..."
                            className="glass-input pl-10"
                        />
                    </div>
                    <button type="submit" className="btn-premium whitespace-nowrap">Add Tag</button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <p className="text-zinc-500 text-sm italic">Loading tags...</p>
                    ) : tags.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between px-4 py-2 bg-white/5 border border-white/5 rounded-xl group hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-sm font-bold text-white">{tag.name}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(tag.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {tags.length === 0 && !loading && (
                        <p className="text-zinc-500 text-sm italic col-span-full">No tags created yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
