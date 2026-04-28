const OpenAI = require('openai');

class AIService {
  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "https://valuewats.com", // Optional
        "X-Title": "ValueWats", // Optional
      }
    });
  }

  /**
   * Generates a response using OpenRouter (Qwen)
   * @param {string} prompt - The user's message
   * @param {string} systemContent - System instruction
   * @returns {Promise<string>}
   */
  async generateResponse(prompt, systemContent = 'You are a helpful assistant.') {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('OPENROUTER_API_KEY is not configured. Using fallback response.');
        return "شكراً لرسالتك! سنقوم بالرد عليك في أقرب وقت ممكن.";
      }

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: prompt }
        ],
        model: "qwen/qwen3.5-flash-02-23",
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
