const axios = require('axios');

describe('embedding service', () => {
  it('generates 768-dimensional embeddings through OpenRouter', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.test/api/v1';
    const embedding = Array.from({ length: 768 }, (_, index) => index / 768);
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { data: [{ embedding }] }
    });

    vi.resetModules();
    const embeddingService = require('../../../src/services/embeddingService');
    const result = await embeddingService.generateEmbedding('اختبار');

    expect(result).toEqual(embedding);
    expect(post).toHaveBeenCalledWith(
      'https://openrouter.test/api/v1/embeddings',
      {
        model: 'qwen/qwen3-embedding-8b',
        input: 'اختبار',
        dimensions: 768,
        encoding_format: 'float',
        provider: { sort: 'latency' }
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key'
        }),
        timeout: 12_000
      })
    );
  });
});
