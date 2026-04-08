import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/client';
import ValueWatsLoader from '../../components/ValueWatsLoader';
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';

const INITIAL_FORM = {
  name: '',
  price: '',
  maxMessagesPerDay: 200,
  maxContactsPerCampaign: 300,
  maxInstances: 1,
  workingHoursEnabled: false,
  workingHoursStart: '09:00',
  workingHoursEnd: '22:00',
  workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat'
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    fetchPlans();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.price) - Number(b.price)),
    [plans]
  );

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/plans');
      setPlans(res.data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      alert(error.response?.data?.error || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPlanId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const openEdit = (plan) => {
    setEditingPlanId(plan.id);
    setForm({
      name: plan.name || '',
      price: String(plan.price ?? ''),
      maxMessagesPerDay: plan.maxMessagesPerDay,
      maxContactsPerCampaign: plan.maxContactsPerCampaign,
      maxInstances: plan.maxInstances,
      workingHoursEnabled: Boolean(plan.workingHoursEnabled),
      workingHoursStart: plan.workingHoursStart || '09:00',
      workingHoursEnd: plan.workingHoursEnd || '22:00',
      workingDays: Array.isArray(plan.workingDays) ? plan.workingDays.join(',') : 'Mon,Tue,Wed,Thu,Fri,Sat'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPlanId(null);
    setForm(INITIAL_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim().toLowerCase(),
      price: Number(form.price),
      maxMessagesPerDay: Number(form.maxMessagesPerDay),
      maxContactsPerCampaign: Number(form.maxContactsPerCampaign),
      maxInstances: Number(form.maxInstances),
      workingHoursEnabled: Boolean(form.workingHoursEnabled),
      workingHoursStart: form.workingHoursStart,
      workingHoursEnd: form.workingHoursEnd,
      workingDays: form.workingDays
        .split(',')
        .map((day) => day.trim())
        .filter(Boolean)
    };

    if (!payload.name) {
      alert('Plan name is required');
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      alert('Price must be zero or a positive number');
      return;
    }

    setSaving(true);
    try {
      if (editingPlanId) {
        await apiClient.put(`/api/admin/plans/${editingPlanId}`, payload);
      } else {
        await apiClient.post('/api/admin/plans', payload);
      }

      resetForm();
      await fetchPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert(error.response?.data?.error || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans</h1>
          <p className="text-zinc-400 text-sm mt-1">Create and manage pricing tiers, limits, and working-hour rules.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          Create New Plan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{editingPlanId ? 'Edit Plan' : 'Create Plan'}</h2>
            <button type="button" onClick={resetForm} className="text-zinc-400 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm text-zinc-300">
              <span>Plan Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
                placeholder="basic / pro / enterprise"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Price (Monthly)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Max Messages / Day</span>
              <input
                type="number"
                min="1"
                value={form.maxMessagesPerDay}
                onChange={(e) => setForm((prev) => ({ ...prev, maxMessagesPerDay: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Max Contacts / Campaign</span>
              <input
                type="number"
                min="1"
                value={form.maxContactsPerCampaign}
                onChange={(e) => setForm((prev) => ({ ...prev, maxContactsPerCampaign: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Max Channels</span>
              <input
                type="number"
                min="1"
                value={form.maxInstances}
                onChange={(e) => setForm((prev) => ({ ...prev, maxInstances: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Working Days (comma-separated)</span>
              <input
                value={form.workingDays}
                onChange={(e) => setForm((prev) => ({ ...prev, workingDays: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
                placeholder="Mon,Tue,Wed,Thu,Fri"
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Working Hours Start</span>
              <input
                type="time"
                value={form.workingHoursStart}
                onChange={(e) => setForm((prev) => ({ ...prev, workingHoursStart: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span>Working Hours End</span>
              <input
                type="time"
                value={form.workingHoursEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, workingHoursEnd: e.target.value }))}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.workingHoursEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, workingHoursEnabled: e.target.checked }))}
              className="rounded border-white/20 bg-[#1c1f26]"
            />
            Enable working-hour sending windows for this plan
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12"><ValueWatsLoader size={40} /></div>
        ) : sortedPlans.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-zinc-500 bg-white/5 rounded-2xl border border-white/5">
            No plans found in database. Create your first plan to activate billing limits.
          </div>
        ) : sortedPlans.map((plan) => (
          <div key={plan.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden flex flex-col group">
            <div className="p-6 border-b border-white/5 bg-black/20">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                <button
                  onClick={() => openEdit(plan)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black text-white">${plan.price}</span>
                <span className="text-sm text-zinc-500 ml-1">/mo</span>
              </div>
            </div>
            <div className="p-6 flex-1 bg-[#1c1f26]/30">
              <ul className="space-y-3">
                <li className="flex justify-between text-sm">
                  <span className="text-zinc-400">Daily Messages</span>
                  <span className="text-white font-bold">{plan.maxMessagesPerDay}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-zinc-400">Max Contacts</span>
                  <span className="text-white font-bold">{plan.maxContactsPerCampaign}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-zinc-400">Max Channels</span>
                  <span className="text-white font-bold">{plan.maxInstances}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-zinc-400">Working Hours</span>
                  <span className="text-white font-bold">
                    {plan.workingHoursEnabled ? `${plan.workingHoursStart} - ${plan.workingHoursEnd}` : 'Disabled'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
