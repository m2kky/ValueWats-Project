const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';

class EmbeddingService {
  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {number[]} - 768-dimensional vector
   */
  async generateEmbedding(text) {
    try {
      const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
        model: EMBEDDING_MODEL,
        prompt: text
      });

      return response.data.embedding;
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error.message);
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
   * Check if Ollama is available and model is loaded
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${OLLAMA_URL}/api/tags`);
      const models = response.data.models || [];
      const hasModel = models.some(m => m.name.includes(EMBEDDING_MODEL));
      return { available: true, modelLoaded: hasModel, models: models.map(m => m.name) };
    } catch (error) {
      return { available: false, modelLoaded: false, error: error.message };
    }
  }
}

module.exports = new EmbeddingService();
