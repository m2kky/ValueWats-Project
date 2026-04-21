const axios = require('axios');

class EmbeddingService {
  constructor() {
    // Ollama is running on the same VPS. Use its direct port (11434) to bypass
    // Open WebUI's auth proxy. The sslip.io URL routes through Open WebUI which requires login.
    this.baseURL = process.env.OLLAMA_URL || 'http://72.62.50.238:11434';
    // nomic-embed-text produces exactly 768 dimensions — matches our pgvector(768) schema.
    this.model = 'nomic-embed-text';
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {number[]} - 768-dimensional vector
   */
  async generateEmbedding(text) {
    try {
      const response = await axios.post(`${this.baseURL}/api/embeddings`, {
        model: this.model,
        prompt: text
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60s — local model may take time on first call
      });

      const embedding = response.data.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from Ollama');
      }

      return embedding;
    } catch (error) {
      const detail = error.response?.data || error.message;
      console.error('[EmbeddingService] Ollama error:', detail);
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

  /**
   * Health check — verify Ollama is reachable and model is loaded
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 10000 });
      const models = response.data.models || [];
      const modelLoaded = models.some(m => m.name.startsWith('nomic-embed-text'));
      return {
        available: true,
        modelLoaded,
        models: models.map(m => m.name)
      };
    } catch (error) {
      return { available: false, modelLoaded: false, error: error.message };
    }
  }
}

module.exports = new EmbeddingService();
