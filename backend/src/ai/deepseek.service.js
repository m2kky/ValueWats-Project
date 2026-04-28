const axios = require('axios');

class DeepseekService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  }

  async chat({ messages, temperature = 0.7, max_tokens = 500, model = 'qwen/qwen3.5-flash-02-23', tools = null, tool_choice = null }) {
    try {
      if (!this.apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables');
      }

      const body = {
        model,
        messages,
        temperature,
        max_tokens
      };

      if (tools) body.tools = tools;
      if (tool_choice) body.tool_choice = tool_choice;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        body,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://valuechat.app',
            'X-Title': 'ValueChat'
          }
        }
      );

      return response.data.choices[0].message;
    } catch (error) {
      console.error('[DeepseekService] Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new DeepseekService();
