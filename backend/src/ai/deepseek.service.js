const axios = require('axios');
const {
  DEFAULT_CHAT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  buildChatModelChain
} = require('./modelPolicy');

class DeepseekService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  }

  async chat({ messages, temperature = DEFAULT_TEMPERATURE, max_tokens = DEFAULT_MAX_TOKENS, model = DEFAULT_CHAT_MODEL, tools = null, tool_choice = null }) {
    const startedAt = Date.now();
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }

    const models = buildChatModelChain(model);
    let lastError;
    for (const selectedModel of models) {
      const body = {
        model: selectedModel,
        messages,
        temperature,
        max_tokens,
        reasoning: { effort: 'none' },
        provider: { sort: 'latency' }
      };

      if (tools) body.tools = tools;
      if (tool_choice) body.tool_choice = tool_choice;

      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          body,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.APP_URL || 'https://valuechat.app',
              'X-Title': 'ValueChat'
            },
            timeout: 45_000
          }
        );

        console.log(
          `[OpenRouter] Chat completed in ${Date.now() - startedAt}ms`
          + ` model=${selectedModel} provider=${response.data.provider || 'unknown'}`
        );
        return response.data.choices[0].message;
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const canFallback = selectedModel !== models.at(-1)
          && (status == null || status === 404 || status === 408 || status === 429 || status >= 500);
        if (!canFallback) break;
        console.warn(`[OpenRouter] ${selectedModel} unavailable; retrying with ${models.at(-1)}`);
      }
    }

    console.error('[DeepseekService] Error:', lastError?.response?.data || lastError?.message);
    throw lastError;
  }
}

module.exports = new DeepseekService();
