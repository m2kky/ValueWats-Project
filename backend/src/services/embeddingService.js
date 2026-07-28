const axios = require('axios');

class EmbeddingService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = 'qwen/qwen3-embedding-8b';
    // OpenRouter is asked to produce exactly 768 dimensions, matching pgvector(768).
    this.dimensions = 768;
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {number[]} - 768-dimensional vector
   */
  async generateEmbedding(text) {
    const startedAt = Date.now();
    try {
      if (!this.apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables');
      }

      const response = await axios.post(`${this.baseURL}/embeddings`, {
        model: this.model,
        input: text,
        dimensions: this.dimensions,
        encoding_format: 'float',
        provider: { sort: 'latency' }
      }, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://valuewats.com',
          'X-Title': 'ValueWats'
        },
        timeout: 12_000
      });

      const embedding = response.data?.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from OpenRouter');
      }
      if (embedding.length !== this.dimensions || embedding.some((value) => !Number.isFinite(value))) {
        throw new Error(`Invalid embedding dimensions: expected ${this.dimensions}, received ${embedding.length}`);
      }

      console.log(
        `[OpenRouter] Embedding completed in ${Date.now() - startedAt}ms`
        + ` model=${this.model} provider=${response.data.provider || 'unknown'}`
      );
      return embedding;
    } catch (error) {
      const detail = error.response?.data || error.message;
      console.error('[EmbeddingService] OpenRouter error:', detail);
      throw new Error(`Embedding failed: ${JSON.stringify(detail)}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {string[]} texts - Array of texts
   * @returns {number[][]} - Array of 768-dimensional vectors
   */
  async generateEmbeddings(texts) {
    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }

}

module.exports = new EmbeddingService();
