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
  keyword: { label: 'Keyword', icon: KeyIcon, color: 'bg-blue-100 text-blue-800' },
  any_message: { label: 'Any Message', icon: ChatBubbleLeftRightIcon, color: 'bg-green-100 text-green-800' },
  welcome: { label: 'Welcome', icon: HandRaisedIcon, color: 'bg-purple-100 text-purple-800' }
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
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-500 mt-1">Set up auto-replies based on keywords, or welcome new contacts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Automation
        </button>
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <div className="card text-center py-12">
          <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No automations yet</h3>
          <p className="text-gray-400 mb-6">Create your first automation rule to auto-reply to messages.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Automation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {automations.map(automation => {
            const trigger = triggerTypeLabels[automation.triggerType] || triggerTypeLabels.keyword;
            const TriggerIcon = trigger.icon;

            return (
              <div key={automation.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trigger.color}`}>
                          <TriggerIcon className="h-3 w-3" />
                          {trigger.label}
                        </span>
                        {automation.triggerType === 'keyword' && automation.triggerValue && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                            "{automation.triggerValue}"
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Instance: <span className="font-medium text-gray-700">{automation.instance?.instanceName || 'Unknown'}</span>
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{automation.responseText}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(automation)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          automation.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          automation.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(automation)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Automation' : 'New Automation'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Price inquiry auto-reply"
                  required
                />
              </div>

              {/* Instance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Instance</label>
                <select
                  value={form.instanceId}
                  onChange={(e) => setForm({ ...form, instanceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select instance...</option>
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.instanceName}</option>
                  ))}
                </select>
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm({ ...form, triggerType: e.target.value, triggerValue: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="keyword">🔑 Keyword - Reply when message contains a keyword</option>
                  <option value="any_message">💬 Any Message - Reply to every incoming message</option>
                  <option value="welcome">👋 Welcome - Greet new contacts on first message</option>
                </select>
              </div>

              {/* Keyword Value */}
              {form.triggerType === 'keyword' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                  <input
                    type="text"
                    value={form.triggerValue}
                    onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder='e.g. "price" or "menu"'
                    required
                  />
                  <p className="mt-1 text-xs text-gray-400">Case-insensitive. Triggers if message contains this keyword.</p>
                </div>
              )}

              {/* Response Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Reply Message</label>
                <textarea
                  value={form.responseText}
                  onChange={(e) => setForm({ ...form, responseText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="The message to send automatically..."
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
