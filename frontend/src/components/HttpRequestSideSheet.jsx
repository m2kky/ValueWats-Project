import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import RichTextarea from './RichTextarea';

export default function HttpRequestSideSheet({
    isOpen,
    onClose,
    action,
    onSave,
    availableTags,
    availableAgents
}) {
    const [formData, setFormData] = useState({
        name: '',
        instructions: '',
        method: 'POST',
        url: '',
        headers: [{ key: '', value: '' }],
        params: [{ key: '', value: '' }],
        body: '',
        auth: { type: 'none', token: '' }
    });

    useEffect(() => {
        if (action) {
            setFormData({
                ...action,
                headers: action.headers?.length ? action.headers : [{ key: '', value: '' }],
                params: action.params?.length ? action.params : [{ key: '', value: '' }],
            });
        } else {
            setFormData({
                name: '',
                instructions: '',
                method: 'POST',
                url: '',
                headers: [{ key: '', value: '' }],
                params: [{ key: '', value: '' }],
                body: '',
                auth: { type: 'none', token: '' }
            });
        }
    }, [action, isOpen]);

    if (!isOpen) return null;

    const handleAddField = (type) => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], { key: '', value: '' }]
        }));
    };

    const handleRemoveField = (type, index) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleFieldChange = (type, index, keyOrValue, val) => {
        setFormData(prev => {
            const newList = [...prev[type]];
            newList[index] = { ...newList[index], [keyOrValue]: val };
            return { ...prev, [type]: newList };
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-2xl bg-[#08080a] border-l border-white/10 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 ease-out">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight italic uppercase">CONSTRUCT HTTP ACTION</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(71,37,244,0.5)]"></span>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">NETWORK INTERFACE PROTOCOL</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                    {/* Identity */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">ACTION IDENTITY</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">Callsign (Internal Name)</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-bold"
                                    placeholder="e.g. GET_CRM_DATA"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                                    When and how should this action be performed?
                                </label>
                                <RichTextarea
                                    value={formData.instructions}
                                    onChange={val => setFormData({ ...formData, instructions: val })}
                                    placeholder="Tell the AI what conditions trigger this and what parameters to collect..."
                                    mentions={availableAgents}
                                    tags={availableTags}
                                    showTags={true}
                                    showMentions={true}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Configuration */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">INTERFACE CONFIG</h3>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">Method</label>
                                <select
                                    value={formData.method}
                                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-black cursor-pointer"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                    <option value="PATCH">PATCH</option>
                                </select>
                            </div>
                            <div className="col-span-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block">Endpoint URL</label>
                                <input
                                    type="text"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-mono"
                                    placeholder="https://api.external.com/v1/..."
                                />
                            </div>
                        </div>

                        {/* Headers */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Headers</label>
                                <button
                                    onClick={() => handleAddField('headers')}
                                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase transition-colors"
                                >
                                    <PlusIcon className="h-3 w-3" /> Add Header
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.headers.map((h, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <input
                                            type="text"
                                            value={h.key}
                                            onChange={e => handleFieldChange('headers', i, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500/20 font-mono"
                                        />
                                        <input
                                            type="text"
                                            value={h.value}
                                            onChange={e => handleFieldChange('headers', i, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500/20 font-mono"
                                        />
                                        <button
                                            onClick={() => handleRemoveField('headers', i)}
                                            className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Params */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Query Parameters</label>
                                <button
                                    onClick={() => handleAddField('params')}
                                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase transition-colors"
                                >
                                    <PlusIcon className="h-3 w-3" /> Add Param
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.params.map((p, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <input
                                            type="text"
                                            value={p.key}
                                            onChange={e => handleFieldChange('params', i, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500/20 font-mono"
                                        />
                                        <input
                                            type="text"
                                            value={p.value}
                                            onChange={e => handleFieldChange('params', i, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500/20 font-mono"
                                        />
                                        <button
                                            onClick={() => handleRemoveField('params', i)}
                                            className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        {(formData.method !== 'GET') && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Request Body (JSON)</label>
                                <textarea
                                    value={formData.body}
                                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                                    rows={6}
                                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-xl p-4 text-xs text-indigo-300 outline-none focus:border-indigo-500/30 font-mono custom-scrollbar"
                                    placeholder={`{\n  "email": "{{contact.email}}",\n  "amount": "{{agent.amount}}"\n}`}
                                />
                            </div>
                        )}
                    </section>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-4 backdrop-blur-sm">
                        <InformationCircleIcon className="h-5 w-5 text-indigo-400 shrink-0" />
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                            Use <code className="text-indigo-400">{`{{contact.field}}`}</code> or <code className="text-indigo-400">{`{{agent.variable}}`}</code> for dynamic values.
                            The agent will automatically interpret JSON responses from this endpoint.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/5 bg-zinc-950/40 backdrop-blur-xl flex justify-end gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-all"
                    >
                        DISCARD
                    </button>
                    <button
                        onClick={() => { onSave(formData); onClose(); }}
                        disabled={!formData.name || !formData.url}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-8 py-2.5 rounded-xl text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        SAVE CONFIG
                    </button>
                </div>
            </div>
        </div>
    );
}
