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
});
