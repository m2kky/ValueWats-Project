const axios = require('axios');

class EmbeddingService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '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';
    this.baseURL = 'https://openrouter.ai/api/v1';
    // Using Qwen3 Embedding 8B for massive 32K Context and half the price. Forcing 768 dimensions for Prisma.
    this.model = 'qwen/qwen3-embedding-8b';
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {number[]} - 768-dimensional vector
   */
  async generateEmbedding(text) {
    try {
      const response = await axios.post(`${this.baseURL}/embeddings`, {
        model: this.model,
        input: text,
        dimensions: 768
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error.response?.data || error.message);
      throw error;
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

  /**
   * Check if OpenRouter is available
   */
  async healthCheck() {
    try {
      // Just a simple ping to OpenRouter models endpoint to verify network
      await axios.get(`${this.baseURL}/models`);
      return { available: true, modelLoaded: true, models: [this.model] };
    } catch (error) {
      return { available: false, modelLoaded: false, error: error.message };
    }
  }
}

module.exports = new EmbeddingService();
