const axios = require('axios');

class DeepseekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  async chat({ messages, temperature = 0.7, max_tokens = 500, model = 'deepseek-chat', tools = null, tool_choice = null }) {
    try {
      if (!this.apiKey) {
        throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
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
            'Content-Type': 'application/json'
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

// Re-applying user's exact structure for class but with corrections
// User said:
/*
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = 'https://api.deepseek.com/v1';
  }
  ...
  await axios.post(`${this.baseURL}/chat/completions`, ...)
*/

const service = new DeepseekService();
service.baseURL = 'https://api.deepseek.com/v1'; // Explicitly setting it as requested
// Actually I'll just rewrite the class correctly.

module.exports = new DeepseekService();
