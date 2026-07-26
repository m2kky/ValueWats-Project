import { useState, useCallback } from 'react';
import api from '../api/client';

const SETUP_PAYLOAD_FIELDS = [
  'name',
  'description',
  'avatar',
  'templateType',
  'instructions',
  'aiProvider',
  'aiModel',
  'temperature',
  'maxTokens',
  'greeting',
  'tone',
  'responseStyle',
  'useHistory',
  'historyLength',
  'followUpEnabled',
  'followUpDelay',
  'followUpMessage',
  'workingHoursEnabled',
  'workingHours',
  'workingHoursTimezone',
  'outOfHoursMessage',
  'allowGroupResponse',
  'allowedGroups',
  'isActive',
  'isPublished',
  'priority',
];

const numericFields = new Set(['temperature', 'maxTokens', 'historyLength', 'followUpDelay', 'priority']);

function normalizeSetupValue(field, value) {
  if (numericFields.has(field) && value !== '' && value !== null && value !== undefined) {
    return Number(value);
  }
  return value;
}

export function buildAgentSetupPayload(data = {}, { includeExpectedConfigVersion = false } = {}) {
  const payload = {};
  for (const field of SETUP_PAYLOAD_FIELDS) {
    if (data[field] !== undefined) {
      payload[field] = normalizeSetupValue(field, data[field]);
    }
  }
  if (includeExpectedConfigVersion) {
    payload.expectedConfigVersion = Number(data.configVersion);
  }
  return payload;
}

export function buildTerminalCapabilities(data = {}) {
  const assignment = data.actionConfig?.assignAgent || {};
  const assignmentConfig = assignment.config || {};
  const close = data.actionConfig?.closeConversation || {};
  const internal = data.actionConfig || {};
  return {
    assignConversation: {
      enabled: assignment.enabled === true,
      instructions: assignment.instructions || '',
      allowedTargets: assignment.allowedTargets || assignmentConfig.allowedTargets || [],
      allowUnassignedHuman: assignment.allowUnassignedHuman
        ?? assignmentConfig.allowUnassignedHuman
        ?? false,
      teamStrategies: assignment.teamStrategies || assignmentConfig.teamStrategies || {},
      handoffMessage: assignment.handoffMessage
        || assignmentConfig.handoffMessage
        || 'I am transferring this conversation to the right specialist.',
    },
    closeConversation: {
      enabled: close.enabled === true,
      instructions: close.instructions || '',
    },
    updateContact: {
      enabled: internal.updateFields?.enabled === true,
      instructions: internal.updateFields?.instructions || '',
    },
    updateLifecycle: {
      enabled: internal.updateLifecycle?.enabled === true,
      instructions: internal.updateLifecycle?.instructions || '',
    },
    modifyTags: {
      enabled: internal.updateTags?.enabled === true,
      instructions: internal.updateTags?.instructions || '',
    },
    addInternalComment: {
      enabled: internal.addComment?.enabled === true,
      instructions: internal.addComment?.instructions || '',
    },
  };
}

export default function useAgents() {
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Knowledge Base state
  const [knowledgeSources, setKnowledgeSources] = useState([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/agents');
      setAgents(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch agents');
      console.error('[useAgents] fetchAgents error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgent = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/agents/${id}`);
      setSelectedAgent(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch agent');
      console.error('[useAgents] fetchAgent error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (data) => {
    setSaving(true);
    setError(null);
    try {
      const created = await api.post('/agents', buildAgentSetupPayload(data));
      const res = await api.put(`/agents/${created.data.id}/terminal-capabilities`, {
        expectedConfigVersion: Number(created.data.configVersion),
        capabilities: buildTerminalCapabilities(data),
      });
      setAgents(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create agent');
      console.error('[useAgents] createAgent error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateAgent = useCallback(async (id, data) => {
    setSaving(true);
    setError(null);
    try {
      const setup = await api.put(`/agents/${id}`, buildAgentSetupPayload(data, { includeExpectedConfigVersion: true }));
      const res = await api.put(`/agents/${id}/terminal-capabilities`, {
        expectedConfigVersion: Number(setup.data.configVersion),
        capabilities: buildTerminalCapabilities(data),
      });
      setAgents(prev => prev.map(a => a.id === id ? res.data : a));
      setSelectedAgent(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update agent');
      console.error('[useAgents] updateAgent error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteAgent = useCallback(async (agentOrId) => {
    try {
      const agent = typeof agentOrId === 'object' ? agentOrId : { id: agentOrId };
      await api.delete(`/agents/${agent.id}`, {
        data: { expectedConfigVersion: Number(agent.configVersion) },
      });
      setAgents(prev => prev.filter(a => a.id !== agent.id));
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete agent');
      console.error('[useAgents] deleteAgent error:', err);
      return false;
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/agents/templates/list');
      setTemplates(res.data);
      return res.data;
    } catch (err) {
      console.error('[useAgents] fetchTemplates error:', err);
      return {};
    }
  }, []);

  const createFromTemplate = useCallback(async (templateName, overrides = {}) => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post(`/agents/templates/${templateName}`, buildAgentSetupPayload(overrides));
      setAgents(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create from template');
      console.error('[useAgents] createFromTemplate error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const testChat = useCallback(async (agentId, message) => {
    try {
      const res = await api.post(`/agents/${agentId}/test`, { message });
      return res.data;
    } catch (err) {
      console.error('[useAgents] testChat error:', err);
      return { response: 'Error: Could not get response from agent.' };
    }
  }, []);

  const toggleAgent = useCallback(async (agentOrId, isActiveArg) => {
    try {
      const agent = typeof agentOrId === 'object' ? agentOrId : { id: agentOrId, isActive: isActiveArg };
      const res = await api.put(`/agents/${agent.id}`, {
        isActive: !agent.isActive,
        expectedConfigVersion: Number(agent.configVersion),
      });
      setAgents(prev => prev.map(a => a.id === agent.id ? res.data : a));
      return true;
    } catch (err) {
      console.error('[useAgents] toggleAgent error:', err);
      return false;
    }
  }, []);

  // ─── Knowledge Base ───

  const fetchKnowledge = useCallback(async (agentId) => {
    setKnowledgeLoading(true);
    try {
      const res = await api.get(`/agents/${agentId}/knowledge`);
      setKnowledgeSources(res.data);
      return res.data;
    } catch (err) {
      console.error('[useAgents] fetchKnowledge error:', err);
      setKnowledgeSources([]);
      return [];
    } finally {
      setKnowledgeLoading(false);
    }
  }, []);

  const addTextKnowledge = useCallback(async (agentId, { title, content, category, tags }) => {
    setKnowledgeLoading(true);
    try {
      const res = await api.post(`/agents/${agentId}/knowledge/text`, { title, content, category, tags });
      await fetchKnowledge(agentId);
      return res.data;
    } catch (err) {
      console.error('[useAgents] addTextKnowledge error:', err);
      setError(err.response?.data?.error || 'Failed to add knowledge');
      return null;
    } finally {
      setKnowledgeLoading(false);
    }
  }, [fetchKnowledge]);

  const uploadFileKnowledge = useCallback(async (agentId, file, category) => {
    setKnowledgeLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);
      const res = await api.post(`/agents/${agentId}/knowledge/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchKnowledge(agentId);
      return res.data;
    } catch (err) {
      console.error('[useAgents] uploadFileKnowledge error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
      return null;
    } finally {
      setKnowledgeLoading(false);
    }
  }, [fetchKnowledge]);

  const deleteKnowledge = useCallback(async (agentId, knowledgeId) => {
    try {
      await api.delete(`/agents/${agentId}/knowledge/${knowledgeId}`);
      setKnowledgeSources(prev => prev.filter(k => k.id !== knowledgeId));
      return true;
    } catch (err) {
      console.error('[useAgents] deleteKnowledge error:', err);
      return false;
    }
  }, []);

  return {
    agents,
    templates,
    selectedAgent,
    loading,
    saving,
    error,
    knowledgeSources,
    knowledgeLoading,
    setSelectedAgent,
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    fetchTemplates,
    createFromTemplate,
    testChat,
    toggleAgent,
    fetchKnowledge,
    addTextKnowledge,
    uploadFileKnowledge,
    deleteKnowledge,
  };
}

