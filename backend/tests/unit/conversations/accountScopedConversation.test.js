const databasePath = require.resolve('../../../src/config/database');
const chatServicePath = require.resolve('../../../src/services/chat.service');
const originalDatabase = require(databasePath);

describe('account-scoped conversation identity', () => {
  afterEach(() => {
    delete require.cache[chatServicePath];
    require.cache[databasePath] = {
      id: databasePath,
      filename: databasePath,
      loaded: true,
      exports: originalDatabase
    };
  });

  it('uses Instance identity so the same external user can contact two Pages safely', async () => {
    const prisma = {
      conversation: {
        upsert: vi.fn(({ create }) => Promise.resolve({ id: `conversation-${create.instanceId}`, ...create }))
      }
    };
    require.cache[databasePath] = {
      id: databasePath,
      filename: databasePath,
      loaded: true,
      exports: prisma
    };
    delete require.cache[chatServicePath];
    const chatService = require(chatServicePath);

    const first = await chatService.upsertConversation('tenant-1', 'user-1', {
      instanceId: 'page-greens',
      channelType: 'messenger',
      content: 'Hello Greens'
    });
    const second = await chatService.upsertConversation('tenant-1', 'user-1', {
      instanceId: 'page-nasa',
      channelType: 'messenger',
      content: 'Hello NASA'
    });

    expect(first.id).not.toBe(second.id);
    expect(prisma.conversation.upsert.mock.calls.map(([request]) => request.where)).toEqual([
      {
        tenantId_instanceId_contactNumber_channelType: {
          tenantId: 'tenant-1',
          instanceId: 'page-greens',
          contactNumber: 'user-1',
          channelType: 'messenger'
        }
      },
      {
        tenantId_instanceId_contactNumber_channelType: {
          tenantId: 'tenant-1',
          instanceId: 'page-nasa',
          contactNumber: 'user-1',
          channelType: 'messenger'
        }
      }
    ]);
  });

  it('rejects Messenger or Instagram ingestion without a resolved Instance', async () => {
    const prisma = { conversation: { upsert: vi.fn() } };
    require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: prisma };
    delete require.cache[chatServicePath];
    const chatService = require(chatServicePath);

    await expect(chatService.upsertConversation('tenant-1', 'user-1', {
      channelType: 'instagram',
      content: 'Hello'
    })).rejects.toMatchObject({ code: 'CONVERSATION_INSTANCE_REQUIRED' });
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
  });

  it('reads connected-account metadata directly from Conversation identity', async () => {
    const prisma = {
      conversation: {
        findMany: vi.fn().mockResolvedValue([{
          id: 'conversation-1',
          contactNumber: 'user-1',
          instance: { id: 'page-greens', instanceName: 'Greens Facebook' },
          messages: []
        }])
      }
    };
    require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: prisma };
    delete require.cache[chatServicePath];
    const chatService = require(chatServicePath);

    const [conversation] = await chatService.getConversations('tenant-1');

    expect(conversation.instanceName).toBe('Greens Facebook');
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        instance: { select: { id: true, instanceName: true, channelType: true } }
      })
    }));
  });
});
