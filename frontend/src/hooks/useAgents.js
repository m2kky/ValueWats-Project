import { useState, useCallback } from 'react';
import api from '../api/client';

export default function useAgents() {
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
      const res = await api.post('/agents', data);
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
      const res = await api.put(`/agents/${id}`, data);
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

  const deleteAgent = useCallback(async (id) => {
    try {
      await api.delete(`/agents/${id}`);
      setAgents(prev => prev.filter(a => a.id !== id));
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
      const res = await api.post(`/agents/templates/${templateName}`, overrides);
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

  const toggleAgent = useCallback(async (id, isActive) => {
    try {
      const res = await api.put(`/agents/${id}`, { isActive: !isActive });
      setAgents(prev => prev.map(a => a.id === id ? res.data : a));
      return true;
    } catch (err) {
      console.error('[useAgents] toggleAgent error:', err);
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
  };
}
