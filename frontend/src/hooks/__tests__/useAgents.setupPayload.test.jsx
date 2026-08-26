import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgents, { buildAgentCapabilities, buildAgentSetupPayload, buildTerminalCapabilities } from '../useAgents';
import api from '../../api/client';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const loadedAgent = {
  id: 'agent-1',
  tenantId: 'tenant-evil',
  configVersion: 7,
  createdAt: '2026-07-25T00:00:00.000Z',
  updatedAt: '2026-07-25T00:00:00.000Z',
  deletedAt: null,
  actions: [{ id: 'action-1' }],
  knowledgeSources: [{ id: 'knowledge-1' }],
  routingRules: [{ id: 'routing-1' }],
  _count: { actions: 1 },
  name: 'Frontend Agent',
  description: 'desc',
  instructions: 'Help customers.',
  templateType: 'custom',
  aiProvider: 'openrouter',
  aiModel: 'qwen/qwen3.5-flash-02-23',
  temperature: '0.8',
  maxTokens: '512',
  greeting: 'Hello',
  tone: 'friendly',
  responseStyle: 'concise',
  useHistory: true,
  historyLength: 8,
  followUpEnabled: false,
  followUpDelay: '300',
  followUpMessage: '',
  workingHoursEnabled: false,
  workingHours: null,
  workingHoursTimezone: 'Africa/Cairo',
  outOfHoursMessage: '',
  allowGroupResponse: false,
  allowedGroups: [],
  actionConfig: { closeConversation: { enabled: true, instructions: 'done' } },
  isActive: true,
  isPublished: true,
  priority: '3',
};

describe('agent setup payload compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a whitelisted setup payload and excludes server-owned fields and relations', () => {
    const payload = buildAgentSetupPayload(loadedAgent, { includeExpectedConfigVersion: true });

    expect(payload).toMatchObject({
      expectedConfigVersion: 7,
      name: 'Frontend Agent',
      aiProvider: 'openrouter',
      aiModel: 'qwen/qwen3.5-flash-02-23',
      temperature: 0.8,
      maxTokens: 512,
      followUpDelay: 300,
      priority: 3,
    });
    expect(payload).not.toHaveProperty('id');
    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('configVersion');
    expect(payload).not.toHaveProperty('createdAt');
    expect(payload).not.toHaveProperty('updatedAt');
    expect(payload).not.toHaveProperty('actions');
    expect(payload).not.toHaveProperty('knowledgeSources');
    expect(payload).not.toHaveProperty('routingRules');
    expect(payload).not.toHaveProperty('_count');
    expect(payload).not.toHaveProperty('actionConfig');
  });

  it('builds structured terminal capabilities from the legacy editor shape', () => {
    expect(buildTerminalCapabilities({
      actionConfig: {
        assignAgent: {
          enabled: true,
          instructions: 'Transfer specialists.',
          allowedTargets: ['team:agents'],
          allowUnassignedHuman: true,
          teamStrategies: { 'team:agents': 'least_open' },
          handoffMessage: 'Transferring now.'
        },
        closeConversation: { enabled: true, instructions: 'Close resolved chats.' }
      }
    })).toEqual({
      assignConversation: {
        enabled: true,
        instructions: 'Transfer specialists.',
        allowedTargets: ['team:agents'],
        allowUnassignedHuman: true,
        teamStrategies: { 'team:agents': 'least_open' },
        handoffMessage: 'Transferring now.'
      },
      closeConversation: {
        enabled: true,
        instructions: 'Close resolved chats.'
      },
      updateContact: { enabled: false, instructions: '' },
      updateLifecycle: { enabled: false, instructions: '' },
      modifyTags: { enabled: false, instructions: '' },
      addInternalComment: { enabled: false, instructions: '' },
      store: { enabled: false, integrationId: '', instructions: '', maxResults: 5 }
    });
  });

  it('builds one Store capability from the editor state', () => {
    expect(buildAgentCapabilities({
      actionConfig: { store: { enabled: true, integrationId: 'salla-1', instructions: 'Use for products.' } }
    }).store).toEqual({ enabled: true, integrationId: 'salla-1', instructions: 'Use for products.', maxResults: 5 });
  });

  it('sends expectedConfigVersion on update, toggle, and delete requests without raw actionConfig', async () => {
    api.put.mockResolvedValue({ data: { ...loadedAgent, configVersion: 8 } });
    api.delete.mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useAgents());

    await act(async () => {
      await result.current.updateAgent('agent-1', loadedAgent);
    });

    expect(api.put).toHaveBeenCalledWith('/agents/agent-1', expect.objectContaining({
      expectedConfigVersion: 7,
      name: 'Frontend Agent',
    }));
    expect(api.put.mock.calls[0][1]).not.toHaveProperty('tenantId');
    expect(api.put.mock.calls[0][1]).not.toHaveProperty('createdAt');
    expect(api.put.mock.calls[0][1]).not.toHaveProperty('actionConfig');
    expect(api.put).toHaveBeenNthCalledWith(2, '/agents/agent-1/capabilities', {
      expectedConfigVersion: 8,
      capabilities: expect.objectContaining({
        closeConversation: { enabled: true, instructions: 'done' }
      })
    });

    await act(async () => {
      await result.current.toggleAgent({ id: 'agent-1', isActive: true, configVersion: 8 });
    });

    expect(api.put).toHaveBeenLastCalledWith('/agents/agent-1', {
      isActive: false,
      expectedConfigVersion: 8,
    });

    await act(async () => {
      await result.current.deleteAgent({ id: 'agent-1', configVersion: 8 });
    });

    expect(api.delete).toHaveBeenCalledWith('/agents/agent-1', {
      data: { expectedConfigVersion: 8 },
    });
  });

  it('exposes lifecycle toggle errors for the agents screen', async () => {
    api.put.mockRejectedValueOnce({
      response: { data: { error: 'Agent config version is stale' } },
    });
    const { result } = renderHook(() => useAgents());

    await act(async () => {
      await result.current.toggleAgent({ id: 'agent-1', isActive: true, configVersion: 8 });
    });

    expect(result.current.error).toBe('Agent config version is stale');
  });

  it('clears a previous lifecycle error when delete succeeds', async () => {
    api.put.mockRejectedValueOnce({
      response: { data: { error: 'Agent config version is stale' } },
    });
    api.delete.mockResolvedValueOnce({ data: { success: true } });
    const { result } = renderHook(() => useAgents());

    await act(async () => {
      await result.current.toggleAgent({ id: 'agent-1', isActive: true, configVersion: 8 });
    });
    expect(result.current.error).toBe('Agent config version is stale');

    await act(async () => {
      await result.current.deleteAgent({ id: 'agent-1', configVersion: 8 });
    });

    expect(result.current.error).toBeNull();
  });
});
