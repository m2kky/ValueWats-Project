const OpenAI = require('openai');

class AIService {
  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  /**
   * Generates a response using DeepSeek Chat
   * @param {string} prompt - The user's message
   * @param {string} systemContent - System instruction
   * @returns {Promise<string>}
   */
  async generateResponse(prompt, systemContent = 'You are a helpful assistant.') {
    try {
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured');
      }

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: prompt }
        ],
        model: "deepseek-chat",
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error; // Propagate error for handling in controller
    }
  }
}

// Singleton instance
const aiService = new AIService();

module.exports = aiService;
