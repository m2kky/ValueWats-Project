import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, TrashIcon,
  FunnelIcon, TagIcon, UserCircleIcon, BookmarkIcon
} from '@heroicons/react/24/outline';

const SOURCES = ['manual', 'whatsapp', 'import', 'website'];

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stages, setStages] = useState([]);
  const [labels, setLabels] = useState([]);
  const [filters, setFilters] = useState({ lifecycleStageId: '', labelIds: [], governorate: '', source: '' });
  const [selected, setSelected] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showBulkTagMenu, setShowBulkTagMenu] = useState(false);
  const [showBulkStageMenu, setShowBulkStageMenu] = useState(false);
  const [showSaveSegmentModal, setShowSaveSegmentModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [newContact, setNewContact] = useState({ phoneNumber: '', name: '', email: '', governorate: '' });
  const [newLabel, setNewLabel] = useState({ name: '', color: '#6366f1' });
  const LIMIT = 50;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, search: search || undefined };
      if (filters.lifecycleStageId) params.lifecycleStageId = filters.lifecycleStageId;
      if (filters.governorate) params.governorate = filters.governorate;
      if (filters.source) params.source = filters.source;
      if (filters.labelIds.length > 0) params.labelIds = filters.labelIds;
      const res = await api.get('/contacts', { params });
      setContacts(res.data.contacts);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  useEffect(() => {
    api.get('/lifecycle').then(r => setStages(r.data)).catch(() => { });
    api.get('/contacts/labels').then(r => setLabels(r.data)).catch(() => { });
  }, []);

  const handleCreate = async () => {
    if (!newContact.phoneNumber) return;
    try {
      await api.post('/contacts', newContact);
      setShowAddModal(false);
      setNewContact({ phoneNumber: '', name: '', email: '', governorate: '' });
      fetchContacts();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create contact');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await api.delete(`/contacts/${id}`);
    fetchContacts();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} contacts?`)) return;
    await Promise.all([...selected].map(id => api.delete(`/contacts/${id}`)));
    setSelected(new Set());
    fetchContacts();
  };

  const handleBulkAssignLabel = async (labelId) => {
    try {
      await Promise.all([...selected].map(id => api.post(`/contacts/${id}/labels`, { labelId })));
      setShowBulkTagMenu(false);
      setSelected(new Set());
      fetchContacts();
    } catch (e) { console.error(e); }
  };

  const handleBulkChangeStage = async (stageId) => {
    try {
      await Promise.all([...selected].map(id => api.put(`/contacts/${id}`, { lifecycleStageId: stageId })));
      setShowBulkStageMenu(false);
      setSelected(new Set());
      fetchContacts();
    } catch (e) { console.error(e); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/contacts/import', form);
      alert(`Imported: ${res.data.created} created, ${res.data.updated} updated, ${res.data.failed} failed`);
      fetchContacts();
    } catch (err) {
      alert('Import failed');
    }
    e.target.value = '';
  };

  const handleCreateLabel = async () => {
    if (!newLabel.name) return;
    try {
      const res = await api.post('/contacts/labels', newLabel);
      setLabels(l => [...l, res.data]);
      setNewLabel({ name: '', color: '#6366f1' });
      setShowLabelModal(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed');
    }
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) return alert("Enter a name for the segment.");
    try {
      const rules = {
        filters,
        search
      };
      await api.post('/segments', { name: segmentName, rules });
      setShowSaveSegmentModal(false);
      setSegmentName('');
      alert("Segment saved successfully.");
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save segment.');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map(c => c.id)));
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Contacts</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-500 text-sm">{total.toLocaleString()} contacts</p>
            <span className="text-zinc-700">•</span>
            <a href="/help/contacts" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
              How to manage
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLabelModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-xs font-black uppercase tracking-widest transition-all">
            <TagIcon className="w-4 h-4" /> Labels
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
            <ArrowUpTrayIcon className="w-4 h-4" /> Import
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            <PlusIcon className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, phone, email..."
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
          />
        </div>
        <select
          value={filters.lifecycleStageId}
          onChange={e => { setFilters(f => ({ ...f, lifecycleStageId: e.target.value })); setPage(1); }}
          className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
        >
          <option value="">All Stages</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
        </select>
        <select
          value={filters.source}
          onChange={e => { setFilters(f => ({ ...f, source: e.target.value })); setPage(1); }}
          className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
        >
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Save Segment Trigger */}
        {(filters.lifecycleStageId || filters.source || filters.governorate || filters.labelIds.length > 0 || search) && (
          <button onClick={() => setShowSaveSegmentModal(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-sm font-bold uppercase tracking-widest transition-all">
            <BookmarkIcon className="w-4 h-4" /> Save Segment
          </button>
        )}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/30">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{selected.size} selected</span>
            <div className="w-px h-5 bg-white/10" />
            <div className="relative">
              <button onClick={() => setShowBulkTagMenu(!showBulkTagMenu)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:bg-white/5 transition-all">+ Tag</button>
              {showBulkTagMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                  {labels.map(l => (
                    <button key={l.id} onClick={() => handleBulkAssignLabel(l.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5 transition-all text-left">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowBulkStageMenu(!showBulkStageMenu)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:bg-white/5 transition-all">Stage</button>
              {showBulkStageMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                  {stages.map(s => (
                    <button key={s.id} onClick={() => handleBulkChangeStage(s.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5 transition-all text-left">
                      {s.emoji} {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all">Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-4 text-left w-10">
                <input type="checkbox" checked={selected.size === contacts.length && contacts.length > 0} onChange={toggleAll} className="rounded" />
              </th>
              <th className="p-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact</th>
              <th className="p-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone</th>
              <th className="p-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stage</th>
              <th className="p-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Labels</th>
              <th className="p-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Source</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-zinc-500">
                <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No contacts yet</p>
              </td></tr>
            ) : contacts.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer" onClick={() => navigate(`/contacts/${c.id}`)}>
                <td className="p-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                      {(c.name || c.phoneNumber)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{c.name || '—'}</p>
                      <p className="text-xs text-zinc-500">{c.email || ''}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-zinc-300 font-mono">{c.phoneNumber}</td>
                <td className="p-4">
                  {c.lifecycleStage ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: (c.lifecycleStage.color || '#6366f1') + '20', color: c.lifecycleStage.color || '#6366f1' }}>
                      {c.lifecycleStage.emoji} {c.lifecycleStage.name}
                    </span>
                  ) : <span className="text-zinc-600 text-xs">—</span>}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {c.labels.slice(0, 3).map(a => (
                      <span key={a.label.id} className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: a.label.color + '20', color: a.label.color }}>
                        {a.label.name}
                      </span>
                    ))}
                    {c.labels.length > 3 && <span className="text-zinc-500 text-xs">+{c.labels.length - 3}</span>}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs text-zinc-500 capitalize">{c.source}</span>
                </td>
                <td className="p-4" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 text-zinc-600 transition-all">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-zinc-400 disabled:opacity-30 hover:bg-white/10 transition-all">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-zinc-400 disabled:opacity-30 hover:bg-white/10 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 bg-zinc-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-black text-white">Add Contact</h2>
            {[
              { label: 'Phone Number *', key: 'phoneNumber', placeholder: '201234567890' },
              { label: 'Name', key: 'name', placeholder: 'Full name' },
              { label: 'Email', key: 'email', placeholder: 'email@example.com' },
              { label: 'Governorate', key: 'governorate', placeholder: 'Cairo' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{f.label}</label>
                <input
                  value={newContact[f.key]}
                  onChange={e => setNewContact(n => ({ ...n, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 bg-zinc-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-black text-white">Manage Labels</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {labels.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-sm text-white">{l.name}</span>
                    <span className="text-xs text-zinc-500">({l._count?.assignments || 0})</span>
                  </div>
                  <button onClick={async () => { await api.delete(`/contacts/labels/${l.id}`); setLabels(ls => ls.filter(x => x.id !== l.id)); }} className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newLabel.name} onChange={e => setNewLabel(n => ({ ...n, name: e.target.value }))} placeholder="Label name" className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30" />
              <input type="color" value={newLabel.color} onChange={e => setNewLabel(n => ({ ...n, color: e.target.value }))} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 cursor-pointer" />
              <button onClick={handleCreateLabel} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all">Add</button>
            </div>
            <button onClick={() => setShowLabelModal(false)} className="w-full py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">Close</button>
          </div>
        </div>
      )}

      {/* Save Segment Modal */}
      {showSaveSegmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 bg-zinc-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-black text-white">Save View as Segment</h2>
            <p className="text-zinc-500 text-sm">You can quickly reuse this exact set of filters for broadcasting campaigns.</p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Segment Name</label>
              <input 
                value={segmentName} 
                onChange={e => setSegmentName(e.target.value)} 
                placeholder="e.g. VIP Customers from Cairo" 
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30" 
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSaveSegmentModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleSaveSegment} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all">Save Segment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
