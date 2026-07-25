import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgents, { buildAgentSetupPayload } from '../useAgents';
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
  });

  it('sends expectedConfigVersion on update and toggle requests', async () => {
    api.put.mockResolvedValue({ data: { ...loadedAgent, configVersion: 8 } });
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

    await act(async () => {
      await result.current.toggleAgent({ id: 'agent-1', isActive: true, configVersion: 8 });
    });

    expect(api.put).toHaveBeenLastCalledWith('/agents/agent-1', {
      isActive: false,
      expectedConfigVersion: 8,
    });
  });
});
