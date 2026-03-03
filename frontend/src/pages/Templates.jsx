import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, PencilSquareIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        category: 'general',
        content: ''
    });

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/templates', { withCredentials: true });
            setTemplates(res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleOpenModal = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                category: template.category,
                content: template.content
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                category: 'general',
                content: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await axios.patch(`/api/templates/${editingTemplate.id}`, formData, { withCredentials: true });
                toast.success('Template updated successfully');
            } else {
                await axios.post('/api/templates', formData, { withCredentials: true });
                toast.success('Template created successfully');
            }
            handleCloseModal();
            fetchTemplates();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await axios.delete(`/api/templates/${id}`, { withCredentials: true });
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Message Templates</h1>
                    <p className="text-zinc-400">Manage your global message templates for campaigns and automation.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Template
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-[#121214] border border-white/5 rounded-2xl p-12 text-center">
                    <DocumentDuplicateIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No templates yet</h3>
                    <p className="text-zinc-400 mb-6">Create your first reusable message template to speed up your workflows.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-white/5"
                    >
                        Create Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className="bg-[#1a1a1f] border border-white/5 rounded-2xl p-6 flex flex-col group relative hover:border-indigo-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{template.name}</h3>
                                    <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium uppercase tracking-wider">
                                        {template.category}
                                    </span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => copyToClipboard(template.content)} className="p-1.5 text-zinc-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleOpenModal(template)} className="p-1.5 text-indigo-400 hover:text-white bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors">
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(template.id)} className="p-1.5 text-rose-400 hover:text-white bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1a1a1f] to-transparent pointer-events-none"></div>
                                <p className="text-zinc-400 whitespace-pre-wrap text-sm line-clamp-4">{template.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Draft/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Template Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="e.g. Welcome Message"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    >
                                        <option value="general">General</option>
                                        <option value="promo">Promotional</option>
                                        <option value="welcome">Welcome</option>
                                        <option value="support">Support</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2 flex justify-between">
                                    <span>Message Content</span>
                                    <span className="text-xs text-indigo-400">Supports Spintax & Variables</span>
                                </label>
                                <textarea
                                    required
                                    rows={8}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    placeholder="Hello {{name}}, welcome to our service!"
                                />
                                <p className="text-xs text-zinc-500 mt-2">
                                    Use {'{{name}}'}, {'{{rand}}'}, {'{{date}}'}, or Spintax like {'{Hello|Hi}'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                                >
                                    {editingTemplate ? 'Save Changes' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
