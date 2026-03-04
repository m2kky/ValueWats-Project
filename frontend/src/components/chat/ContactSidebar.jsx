import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { formatPhoneNumber } from '../../utils/formatters';
import {
  UserCircleIcon,
  PhoneIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon,
  PlusIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function ContactSidebar({ conversation, agents, users, onToggle, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [editingFields, setEditingFields] = useState(false);
  const [formData, setFormData] = useState({ contactName: conversation?.contactName || '' });
  const [customFields, setCustomFields] = useState([]);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [lifecycleStages, setLifecycleStages] = useState([]);

  // Labels state
  const [labels, setLabels] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);
  const labelInputRef = useRef(null);

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (conversation) {
      setFormData({ contactName: conversation.contactName || '' });

      // Load labels from conversation
      setLabels(conversation.labels || []);

      // Load custom fields
      const existingFields = conversation.contactFields || [];
      const mergedFields = existingFields.map(f => ({ name: f.fieldName, value: f.fieldValue }));
      const standardKeys = ['email', 'country', 'language'];
      standardKeys.forEach(key => {
        if (!mergedFields.find(f => f.name.toLowerCase() === key)) {
          mergedFields.push({ name: key, value: '' });
        }
      });
      setCustomFields(mergedFields);

      fetchStages();
      fetchAllLabels();
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (showLabelInput && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [showLabelInput]);

  const fetchStages = async () => {
    try {
      const { data } = await api.get('/chat/lifecycle-stages');
      setLifecycleStages(data.stages || []);
    } catch (error) {
      console.error('Failed to fetch lifecycle stages', error);
    }
  };

  const fetchAllLabels = async () => {
    try {
      const { data } = await api.get('/chat/labels');
      setAllLabels(data.labels || []);
    } catch (error) {
      // Non-fatal
    }
  };

  const handleSaveFields = async () => {
    setLoading(true);
    try {
      const fieldsToSave = customFields
        .filter(f => f.name && f.name.trim() !== '')
        .map(f => ({ name: f.name.toLowerCase().trim(), value: f.value || '' }));

      const { data } = await api.put(`/chat/conversations/${conversation.id}/contact`, {
        contactName: formData.contactName,
        customFields: fieldsToSave
      });

      const savedFields = data.conversation?.contactFields?.map(f => ({ name: f.fieldName, value: f.fieldValue })) || fieldsToSave;
      const standardKeys = ['email', 'country', 'language'];
      standardKeys.forEach(key => {
        if (!savedFields.find(f => f.name.toLowerCase() === key)) {
          savedFields.push({ name: key, value: '' });
        }
      });

      setCustomFields(savedFields);
      setEditingFields(false);
      if (onUpdate) onUpdate(data.conversation);
    } catch (error) {
      console.error('Failed to save contact fields:', error);
      alert('Failed to save contact details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (type, id = null) => {
    setAssignDropdownOpen(false);
    setLoading(true);
    try {
      const payload = { type };
      if (id) {
        if (type === 'agent') payload.agentId = id;
        else if (type === 'user') payload.userId = id;
      }
      const { data } = await api.put(`/chat/conversations/${conversation.id}/assign`, payload);
      if (onUpdate) onUpdate(data.conversation);
    } catch (error) {
      console.error('Failed to assign conversation:', error);
      alert('Failed to assign conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSetStage = async (stageId) => {
    setStageDropdownOpen(false);
    setLoading(true);
    try {
      const { data } = await api.put(`/chat/conversations/${conversation.id}/contact`, {
        lifecycleStageId: stageId
      });
      if (onUpdate) onUpdate(data.conversation);
    } catch (error) {
      console.error('Failed to update stage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = async (labelToAdd) => {
    const lbl = (labelToAdd || newLabel).trim();
    if (!lbl || labels.includes(lbl)) {
      setNewLabel('');
      setShowLabelInput(false);
      return;
    }
    setSavingLabel(true);
    try {
      const updatedLabels = [...labels, lbl];
      const { data } = await api.put(`/chat/conversations/${conversation.id}/contact`, {
        labels: updatedLabels
      });
      setLabels(updatedLabels);
      setNewLabel('');
      setShowLabelInput(false);
      if (!allLabels.includes(lbl)) setAllLabels(prev => [...prev, lbl].sort());
      if (onUpdate) onUpdate(data.conversation);
    } catch (error) {
      console.error('Failed to add label:', error);
    } finally {
      setSavingLabel(false);
    }
  };

  const handleRemoveLabel = async (lbl) => {
    setSavingLabel(true);
    try {
      const updatedLabels = labels.filter(l => l !== lbl);
      const { data } = await api.put(`/chat/conversations/${conversation.id}/contact`, {
        labels: updatedLabels
      });
      setLabels(updatedLabels);
      if (onUpdate) onUpdate(data.conversation);
    } catch (error) {
      console.error('Failed to remove label:', error);
    } finally {
      setSavingLabel(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !conversation?.contact?.id) return;
    setSavingNote(true);
    try {
      const { data } = await api.post(`/contacts/${conversation.contact.id}/notes`, {
        content: newNote.trim()
      });
      // Append new note to conversation.contact.notes
      const updatedContact = {
        ...conversation.contact,
        notes: [data, ...(conversation.contact.notes || [])]
      };
      if (onUpdate) {
        onUpdate({ ...conversation, contact: updatedContact });
      }
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!conversation?.contact?.id) return;
    try {
      await api.delete(`/contacts/${conversation.contact.id}/notes/${noteId}`);
      const updatedContact = {
        ...conversation.contact,
        notes: (conversation.contact.notes || []).filter(n => n.id !== noteId)
      };
      if (onUpdate) {
        onUpdate({ ...conversation, contact: updatedContact });
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (!conversation) return null;

  // Assignment display
  let assignmentLabel = 'Unassigned';
  let assignmentIcon = <UserCircleIcon className="w-5 h-5 text-zinc-400" />;

  if (conversation.currentAgentId) {
    const assignedAgent = agents.find(a => a.id === conversation.currentAgentId);
    if (assignedAgent) {
      assignmentLabel = assignedAgent.name;
      assignmentIcon = <span className="text-sm">🤖</span>;
    }
  } else if (conversation.assignedUserId || conversation.assignedUser) {
    const assignedUser = users?.find(u => u.id === conversation.assignedUserId) || conversation.assignedUser;
    if (assignedUser) {
      assignmentLabel = assignedUser.email.split('@')[0];
      assignmentIcon = <UserCircleIcon className="w-5 h-5 text-indigo-400" />;
    }
  } else if (!conversation.aiEnabled && conversation.escalated) {
    assignmentLabel = 'Assigned to team';
    assignmentIcon = <UserCircleIcon className="w-5 h-5 text-indigo-400" />;
  }

  const currentStage = lifecycleStages.find(s => s.id === conversation.lifecycleStageId);

  // Label color based on hash
  const getLabelColor = (label) => {
    const colors = [
      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
      { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' },
      { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' },
      { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' },
      { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/25' },
      { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/25' },
    ];
    const hash = label.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="w-80 min-w-[320px] h-full bg-[#0f0f11] border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 sticky top-0 bg-[#0f0f11] z-10">
        <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded text-zinc-400 transition-colors" title="Collapse Contact Details">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="15" y1="3" x2="15" y2="21"></line>
            <path d="M10 16l4-4-4-4"></path>
          </svg>
        </button>
        <h3 className="font-bold text-white flex items-center gap-2">Contact details</h3>
      </div>

      {/* Profile Overview */}
      <div className="p-6 flex flex-col items-center border-b border-white/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl flex items-center justify-center text-white font-black text-3xl mb-4">
          {(conversation.contactName || conversation.contactNumber)?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 className="text-lg font-bold text-white text-center break-all">
          {conversation.contactName || conversation.contactNumber}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">{formatPhoneNumber(conversation.contactNumber)}</p>

        {/* Assignment Dropdown */}
        <div className="relative mt-4 w-full">
          <button
            onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
            disabled={loading}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-2">
              {assignmentIcon}
              <span className={`text-sm font-medium ${conversation.currentAgentId || (!conversation.aiEnabled && conversation.escalated) ? 'text-white' : 'text-zinc-400'}`}>
                {assignmentLabel}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
          </button>

          {assignDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 py-2">
              <div className="px-3 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">AI Agents</div>
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleAssign('agent', agent.id)}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🤖 {agent.name}</span>
                  {conversation.currentAgentId === agent.id && <CheckIcon className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}

              <div className="px-3 py-1.5 mt-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Team Members</div>
              <button
                onClick={() => handleAssign('me')}
                className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">👤 Assign to me</span>
              </button>
              {users?.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleAssign('user', user.id)}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 flex items-center justify-between truncate"
                >
                  <span className="flex items-center gap-2 truncate">👤 {user.email.split('@')[0]}</span>
                  {conversation.assignedUserId === user.id && <CheckIcon className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              ))}

              <div className="h-px w-full bg-white/5 my-2"></div>
              <button
                onClick={() => handleAssign('unassign')}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" /> Unassign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stage, Labels & Contact Fields */}
      <div className="p-5 flex flex-col gap-6">

        {/* Lifecycle Stage */}
        <div className="relative">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Lifecycle Stage</label>
          <button
            onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/10 transition-all text-sm text-zinc-300"
          >
            <div className="flex items-center gap-2">
              {currentStage ? (
                <>
                  <span>{currentStage.emoji || '📌'}</span>
                  <span style={{ color: currentStage.color || '#6366f1' }}>{currentStage.name}</span>
                </>
              ) : (
                <span className="text-zinc-500">Select Stage...</span>
              )}
            </div>
            <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
          </button>

          {stageDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-20 py-1">
              {lifecycleStages.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500 italic">No stages created yet</p>
              ) : (
                lifecycleStages.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => handleSetStage(stage.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2"
                  >
                    <span>{stage.emoji || '📌'}</span>
                    <span style={{ color: stage.color || '#6366f1' }}>{stage.name}</span>
                    {conversation.lifecycleStageId === stage.id && <CheckIcon className="w-4 h-4 text-indigo-400 ml-auto" />}
                  </button>
                ))
              )}
              <button
                onClick={() => handleSetStage(null)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:bg-white/5 border-t border-white/5"
              >
                Clear Stage
              </button>
            </div>
          )}
        </div>

        {/* Labels Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5" /> Labels
            </label>
            <button
              onClick={() => setShowLabelInput(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <PlusIcon className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {labels.map(lbl => {
              const clr = getLabelColor(lbl);
              return (
                <span
                  key={lbl}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${clr.bg} ${clr.text} ${clr.border}`}
                >
                  {lbl}
                  <button
                    onClick={() => handleRemoveLabel(lbl)}
                    disabled={savingLabel}
                    className="hover:opacity-70 transition-opacity ml-0.5"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {labels.length === 0 && !showLabelInput && (
              <span className="text-xs text-zinc-600 italic">No labels</span>
            )}
          </div>

          {showLabelInput && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                ref={labelInputRef}
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddLabel();
                  if (e.key === 'Escape') { setShowLabelInput(false); setNewLabel(''); }
                }}
                placeholder="Type label name..."
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              {/* Suggestions from existing labels */}
              {allLabels.filter(l => !labels.includes(l) && l.toLowerCase().includes(newLabel.toLowerCase())).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {allLabels
                    .filter(l => !labels.includes(l) && l.toLowerCase().includes(newLabel.toLowerCase()))
                    .slice(0, 6)
                    .map(l => {
                      const clr = getLabelColor(l);
                      return (
                        <button
                          key={l}
                          onClick={() => handleAddLabel(l)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${clr.bg} ${clr.text} ${clr.border} hover:opacity-80 transition-opacity`}
                        >
                          {l}
                        </button>
                      );
                    })}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddLabel()}
                  disabled={!newLabel.trim() || savingLabel}
                  className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {savingLabel ? 'Saving...' : 'Add Label'}
                </button>
                <button
                  onClick={() => { setShowLabelInput(false); setNewLabel(''); }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contact Fields */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Fields</label>
            {!editingFields ? (
              <button onClick={() => setEditingFields(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                <PencilSquareIcon className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleSaveFields} disabled={loading} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold">
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingFields(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Name field (always editable when in edit mode) */}
          {editingFields && (
            <div className="mb-3 pb-3 border-b border-white/5">
              <div className="text-xs text-zinc-500 mb-1">Display Name</div>
              <input
                type="text"
                value={formData.contactName}
                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Contact name"
              />
            </div>
          )}

          <div className="space-y-4">
            {/* Phone (always fixed) */}
            <div className="flex gap-3">
              <PhoneIcon className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-zinc-500 mb-1">Phone Number</div>
                <div className="text-sm text-white">{formatPhoneNumber(conversation.contactNumber)}</div>
              </div>
            </div>

            {/* Dynamic Custom Fields */}
            {customFields.map((field, idx) => (
              <div key={idx} className="flex gap-3 relative">
                <GlobeAltIcon className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
                <div className="flex-1">
                  {editingFields ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => {
                          const newFields = [...customFields];
                          newFields[idx].name = e.target.value;
                          setCustomFields(newFields);
                        }}
                        className="text-xs font-bold text-zinc-400 bg-transparent border-b border-white/10 focus:border-indigo-500 focus:outline-none uppercase tracking-wider mb-1"
                        placeholder="Field Name"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => {
                            const newFields = [...customFields];
                            newFields[idx].value = e.target.value;
                            setCustomFields(newFields);
                          }}
                          className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                          placeholder={`Enter ${field.name || 'value'}`}
                        />
                        <button
                          onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-zinc-500 mb-1 capitalize tracking-wider">{field.name}</div>
                      <div className="text-sm text-zinc-300 break-all">
                        {field.value || <span className="text-zinc-600 italic">No {field.name}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {editingFields && (
              <button
                onClick={() => setCustomFields([...customFields, { name: '', value: '' }])}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/20 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-white/40 transition-all mt-4"
              >
                <PlusIcon className="w-4 h-4" /> Add Custom Field
              </button>
            )}
          </div>
        </div>

        {/* Internal Notes */}
        {conversation?.contact && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Internal Notes</label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note..."
                className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || savingNote}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(!conversation.contact.notes || conversation.contact.notes.length === 0) ? (
                <p className="text-zinc-600 text-xs italic text-center py-2">No internal notes yet.</p>
              ) : (
                conversation.contact.notes.map(note => (
                  <div key={note.id} className="p-3 bg-white/5 rounded-lg border border-white/5 group relative">
                    <p className="text-sm text-zinc-300 break-words pr-6 whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{note.user?.name || note.user?.email?.split('@')[0] || 'Unknown'}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-2 right-2 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
