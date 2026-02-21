import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  BoltIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  KeyIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';

const triggerTypeLabels = {
  keyword: { label: 'Keyword', icon: KeyIcon, color: 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]' },
  any_message: { label: 'Any Message', icon: ChatBubbleLeftRightIcon, color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
  welcome: { label: 'Welcome', icon: HandRaisedIcon, color: 'text-purple-400 bg-purple-500/10 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' }
};

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    instanceId: '',
    triggerType: 'keyword',
    triggerValue: '',
    responseText: ''
  });

  useEffect(() => {
    fetchAutomations();
    fetchInstances();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await api.get('/automations');
      setAutomations(response.data.automations);
    } catch (error) {
      console.error('Failed to fetch automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await api.get('/instances');
      setInstances(response.data.instances || []);
    } catch (error) {
      console.error('Failed to fetch instances:', error);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name: '', instanceId: '', triggerType: 'keyword', triggerValue: '', responseText: '' });
    setShowModal(true);
  };

  const openEditModal = (automation) => {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      instanceId: automation.instanceId,
      triggerType: automation.triggerType,
      triggerValue: automation.triggerValue || '',
      responseText: automation.responseText
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/automations/${editingId}`, form);
      } else {
        await api.post('/automations', form);
      }
      setShowModal(false);
      fetchAutomations();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save automation');
    }
  };

  const handleToggle = async (automation) => {
    try {
      await api.put(`/automations/${automation.id}`, { isActive: !automation.isActive });
      fetchAutomations();
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await api.delete(`/automations/${id}`);
      fetchAutomations();
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="font-sans relative">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white sm:text-3xl sm:truncate tracking-tight uppercase italic">
            Automations
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400 font-medium tracking-wide">
            Set up auto-replies based on keywords, or welcome new contacts
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <button
            onClick={openCreateModal}
            className="btn-premium flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5 border-2 border-white/20 rounded-full p-0.5" />
            New Automation
          </button>
        </div>
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <div className="glass-card text-center py-20 px-6">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <BoltIcon className="h-8 w-8 text-zinc-500" />
          </div>
          <h3 className="mt-4 text-sm font-black text-white uppercase tracking-widest italic">No automations yet</h3>
          <p className="mt-2 mb-8 text-sm text-zinc-400">Create your first automation rule to auto-reply to messages.</p>
          <button
            onClick={openCreateModal}
            className="btn-glass inline-flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Automation
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {automations.map(automation => {
            const trigger = triggerTypeLabels[automation.triggerType] || triggerTypeLabels.keyword;
            const TriggerIcon = trigger.icon;

            return (
              <div key={automation.id} className="glass-card overflow-hidden group hover:-translate-y-1 transition-transform duration-300 relative">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 bg-white"></div>
                <div className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-bold text-white tracking-tight truncate">{automation.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${trigger.color}`}>
                        <TriggerIcon className="h-3.5 w-3.5" />
                        {trigger.label}
                      </span>
                      {automation.triggerType === 'keyword' && automation.triggerValue && (
                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-xs font-mono shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                          "{automation.triggerValue}"
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Instance: <span className="text-indigo-400">{automation.instance?.instanceName || 'Unknown'}</span>
                    </p>

                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{automation.responseText}</p>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-3 md:ml-4 shrink-0">
                    <button
                      onClick={() => handleToggle(automation)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-inner ${automation.isActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 border border-white/5'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${automation.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(automation)}
                        className="p-2.5 bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="p-2.5 bg-white/5 border border-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal (Premium Form) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg relative isolate overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
              <h2 className="text-xl font-black text-white italic tracking-tight uppercase">
                {editingId ? 'Edit Automation' : 'New Automation'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass-input"
                  placeholder="e.g. Price inquiry auto-reply"
                  required
                />
              </div>

              {/* Instance */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">WhatsApp Instance</label>
                <select
                  value={form.instanceId}
                  onChange={(e) => setForm({ ...form, instanceId: e.target.value })}
                  className="glass-input appearance-none bg-zinc-900 cursor-pointer"
                  required
                >
                  <option value="" className="text-zinc-500">Select instance...</option>
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id} className="text-white bg-zinc-800">{inst.instanceName}</option>
                  ))}
                </select>
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Trigger Type</label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm({ ...form, triggerType: e.target.value, triggerValue: '' })}
                  className="glass-input appearance-none bg-zinc-900 cursor-pointer"
                >
                  <option value="keyword" className="text-white bg-zinc-800">🔑 Keyword - Reply when message contains a keyword</option>
                  <option value="any_message" className="text-white bg-zinc-800">💬 Any Message - Reply to every incoming message</option>
                  <option value="welcome" className="text-white bg-zinc-800">👋 Welcome - Greet new contacts on first message</option>
                </select>
              </div>

              {/* Keyword Value */}
              {form.triggerType === 'keyword' && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Keyword</label>
                  <input
                    type="text"
                    value={form.triggerValue}
                    onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
                    className="glass-input"
                    placeholder='e.g. "price" or "menu"'
                    required
                  />
                  <p className="mt-2 text-xs text-zinc-500">Case-insensitive. Triggers if message contains this keyword.</p>
                </div>
              )}

              {/* Response Text */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Auto-Reply Message</label>
                <textarea
                  value={form.responseText}
                  onChange={(e) => setForm({ ...form, responseText: e.target.value })}
                  className="glass-input resize-y min-h-[100px]"
                  rows={4}
                  placeholder="The message to send automatically..."
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-glass"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-premium"
                >
                  {editingId ? 'Save Changes' : 'Create Automation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
