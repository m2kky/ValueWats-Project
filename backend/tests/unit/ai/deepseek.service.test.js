const axios = require('axios');

describe('OpenRouter chat gateway', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('prioritizes low latency and disables reasoning for customer replies', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.test/api/v1');
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        provider: 'fast-provider',
        choices: [{ message: { role: 'assistant', content: 'Hello' } }]
      }
    });

    vi.resetModules();
    const gateway = require('../../../src/ai/deepseek.service');
    const result = await gateway.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'qwen/qwen3.5-flash-02-23',
      max_tokens: 250
    });

    expect(result).toEqual({ role: 'assistant', content: 'Hello' });
    expect(post).toHaveBeenCalledWith(
      'https://openrouter.test/api/v1/chat/completions',
      expect.objectContaining({
        model: 'qwen/qwen3.5-flash-02-23',
        reasoning: { effort: 'none' },
        provider: { sort: 'latency' }
      }),
      expect.objectContaining({
        timeout: 45_000
      })
    );
  });

  it('passes structured response format through to OpenRouter', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.test/api/v1');
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        provider: 'fast-provider',
        choices: [{ message: { role: 'assistant', content: '{"action":"skip"}' } }]
      }
    });

    vi.resetModules();
    const gateway = require('../../../src/ai/deepseek.service');
    await gateway.chat({
      messages: [{ role: 'user', content: 'Return JSON' }],
      response_format: { type: 'json_object' }
    });

    expect(post.mock.calls[0][1]).toEqual(expect.objectContaining({
      response_format: { type: 'json_object' }
    }));
  });

  it('falls back once to DeepSeek V3.2 when the global default provider is unavailable', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.test/api/v1');
    const unavailable = Object.assign(new Error('provider unavailable'), { response: { status: 503 } });
    const post = vi.spyOn(axios, 'post')
      .mockRejectedValueOnce(unavailable)
      .mockResolvedValueOnce({
        data: {
          provider: 'fallback-provider',
          choices: [{ message: { role: 'assistant', content: 'Fallback reply' } }]
        }
      });

    vi.resetModules();
    const gateway = require('../../../src/ai/deepseek.service');
    const result = await gateway.chat({ messages: [{ role: 'user', content: 'Hi' }] });

    expect(result.content).toBe('Fallback reply');
    expect(post.mock.calls.map((call) => call[1].model)).toEqual([
      'qwen/qwen3.5-flash-02-23',
      'deepseek/deepseek-v3.2'
    ]);
  });

  it('requires provider support for strict structured responses', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.test/api/v1');
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { choices: [{ message: { role: 'assistant', content: '{"action":"skip"}' } }] }
    });
    const gateway = require('../../../src/ai/deepseek.service');
    const format = { type: 'json_schema', json_schema: {
      name: 'test_decision', strict: true,
      schema: { type: 'object', properties: { action: { type: 'string' } }, required: ['action'], additionalProperties: false }
    } };
    await gateway.chat({ messages: [{ role: 'user', content: 'Return a decision' }], response_format: format });
    expect(post.mock.calls[0][1]).toMatchObject({
      response_format: format, provider: { sort: 'latency', require_parameters: true }
    });
  });

  it('omits unsupported reasoning parameters from strict GPT-4o requests', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { choices: [{ message: { role: 'assistant', content: '{}' } }] }
    });
    const gateway = require('../../../src/ai/deepseek.service');
    await gateway.chat({
      model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content: 'Return a decision' }],
      response_format: { type: 'json_schema', json_schema: { name: 'decision', strict: true, schema: {
        type: 'object', properties: {}, required: [], additionalProperties: false
      } } }
    });
    expect(post.mock.calls[0][1]).not.toHaveProperty('reasoning');
    expect(post.mock.calls[0][1].provider.require_parameters).toBe(true);
  });
});
