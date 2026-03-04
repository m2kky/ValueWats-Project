import { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    AdjustmentsHorizontalIcon,
    Bars3BottomLeftIcon,
    ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function ContactFieldsSettings() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingField, setEditingField] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [fieldType, setFieldType] = useState('TEXT');
    const [options, setOptions] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [visibility, setVisibility] = useState('PUBLIC');

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            const { data } = await api.get('/contact-fields');
            setFields(data);
        } catch (error) {
            console.error('Failed to fetch contact fields:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name,
            key: key.toLowerCase().replace(/\s+/g, '_'),
            fieldType,
            options: options ? options.split(',').map(o => o.trim()) : [],
            isRequired,
            visibility
        };

        try {
            if (editingField) {
                await api.put(`/contact-fields/${editingField.id}`, payload);
            } else {
                await api.post('/contact-fields', payload);
            }
            setShowModal(false);
            resetForm();
            fetchFields();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message));
        }
    };

    const resetForm = () => {
        setName('');
        setKey('');
        setFieldType('TEXT');
        setOptions('');
        setIsRequired(false);
        setVisibility('PUBLIC');
        setEditingField(null);
    };

    const handleEdit = (field) => {
        setEditingField(field);
        setName(field.name);
        setKey(field.key);
        setFieldType(field.fieldType);
        setOptions(field.options?.join(', ') || '');
        setIsRequired(field.isRequired);
        setVisibility(field.visibility);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will hide the field from all contact profiles.')) return;
        try {
            await api.delete(`/contact-fields/${id}`);
            fetchFields();
        } catch (error) {
            alert('Error deleting field');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Contact Fields</h1>
                    <p className="text-zinc-500 text-sm font-medium">Define custom data fields for your CRM</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-premium flex items-center gap-2"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Custom Field
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Field Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Key</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Type</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Visibility</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-12 text-zinc-500">Loading fields...</td></tr>
                        ) : fields.map(field => (
                            <tr key={field.id} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Bars3BottomLeftIcon className="h-4 w-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white tracking-tight">{field.name}</p>
                                            {field.isRequired && <p className="text-[10px] text-indigo-400 font-bold uppercase italic">Required</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                                    {field.key}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-1 rounded-full text-zinc-300">
                                        {field.fieldType}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${field.visibility === 'PUBLIC' ? 'text-green-400' : 'text-amber-400'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${field.visibility === 'PUBLIC' ? 'bg-green-400' : 'bg-amber-400'}`} />
                                        {field.visibility}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {field.isDefault ? (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2.5 py-1 rounded-lg italic">System</span>
                                    ) : (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border border-white/5 px-2.5 py-1 rounded-lg italic">Custom</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {!field.isDefault && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(field)}
                                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                            >
                                                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(field.id)}
                                                className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg relative isolate overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-white/5 bg-zinc-900/50">
                            <h2 className="text-xl font-black text-white italic tracking-tight uppercase">
                                {editingField ? 'Edit Contact Field' : 'Add Custom Field'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Field Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Company Name"
                                        className="glass-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Database Key (unique)</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingField}
                                        value={key}
                                        onChange={(e) => setKey(e.target.value)}
                                        placeholder="company_name"
                                        className="glass-input font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Field Type</label>
                                    <select
                                        value={fieldType}
                                        onChange={(e) => setFieldType(e.target.value)}
                                        className="glass-input appearance-none bg-zinc-800"
                                    >
                                        <option value="TEXT">Text</option>
                                        <option value="NUMBER">Number</option>
                                        <option value="DATE">Date</option>
                                        <option value="LIST">Dropdown List</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Visibility</label>
                                    <select
                                        value={visibility}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="glass-input appearance-none bg-zinc-800"
                                    >
                                        <option value="PUBLIC">Public</option>
                                        <option value="INTERNAL">Internal Only (Restricted)</option>
                                    </select>
                                </div>
                            </div>

                            {fieldType === 'LIST' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Options (comma separated)</label>
                                    <input
                                        type="text"
                                        required
                                        value={options}
                                        onChange={(e) => setOptions(e.target.value)}
                                        placeholder="Retail, Wholesale, Enterprise"
                                        className="glass-input"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isRequired"
                                    checked={isRequired}
                                    onChange={(e) => setIsRequired(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                                />
                                <label htmlFor="isRequired" className="text-sm font-bold text-zinc-300">Mark as Mandatory Field</label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-glass flex-1">Cancel</button>
                                <button type="submit" className="btn-premium flex-1">Save Field</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
