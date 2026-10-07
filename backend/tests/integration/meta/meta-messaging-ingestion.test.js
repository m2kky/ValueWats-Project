const modulePaths = {
  prisma: require.resolve('../../../src/config/database'),
  chatService: require.resolve('../../../src/services/chat.service'),
  agentService: require.resolve('../../../src/agents/agent.service'),
  metaApi: require.resolve('../../../src/services/metaApi'),
  socketService: require.resolve('../../../src/services/socketService')
};
const controllerPath = require.resolve('../../../src/controllers/metaWebhookController');
const originalModules = new Map();

function inbound(mid, text = 'Customer question') {
  return {
    sender: { id: 'customer-1' }, recipient: { id: 'instagram-account-1' },
    message: { mid, text }
  };
}

function createFixture() {
  const instance = {
    id: 'instance-ig', tenantId: 'tenant-1', channelType: 'instagram',
    phoneNumberId: 'instagram-account-1', primaryAgentId: 'agent-1', accessToken: 'do-not-log-token'
  };
  const conversation = {
    id: 'conversation-1', instanceId: instance.id, currentAgentId: 'agent-1',
    assignedUserId: null, aiEnabled: true, escalated: false
  };
  const dependencies = {
    prisma: {
      instance: { findFirst: vi.fn().mockResolvedValue(instance) },
      conversation: { findFirst: vi.fn().mockImplementation(async () => ({ ...conversation })) },
      tenant: { findUnique: vi.fn().mockResolvedValue({ optoutEnabled: false }) },
      automationRule: { findMany: vi.fn().mockResolvedValue([]) },
      chatMessage: { create: vi.fn().mockResolvedValue({ id: 'outgoing-1' }) }
    },
    chatService: {
      upsertConversation: vi.fn().mockImplementation(async () => ({ ...conversation })),
      saveMessage: vi.fn().mockImplementation(async (id, message) => ({ id: `stored-${message.wamid}` }))
    },
    agentService: {
      assignDefaultAgent: vi.fn().mockImplementation(async () => {
        Object.assign(conversation, { currentAgentId: instance.primaryAgentId, aiEnabled: true, escalated: false });
        return { id: instance.primaryAgentId };
      }),
      processMessage: vi.fn().mockResolvedValue({ response: 'Agent answer' })
    },
    metaApi: {
      getUserProfile: vi.fn().mockResolvedValue({ name: 'Customer' }),
      sendMetaMessage: vi.fn().mockResolvedValue({ message_id: 'sent-1' })
    },
    socketService: { emitChatMessage: vi.fn() }
  };
  for (const [name, path] of Object.entries(modulePaths)) {
    originalModules.set(path, require.cache[path]);
    require.cache[path] = { id: path, filename: path, loaded: true, exports: dependencies[name] };
  }
  delete require.cache[controllerPath];
  const { handleMetaWebhook } = require(controllerPath);
  const handle = async (messaging) => {
    const res = { sendStatus: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    await handleMetaWebhook({
      metaWebhookVerified: true,
      body: { object: 'instagram', entry: [{ id: instance.phoneNumberId, messaging }] }
    }, res);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  };
  return { ...dependencies, instance, conversation, handle };
}

describe('Instagram DM ingestion', () => {
  let fixture;
  let log;
  let errorLog;

  beforeEach(() => {
    log = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    fixture = createFixture();
  });

  afterEach(() => {
    delete require.cache[controllerPath];
    for (const [path, module] of originalModules) {
      if (module) require.cache[path] = module;
      else delete require.cache[path];
    }
    originalModules.clear();
    vi.restoreAllMocks();
  });

  it('routes a normal Instagram DM through its own channel to an Agent reply', async () => {
    await fixture.handle([inbound('dm-1')]);
    expect(fixture.chatService.upsertConversation).toHaveBeenCalledWith('tenant-1', 'customer-1', expect.objectContaining({
      instanceId: 'instance-ig', channelType: 'instagram'
    }));
    expect(fixture.agentService.processMessage).toHaveBeenCalledWith(expect.objectContaining({ inboundMessageId: 'stored-dm-1' }));
    expect(fixture.metaApi.sendMetaMessage).toHaveBeenCalledWith(fixture.instance, 'customer-1', 'Agent answer');
    expect(fixture.chatService.saveMessage).toHaveBeenCalledWith('conversation-1', expect.objectContaining({ channelType: 'instagram' }));
    expect(fixture.prisma.chatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ channelType: 'instagram' })
    }));
  });

  it.each([true, false])('automatically assigns the channel Primary Agent to an unassigned DM with aiEnabled=%s', async (aiEnabled) => {
    Object.assign(fixture.conversation, { currentAgentId: null, aiEnabled });
    await fixture.handle([inbound('dm-1')]);
    expect(fixture.agentService.assignDefaultAgent).toHaveBeenCalledWith('conversation-1', 'tenant-1');
    expect(fixture.prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: { id: 'conversation-1', tenantId: 'tenant-1' }
    });
    expect(fixture.metaApi.sendMetaMessage).toHaveBeenCalledWith(fixture.instance, 'customer-1', 'Agent answer');
    expect(fixture.socketService.emitChatMessage).toHaveBeenCalledWith('tenant-1', 'chat:message_received', expect.objectContaining({
      conversation: expect.objectContaining({ currentAgentId: 'agent-1', aiEnabled: true })
    }));
  });

  it.each([
    { assignedUserId: 'human-1', escalated: false },
    { assignedUserId: 'human-1', escalated: false, aiEnabled: true },
    { assignedUserId: null, escalated: true }
  ])('keeps a human-owned or escalated conversation out of automatic AI assignment %#', async (state) => {
    Object.assign(fixture.conversation, { currentAgentId: null, aiEnabled: false, ...state });
    await fixture.handle([inbound('dm-1')]);
    expect(fixture.agentService.assignDefaultAgent).not.toHaveBeenCalled();
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
  });

  it('does not enable an unassigned conversation when the channel has no Primary Agent', async () => {
    fixture.instance.primaryAgentId = null;
    Object.assign(fixture.conversation, { currentAgentId: null, aiEnabled: false });
    await fixture.handle([inbound('dm-1')]);
    expect(fixture.agentService.assignDefaultAgent).not.toHaveBeenCalled();
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
  });

  it('respects a human handoff that happens during automatic default assignment', async () => {
    Object.assign(fixture.conversation, { currentAgentId: null, aiEnabled: true });
    fixture.agentService.assignDefaultAgent.mockImplementation(async () => {
      Object.assign(fixture.conversation, { assignedUserId: 'human-1', escalated: true, aiEnabled: false });
      return null;
    });
    await fixture.handle([inbound('dm-1')]);
    expect(fixture.agentService.processMessage).not.toHaveBeenCalled();
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
  });

  it('reloads ownership after a concurrent assignment conflict without losing the saved DM', async () => {
    Object.assign(fixture.conversation, { currentAgentId: null });
    fixture.agentService.assignDefaultAgent.mockImplementation(async () => {
      Object.assign(fixture.conversation, { assignedUserId: 'human-1', aiEnabled: false, escalated: true });
      throw Object.assign(new Error('Ownership changed'), { code: 'OWNERSHIP_STALE' });
    });
    await fixture.handle([inbound('dm-1')]);
    expect(fixture.chatService.saveMessage).toHaveBeenCalledTimes(1);
    expect(fixture.agentService.processMessage).not.toHaveBeenCalled();
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('does not lose a DM when a read receipt appears first in the same webhook', async () => {
    await fixture.handle([
      { sender: { id: 'customer-1' }, recipient: { id: 'instagram-account-1' }, read: { mid: 'previous-1' } },
      inbound('dm-1')
    ]);
    expect(fixture.metaApi.sendMetaMessage).toHaveBeenCalledTimes(1);
    expect(fixture.chatService.saveMessage).toHaveBeenCalledWith('conversation-1', expect.objectContaining({ wamid: 'dm-1' }));
  });

  it('processes every inbound DM in a batched webhook in order', async () => {
    await fixture.handle([inbound('dm-1', 'First question'), inbound('dm-2', 'Second question')]);
    expect(fixture.agentService.processMessage.mock.calls.map(([input]) => input.message)).toEqual(['First question', 'Second question']);
    expect(fixture.metaApi.sendMetaMessage).toHaveBeenCalledTimes(2);
  });

  it('continues processing the next DM when an earlier delivery fails', async () => {
    fixture.metaApi.sendMetaMessage.mockRejectedValueOnce(new Error('Provider unavailable'));
    await fixture.handle([inbound('dm-1'), inbound('dm-2')]);
    expect(fixture.agentService.processMessage).toHaveBeenCalledTimes(2);
    expect(fixture.metaApi.sendMetaMessage).toHaveBeenCalledTimes(2);
    expect(fixture.prisma.chatMessage.create).toHaveBeenCalledTimes(1);
    expect(errorLog).toHaveBeenCalled();
  });

  it.each([
    [{ aiEnabled: false, escalated: false }, 'ai_disabled'],
    [{ aiEnabled: true, escalated: true }, 'conversation_escalated']
  ])('reports why a received DM is blocked without changing its conversation settings %#', async (state, reasonCode) => {
    Object.assign(fixture.conversation, state);
    await fixture.handle([inbound('dm-1', 'private customer message')]);
    expect(fixture.agentService.processMessage).not.toHaveBeenCalled();
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('[MetaWebhook] Message reply skipped:', expect.objectContaining({
      channelType: 'instagram', instanceId: 'instance-ig', conversationId: 'conversation-1', reasonCode
    }));
    const output = JSON.stringify(log.mock.calls);
    expect(output).not.toContain('private customer message');
    expect(output).not.toContain('do-not-log-token');
  });

  it('reports when the Agent returns no reply instead of silently stopping', async () => {
    fixture.agentService.processMessage.mockResolvedValue(null);
    await fixture.handle([inbound('dm-1')]);
    expect(log).toHaveBeenCalledWith('[MetaWebhook] Message reply skipped:', expect.objectContaining({
      reasonCode: 'no_agent_response', primaryAgentId: 'agent-1'
    }));
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
  });

  it('keeps human handoff commands terminal and identifies them in diagnostics', async () => {
    fixture.agentService.processMessage.mockResolvedValue({ response: '', terminalCommand: 'assign_conversation' });
    await fixture.handle([inbound('dm-1')]);
    expect(log).toHaveBeenCalledWith('[MetaWebhook] Message reply skipped:', expect.objectContaining({
      reasonCode: 'terminal_command', terminalCommand: 'assign_conversation'
    }));
    expect(fixture.metaApi.sendMetaMessage).not.toHaveBeenCalled();
  });

  it('reports an unresolved connected account without logging the webhook text', async () => {
    fixture.prisma.instance.findFirst.mockResolvedValue(null);
    await fixture.handle([inbound('dm-1', 'private customer message')]);
    expect(log).toHaveBeenCalledWith('[MetaWebhook] Message reply skipped:', expect.objectContaining({
      channelType: 'instagram', reasonCode: 'instance_not_found'
    }));
    expect(fixture.chatService.saveMessage).not.toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain('private customer message');
  });
});
