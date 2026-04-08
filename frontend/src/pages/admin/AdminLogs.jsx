import React, { useEffect, useMemo, useState } from 'react';
import {
  BellAlertIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../api/client';
import ValueWatsLoader from '../../components/ValueWatsLoader';

const TYPE_STYLES = {
  info: 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  warning: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  error: 'text-rose-300 bg-rose-400/10 border-rose-400/20',
  success: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20'
};

const EMPTY_FORM = {
  title: '',
  message: '',
  type: 'info',
  isActive: true,
  expiresAt: ''
};

export default function AdminLogs() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const activeCount = useMemo(
    () => notifications.filter((n) => n.isActive && (!n.expiresAt || new Date(n.expiresAt) > new Date())).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/notifications');
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      alert(error.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (notification) => {
    setEditingId(notification.id);
    setForm({
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      isActive: Boolean(notification.isActive),
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toISOString().slice(0, 16) : ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      alert('Title and message are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null
      };

      if (editingId) {
        await apiClient.put(`/api/admin/notifications/${editingId}`, payload);
      } else {
        await apiClient.post('/api/admin/notifications', payload);
      }

      resetForm();
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to save notification:', error);
      alert(error.response?.data?.error || 'Failed to save notification');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await apiClient.patch(`/api/admin/notifications/${id}/toggle`);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to toggle notification:', error);
      alert(error.response?.data?.error || 'Failed to toggle notification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;

    try {
      await apiClient.delete(`/api/admin/notifications/${id}`);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert(error.response?.data?.error || 'Failed to delete notification');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Global Notifications</h1>
          <p className="text-zinc-400 text-sm mt-1">Broadcast updates to all active workspaces from one place.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-sm font-semibold">
          <CheckCircleIcon className="w-4 h-4" />
          {activeCount} active
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Notification' : 'Create Notification'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-zinc-400 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
              required
            />
          </label>

          <label className="space-y-2 text-sm text-zinc-300">
            <span>Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
          </label>
        </div>

        <label className="space-y-2 text-sm text-zinc-300 block">
          <span>Message</span>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Expiry (optional)</span>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-300 pt-8">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-white/20 bg-[#1c1f26]"
            />
            Publish immediately
          </label>
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Notification' : 'Create Notification'}
          </button>
        </div>
      </form>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><ValueWatsLoader size={38} /></div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-zinc-500">No global notifications yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => {
              const typeClass = TYPE_STYLES[notification.type] || TYPE_STYLES.info;
              const expired = Boolean(notification.expiresAt && new Date(notification.expiresAt) <= new Date());

              return (
                <div key={notification.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center ${typeClass}`}>
                      {notification.type === 'warning' && <ExclamationTriangleIcon className="w-4 h-4" />}
                      {notification.type === 'error' && <XMarkIcon className="w-4 h-4" />}
                      {notification.type === 'success' && <CheckCircleIcon className="w-4 h-4" />}
                      {notification.type === 'info' && <InformationCircleIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold">{notification.title}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${typeClass}`}>{notification.type}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${notification.isActive ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10' : 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10'}`}>
                          {notification.isActive ? 'active' : 'inactive'}
                        </span>
                        {expired && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border text-rose-300 border-rose-400/20 bg-rose-400/10">
                            expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{notification.message}</p>
                      <p className="text-[11px] text-zinc-500 mt-2">
                        Created: {new Date(notification.createdAt).toLocaleString()} {notification.expiresAt ? `• Expires: ${new Date(notification.expiresAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(notification.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-zinc-200 hover:bg-white/10"
                    >
                      {notification.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => startEdit(notification)}
                      className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500 flex items-center gap-2">
        <BellAlertIcon className="w-4 h-4" />
        Notifications appear in-app for all authenticated users and can be dismissed per user.
      </div>
    </div>
  );
}
