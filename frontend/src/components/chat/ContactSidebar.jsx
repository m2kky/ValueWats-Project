import { useState, useEffect } from 'react';
import api from '../../api/client';
import { formatPhoneNumber } from '../../utils/formatters';
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LanguageIcon,
  ChevronDownIcon,
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function ContactSidebar({ conversation, agents, users, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [editingFields, setEditingFields] = useState(false);
  const [formData, setFormData] = useState({
    contactName: conversation?.contactName || '',
    email: '',
    country: '',
    language: ''
  });

  const [contactFields, setContactFields] = useState([]);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [lifecycleStages, setLifecycleStages] = useState([]);

  useEffect(() => {
    if (conversation) {
      setFormData({
        contactName: conversation.contactName || '',
        email: conversation.contactFields?.find(f => f.fieldName === 'email')?.fieldValue || '',
        country: conversation.contactFields?.find(f => f.fieldName === 'country')?.fieldValue || '',
        language: conversation.contactFields?.find(f => f.fieldName === 'language')?.fieldValue || '',
      });
      setContactFields(conversation.contactFields || []);
      fetchStages();
    }
  }, [conversation]);

  const fetchStages = async () => {
    try {
      const { data } = await api.get('/chat/lifecycle-stages');
      setLifecycleStages(data.stages || []);
    } catch (error) {
      console.error('Failed to fetch lifecycle stages', error);
    }
  };

  const handleSaveFields = async () => {
    setLoading(true);
    try {
      const customFields = [
        { name: 'email', value: formData.email },
        { name: 'country', value: formData.country },
        { name: 'language', value: formData.language }
      ].filter(f => f.value);

      const { data } = await api.put(`/chat/conversations/${conversation.id}/contact`, {
        contactName: formData.contactName,
        customFields
      });

      setContactFields(data.conversation?.contactFields || customFields);
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
      const payload = { type }; // 'agent', 'me', 'unassign'
      if (id) payload.agentId = id;

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

  if (!conversation) return null;

  // Determine current assignment status
  let assignmentLabel = "Unassigned";
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
    assignmentLabel = "Assigned to team";
    assignmentIcon = <UserCircleIcon className="w-5 h-5 text-indigo-400" />;
  }

  const currentStage = lifecycleStages.find(s => s.id === conversation.lifecycleStageId);

  return (
    <div className="w-80 min-w-[320px] h-full bg-[#0f0f11] border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0f0f11] z-10">
        <h3 className="font-bold text-white flex items-center gap-2">
          <UserCircleIcon className="w-5 h-5 text-indigo-400" />
          Contact details
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-zinc-400">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Overview */}
      <div className="p-6 flex flex-col items-center border-b border-white/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl flex items-center justify-center text-white font-black text-3xl mb-4">
          {(conversation.contactName || conversation.contactNumber)?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 className="text-lg font-bold text-white text-center break-all">
          {conversation.contactName || conversation.contactNumber}
        </h2>

        {/* Assignment Button */}
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
                {(!conversation.aiEnabled && conversation.escalated && !conversation.assignedUserId) && <CheckIcon className="w-4 h-4 text-indigo-400" />}
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

      {/* Stage & Contact Fields */}
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
                  <span dangerouslySetLabel={{ __html: currentStage.emoji || '📌' }} />
                  <span>{currentStage.name}</span>
                </>
              ) : (
                <span className="text-zinc-500">Select Stage...</span>
              )}
            </div>
            <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
          </button>

          {stageDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-20 py-1">
              {lifecycleStages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => handleSetStage(stage.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2"
                >
                  <span dangerouslySetInnerHTML={{ __html: stage.emoji || '📌' }} />
                  {stage.name}
                </button>
              ))}
              <button
                onClick={() => handleSetStage(null)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:bg-white/5 border-t border-white/5"
              >
                Clear Stage
              </button>
            </div>
          )}
        </div>

        {/* Contact Fields */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Fields</label>
            {!editingFields ? (
              <button onClick={() => setEditingFields(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <PencilSquareIcon className="w-3 h-3" /> Edit
              </button>
            ) : (
              <button onClick={handleSaveFields} disabled={loading} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold">
                {loading ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Phone */}
            <div className="flex gap-3">
              <PhoneIcon className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-zinc-500 mb-1">Phone Number</div>
                <div className="text-sm text-white">{formatPhoneNumber(conversation.contactNumber)}</div>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-3">
              <EnvelopeIcon className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-zinc-500 mb-1">Email Address</div>
                {editingFields ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="example@domain.com"
                  />
                ) : (
                  <div className="text-sm text-zinc-300">{formData.email || <span className="text-zinc-600 italic">No email</span>}</div>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="flex gap-3">
              <GlobeAltIcon className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-zinc-500 mb-1">Country</div>
                {editingFields ? (
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Egypt"
                  />
                ) : (
                  <div className="text-sm text-zinc-300">{formData.country || <span className="text-zinc-600 italic">No country</span>}</div>
                )}
              </div>
            </div>

            {/* Language */}
            <div className="flex gap-3">
              <LanguageIcon className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-zinc-500 mb-1">Language</div>
                {editingFields ? (
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Arabic"
                  />
                ) : (
                  <div className="text-sm text-zinc-300">{formData.language || <span className="text-zinc-600 italic">No language</span>}</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
