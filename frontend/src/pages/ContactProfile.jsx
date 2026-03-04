import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  ArrowLeftIcon, PencilIcon, CheckIcon, XMarkIcon,
  PlusIcon, TrashIcon, ChatBubbleLeftRightIcon,
  ClockIcon, TagIcon, ArrowPathIcon,
  UserIcon, BoltIcon,
} from '@heroicons/react/24/outline';

const GENDERS = ['male', 'female'];
const SOURCES = ['manual', 'whatsapp', 'import', 'website'];

export default function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [stages, setStages] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});

  useEffect(() => {
    Promise.all([
      api.get(`/contacts/${id}`),
      api.get('/lifecycle'),
      api.get('/contacts/labels'),
    ]).then(([c, s, l]) => {
      setContact(c.data);
      setForm(buildForm(c.data));
      setStages(s.data);
      setAllLabels(l.data);
    }).catch(() => navigate('/contacts'))
      .finally(() => setLoading(false));

    // Fetch custom field definitions
    api.get('/contact-fields').then(r => {
      setCustomFieldDefs(r.data || []);
    }).catch(() => { });

    // Fetch custom field values for the contact
    api.get(`/contacts/${id}/fields`).then(r => {
      const vals = {};
      (r.data || []).forEach(f => { vals[f.fieldName] = f.fieldValue; });
      setCustomFieldValues(vals);
    }).catch(() => { });
  }, [id]);

  const buildForm = (c) => ({
    name: c.name || '',
    email: c.email || '',
    gender: c.gender || '',
    governorate: c.governorate || '',
    district: c.district || '',
    address: c.address || '',
    source: c.source || 'manual',
    lifecycleStageId: c.lifecycleStageId || '',
    labelIds: c.labels.map(a => a.label.id),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/contacts/${id}`, form);
      setContact(c => ({ ...c, ...res.data }));
      setEditing(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    const res = await api.post(`/contacts/${id}/notes`, { content: noteText });
    setContact(c => ({ ...c, notes: [res.data, ...c.notes] }));
    setNoteText('');
  };

  const handleDeleteNote = async (noteId) => {
    await api.delete(`/contacts/${id}/notes/${noteId}`);
    setContact(c => ({ ...c, notes: c.notes.filter(n => n.id !== noteId) }));
  };

  const toggleLabel = (labelId) => {
    setForm(f => ({
      ...f,
      labelIds: f.labelIds.includes(labelId)
        ? f.labelIds.filter(l => l !== labelId)
        : [...f.labelIds, labelId],
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>;
  if (!contact) return null;

  const currentLabels = contact.labels.map(a => a.label);
  const currentStage = contact.lifecycleStage;

  return (
    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/contacts')} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">{contact.name || contact.phoneNumber}</h1>
          <p className="text-zinc-500 text-sm">{contact.phoneNumber}</p>
        </div>
        <div className="flex gap-3">
          {contact.conversation && (
            <button onClick={() => navigate(`/inbox?conversation=${contact.conversation.id}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all">
              <ChatBubbleLeftRightIcon className="w-4 h-4" /> Open Chat
            </button>
          )}
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm(buildForm(contact)); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-xs font-black uppercase tracking-widest transition-all">
                <XMarkIcon className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50">
                <CheckIcon className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              <PencilIcon className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Contact Info */}
        <div className="col-span-2 space-y-6">
          <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Name', key: 'name' },
                { label: 'Email', key: 'email' },
                { label: 'Governorate', key: 'governorate' },
                { label: 'District', key: 'district' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{f.label}</label>
                  {editing ? (
                    <input value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                      className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30" />
                  ) : (
                    <p className="mt-1 text-sm text-white">{contact[f.key] || <span className="text-zinc-600">—</span>}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gender</label>
                {editing ? (
                  <select value={form.gender} onChange={e => setForm(x => ({ ...x, gender: e.target.value }))}
                    className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30">
                    <option value="">—</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-white capitalize">{contact.gender || <span className="text-zinc-600">—</span>}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Source</label>
                {editing ? (
                  <select value={form.source} onChange={e => setForm(x => ({ ...x, source: e.target.value }))}
                    className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-white capitalize">{contact.source}</p>
                )}
              </div>
            </div>
            {editing && (
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Address</label>
                <textarea value={form.address} onChange={e => setForm(x => ({ ...x, address: e.target.value }))} rows={2}
                  className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30 resize-none" />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notes</h2>
            <div className="flex gap-2">
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note..."
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30" />
              <button onClick={handleAddNote} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {contact.notes.length === 0 && <p className="text-zinc-600 text-sm">No notes yet</p>}
              {contact.notes.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <p className="flex-1 text-sm text-zinc-300">{n.content}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-600">{new Date(n.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => handleDeleteNote(n.id)} className="text-zinc-600 hover:text-rose-400 transition-colors">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <ClockIcon className="w-4 h-4" /> Activity Timeline
            </h2>
            {(!contact.activityLogs || contact.activityLogs.length === 0) ? (
              <div className="text-center py-6">
                <ClockIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">No activity recorded yet</p>
                <p className="text-zinc-700 text-xs">Changes to lifecycle stages, labels, and assignments will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 relative pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5 before:rounded-full">
                {contact.activityLogs.map(log => {
                  const actionIcons = {
                    lifecycle_change: <ArrowPathIcon className="w-3.5 h-3.5" />,
                    label_added: <TagIcon className="w-3.5 h-3.5" />,
                    label_removed: <TagIcon className="w-3.5 h-3.5" />,
                    assigned: <UserIcon className="w-3.5 h-3.5" />,
                    closed: <CheckIcon className="w-3.5 h-3.5" />,
                    note_added: <PencilIcon className="w-3.5 h-3.5" />,
                  };
                  const icon = actionIcons[log.actionType] || <BoltIcon className="w-3.5 h-3.5" />;
                  return (
                    <div key={log.id} className="flex items-start gap-3 relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300">{log.description}</p>
                        <p className="text-xs text-zinc-600">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Custom Fields */}
          {customFieldDefs.length > 0 && (
            <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-4">
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Custom Fields</h2>
              <div className="grid grid-cols-2 gap-4">
                {customFieldDefs.map(def => (
                  <div key={def.id}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{def.name}</label>
                    {editing ? (
                      def.fieldType === 'LIST' ? (
                        <select
                          value={customFieldValues[def.key] || ''}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [def.key]: e.target.value }))}
                          className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                        >
                          <option value="">—</option>
                          {(def.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={def.fieldType === 'NUMBER' ? 'number' : def.fieldType === 'DATE' ? 'date' : 'text'}
                          value={customFieldValues[def.key] || ''}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [def.key]: e.target.value }))}
                          className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                        />
                      )
                    ) : (
                      <p className="mt-1 text-sm text-white">{customFieldValues[def.key] || <span className="text-zinc-600">—</span>}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Stage + Labels */}
        <div className="space-y-6">
          {/* Lifecycle Stage */}
          <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lifecycle Stage</h2>
            {editing ? (
              <select value={form.lifecycleStageId} onChange={e => setForm(x => ({ ...x, lifecycleStageId: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30">
                <option value="">No Stage</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
            ) : currentStage ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: (currentStage.color || '#6366f1') + '20', color: currentStage.color || '#6366f1' }}>
                {currentStage.emoji} {currentStage.name}
              </span>
            ) : <p className="text-zinc-600 text-sm">No stage assigned</p>}
          </div>

          {/* Labels */}
          <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Labels</h2>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {allLabels.map(l => {
                  const active = form.labelIds.includes(l.id);
                  return (
                    <button key={l.id} onClick={() => toggleLabel(l.id)}
                      className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                      style={active ? { backgroundColor: l.color + '30', color: l.color, borderColor: l.color + '60' } : { borderColor: '#ffffff20', color: '#71717a' }}>
                      {l.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentLabels.length === 0 && <p className="text-zinc-600 text-sm">No labels</p>}
                {currentLabels.map(l => (
                  <span key={l.id} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: l.color + '20', color: l.color }}>
                    {l.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Conversation link */}
          {contact.conversation && (
            <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-3">
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">WhatsApp Chat</h2>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${contact.conversation.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                  {contact.conversation.status}
                </span>
                {contact.conversation.unreadCount > 0 && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg font-semibold">{contact.conversation.unreadCount} unread</span>
                )}
              </div>
              <button onClick={() => navigate(`/inbox?conversation=${contact.conversation.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest transition-all">
                <ChatBubbleLeftRightIcon className="w-4 h-4" /> Open Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
