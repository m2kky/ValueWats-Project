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
});
