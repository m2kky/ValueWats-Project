const toolService = require('../../../src/services/toolService');
const { createAgentService } = require('../../../src/agents/agent.service');

const canonicalStoreAction = {
  id: 'action-1',
  key: 'store_catalog_read',
  type: 'store_catalog_read',
  isEnabled: true,
  integrationId: 'store-1',
  instructions: 'Use for product facts.',
  config: { maxResults: 5 }
};

describe('Store tool runtime', () => {
  it('preserves legacy non-Store tool definitions', () => {
    const tools = toolService.getToolDefinitions({
      google_calendar_read: { enabled: true }
    });

    expect(tools.map((tool) => tool.function.name)).toEqual(['get_calendar_events']);
  });

  it('exposes Store tools only for one enabled canonical Store capability', () => {
    const tools = toolService.getToolDefinitions({
      actionConfig: {},
      actions: [canonicalStoreAction]
    });

    expect(tools.map((tool) => tool.function.name)).toEqual([
      'search_store_products',
      'get_store_product'
    ]);
  });

  it('runs tool calls through the shared loop with canonical context', async () => {
    const modelGateway = {
      chat: vi.fn()
        .mockResolvedValueOnce({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call-1',
            function: { name: 'search_store_products', arguments: '{"query":"greens"}' }
          }]
        })
        .mockResolvedValueOnce({ role: 'assistant', content: 'Two products are available.' })
    };
    const runtimeTools = {
      getToolDefinitions: vi.fn().mockReturnValue([{ type: 'function', function: { name: 'search_store_products' } }]),
      execute: vi.fn().mockResolvedValue({ success: true, products: [] })
    };
    const service = createAgentService({ modelGateway, toolService: runtimeTools });
    const agent = {
      id: 'agent-1',
      actionConfig: { google_calendar_read: { enabled: true } },
      actions: [canonicalStoreAction],
      aiModel: 'deepseek-chat',
      temperature: 0.2,
      maxTokens: 300
    };
    const messages = [{ role: 'user', content: 'Do you have greens?' }];

    await expect(service.runModelToolLoop({
      agent,
      messages,
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      allowCommands: true
    })).resolves.toBe('Two products are available.');

    expect(runtimeTools.getToolDefinitions).toHaveBeenCalledWith({
      actionConfig: agent.actionConfig,
      actions: agent.actions
    });
    expect(runtimeTools.execute).toHaveBeenCalledWith(
      'search_store_products',
      { query: 'greens' },
      {
        tenantId: 'tenant-1',
        conversationId: 'conversation-1',
        agentId: 'agent-1',
        actionConfig: agent.actionConfig,
        actions: agent.actions
      }
    );
    expect(messages).toHaveLength(4);
    expect(messages[2]).toMatchObject({ role: 'tool', tool_call_id: 'call-1' });
  });

  it('recovers when the model prints a pseudo tool directive instead of calling a tool', async () => {
    const modelGateway = {
      chat: vi.fn()
        .mockResolvedValueOnce({
          role: 'assistant',
          content: 'Let me check. [QUERY: sourceId="greens-product-master", query=""]'
        })
        .mockResolvedValueOnce({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call-1',
            function: {
              name: 'query_google_sheet_source',
              arguments: '{"sourceId":"greens-product-master","query":""}'
            }
          }]
        })
        .mockResolvedValueOnce({ role: 'assistant', content: 'Nine products are registered.' })
    };
    const runtimeTools = {
      getToolDefinitions: vi.fn().mockReturnValue([{
        type: 'function',
        function: { name: 'query_google_sheet_source' }
      }]),
      execute: vi.fn().mockResolvedValue({ success: true, rows: [] })
    };
    const service = createAgentService({ modelGateway, toolService: runtimeTools });

    await expect(service.runModelToolLoop({
      agent: {
        id: 'agent-1',
        actionConfig: {},
        actions: [],
        aiModel: 'qwen/qwen3.5-flash-02-23',
        temperature: 0.2,
        maxTokens: 300
      },
      messages: [{ role: 'user', content: 'What products do you have?' }],
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      allowCommands: true
    })).resolves.toBe('Nine products are registered.');

    expect(modelGateway.chat).toHaveBeenCalledTimes(3);
    expect(modelGateway.chat.mock.calls[1][0]).toMatchObject({
      tool_choice: {
        type: 'function',
        function: { name: 'query_google_sheet_source' }
      }
    });
    expect(runtimeTools.execute).toHaveBeenCalledWith(
      'query_google_sheet_source',
      { sourceId: 'greens-product-master', query: '' },
      expect.any(Object)
    );
  });

  it('preserves the maximum of five model/tool iterations', async () => {
    const response = {
      role: 'assistant',
      content: null,
      tool_calls: [{ id: 'call-1', function: { name: 'search_store_products', arguments: '{"query":"x"}' } }]
    };
    const modelGateway = { chat: vi.fn().mockResolvedValue(response) };
    const runtimeTools = {
      getToolDefinitions: vi.fn().mockReturnValue([]),
      execute: vi.fn().mockResolvedValue({ success: true, products: [] })
    };
    const service = createAgentService({ modelGateway, toolService: runtimeTools });

    await expect(service.runModelToolLoop({
      agent: { id: 'agent-1', actions: [] },
      messages: [],
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      allowCommands: true
    })).resolves.toBe('');

    expect(modelGateway.chat).toHaveBeenCalledTimes(5);
    expect(runtimeTools.execute).toHaveBeenCalledTimes(5);
  });

  it('allows only read-only canonical Store tools and removes command tags in preview', async () => {
    const modelGateway = {
      chat: vi.fn()
        .mockResolvedValueOnce({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'mutation-1',
            function: { name: 'send_email', arguments: '{"to":"customer@example.test"}' }
          }]
        })
        .mockResolvedValueOnce({
          role: 'assistant',
          content: 'Preview reply [ACTION: CLOSE_CONVERSATION]'
        })
    };
    const runtimeTools = {
      getToolDefinitions: vi.fn().mockReturnValue([{
        type: 'function',
        function: { name: 'search_store_products' }
      }]),
      execute: vi.fn()
    };
    const service = createAgentService({ modelGateway, toolService: runtimeTools });
    const agent = {
      id: 'agent-1',
      actionConfig: { closeConversation: { enabled: true } },
      actions: [canonicalStoreAction]
    };

    await expect(service.runModelToolLoop({
      agent,
      messages: [],
      tenantId: 'tenant-1',
      conversationId: null,
      allowCommands: false
    })).resolves.toBe('Preview reply');

    expect(runtimeTools.getToolDefinitions).toHaveBeenCalledWith({
      actionConfig: {},
      actions: agent.actions
    });
    expect(runtimeTools.execute).not.toHaveBeenCalled();
    expect(modelGateway.chat).toHaveBeenCalledTimes(2);
  });
});
