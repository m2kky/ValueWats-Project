import { useState, useEffect, useRef } from 'react';
import useAgents from '../hooks/useAgents';
import usePageTitle from '../hooks/usePageTitle';
import HttpRequestSideSheet from '../components/HttpRequestSideSheet';

// Modulized Components
import AgentList from './agents/AgentList';
import AgentTemplates from './agents/AgentTemplates';
import AgentEditor from './agents/AgentEditor';
import AgentTestChat from './agents/AgentTestChat';

const REQUIRED_INSTRUCTION_SECTIONS = [
  '# CONTEXT',
  '# ROLE & COMMUNICATION STYLE',
  '# TOP-LEVEL FLOW',
  '# BOUNDARIES',
];

function getInstructionChecklist(instructions = '') {
  const normalized = instructions.toUpperCase();
  return REQUIRED_INSTRUCTION_SECTIONS.map((section) => ({
    section,
    present: normalized.includes(section),
  }));
}

const defaultForm = {
  name: '',
  description: '',
  instructions: '',
  templateType: 'custom',
  tone: 'professional',
  responseStyle: 'concise',
  temperature: 0.7,
  maxTokens: 500,
  greeting: '',
  useHistory: true,
  historyLength: 10,
  followUpEnabled: false,
  followUpDelay: 300,
  followUpMessage: '',
  workingHoursEnabled: false,
  workingHours: null,
  outOfHoursMessage: '',
  isActive: true,
  priority: 0,
  aiModel: 'deepseek-chat',
  actionConfig: {
    closeConversation: { enabled: false, instructions: '' },
    assignAgent: { enabled: false, instructions: '' },
    updateLifecycle: { enabled: false, instructions: '', stageId: null },
    updateFields: { enabled: false, instructions: '' },
    updateTags: { enabled: true, instructions: '', type: 'add' },
    triggerWorkflow: { enabled: false, instructions: '' },
    addComment: { enabled: false, instructions: '' },
    httpRequests: { enabled: false, actions: [] },
  },
};

export default function Agents() {
  usePageTitle('AI Agents');
  const {
    agents, templates, loading, saving,
    fetchAgents, fetchAgent, createAgent, updateAgent,
    deleteAgent, fetchTemplates,
    testChat, toggleAgent,
    knowledgeSources, knowledgeLoading,
    fetchKnowledge, addTextKnowledge, uploadFileKnowledge, deleteKnowledge,
  } = useAgents();

  // Views: 'list' | 'templates' | 'editor'
  const [view, setView] = useState('list');
  const [form, setForm] = useState({ ...defaultForm });
  const [editingId, setEditingId] = useState(null);

  // Test Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Agent Preview Context
  const [previewTab, setPreviewTab] = useState('chat'); // 'chat' | 'fields'
  const [mockContact, setMockContact] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+201234567890',
    lifecycleStage: 'New Lead',
    assignee: 'Unassigned',
    tags: ['%new_lead'],
  });

  const [kbMode, setKbMode] = useState(null); // null | 'text' | 'file'
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [kbFile, setKbFile] = useState(null);

  // HTTP Request Side Sheet
  const [httpActionToEdit, setHttpActionToEdit] = useState(null);
  const [isHttpSheetOpen, setIsHttpSheetOpen] = useState(false);
  const [editingHttpIndex, setEditingHttpIndex] = useState(-1);

  const instructionCharacters = form.instructions?.length || 0;
  const instructionOverLimit = instructionCharacters > 10000;
  const instructionChecklist = getInstructionChecklist(form.instructions);
  const missingInstructionSections = instructionChecklist.filter(item => !item.present);

  const [availableTags, setAvailableTags] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [availableAiAgents, setAvailableAiAgents] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availableLifecycleStages, setAvailableLifecycleStages] = useState([]);
  const [availableVariables, setAvailableVariables] = useState([]);
  const [availableIntegrations, setAvailableIntegrations] = useState([]);
  const mentionTargets = [...availableAgents, ...availableAiAgents, ...availableTeams];

  useEffect(() => {
    fetchAgents();
    const loadLookups = async () => {
      try {
        const { default: api } = await import('../api/client');
        const [tagsRes, teamRes, stagesRes, fieldDefsRes, intRes] = await Promise.allSettled([
          api.get('/tags'),
          api.get('/team'),
          api.get('/lifecycle'),
          api.get('/contact-fields/definitions'),
          api.get('/integrations'),
        ]);

        if (tagsRes.status === 'fulfilled') setAvailableTags((tagsRes.value.data.tags || []).map(t => ({ label: t.name, value: `%${t.name}` })));
        if (teamRes.status === 'fulfilled') {
          const teamUsers = teamRes.value.data.users || [];
          setAvailableAgents(teamUsers.map((u) => ({
            label: u.name?.trim() || u.email?.split('@')[0] || 'User',
            value: `@user:${u.id}`,
            subtitle: `${u.role || 'agent'} | ${u.email || ''}`,
            group: 'human',
          })));
        }
        setAvailableTeams([
          { label: 'Team Agents', value: '@team:agents', subtitle: 'Assign to agent role users' },
          { label: 'Team Admins', value: '@team:admins', subtitle: 'Assign to admin users' },
          { label: 'All Humans', value: '@team:humans', subtitle: 'Assign to any human user' },
        ]);
        if (stagesRes.status === 'fulfilled') setAvailableLifecycleStages(stagesRes.value.data || []);
        if (intRes.status === 'fulfilled') setAvailableIntegrations(intRes.value.data.integrations || []);
        if (fieldDefsRes.status === 'fulfilled') {
          const fieldVariables = (fieldDefsRes.value.data || []).map((field) => ({
            label: field.name || field.key,
            value: `{{contact.${field.key}}}`,
            subtitle: field.fieldType ? `contact.${field.key} (${field.fieldType})` : `contact.${field.key}`,
          }));
          setAvailableVariables(fieldVariables);
        }
      } catch (e) { console.warn('Could not load lookups', e); }
    };
    loadLookups();
  }, [fetchAgents]);

  useEffect(() => {
    setAvailableAiAgents((agents || []).map((agent) => ({
      label: agent.name,
      value: `@agent:${agent.id}`,
      subtitle: 'AI Agent',
      group: 'ai',
    })));
  }, [agents]);

  // ─── Handlers ───
  const handleCreateNew = () => {
    fetchTemplates();
    setView('templates');
  };

  const handleSelectTemplate = async (templateName) => {
    const t = templates[templateName];
    if (t) {
      setForm({ ...defaultForm, ...t, templateType: templateName });
    } else {
      setForm({ ...defaultForm });
    }
    setEditingId(null);
    setChatMessages([]);
    setView('editor');
  };

  const handleCustomCreate = () => {
    setForm({ ...defaultForm });
    setEditingId(null);
    setChatMessages([]);
    setView('editor');
  };

  const handleEdit = async (agent) => {
    const full = await fetchAgent(agent.id);
    if (full) {
      setForm({
        ...defaultForm, ...full,
        name: full.name || '', description: full.description || '', instructions: full.instructions || '',
        templateType: full.templateType || 'custom', tone: full.tone || 'professional', responseStyle: full.responseStyle || 'concise',
        temperature: full.temperature ?? 0.7, maxTokens: full.maxTokens ?? 500, greeting: full.greeting || '',
        useHistory: full.useHistory ?? true, historyLength: full.historyLength ?? 10,
        followUpEnabled: full.followUpEnabled ?? false, followUpDelay: full.followUpDelay ?? 300, followUpMessage: full.followUpMessage || '',
        workingHoursEnabled: full.workingHoursEnabled ?? false, workingHours: full.workingHours, outOfHoursMessage: full.outOfHoursMessage || '',
        isActive: full.isActive ?? true, priority: full.priority ?? 0, isPublished: full.isPublished ?? false,
        aiModel: full.aiModel || full.model || 'deepseek-chat',
        actionConfig: { ...defaultForm.actionConfig, ...(full.actionConfig || {}) },
      });
      setEditingId(full.id);
      setChatMessages([]);
      if (full.id) fetchKnowledge(full.id);
      setView('editor');
    }
  };

  const handleSave = async (publishStatus = form.isPublished) => {
    const data = {
      ...form, isPublished: publishStatus, priority: Number(form.priority),
      temperature: Number(form.temperature), maxTokens: Number(form.maxTokens), followUpDelay: Number(form.followUpDelay),
    };
    delete data.allowedGroupsText;

    let result;
    if (editingId) result = await updateAgent(editingId, data);
    else result = await createAgent({ ...data });

    if (result) {
      await fetchAgents();
      setView('list');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    await deleteAgent(id);
  };

  const handleToggle = async (agent) => {
    await toggleAgent(agent.id, agent.isActive);
  };

  const handleSendTest = async () => {
    if (!chatInput.trim() || !editingId) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await testChat(editingId, userMsg);
      const content = res.response || res.message || 'No response';
      setChatMessages(prev => [...prev, { role: 'assistant', content }]);

      const actions = content.match(/\[ACTION:\s*([^\]]+)\]/g);
      if (actions) {
        setMockContact(prev => {
          let next = { ...prev };
          actions.forEach(actStr => {
            const inner = actStr.replace('[ACTION:', '').replace(']', '').trim();
            if (inner.startsWith('ADD_TAG:')) {
              const tag = inner.replace('ADD_TAG:', '').trim();
              if (!next.tags.includes(tag)) next.tags = [...next.tags, tag];
            } else if (inner.startsWith('REMOVE_TAG:')) {
              const tag = inner.replace('REMOVE_TAG:', '').trim();
              next.tags = next.tags.filter(t => t !== tag);
            } else if (inner.startsWith('ASSIGN_AGENT:')) {
              next.assignee = inner.replace('ASSIGN_AGENT:', '').trim();
            } else if (inner.startsWith('UPDATE_LIFECYCLE:')) {
              next.lifecycleStage = inner.replace('UPDATE_LIFECYCLE:', '').trim();
            } else if (inner.startsWith('SET_FIELD:')) {
              try {
                const json = JSON.parse(inner.replace('SET_FIELD:', '').trim());
                if (json.firstName) next.firstName = json.firstName;
                if (json.lastName) next.lastName = json.lastName;
                if (json.email) next.email = json.email;
                if (json.phone) next.phone = json.phone;
              } catch (e) {
                const parts = inner.replace('SET_FIELD:', '').split(':');
                if (parts.length === 2) {
                  const key = parts[0].trim();
                  const val = parts[1].trim();
                  if (key === 'name') next.firstName = val;
                  else if (next.hasOwnProperty(key)) next[key] = val;
                }
              }
            }
          });
          return next;
        });
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error getting response' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER VIEWS
  // ═══════════════════════════════════════════════════
  if (view === 'templates') {
    return <AgentTemplates setView={setView} handleSelectTemplate={handleSelectTemplate} saving={saving} handleCustomCreate={handleCustomCreate} />;
  }

  if (view === 'editor') {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex flex-1 overflow-hidden bg-transparent">
          <AgentEditor
            form={form} setForm={setForm} editingId={editingId} saving={saving}
            handleSave={handleSave} setView={setView} fetchAgents={fetchAgents}
            instructionCharacters={instructionCharacters} instructionOverLimit={instructionOverLimit}
            instructionChecklist={instructionChecklist} missingInstructionSections={missingInstructionSections}
            mentionTargets={mentionTargets} availableTags={availableTags} availableVariables={availableVariables}
            availableLifecycleStages={availableLifecycleStages} availableIntegrations={availableIntegrations}
            setHttpActionToEdit={setHttpActionToEdit} setIsHttpSheetOpen={setIsHttpSheetOpen} setEditingHttpIndex={setEditingHttpIndex}
            kbMode={kbMode} setKbMode={setKbMode} kbTitle={kbTitle} setKbTitle={setKbTitle}
            kbContent={kbContent} setKbContent={setKbContent} kbFile={kbFile} setKbFile={setKbFile}
            knowledgeSources={knowledgeSources} knowledgeLoading={knowledgeLoading} fetchKnowledge={fetchKnowledge}
            addTextKnowledge={addTextKnowledge} uploadFileKnowledge={uploadFileKnowledge} deleteKnowledge={deleteKnowledge}
          />
          <AgentTestChat
            form={form} previewTab={previewTab} setPreviewTab={setPreviewTab}
            chatMessages={chatMessages} setChatMessages={setChatMessages}
            chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading}
            handleSendTest={handleSendTest} mockContact={mockContact} setMockContact={setMockContact}
            editingId={editingId}
          />
        </div>
        <HttpRequestSideSheet
          isOpen={isHttpSheetOpen}
          onClose={() => { setIsHttpSheetOpen(false); setHttpActionToEdit(null); }}
          action={httpActionToEdit}
          availableTags={availableTags}
          availableAgents={mentionTargets}
          availableVariables={availableVariables}
          onSave={(data) => {
            const currentActions = form.actionConfig.httpRequests?.actions || [];
            let newActions;
            if (editingHttpIndex >= 0) {
              newActions = [...currentActions];
              newActions[editingHttpIndex] = data;
            } else {
              newActions = [...currentActions, data];
            }
            setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, httpRequests: { ...f.actionConfig.httpRequests, actions: newActions } } }));
          }}
        />
      </div>
    );
  }

  // default to 'list'
  return (
    <AgentList
      agents={agents} loading={loading}
      handleCreateNew={handleCreateNew} handleEdit={handleEdit}
      handleDelete={handleDelete} handleToggle={handleToggle}
    />
  );
}
